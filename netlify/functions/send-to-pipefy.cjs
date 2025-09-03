// CommonJS v1 – send-to-pipefy.cjs (com Blobs configurável)
const { getStore } = require("@netlify/blobs");
const validator = require("validator");
const { createHash, randomUUID } = require("crypto");

/** ===== Utils ===== */
const sha256 = (v) => createHash("sha256").update(String(v)).digest("hex");
const maskEmail = (email = "") => {
  const [u, d] = String(email).toLowerCase().split("@");
  return d ? `${u?.[0] ?? ""}***@${d}` : "";
};
const maskPhone = (phone = "") => String(phone).replace(/\d(?=\d{4})/g, "*");
const json = (statusCode, body, headers = {}) => ({
  statusCode,
  headers: { "Content-Type": "application/json; charset=utf-8", ...headers },
  body: JSON.stringify(body),
});
const getHeader = (event, name) => {
  const k = Object.keys(event.headers || {}).find((h) => h.toLowerCase() === name.toLowerCase());
  return k ? event.headers[k] : undefined;
};
const getAllowedOrigin = (origin, allowlist) =>
  origin && allowlist.includes(origin) ? origin : null;
const buildCors = (origin, allowed, req) => {
  const reqAllowed = getHeader({ headers: req?.headers || {} }, "access-control-request-headers");
  const allowHeaders = reqAllowed || "Content-Type, X-Correlation-Id";
  return {
    Vary: "Origin",
    "Access-Control-Allow-Origin": allowed ? origin : "null",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": allowHeaders,
    "Access-Control-Expose-Headers": "X-Correlation-Id",
    "Access-Control-Max-Age": "86400",
  };
};
const getClientIp = (event) =>
  getHeader(event, "x-nf-client-connection-ip") ||
  (getHeader(event, "x-forwarded-for") || "").split(",")[0]?.trim() ||
  event.clientIp ||
  "unknown";

const E164_RE = /^\+?[1-9]\d{1,14}$/;

