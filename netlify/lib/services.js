"use strict";

/* =========================================================
   Integraciones externas: reCAPTCHA, Airtable y EmailJS.
   Ningún secreto se registra en logs ni se devuelve al cliente.
   ========================================================= */

const { getEnv } = require("./http");

// Las funciones de Netlify tienen 10 s en total; cada servicio recibe un margen menor
const SERVICE_TIMEOUT_MS = 4000;
const RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";
const AIRTABLE_API_URL = "https://api.airtable.com/v0";
const EMAILJS_SEND_URL = "https://api.emailjs.com/api/v1.0/email/send";
const DEFAULT_RECAPTCHA_MIN_SCORE = 0.5;

/* ---------- reCAPTCHA v3 ---------- */

/**
 * Verifica el token con Google.
 * Devuelve true solo si el token es válido, corresponde a la acción esperada
 * y el puntaje alcanza el mínimo (backend.md §11.3).
 */
async function verifyRecaptcha(token, expectedAction, remoteIp) {
  const params = new URLSearchParams({
    secret: getEnv("RECAPTCHA_SECRET_KEY"),
    response: token,
  });
  if (remoteIp) params.set("remoteip", remoteIp);

  const response = await fetch(RECAPTCHA_VERIFY_URL, {
    method: "POST",
    body: params,
    signal: AbortSignal.timeout(SERVICE_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`reCAPTCHA respondió HTTP ${response.status}`);
  }

  const result = await response.json();
  const minScore = Number(process.env.RECAPTCHA_MIN_SCORE) || DEFAULT_RECAPTCHA_MIN_SCORE;
  return (
    result.success === true &&
    result.action === expectedAction &&
    typeof result.score === "number" &&
    result.score >= minScore
  );
}

/* ---------- Airtable ---------- */

/** Crea un registro en una tabla. typecast permite escribir opciones de "Single select" */
async function createAirtableRecord({ baseId, table, fields }) {
  const url = `${AIRTABLE_API_URL}/${encodeURIComponent(baseId)}/${encodeURIComponent(table)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getEnv("AIRTABLE_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields, typecast: true }),
    signal: AbortSignal.timeout(SERVICE_TIMEOUT_MS),
  });

  if (!response.ok) {
    // Solo el tipo de error: el mensaje completo podría repetir datos del visitante
    const errorType = await response
      .json()
      .then((body) => body?.error?.type || body?.error || "desconocido")
      .catch(() => "respuesta no JSON");
    throw new Error(`Airtable respondió HTTP ${response.status} (${errorType})`);
  }
  return response.json();
}

/* ---------- EmailJS ---------- */

/** Envía la notificación al propietario usando la plantilla configurada en EmailJS */
async function sendEmailNotification(templateParams) {
  const response = await fetch(EMAILJS_SEND_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: getEnv("EMAILJS_SERVICE_ID"),
      template_id: getEnv("EMAILJS_TEMPLATE_ID"),
      user_id: getEnv("EMAILJS_PUBLIC_KEY"),
      accessToken: getEnv("EMAILJS_PRIVATE_KEY"),
      template_params: templateParams,
    }),
    signal: AbortSignal.timeout(SERVICE_TIMEOUT_MS),
  });
  if (!response.ok) {
    // EmailJS responde con texto plano que explica la causa (no repite los datos enviados)
    const reason = await response.text().catch(() => "");
    throw new Error(`EmailJS respondió HTTP ${response.status}: ${reason.slice(0, 150)}`);
  }
}

module.exports = {
  verifyRecaptcha,
  createAirtableRecord,
  sendEmailNotification,
};