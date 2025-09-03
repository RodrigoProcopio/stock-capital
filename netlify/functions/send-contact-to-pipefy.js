// netlify/functions/send-contact-to-pipefy.js
import { getStore } from "@netlify/blobs";
import validator from "validator";
import { randomUUID as nodeRandomUUID, createHash } from "node:crypto";

const uuid = () => (globalThis.crypto?.randomUUID?.() || nodeRandomUUID());
const sha256 = (value) => createHash("sha256").update(String(value)).digest("hex");

/** ====== Utils de privacidade / logs ====== */
const maskEmail = (email = "") => {
  const [user, domain] = String(email).toLowerCase().split("@");
  if (!domain) return "";
  return `${user?.[0] ?? ""}***@${domain}`;
};
const maskPhone = (phone = "") => String(phone).replace(/\d(?=\d{4})/g, "*");

const json = (body, { status = 200, headers = {} } = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers },
  });

/** ====== CORS ====== */
const getAllowedOrigin = (origin, allowlist) =>
  origin && allowlist.includes(origin) ? origin : null;

const buildCorsHeaders = (origin, allowed, allowedHeaders = "Content-Type, X-Correlation-Id") => ({
  Vary: "Origin",
  "Access-Control-Allow-Origin": allowed ? origin : "null",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": allowedHeaders,
  "Access-Control-Expose-Headers": "X-Correlation-Id",
  "Access-Control-Max-Age": "86400",
});

/** ====== IP do cliente ====== */
const getClientIp = (req, context) =>
  context.ip ||
  req.headers.get("x-nf-client-connection-ip") ||
  (req.headers.get("x-forwarded-for") || "").split(",")[0]?.trim() ||
  "unknown";

/** ====== Validações ====== */
const E164_RE = /^\+?[1-9]\d{1,14}$/; // E.164

/** ====== Envio ao Pipefy (GraphQL) ====== */
async function sendToPipefy(data, correlationId) {
  const token = process.env.PIPEFY_TOKEN || "";
  // Preferir pipe específico de contato, se existir
  const pipeId = process.env.PIPEFY_PIPE_ID_CONTACT || process.env.PIPEFY_PIPE_ID || "";
  if (!token || !pipeId) {
    console.log(JSON.stringify({ level: "warn", msg: "pipefy_not_configured", correlationId }));
    return { ok: true, skipped: true };
  }

  // IDs de campos (env com fallback sensatos)
  const F_EMAIL = process.env.PIPEFY_FIELD_EMAIL || "email";
  const F_PHONE = process.env.PIPEFY_FIELD_PHONE || "telefone";
  const F_MSG = process.env.PIPEFY_FIELD_MESSAGE || "mensagem";
  const F_POLICY = process.env.PIPEFY_FIELD_POLICY_VERSION || "policy_version";
  const F_LGPD_AT = process.env.PIPEFY_FIELD_LGPD_CONSENT_AT || ""; // opcional
  const F_LGPD_IP = process.env.PIPEFY_FIELD_LGPD_IP_HASH || ""; // opcional
  const F_LGPD_UA = process.env.PIPEFY_FIELD_LGPD_UA || ""; // opcional

  const fields_attributes = [
    { field_id: F_EMAIL, field_value: data.email },
    { field_id: F_PHONE, field_value: data.phone || "" },
    { field_id: F_MSG, field_value: data.message },
    { field_id: F_POLICY, field_value: data.policyVersion || "v1" },
  ];
  if (data.consent === true) {
    if (F_LGPD_AT) fields_attributes.push({ field_id: F_LGPD_AT, field_value: new Date().toISOString() });
    if (F_LGPD_IP) fields_attributes.push({ field_id: F_LGPD_IP, field_value: data.ip_hash || "" });
    if (F_LGPD_UA) fields_attributes.push({ field_id: F_LGPD_UA, field_value: data.ua || "" });
  }

  const mutation = `
    mutation($input: CreateCardInput!) {
      createCard(input: $input) { card { id } }
    }`;
  const variables = {
    input: {
      pipe_id: Number(pipeId),
      title: `Contato - ${data.name}`,
      fields_attributes,
    },
  };

  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort("timeout"), 10000);

  try {
    const res = await fetch("https://api.pipefy.com/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ query: mutation, variables }),
      signal: controller.signal,
    });

    clearTimeout(tid);
    if (!res.ok) return { ok: false, status: res.status };
    const out = await res.json().catch(() => ({}));
    const id = out?.data?.createCard?.card?.id;
    return { ok: !!id, id: id || null };
  } catch (e) {
    clearTimeout(tid);
    return { ok: false, error: String(e?.message || e) };
  }
}

