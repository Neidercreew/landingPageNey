# Arquitectura Técnica — Landing Page de Análisis de Datos

Versión: 3.0

Fecha: 22 de septiembre de 2026

Estado: Aprobado para implementación (corregido tras auditoría técnica)

---

## 0. Control de Cambios

| Versión | Fecha | Cambio |
|---------|-------|--------|
| 2.0 | 08/09/2026 | Especificaciones de backend integradas |
| 3.0 | 22/09/2026 | Correcciones de la auditoría técnica: contratos API y valores canónicos unificados, `netlify.toml` especificado, carpeta `public/`, límites reales de Airtable/Netlify/EmailJS, analytics protegido, paleta con valores hex verificados, i18n y accesibilidad completadas, estrategia de pruebas. Detalle en `Documentos/Respuesta-Auditoria.md`. |

---

## 1. Visión General del Sistema

Landing Page de propósito dual (portafolio profesional + captación de clientes freelance) construida con tecnologías web nativas en el frontend, integrada con servicios serverless gratuitos para backend, almacenamiento y notificaciones.

### 1.1 Características Principales

- Frontend estático con HTML/CSS/JavaScript puro, publicado desde la carpeta `public/`
- Backend serverless mediante Netlify Functions (hosting y funciones en el mismo dominio)
- Almacenamiento de contactos en Airtable (free tier)
- Registro de clics en CTAs en un workspace de Airtable separado (aislamiento de cuota)
- Notificaciones por email al propietario vía EmailJS (API REST desde el servidor)
- Protección anti-spam con honeypot + reCAPTCHA v3 en ambos endpoints
- Panel de administración / CRM básico en vistas nativas de Airtable
- Internacionalización ES/EN en cliente con persistencia local
- Diseño responsive mobile-first
- Accesibilidad WCAG 2.1 AA
- Costo total: $0

### 1.2 Fuentes de Verdad

Para evitar que los documentos se contradigan, cada tema tiene un documento dueño. Los demás documentos pueden resumirlo, pero ante cualquier diferencia manda el documento dueño.

| Tema | Documento dueño |
|------|-----------------|
| Alcance, público, objetivos, restricciones de negocio | `Brief.md` |
| Estructura del repo, contratos API, valores canónicos, modelo de datos, despliegue, seguridad | `Arquitectura.md` (este documento) |
| Implementación de funciones, integraciones externas, pruebas de backend | `backend.md` |
| Componentes, contenido, claves i18n, estados de UI, pruebas de frontend | `frontend.md` |

---

## 2. Arquitectura de Capas

```
┌──────────────────────────────────────────────────────────────┐
│                    USUARIO (Navegador)                       │
└───────────────────────────┬──────────────────────────────────┘
                            │ HTTPS (mismo dominio)
┌───────────────────────────▼──────────────────────────────────┐
│  NETLIFY — sitio estático (carpeta public/)                  │
│  index.html · css/style.css · js/script.js ·                 │
│  js/translations.js · assets/images/                         │
└───────────────────────────┬──────────────────────────────────┘
                            │ fetch POST JSON → /api/*
┌───────────────────────────▼──────────────────────────────────┐
│  NETLIFY FUNCTIONS (netlify/functions/)                      │
│  contact.js   ← /api/contact                                 │
│  analytics.js ← /api/analytics/cta-click                     │
└──────┬────────────────────┬────────────────────┬─────────────┘
       │                    │                    │
┌──────▼─────────┐  ┌───────▼────────┐  ┌────────▼────────────┐
│ reCAPTCHA v3   │  │ AIRTABLE       │  │ EMAILJS             │
│ siteverify     │  │ WS "Leads":    │  │ REST API            │
│ (ambos         │  │   Contacts     │  │ (solo contact.js)   │
│  endpoints)    │  │ WS "Analytics":│  │                     │
│                │  │   Analytics    │  │                     │
└────────────────┘  └────────────────┘  └─────────────────────┘
```

### 2.1 Capa de Presentación
Estructura semántica HTML5, hoja de estilos CSS3 con variables personalizadas, textos traducibles mediante atributos `data-i18n*`.

### 2.2 Capa de Lógica de Cliente
Motor de internacionalización, persistencia en localStorage/sessionStorage, validación y envío del formulario, navegación (scroll suave, sección activa, drawer móvil), rastreo de CTAs, carga diferida de reCAPTCHA.

### 2.3 Capa de Backend Serverless
Dos funciones independientes (contactos y analytics) con validación, verificación de reCAPTCHA, escritura en Airtable y, solo para contactos, notificación por email. Código compartido en `netlify/lib/`.

### 2.4 Capa de Datos
Dos bases de Airtable ubicadas en **workspaces distintos**, porque el límite de 1,000 llamadas API/mes del plan Free se aplica por workspace. Así, un abuso del endpoint de analytics nunca puede agotar la cuota del formulario de contacto.

