# Especificaciones Técnicas — Backend

Versión: 2.0

Fecha: 22 de septiembre de 2026

Estado: Aprobado para implementación (corregido tras auditoría técnica)

---

## 0. Control de Cambios

| Versión | Fecha | Cambio |
|---------|-------|--------|
| 1.0 | 08/09/2026 | Versión inicial |
| 2.0 | 22/09/2026 | Contratos alineados con `Arquitectura.md` §7 (respuestas con `code`), enums en minúscula, reCAPTCHA también en analytics, dos workspaces de Airtable, Personal Access Tokens, EmailJS desde servidor con clave privada, límites reales de los free tiers, honeypot sin contradicción, política de reintentos, pruebas. |

**Documento dueño de los contratos y valores canónicos:** `Arquitectura.md` §7 y §8. Este documento los repite para implementar; si alguna vez difieren, manda `Arquitectura.md`.

---

## 1. Visión General

Backend serverless para la Landing Page de Análisis de Datos. Procesa el formulario de contacto, registra clics en CTAs y notifica al propietario por email. Implementado con Netlify Functions, Airtable, EmailJS y reCAPTCHA v3.

### 1.1 Objetivo

- Guardar los contactos recibidos (leads de empleo y freelance)
- Registrar clics en CTAs para medir rendimiento
- Notificar al propietario por email en cada contacto nuevo
- Permitir calcular la tasa de conversión clic → envío

### 1.2 Restricciones

- Costo total: $0 (free tier de todos los servicios)
- Sin servidor propio ni hosting de pago
- Sin dependencias npm en producción: se usa `fetch` nativo de Node (20 o superior) para todas las APIs
- Ningún secreto en el frontend ni en el repositorio

---

## 2. Servicios y Límites Reales

### 2.1 Netlify (sitio + Functions)

- Funciones en `netlify/functions/`, desplegadas automáticamente desde el repositorio.
- Tiempo máximo de ejecución de una función síncrona: 10 segundos.
- **Plan Free por créditos** (cuentas creadas desde el 04/09/2025): 300 créditos/mes con tope fijo; un deploy de producción cuesta 15 créditos; al agotarse, el sitio se pausa. Presupuesto y reglas en `Arquitectura.md` §10.3.
- Cuentas anteriores (plan legado): 125,000 invocaciones y 100 GB de ancho de banda al mes.

### 2.2 Airtable

| Límite (plan Free) | Valor | Consecuencia para el diseño |
|--------------------|-------|-----------------------------|
| Llamadas API | **1,000 por workspace por mes** (se reinicia el día 1) | Contacts y Analytics en workspaces separados |
| Rate limit | 5 peticiones por segundo por base | Sin impacto con el tráfico esperado |
| Registros | 1,000 por base | Limpieza mensual de Analytics |
| Autenticación | Personal Access Token (las API keys antiguas ya no existen) | Un token por base, con permisos mínimos |

Al superar la cuota mensual, Airtable responde `429`. En el plan Free hay un único periodo de gracia de 30 días la primera vez.

### 2.3 EmailJS

- Límite Free: 200 emails/mes, 2 templates.
- **Por defecto EmailJS bloquea las llamadas que no vienen de un navegador.** Como el envío se hace desde una Netlify Function, hay que activar *Account → Security → "Allow EmailJS API for non-browser applications"*.
- Se usa además la **clave privada** (`accessToken`) para que nadie pueda enviar emails con solo la clave pública.

### 2.4 Google reCAPTCHA v3

- Límite: 10,000 verificaciones/mes (suficiente: un contacto o un clic = una verificación).
- Se usa en **ambos** endpoints.

---

## 3. Estructura del Código

```
netlify/
├── functions/
│   ├── contact.js        → /api/contact
│   └── analytics.js      → /api/analytics/cta-click
└── lib/
    ├── validation.js     → enums, reglas, sanitización, mapeo a Airtable
    ├── recaptcha.js      → verificación con Google
    ├── airtable.js       → createRecord() con timeout y reintento
    └── http.js           → json(status, body), lectura segura del body
```

