// netlify/functions/send-to-pipefy.js

const GQL = "https://api.pipefy.com/graphql";

const norm = (s) => String(s ?? "").normalize("NFKC").trim().toLowerCase();

/** Busca metadados dos campos do start form e tenta identificar o campo de 'Objetivos' de forma resiliente */
async function findObjetivosFieldMeta(token, pipeId, hint) {
  const q = `
    query ($pipeId: ID!) {
      pipe(id: $pipeId) {
        id
        start_form_fields {
          id
          internal_id
          label
          type
          options
        }
      }
    }`;
  const res = await fetch(GQL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ query: q, variables: { pipeId } }),
  });
  const json = await res.json();
  if (json.errors) throw new Error("pipefy get fields: " + JSON.stringify(json.errors));

  const fields = json.data?.pipe?.start_form_fields ?? [];

  // 1) tenta por id ou internal_id exatamente
  let meta =
    fields.find(f => f.id === hint || f.internal_id === hint) ||
    // 2) tenta por label (normalizado)
    fields.find(f => norm(f.label) === norm("Objetivos principais")) ||
    // 3) tenta por id normalizado (caso haja variação de unicode)
    fields.find(f => norm(f.id) === norm(hint) || norm(f.internal_id) === norm(hint)) ||
    // 4) pega o primeiro checklist do start form (fallback agressivo)
    fields.find(f => f.type === "checklist");

  return { meta, fields }; // devolve lista inteira pra log em caso de erro
}

function normalizeArray(arr) {
  return (Array.isArray(arr) ? arr : [])
    .map((s) => String(s ?? "").trim())
    .filter(Boolean);
}

async function gqlCreate(token, variables) {
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
  const txt = await res.text();
  let json; try { json = JSON.parse(txt); } catch { json = { raw: txt }; }
  return { ok: res.ok && !json.errors, json, raw: txt };
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
    const FIELD_OBJENV = process.env.PIPEFY_FIELD_OBJ; // ex: "objetivos_principais" ou "418233619"

    // Campos base
    const baseFields = [
      { field_id: FIELD_NOME,  field_value: nome },
      { field_id: FIELD_EMAIL, field_value: email },
    ];
    if (telefone)    baseFields.push({ field_id: FIELD_TEL,   field_value: telefone });
    if (horizonte)   baseFields.push({ field_id: FIELD_HOR,   field_value: horizonte });
    if (experiencia) baseFields.push({ field_id: FIELD_EXP,   field_value: experiencia });
    if (risco)       baseFields.push({ field_id: FIELD_RISCO, field_value: risco });

    const selecionados = normalizeArray(objetivos);

    // Se NÃO tiver objetivos, cria sem esse campo e pronto
    if (!selecionados.length) {
      const variables = { input: { pipe_id: PIPE_ID, title: `Lead • ${nome}`, fields_attributes: baseFields } };
      const r = await gqlCreate(TOKEN, variables);
      if (!r.ok) {
        return { statusCode: 502, headers: cors, body: JSON.stringify({ error: "Falha ao criar card no Pipefy", detail: r.json || r.raw }) };
      }
      return { statusCode: 200, headers: { ...cors, "Content-Type": "application/json" }, body: JSON.stringify({ ok: true, card: r.json.data.createCard.card }) };
    }

    // >>> Com objetivos: identificar o campo de forma resiliente
    const { meta, fields: allFields } = await findObjetivosFieldMeta(TOKEN, PIPE_ID, FIELD_OBJENV);

    if (!meta) {
      return {
        statusCode: 400,
        headers: cors,
        body: JSON.stringify({
          error: "Campo 'Objetivos principais' não encontrado no start form.",
          procurado_por: FIELD_OBJENV,
          start_form_fields_snapshot: allFields // ajuda no log
        })
      };
    }

    // Validação das opções (checklist usa array de strings exatamente como nas options)
    const allow = normalizeArray(meta.options);
    const allowMap = new Map(allow.map(o => [norm(o), o]));
    const normed = selecionados.map(s => allowMap.get(norm(s))).filter(Boolean);

    if (!normed.length) {
      return {
        statusCode: 400,
        headers: cors,
        body: JSON.stringify({
          error: "Nenhuma opção de 'Objetivos principais' corresponde às opções do Pipefy.",
          enviados: selecionados,
          opcoesPipefy: allow
        })
      };
    }

    // Tenta primeiro com o id; se vier "Fields not found with ids", tenta internal_id
    const withId = { field_id: meta.id, field_value: normed };
    const v1 = { input: { pipe_id: PIPE_ID, title: `Lead • ${nome}`, fields_attributes: [...baseFields, withId] } };
    let r1 = await gqlCreate(TOKEN, v1);

    if (r1.ok) {
      return { statusCode: 200, headers: { ...cors, "Content-Type": "application/json" }, body: JSON.stringify({ ok: true, used: "id", card: r1.json.data.createCard.card }) };
    }

    const msg = r1.json?.errors?.[0]?.message || "";
    if (/Fields not found with ids/i.test(msg) && meta.internal_id) {
      const withInternal = { field_id: meta.internal_id, field_value: normed };
      const v2 = { input: { pipe_id: PIPE_ID, title: `Lead • ${nome}`, fields_attributes: [...baseFields, withInternal] } };
      const r2 = await gqlCreate(TOKEN, v2);
      if (r2.ok) {
        return { statusCode: 200, headers: { ...cors, "Content-Type": "application/json" }, body: JSON.stringify({ ok: true, used: "internal_id", card: r2.json.data.createCard.card }) };
      }
      return { statusCode: 502, headers: cors, body: JSON.stringify({ error: "Falha ao criar card no Pipefy (fallback internal_id)", first_try: r1.json, second_try: r2.json }) };
    }

    return { statusCode: 502, headers: cors, body: JSON.stringify({ error: "Falha ao criar card no Pipefy", detail: r1.json || r1.raw }) };
  } catch (e) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: "Erro interno", detail: String(e) }) };
  }
}