---

## 3. Estructura del Repositorio

Estructura canónica. No existe carpeta `default.project/`: la raíz del repositorio es la raíz del proyecto.

```
/ (raíz del repositorio)
├── public/                      ← ÚNICA carpeta publicada por Netlify
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── script.js
│   │   └── translations.js
│   └── assets/
│       └── images/
│           ├── og-image.png     (1200×630, ≤ 150 KB)
│           └── favicon.ico
├── netlify/
│   ├── functions/
│   │   ├── contact.js           → /api/contact
│   │   └── analytics.js         → /api/analytics/cta-click
│   └── lib/                     ← código compartido (no son funciones)
│       ├── validation.js        (validación, sanitización, enums)
│       ├── recaptcha.js         (verificación con Google)
│       ├── airtable.js          (escritura con reintento)
│       └── http.js              (respuestas JSON estándar)
├── tests/
│   └── *.test.js                (node --test, sin dependencias)
├── netlify.toml
├── package.json                 ("type": "module", script de pruebas)
├── .env.example                 (nombres de variables, sin valores reales)
├── .gitignore                   (.env, node_modules/, .netlify/)
├── Documentos/                  ← NO se publica
│   ├── Brief.md
│   ├── Arquitectura.md
│   ├── backend.md
│   ├── frontend.md
│   └── Respuesta-Auditoria.md
└── Agentes/                     ← NO se publica
```

**Por qué `public/`:** si Netlify publicara la raíz, cualquier persona podría abrir `/Documentos/Arquitectura.md` o `/netlify/functions/contact.js` desde el navegador.

---

## 4. Diseño Visual

### 4.1 Paleta de Colores (valores definitivos)

| Variable CSS | Hex | Uso |
|--------------|-----|-----|
| `--color-primary` | `#1D4ED8` | Encabezados, CTA primario (fondo), enlaces de navegación activos |
| `--color-primary-hover` | `#1E40AF` | Hover/active del CTA primario |
| `--color-accent` | `#2563EB` | CTA secundario (texto y borde), enlaces, anillo de foco |
| `--color-text` | `#1F2937` | Texto principal |
| `--color-text-muted` | `#4B5563` | Texto secundario |
| `--color-bg` | `#FFFFFF` | Fondo principal |
| `--color-bg-alt` | `#F3F4F6` | Fondos alternados de sección |
| `--color-badge-bg` | `#DBEAFE` | Fondo de badges de habilidades |
| `--color-border-input` | `#6B7280` | Borde de campos de formulario |
| `--color-border-subtle` | `#E5E7EB` | Bordes decorativos (tarjetas) |
| `--color-success` | `#15803D` | Mensajes de éxito |
| `--color-error` | `#B91C1C` | Mensajes de error |

**Contraste verificado (WCAG 2.1 AA):**

| Combinación | Ratio | Requisito | Resultado |
|-------------|-------|-----------|-----------|
| Texto blanco sobre `--color-primary` | 6.70:1 | 4.5:1 | ✅ |
| Texto blanco sobre `--color-primary-hover` | 8.72:1 | 4.5:1 | ✅ |
| `--color-accent` sobre blanco | 5.17:1 | 4.5:1 | ✅ |
| `--color-accent` sobre `--color-bg-alt` | 4.70:1 | 4.5:1 | ✅ |
| `--color-primary` sobre `--color-bg-alt` | 6.09:1 | 4.5:1 | ✅ |
| `--color-text` sobre blanco | 14.68:1 | 4.5:1 | ✅ |
| `--color-text` sobre `--color-bg-alt` | 13.34:1 | 4.5:1 | ✅ |
| `--color-text-muted` sobre blanco | 7.56:1 | 4.5:1 | ✅ |
| `--color-text-muted` sobre `--color-bg-alt` | 6.87:1 | 4.5:1 | ✅ |
| `--color-primary` sobre `--color-badge-bg` | 5.49:1 | 4.5:1 | ✅ |
| `--color-success` sobre blanco | 5.02:1 | 4.5:1 | ✅ |
| `--color-error` sobre blanco | 6.47:1 | 4.5:1 | ✅ |
| `--color-border-input` sobre blanco (componente UI) | 4.83:1 | 3:1 | ✅ |
| Anillo de foco `--color-accent` sobre blanco | 5.17:1 | 3:1 | ✅ |

`--color-border-subtle` es solo decorativo; nunca debe ser el único borde de un control interactivo.

### 4.2 Tipografía

Fuentes del sistema, sin descargas externas (cumple "cero CDN" y evita saltos de layout):