/** ===== Pipefy ===== */
async function sendToPipefy(data, correlationId) {
  const token = process.env.PIPEFY_TOKEN || "";
  const pipeId = process.env.PIPEFY_PIPE_ID || "";
  if (!token || !pipeId) {
    console.log(JSON.stringify({ level: "warn", msg: "pipefy_not_configured", correlationId }));
    return { ok: true, skipped: true };
  }

  // fetch polyfill se Node < 18
  let _fetch = global.fetch;
  if (!_fetch) {
    try {
      _fetch = (await import("node-fetch")).default;
    } catch {
      return { ok: false, error: "fetch_unavailable_runtime_lt18" };
    }
  }

  const F_EMAIL = process.env.PIPEFY_FIELD_EMAIL || "email";
  const F_PHONE = process.env.PIPEFY_FIELD_PHONE || "telefone";
  const F_MSG = process.env.PIPEFY_FIELD_MESSAGE || "mensagem";
  const F_POLICY = process.env.PIPEFY_FIELD_POLICY_VERSION || "policy_version";
  const F_LGPD_AT = process.env.PIPEFY_FIELD_LGPD_CONSENT_AT || "";
  const F_LGPD_IP = process.env.PIPEFY_FIELD_LGPD_IP_HASH || "";
  const F_LGPD_UA = process.env.PIPEFY_FIELD_LGPD_UA || "";

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
  const variables = { input: { pipe_id: Number(pipeId), title: `Formulário - ${data.name}`, fields_attributes } };

  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort("timeout"), 10000);
  try {
    const res = await _fetch("https://api.pipefy.com/graphql", {
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

/** ===== Blobs helpers (v1 precisa siteID/token) ===== */
async function getRateStore() {
  const siteID =
    process.env.NETLIFY_SITE_ID || process.env.SITE_ID || process.env.BLOBS_SITE_ID || "";
  const token =
    process.env.NETLIFY_ACCESS_TOKEN || process.env.BLOBS_TOKEN || "";
  const hasManual = siteID && token;

  // fetch para o SDK de Blobs (Node < 18)
  let fetchImpl = global.fetch;
  if (!fetchImpl) {
    try { fetchImpl = (await import("node-fetch")).default; } catch {}
  }

  if (hasManual) {
    return getStore("rate-limits", { siteID, token, fetch: fetchImpl });
  }
  // tenta auto-config, e se falhar, relança (o erro deixa claro que faltam credenciais)
  return getStore("rate-limits");
}

exports.handler = async (event, context) => {
  const startedAt = Date.now();
  const correlationId =
    getHeader(event, "x-correlation-id") ||
    (typeof randomUUID === "function" ? randomUUID() : Math.random().toString(36).slice(2));

  const origin = getHeader(event, "origin") || "";
  const allowlist = (process.env.CORS_ALLOWLIST || "").split(",").map((s) => s.trim()).filter(Boolean);
  const isAllowed = !!getAllowedOrigin(origin, allowlist);
  const cors = buildCors(origin, isAllowed, event);

  if ((event.httpMethod || "").toUpperCase() === "OPTIONS") {
    return { statusCode: isAllowed ? 204 : 403, headers: cors, body: "" };
  }
  if (!isAllowed) {
    return json(403, { error: "Origin not allowed" }, { ...cors, "X-Correlation-Id": correlationId });
  }

  const maxBytes = Number(process.env.MAX_BODY_BYTES || 102400);
  const contentLength = Number(getHeader(event, "content-length") || "0");
  if (contentLength > maxBytes) {
    return json(413, { error: "Payload too large" }, { ...cors, "X-Correlation-Id": correlationId });
  }

  let body;
  try {
    body = event.isBase64Encoded
      ? JSON.parse(Buffer.from(event.body || "", "base64").toString("utf8"))
      : JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON" }, { ...cors, "X-Correlation-Id": correlationId });
  }

  if (String(body?.hp || "").trim().length > 0) {
    console.log(JSON.stringify({ level: "warn", msg: "honeypot_triggered", correlationId }));
    return { statusCode: 204, headers: { ...cors, "X-Correlation-Id": correlationId }, body: "" };
  }

  const ALLOWED = ["name", "email", "phone", "message", "consent", "policyVersion"];
  const data = {};
  for (const k of ALLOWED) if (k in body) data[k] = typeof body[k] === "string" ? body[k].trim() : body[k];

  const errors = {};
  if (!data.name || String(data.name).length > 100) errors.name = "Nome obrigatório (<= 100).";
  if (!data.email || !validator.isEmail(String(data.email)) || String(data.email).length > 254) errors.email = "Email inválido.";
  if (data.phone && !E164_RE.test(String(data.phone))) errors.phone = "Telefone no formato E.164 (ex: +5511999999999).";
  if (!data.message || String(data.message).length > 5000) errors.message = "Mensagem obrigatória (<= 5000).";
  if (data.consent !== true) errors.consent = "Consentimento LGPD é obrigatório.";
  if (data.policyVersion && String(data.policyVersion).length > 20) errors.policyVersion = "policyVersion muito longo.";
  if (Object.keys(errors).length) {
    console.log(JSON.stringify({ level: "warn", msg: "validation_failed", correlationId, fields: Object.keys(errors), dur_ms: Date.now() - startedAt }));
    return json(422, { error: "Validation failed", details: errors }, { ...cors, "X-Correlation-Id": correlationId });
  }

  // Rate limit via Blobs
  let store;
  try {
    store = await getRateStore();
  } catch (e) {
    // Se ainda assim não tiver contexto, loga e segue sem rate limit (ou, se preferir, retorne 500)
    console.log(JSON.stringify({ level: "error", msg: "blobs_setup_failed", correlationId, err: String(e?.message || e) }));
  }

  const ip = getClientIp(event);
  const windowSec = Number(process.env.RATE_LIMIT_WINDOW_SEC || 60);
  const maxPerWindow = Number(process.env.RATE_LIMIT_MAX || 60);
  const windowKey = Math.floor(Date.now() / (windowSec * 1000));
  const key = `${ip}:${windowKey}:form`;

  if (store) {
    try {
      const raw = await store.get(key);
      let current = { c: 0 };
      if (raw) { try { current = typeof raw === "string" ? JSON.parse(raw) : raw; } catch {} }
      if (current.c >= maxPerWindow) {
        console.log(JSON.stringify({ level: "warn", msg: "rate_limited", correlationId, ip_hash: sha256(`${ip}:${process.env.PII_SALT || ""}`), windowSec, maxPerWindow, dur_ms: Date.now() - startedAt }));
        return json(429, { error: "Too Many Requests" }, { ...cors, "Retry-After": String(windowSec), "X-Correlation-Id": correlationId });
      }
      await store.set(key, JSON.stringify({ c: current.c + 1 }));
    } catch (e) {
      console.log(JSON.stringify({ level: "error", msg: "blobs_error", correlationId, err: String(e?.message || e) }));
    }
  }

  // Pipefy
  const ua = getHeader(event, "user-agent") || "";
  const ip_hash = sha256(`${ip}:${process.env.PII_SALT || ""}`);
  const pipeRes = await sendToPipefy({ ...data, ip_hash, ua }, correlationId);

  if (!pipeRes.ok) {
    console.log(JSON.stringify({ level: "error", msg: "pipefy_failed", correlationId, status: pipeRes.status || null, error: pipeRes.error || null, dur_ms: Date.now() - startedAt }));
    return json(502, { error: "Upstream error", detail: pipeRes.error || null, correlationId }, { ...cors, "X-Correlation-Id": correlationId });
  }

  console.log(JSON.stringify({
    level: "info", msg: "form_received", correlationId, origin,
    ua, ip_hash,
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

  return json(200, { ok: true, correlationId }, { ...cors, "X-Correlation-Id": correlationId });
};
