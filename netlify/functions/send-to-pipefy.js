// netlify/functions/send-to-pipefy.js

// Busca as opções (strings) do campo no start form do pipe (com inline fragments)
async function getFieldOptionsStrings(token, pipeId, targetFieldId) {
    const query = `
      query ($pipeId: ID!) {
        pipe(id: $pipeId) {
          start_form_fields {
            id
            type
            # os campos que têm "options" exposto como [String]
            ... on ChecklistVerticalField   { options }
            ... on ChecklistHorizontalField { options }
            ... on LabelsSelectField        { options }
            ... on ListSelectField          { options }  # select de uma opção
          }
        }
      }`;
  
    const res = await fetch("https://api.pipefy.com/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ query, variables: { pipeId } }),
    });
  
    const text = await res.text();
    let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }
  
    // Se a API devolver erro (ex.: algum fragmento não existir), retornamos [] para não travar o envio
    if (!res.ok || json.errors) return [];
  
    const field = json?.data?.pipe?.start_form_fields?.find(f => f.id === targetFieldId);
    // Em tipos sem "options", será undefined -> devolvemos []
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
  
      // -------- OBJETIVOS (array de strings para Checklist) --------
      if (Array.isArray(objetivos) && objetivos.length) {
        // tenta obter as opções do Pipefy; se vier vazio, não bloqueia o envio
        const allowed = await getFieldOptionsStrings(TOKEN, String(PIPE_ID), FIELD_OBJ);
  
        if (allowed.length > 0) {
          // normalizador p/ comparação case-insensitive
          const norm = s => String(s).trim().toLowerCase();
          const mapAllowed = new Map(allowed.map(opt => [norm(opt), opt]));
  
          // converte os textos do formulário para a grafia oficial do Pipefy
          const objetivosNormalizados = objetivos
            .map(txt => mapAllowed.get(norm(txt)))
            .filter(Boolean);
  
          // Se nada corresponder, ainda assim enviaremos os valores crus — evita 400
          fields.push({
            field_id: FIELD_OBJ,
            field_value: objetivosNormalizados.length ? objetivosNormalizados : objetivos
          });
        } else {
          // Sem opções retornadas do schema -> envia o array como está
          fields.push({ field_id: FIELD_OBJ, field_value: objetivos });
        }
      }
      // -------------------------------------------------------------
  
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
  
      return {
        statusCode: 200,
        headers: { ...cors, "Content-Type": "application/json" },
        body: JSON.stringify({ ok: true, card: json.data.createCard.card })
      };
    } catch (e) {
      return { statusCode: 500, headers: cors, body: JSON.stringify({ error: "Erro interno", detail: String(e) }) };
    }
  }
  