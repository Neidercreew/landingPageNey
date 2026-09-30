"use strict";

/* =========================================================
   Utilidades HTTP y validación compartidas por las funciones.
   Vive fuera de netlify/functions para que Netlify no lo
   publique como una función independiente.
   ========================================================= */

const MAX_BODY_BYTES = 10 * 1024;
const LOCAL_DEV_ORIGIN = "http://localhost:8888";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
// Caracteres de control (excepto salto de línea y tabulación)
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/** Error con código HTTP y mensaje seguro para mostrar al cliente */
class HttpError extends Error {
  constructor(statusCode, publicMessage) {
    super(publicMessage);
    this.name = "HttpError";
    this.statusCode = statusCode;
  }
}

/** Lee una variable de entorno obligatoria; nunca registra su valor */
function getEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}`);
  }
  return value;
}

// Netlify define URL (sitio principal) y DEPLOY_PRIME_URL / DEPLOY_URL (vistas previas)
function allowedOrigins() {
  return [process.env.URL, process.env.DEPLOY_PRIME_URL, process.env.DEPLOY_URL, LOCAL_DEV_ORIGIN]
    .filter(Boolean);
}

function getOrigin(event) {
  return event.headers?.origin || event.headers?.Origin || "";
}

function corsHeaders(event) {
  const origin = getOrigin(event);
  const allowed = allowedOrigins();
  return {
    "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : allowed[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

function jsonResponse(event, statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", ...corsHeaders(event) },
    body: JSON.stringify(body),
  };
}

/** Solo acepta peticiones hechas desde el propio sitio */
function assertAllowedOrigin(event) {
  if (!allowedOrigins().includes(getOrigin(event))) {
    throw new HttpError(403, "Origen no permitido");
  }
}

/**
 * Respuestas comunes a cualquier función: preflight CORS y método no permitido.
 * Devuelve la respuesta a enviar, o null si la petición es un POST válido.
 */
function handlePreflightAndMethod(event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders(event), body: "" };
  }
  if (event.httpMethod !== "POST") {
    return jsonResponse(event, 405, { success: false, message: "Método no permitido" });
  }
  return null;
}

function parseJsonBody(event) {
  if (!event.body) {
    throw new HttpError(400, "La solicitud no tiene contenido");
  }
  const raw = event.isBase64Encoded ? Buffer.from(event.body, "base64").toString("utf8") : event.body;
  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
    throw new HttpError(413, "La solicitud es demasiado grande");
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new HttpError(400, "El formato de la solicitud no es válido");
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new HttpError(400, "El formato de la solicitud no es válido");
  }
  return data;
}

/** Limpia un texto recibido: quita caracteres de control y espacios de los extremos */
function sanitizeText(value) {
  if (typeof value !== "string") return "";
  return value.normalize("NFC").replace(CONTROL_CHARS, "").trim();
}

/** Texto obligatorio con longitud máxima; lanza 400 si no cumple */
function requireText(value, fieldLabel, maxLength) {
  const text = sanitizeText(value);
  if (!text) {
    throw new HttpError(400, `El campo ${fieldLabel} es obligatorio`);
  }
  if (text.length > maxLength) {
    throw new HttpError(400, `El campo ${fieldLabel} supera ${maxLength} caracteres`);
  }
  return text;
}

/** Valor que debe pertenecer a una lista cerrada; lanza 400 si no */
function requireOneOf(value, allowedValues, fieldLabel) {
  if (!allowedValues.includes(value)) {
    throw new HttpError(400, `El campo ${fieldLabel} no es válido`);
  }
  return value;
}

function requireUuid(value, fieldLabel) {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    throw new HttpError(400, `El campo ${fieldLabel} no es válido`);
  }
  return value.toLowerCase();
}

function isValidEmail(value) {
  return EMAIL_PATTERN.test(value);
}

function getClientIp(event) {
  return event.headers?.["x-nf-client-connection-ip"] || "";
}

/** Convierte cualquier error en una respuesta, sin filtrar detalles internos */
function errorResponse(event, functionName, error) {
  if (error instanceof HttpError) {
    return jsonResponse(event, error.statusCode, { success: false, message: error.message });
  }
  console.error(`[${functionName}] Error interno: ${error.message}`);
  return jsonResponse(event, 500, {
    success: false,
    message: "Ocurrió un error interno. Intenta de nuevo más tarde.",
  });
}

module.exports = {
  HttpError,
  getEnv,
  jsonResponse,
  assertAllowedOrigin,
  handlePreflightAndMethod,
  parseJsonBody,
  sanitizeText,
  requireText,
  requireOneOf,
  requireUuid,
  isValidEmail,
  getClientIp,
  errorResponse,
};