- Sintaxis de Netlify Functions v2: `export default async (req) => Response`.
- `package.json` en la raíz con `"type": "module"` para usar `import`/`export`.
- Todo lo que se puede probar sin red (validación, sanitización, mapeo, evaluación del resultado de reCAPTCHA) vive en `netlify/lib/` como funciones puras.
- Rutas: las redirecciones `/api/*` → `/.netlify/functions/*` están en `netlify.toml` (`Arquitectura.md` §10.1).

---

## 4. Función de Contactos — `POST /api/contact`

### 4.1 Request

| Campo | Tipo | Requerido | Regla |
|-------|------|-----------|-------|
| `name` | string | Sí | 2–100 caracteres tras `trim` |
| `email` | string | Sí | Formato email válido, máx. 254 caracteres |
| `message` | string | Sí | 10–2000 caracteres tras `trim` |
| `interest_type` | string | Sí | `"empleo"` \| `"freelance"` |
| `lang` | string | No | `"es"` \| `"en"` (por defecto `"es"`) |
| `session_id` | string | Sí | UUID v4 |
| `honeypot` | string | Sí | Debe llegar vacío (`""`) |
| `recaptcha_token` | string | Sí | Token reCAPTCHA v3, acción `contact` |

Campos adicionales se ignoran.

### 4.2 Responses

| HTTP | Body | Cuándo |
|------|------|--------|
| 200 | `{ "success": true, "code": "OK" }` | Contacto guardado (aunque el email falle) |
| 200 | `{ "success": true, "code": "OK" }` | Honeypot lleno (descartado en silencio) |
| 400 | `{ "success": false, "code": "VALIDATION_ERROR", "fields": [...] }` | Campos inválidos |
| 403 | `{ "success": false, "code": "RECAPTCHA_FAILED" }` | reCAPTCHA no superado |
| 405 | `{ "success": false, "code": "METHOD_NOT_ALLOWED" }` | Método distinto de POST |
| 503 | `{ "success": false, "code": "SERVICE_UNAVAILABLE" }` | Airtable responde 429 |
| 500 | `{ "success": false, "code": "SERVER_ERROR" }` | Cualquier otro error |

### 4.3 Orden de Procesamiento

1. Si el método no es `POST` → `405`.
2. Leer el body; si supera 10 KB o no es JSON válido → `400 VALIDATION_ERROR` con `fields: []`.
3. Si `honeypot` tiene contenido → `200 OK` **sin** seguir procesando.
4. Validar todos los campos (§7.3). Si hay errores → `400` con la lista de campos inválidos.
5. Verificar reCAPTCHA con acción esperada `contact` (§11). Si falla → `403`.
6. Sanitizar (§7.4).
7. Escribir en Airtable, tabla `Contacts` (§9). Si Airtable responde 429 → `503`; otro error → `500`.
8. Enviar notificación por EmailJS (§10). **Si falla, se registra en el log y se continúa**: el contacto ya está guardado y es la fuente de verdad.
9. Responder `200 OK`.

La validación (paso 4) va antes de reCAPTCHA (paso 5) para no gastar verificaciones en peticiones mal formadas. El honeypot va primero porque no cuesta nada.

---

## 5. Función de Analytics — `POST /api/analytics/cta-click`

### 5.1 Request

| Campo | Tipo | Requerido | Regla |
|-------|------|-----------|-------|
| `cta_type` | string | Sí | `"employment_inquiry"` \| `"freelance_service"` \| `"general_contact"` |
| `source` | string | Sí | `"hero"` \| `"footer"` |
| `session_id` | string | Sí | UUID v4 |
| `recaptcha_token` | string | Sí | Token reCAPTCHA v3, acción `cta_click` |

