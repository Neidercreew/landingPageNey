"use strict";
const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");

const SITE = "https://neider-pena.netlify.app";
Object.assign(process.env, {
  URL: SITE,
  AIRTABLE_API_KEY: "pat_test", AIRTABLE_BASE_ID: "appTEST",
  EMAILJS_SERVICE_ID: "s", EMAILJS_TEMPLATE_ID: "t", EMAILJS_PUBLIC_KEY: "p", EMAILJS_PRIVATE_KEY: "k",
  NOTIFICATION_EMAIL: "owner@test.com", RECAPTCHA_SECRET_KEY: "secret",
});

const contact = require("../netlify/functions/contact");
const analytics = require("../netlify/functions/analytics");

const SID = "465d8bfd-7634-417f-8c7a-59c76be4086b";
let calls, services;
const ok = (body) => new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });

beforeEach(() => {
  calls = [];
  services = {
    recaptcha: () => ok({ success: true, score: 0.9, action: "contact" }),
    airtable: () => ok({ id: "rec1" }),
    emailjs: () => new Response("OK", { status: 200 }),
  };
  global.fetch = async (url, opts) => {
    const u = String(url);
    const name = u.includes("recaptcha") ? "recaptcha" : u.includes("airtable") ? "airtable" : "emailjs";
    calls.push({ name, url: u, opts });
    return services[name]();
  };
  console.error = () => {}; // silenciar logs esperados en pruebas de error
});

const event = (body, extra = {}) => ({
  httpMethod: "POST",
  headers: { origin: SITE, "x-nf-client-connection-ip": "1.2.3.4" },
  body: typeof body === "string" ? body : JSON.stringify(body),
  ...extra,
});
const validContact = (over = {}) => ({
  name: "Ana Prueba", email: "Ana@Test.com", message: "Tengo una vacante", interest_type: "empleo",
  session_id: SID, honeypot: "", privacy_consent: true, recaptcha_token: "tok", ...over,
});
const parse = (res) => JSON.parse(res.body);

test("contacto válido: verifica, guarda y notifica", async () => {
  const res = await contact.handler(event(validContact()));
  assert.equal(res.statusCode, 200);
  assert.equal(parse(res).success, true);
  assert.deepEqual(calls.map((c) => c.name), ["recaptcha", "airtable", "emailjs"]);
  const record = JSON.parse(calls[1].opts.body);
  const { "Submission Date": submitted, ...rest } = record.fields;
  assert.deepEqual(rest, {
    Name: "Ana Prueba", Email: "ana@test.com", "Interest Type": "Empleo", Message: "Tengo una vacante",
    "Session ID": SID, "Privacy Consent": true, "Follow-up Status": "Nuevo",
  });
  assert.ok(!Number.isNaN(Date.parse(submitted)), "Submission Date debe ser fecha ISO");
  assert.equal(calls[1].opts.headers.Authorization, "Bearer pat_test");
  const mail = JSON.parse(calls[2].opts.body);
  assert.equal(mail.template_params.to_email, "owner@test.com");
  assert.equal(mail.accessToken, "k");
  assert.equal(mail.template_params.title, "Empleo - Ana Prueba");
  assert.equal(mail.template_params.name, "Ana Prueba");
  assert.equal(res.headers["Access-Control-Allow-Origin"], SITE);
});

test("honeypot lleno: responde éxito sin llamar a ningún servicio", async () => {
  const res = await contact.handler(event(validContact({ honeypot: "http://spam" })));
  assert.equal(res.statusCode, 200);
  assert.equal(calls.length, 0);
});

test("email inválido: 400 sin llamar servicios", async () => {
  const res = await contact.handler(event(validContact({ email: "no-es-email" })));
  assert.equal(res.statusCode, 400);
  assert.equal(calls.length, 0);
});

test("campos faltantes, interés inválido, uuid inválido y textos largos: 400", async () => {
  for (const over of [{ name: "  " }, { interest_type: "otro" }, { session_id: "123" }, { message: "x".repeat(2001) }, { recaptcha_token: null }]) {
    const res = await contact.handler(event(validContact(over)));
    assert.equal(res.statusCode, 400, JSON.stringify(over));
  }
  assert.equal(calls.length, 0);
});

test("reCAPTCHA con puntaje bajo o acción distinta: 400 y no guarda", async () => {
  services.recaptcha = () => ok({ success: true, score: 0.2, action: "contact" });
  let res = await contact.handler(event(validContact()));
  assert.equal(res.statusCode, 400);
  services.recaptcha = () => ok({ success: true, score: 0.9, action: "otra" });
  res = await contact.handler(event(validContact()));
  assert.equal(res.statusCode, 400);
  assert.ok(!calls.some((c) => c.name === "airtable"));
});