async function main(req, context) {
  const startedAt = Date.now();
  const correlationId = req.headers.get("x-correlation-id") || uuid();

  const allowlist = (process.env.CORS_ALLOWLIST || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const origin = req.headers.get("origin") || "";
  const isAllowed = !!getAllowedOrigin(origin, allowlist);

  // Se for preflight, ecoar os headers solicitados
  const reqAllowedHeaders = req.headers.get("access-control-request-headers");
  const cors = buildCorsHeaders(origin, isAllowed, reqAllowedHeaders || "Content-Type, X-Correlation-Id");

  if (req.method === "OPTIONS") {
    return new Response(null, { status: isAllowed ? 204 : 403, headers: cors });
  }
  if (!isAllowed) {
    return json({ error: "Origin not allowed" }, { status: 403, headers: { ...cors, "X-Correlation-Id": correlationId } });
  }

  // Limite de payload pelo header
  const maxBytes = Number(process.env.MAX_BODY_BYTES || 102400);
  const contentLength = Number(req.headers.get("content-length") || "0");
  if (contentLength > maxBytes) {
    return json({ error: "Payload too large" }, { status: 413, headers: { ...cors, "X-Correlation-Id": correlationId } });
  }

  // Parse seguro
  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400, headers: { ...cors, "X-Correlation-Id": correlationId } });
  }

  // Honeypot: se veio 'hp' preenchido, encerra silenciosamente
  if (String(body?.hp || "").trim().length > 0) {
    console.log(JSON.stringify({ level: "warn", msg: "honeypot_triggered", correlationId }));
    return new Response(null, { status: 204, headers: { ...cors, "X-Correlation-Id": correlationId } });
  }

  // Whitelist de campos (descarta extras)
  const ALLOWED = ["name", "email", "phone", "message", "consent", "policyVersion"];
  const data = {};
  for (const k of ALLOWED) {
    if (k in body) data[k] = typeof body[k] === "string" ? body[k].trim() : body[k];
  }

  // Validações
  const errors = {};
  if (!data.name || data.name.length > 100) errors.name = "Nome obrigatório (<= 100).";
  if (!data.email || !validator.isEmail(String(data.email)) || String(data.email).length > 254)
    errors.email = "Email inválido.";
  if (data.phone && !E164_RE.test(String(data.phone)))
    errors.phone = "Telefone no formato E.164 (ex: +5511999999999).";
  if (!data.message || String(data.message).length > 5000)
    errors.message = "Mensagem obrigatória (<= 5000).";
  if (data.consent !== true)
    errors.consent = "Consentimento LGPD é obrigatório.";
  if (data.policyVersion && String(data.policyVersion).length > 20)
    errors.policyVersion = "policyVersion muito longo.";

  if (Object.keys(errors).length) {
    console.log(JSON.stringify({
      level: "warn",
      msg: "validation_failed",
      correlationId,
      fields: Object.keys(errors),
      dur_ms: Date.now() - startedAt,
    }));
    return json({ error: "Validation failed", details: errors }, { status: 422, headers: { ...cors, "X-Correlation-Id": correlationId } });
  }

  // Rate limiting por IP
  const ip = getClientIp(req, context);
  const windowSec = Number(process.env.RATE_LIMIT_WINDOW_SEC || 60);
  const maxPerWindow = Number(process.env.RATE_LIMIT_MAX || 60);
  const windowKey = Math.floor(Date.now() / (windowSec * 1000));
  const store = getStore({ name: "rate-limits" });
  const key = `${ip}:${windowKey}:send-contact`;

  try {
    const raw = await store.get(key);
    let current = { c: 0 };
    if (raw) {
      try { current = typeof raw === "string" ? JSON.parse(raw) : raw; } catch { current = { c: 0 }; }
    }
    if (current.c >= maxPerWindow) {
      console.log(JSON.stringify({
        level: "warn",
        msg: "rate_limited",
        correlationId,
        ip_hash: sha256(`${ip}:${process.env.PII_SALT || ""}`),
        windowSec,
        maxPerWindow,
        dur_ms: Date.now() - startedAt,
      }));
      return json(
        { error: "Too Many Requests" },
        { status: 429, headers: { ...cors, "Retry-After": String(windowSec), "X-Correlation-Id": correlationId } }
      );
    }
    await store.set(key, JSON.stringify({ c: current.c + 1 }));
  } catch (e) {
    console.log(JSON.stringify({ level: "error", msg: "blobs_error", correlationId, err: String(e?.message || e) }));
  }

  // Envio ao Pipefy
  const piiSalt = process.env.PII_SALT || "";
  const ip_hash = sha256(`${ip}:${piiSalt}`);
  const ua = req.headers.get("user-agent") || "";

  const pipeRes = await sendToPipefy({ ...data, ip_hash, ua }, correlationId);

  if (!pipeRes.ok) {
    console.log(JSON.stringify({
      level: "error",
      msg: "pipefy_failed",
      correlationId,
      status: pipeRes.status || null,
      error: pipeRes.error || null,
      dur_ms: Date.now() - startedAt,
    }));
    return json({ error: "Upstream error", correlationId }, { status: 502, headers: { ...cors, "X-Correlation-Id": correlationId } });
  }

  // Log final sem PII
  console.log(JSON.stringify({
    level: "info",
    msg: "contact_received",
    correlationId,
    origin,
    ua,
    ip_hash,
    payload: {
      name_len: String(data.name || "").length,
      email_mask: maskEmail(data.email),
      phone_mask: maskPhone(data.phone || ""),
      message_len: String(data.message || "").length,
      consent: data.consent === true,
      policyVersion: data.policyVersion || "v1",
    },
    dur_ms: Date.now() - startedAt,
  }));

  return json({ ok: true, correlationId }, { status: 200, headers: { ...cors, "X-Correlation-Id": correlationId } });
}