- **Principal:** `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`
- **Acentos técnicos** (badges, etiquetas de estado, cifras): `ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace`
- **Pesos:** 400, 500, 600, 700
- **Escala:** modular 1.25, base 16px (móvil) / 18px (desktop)

### 4.3 Espaciado

Múltiplos de 8px (con 4px para ajustes finos): 4, 8, 16, 24, 32, 48, 64.

### 4.4 Breakpoints (mobile-first)

| Nombre | Rango | Media query |
|--------|-------|-------------|
| Móvil | 0 – 576px | Estilos base (sin media query) |
| Tablet | 577px – 991px | `@media (min-width: 577px)` |
| Desktop | 992px en adelante | `@media (min-width: 992px)` |

Mobile-first se implementa **siempre con `min-width`**: los estilos base son los de móvil y las media queries los amplían.

### 4.5 Componentes Visuales (resumen)

- **Navegación:** barra fija; transparente arriba, fondo blanco + sombra al hacer scroll; hamburger + drawer en móvil.
- **Tarjetas de servicio:** icono SVG inline, título, descripción, indicador de estado (Activo / Próximamente).
- **Botones y CTAs:** primario (fondo `--color-primary`, texto blanco), secundario (transparente, borde y texto `--color-accent`). Área táctil mínima 44×44px. Foco visible: `outline: 3px solid var(--color-accent); outline-offset: 2px`.
- **Formulario:** campos con `<label>` visible, selector de interés visible, honeypot oculto, feedback de estados.

El detalle de cada componente está en `frontend.md`.

---

## 5. Internacionalización

- Un solo `index.html` bilingüe. Textos marcados con atributos `data-i18n` (texto), `data-i18n-placeholder` y `data-i18n-aria-label`.
- Objeto de traducciones en `js/translations.js` con bloques `es` y `en` que tienen exactamente las mismas claves.
- Idioma por defecto: `es`. Persistencia en localStorage, clave `preferred-language`, valores `"es"` / `"en"`, sin expiración.
- Al cambiar de idioma también se actualizan `<html lang>`, `document.title` y la meta descripción.
- Los mensajes dinámicos (errores de validación, estados del formulario) también se traducen: el código guarda la **clave** del mensaje activo, no el texto, para poder re-renderizarlo si el usuario cambia de idioma.
- Si localStorage no está disponible, el sitio funciona en español sin persistencia.

La lista completa de claves está en `frontend.md` §7.5.

---

## 6. Navegación y Flujos de Usuario

### 6.1 Secciones

| Orden | Sección | ID | En el menú |
|-------|---------|-----|-----------|
| 1 | Navegación | `nav` | — |
| 2 | Hero | `hero` | No (se llega con el logo) |
| 3 | Sobre Mí | `about` | Sí |
| 4 | Servicios | `services` | Sí |
| 5 | Habilidades | `skills` | Sí |
| 6 | Casos de Estudio | `cases` | Sí |
| 7 | Contacto | `contact` | Sí |
| 8 | Footer | `footer` | — |

### 6.2 Mapeo Canónico de CTAs

Esta tabla es la única referencia válida para CTAs. Los IDs HTML son solo para el DOM; lo que viaja a la API y a Airtable es siempre el valor semántico de `cta_type`.

| ID HTML | Texto (ES) | Ubicación | `cta_type` | `source` | Preselección en el formulario |
|---------|-----------|-----------|------------|----------|-------------------------------|
| `cta-employment-hero` | Buscar empleo | Hero | `employment_inquiry` | `hero` | `empleo` |
| `cta-freelance-hero` | Servicio freelance | Hero | `freelance_service` | `hero` | `freelance` |
| `cta-contact-footer` | Contactarme | Footer | `general_contact` | `footer` | Ninguna (el usuario elige) |

### 6.3 Flujos

**Empleo:** visitante lee el Hero → clic en "Buscar empleo" → se registra el clic (en segundo plano) → scroll al formulario con "Empleo" preseleccionado → completa y envía.

**Freelance:** visitante explora servicios y casos → clic en "Servicio freelance" → igual que arriba con "Freelance" preseleccionado.

**Directo:** visitante llega al formulario desde el menú o el CTA del footer → el selector de interés aparece sin selección → debe elegir una opción para poder enviar.

El selector de interés es **visible y editable**: el CTA solo lo preselecciona. Esto garantiza que todo contacto llegue con `interest_type` válido, sin importar por dónde entró el visitante.

---

## 7. Contratos API (canónicos)

Formato común: `Content-Type: application/json` en request y response. Nombres de campos en `snake_case` inglés. Tamaño máximo del body: 10 KB. Métodos distintos de `POST` (y `OPTIONS`) responden `405`.

Las respuestas **no** incluyen textos para mostrar al usuario: incluyen un `code` y el frontend elige el mensaje traducido. Así el backend no depende del idioma.

