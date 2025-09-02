/**
 * Netlify Function: consent.js
 * - Registra consentimento (server-side: timestamp, IP, User-Agent)
 * - Recebe e protocola solicitações LGPD (DSAR)
 * - Opcional: integra com Pipefy (variáveis de ambiente)
 *
 * Requerimentos:
 * - Node 18+ no Netlify (fetch nativo disponível)
 */

exports.handler = async function (event) {
    // Permitir somente POST
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }
  
    const now = new Date().toISOString();
  
    // Tenta capturar IP atrás de proxy (Netlify)
    const ipHeader =
      event.headers["x-forwarded-for"] ||
      event.headers["x-nf-client-connection-ip"] ||
      event.headers["client-ip"] ||
      "";
    const ip = ipHeader.split(",")[0].trim();
    const ua = event.headers["user-agent"] || "";
  
    let body = {};
    try {
      body = JSON.parse(event.body || "{}");
    } catch (_) {
      return { statusCode: 400, body: "Invalid JSON" };
    }
  
    const action = String(body.action || "consent");
  
    // Utilitário simples: chamada ao Pipefy (opcional)
    async function sendToPipefy({ pipeId, title, fields }) {
      const token = process.env.PIPEFY_TOKEN;
      if (!token || !pipeId) return;
  
      const mutation = `
        mutation($input: CreateCardInput!) {
          createCard(input: $input) { card { id title } }
        }`;
  
      const input = {
        pipe_id: Number(pipeId),
        title,
        fields_attributes: fields,
      };
  
      const resp = await fetch("https://api.pipefy.com/graphql", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: mutation, variables: { input } }),
      });
  
      if (!resp.ok) {
        const txt = await resp.text().catch(() => "");
        console.error("Pipefy error:", resp.status, txt);
      }
    }
  
    try {
      if (action === "consent") {
        // Registro autoritativo no servidor
        const record = {
          action,
          ts: now,
          ip,
          ua,
          policyVersion: String(body.policyVersion || "v1"),
          formId: String(body.formId || "FormularioApi"),
          subject: {
            nome: String(body.nome || ""),
            email: String(body.email || ""),
            telefone: String(body.telefone || ""),
          },
          context: body.context || {},
          accepted: true,
        };
  
        // (Opcional) enviar para Pipefy
        if (process.env.PIPEFY_TOKEN && process.env.PIPEFY_PIPE_ID) {
          await sendToPipefy({
            pipeId: process.env.PIPEFY_PIPE_ID,
            title: `Consentimento LGPD — ${record.subject.email || record.subject.nome || "sem-identificação"}`,
            fields: [
              { field_id: "consent_ts", field_value: record.ts },
              { field_id: "consent_ip", field_value: record.ip },
              { field_id: "consent_ua", field_value: record.ua },
              { field_id: "consent_policy_version", field_value: record.policyVersion },
              { field_id: "form_id", field_value: record.formId },
              { field_id: "nome", field_value: record.subject.nome },
              { field_id: "email", field_value: record.subject.email },
              { field_id: "telefone", field_value: record.subject.telefone },
            ],
          });
        }
  
        // Você pode também persistir em um KV/DB (Fauna, Supabase, D1, etc.)
        return {
          statusCode: 200,
          body: JSON.stringify({ ok: true, ts: now }),
          headers: { "Content-Type": "application/json" },
        };
      }
  
      if (action === "lgpd_request") {
        // Protocolo de solicitação do titular
        const lgpd = {
          action,
          ts: now,
          ip,
          ua,
          nome: String(body.nome || ""),
          email: String(body.email || ""),
          tipo: String(body.tipo || "acesso"), // acesso|correcao|exclusao|portabilidade|revogacao
          mensagem: String(body.mensagem || ""),
        };
  
        // (Opcional) enviar para Pipefy (pipe para DSAR)
        if (process.env.PIPEFY_TOKEN && process.env.PIPEFY_LGPD_PIPE_ID) {
          await sendToPipefy({
            pipeId: process.env.PIPEFY_LGPD_PIPE_ID,
            title: `Solicitação LGPD — ${lgpd.tipo} — ${lgpd.email || lgpd.nome || "sem-identificação"}`,
            fields: [
              { field_id: "solicitacao_tipo", field_value: lgpd.tipo },
              { field_id: "nome", field_value: lgpd.nome },
              { field_id: "email", field_value: lgpd.email },
              { field_id: "mensagem", field_value: lgpd.mensagem },
              { field_id: "request_ts", field_value: lgpd.ts },
              { field_id: "request_ip", field_value: lgpd.ip },
              { field_id: "request_ua", field_value: lgpd.ua },
            ],
          });
        }
  
        return {
          statusCode: 200,
          body: JSON.stringify({ ok: true, ts: now }),
          headers: { "Content-Type": "application/json" },
        };
      }
  
      return { statusCode: 400, body: "Unknown action" };
    } catch (err) {
      console.error(err);
      return { statusCode: 500, body: "Server error" };
    }
  };
  