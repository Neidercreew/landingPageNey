"use strict";

/* =========================================================
   Crea (o completa) las tablas Contacts y Analytics en Airtable.
   Se corre UNA vez desde la terminal; no se despliega.

   Uso (PowerShell):
     $env:AIRTABLE_API_KEY = Read-Host "Token de Airtable"
     $env:AIRTABLE_BASE_ID = "appXXXXXXXXXXXXXX"
     node scripts/setup-airtable.js

   El token necesita los scopes schema.bases:read y schema.bases:write.
   Es seguro correrlo varias veces: solo crea lo que falta.
   ========================================================= */

const API = "https://api.airtable.com/v0/meta/bases";
const TIME_ZONE = "America/Bogota";

const dateTimeField = (name) => ({
  name,
  type: "dateTime",
  options: { timeZone: TIME_ZONE, dateFormat: { name: "local" }, timeFormat: { name: "12hour" } },
});
const selectField = (name, choices) => ({
  name,
  type: "singleSelect",
  options: { choices: choices.map((choice) => ({ name: choice })) },
});

// El primer campo de cada tabla es su campo principal
const SCHEMA = [
  {
    name: "Contacts",
    fields: [
      { name: "Name", type: "singleLineText" },
      { name: "Email", type: "email" },
      selectField("Interest Type", ["Empleo", "Freelance"]),
      { name: "Message", type: "multilineText" },
      { name: "Session ID", type: "singleLineText" },
      dateTimeField("Submission Date"),
      { name: "Privacy Consent", type: "checkbox", options: { color: "greenBright", icon: "check" } },
      selectField("Follow-up Status", ["Nuevo", "Contactado", "En proceso", "Cerrado"]),
      { name: "Notes", type: "multilineText" },
    ],
  },
  {
    name: "Analytics",
    fields: [
      { name: "Session ID", type: "singleLineText" },
      selectField("CTA Type", ["employment_inquiry", "freelance_service"]),
      { name: "Source", type: "singleLineText" },
      dateTimeField("Click Date"),
    ],
  },
];

function readConfig() {
  const token = (process.env.AIRTABLE_API_KEY || "").trim();
  const baseId = (process.env.AIRTABLE_BASE_ID || "").trim();
  if (!token.startsWith("pat")) {
    throw new Error("Falta AIRTABLE_API_KEY (el token empieza por 'pat').");
  }
  if (!/^app[a-zA-Z0-9]{14}$/.test(baseId)) {
    throw new Error("AIRTABLE_BASE_ID no es válido: debe empezar por 'app' y tener 17 caracteres.");
  }
  return { token, baseId };
}

async function airtable(config, method, path, body) {
  const response = await fetch(`${API}/${config.baseId}${path}`, {
    method,
    headers: { Authorization: `Bearer ${config.token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const type = data?.error?.type || data?.error || "desconocido";
    const message = data?.error?.message ? ` - ${data.error.message}` : "";
    throw new Error(`Airtable respondió HTTP ${response.status} (${type})${message}`);
  }
  return data;
}

async function ensureTable(config, existingTables, tableSpec) {
  const table = existingTables.find((t) => t.name === tableSpec.name);

  if (!table) {
    await airtable(config, "POST", "/tables", tableSpec);
    console.log(`✔ Tabla "${tableSpec.name}" creada con ${tableSpec.fields.length} campos`);
    return;
  }

  console.log(`• La tabla "${tableSpec.name}" ya existe; reviso sus campos`);
  for (const fieldSpec of tableSpec.fields) {
    const field = table.fields.find((f) => f.name === fieldSpec.name);
    if (!field) {
      await airtable(config, "POST", `/tables/${table.id}/fields`, fieldSpec);
      console.log(`  ✔ Campo "${fieldSpec.name}" creado`);
    } else if (field.type !== fieldSpec.type) {
      console.log(
        `  ⚠ "${fieldSpec.name}" existe como ${field.type} (se esperaba ${fieldSpec.type}). ` +
          "Funciona igual; si quieres el tipo correcto, bórralo en Airtable y vuelve a correr el script."
      );
    } else {
      console.log(`  ✔ Campo "${fieldSpec.name}" correcto`);
    }
  }
}

async function main() {
  const config = readConfig();
  const { tables } = await airtable(config, "GET", "/tables");
  for (const tableSpec of SCHEMA) {
    await ensureTable(config, tables, tableSpec);
  }
  console.log("\nListo. Airtable quedó con la estructura que esperan las funciones.");
}

main().catch((error) => {
  console.error(`\n✖ ${error.message}`);
  process.exitCode = 1;
});