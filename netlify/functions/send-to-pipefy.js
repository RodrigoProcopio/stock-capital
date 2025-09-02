// netlify/functions/send-to-pipefy.js
// Cria card do Formulário API no Pipefy, normaliza opções e grava consentimento (TS/IP/UA/versão/clientTS)

async function fetchStartFormOptions(token, pipeId) {
  const query = `
    query ($id: ID!) {
      pipe(id: $id) {
        start_form_fields {
          id
          type
          options   # em campos de lista o Pipefy devolve array de strings
        }
      }
    }`;
  const res = await fetch("https://api.pipefy.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ query, variables: { id: pipeId } }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  const map = new Map();
  (json.data?.pipe?.start_form_fields || []).forEach(f => {
    if (Array.isArray(f.options) && f.options.length) map.set(f.id, f.options);
  });
  return map; // Map<field_id, string[]>
}

// normalizador simples: tira acentos, trim, e colapsa espaços; compara case-insensitive
function norm(s) {
  return String(s)
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// casa um valor simples com a lista permitida do Pipefy (retorna o texto oficial do Pipefy)
function normalizeSingleToAllowed(value, allowed) {
  const table = new Map(allowed.map(opt => [norm(opt), opt]));
  return table.get(norm(value)) || null;
}

// casa um array de valores com a lista permitida
function normalizeManyToAllowed(values, allowed) {
  const table = new Map(allowed.map(opt => [norm(opt), opt]));
  const ok = [];
  const bad = [];
  for (const v of values) {
    const hit = table.get(norm(v));
    if (hit) ok.push(hit); else bad.push(v);
  }
  return { ok, bad };
}

// 🔎 resolver IDs de consentimento por label (opcionais)
async function fetchStartFormFieldIdsByLabel(token, pipeId) {
  const q = `
    query ($id: ID!) {
      pipe(id: $id) { start_form_fields { id label } }
    }`;
  const r = await fetch("https://api.pipefy.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ query: q, variables: { id: pipeId } }),
  });
  const j = await r.json();
  if (j.errors) throw new Error(JSON.stringify(j.errors));
  const table = new Map((j.data?.pipe?.start_form_fields || []).map(f => [norm(f.label), f.id]));
  return {
    consent_ts:             table.get(norm("Consent TS")),
    consent_ip:             table.get(norm("Consent IP")),
    consent_ua:             table.get(norm("Consent UA")),
    consent_policy_version: table.get(norm("Consent Policy Version")),
    consent_client_ts:      table.get(norm("Consent Client TS")),
    form_id:                table.get(norm("Form ID")),
  };
}

export async function handler(event) {
  const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: CORS, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers: CORS, body: "Method Not Allowed" };

  try {
    const PIPE_ID = process.env.PIPEFY_PIPE_ID;   // ex.: 306574957
    const TOKEN   = process.env.PIPEFY_TOKEN;

    if (!PIPE_ID || !TOKEN) {
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "PIPEFY_PIPE_ID/PIPEFY_TOKEN não configurados" }) };
    }

    // IDs EXATOS do Pipefy (copiados do start_form_fields)
    const REQUIRED_SINGLES = [
      "nome_do_cliente",
      "telefone_para_contato_whatsapp",
      "e_mail",
      "estado_civil",
      "qual_a_sua_faixa_et_ria",
      "qual_a_sua_fonte_de_renda",
      "patrim_nio_l_quido",
      "pergunta_chave_01_assuma_que_uma_epidemia_chegou_numa_cidade_e_tem_potencial_de_infectar_600_pessoas_voc_precisa_escolher_o_programa_de_sa_de_p_blica_que_vai_salvar_essa_cidade",
      "quantos_dependentes_financeiros_voc_possui",
      "copy_of_pergunta_chave_01_assuma_que_uma_epidemia_chegou_numa_cidade_e_tem_potencial_de_infectar_600_pessoas_voc_precisa_escolher_o_programa_de_sa_de_p_blica_que_vai_salvar_essa_cidade",
      "qual_o_seu_grau_de_interesse_em_economia_e_mercado_financeiro",
      "qual_a_necessidade_futura_dos_seus_rendimentos",
      "qual_o_seu_horizonte_de_investimento",
      "possui_conhecimento_sobre_o_conceito_volatilidade",
      "como_voc_reagiria_caso_o_seu_investimento_tivesse_uma_perda_de_10",
      "copy_of_como_voc_reagiria_caso_o_seu_investimento_tivesse_uma_oscila_o_de_10",
      "sobre_os_conceitos_de_marca_o_a_mercado_em_t_tulos_de_renda_fixa",
    ];

    const OPTIONAL_SINGLES = [
      "descreva_brevemente_a_composi_o_da_sua_renda_mensal",
    ];

    const MULTI_FIELDS = [
      "qual_a_principal_finalidade_de_investir",
      "especifique_o_perfil_de_dependentes",
      "qual_moeda_voc_tem_prefer_ncia_em_estar_posicionado",
      "quais_investimentos_voc_realizou_nos_ltimos_24_meses_1",
      "quais_os_tipos_de_investimentos_que_voc_mais_se_identifica",
    ];

    const body = JSON.parse(event.body || "{}");

    // 1) valida obrigatórios (só checa vazio)
    const missing = REQUIRED_SINGLES.filter(id => {
      const v = body[id];
      return v === undefined || v === null || String(v).trim() === "";
    });
    if (missing.length) {
      return {
        statusCode: 400,
        headers: CORS,
        body: JSON.stringify({ error: "Campos obrigatórios ausentes.", missing })
      };
    }

    // 2) baixa opções válidas do Pipefy e normaliza tudo que for de lista
    const optionsMap = await fetchStartFormOptions(TOKEN, Number(PIPE_ID));
    const fields_attributes = [];
    const notMatched = []; // para reportar o que não casou

    // helper para enviar singles
    const pushSingle = (id) => {
      const v = body[id];
      const allowed = optionsMap.get(id);
      if (allowed) {
        const hit = normalizeSingleToAllowed(v, allowed);
        if (!hit) { notMatched.push({ field: id, sent: v, allowed }); return; }
        fields_attributes.push({ field_id: id, field_value: hit });
      } else {
        // campo texto/numérico
        fields_attributes.push({ field_id: id, field_value: String(v) });
      }
    };

    // helper para enviar arrays
    const pushMulti = (id) => {
      const arr = Array.isArray(body[id]) ? body[id] : [];
      if (!arr.length) return;
      const allowed = optionsMap.get(id) || [];
      const { ok, bad } = normalizeManyToAllowed(arr, allowed);
      if (bad.length) notMatched.push({ field: id, sent: bad, allowed });
      if (ok.length) fields_attributes.push({ field_id: id, field_value: ok });
    };

    // singles
    REQUIRED_SINGLES.forEach(pushSingle);
    OPTIONAL_SINGLES.forEach(id => {
      const v = body[id];
      if (v !== undefined && v !== null && String(v).trim() !== "") pushSingle(id);
    });

    // multis
    MULTI_FIELDS.forEach(pushMulti);

    // se algo não casou, devolve 400 explicando (para você alinhar front x pipe)
    if (notMatched.length) {
      return {
        statusCode: 400,
        headers: CORS,
        body: JSON.stringify({
          error: "Alguns valores não correspondem às opções do Pipefy.",
          detail: notMatched
        })
      };
    }

    // --- LGPD: carimbo do servidor + metadados do cliente ---
    const idsConsent = await fetchStartFormFieldIdsByLabel(TOKEN, Number(PIPE_ID));
    const nowISO = new Date().toISOString();
    const ip = (event.headers?.["x-forwarded-for"] || event.headers?.["X-Forwarded-For"] || "")
      .toString().split(",")[0].trim()
      || event.headers?.["x-real-ip"]
      || event.headers?.["X-Real-IP"]
      || event.headers?.["client-ip"]
      || event.headers?.["Client-IP"]
      || "unknown";
    const ua = event.headers?.["user-agent"] || event.headers?.["User-Agent"] || "";
    const policyVersion = (body.lgpd && body.lgpd.policyVersion) || "v1";
    const clientTS = (body.lgpd && body.lgpd.consentAtClient) || null;

    if (idsConsent.consent_ts)             fields_attributes.push({ field_id: idsConsent.consent_ts,             field_value: nowISO });
    if (idsConsent.consent_ip)             fields_attributes.push({ field_id: idsConsent.consent_ip,             field_value: ip });
    if (idsConsent.consent_ua)             fields_attributes.push({ field_id: idsConsent.consent_ua,             field_value: ua });
    if (idsConsent.consent_policy_version) fields_attributes.push({ field_id: idsConsent.consent_policy_version, field_value: policyVersion });
    if (idsConsent.consent_client_ts && clientTS) fields_attributes.push({ field_id: idsConsent.consent_client_ts, field_value: clientTS });
    if (idsConsent.form_id)                fields_attributes.push({ field_id: idsConsent.form_id,                field_value: "FormularioAPI" });

    // 3) cria o card
    const query = `
      mutation ($input: CreateCardInput!) {
        createCard(input: $input) {
          card { id title url }
        }
      }`;

    const variables = {
      input: {
        pipe_id: Number(PIPE_ID),
        title: `Perfil • ${body["nome_do_cliente"]}`,
        fields_attributes
      }
    };

    const res = await fetch("https://api.pipefy.com/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${TOKEN}` },
      body: JSON.stringify({ query, variables })
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
      body: JSON.stringify({ ok: true, card: json.data.createCard.card })
    };

  } catch (err) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "Erro interno", detail: String(err) }) };
  }
}
