// netlify/functions/send-to-pipefy.js

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

    // ---------- IDs EXATOS do Pipefy (copiados do start_form_fields) ----------
    // Singles obrigatórios do seu pipe:
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

    // Singles opcionais:
    const OPTIONAL_SINGLES = [
      "descreva_brevemente_a_composi_o_da_sua_renda_mensal",
    ];

    // Multiseleção (arrays):
    const MULTI_FIELDS = [
      "qual_a_principal_finalidade_de_investir",
      "especifique_o_perfil_de_dependentes",
      "qual_moeda_voc_tem_prefer_ncia_em_estar_posicionado",
      "quais_investimentos_voc_realizou_nos_ltimos_24_meses_1",
      "quais_os_tipos_de_investimentos_que_voc_mais_se_identifica",
    ];

    // Perguntas chave (singles) – já estão dentro de REQUIRED_SINGLES
    // ----------------------------------------------------------------

    const body = JSON.parse(event.body || "{}");

    // 1) Validação local dos obrigatórios (antes de chamar o Pipefy)
    const missing = REQUIRED_SINGLES.filter((id) => {
      const v = body[id];
      return v === undefined || v === null || String(v).trim() === "";
    });

    if (missing.length) {
      return {
        statusCode: 400,
        headers: CORS,
        body: JSON.stringify({
          error: "Campos obrigatórios ausentes no payload recebido.",
          missing,
          receivedKeys: Object.keys(body).sort(),
        }),
      };
    }

    // 2) Montagem do fields_attributes usando os MESMOS IDs do Pipefy
    const fields_attributes = [];

    const pushIf = (id) => {
      const v = body[id];
      if (v === undefined || v === null) return;
      if (Array.isArray(v)) {
        const arr = v.filter((x) => String(x).trim() !== "");
        if (arr.length) fields_attributes.push({ field_id: id, field_value: arr });
      } else {
        const s = String(v).trim();
        if (s !== "") fields_attributes.push({ field_id: id, field_value: s });
      }
    };

    // singles obrigatórios
    REQUIRED_SINGLES.forEach(pushIf);
    // singles opcionais
    OPTIONAL_SINGLES.forEach(pushIf);
    // multiselects
    MULTI_FIELDS.forEach(pushIf);

    // 3) Envio ao Pipefy
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
        title: `Perfil • ${body["nome_do_cliente"]}`,
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

    const text = await res.text();
    let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }

    if (!res.ok || json.errors) {
      const msg = Array.isArray(json?.errors) ? json.errors.map(e => e.message).join(" | ") : "Erro desconhecido";
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
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "Erro interno", detail: String(err) }) };
  }
}
