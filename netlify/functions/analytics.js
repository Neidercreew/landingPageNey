"use strict";

/* =========================================================
   POST /api/analytics/cta-click
   Registra en Airtable cada clic en un CTA, con el session_id
   que permite medir la conversión clic -> envío (backend.md §3.2).
   ========================================================= */

const {
  getEnv,
  jsonResponse,
  assertAllowedOrigin,
  handlePreflightAndMethod,
  parseJsonBody,
  requireOneOf,
  requireUuid,
  errorResponse,
} = require("../lib/http");
const { createAirtableRecord } = require("../lib/services");

const FUNCTION_NAME = "analytics";
const CTA_TYPES = Object.freeze(["employment_inquiry", "freelance_service"]);
const SOURCES = Object.freeze(["hero", "footer"]);

function validateClick(body) {
  return {
    ctaType: requireOneOf(body.cta_type, CTA_TYPES, "cta_type"),
    sessionId: requireUuid(body.session_id, "session_id"),
    source: requireOneOf(body.source, SOURCES, "source"),
  };
}

exports.handler = async (event) => {
  const earlyResponse = handlePreflightAndMethod(event);
  if (earlyResponse) return earlyResponse;

  try {
    assertAllowedOrigin(event);
    const click = validateClick(parseJsonBody(event));

    await createAirtableRecord({
      // Base opcional aparte para analytics: cada base del plan gratuito tiene su propio límite de registros
      baseId: process.env.AIRTABLE_ANALYTICS_BASE_ID || getEnv("AIRTABLE_BASE_ID"),
      table: process.env.AIRTABLE_ANALYTICS_TABLE || "Analytics",
      fields: {
        "CTA Type": click.ctaType,
        "Session ID": click.sessionId,
        Source: click.source,
      },
    });

    return jsonResponse(event, 200, { success: true, message: "Analytics registrado" });
  } catch (error) {
    return errorResponse(event, FUNCTION_NAME, error);
  }
};