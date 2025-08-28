// netlify/functions/send-to-pipefy.js

export async function handler(event) {
  const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: CORS, body: "Method Not Allowed" };
  }

  try {
    // -------- ENV obrigatórias (Pipe do "Análise de Perfil de Investidor") --------
    const PIPE_ID       = process.env.PIPEFY_PIPE_ID;       // ex: 306574957
    const TOKEN         = process.env.PIPEFY_TOKEN;

    // Mapeie AQUI os IDs de campo (id “externo”, ex.: nome_do_cliente, e_mail, etc.)
    // => São exatamente os "id" que o Pipefy devolve na query dos start_form_fields.
    const FIELDS = {
      nome_do_cliente: "nome_do_cliente",
      telefone_para_contato_whatsapp: "telefone_para_contato_whatsapp",
      e_mail: "e_mail",
      estado_civil: "estado_civil",
      qual_a_sua_faixa_etaria: "qual_a_sua_faixa_et_ria",
      qual_a_sua_fonte_de_renda: "qual_a_sua_fonte_de_renda",
      composicao_renda_mensal: "descreva_brevemente_a_composi_o_da_sua_renda_mensal",
      disponibilidade_para_investir: "patrim_nio_l_quido",
      pergunta_chave_01: "pergunta_chave_01_assuma_que_uma_epidemia_chegou_numa_cidade_e_tem_potencial_de_infectar_600_pessoas_voc_precisa_escolher_o_programa_de_sa_de_p_blica_que_vai_salvar_essa_cidade",
      finalidades_investir: "qual_a_principal_finalidade_de_investir",                 // (multi)
      dependentes_qtd: "quantos_dependentes_financeiros_voc_possui",
      pergunta_chave_02: "copy_of_pergunta_chave_01_assuma_que_uma_epidemia_chegou_numa_cidade_e_tem_potencial_de_infectar_600_pessoas_voc_precisa_escolher_o_programa_de_sa_de_p_blica_que_vai_salvar_essa_cidade",
      dependentes_perfil: "especifique_o_perfil_de_dependentes",                       // (multi)
      moeda_preferida: "qual_moeda_voc_tem_prefer_ncia_em_estar_posicionado",
      realizados_24m: "quais_investimentos_voc_realizou_nos_ltimos_24_meses_1",       // (multi)
      interesse_mercado: "qual_o_seu_grau_de_interesse_em_economia_e_mercado_financeiro",
      tipos_que_se_identifica: "quais_os_tipos_de_investimentos_que_voc_mais_se_identifica", // (multi)
      necessidade_futura: "qual_a_necessidade_futura_dos_seus_rendimentos",
      horizonte: "qual_o_seu_horizonte_de_investimento",
      conhece_vol: "possui_conhecimento_sobre_o_conceito_volatilidade",
      reacao_10: "como_voc_reagiria_caso_o_seu_investimento_tivesse_uma_perda_de_10",
      reacao_30: "copy_of_como_voc_reagiria_caso_o_seu_investimento_tivesse_uma_oscila_o_de_10",
      marcacao_mercado: "sobre_os_conceitos_de_marca_o_a_mercado_em_t_tulos_de_renda_fixa",
    };

    // -------- Payload vindo do front --------
    const body = JSON.parse(event.body || "{}");

    // Validação mínima
    if (!body?.nome_do_cliente || !body?.e_mail) {
      return {
        statusCode: 400,
        headers: CORS,
        body: JSON.stringify({ error: "Campos obrigatórios: nome_do_cliente e e_mail." }),
      };
    }

    // Helper para adicionar campo se tiver valor
    const pushIf = (arr, field_id, value) => {
      if (value === undefined || value === null) return;
      if (Array.isArray(value) && value.length === 0) return;
      const field_value = Array.isArray(value) ? value.filter(v => String(v).trim() !== "") : value;
      if ((Array.isArray(field_value) && field_value.length === 0) || String(field_value).trim() === "") return;
      arr.push({ field_id, field_value });
    };

    // Monte a lista de atributos do card (atenção aos que são multi-seleção -> arrays)
    const fields_attributes = [];

    // Texto / selects simples
    pushIf(fields_attributes, FIELDS.nome_do_cliente, body.nome_do_cliente);
    pushIf(fields_attributes, FIELDS.telefone_para_contato_whatsapp, body.telefone_para_contato_whatsapp);
    pushIf(fields_attributes, FIELDS.e_mail, body.e_mail);
    pushIf(fields_attributes, FIELDS.estado_civil, body.estado_civil);
    pushIf(fields_attributes, FIELDS.qual_a_sua_faixa_etaria, body.qual_a_sua_faixa_etaria);
    pushIf(fields_attributes, FIELDS.qual_a_sua_fonte_de_renda, body.qual_a_sua_fonte_de_renda);
    pushIf(fields_attributes, FIELDS.composicao_renda_mensal, body.composicao_renda_mensal);
    pushIf(fields_attributes, FIELDS.disponibilidade_para_investir, body.disponibilidade_para_investir);
    pushIf(fields_attributes, FIELDS.pergunta_chave_01, body.pergunta_chave_01);
    pushIf(fields_attributes, FIELDS.dependentes_qtd, body.dependentes_qtd);
    pushIf(fields_attributes, FIELDS.pergunta_chave_02, body.pergunta_chave_02);
    pushIf(fields_attributes, FIELDS.moeda_preferida, body.moeda_preferida);
    pushIf(fields_attributes, FIELDS.interesse_mercado, body.interesse_mercado);
    pushIf(fields_attributes, FIELDS.necessidade_futura, body.necessidade_futura);
    pushIf(fields_attributes, FIELDS.horizonte, body.horizonte);
    pushIf(fields_attributes, FIELDS.conhece_vol, body.conhece_vol);
    pushIf(fields_attributes, FIELDS.reacao_10, body.reacao_10);
    pushIf(fields_attributes, FIELDS.reacao_30, body.reacao_30);
    pushIf(fields_attributes, FIELDS.marcacao_mercado, body.marcacao_mercado);

    // Multi-seleção (sempre arrays)
    pushIf(fields_attributes, FIELDS.finalidades_investir, body.finalidades_investir);                   // array
    pushIf(fields_attributes, FIELDS.dependentes_perfil, body.dependentes_perfil);                       // array
    pushIf(fields_attributes, FIELDS.realizados_24m, body.realizados_24m);                               // array
    pushIf(fields_attributes, FIELDS.tipos_que_se_identifica, body.tipos_que_se_identifica);             // array

    // Título do card (ajuste se quiser)
    const title = `Perfil • ${body.nome_do_cliente}`;

    const query = `
      mutation ($input: CreateCardInput!) {
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
      body: JSON.stringify({ query, variables }),
    });

    const raw = await res.text();
    let json;
    try { json = JSON.parse(raw); } catch { json = { raw }; }

    if (!res.ok || json.errors) {
      const msg = json?.errors?.map(e => e.message).join(" | ") || "Erro desconhecido";
      // devolvemos detalhes para facilitar debug no Console do navegador
      return {
        statusCode: 502,
        headers: CORS,
        body: JSON.stringify({ error: "Falha ao criar card no Pipefy", message: msg, detail: json }),
      };
    }

    return {
      statusCode: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true, card: json.data.createCard.card }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: "Erro interno", detail: String(err) }),
    };
  }
}

