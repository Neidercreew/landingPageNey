"use strict";

/* =========================================================
   POST /api/contact
   Recibe el formulario, verifica que sea humano, lo guarda en
   Airtable y avisa por correo (backend.md §3.1 y §4.2).
   ========================================================= */

const {
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
} = require("../lib/http");
const { verifyRecaptcha, createAirtableRecord, sendEmailNotification } = require("../lib/services");

const FUNCTION_NAME = "contact";
const RECAPTCHA_ACTION = "contact";
const SUCCESS_MESSAGE = "Contacto recibido correctamente";
const LIMITS = Object.freeze({ name: 100, email: 254, message: 2000, recaptchaToken: 4000 });

// Valor que llega del formulario -> opción del "Single select" en Airtable
const INTEREST_LABELS = Object.freeze({ empleo: "Empleo", freelance: "Freelance" });
const INITIAL_FOLLOW_UP_STATUS = "Nuevo";

function validateContact(body) {
  const email = requireText(body.email, "email", LIMITS.email).toLowerCase();
  if (!isValidEmail(email)) {
    throw new HttpError(400, "El email no tiene un formato válido");
  }

  return {
    name: requireText(body.name, "nombre", LIMITS.name),
    email,
    message: requireText(body.message, "mensaje", LIMITS.message),
    interestType: requireOneOf(body.interest_type, Object.keys(INTEREST_LABELS), "tipo de interés"),
    sessionId: requireUuid(body.session_id, "session_id"),
    recaptchaToken: requireText(body.recaptcha_token, "recaptcha_token", LIMITS.recaptchaToken),
  };
}

function formatBogotaDate(date) {
  return date.toLocaleString("es-CO", { timeZone: "America/Bogota", dateStyle: "long", timeStyle: "short" });
}

async function saveContact(contact) {
  await createAirtableRecord({
    baseId: getEnv("AIRTABLE_BASE_ID"),
    table: process.env.AIRTABLE_CONTACTS_TABLE || "Contacts",
    fields: {
      Name: contact.name,
      Email: contact.email,
      "Interest Type": INTEREST_LABELS[contact.interestType],
      Message: contact.message,
      "Session ID": contact.sessionId,
      "Follow-up Status": INITIAL_FOLLOW_UP_STATUS,
    },
  });
}

async function notifyOwner(contact) {
  await sendEmailNotification({
    to_email: getEnv("NOTIFICATION_EMAIL"),
    from_name: contact.name,
    from_email: contact.email,
    reply_to: contact.email,
    interest_type: INTEREST_LABELS[contact.interestType],
    message: contact.message,
    submission_date: formatBogotaDate(new Date()),
  });
}

exports.handler = async (event) => {
  const earlyResponse = handlePreflightAndMethod(event);
  if (earlyResponse) return earlyResponse;

  try {
    assertAllowedOrigin(event);
    const body = parseJsonBody(event);

    // Honeypot lleno = bot. Se responde "éxito" para no darle pistas (backend.md §6.1)
    if (sanitizeText(body.honeypot) !== "") {
      return jsonResponse(event, 200, { success: true, message: SUCCESS_MESSAGE });
    }

    const contact = validateContact(body);

    const isHuman = await verifyRecaptcha(contact.recaptchaToken, RECAPTCHA_ACTION, getClientIp(event));
    if (!isHuman) {
      throw new HttpError(400, "No pudimos verificar el envío. Intenta de nuevo.");
    }

    await saveContact(contact);

    // El contacto ya quedó guardado: si el correo falla, no se pide al visitante reenviar
    // (evita registros duplicados). El error queda en los logs de Netlify.
    try {
      await notifyOwner(contact);
    } catch (error) {
      console.error(`[${FUNCTION_NAME}] Contacto guardado, pero falló la notificación: ${error.message}`);
    }

    return jsonResponse(event, 200, { success: true, message: SUCCESS_MESSAGE });
  } catch (error) {
    return errorResponse(event, FUNCTION_NAME, error);
  }
};