### 5.2 Responses

Mismos códigos que §4.2 (sin el caso de honeypot).

### 5.3 Orden de Procesamiento

1. `405` si no es `POST`.
2. Leer body (máx. 10 KB); JSON inválido → `400`.
3. Validar enums y UUID → `400` si falla.
4. Verificar reCAPTCHA con acción esperada `cta_click` → `403` si falla.
5. Escribir en Airtable, tabla `Analytics` (workspace separado) → `503`/`500` según el error.
6. Responder `200 OK`.

---

## 6. Distinción de Leads: Empleo vs Freelance

| Capa | Valor |
|------|-------|
| API (`interest_type`) | `empleo` / `freelance` |
| Airtable (`Interest Type`) | `empleo` / `freelance` (mismas opciones, coincidencia exacta) |
| Email de notificación (solo visual) | `Empleo` / `Freelance` |

El mapeo a etiquetas capitalizadas ocurre **únicamente** al armar el email:

```js
const INTEREST_LABELS = { empleo: "Empleo", freelance: "Freelance" };
```

El origen del valor está en el formulario: el selector de interés es visible, el CTA lo preselecciona y el usuario puede cambiarlo (`Arquitectura.md` §6.3). Un contacto que llega desde el menú o desde el CTA del footer también trae `interest_type`, porque el selector es obligatorio.

---

## 7. Seguridad

### 7.1 Honeypot

- En el HTML el campo se llama `website`; en el JSON viaja como `honeypot`.
- Oculto fuera de pantalla (no con `display: none`).
- Si trae contenido: responder `200 OK` sin escribir en Airtable ni enviar email. **No** se responde error, para no darle al bot una señal de rechazo.

### 7.2 reCAPTCHA v3

Detalle en §11. Se exige en ambos endpoints, con acción distinta para cada uno.

### 7.3 Reglas de Validación (servidor)

| Campo | Regla |
|-------|-------|
| `name` | string; tras `trim`, longitud 2–100 |
| `email` | string; tras `trim`, longitud ≤ 254 y coincide con `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` |
| `message` | string; tras `trim`, longitud 10–2000 |
| `interest_type` | exactamente `empleo` o `freelance` (sensible a mayúsculas) |
| `lang` | ausente, `es` o `en` |
| `session_id` | coincide con `/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i` |
| `cta_type` | exactamente uno de los tres valores canónicos |
| `source` | exactamente `hero` o `footer` |
| `recaptcha_token` | string no vacío, máx. 4,000 caracteres |

El frontend usa exactamente las mismas expresiones regulares y límites.

### 7.4 Sanitización

Se aplica a `name`, `email` y `message` después de validar:

1. `trim`.
2. Eliminar caracteres de control (excepto saltos de línea en `message`).
3. Neutralizar fórmulas: si `name` o `message` empiezan con `=`, `+`, `-` o `@`, anteponer `'`. Esto evita que un contacto malicioso ejecute fórmulas cuando se exporte a CSV y se abra en Excel.

No se elimina HTML del texto: Airtable y EmailJS (con `{{variable}}`, dos llaves) lo muestran como texto plano. **Nunca** usar `{{{variable}}}` (tres llaves) en el template de EmailJS, porque eso inserta HTML sin escapar.

### 7.5 Protección Contra Abuso

No se implementa rate limiting en memoria: en serverless la memoria no persiste entre invocaciones, así que no protegería nada. Las protecciones reales son reCAPTCHA en ambos endpoints, validación estricta, límite de 10 KB en el body, deduplicación de clics en el cliente y workspaces de Airtable separados (`Arquitectura.md` §9.5).

### 7.6 CORS

No aplica: frontend y funciones comparten dominio. Las funciones **no** envían cabeceras `Access-Control-Allow-*`.

### 7.7 Logs