// Export default (v2)
export default main;

// Compat: wrapper para runtime v1
export async function handler(event, context) {
  try {
    const method = (event.httpMethod || "GET").toUpperCase();
    const headers = event.headers || {};
    const host = headers.host || "localhost";
    const path = event.path || "/";
    const qs = event.rawQuery
      ? `?${event.rawQuery}`
      : event.queryStringParameters
      ? "?" + new URLSearchParams(event.queryStringParameters).toString()
      : "";
    const url = event.rawUrl || `https://${host}${path}${qs}`;

    let body;
    if (!["GET", "HEAD"].includes(method)) {
      body = event.isBase64Encoded ? Buffer.from(event.body || "", "base64") : event.body;
    }

    const req = new Request(url, { method, headers, body });

    const ip =
      event.clientIp ||
      headers["x-nf-client-connection-ip"] ||
      (headers["x-forwarded-for"] || "").split(",")[0]?.trim() ||
      undefined;

    const res = await main(req, { ...context, ip });

    const outHeaders = {};
    res.headers.forEach((v, k) => { outHeaders[k] = v; });
    const text = await res.text();

    return {
      statusCode: res.status,
      headers: outHeaders,
      body: text,
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ error: "runtime_error", message: String(e?.message || e) }),
    };
  }
}
