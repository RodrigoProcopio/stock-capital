// netlify/functions/send-to-pipefy.js

export const handler = async (event) => {
    // CORS básico (se o site e a API estiverem em domínios diferentes)
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",               // ajuste para o seu domínio em produção
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };
    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 200, headers: corsHeaders, body: "" };
    }
  
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, headers: corsHeaders, body: "Method Not Allowed" };
    }
  
    try {
      const body = JSON.parse(event.body || "{}");
      const {
        nome,
        email,
        telefone,
        horizonte,      // "Curto (até 1 ano)" | "Médio (1 a 5 anos)" | "Longo (5+ anos)"
        experiencia,    // "Nenhuma" | "Baixa" | "Média" | "Alta"
        risco,          // "Conservador" | "Moderado" | "Agressivo"
        objetivos = []  // array de strings
      } = body;
  
      // Validação mínima
      if (!nome || !email) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: "Campos obrigatórios ausentes (nome, email)." })
        };
      }
  
      // Convertendo objetivos marcados para string (ex.: "Preservação de capital, Renda recorrente")
      const objetivosStr = Array.isArray(objetivos) ? objetivos.join(", ") : String(objetivos || "");
  
      // IDs necessários (configure como ENV no Netlify)
      const PIPE_ID = process.env.PIPEFY_PIPE_ID;         // ex.: "123456789"
      const TOKEN = process.env.PIPEFY_TOKEN;             // token pessoal Pipefy
      const FIELD_NOME = process.env.PIPEFY_FIELD_NOME;   // ex.: "nome_cliente"
      const FIELD_EMAIL = process.env.PIPEFY_FIELD_EMAIL; // ex.: "email_cliente"
      const FIELD_TEL = process.env.PIPEFY_FIELD_TEL;     // ex.: "telefone_cliente"
      const FIELD_HOR = process.env.PIPEFY_FIELD_HOR;     // ex.: "horizonte_investimento"
      const FIELD_EXP = process.env.PIPEFY_FIELD_EXP;     // ex.: "nivel_experiencia"
      const FIELD_RISCO = process.env.PIPEFY_FIELD_RISCO; // ex.: "perfil_risco"
      const FIELD_OBJ = process.env.PIPEFY_FIELD_OBJ;     // ex.: "objetivos"
  
      if (!PIPE_ID || !TOKEN || !FIELD_NOME || !FIELD_EMAIL) {
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ error: "Variáveis de ambiente ausentes." })
        };
      }
  
      // GraphQL com variáveis (mais seguro que interpolar strings)
      const query = `
        mutation CreateCard($input: CreateCardInput!) {
          createCard(input: $input) {
            card {
              id
              title
              url
            }
          }
        }
      `;
  
      const variables = {
        input: {
          pipe_id: Number(PIPE_ID),
          title: `Lead • ${nome}`,
          fields_attributes: [
            { field_id: FIELD_NOME,  field_value: nome },
            { field_id: FIELD_EMAIL, field_value: email },
            ...(telefone   ? [{ field_id: FIELD_TEL,   field_value: telefone }] : []),
            ...(horizonte  ? [{ field_id: FIELD_HOR,   field_value: horizonte }] : []),
            ...(experiencia? [{ field_id: FIELD_EXP,   field_value: experiencia }] : []),
            ...(risco      ? [{ field_id: FIELD_RISCO, field_value: risco }] : []),
            ...(objetivosStr ? [{ field_id: FIELD_OBJ, field_value: objetivosStr }] : [])
          ]
        }
      };
  
      const pipefyRes = await fetch("https://api.pipefy.com/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${TOKEN}`
        },
        body: JSON.stringify({ query, variables })
      });
  
      const result = await pipefyRes.json();
  
      if (!pipefyRes.ok || result.errors) {
        return {
          statusCode: 502,
          headers: corsHeaders,
          body: JSON.stringify({ error: "Falha ao criar card no Pipefy", detail: result.errors || result })
        };
      }
  
      return {
        statusCode: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ ok: true, card: result.data.createCard.card })
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Erro interno", detail: String(err) })
      };
    }
  };
  