### 7.1 POST `/api/contact`

**Request:**

| Campo | Tipo | Requerido | Regla |
|-------|------|-----------|-------|
| `name` | string | Sí | 2–100 caracteres tras `trim` |
| `email` | string | Sí | Formato email válido, máx. 254 caracteres |
| `message` | string | Sí | 10–2000 caracteres tras `trim` |
| `interest_type` | string | Sí | `"empleo"` \| `"freelance"` |
| `lang` | string | No | `"es"` \| `"en"` (por defecto `"es"`) |
| `session_id` | string | Sí | UUID v4 |
| `honeypot` | string | Sí | Debe llegar vacío (`""`) |
| `recaptcha_token` | string | Sí | Token de reCAPTCHA v3 con acción `contact` |

**Responses:**

| HTTP | Body | Cuándo |
|------|------|--------|
| 200 | `{ "success": true, "code": "OK" }` | Contacto guardado (aunque el email de notificación falle) |
| 200 | `{ "success": true, "code": "OK" }` | Honeypot lleno: se descarta en silencio, sin guardar ni notificar |
| 400 | `{ "success": false, "code": "VALIDATION_ERROR", "fields": ["email"] }` | Uno o más campos inválidos; `fields` lista cuáles |
| 403 | `{ "success": false, "code": "RECAPTCHA_FAILED" }` | Token inválido, vencido, acción distinta o score < 0.5 |
| 405 | `{ "success": false, "code": "METHOD_NOT_ALLOWED" }` | Método distinto de POST |
| 503 | `{ "success": false, "code": "SERVICE_UNAVAILABLE" }` | Airtable devuelve 429 (cuota mensual agotada o rate limit) |
| 500 | `{ "success": false, "code": "SERVER_ERROR" }` | Cualquier otro error interno |

### 7.2 POST `/api/analytics/cta-click`

**Request:**

| Campo | Tipo | Requerido | Regla |
|-------|------|-----------|-------|
| `cta_type` | string | Sí | `"employment_inquiry"` \| `"freelance_service"` \| `"general_contact"` |
| `source` | string | Sí | `"hero"` \| `"footer"` |
| `session_id` | string | Sí | UUID v4 |
| `recaptcha_token` | string | Sí | Token de reCAPTCHA v3 con acción `cta_click` |

**Responses:** mismos códigos que `/api/contact` (`OK`, `VALIDATION_ERROR`, `RECAPTCHA_FAILED`, `METHOD_NOT_ALLOWED`, `SERVICE_UNAVAILABLE`, `SERVER_ERROR`). El frontend no muestra nada al usuario en ningún caso: el rastreo es silencioso.

### 7.3 Tabla de Valores Canónicos

| Concepto | Valores exactos | Dónde se usan igual |
|----------|-----------------|---------------------|
| `interest_type` | `empleo`, `freelance` | Formulario, API, opciones del Single select en Airtable |
| `cta_type` | `employment_inquiry`, `freelance_service`, `general_contact` | JS, API, opciones del Single select en Airtable |
| `source` | `hero`, `footer` | JS, API, opciones del Single select en Airtable |
| `lang` | `es`, `en` | localStorage, API, Airtable |
| `Follow-up Status` | `Nuevo`, `Contactado`, `En proceso`, `Cerrado` | Solo Airtable (lo edita el propietario) |
| Acciones reCAPTCHA | `contact`, `cta_click` | JS (`grecaptcha.execute`) y verificación en backend |

Las etiquetas capitalizadas ("Empleo", "Freelance") existen **solo para mostrar** (UI traducida y asunto del email). Nunca se envían a la API ni se guardan en Airtable.

---

## 8. Modelo de Datos (Airtable)

### 8.1 Organización

| Workspace | Base | Tabla | Motivo |
|-----------|------|-------|--------|
| `Portfolio Leads` | `Leads` | `Contacts` | Contactos: el dato más valioso, con su propia cuota de 1,000 llamadas/mes |
| `Portfolio Analytics` | `Analytics` | `Analytics` | Clics en CTAs: aislado para que un abuso no afecte los contactos |

Cada base tiene su propio tope de 1,000 registros del plan Free.

### 8.2 Tabla `Contacts`

| Campo Airtable | Tipo Airtable | Origen (JSON) | Regla |
|----------------|---------------|---------------|-------|
| `Name` | Single line text | `name` | Requerido |
| `Email` | Email | `email` | Requerido |
| `Interest Type` | Single select — opciones `empleo`, `freelance` | `interest_type` | Requerido, valor exacto |
| `Message` | Long text | `message` | Requerido |
| `Language` | Single select — opciones `es`, `en` | `lang` | Por defecto `es` |
| `Session ID` | Single line text | `session_id` | Requerido |
| `Submission Date` | Created time | — (automático) | — |
| `Follow-up Status` | Single select — `Nuevo`, `Contactado`, `En proceso`, `Cerrado` | — | Valor por defecto `Nuevo` configurado en Airtable |
| `Notes` | Long text | — | Uso del propietario |

