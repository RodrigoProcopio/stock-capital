// netlify/functions/send-to-pipefy.js

// Busca as opções (strings) do campo no start form do pipe
async function getFieldOptionsStrings(token, pipeId, targetFieldId) {
    const query = `
      query ($pipeId: ID!) {
        pipe(id: $pipeId) {
          start_form_fields {
            id
            type
            options    # <- no seu pipe este campo é uma lista de strings (sem { id name })
          }
        }
      }`;
    const res = await fetch("https://api.pipefy.com/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ query, variables: { pipeId } }),
    });
    const json = await res.json();
    if (json.errors) throw new Error(JSON.stringify(json.errors));
    const field = json.data?.pipe?.start_form_fields?.find(f => f.id === targetFieldId);
    return Array.isArray(field?.options) ? field.options : [];
  }
  
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
  
      // ENV
      const PIPE_ID     = process.env.PIPEFY_PIPE_ID;
      const TOKEN       = process.env.PIPEFY_TOKEN;
      const FIELD_NOME  = process.env.PIPEFY_FIELD_NOME;
      const FIELD_EMAIL = process.env.PIPEFY_FIELD_EMAIL;
      const FIELD_TEL   = process.env.PIPEFY_FIELD_TEL;
      const FIELD_HOR   = process.env.PIPEFY_FIELD_HOR;
      const FIELD_EXP   = process.env.PIPEFY_FIELD_EXP;
      const FIELD_RISCO = process.env.PIPEFY_FIELD_RISCO;
      const FIELD_OBJ   = process.env.PIPEFY_FIELD_OBJ;
  
      const fields = [
        { field_id: FIELD_NOME,  field_value: nome },
        { field_id: FIELD_EMAIL, field_value: email },
      ];
      if (telefone)    fields.push({ field_id: FIELD_TEL,   field_value: telefone });
      if (horizonte)   fields.push({ field_id: FIELD_HOR,   field_value: horizonte });
      if (experiencia) fields.push({ field_id: FIELD_EXP,   field_value: experiencia });
      if (risco)       fields.push({ field_id: FIELD_RISCO, field_value: risco });
  
      // -------- OBJETIVOS (array de strings) --------
      if (Array.isArray(objetivos) && objetivos.length) {
        // pega do Pipefy as opções válidas (strings)
        const allowed = await getFieldOptionsStrings(TOKEN, Number(PIPE_ID), FIELD_OBJ);
  
        // normalizador p/ comparação case-insensitive
        const norm = s => String(s).trim().toLowerCase();
        const mapAllowed = new Map(allowed.map(opt => [norm(opt), opt]));
  
        // converte os textos do formulário para a grafia oficial do Pipefy
        const objetivosNormalizados = objetivos
          .map(txt => mapAllowed.get(norm(txt)))
          .filter(Boolean);
  
        if (!objetivosNormalizados.length) {
          return {
            statusCode: 400,
            headers: cors,
            body: JSON.stringify({
              error: "Nenhuma opção de 'Objetivos principais' corresponde às opções do Pipefy.",
              enviados: objetivos,
              opcoesPipefy: allowed
            })
          };
        }
  
        fields.push({ field_id: FIELD_OBJ, field_value: objetivosNormalizados }); // << envia array de strings
      }
      // ---------------------------------------------
  
      const variables = {
        input: {
          pipe_id: Number(PIPE_ID),
          title: `Lead • ${nome}`,
          fields_attributes: fields,
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
  
      const text = await res.text();
      let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }
  
      if (!res.ok || json.errors) {
        const msg = json?.errors?.[0]?.message || "Erro desconhecido";
        return { statusCode: 502, headers: cors, body: JSON.stringify({ error: "Falha ao criar card no Pipefy", message: msg, detail: json }) };
      }
  
      return { statusCode: 200, headers: { ...cors, "Content-Type": "application/json" }, body: JSON.stringify({ ok: true, card: json.data.createCard.card }) };
    } catch (e) {
      return { statusCode: 500, headers: cors, body: JSON.stringify({ error: "Erro interno", detail: String(e) }) };
    }
  }
  