- Registrar con `console.error` el tipo de error y el código HTTP de servicios externos.
- **Nunca** registrar tokens, claves, el body completo ni el email/mensaje del usuario.

---

## 8. Variables de Entorno

### 8.1 Producción (configuradas en Netlify)

| Variable | Propósito | Ejemplo |
|----------|-----------|---------|
| `AIRTABLE_LEADS_TOKEN` | Personal Access Token con acceso solo a la base `Leads` | `patXXXXXXXXXXXXXX` |
| `AIRTABLE_LEADS_BASE_ID` | ID de la base `Leads` | `appXXXXXXXXXXXXXX` |
| `AIRTABLE_CONTACTS_TABLE` | Nombre de la tabla de contactos | `Contacts` |
| `AIRTABLE_ANALYTICS_TOKEN` | Personal Access Token con acceso solo a la base `Analytics` | `patXXXXXXXXXXXXXX` |
| `AIRTABLE_ANALYTICS_BASE_ID` | ID de la base `Analytics` | `appXXXXXXXXXXXXXX` |
| `AIRTABLE_ANALYTICS_TABLE` | Nombre de la tabla de analytics | `Analytics` |
| `EMAILJS_SERVICE_ID` | Servicio de EmailJS | `service_xxxxxxx` |
| `EMAILJS_TEMPLATE_ID` | Template de notificación | `template_xxxxxxx` |
| `EMAILJS_PUBLIC_KEY` | Clave pública de EmailJS | `xxxxxxxxxxxxxxx` |
| `EMAILJS_PRIVATE_KEY` | Clave privada de EmailJS | `xxxxxxxxxxxxxxx` |
| `NOTIFICATION_EMAIL` | Correo que recibe los avisos | `usuario@ejemplo.com` |
| `RECAPTCHA_SECRET_KEY` | Clave secreta de reCAPTCHA v3 | `6LfXXXXXXXXXXXX` |

Configuración: Netlify → *Site configuration → Environment variables*. Cada función valida al arrancar que sus variables existan; si falta alguna, responde `500 SERVER_ERROR` y lo registra en el log.

### 8.2 Solo Desarrollo Local

| Variable | Propósito |
|----------|-----------|
| `RECAPTCHA_BYPASS` | Con valor `true`, omite la verificación de reCAPTCHA para poder probar con `curl`. **Solo tiene efecto si también existe `NETLIFY_DEV=true`**, variable que únicamente define `netlify dev`. Nunca se configura en Netlify. |

### 8.3 Archivos

- `.env` (local, en `.gitignore`) con los valores reales para `netlify dev`.
- `.env.example` (en el repositorio) con los nombres de las variables y valores vacíos.

### 8.4 Reglas

- Nunca mostrar valores en logs ni en respuestas.
- Rotar tokens cada 6 meses o de inmediato si se sospecha una fuga.

---

## 9. Integración con Airtable

### 9.1 Configuración

| Workspace | Base | Tabla |
|-----------|------|-------|
| `Portfolio Leads` | `Leads` | `Contacts` |
| `Portfolio Analytics` | `Analytics` | `Analytics` |

Los dos workspaces pertenecen a la misma cuenta del propietario. El ID de cada base aparece en su URL, después de `airtable.com/` y empieza por `app`.

### 9.2 Personal Access Tokens

1. Ir a `https://airtable.com/create/tokens`.
2. Crear el token `landing-leads` con el scope `data.records:write` y acceso **solo** a la base `Leads`.
3. Crear el token `landing-analytics` con el scope `data.records:write` y acceso **solo** a la base `Analytics`.
4. Guardar cada token en su variable de entorno (§8.1).

No se piden scopes de lectura ni de esquema: las funciones solo crean registros.

### 9.3 Mapeo JSON → Airtable

**Contacts**