### 8.3 Tabla `Analytics`

| Campo Airtable | Tipo Airtable | Origen (JSON) | Regla |
|----------------|---------------|---------------|-------|
| `CTA Type` | Single select — `employment_inquiry`, `freelance_service`, `general_contact` | `cta_type` | Requerido, valor exacto |
| `Source` | Single select — `hero`, `footer` | `source` | Requerido, valor exacto |
| `Session ID` | Single line text | `session_id` | Requerido |
| `Click Date` | Created time | — (automático) | — |

### 8.4 Reglas de Escritura

- El backend traduce nombres JSON (`snake_case`) a nombres de campo Airtable según las tablas anteriores (ver `backend.md` §9.3).
- Las escrituras se hacen con `typecast: false`: si un valor no coincide exactamente con una opción del Single select, Airtable rechaza la escritura en lugar de crear una opción nueva. Esto protege la integridad de los datos.
- `session_id` es en la práctica un identificador de visitante: se guarda en localStorage sin expiración. No contiene datos personales.

---

## 9. Seguridad

### 9.1 Secretos
Todas las credenciales viven en variables de entorno de Netlify y se leen con `process.env` dentro de las funciones. El frontend solo contiene la **site key** pública de reCAPTCHA. `.env` está en `.gitignore`; el repositorio solo incluye `.env.example` sin valores.

### 9.2 reCAPTCHA v3 (ambos endpoints)
- El script se carga de forma diferida (primera interacción o cuando la sección de contacto se acerca al viewport).
- El token se genera **en el momento** de enviar o de registrar el clic, nunca al cargar la página, porque vence a los 2 minutos.
- El backend verifica con Google: `success === true`, `action` igual a la esperada (`contact` o `cta_click`) y `score >= 0.5`.

### 9.3 Honeypot
- Campo HTML `name="website"`, `type="text"`, `tabindex="-1"`, `autocomplete="off"`, dentro de un contenedor con `aria-hidden="true"` posicionado fuera de pantalla (`position: absolute; left: -9999px`). **No** se usa `display: none`.
- Se envía a la API como `honeypot`. Si llega con contenido, la función responde `200 OK` sin guardar ni notificar (el bot no recibe señal de rechazo).

### 9.4 Validación y Sanitización
- El cliente valida para dar buena experiencia; el servidor vuelve a validar todo porque es el único control real.
- Sanitización en servidor: `trim`, eliminación de caracteres de control, verificación de longitudes, y neutralización de fórmulas (si `name` o `message` empiezan con `=`, `+`, `-` o `@`, se antepone `'`) para que exportar a CSV/Excel sea seguro.
- En el frontend, cualquier texto dinámico se inserta con `textContent`, nunca con `innerHTML`.

### 9.5 Protección Contra Abuso
No se implementa rate limiting en memoria: en serverless cada invocación puede correr en una instancia distinta y la memoria no se conserva, así que no protegería nada. La protección se logra así:

| Riesgo | Control |
|--------|---------|
| Bots en el formulario | reCAPTCHA v3 + honeypot + validación estricta |
| Bots en analytics | reCAPTCHA v3 + validación estricta de enums |
| Clics repetidos de un mismo visitante | Deduplicación en cliente: un registro por `cta_type` por sesión del navegador (sessionStorage) |
| Agotar la cuota de Airtable de contactos con tráfico de analytics | Workspaces separados (§2.4) |
| Payloads gigantes | Rechazo de bodies > 10 KB |

### 9.6 Cabeceras de Seguridad
Definidas en `netlify.toml` (§10.1): Content-Security-Policy limitada a `'self'` más los dominios de reCAPTCHA, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` y `Permissions-Policy`. Netlify fuerza HTTPS en `*.netlify.app`.

### 9.7 CORS
No se requiere configuración CORS: el frontend y las funciones se sirven desde el mismo dominio (incluidos los deploy previews, que tienen sus propias funciones en su propio dominio). Las funciones no añaden `Access-Control-Allow-Origin`, de modo que otros sitios no pueden leer sus respuestas desde un navegador.

---

## 10. Despliegue

### 10.1 `netlify.toml` (contenido canónico)

```toml
[build]
  publish = "public"
  functions = "netlify/functions"

[functions]
  node_bundler = "esbuild"

# Rutas de la API → funciones
[[redirects]]
  from = "/api/contact"
  to = "/.netlify/functions/contact"
  status = 200
  force = true

