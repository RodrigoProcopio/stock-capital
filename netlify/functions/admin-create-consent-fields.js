// netlify/functions/admin-create-consent-fields.js
// Cria (idempotente) no Start Form do Pipefy os campos de consentimento (TS/IP/UA/versão/TS cliente/Form ID).
// Uso: POST /.netlify/functions/admin-create-consent-fields  com HEADER: x-admin-token: <seu_token>
// Body JSON: { "pipeId": 123456 }  // se omitir, usa env PIPEFY_PIPE_ID

const API = "https://api.pipefy.com/graphql";


const CORS = {
  "Access-Control-Allow-Origin": "*", // ajuste se quiser restringir
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-token",
};

// netlify/functions/admin-create-consent-fields.js
const allowlistFromEnv = () => {
  const raw = (process.env.ADMIN_CORS_ALLOWLIST || process.env.CORS_ALLOWLIST || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return raw;
};

const getAllowedOrigin = (origin, allowlist) =>
  origin && allowlist.includes(origin) ? origin : null;

const buildCorsHeaders = (origin, allowed) => ({
  Vary: "Origin",
  "Access-Control-Allow-Origin": allowed ? origin : "null",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token",
  "Access-Control-Max-Age": "86400",
});

export default async (req, context) => {
  const origin = req.headers.get("origin") || "";
  const allowlist = allowlistFromEnv();
  const isAllowed = !!getAllowedOrigin(origin, allowlist);
  const cors = buildCorsHeaders(origin, isAllowed);

  // Pré-flight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: isAllowed ? 204 : 403, headers: cors });
  }
  if (!isAllowed) {
    return new Response(JSON.stringify({ error: "Origin not allowed" }), {
      status: 403,
      headers: { ...cors, "Content-Type": "application/json; charset=utf-8" },
    });
  }

  // Autenticação administrativa (já existente)
  const token = req.headers.get("x-admin-token") || "";
  if (!token || token !== (process.env.ADMIN_SETUP_TOKEN || "")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...cors, "Content-Type": "application/json; charset=utf-8" },
    });
  }

  // 👉 A PARTIR DAQUI, MANTENHA SUA LÓGICA ATUAL (criação de campos, etc.)
  // const body = await req.json().catch(() => ({}));
  // ... sua implementação ...

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...cors, "Content-Type": "application/json; charset=utf-8" },
  });
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: CORS, body: "" };
  if (event.httpMethod !== "POST")    return { statusCode: 405, headers: CORS, body: "Method Not Allowed" };

  try {
    // --- Segurança: exija um token admin para evitar uso indevido ---
    const ADMIN_TOKEN = process.env.ADMIN_SETUP_TOKEN; // defina no painel da Netlify
    const got = event.headers["x-admin-token"] || event.headers["X-Admin-Token"];
    if (!ADMIN_TOKEN || got !== ADMIN_TOKEN) {
      return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: "Unauthorized" }) };
    }

    const PIPEFY_TOKEN = process.env.PIPEFY_TOKEN;
    if (!PIPEFY_TOKEN) {
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "PIPEFY_TOKEN ausente" }) };
    }

    const body = JSON.parse(event.body || "{}");
    const pipeId = Number(body.pipeId || process.env.PIPEFY_PIPE_ID); // pode vir no body ou do env
    if (!pipeId) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Informe pipeId no body ou PIPEFY_PIPE_ID no ambiente." }) };
    }

    async function gql(query, variables = {}) {
      const r = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${PIPEFY_TOKEN}` },
        body: JSON.stringify({ query, variables }),
      });
      const j = await r.json();
      if (!r.ok || j.errors) {
        throw new Error(JSON.stringify(j.errors || j, null, 2));
      }
      return j.data;
    }

    // 1) Descobrir Start Form (phase) e campos existentes
    const data = await gql(`
      query ($id: ID!) {
        pipe(id: $id) {
          id
          name
          startFormPhaseId
          start_form_fields { id label type }
        }
      }`, { id: pipeId });

    const phaseId = data.pipe?.startFormPhaseId;
    const existing = data.pipe?.start_form_fields || [];
    if (!phaseId) {
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "startFormPhaseId não encontrado para este pipe." }) };
    }

    const existingLabelsLC = new Set(existing.map(f => String(f.label || "").toLowerCase()));
    const desired = [
      { label: "Consent TS",             type: "datetime",   description: "Timestamp do consentimento (server)." },
      { label: "Consent IP",             type: "short_text", description: "IP (pode ser mascarado)." },
      { label: "Consent UA",             type: "long_text",  description: "User-Agent do navegador." },
      { label: "Consent Policy Version", type: "short_text", description: "Versão da política de privacidade." },
      { label: "Consent Client TS",      type: "datetime",   description: "Timestamp do cliente (opcional, informativo)." },
      { label: "Form ID",                type: "short_text", description: "Identificador lógico da origem do formulário." },
    ];

    const createMutation = `
      mutation ($input: CreatePhaseFieldInput!) {
        createPhaseField(input: $input) {
          phase_field { id label type }
        }
      }`;

    const created = [];
    const skipped = [];

    for (const f of desired) {
      const exists = existingLabelsLC.has(String(f.label).toLowerCase());
      if (exists) { skipped.push(f.label); continue; }

      const input = {
        phase_id: phaseId,
        label: f.label,
        type: f.type,        // ex.: short_text | long_text | date | datetime | ...
        description: f.description || "",
        // required: false, // (opcional) geralmente deixamos não obrigatório
      };

      const resp = await gql(createMutation, { input });
      const pf = resp?.createPhaseField?.phase_field;
      if (pf?.id) created.push({ id: pf.id, label: pf.label, type: pf.type });
    }

    return {
      statusCode: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: true,
        pipeId,
        phaseId,
        created,
        skipped,              // já existiam
        hint: "Campos criados/garantidos no Start Form. Ajuste o backend para enviar por 'label' ou mapeie IDs.",
      }),
    };

  } catch (err) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "Erro interno", detail: String(err) }) };
  }
};
