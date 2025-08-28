// netlify/functions/send-to-pipefy.js

const GQL = "https://api.pipefy.com/graphql";

/** Busca metadados do campo (id, internal_id, type, options) */
async function getFieldMeta(token, pipeId, targetFieldIdOrInternal) {
  const query = `
    query ($pipeId: ID!) {
      pipe(id: $pipeId) {
        id
        start_form_fields {
          id
          internal_id
          type
          options
        }
      }
    }`;
  const res = await fetch(GQL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ query, variables: { pipeId } }),
  });
  const json = await res.json();
  if (json.errors) throw new Error("pipefy getFieldMeta: " + JSON.stringify(json.errors));
  const fields = json.data?.pipe?.start_form_fields ?? [];
  // Tenta bater por id OU por internal_id (caso a env tenha vindo errada com o número)
  return fields.find(f => f.id === targetFieldIdOrInternal || f.internal_id === targetFieldIdOrInternal);
}

function normalizeArrayOfStrings(arr) {
  return (Array.isArray(arr) ? arr : [])
    .map(s => String(s ?? "").trim())
    .filter(Boolean);
}

async function tryCreateCard(token, variables) {
  const mutation = `
    mutation ($input: CreateCardInput!) {
      createCard(input: $input) {
        card { id title url }
      }
    }`;
  const res = await fetch(GQL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ query: mutation, variables }),
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { ok: res.ok && !json.errors, res, json, raw: text };
}

export async function handler(event) {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: cors, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers: cors, body: "Method Not Allowed" };

  try {
    const body = JSON.parse(event.body || "{}");
    const { nome, email, telefone, horizonte, experiencia, risco, objetivos = [] } = body;

    if (!nome || !email) {
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "Campos obrigatórios ausentes (nome, email)." }) };
    }

    // ENV
    const PIPE_ID      = Number(process.env.PIPEFY_PIPE_ID);
    const TOKEN        = process.env.PIPEFY_TOKEN;
    const FIELD_NOME   = process.env.PIPEFY_FIELD_NOME;
    const FIELD_EMAIL  = process.env.PIPEFY_FIELD_EMAIL;
    const FIELD_TEL    = process.env.PIPEFY_FIELD_TEL;
    const FIELD_HOR    = process.env.PIPEFY_FIELD_HOR;
    const FIELD_EXP    = process.env.PIPEFY_FIELD_EXP;
    const FIELD_RISCO  = process.env.PIPEFY_FIELD_RISCO;
    const FIELD_OBJENV = process.env.PIPEFY_FIELD_OBJ; // pode ser "objetivos_principais" ou, por engano, o internal_id numérico

    // Monta campos básicos
    const fields = [
      { field_id: FIELD_NOME,  field_value: nome },
      { field_id: FIELD_EMAIL, field_value: email },
    ];
    if (telefone)    fields.push({ field_id: FIELD_TEL,   field_value: telefone });
    if (horizonte)   fields.push({ field_id: FIELD_HOR,   field_value: horizonte });
    if (experiencia) fields.push({ field_id: FIELD_EXP,   field_value: experiencia });
    if (risco)       fields.push({ field_id: FIELD_RISCO, field_value: risco });

    // ===== OBJETIVOS (CHECKLIST) =====
    const selecionados = normalizeArrayOfStrings(objetivos);

    if (selecionados.length) {
      // Metadados do campo (garante id e internal_id corretos e pega as opções)
      const meta = await getFieldMeta(TOKEN, PIPE_ID, FIELD_OBJENV);
      if (!meta) {
        return {
          statusCode: 400,
          headers: cors,
          body: JSON.stringify({
            error: "Campo 'Objetivos principais' não encontrado no start form.",
            procurado_por: FIELD_OBJENV
          })
        };
      }

      // Valida opções (no checklist, options é array de strings)
      const allowList = normalizeArrayOfStrings(meta.options);
      const asMap = new Map(allowList.map(o => [o.toLowerCase(), o]));
      const normalizados = selecionados.map(s => asMap.get(s.toLowerCase())).filter(Boolean);

      if (!normalizados.length) {
        return {
          statusCode: 400,
          headers: cors,
          body: JSON.stringify({
            error: "Nenhuma opção de 'Objetivos principais' corresponde às opções do Pipefy.",
            enviados: selecionados,
            opcoesPipefy: allowList
          })
        };
      }

      // Prepara duas versões do mesmo campo: usando id (padrão) e internal_id (fallback)
      const fieldWithId         = { field_id: meta.id,          field_value: normalizados };
      const fieldWithInternalId = { field_id: meta.internal_id, field_value: normalizados };

      // Primeiro tenta com o id canônico
      const variables1 = {
        input: { pipe_id: PIPE_ID, title: `Lead • ${nome}`, fields_attributes: [...fields, fieldWithId] }
      };
      let attempt = await tryCreateCard(TOKEN, variables1);

      // Se falhou especificamente por “Fields not found with ids: …”, tenta com internal_id
      const msg = attempt.json?.errors?.[0]?.message || "";
      const isFieldNotFound = /Fields not found with ids/i.test(msg);

      if (!attempt.ok && isFieldNotFound) {
        const variables2 = {
          input: { pipe_id: PIPE_ID, title: `Lead • ${nome}`, fields_attributes: [...fields, fieldWithInternalId] }
        };
        attempt = await tryCreateCard(TOKEN, variables2);

        if (!attempt.ok) {
          return {
            statusCode: 502,
            headers: cors,
            body: JSON.stringify({
              error: "Falha ao criar card no Pipefy (fallback internal_id também falhou).",
              first_try_message: msg,
              second_try_message: attempt.json?.errors?.[0]?.message || "",
              detail_first: variables1,
              detail_second: variables2
            })
          };
        }

        // Sucesso no fallback
        return {
          statusCode: 200,
          headers: { ...cors, "Content-Type": "application/json" },
          body: JSON.stringify({ ok: true, card: attempt.json.data.createCard.card, used: "internal_id" })
        };
      }

      // Sucesso na primeira tentativa
      if (attempt.ok) {
        return {
          statusCode: 200,
          headers: { ...cors, "Content-Type": "application/json" },
          body: JSON.stringify({ ok: true, card: attempt.json.data.createCard.card, used: "id" })
        };
      }

      // Falha diferente (não é “Fields not found…”)
      return {
        statusCode: 502,
        headers: cors,
        body: JSON.stringify({
          error: "Falha ao criar card no Pipefy",
          message: msg || "Erro desconhecido",
          detail: attempt.json || attempt.raw
        })
      };
    }

    // ===== caso NÃO haja objetivos marcados, segue normal =====
    const variables = {
      input: {
        pipe_id: PIPE_ID,
        title: `Lead • ${nome}`,
        fields_attributes: fields,
      },
    };

    const attempt = await tryCreateCard(TOKEN, variables);
    if (!attempt.ok) {
      return {
        statusCode: 502,
        headers: cors,
        body: JSON.stringify({
          error: "Falha ao criar card no Pipefy",
          message: attempt.json?.errors?.[0]?.message || "Erro desconhecido",
          detail: attempt.json || attempt.raw
        })
      };
    }

    return {
      statusCode: 200,
      headers: { ...cors, "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true, card: attempt.json.data.createCard.card })
    };

  } catch (e) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: "Erro interno", detail: String(e) }) };
  }
}
