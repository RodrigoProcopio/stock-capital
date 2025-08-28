// netlify/functions/send-to-pipefy.js

export async function handler(event) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };
    if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: cors, body: "" };
    if (event.httpMethod !== "POST")  return { statusCode: 405, headers: cors, body: "Method Not Allowed" };
  
    try {
      const body = JSON.parse(event.body || "{}");
      const { nome, email, telefone, horizonte, experiencia, risco, objetivos = [] } = body;
      if (!nome || !email) {
        return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "Campos obrigatórios ausentes (nome, email)." }) };
      }
  
      const PIPE_ID    = process.env.PIPEFY_PIPE_ID;
      const TOKEN      = process.env.PIPEFY_TOKEN;
      const FIELD_NOME = process.env.PIPEFY_FIELD_NOME;
      const FIELD_EMAIL= process.env.PIPEFY_FIELD_EMAIL;
      const FIELD_TEL  = process.env.PIPEFY_FIELD_TEL;
      const FIELD_HOR  = process.env.PIPEFY_FIELD_HOR;
      const FIELD_EXP  = process.env.PIPEFY_FIELD_EXP;
      const FIELD_RISCO= process.env.PIPEFY_FIELD_RISCO;
      const FIELD_OBJ  = process.env.PIPEFY_FIELD_OBJ;
  
      const variables = {
        input: {
          pipe_id: Number(PIPE_ID),
          title: `Lead • ${nome}`,
          fields_attributes: [
            { field_id: FIELD_NOME,  field_value: nome },
            { field_id: FIELD_EMAIL, field_value: email },
            ...(telefone    ? [{ field_id: FIELD_TEL,   field_value: telefone }] : []),
            ...(horizonte   ? [{ field_id: FIELD_HOR,   field_value: horizonte }] : []),
            ...(experiencia ? [{ field_id: FIELD_EXP,   field_value: experiencia }] : []),
            ...(risco       ? [{ field_id: FIELD_RISCO, field_value: risco }] : []),
            ...(Array.isArray(objetivos) && objetivos.length
                ? [{ field_id: FIELD_OBJ, field_value: objetivos }]
                : []),
          ],
        },
      };
  
      const res = await fetch("https://api.pipefy.com/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}` },
        body: JSON.stringify({
          query: `mutation ($input: CreateCardInput!) { createCard(input: $input) { card { id title url } } }`,
          variables,
        }),
      });
  
      const json = await res.json();
      if (!res.ok || json.errors) {
        return { statusCode: 502, headers: cors, body: JSON.stringify({ error: "Falha ao criar card no Pipefy", detail: json.errors || json }) };
      }
  
      return { statusCode: 200, headers: { ...cors, "Content-Type": "application/json" }, body: JSON.stringify({ ok: true, card: json.data.createCard.card }) };
    } catch (e) {
      return { statusCode: 500, headers: cors, body: JSON.stringify({ error: "Erro interno", detail: String(e) }) };
    }
  }
  