[[redirects]]
  from = "/api/analytics/cta-click"
  to = "/.netlify/functions/analytics"
  status = 200
  force = true

# Cabeceras de seguridad para todo el sitio
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; script-src 'self' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/; frame-src https://www.google.com/recaptcha/ https://recaptcha.google.com/recaptcha/; connect-src 'self' https://www.google.com/recaptcha/; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "DENY"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
```

Notas:
- `style-src 'unsafe-inline'` es necesario porque el script de reCAPTCHA inserta estilos en línea para su badge e iframe.
- No se definen cabeceras de caché largas: como los archivos no llevan hash en el nombre (no hay build), un caché largo haría que los visitantes vieran CSS/JS viejo tras un deploy. Se usa el comportamiento por defecto de Netlify (revalidación con ETag e invalidación en cada deploy).
- No se usa `included_files`: esbuild ya empaqueta lo que cada función importa desde `netlify/lib/`.

### 10.2 Variables de Entorno

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
| `EMAILJS_PRIVATE_KEY` | Clave privada de EmailJS (llamadas desde servidor) | `xxxxxxxxxxxxxxx` |
| `NOTIFICATION_EMAIL` | Correo del propietario que recibe los avisos | `usuario@ejemplo.com` |
| `RECAPTCHA_SECRET_KEY` | Clave secreta de reCAPTCHA v3 | `6LfXXXXXXXXXXXX` |

La site key de reCAPTCHA no es secreta y va en `public/js/script.js`. `NETLIFY_SITE_URL` ya no es necesaria (no hay configuración CORS).

Existe además una variable **solo para pruebas locales**, `RECAPTCHA_BYPASS`, que nunca se configura en Netlify (ver `backend.md` §8.2).

### 10.3 Plan de Netlify y Presupuesto de Deploys

Las cuentas de Netlify creadas desde el 4 de septiembre de 2025 usan el plan Free por créditos: **300 créditos al mes con tope fijo**. Si se agotan, el sitio queda pausado ("Site not available") hasta el mes siguiente.

| Consumo | Costo en créditos | Estimado mensual del proyecto |
|---------|-------------------|-------------------------------|
| Deploy de producción | 15 por deploy | El mayor consumo: 10 deploys = 150 créditos |
| Ancho de banda | 20 por GB | ~0.1 GB (página ligera) ≈ 2 créditos |
| Peticiones web | 2 por 10,000 | < 1 crédito |
| Cómputo de funciones | 10 por GB-hora | < 1 crédito |

**Reglas de trabajo:**
- Desarrollar y probar en local con `netlify dev` (funciones y redirects incluidos, sin gastar créditos).
- Limitar los deploys de producción a **10 por mes** como máximo; agrupar cambios antes de hacer push a la rama de producción.
- Revisar el panel de uso de créditos después de la primera semana.

Si la cuenta es anterior al 4/09/2025 (plan legado), aplican los límites legados (125,000 invocaciones de funciones y 100 GB de ancho de banda al mes) y las reglas anteriores siguen siendo buena práctica.

### 10.4 Proceso de Despliegue
1. Configurar las variables de entorno en Netlify (Site configuration → Environment variables).
2. Probar en local con `netlify dev` y la suite de pruebas (`npm test`).
3. Push a la rama de producción → Netlify publica `public/` y despliega las funciones.
4. Ejecutar los criterios de verificación (§18) contra la URL publicada.

---

## 11. Analytics de CTAs

### 11.1 Objetivo
Medir qué CTA genera más interés y qué porcentaje de visitantes que hacen clic terminan enviando el formulario.

### 11.2 Mecanismo
1. Al cargar la página se reutiliza o genera el `session_id` (UUID v4 en localStorage, clave `session_id`).
2. Al hacer clic en un CTA, el frontend revisa en sessionStorage (clave `cta_clicks_sent`) si ya registró ese `cta_type` en esta sesión del navegador. Si ya lo hizo, no envía nada.
3. Si no, obtiene un token de reCAPTCHA (acción `cta_click`) y envía `POST /api/analytics/cta-click` sin bloquear el scroll al formulario.
4. Al enviar el formulario, se incluye el mismo `session_id`.

### 11.3 Tasa de Conversión

Airtable no puede cruzar dos bases por un campo de texto, así que el cálculo se hace fuera de Airtable:

1. Exportar `Contacts` y `Analytics` a CSV.
2. Cruzar por `Session ID` en Excel (Power Query / `XLOOKUP`) o SQL.
3. Calcular por `CTA Type`:

```
Tasa de conversión = (sesiones únicas con clic en ese CTA que también enviaron el formulario)
                     ÷ (sesiones únicas con clic en ese CTA) × 100
