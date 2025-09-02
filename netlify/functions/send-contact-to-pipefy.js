// netlify/functions/send-contact-to-pipefy.js
// Padrão de respostas alinhado ao seu send-to-pipefy.js
// Agora com CONSENTIMENTO server-side (timestamp/IP/UA) no MESMO card.

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

// Busca os campos do Start Form e resolve IDs por label/ID.
// Inclui mapeamento para os CAMPOS DE CONSENTIMENTO (opcionais).
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

  const byLabel = (label) => table.get(norm(label)) || null;
  const byIdLike = (re) => fields.find(f => re.test(String(f.id)))?.id || null;

  const ids = {
    // ajuste os labels abaixo se no seu Pipe estiverem diferentes
    nome:     byLabel("Nome"),
    telefone: byLabel("Telefone") || fields.find(f => /telef|whats/i.test(f.id))?.id || null,
    email:    byLabel("E-mail")   || byLabel("Email") || fields.find(f => /email/i.test(f.id))?.id || null,
    mensagem: byLabel("Mensagem") || fields.find(f => /mensag|descri/i.test(f.id))?.id || null,

    // ----- Campos de CONSENTIMENTO (opcionais, mas recomendados no Start Form) -----
    // Tente pelos labels sugeridos:
    consent_ts:            byLabel("Consent TS") || byLabel("Timestamp do Consentimento") || byIdLike(/consent.*ts|timestamp/i),
    consent_ip:            byLabel("Consent IP") || byLabel("IP do Consentimento")        || byIdLike(/consent.*ip|ip.*consent/i),
    consent_ua:            byLabel("Consent UA") || byLabel("User Agent do Consentimento")|| byIdLike(/consent.*ua|user.*agent/i),
    consent_policy_version:byLabel("Consent Policy Version") || byLabel("Versão da Política") || byIdLike(/policy.*version|consent.*policy/i),
    consent_client_ts:     byLabel("Consent Client TS") || byLabel("TS Cliente do Consentimento") || byIdLike(/client.*ts|ts.*client/i),
    form_id:               byLabel("Form ID") || byLabel("Origem do Formulário") || byIdLike(/form[_-]?id/i),
  };

  return { ids, fields };
}

// Monta os fields de consentimento com CARIMBO DO SERVIDOR (TS/IP/UA)
function buildServerConsentFields(event, body, ids) {
  const headers = event?.headers || {};
  const ipHeader =
    headers["x-forwarded-for"] ||
    headers["x-nf-client-connection-ip"] ||
    headers["client-ip"] ||
    "";
  const ipRaw = String(ipHeader).split(",")[0].trim();
  const ua    = headers["user-agent"] || "";
  const now   = new Date().toISOString();

  // (opcional) mascarar IP para reduzir sensibilidade
  const ip = ipRaw; // ou: ipRaw.replace(/(\d+)\.(\d+)\.(\d+)\.(\d+)/, "$1.$2.$3.xxx")

  // metadata vinda do front, mas NÃO confiamos em timestamp de cliente (guardamos só como referência)
  const policyVersion = String(body?.lgpd?.policyVersion || "v1");
  const clientTs      = String(body?.lgpd?.consentAtClient || "");
  const formIdVal     = String(body?.form_id || "FormularioApi");

  const out = [];
  const pushIf = (id, value) => { if (id) out.push({ field_id: id, field_value: value }); };

  pushIf(ids.consent_ts,            now);
  pushIf(ids.consent_ip,            ip);
  pushIf(ids.consent_ua,            ua);
  pushIf(ids.consent_policy_version,policyVersion);
  pushIf(ids.consent_client_ts,     clientTs);
  pushIf(ids.form_id,               formIdVal);

  return out;
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: CORS, body: "" };
  if (event.httpMethod !== "POST")    return { statusCode: 405, headers: CORS, body: "Method Not Allowed" };

  try {
    if (!PIPE_ID || !TOKEN) {
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "PIPEFY_PIPE_ID/PIPEFY_TOKEN não configurados" }) };
    }

    const body = JSON.parse(event.body || "{}");
    const { nome, telefone, email, mensagem, hp } = body;

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

    // resolve IDs por label/id
    const { ids, fields } = await fetchStartFormFieldIdsByLabel();
    const notFoundBase = [
      ["nome", ids.nome],
      ["telefone", ids.telefone],
      ["email", ids.email],
      ["mensagem", ids.mensagem],
    ].filter(([, id]) => !id).map(([k]) => k);

    if (notFoundBase.length) {
      // mantém o mesmo padrão de erro 502 (falha ao criar) com detalhe
      return {
        statusCode: 502,
        headers: CORS,
        body: JSON.stringify({
          error: "Falha ao criar card no Pipefy",
          message: `Fields not found with ids: ${notFoundBase.join(", ")}`,
          detail: { available: fields }
        })
      };
    }

    // monta os atributos do contato
    const fields_attributes = [
      { field_id: ids.nome,     field_value: String(nome) },
      { field_id: ids.telefone, field_value: String(telefone) },
      { field_id: ids.email,    field_value: String(email) },
      { field_id: ids.mensagem, field_value: String(mensagem) },
    ];

    // >>> CONSENTIMENTO server-side (opcional, só entra se os campos existirem no Start Form)
    const consentFields = buildServerConsentFields(event, body, ids);
    const fields_with_consent = [...fields_attributes, ...consentFields];

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
        fields_attributes: fields_with_consent
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
      body: JSON.stringify({
        ok: true,
        card: json.data?.createCard?.card,
        // dica: para auditoria você pode retornar o que foi preenchido de consent
        consentFilled: consentFields.map(f => f.field_id)
      })
    };

  } catch (err) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "Erro interno", detail: String(err) }) };
  }
};