test("Airtable falla: 500 con mensaje genérico", async () => {
  services.airtable = () => new Response(JSON.stringify({ error: { type: "INVALID_PERMISSIONS" } }), { status: 403 });
  const res = await contact.handler(event(validContact()));
  assert.equal(res.statusCode, 500);
  assert.equal(parse(res).success, false);
  assert.ok(!parse(res).message.includes("INVALID"));
});

test("EmailJS falla después de guardar: igual responde éxito", async () => {
  services.emailjs = () => new Response("API calls are disabled for non-browser applications", { status: 403 });
  const res = await contact.handler(event(validContact()));
  assert.equal(res.statusCode, 200);
});

test("origen ajeno: 403", async () => {
  const res = await contact.handler(event(validContact(), { headers: { origin: "https://malicioso.com" } }));
  assert.equal(res.statusCode, 403);
  assert.equal(calls.length, 0);
});

test("JSON roto, cuerpo vacío y cuerpo gigante", async () => {
  assert.equal((await contact.handler(event("{roto"))).statusCode, 400);
  assert.equal((await contact.handler(event("", { body: "" }))).statusCode, 400);
  assert.equal((await contact.handler(event(validContact({ message: "x".repeat(20000) })))).statusCode, 413);
});

test("GET: 405 y OPTIONS: 204", async () => {
  assert.equal((await contact.handler(event(validContact(), { httpMethod: "GET" }))).statusCode, 405);
  assert.equal((await analytics.handler(event("", { httpMethod: "OPTIONS" }))).statusCode, 204);
});

test("variable de entorno faltante: 500 sin exponer el nombre", async () => {
  const saved = process.env.AIRTABLE_BASE_ID;
  delete process.env.AIRTABLE_BASE_ID;
  const res = await contact.handler(event(validContact()));
  process.env.AIRTABLE_BASE_ID = saved;
  assert.equal(res.statusCode, 500);
  assert.ok(!res.body.includes("AIRTABLE"));
});

test("sin autorización de datos (Ley 1581): 400 y no guarda", async () => {
  for (const over of [{ privacy_consent: false }, { privacy_consent: "true" }, { privacy_consent: undefined }]) {
    assert.equal((await contact.handler(event(validContact(over)))).statusCode, 400, JSON.stringify(over));
  }
  assert.equal(calls.length, 0);
});

test("reCAPTCHA desactivado (sin secreto): guarda sin verificar ni exigir token", async () => {
  const saved = process.env.RECAPTCHA_SECRET_KEY;
  delete process.env.RECAPTCHA_SECRET_KEY;
  const res = await contact.handler(event(validContact({ recaptcha_token: null })));
  process.env.RECAPTCHA_SECRET_KEY = saved;
  assert.equal(res.statusCode, 200);
  assert.deepEqual(calls.map((c) => c.name), ["airtable", "emailjs"]);
});

test("analytics válido: guarda el clic", async () => {
  const res = await analytics.handler(event({ cta_type: "freelance_service", session_id: SID, source: "hero" }));
  assert.equal(res.statusCode, 200);
  const { "Click Date": clicked, ...clickFields } = JSON.parse(calls[0].opts.body).fields;
  assert.deepEqual(clickFields, { "CTA Type": "freelance_service", "Session ID": SID, Source: "hero" });
  assert.ok(!Number.isNaN(Date.parse(clicked)));
  assert.ok(calls[0].url.endsWith("/appTEST/Analytics"));
});

test("analytics de WhatsApp: acepta las ubicaciones fab, contact, menu y footer", async () => {
  for (const source of ["fab", "contact", "menu", "footer"]) {
    const res = await analytics.handler(event({ cta_type: "whatsapp_contact", session_id: SID, source }));
    assert.equal(res.statusCode, 200, source);
  }
  assert.equal(calls.length, 4);
  assert.equal(JSON.parse(calls[0].opts.body).fields["CTA Type"], "whatsapp_contact");
});

test("analytics inválido: 400 sin guardar", async () => {
  for (const b of [{ cta_type: "x", session_id: SID, source: "hero" }, { cta_type: "freelance_service", session_id: SID, source: "navbar" }, { cta_type: "whatsapp_contact", session_id: SID, source: "popup" }]) {
    assert.equal((await analytics.handler(event(b))).statusCode, 400);
  }
  assert.equal(calls.length, 0);
});