| JSON | Campo Airtable | Tipo Airtable |
|------|----------------|---------------|
| `name` | `Name` | Single line text |
| `email` | `Email` | Email |
| `interest_type` | `Interest Type` | Single select (`empleo`, `freelance`) |
| `message` | `Message` | Long text |
| `lang` | `Language` | Single select (`es`, `en`) |
| `session_id` | `Session ID` | Single line text |
| — | `Submission Date` | Created time (automático) |
| — | `Follow-up Status` | Single select (`Nuevo`, `Contactado`, `En proceso`, `Cerrado`); valor por defecto `Nuevo` |
| — | `Notes` | Long text |

**Analytics**

| JSON | Campo Airtable | Tipo Airtable |
|------|----------------|---------------|
| `cta_type` | `CTA Type` | Single select (`employment_inquiry`, `freelance_service`, `general_contact`) |
| `source` | `Source` | Single select (`hero`, `footer`) |
| `session_id` | `Session ID` | Single line text |
| — | `Click Date` | Created time (automático) |

### 9.4 Petición

```
POST https://api.airtable.com/v0/{BASE_ID}/{TABLE_NAME}
Authorization: Bearer {TOKEN}
Content-Type: application/json

{
  "records": [ { "fields": { "Name": "...", "Email": "...", "Interest Type": "empleo", ... } } ],
  "typecast": false
}
```

`typecast: false` hace que Airtable rechace (`422`) cualquier valor que no coincida exactamente con una opción del Single select, en vez de crear opciones nuevas.

### 9.5 Timeouts y Reintentos

| Respuesta de Airtable | Acción | Código al cliente |
|-----------------------|--------|-------------------|
| 200 | Continuar | — |
| 429 (rate limit o cuota mensual) | No reintentar | `503 SERVICE_UNAVAILABLE` |
| 5xx o error de red | Reintentar **una vez** tras 500 ms | Si vuelve a fallar: `500 SERVER_ERROR` |
| 401 / 403 / 404 / 422 | No reintentar (error de configuración o de datos) | `500 SERVER_ERROR` + log |

Cada llamada tiene un timeout de 4 segundos (`AbortController`), para no superar el límite de 10 segundos de la función.

---

## 10. Integración con EmailJS

### 10.1 Configuración

1. Crear cuenta en `https://www.emailjs.com/`.
2. Conectar un servicio de email (Gmail u Outlook) → obtener el **Service ID**.
3. *Account → General* → copiar **Public Key** y **Private Key**.
4. *Account → Security* → activar **"Allow EmailJS API for non-browser applications"**. Sin esto, todas las llamadas desde la función serán rechazadas.
5. Crear el template (§10.2) → obtener el **Template ID**.

### 10.2 Template

- **To Email:** `{{to_email}}`
- **Asunto:** `Nuevo contacto - {{interest_label}} - {{from_name}}`
- **Cuerpo:**
  - Nombre: `{{from_name}}`
  - Email: `{{from_email}}`
  - Tipo de interés: `{{interest_label}}`
  - Idioma: `{{lang}}`
  - Mensaje: `{{message}}`
  - Fecha: `{{submission_date}}`

Siempre dos llaves (`{{ }}`), nunca tres.

### 10.3 Petición desde la Función

```
POST https://api.emailjs.com/api/v1.0/email/send
Content-Type: application/json

{
  "service_id": EMAILJS_SERVICE_ID,
  "template_id": EMAILJS_TEMPLATE_ID,
  "user_id": EMAILJS_PUBLIC_KEY,
  "accessToken": EMAILJS_PRIVATE_KEY,
  "template_params": {
    "to_email": NOTIFICATION_EMAIL,
    "from_name": name,
    "from_email": email,
    "interest_label": INTEREST_LABELS[interest_type],
    "lang": lang,
    "message": message,
    "submission_date": fecha ISO en zona America/Bogota
  }
}
```

Timeout de 4 segundos, sin reintento. Si falla, se registra en el log y la función responde igualmente `200 OK`, porque el contacto ya quedó guardado en Airtable.

