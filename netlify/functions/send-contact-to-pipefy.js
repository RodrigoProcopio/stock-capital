// netlify/functions/send-contact-to-pipefy.js (CommonJS)
const PIPE_ID = Number(process.env.PIPEFY_PIPE_ID_CONTACT || process.env.PIPEFY_PIPE_ID);
const TOKEN   = process.env.PIPEFY_TOKEN;
const DEBUG   = process.env.DEBUG === "true";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// normalizador simples para comparar labels de forma resiliente
function norm(s) {
  return String(s || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// tenta mapear pelo label exibido no Pipe ("Nome", "Telefone", "E-mail", "Mensagem")
async function fetchFieldMapByLabel() {
  const query = `
    query ($id: ID!) {
      pipe(id: $id) {
        id
        name
        start_form_fields { id label type }
      }
    }
  `;
  const res = await fetch("https://api.pipefy.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({ query, variables: { id: PIPE_ID } }),
  });

  const json = await res.json();
  if (json.errors) throw new Error(json.errors.map(e => e.message).join(" | "));

  const fields = json?.data?.pipe?.start_form_fields || [];

  // tabela normalizada: label -> id
  const table = new Map(fields.map(f => [norm(f.label), f.id]));

  // labels comuns (ajuste se seus labels forem outros)
  const ids = {
    nome:     table.get(norm("Nome")),
    telefone: table.get(norm("Telefone")),
    email:    table.get(norm("E-mail")) || table.get(norm("Email")),
    mensagem: table.get(norm("Mensagem")),
  };

  // fallback: se algo vier vazio, tenta chutar por padrões comuns (opcional)
  if (!ids.email)    ids.email    = fields.find(f => /email/i.test(f.id))?.id || null;
  if (!ids.telefone) ids.telefone = fields.find(f => /telef|whats/i.test(f.id))?.id || null;
  if (!ids.nome)     ids.nome     = fields.find(f => /nome/i.test(f.id))?.id || null;
  if (!ids.mensagem) ids.mensagem = fields.find(f => /mensag|descri/i.test(f.id))?.id || null;

  return { ids, fields };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: CORS, body: "" };
  if (event.httpMethod !== "POST")    return { statusCode: 405, headers: CORS, body: "Method Not Allowed" };

  try {
    if (!PIPE_ID || !TOKEN) {
      const body = JSON.stringify({ error: "PIPEFY_PIPE_ID/PIPEFY_TOKEN não configurados" });
      return { statusCode: DEBUG ? 200 : 500, headers: CORS, body };
    }

    const payload = JSON.parse(event.body || "{}");
    const { nome, telefone, email, mensagem, hp } = payload;

    // honeypot anti-spam
    if (typeof hp === "string" && hp.trim() !== "") {
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true, spam: true }) };
    }

    // valida mínimo
    const missing = [];
    if (!nome) missing.push("nome");
    if (!telefone) missing.push("telefone");
    if (!email) missing.push("email");
    if (!mensagem) missing.push("mensagem");
    if (missing.length) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Campos obrigatórios ausentes.", missing }) };
    }

    // descobre ids no Pipe a partir dos labels
    const { ids, fields } = await fetchFieldMapByLabel();

    const notFound = Object.entries(ids)
      .filter(([, id]) => !id)
      .map(([k]) => k);

    if (notFound.length) {
      const dbg = { expected: ["Nome", "Telefone", "E-mail", "Mensagem"], resolved: ids, available: fields };
      const body = JSON.stringify({
        error: "Fields not found by label",
        message: `Não achei no start form: ${notFound.join(", ")}`,
        debug: DEBUG ? dbg : undefined,
      });
      return { statusCode: DEBUG ? 200 : 502, headers: CORS, body };
    }

    const fields_attributes = [
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
      }
    `;

    const variables = {
      input: { pipe_id: PIPE_ID, title: `Contato • ${String(nome).slice(0,80)}`, fields_attributes },
    };

    const res = await fetch("https://api.pipefy.com/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify({ query: mutation, variables }),
    });

    const text = await res.text();
    let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }

    if (!res.ok || json.errors) {
      const message = Array.isArray(json.errors) ? json.errors.map(e => e.message).join(" | ") : "Erro desconhecido";
      const body = JSON.stringify({ error: "Falha ao criar card no Pipefy", message, detail: json });
      return { statusCode: DEBUG ? 200 : 502, headers: CORS, body };
    }

    return { statusCode: 200, headers: { ...CORS, "Content-Type": "application/json" }, body: JSON.stringify({ ok: true, card: json.data.createCard.card }) };

  } catch (err) {
    const body = JSON.stringify({ error: "Erro interno", detail: String(err) });
    return { statusCode: DEBUG ? 200 : 500, headers: CORS, body };
  }
};