```

**Ejemplo:** 40 sesiones distintas hicieron clic en "Buscar empleo"; 3 de esas sesiones enviaron el formulario → 3 ÷ 40 × 100 = 7.5%.

Este análisis puede convertirse en un caso de estudio real para la propia landing.

### 11.4 Mantenimiento de la Tabla Analytics
Una vez al mes: exportar a CSV y borrar los registros de más de 60 días, para no acercarse al tope de 1,000 registros de la base.

---

## 12. Panel de Administración / CRM Básico

Implementado con vistas nativas de Airtable en la base `Leads`, sin interfaz propia:

| Vista | Configuración |
|-------|---------------|
| Contactos recientes | Orden por `Submission Date` descendente; filtro `Follow-up Status = Nuevo` |
| Contactos por tipo | Agrupada por `Interest Type` |
| Seguimiento pendiente | Filtro `Follow-up Status` es `Contactado` o `En proceso`; orden ascendente por fecha |
| Kanban | Agrupada por `Follow-up Status` |

En la base `Analytics`: vista agrupada por `CTA Type` y otra por `Source`.

Acceso solo con la cuenta de Airtable del propietario. Revisión mensual del número de registros de cada base y del uso de llamadas API de cada workspace.

---

## 13. Accesibilidad (WCAG 2.1 AA)

- **Semántica:** `header`, `nav`, `main`, `section` (con encabezado), `footer`; un solo `h1`; jerarquía de encabezados sin saltos.
- **Enlace "Saltar al contenido"** como primer elemento enfocable.
- **Idioma:** `<html lang="es">` por defecto, actualizado a `en` al cambiar el idioma.
- **Contraste:** valores verificados en §4.1.
- **Teclado:** todo accesible con Tab en orden visual; foco siempre visible; el drawer móvil retiene el foco mientras está abierto, se cierra con Escape y devuelve el foco al botón hamburguesa.
- **Lectores de pantalla:** iconos decorativos con `aria-hidden="true"`; botones sin texto con `aria-label` traducido; `aria-expanded` en el hamburguesa; estado del formulario anunciado con `aria-live="polite"`; errores asociados con `aria-describedby` y `aria-invalid`.
- **Áreas táctiles:** mínimo 44×44px para todo control interactivo.
- **Movimiento reducido:** con `prefers-reduced-motion: reduce` se desactivan el scroll suave y las transiciones.
- **Formularios:** `<label>` visible y traducido para cada campo (el placeholder no reemplaza al label).

---

## 14. Rendimiento

### 14.1 Métricas Objetivo

| Métrica | Objetivo |
|---------|----------|
| First Contentful Paint | < 1 s |
| Largest Contentful Paint | < 2 s |
| Cumulative Layout Shift | < 0.1 |
| Total Blocking Time | < 200 ms |
| Respuesta de `/api/contact` | < 3 s (incluye reCAPTCHA + Airtable + EmailJS) |
| Respuesta de `/api/analytics/cta-click` | < 2 s |

### 14.2 Presupuesto de Tamaño (sin minificar, sin contar reCAPTCHA)

| Recurso | Máximo |
|---------|--------|
| `index.html` | 30 KB |
| `css/style.css` | 30 KB |
| `js/script.js` + `js/translations.js` | 40 KB |
| Imágenes totales | 200 KB |

El script de reCAPTCHA es externo y pesado; por eso se carga de forma diferida (§9.2).

---

## 15. Estrategia de Pruebas

| Nivel | Qué se prueba | Herramienta |
|-------|---------------|-------------|
| Unitarias | Validación, sanitización, enums, mapeo JSON → Airtable (`netlify/lib/`) | `node --test` (incluido en Node, sin dependencias) |
| Integración local | Cada código de respuesta de ambos endpoints | `netlify dev` + casos `curl` (ver `backend.md` §15) |
| End-to-end manual | Flujos empleo / freelance / directo, toggle de idioma, estados del formulario | Navegadores: Chrome, Firefox, Safari móvil |
| Accesibilidad | Teclado, lector de pantalla, contraste | Navegación solo con teclado, Orca/NVDA/VoiceOver, Lighthouse |
| Rendimiento | Métricas de §14 | Lighthouse (Chrome DevTools) |

---

## 16. Decisiones Arquitectónicas

| Decisión | Alternativa descartada | Justificación |
|----------|------------------------|---------------|
| Un solo HTML bilingüe | Un archivo por idioma | Mantenimiento simple |
| JavaScript para el toggle | CSS puro | La persistencia en localStorage requiere JS |
| Netlify (sitio + Functions) | Cloudflare Workers | Frontend y backend en el mismo dominio |
| Publicar solo `public/` | Publicar la raíz | No exponer documentación ni código fuente de funciones |
| Airtable como BD y CRM | Base de datos tradicional | Free tier con CRM incluido |
| Dos workspaces de Airtable | Una sola base | La cuota de llamadas API es por workspace; aísla contactos del analytics |
| EmailJS vía API REST desde el servidor | Resend / SendGrid | Sin dominio propio; free tier suficiente |
| reCAPTCHA en ambos endpoints | Solo en contacto | El endpoint de analytics escribe en Airtable y también debe protegerse |
| Sin rate limiting en memoria | Token bucket en la función | La memoria no persiste entre invocaciones serverless |
| `snake_case` inglés en la API | Nombres en español | Convención estándar y ya usada por frontend/backend |
| Valores de enum en minúscula en API y Airtable | Capitalizados en Airtable | Coincidencia exacta sin mapeo; etiquetas solo para mostrar |
| Selector de interés visible y preseleccionado | Campo oculto | Funciona también cuando el visitante no pasa por un CTA |
| Respuestas con `code` en vez de mensaje | Mensajes en español desde el backend | Permite mostrar errores traducidos |
| Fuentes del sistema | Google Fonts | Cumple "cero CDN", 0 KB, sin saltos de layout |
| Token reCAPTCHA al enviar | Token al cargar la página | Los tokens vencen a los 2 minutos |
| Media queries `min-width` | `max-width` | Es la implementación correcta de mobile-first |
| Sin caché largo en CSS/JS | `Cache-Control` de 1 semana | Sin hash en los nombres, un caché largo sirve archivos viejos |

**Restricciones respetadas:** sin frameworks ni librerías en el frontend, sin CDN (excepción única: el script de reCAPTCHA, que es un servicio y no una librería), sin servidor propio, sin build obligatorio, costo $0.

---

## 17. Riesgos Técnicos

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Créditos de Netlify agotados → sitio pausado | Alto | Máximo 10 deploys de producción/mes, desarrollo con `netlify dev`, revisión de uso semanal al inicio |
| Cuota de 1,000 llamadas/mes de Airtable agotada | Alto | Workspaces separados, deduplicación de clics, reCAPTCHA en analytics; si pasa, la API responde 503 y el frontend ofrece copiar el email |
| Tope de 1,000 registros por base | Medio | Limpieza mensual de Analytics; revisión mensual de Contacts |
| EmailJS rechaza llamadas desde servidor | Medio | Activar "Allow EmailJS API for non-browser applications" y usar clave privada (ver `backend.md` §10) |
| Límite de EmailJS (200 envíos/mes) | Bajo | El contacto se guarda igual en Airtable aunque el email falle |
| reCAPTCHA marca como bot a un humano | Bajo | Mensaje con opción de reintentar y botón para copiar el email |
| API keys expuestas | Alto | Solo variables de entorno; `.env` en `.gitignore` |
| Documentación publicada por error | Medio | `publish = "public"` |
| localStorage no disponible | Bajo | Idioma por defecto sin persistencia; `session_id` en memoria |
| Spam que supera honeypot + reCAPTCHA | Bajo | Revisión manual en Airtable |

---

## 18. Criterios de Verificación

**Repositorio y despliegue**
- [ ] La estructura coincide con §3 y Netlify publica solo `public/`
- [ ] `/Documentos/Brief.md` y `/netlify/functions/contact.js` devuelven 404 en la URL publicada
- [ ] `netlify.toml` coincide con §10.1 y las cabeceras de seguridad aparecen en las respuestas
- [ ] Las 12 variables de §10.2 están configuradas en Netlify

**Contratos y datos**
- [ ] Ambos endpoints responden exactamente los códigos de §7
- [ ] Los Single select de Airtable tienen exactamente las opciones de §7.3
- [ ] Una escritura con un valor fuera del enum es rechazada (`typecast: false`)
- [ ] Contacts y Analytics están en workspaces distintos

**Frontend**
- [ ] Los tres CTAs envían el `cta_type` y `source` de §6.2 y preseleccionan el interés correcto
- [ ] Un mismo CTA solo se registra una vez por sesión del navegador
- [ ] El toggle de idioma traduce todo, incluidos errores y `<html lang>`
- [ ] Contraste, teclado, lector de pantalla y movimiento reducido cumplen §13

**Seguridad**
- [ ] Honeypot lleno → 200 sin registro en Airtable
- [ ] Token de reCAPTCHA de otra acción → 403
- [ ] Ningún secreto aparece en `public/`

---

## Aprobación

| Rol | Estado | Fecha |
|-----|--------|-------|
| Chief Software Architect | Aprobado | 22/09/2026 |
| Senior Backend Engineer | Aprobado | 22/09/2026 |

---

*Documento generado por Chief Software Architect — OpenCode Workspace Framework v1.2*

*v3.0 — Corregido tras auditoría técnica*
