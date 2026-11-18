"use strict";

/* =========================================================
   Envía un correo de prueba con EmailJS usando la MISMA lógica
   que la función de contacto. Sirve para validar las credenciales
   desde la terminal antes de configurarlas en Netlify.

   Uso (PowerShell):
     $env:EMAILJS_SERVICE_ID  = "service_xxxxxxx"
     $env:EMAILJS_TEMPLATE_ID = "template_xxxxxxx"
     $env:EMAILJS_PUBLIC_KEY  = "tu_public_key"
     $env:EMAILJS_PRIVATE_KEY = Read-Host "Private Key de EmailJS"
     $env:NOTIFICATION_EMAIL  = "tu-correo@ejemplo.com"
     node scripts/test-emailjs.js
   ========================================================= */

const { buildNotificationParams } = require("../netlify/functions/contact");
const { sendEmailNotification } = require("../netlify/lib/services");

const REQUIRED_VARS = [
  "EMAILJS_SERVICE_ID",
  "EMAILJS_TEMPLATE_ID",
  "EMAILJS_PUBLIC_KEY",
  "EMAILJS_PRIVATE_KEY",
  "NOTIFICATION_EMAIL",
];

// Pistas para los errores más comunes que devuelve EmailJS
const HINTS = [
  [/non-browser/i, "Activa 'Allow EmailJS API for non-browser applications' en Account → Security."],
  [/private key|access ?token/i, "Revisa EMAILJS_PRIVATE_KEY y que 'Use Private Key' esté activo en Account → Security."],
  [/public key|user id/i, "Revisa EMAILJS_PUBLIC_KEY (Account → General)."],
  [/service/i, "Revisa EMAILJS_SERVICE_ID (Email Services)."],
  [/template/i, "Revisa EMAILJS_TEMPLATE_ID (Email Templates)."],
];

async function main() {
  const missing = REQUIRED_VARS.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Faltan variables de entorno: ${missing.join(", ")}`);
  }

  const testContact = {
    name: "Prueba de configuración",
    email: process.env.NOTIFICATION_EMAIL,
    message: "Correo de prueba enviado con scripts/test-emailjs.js. Si lo recibes, EmailJS quedó bien configurado.",
    interestType: "empleo",
  };

  await sendEmailNotification(buildNotificationParams(testContact, new Date()));
  console.log(`✔ Correo de prueba enviado. Revisa la bandeja de ${process.env.NOTIFICATION_EMAIL} (y la carpeta de spam).`);
}

main().catch((error) => {
  console.error(`\n✖ ${error.message}`);
  // Las pistas solo aplican a respuestas de EmailJS, no a variables faltantes
  const hint = error.message.startsWith("EmailJS") && HINTS.find(([pattern]) => pattern.test(error.message));
  if (hint) console.error(`  → ${hint[1]}`);
  process.exitCode = 1;
});
