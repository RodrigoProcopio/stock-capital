// netlify/functions/send-to-pipefy.js

/** Util: resposta JSON segura */
async function safeJson(res) {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

/** Carrega o start form (id, type, options, multiple) e devolve um Map id -> meta */
async function loadStartFormMeta(token, pipeId) {
  const query = `
    query ($pipeId: ID!) {
      pipe(id: $pipeId) {
        id
        name
        start_form_fields {
          id
          type
          options
          multiple
        }
      }
    }
  `;
  const res = await fetch("https://api.pipefy.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables: { pipeId } }),
  });

  const json = await safeJson(res);
  if (!res.ok || json.errors) {
    throw new Error("Falha ao carregar start form: " + JSON.stringify(json.errors || json));
  }

  const map = new Map();
  for (const f of (json.data?.pipe?.start_form_fields || [])) {
    // Em muitos pipes o GraphQL retorna options como lista de strings
    const options = Array.isArray(f.options) ? f.options : [];
    map.set(f.id, {
      type: f.type || "",
      multiple: Boolean(f.multiple), // pode vir undefined; tratamos por tipo do payload
      options,
      // mapa normalizado para comparação case-insensitive
      norm: new Map(options.map(o => [String(o).trim().toLowerCase(), o])),
    });
  }
  return map;
}

/** Normaliza valor (string|array) para bater com catálogo do campo (quando existir) */
function normalizeValueForField(value, meta) {
  if (!meta || !Array.isArray(meta.options) || meta.options.length === 0) {
    // Campo sem catálogo: deixa passar como veio (string ou array)
    return value;
  }

  const normMap = meta.norm; // Map<lower, originalText>

  // Se front mandou múltiplas opções (checkbox/multiselect)
  if (Array.isArray(value)) {
    const ok = [];
    for (const v of value) {
      const hit = normMap.get(String(v).trim().toLowerCase());
      if (hit) ok.push(hit);
    }
    return ok;
  }

  // Se for escolha única
  if (typeof value === "string") {
    const hit = normMap.get(value.trim().toLowerCase());
    return hit || ""; // vazio => inválido
  }

  return value;
}

export async function handler(event) {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: cors, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: cors, body: "Method Not Allowed" };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const PIPE_ID = process.env.PIPEFY_PIPE_ID;
    const TOKEN   = process.env.PIPEFY_TOKEN;

    if (!PIPE_ID || !TOKEN) {
      return {
        statusCode: 500,
        headers: cors,
        body: JSON.stringify({ error: "Config faltando: defina PIPEFY_PIPE_ID e PIPEFY_TOKEN no Netlify." }),
      };
    }

    // Carrega metadados do start form
    const metaMap = await loadStartFormMeta(TOKEN, Number(PIPE_ID));

    // Monta fields_attributes validando contra catálogo (quando existir)
    const fields_attributes = [];
    const invalid = []; // acumula inconsistências para feedback claro

    for (const [key, raw] of Object.entries(body)) {
      if (key === "lgpd") continue; // ignorado
      const meta = metaMap.get(key);

      if (!meta) {
        // Campo inexistente no start form – reportamos mas não bloqueamos por padrão.
        invalid.push({ field: key, reason: "Campo não encontrado no start form" });
        continue;
      }

      let value = raw;

      // Se vier array, tratamos como múltipla escolha; se vier string, tratamos como única.
      value = normalizeValueForField(value, meta);

      // Validação simples: se catálogo existir e nada casar, marca como inválido
      if (Array.isArray(raw)) {
        if (Array.isArray(meta.options) && meta.options.length > 0 && (!Array.isArray(value) || value.length === 0)) {
          invalid.push({ field: key, reason: "Nenhuma opção válida encontrada", enviados: raw, opcoes: meta.options });
          continue;
        }
      } else if (typeof raw === "string") {
        if (Array.isArray(meta.options) && meta.options.length > 0 && !value) {
          invalid.push({ field: key, reason: "Opção inválida", enviado: raw, opcoes: meta.options });
          continue;
        }
      }

      fields_attributes.push({ field_id: key, field_value: value });
    }

    if (invalid.length) {
      return {
        statusCode: 400,
        headers: cors,
        body: JSON.stringify({ error: "Dados inválidos para 1+ campos.", detail: invalid }),
      };
    }

    // Define título do card
    const nome = body["nome_do_cliente"] || body["nome"] || "Lead";
    const title = `Investidor • ${nome}`;

    // Chama a mutação createCard
    const mutation = `
      mutation CreateCard($input: CreateCardInput!) {
        createCard(input: $input) {
          card { id title url }
        }
      }
    `;

    const variables = {
      input: {
        pipe_id: Number(PIPE_ID),
        title,
        fields_attributes,
      },
    };

    const res = await fetch("https://api.pipefy.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({ query: mutation, variables }),
    });

    const json = await safeJson(res);
    if (!res.ok || json.errors) {
      return {
        statusCode: 502,
        headers: cors,
        body: JSON.stringify({
          error: "Falha ao criar card no Pipefy",
          message: json?.errors?.[0]?.message || "Erro desconhecido",
          detail: json,
        }),
      };
    }

    return {
      statusCode: 200,
      headers: { ...cors, "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true, card: json.data.createCard.card }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: cors,
      body: JSON.stringify({ error: "Erro interno", detail: String(e) }),
    };
  }
}