### 10.4 Límite

200 emails/mes. Si se agota, los contactos se siguen guardando; el propietario los ve en la vista "Contactos recientes" de Airtable. Alternativas si hiciera falta: Resend o SendGrid (requieren cambios en la función).

---

## 11. Integración con reCAPTCHA v3

### 11.1 Configuración

1. `https://www.google.com/recaptcha/admin` → registrar el sitio con tipo **reCAPTCHA v3**.
2. Dominios: el dominio de Netlify (ej. `tudominio.netlify.app`) y `localhost` para desarrollo.
3. La **Site Key** va en `public/js/script.js`; la **Secret Key** en `RECAPTCHA_SECRET_KEY`.

### 11.2 Verificación

```
POST https://www.google.com/recaptcha/api/siteverify
Content-Type: application/x-www-form-urlencoded

secret={RECAPTCHA_SECRET_KEY}&response={recaptcha_token}
```

La verificación pasa solo si se cumplen **las tres** condiciones:

| Condición | Motivo |
|-----------|--------|
| `success === true` | Token válido y no vencido (vencen a los 2 minutos) |
| `action` igual a la esperada (`contact` o `cta_click`) | Impide reutilizar un token de un endpoint en el otro |
| `score >= 0.5` | Umbral humano/bot |

Si Google no responde en 4 segundos o devuelve error de red → `500 SERVER_ERROR` (no se asume que el usuario es humano).

La evaluación de la respuesta de Google (`evaluateRecaptcha(result, expectedAction)`) es una función pura en `netlify/lib/recaptcha.js`, para poder probarla sin red.

---

## 12. Monitoreo y Mantenimiento

### 12.1 Mensual

1. Uso de llamadas API de cada workspace de Airtable (objetivo: < 800 de 1,000).
2. Número de registros de cada base (objetivo: < 800 de 1,000).
3. Exportar Analytics a CSV y borrar registros de más de 60 días.
4. Emails enviados en EmailJS (objetivo: < 160 de 200).
5. Uso de créditos de Netlify (objetivo: < 240 de 300).
6. Logs de funciones en Netlify (*Logs → Functions*) en busca de errores repetidos.

### 12.2 Semestral

Rotar los tokens de Airtable, la clave privada de EmailJS y revisar que el free tier de cada servicio siga siendo suficiente.

### 12.3 Plan de Escalamiento

| Servicio | Si se supera el límite |
|----------|------------------------|
| Airtable | Plan Team de pago, o migrar Analytics a otra herramienta |
| EmailJS | Resend o SendGrid |
| Netlify | Plan Personal/Pro de pago, o reducir deploys |

---

## 13. Despliegue

### 13.1 Requisitos Previos

Cuentas de Netlify (conectada a GitHub), Airtable (dos workspaces con sus bases), EmailJS (con acceso no-navegador activado) y Google reCAPTCHA v3.

### 13.2 Desarrollo Local

1. Instalar Netlify CLI: `npm install -g netlify-cli`.
2. Crear `.env` a partir de `.env.example`.
3. Ejecutar `netlify dev`: sirve `public/`, las funciones y los redirects de `netlify.toml` en `http://localhost:8888`.

### 13.3 Producción

Push a la rama de producción → Netlify publica `public/` y despliega `netlify/functions/`. Respetar el máximo de 10 deploys de producción por mes (`Arquitectura.md` §10.3).

---

## 14. Pruebas Unitarias

Archivo(s) en `tests/`, ejecutados con `node --test` (script `npm test`). Sin dependencias.

