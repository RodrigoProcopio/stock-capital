// netlify/functions/send-to-pipefy.js

const GQL = "https://api.pipefy.com/graphql";

/** Lê os campos do Start Form (id, type e options quando houver) */
async function getStartFormFields(token, pipeId) {
  const query = `
    query ($pipeId: ID!) {
      pipe(id: $pipeId) {
        id
        start_form_fields {
          id
          type
          # "options" aparece só em alguns tipos; usamos inline fragments
          ... on ChecklistVerticalField   { options }
          ... on ChecklistHorizontalField { options }
          ... on LabelsSelectField        { options }
          ... on ListSelectField          { options }  # select de 1 opção
        }
      }
    }`;
  const res = await fetch(GQL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ query, variables: { pipeId } }),
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!res.ok || json.errors) {
    throw new Error(`Falha ao ler Start Form: ${JSON.stringify(json.errors || json)}`);
  }
  return json.data?.pipe?.start_form_fields ?? [];
}

/** Normaliza array de strings (case-insensitive) conforme opções do Pipefy */
function normalizeAgainstOptions(values, options) {
  const norm = (s) => String(s).trim().toLowerCase();
  const mapOpt = new Map(options.map((o) => [norm(o), o]));
  return values.map((v) => mapOpt.get(norm(v))).filter(Boolean);
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
    const FIELD_OBJ   = process.env.PIPEFY_FIELD_OBJ; // <- conferir no Netlify

    // 1) Ler start form (garante id e tipo corretos do campo de objetivos)
    const startFields = await getStartFormFields(TOKEN, String(PIPE_ID));
    const availableIds = startFields.map((f) => f.id);
    const objetivosField = startFields.find((f) => f.id === FIELD_OBJ);

    if (!objetivosField) {
      // erro explicativo: mostra o id que veio do ENV e os ids existentes
      return {
        statusCode: 400,
        headers: cors,
        body: JSON.stringify({
          error: "Campo de 'Objetivos principais' não encontrado no Start Form.",
          enviadoComo: FIELD_OBJ,
          idsDisponiveis: availableIds,
          dica: "Verifique PIPEFY_FIELD_OBJ nas variáveis do Netlify e o id do campo no Pipefy."
        }),
      };
    }

    const fields = [
      { field_id: FIELD_NOME,  field_value: nome },
      { field_id: FIELD_EMAIL, field_value: email },
    ];
    if (telefone)    fields.push({ field_id: FIELD_TEL,   field_value: telefone });
    if (horizonte)   fields.push({ field_id: FIELD_HOR,   field_value: horizonte });
    if (experiencia) fields.push({ field_id: FIELD_EXP,   field_value: experiencia });
    if (risco)       fields.push({ field_id: FIELD_RISCO, field_value: risco });

    // 2) Montar corretamente o valor de "objetivos" de acordo com o TIPO
    if (Array.isArray(objetivos) && objetivos.length) {
      const t = objetivosField.type;             // ex.: "checklist_vertical", "list_select", etc.
      const opts = objetivosField.options || []; // quando existir

      let fieldValue;
      if (t.startsWith("checklist")) {
        // aceita array de strings
        fieldValue = opts.length ? normalizeAgainstOptions(objetivos, opts) : objetivos;
        // se nada casou, ainda enviamos o que veio (Pipefy pode aceitar direto)
        if (!fieldValue.length) fieldValue = objetivos;
      } else if (t === "list_select" || t === "labels_select" || t === "radio_vertical" || t === "radio_horizontal") {
        // um único valor
        const normalized = opts.length ? normalizeAgainstOptions(objetivos, opts) : objetivos;
        fieldValue = normalized[0] ?? objetivos[0];
      } else {
        // fallback conservador
        fieldValue = objetivos.join(", ");
      }

      fields.push({ field_id: FIELD_OBJ, field_value: fieldValue });
    }

    // 3) Criar card
    const variables = {
      input: {
        pipe_id: Number(PIPE_ID),
        title: `Lead • ${nome}`,
        fields_attributes: fields,
      },
    };

    const res = await fetch(GQL, {
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
      body: JSON.stringify({ ok: true, card: json.data.createCard.card }),
    };
  } catch (e) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: "Erro interno", detail: String(e) }) };
  }
}
