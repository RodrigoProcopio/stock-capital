// netlify/functions/send-contact-to-pipefy.js
// Cria card de contato no Pipefy + carimbo LGPD (TS/IP/UA/versão/clientTS)

const PIPE_ID = Number(process.env.PIPEFY_PIPE_ID_CONTACT || process.env.PIPEFY_PIPE_ID);
const TOKEN   = process.env.PIPEFY_TOKEN;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// normalizador simples p/ labels
function norm(s) {
  return String(s || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// busca os campos do start form e resolve IDs pelos labels
async function fetchStartFormFieldIdsByLabel() {
  const query = `
    query ($id: ID!) {
      pipe(id: $id) {
        id
        name
        start_form_fields { id label type }
      }
    }`;

  const res = await fetch("https://api.pipefy.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({ query, variables: { id: PIPE_ID } }),
  });

  const json = await res.json();
  if (json.errors) throw new Error(json.errors.map(e => e.message).join(" | "));

  const fields = json?.data?.pipe?.start_form_fields || [];
  const table  = new Map(fields.map(f => [norm(f.label), f.id]));

  const ids = {
    // ajuste os labels abaixo se no seu Pipe estiverem diferentes
    nome:     table.get(norm("Nome")),
    telefone: table.get(norm("Telefone")) || fields.find(f => /telef|whats/i.test(f.id))?.id || null,
    email:    table.get(norm("E-mail"))   || table.get(norm("Email")) || fields.find(f => /email/i.test(f.id))?.id || null,
    mensagem: table.get(norm("Mensagem")) || fields.find(f => /mensag|descri/i.test(f.id))?.id || null,

    // LGPD / Consentimento (opcionais; se não existirem, são ignorados)
    consent_ts:             table.get(norm("Consent TS")),
    consent_ip:             table.get(norm("Consent IP")),
    consent_ua:             table.get(norm("Consent UA")),
    consent_policy_version: table.get(norm("Consent Policy Version")),
    consent_client_ts:      table.get(norm("Consent Client TS")),
    form_id:                table.get(norm("Form ID")),
  };

  return { ids, fields };
}

function getIpFromHeaders(headers = {}) {
  const h = headers || {};
  const v =
    h["x-forwarded-for"] ||
    h["X-Forwarded-For"] ||
    h["x-real-ip"] ||
    h["X-Real-IP"] ||
    h["client-ip"] ||
    h["Client-IP"] ||
    "";
  if (!v) return "unknown";
  const first = String(v).split(",")[0].trim();
  return first || "unknown";
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: CORS, body: "" };
  if (event.httpMethod !== "POST")    return { statusCode: 405, headers: CORS, body: "Method Not Allowed" };

  try {
    if (!PIPE_ID || !TOKEN) {
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "PIPEFY_PIPE_ID/PIPEFY_TOKEN não configurados" }) };
    }

    const body = JSON.parse(event.body || "{}");
    const { nome, telefone, email, mensagem, hp, lgpd = {}, form_id = "Contato" } = body;

    // honeypot
    if (typeof hp === "string" && hp.trim() !== "") {
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true, spam: true }) };
    }

    // obrigatórios
    const missing = [];
    if (!nome || !String(nome).trim())         missing.push("nome");
    if (!telefone || !String(telefone).trim()) missing.push("telefone");
    if (!email || !String(email).trim())       missing.push("email");
    if (!mensagem || !String(mensagem).trim()) missing.push("mensagem");

    if (missing.length) {
      return {
        statusCode: 400,
        headers: CORS,
        body: JSON.stringify({ error: "Campos obrigatórios ausentes.", missing })
      };
    }

    // resolve IDs por label
    const { ids, fields } = await fetchStartFormFieldIdsByLabel();

    // só exigimos os 4 de contato; consent.* são opcionais
    const requiredIds = ["nome", "telefone", "email", "mensagem"];
    const notFound = requiredIds.filter((k) => !ids[k]);

    if (notFound.length) {
      return {
        statusCode: 502,
        headers: CORS,
        body: JSON.stringify({
          error: "Falha ao criar card no Pipefy",
          message: `Fields not found with ids: ${notFound.join(", ")}`,
          detail: { available: fields }
        })
      };
    }

    // carimbo do servidor
    const consentTS = new Date().toISOString();
    const ip = getIpFromHeaders(event.headers);
    const ua = event.headers?.["user-agent"] || event.headers?.["User-Agent"] || "";
    const policyVersion = lgpd.policyVersion || "v1";
    const clientTS = lgpd.consentAtClient || null;

    // monta os atributos
    const fields_attributes = [
      // LGPD (se os campos existirem no Pipe)
      ...(ids.consent_ts ?             [{ field_id: ids.consent_ts,             field_value: consentTS }] : []),
      ...(ids.consent_ip ?             [{ field_id: ids.consent_ip,             field_value: ip }] : []),
      ...(ids.consent_ua ?             [{ field_id: ids.consent_ua,             field_value: ua }] : []),
      ...(ids.consent_policy_version ? [{ field_id: ids.consent_policy_version, field_value: policyVersion }] : []),
      ...(ids.consent_client_ts && clientTS ? [{ field_id: ids.consent_client_ts, field_value: clientTS }] : []),
      ...(ids.form_id ?                [{ field_id: ids.form_id,                field_value: form_id }] : []),

      // dados do contato
      { field_id: ids.nome,     field_value: String(nome) },
      { field_id: ids.telefone, field_value: String(telefone) },
      { field_id: ids.email,    field_value: String(email) },
      { field_id: ids.mensagem, field_value: String(mensagem) },
    ];

    const mutation = `
      mutation ($input: CreateCardInput!) {
        createCard(input: $input) {
          card { id title url }
        }
      }`;

    const variables = {
      input: {
        pipe_id: PIPE_ID,
        title: `Contato • ${String(nome).slice(0,80)}`,
        fields_attributes
      }
    };

    const res = await fetch("https://api.pipefy.com/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify({ query: mutation, variables })
    });

    const text = await res.text();
    let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }

    if (!res.ok || json.errors) {
      return {
        statusCode: 502,
        headers: CORS,
        body: JSON.stringify({
          error: "Falha ao criar card no Pipefy",
          message: Array.isArray(json.errors) ? json.errors.map(e => e.message).join(" | ") : "Erro desconhecido",
          detail: json
        })
      };
    }

    return {
      statusCode: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true, card: json.data.createCard.card })
    };

  } catch (err) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "Erro interno", detail: String(err) }) };
  }
};