| Módulo | Casos mínimos |
|--------|---------------|
| `validation.js` | Payload válido pasa · `name` de 1 carácter falla · `message` de 2,001 caracteres falla · `interest_type: "Empleo"` falla (mayúscula) · `session_id` no-UUID falla · `cta_type` fuera del enum falla · campos extra se ignoran |
| `validation.js` (sanitización) | Caracteres de control se eliminan · `=SUMA(A1)` se convierte en `'=SUMA(A1)` · saltos de línea en `message` se conservan |
| `validation.js` (mapeo) | `toContactFields()` produce exactamente los nombres de campo de §9.3 |
| `recaptcha.js` | `success:false` falla · acción distinta falla · score 0.4 falla · score 0.5 pasa |

---

## 15. Pruebas de Integración (local con `netlify dev`)

Con `RECAPTCHA_BYPASS=true` en `.env`:

| # | Caso | Resultado esperado |
|---|------|--------------------|
| 1 | Contacto válido | `200 OK`, registro en Contacts, email recibido |
| 2 | Email con formato inválido | `400 VALIDATION_ERROR`, `fields: ["email"]` |
| 3 | `interest_type: "Empleo"` | `400 VALIDATION_ERROR`, `fields: ["interest_type"]` |
| 4 | Honeypot con contenido | `200 OK`, **sin** registro ni email |
| 5 | Método GET | `405 METHOD_NOT_ALLOWED` |
| 6 | Body > 10 KB | `400 VALIDATION_ERROR` |
| 7 | Clic válido en analytics | `200 OK`, registro en Analytics |
| 8 | `source: "sidebar"` | `400 VALIDATION_ERROR`, `fields: ["source"]` |
| 9 | `EMAILJS_SERVICE_ID` incorrecto | `200 OK`, registro en Contacts, error en el log |
| 10 | `AIRTABLE_LEADS_TOKEN` incorrecto | `500 SERVER_ERROR` |

Sin `RECAPTCHA_BYPASS` (o con un token inventado):

| # | Caso | Resultado esperado |
|---|------|--------------------|
| 11 | Token falso | `403 RECAPTCHA_FAILED` |

Ejemplo:

```bash
curl -i -X POST http://localhost:8888/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Ana Prueba","email":"ana@ejemplo.com","message":"Mensaje de prueba local","interest_type":"empleo","lang":"es","session_id":"3f1c2a9e-8b7d-4c6e-9a1b-2d3e4f5a6b7c","honeypot":"","recaptcha_token":"local"}'
```

---

## 16. Criterios de Aceptación

### 16.1 Funcionalidad
- [ ] Ambos endpoints responden exactamente los códigos de §4.2 y §5.2
- [ ] Contacts y Analytics reciben los valores canónicos en minúscula
- [ ] Un valor fuera del enum es rechazado por Airtable (`typecast: false`)
- [ ] El email llega con asunto `Nuevo contacto - Empleo - {nombre}` o `... - Freelance - ...`
- [ ] Si EmailJS falla, el contacto se guarda y la respuesta es `200`
- [ ] Honeypot lleno → `200` sin registro ni email

### 16.2 Seguridad
- [ ] Las 12 variables de §8.1 están en Netlify; `RECAPTCHA_BYPASS` no
- [ ] Ningún secreto en `public/` ni en el repositorio
- [ ] Un token de acción `cta_click` es rechazado en `/api/contact`
- [ ] Los logs no contienen tokens ni datos del usuario
- [ ] La neutralización de fórmulas funciona al exportar a CSV

### 16.3 Rendimiento
- [ ] `/api/contact` responde en < 3 s
- [ ] `/api/analytics/cta-click` responde en < 2 s

### 16.4 Pruebas y Monitoreo
- [ ] `npm test` pasa
- [ ] Los 11 casos de §15 dan el resultado esperado
- [ ] Se puede consultar el uso de llamadas API de ambos workspaces y los créditos de Netlify

---

## Aprobación

| Rol | Estado | Fecha |
|-----|--------|-------|
| Senior Backend Engineer | Aprobado | 22/09/2026 |

---

*Documento generado por Senior Backend Engineer — OpenCode Workspace Framework v1.2*

*v2.0 — Corregido tras auditoría técnica*
