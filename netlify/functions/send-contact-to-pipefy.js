// netlify/functions/send-contact-to-pipefy.js

// --------- AJUSTE AQUI ---------
// Coloque os IDs dos campos exatamente como estão no start form do seu Pipe.
// Você pode pegar via UI do Pipefy (ID do campo) ou com a query start_form_fields (ver bloco 4).
const FIELD_IDS = {
    nome:     "nome",       // ex: "nome_do_cliente"
    telefone: "telefone",   // ex: "telefone_para_contato_whatsapp"
    email:    "email",      // ex: "e_mail"
    mensagem: "mensagem",   // ex: "mensagem"
  };
  // --------------------------------
  
// netlify/functions/send-contact-to-pipefy.js
const PIPE_ID = Number(process.env.PIPEFY_PIPE_ID_CONTACT || process.env.PIPEFY_PIPE_ID);
const TOKEN   = process.env.PIPEFY_TOKEN;
  
  const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
  
  export async function handler(event) {
    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 200, headers: CORS, body: "" };
    }
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, headers: CORS, body: "Method Not Allowed" };
    }
  
    try {
      if (!PIPE_ID || !TOKEN) {
        return {
          statusCode: 500,
          headers: CORS,
          body: JSON.stringify({ error: "PIPEFY_PIPE_ID/PIPEFY_TOKEN não configurados" }),
        };
      }
  
      // Body esperado do front-end
      const { nome, telefone, email, mensagem, hp } = JSON.parse(event.body || "{}");
  
      // Honeypot: se o campo escondido "hp" vier preenchido, tratamos como spam
      if (typeof hp === "string" && hp.trim() !== "") {
        return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true, spam: true }) };
      }
  
      // Validação mínima
      const missing = [];
      if (!nome || !String(nome).trim())       missing.push("nome");
      if (!telefone || !String(telefone).trim()) missing.push("telefone");
      if (!email || !String(email).trim())     missing.push("email");
      if (!mensagem || !String(mensagem).trim()) missing.push("mensagem");
  
      if (missing.length) {
        return {
          statusCode: 400,
          headers: CORS,
          body: JSON.stringify({ error: "Campos obrigatórios ausentes.", missing }),
        };
      }
  
      // Monta os atributos do Pipefy
      const fields_attributes = [
        { field_id: FIELD_IDS.nome,     field_value: String(nome) },
        { field_id: FIELD_IDS.telefone, field_value: String(telefone) },
        { field_id: FIELD_IDS.email,    field_value: String(email) },
        { field_id: FIELD_IDS.mensagem, field_value: String(mensagem) },
      ];
  
      // GraphQL: criar card
      const mutation = `
        mutation ($input: CreateCardInput!) {
          createCard(input: $input) {
            card { id title url }
          }
        }
      `;
  
      const variables = {
        input: {
          pipe_id: PIPE_ID,
          title: `Contato • ${String(nome).slice(0, 80)}`,
          fields_attributes,
        },
      };
  
      const res = await fetch("https://api.pipefy.com/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TOKEN}`,
        },
        body: JSON.stringify({ query: mutation, variables }),
      });
  
      const text = await res.text();
      let json;
      try { json = JSON.parse(text); } catch { json = { raw: text }; }
  
      if (!res.ok || json.errors) {
        const message = Array.isArray(json.errors) ? json.errors.map(e => e.message).join(" | ") : "Erro desconhecido";
        return {
          statusCode: 502,
          headers: CORS,
          body: JSON.stringify({ error: "Falha ao criar card no Pipefy", message, detail: json }),
        };
      }
  
      return {
        statusCode: 200,
        headers: { ...CORS, "Content-Type": "application/json" },
        body: JSON.stringify({ ok: true, card: json.data.createCard.card }),
      };
    } catch (err) {
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "Erro interno", detail: String(err) }) };
    }
  }
  