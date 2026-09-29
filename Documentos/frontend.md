# Especificaciones Técnicas — Frontend

Versión: 2.0

Fecha: 22 de septiembre de 2026

Estado: Aprobado para implementación (corregido tras auditoría técnica)

---

## 0. Control de Cambios

| Versión | Fecha | Cambio |
|---------|-------|--------|
| 1.0 | 08/09/2026 | Versión inicial |
| 2.0 | 22/09/2026 | Estructura con `public/` (sin `default.project/`), selector de interés visible y preseleccionado, CTA del footer con `cta_type` propio, catálogo i18n completo ES/EN, manejo de errores por `code`, token reCAPTCHA al enviar con carga diferida, deduplicación de clics, paleta con hex verificados, fuentes del sistema, `lang` dinámico, `prefers-reduced-motion`, pruebas. |

**Documento dueño de los contratos, valores canónicos y paleta:** `Arquitectura.md`. Este documento los repite para implementar; si alguna vez difieren, manda `Arquitectura.md`.

---

## 1. Visión General

Frontend de la Landing Page de Análisis de Datos, construido con HTML, CSS y JavaScript nativos. Es una página única con navegación por anclas, internacionalización en cliente y comunicación con Netlify Functions para el formulario y el analytics.

### 1.1 Alcance

- HTML semántico con atributos `data-i18n*`
- CSS con variables, mobile-first
- JavaScript nativo para navegación, idioma, formulario, analytics y reCAPTCHA
- Accesibilidad WCAG 2.1 AA

### 1.2 Restricciones

- Cero frameworks (React, Vue, Angular, etc.)
- Cero librerías de utilidad (jQuery, Lodash, etc.)
- Cero preprocesadores CSS (Sass, LESS)
- Cero herramientas de build (Webpack, Vite, etc.)
- Cero CDN y cero fuentes externas. **Única excepción:** el script de reCAPTCHA v3 de Google, que es un servicio de seguridad y no una librería.

---

## 2. Tecnologías

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| HTML | 5 | Estructura semántica |
| CSS | 3 | Estilos y layout |
| JavaScript | ES2022 | Lógica de cliente |
| reCAPTCHA | v3 | Protección anti-spam |

Navegadores soportados: últimas 2 versiones de Chrome, Firefox, Safari y Edge.

---

## 3. Estructura de Archivos

Todo el frontend vive en `public/`, que es la única carpeta que Netlify publica (`Arquitectura.md` §3).

```
public/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── script.js
│   └── translations.js
└── assets/
    └── images/
        ├── og-image.png   (1200×630, ≤ 150 KB)
        └── favicon.ico
```

| Archivo | Responsabilidad |
|---------|-----------------|
| `index.html` | Estructura semántica, atributos `data-i18n*`, meta tags, formulario |
| `css/style.css` | Variables, estilos base, componentes, estados, responsive |
| `js/translations.js` | Objeto `TRANSLATIONS` con bloques `es` y `en` (mismas claves en ambos) |
| `js/script.js` | Idioma, navegación, formulario, analytics, reCAPTCHA |

`translations.js` se carga antes que `script.js`; ambos con `defer`.

---

## 4. Secciones de la Página

| Orden | Sección | ID | Ancla | En el menú |
|-------|---------|-----|-------|-----------|
| 1 | Navegación | `nav` | — | — |
| 2 | Hero | `hero` | `#hero` | No (el logo/nombre lleva aquí) |
| 3 | Sobre Mí | `about` | `#about` | Sí |
| 4 | Servicios | `services` | `#services` | Sí |
| 5 | Habilidades | `skills` | `#skills` | Sí |
| 6 | Casos de Estudio | `cases` | `#cases` | Sí |
| 7 | Contacto | `contact` | `#contact` | Sí |
| 8 | Footer | `footer` | — | — |

---

## 5. Layout y Responsive

### 5.1 Breakpoints (mobile-first con `min-width`)

| Nombre | Rango | Media query |
|--------|-------|-------------|
| Móvil | 0 – 576px | Estilos base |
| Tablet | 577px – 991px | `@media (min-width: 577px)` |
| Desktop | 992px+ | `@media (min-width: 992px)` |

### 5.2 Layout por Sección

| Sección | Móvil | Tablet | Desktop |
|---------|-------|--------|---------|
| Navegación | Hamburguesa + drawer lateral | Enlaces horizontales + toggle | Enlaces horizontales + toggle |
| Hero | Texto centrado, CTAs apilados | Texto centrado, CTAs lado a lado | Igual que tablet |
| Sobre Mí | Una columna | Dos columnas si hay imagen | Igual que tablet |
| Servicios | Tarjetas apiladas | Grid de 2 columnas | Grid de 3 columnas |
| Habilidades | Badges en grid compacto | Grid de 3–4 columnas | Fila horizontal |
| Casos | Apilados | Grid de 2 columnas | Grid de 3 columnas |
| Contacto | Formulario a todo el ancho | Centrado, ancho máx. 640px | Igual que tablet |
| Footer | Una columna centrada | Igual | Igual |

---

## 6. Componentes

### 6.1 Enlace "Saltar al contenido"

Primer elemento enfocable de la página. Invisible hasta recibir foco; lleva a `<main id="main">`. Texto: clave `skip_link`.

### 6.2 Navegación

**Estructura:** contenedor fijo arriba; nombre a la izquierda (enlace a `#hero`); enlaces a la derecha; botón de idioma; botón hamburguesa (solo móvil).

**Estados:** transparente arriba · fondo blanco con sombra al hacer scroll · drawer abierto (móvil).

**Comportamiento:**
- Clic en un enlace → scroll suave a la sección (compensado con `scroll-margin-top`).
- El enlace de la sección visible se resalta (IntersectionObserver) y recibe `aria-current="true"`.
- Botón de idioma: muestra el idioma **al que se va a cambiar** (`EN` cuando la página está en español, `ES` cuando está en inglés) con `aria-label` descriptivo.

### 6.3 Hero

- `<h1>` con el nombre completo (no se traduce, no lleva `data-i18n`).
- Tagline (`hero_tagline`) y frase de propuesta de valor (`hero_intro`).
- Dos CTAs según la tabla de §9.4.

Estados de los CTAs: default · hover (fondo `--color-primary-hover` o sombra) · focus (anillo visible) · active (escala 0.98).

### 6.4 Sobre Mí

Título + dos párrafos (`about_p1`: trayectoria SME en soporte; `about_p2`: formación actual y diferenciador).

### 6.5 Servicios

Grid de tarjetas. Cada tarjeta: icono SVG inline con `aria-hidden="true"`, título, descripción, indicador de estado.

| Servicio | Icono | Estado |
|----------|-------|--------|
| SQL | Cilindro de base de datos | Activo (`status_active`) |
| Excel Avanzado | Cuadrícula de hoja de cálculo | Activo (`status_active`) |
| Power BI | Gráfico de barras | Próximamente (`status_coming_soon`) |

Los iconos son SVG propios dibujados a mano (formas geométricas simples), sin logotipos de marcas.

### 6.6 Habilidades

Lista (`<ul>`) de badges en tipografía monoespaciada: SQL, Excel Avanzado, Power BI (próximamente), Análisis de Datos, Reporting, Limpieza de Datos. Cada badge tiene su clave i18n.

### 6.7 Casos de Estudio

- Aviso de que son casos basados en ejercicios (`cases_notice`), según el Brief §7.
- Tres tarjetas; cada una con título y tres bloques etiquetados: Problema, Solución, Resultado.
- Sin imágenes por ahora (se añadirán cuando haya proyectos reales).

### 6.8 Formulario de Contacto

**Campos:**

| Campo | Elemento | `name` en HTML | Clave JSON | Requerido |
|-------|----------|----------------|------------|-----------|
| Nombre | `<input type="text">` | `name` | `name` | Sí |
| Email | `<input type="email">` | `email` | `email` | Sí |
| Tipo de interés | `<select>` **visible** | `interest_type` | `interest_type` | Sí |
| Mensaje | `<textarea>` | `message` | `message` | Sí |
| Honeypot | `<input type="text">` oculto | `website` | `honeypot` | Debe quedar vacío |

Además, el script añade al enviar: `lang` (idioma activo), `session_id` y `recaptcha_token`.

**Selector de interés:**
- Etiqueta: `form_interest_label` ("¿Me contactas por una vacante o por un servicio freelance?").
- Opciones: placeholder deshabilitado (`form_interest_placeholder`, valor vacío) · `empleo` (`form_interest_employment`) · `freelance` (`form_interest_freelance`).
- Los CTAs del Hero lo preseleccionan; el usuario puede cambiarlo. Si se llega por el menú o por el CTA del footer, queda en el placeholder y el usuario debe elegir.

**Honeypot:**
- `<div class="hp" aria-hidden="true">` con `position: absolute; left: -9999px` (no `display: none`).
- Input: `name="website"`, `tabindex="-1"`, `autocomplete="off"`.

**Labels:** todos los campos tienen `<label for>` visible y traducido; el placeholder es solo un ejemplo.

**Badge de reCAPTCHA:** se deja visible (esquina inferior derecha), como exigen los términos de Google cuando no se muestra el aviso de texto.

**Estados del formulario:**

| Estado | Comportamiento |
|--------|----------------|
| `idle` | Formulario habilitado, sin mensajes |
| `submitting` | Botón deshabilitado con texto `form_submitting` y spinner; campos deshabilitados; `aria-busy="true"` en el formulario |
| `success` | Formulario reseteado y oculto; mensaje `form_success`; botón `form_send_another`; el foco va al mensaje |
| `error` | Mensaje según §13; botones `form_retry` y, cuando aplica, `form_copy_email`; los datos ingresados se conservan |

### 6.9 Footer

Enlaces a LinkedIn y GitHub (con `aria-label` que avisa que abren pestaña nueva; `rel="noopener noreferrer"`), texto de copyright, línea secundaria y CTA de refuerzo "Contactarme" (§9.4).

---

## 7. Internacionalización (i18n)

### 7.1 Mecanismo

| Atributo | Qué traduce |
|----------|-------------|
| `data-i18n="clave"` | `textContent` del elemento |
| `data-i18n-placeholder="clave"` | Atributo `placeholder` |
| `data-i18n-aria-label="clave"` | Atributo `aria-label` |

Al aplicar un idioma también se actualizan `document.documentElement.lang`, `document.title` (`meta_title`) y `<meta name="description">` (`meta_description`).

Los textos con `{email}` se interpolan con la constante `CONTACT_EMAIL` definida en `script.js`.

### 7.2 Idioma por Defecto
Español (`es`).

### 7.3 Persistencia
localStorage, clave `preferred-language`, valores `"es"` / `"en"`, sin expiración. Si localStorage no está disponible, se usa español sin persistencia.

### 7.4 Mensajes Dinámicos
Los errores y estados del formulario se guardan como **clave** (por ejemplo `currentMessageKey = "err_server"`), nunca como texto. Si el usuario cambia de idioma con un mensaje visible, se vuelve a renderizar en el nuevo idioma.

### 7.5 Catálogo Completo de Claves

Los bloques `es` y `en` de `translations.js` deben tener exactamente estas claves, ni más ni menos.

**Meta y accesibilidad**

| Clave | ES | EN |
|-------|----|----|
| `meta_title` | Neider Peña — Analista de Datos \| SQL · Excel · Power BI | Neider Peña — Data Analyst \| SQL · Excel · Power BI |
| `meta_description` | Analista de datos con experiencia en operaciones de soporte. Reportes y análisis con SQL y Excel avanzado. Disponible para empleo y proyectos freelance. | Data analyst with a support operations background. Reporting and analysis with SQL and advanced Excel. Available for jobs and freelance projects. |
| `skip_link` | Saltar al contenido | Skip to content |

**Navegación**

| Clave | ES | EN |
|-------|----|----|
| `nav_home_aria` | Ir al inicio | Go to top |
| `nav_about` | Sobre mí | About |
| `nav_services` | Servicios | Services |
| `nav_skills` | Habilidades | Skills |
| `nav_cases` | Casos | Case studies |
| `nav_contact` | Contacto | Contact |
| `nav_lang_toggle_text` | EN | ES |
| `nav_lang_toggle_aria` | Cambiar el idioma a inglés | Switch language to Spanish |
| `nav_menu_open_aria` | Abrir menú | Open menu |
| `nav_menu_close_aria` | Cerrar menú | Close menu |

**Hero**

| Clave | ES | EN |
|-------|----|----|
| `hero_tagline` | Analista de Datos \| SQL · Excel Avanzado · Power BI | Data Analyst \| SQL · Advanced Excel · Power BI |
| `hero_intro` | Convierto datos operativos desordenados en reportes claros para tomar decisiones. | I turn messy operational data into clear reports for better decisions. |
| `hero_cta_employment` | Buscar empleo | Job opportunity |
| `hero_cta_freelance` | Servicio freelance | Freelance service |

**Sobre mí**

| Clave | ES | EN |
|-------|----|----|
| `about_title` | Sobre mí | About me |
| `about_p1` | Vengo de operaciones de soporte, donde trabajé como SME (Subject Matter Expert) en Concentrix. Ahí aprendí cómo nacen los datos del negocio: tickets, SLAs y métricas que alguien tiene que convertir en decisiones. | I come from support operations, where I worked as an SME (Subject Matter Expert) at Concentrix. That's where I learned how business data is born: tickets, SLAs and metrics that someone has to turn into decisions. |
| `about_p2` | Hoy me dedico de tiempo completo a formarme como analista de datos: aprendí SQL en dos semanas de estudio intensivo y trabajo Excel a nivel avanzado. Mi diferencial es que entiendo el dato desde la operación antes de analizarlo. | Today I'm fully focused on becoming a data analyst: I learned SQL in two weeks of intensive study and I work with Excel at an advanced level. My edge is that I understand data from the operations side before I analyze it. |

**Servicios**

| Clave | ES | EN |
|-------|----|----|
| `services_title` | Servicios | Services |
| `service_sql_title` | SQL | SQL |
| `service_sql_description` | Extracción, limpieza y consulta de datos con SQL — desde filtros simples hasta JOINs y agregaciones complejas — para convertir datos crudos en información confiable. | Data extraction, cleaning and querying with SQL — from simple filters to JOINs and complex aggregations — to turn raw data into reliable information. |
| `service_excel_title` | Excel Avanzado | Advanced Excel |
| `service_excel_description` | Fórmulas de búsqueda (XLOOKUP, INDEX+MATCH), automatización de reportes con funciones de texto y lógica condicional, y tablas dinámicas para reporting recurrente. | Lookup formulas (XLOOKUP, INDEX+MATCH), report automation with text functions and conditional logic, and pivot tables for recurring reporting. |
| `service_powerbi_title` | Power BI | Power BI |
| `service_powerbi_description` | Dashboards interactivos para visualizar KPIs y facilitar decisiones basadas en datos. Habilidad en desarrollo. | Interactive dashboards to visualize KPIs and support data-driven decisions. Skill in progress. |
| `status_active` | Activo | Available |
| `status_coming_soon` | Próximamente | Coming soon |

**Habilidades**

| Clave | ES | EN |
|-------|----|----|
| `skills_title` | Habilidades | Skills |
| `skill_sql` | SQL | SQL |
| `skill_excel` | Excel Avanzado | Advanced Excel |
| `skill_powerbi` | Power BI (próximamente) | Power BI (coming soon) |
| `skill_data_analysis` | Análisis de Datos | Data Analysis |
| `skill_reporting` | Reporting | Reporting |
| `skill_data_cleaning` | Limpieza de Datos | Data Cleaning |

**Casos de estudio**

| Clave | ES | EN |
|-------|----|----|
| `cases_title` | Casos de estudio | Case studies |
| `cases_notice` | Casos basados en ejercicios prácticos; se reemplazarán por proyectos reales. | Cases based on practice exercises; they will be replaced with real projects. |
| `case_label_problem` | Problema | Problem |
| `case_label_solution` | Solución | Solution |
| `case_label_result` | Resultado | Result |
| `case1_title` | Automatización de reporte | Report automation |
| `case1_problem` | Los reportes de tickets de soporte se armaban a mano. | Support ticket reports were built by hand. |
| `case1_solution` | Fórmula que combina TEXTJOIN e IFS para generar resúmenes automáticos. | A formula combining TEXTJOIN and IFS to generate automatic summaries. |
| `case1_result` | Reducción significativa del tiempo de armado manual. | Significantly less time spent building reports by hand. |
| `case2_title` | Búsqueda avanzada de datos | Advanced data lookup |
| `case2_problem` | Cruzar información entre dos tablas superaba los límites de VLOOKUP. | Cross-referencing two tables hit the limits of VLOOKUP. |
| `case2_solution` | INDEX + MATCH para buscar en datos no ordenados. | INDEX + MATCH to search unsorted data. |
| `case2_result` | Búsquedas precisas sin depender del orden de los datos. | Accurate lookups regardless of data order. |
| `case3_title` | Consulta SQL para segmentación | SQL segmentation query |
| `case3_problem` | Hacía falta segmentar y contar registros por categoría. | Records had to be segmented and counted by category. |
| `case3_solution` | Consulta con JOIN, GROUP BY y filtros HAVING. | A query using JOIN, GROUP BY and HAVING filters. |
| `case3_result` | Segmentación precisa con filtros avanzados. | Precise segmentation with advanced filters. |

**Contacto y formulario**

| Clave | ES | EN |
|-------|----|----|
| `contact_title` | Contacto | Contact |
| `contact_intro` | ¿Tienes una vacante o un proyecto? Escríbeme y te respondo lo antes posible. | Have a job opening or a project? Write to me and I'll get back to you soon. |
| `form_name_label` | Nombre | Name |
| `form_name_placeholder` | Tu nombre completo | Your full name |
| `form_email_label` | Correo electrónico | Email |
| `form_email_placeholder` | tu@correo.com | you@email.com |
| `form_interest_label` | ¿Me contactas por una vacante o por un servicio freelance? | Are you reaching out about a job or a freelance service? |
| `form_interest_placeholder` | Selecciona una opción | Select an option |
| `form_interest_employment` | Vacante (empleo) | Job opening |
| `form_interest_freelance` | Servicio freelance | Freelance service |
| `form_message_label` | Mensaje | Message |
| `form_message_placeholder` | Cuéntame brevemente qué necesitas | Tell me briefly what you need |
| `form_submit` | Enviar mensaje | Send message |
| `form_submitting` | Enviando... | Sending... |
| `form_success` | ¡Gracias por escribirme! Te responderé lo antes posible. | Thanks for reaching out! I'll get back to you as soon as possible. |
| `form_send_another` | Enviar otro mensaje | Send another message |
| `form_retry` | Reintentar | Try again |
| `form_copy_email` | Copiar email | Copy email |
| `form_email_copied` | Email copiado al portapapeles | Email copied to clipboard |
| `form_copy_failed` | No se pudo copiar. Mi correo es {email} | Couldn't copy. My email is {email} |

**Errores de validación**

| Clave | ES | EN |
|-------|----|----|
| `err_name_required` | Por favor ingresa tu nombre | Please enter your name |
| `err_name_short` | El nombre debe tener al menos 2 caracteres | Name must be at least 2 characters |
| `err_name_long` | El nombre no puede superar los 100 caracteres | Name can't exceed 100 characters |
| `err_email_required` | Por favor ingresa tu correo electrónico | Please enter your email |
| `err_email_invalid` | Por favor ingresa un correo electrónico válido | Please enter a valid email |
| `err_interest_required` | Por favor selecciona el motivo de tu contacto | Please select the reason for your message |
| `err_message_required` | Por favor escribe un mensaje | Please write a message |
| `err_message_short` | El mensaje debe tener al menos 10 caracteres | Message must be at least 10 characters |
| `err_message_long` | El mensaje no puede superar los 2000 caracteres | Message can't exceed 2,000 characters |
| `err_field_invalid` | Revisa este campo | Please check this field |

**Errores de envío**

| Clave | ES | EN |
|-------|----|----|
| `err_network` | No se pudo conectar al servidor. Verifica tu conexión e intenta de nuevo. | Couldn't reach the server. Check your connection and try again. |
| `err_recaptcha` | No pudimos verificar que eres humano. Intenta de nuevo. | We couldn't verify you're human. Please try again. |
| `err_server` | Hubo un problema al enviar tu mensaje. Intenta de nuevo o escríbeme directamente a {email}. | There was a problem sending your message. Try again or email me directly at {email}. |
| `err_unavailable` | El formulario no está disponible en este momento. Escríbeme directamente a {email}. | The form is unavailable right now. Please email me directly at {email}. |

**Footer**

| Clave | ES | EN |
|-------|----|----|
| `footer_copyright` | © 2026 Neider Steven Peña Riaño — Analista de Datos | © 2026 Neider Steven Peña Riaño — Data Analyst |
| `footer_secondary` | Disponible para oportunidades laborales y proyectos freelance | Available for job opportunities and freelance projects |
| `footer_cta` | Contactarme | Contact me |
| `footer_linkedin_aria` | Perfil de LinkedIn (se abre en una pestaña nueva) | LinkedIn profile (opens in a new tab) |
| `footer_github_aria` | Perfil de GitHub (se abre en una pestaña nueva) | GitHub profile (opens in a new tab) |

---

## 8. Navegación

### 8.1 Anclas y Scroll
- Scroll suave con `scroll-behavior: smooth` en `html`, desactivado bajo `prefers-reduced-motion: reduce`.
- Cada `section` tiene `scroll-margin-top` igual a la altura de la barra fija.

### 8.2 Sección Activa
IntersectionObserver sobre las secciones del menú; el enlace visible recibe clase `is-active` y `aria-current="true"`.

### 8.3 Drawer Móvil
- Botón hamburguesa con `aria-controls` apuntando al drawer y `aria-expanded` (`false`/`true`).
- Al abrir: overlay semitransparente, drawer desde la derecha, `body` sin scroll, foco en el primer enlace, **foco retenido** dentro del drawer (Tab y Shift+Tab ciclan).
- Se cierra con: botón de cierre (X), clic en el overlay, Escape o al elegir un enlace. Al cerrar, el foco vuelve al botón hamburguesa.
- El toggle de idioma también está dentro del drawer.

---

## 9. Integración con Backend

### 9.1 Endpoints

| Endpoint | Método | Propósito |
|----------|--------|-----------|
| `/api/contact` | POST | Enviar formulario |
| `/api/analytics/cta-click` | POST | Registrar clic en CTA |

### 9.2 Contrato — Formulario

**Body enviado:**

```json
{
  "name": "string (2–100)",
  "email": "string (≤ 254, formato válido)",
  "message": "string (10–2000)",
  "interest_type": "empleo | freelance",
  "lang": "es | en",
  "session_id": "UUID v4",
  "honeypot": "",
  "recaptcha_token": "token de la acción contact"
}
```

**Respuestas:** el frontend decide qué mostrar solo a partir del `code` (§13). Nunca muestra texto enviado por el backend.

| HTTP | `code` |
|------|--------|
| 200 | `OK` |
| 400 | `VALIDATION_ERROR` (+ `fields`) |
| 403 | `RECAPTCHA_FAILED` |
| 405 | `METHOD_NOT_ALLOWED` |
| 503 | `SERVICE_UNAVAILABLE` |
| 500 | `SERVER_ERROR` |

### 9.3 Contrato — Analytics

```json
{
  "cta_type": "employment_inquiry | freelance_service | general_contact",
  "source": "hero | footer",
  "session_id": "UUID v4",
  "recaptcha_token": "token de la acción cta_click"
}
```

Las respuestas se ignoran en la UI (rastreo silencioso); los errores solo se registran en consola.

### 9.4 Mapeo de CTAs

| ID HTML | Clave de texto | `cta_type` | `source` | Preselecciona |
|---------|----------------|------------|----------|---------------|
| `cta-employment-hero` | `hero_cta_employment` | `employment_inquiry` | `hero` | `empleo` |
| `cta-freelance-hero` | `hero_cta_freelance` | `freelance_service` | `hero` | `freelance` |
| `cta-contact-footer` | `footer_cta` | `general_contact` | `footer` | Nada (deja el placeholder) |

Implementación sugerida: atributos `data-cta-type`, `data-source` y `data-interest` en cada CTA, leídos por un único listener delegado.

**Al hacer clic en un CTA:**
1. Si tiene `data-interest`, se preselecciona ese valor en el selector.
2. Scroll suave a `#contact` y foco en el primer campo vacío.
3. En segundo plano (sin bloquear): si el `cta_type` no está en `sessionStorage["cta_clicks_sent"]`, se obtiene un token reCAPTCHA (acción `cta_click`), se envía el POST y se añade el `cta_type` a esa lista.

### 9.5 Timeouts y Errores de Red
- `AbortController` con 12 segundos para `/api/contact` y 8 segundos para analytics.
- `TypeError` de `fetch` o timeout → `err_network`.

---

## 10. Seguridad del Lado Cliente

### 10.1 Secretos
Ningún secreto en el frontend. Solo la **site key** pública de reCAPTCHA, en la constante `RECAPTCHA_SITE_KEY` de `script.js`.

### 10.2 Inserción de Texto (prevención de XSS)
- Todo texto dinámico (traducciones, mensajes) se inserta con `textContent`. **Nunca** `innerHTML` con datos variables.
- El cliente no "sanitiza" como control de seguridad; solo hace `trim` antes de enviar. La sanitización real ocurre en el backend.

### 10.3 Validación
El cliente valida para dar feedback inmediato con las mismas reglas del backend (§12.1). El backend vuelve a validar todo.

### 10.4 reCAPTCHA v3
- **Carga diferida:** el script `https://www.google.com/recaptcha/api.js?render=RECAPTCHA_SITE_KEY` se inyecta la primera vez que ocurre cualquiera de estos eventos: clic en un CTA, foco en un campo del formulario, o la sección `#contact` a 400px del viewport (IntersectionObserver).
- **Token al momento:** `grecaptcha.execute(RECAPTCHA_SITE_KEY, { action })` justo antes de cada envío (`contact`) o registro de clic (`cta_click`). Nunca se genera al cargar la página, porque el token vence a los 2 minutos.
- Si el script no carga (bloqueador, red), el formulario muestra `err_recaptcha` con el botón de copiar email.

---

## 11. Estado de la Aplicación

| Estado | Dónde | Clave | Valores / notas |
|--------|-------|-------|-----------------|
| Idioma | localStorage | `preferred-language` | `es` / `en`; por defecto `es` |
| Identificador de visitante | localStorage | `session_id` | UUID v4 sin expiración; si localStorage no está disponible, UUID en memoria mientras dure la página |
| CTAs ya registrados | sessionStorage | `cta_clicks_sent` | Array JSON de `cta_type` enviados en esta sesión del navegador |
| Estado del formulario | Memoria | — | `idle`, `submitting`, `success`, `error` |
| Mensaje activo | Memoria | — | Clave i18n del mensaje visible (para re-traducir) |

**Generación de UUID:** `crypto.randomUUID()`; si no existe, generador de respaldo con `crypto.getRandomValues()` que produzca formato v4 válido.

**Transiciones del formulario:** `idle → submitting` (enviar) · `submitting → success` · `submitting → error` · `success → idle` (enviar otro) · `error → submitting` (reintentar).

---

## 12. Validación y Mensajes

### 12.1 Reglas (idénticas al backend)

| Campo | Regla | Clave de error |
|-------|-------|----------------|
| Nombre | Requerido | `err_name_required` |
| Nombre | ≥ 2 caracteres tras `trim` | `err_name_short` |
| Nombre | ≤ 100 caracteres | `err_name_long` |
| Email | Requerido | `err_email_required` |
| Email | `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` y ≤ 254 caracteres | `err_email_invalid` |
| Interés | `empleo` o `freelance` | `err_interest_required` |
| Mensaje | Requerido | `err_message_required` |
| Mensaje | ≥ 10 caracteres tras `trim` | `err_message_short` |
| Mensaje | ≤ 2000 caracteres | `err_message_long` |

No se restringen caracteres en el nombre (acentos, apóstrofes y guiones son válidos).

### 12.2 Presentación
- Se valida al enviar y, después del primer intento, al salir de cada campo (`blur`).
- El error aparece debajo del campo, en `--color-error`, asociado con `aria-describedby`; el campo recibe `aria-invalid="true"`.
- El foco va al primer campo con error.
- Si el backend responde `VALIDATION_ERROR`, cada campo de `fields` se marca con `err_field_invalid`.

---

## 13. Manejo de Errores de Envío

| Situación | Clave del mensaje | Botones |
|-----------|-------------------|---------|
| Error de red o timeout | `err_network` | Reintentar |
| `400 VALIDATION_ERROR` | Errores por campo (§12.2) | — |
| `403 RECAPTCHA_FAILED` o script de reCAPTCHA no disponible | `err_recaptcha` | Reintentar, Copiar email |
| `503 SERVICE_UNAVAILABLE` | `err_unavailable` | Copiar email |
| `500` u otro código | `err_server` | Reintentar, Copiar email |

**Copiar email:** `navigator.clipboard.writeText(CONTACT_EMAIL)` → muestra `form_email_copied`. Si la API no está disponible o falla, muestra `form_copy_failed` con el email en texto seleccionable.

Los mensajes de estado se anuncian en una región `aria-live="polite"`.

---

## 14. Estados de Carga

**Formulario (`submitting`):** botón deshabilitado con texto `form_submitting` y spinner (`aria-hidden="true"`), campos deshabilitados, opacidad reducida, `aria-busy="true"`.

**Analytics:** sin indicador visible; nunca bloquea el scroll ni la interacción.

---

## 15. Accesibilidad (WCAG 2.1 AA)

### 15.1 Semántica
`header` > `nav`; `main#main`; `section` con encabezado propio; `footer`. Un solo `h1` (nombre), `h2` por sección, `h3` en tarjetas.

### 15.2 Idioma del Documento
`<html lang="es">` inicial; se cambia a `en` con el toggle.

### 15.3 Contraste
Paleta y ratios verificados en `Arquitectura.md` §4.1 (todos ≥ 4.5:1 para texto y ≥ 3:1 para componentes UI y foco).

### 15.4 Teclado
- Todo accesible con Tab en orden visual; enlace "Saltar al contenido" al inicio.
- Foco visible: `outline: 3px solid var(--color-accent); outline-offset: 2px` (con `:focus-visible`).
- Drawer: foco retenido mientras está abierto, Escape lo cierra, el foco vuelve al hamburguesa.

### 15.5 Lectores de Pantalla
Iconos decorativos con `aria-hidden="true"`; botones de solo icono con `aria-label` traducido; `aria-expanded` y `aria-controls` en el hamburguesa; `aria-current` en el enlace activo; `aria-live` para estados del formulario.

### 15.6 Formularios
`<label for>` visible en cada campo; `aria-required="true"`; `aria-invalid` y `aria-describedby` en errores.

### 15.7 Áreas Táctiles
Todo control interactivo mide al menos 44×44px (botones, enlaces del menú, toggle de idioma, hamburguesa, opciones del selector).

### 15.8 Movimiento Reducido
```css
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
}
```
En JS, el scroll programático usa `behavior: "auto"` si `matchMedia("(prefers-reduced-motion: reduce)")` es verdadero.

---

## 16. Rendimiento

### 16.1 Optimizaciones
- HTML semántico sin comentarios innecesarios; meta tags (`title`, `description`, `viewport`, Open Graph con `og-image.png`).
- Un solo CSS; fuentes del sistema (0 KB de fuentes, sin saltos de layout).
- `translations.js` y `script.js` con `defer`; listeners delegados.
- reCAPTCHA con carga diferida (§10.4).
- Imágenes con `width` y `height` explícitos; `loading="lazy"` en las que estén bajo el pliegue.

### 16.2 Métricas Objetivo

| Métrica | Objetivo |
|---------|----------|
| First Contentful Paint | < 1 s |
| Largest Contentful Paint | < 2 s |
| Cumulative Layout Shift | < 0.1 |
| Total Blocking Time | < 200 ms |

### 16.3 Presupuesto de Tamaño (sin minificar, sin reCAPTCHA)

| Recurso | Máximo |
|---------|--------|
| `index.html` | 30 KB |
| `css/style.css` | 30 KB |
| `js/script.js` + `js/translations.js` | 40 KB |
| Imágenes totales | 200 KB |

---

## 17. UX/UI

### 17.1 Principios
Claridad, consistencia, simplicidad, accesibilidad.

### 17.2 Paleta de Colores

| Variable | Hex | Uso |
|----------|-----|-----|
| `--color-primary` | `#1D4ED8` | Encabezados, CTA primario |
| `--color-primary-hover` | `#1E40AF` | Hover/active del CTA primario |
| `--color-accent` | `#2563EB` | CTA secundario, enlaces, foco |
| `--color-text` | `#1F2937` | Texto principal |
| `--color-text-muted` | `#4B5563` | Texto secundario |
| `--color-bg` | `#FFFFFF` | Fondo principal |
| `--color-bg-alt` | `#F3F4F6` | Fondos alternados |
| `--color-badge-bg` | `#DBEAFE` | Fondo de badges |
| `--color-border-input` | `#6B7280` | Borde de campos |
| `--color-border-subtle` | `#E5E7EB` | Bordes decorativos |
| `--color-success` | `#15803D` | Éxito |
| `--color-error` | `#B91C1C` | Error |

### 17.3 Tipografía

```css
--font-sans: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
--font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
```

- `--font-sans` para todo el texto; `--font-mono` para badges, estados y la tagline (acento "dev/data").
- Jerarquía: H1 (Hero), H2 (sección), H3 (tarjetas), párrafo, small.
- Pesos: 400, 500, 600, 700. Escala modular 1.25; base 16px (móvil), 18px (desktop).

### 17.4 Espaciado
`--space-xs: 4px` · `--space-sm: 8px` · `--space-md: 16px` · `--space-lg: 24px` · `--space-xl: 32px` · `--space-2xl: 48px` · `--space-3xl: 64px`.

### 17.5 Sombras y Bordes
Sombra suave en tarjetas, barra de navegación al hacer scroll y drawer. Bordes redondeados (8px) en tarjetas y botones. Campos con borde `--color-border-input`.

### 17.6 Transiciones
Botones y enlaces 200ms ease; tarjetas (sombra, transform) 200ms ease; drawer (transform) 300ms ease. Todas desactivadas con movimiento reducido.

---

## 18. Organización del Código

### 18.1 `style.css`
1. Variables · 2. Reset/base · 3. Tipografía · 4. Layout y utilidades (incluida `.visually-hidden`) · 5. Componentes · 6. Formulario · 7. Estados · 8. Responsive (`min-width`) · 9. `prefers-reduced-motion`.

### 18.2 `script.js`
1. Constantes (`RECAPTCHA_SITE_KEY`, `CONTACT_EMAIL`, endpoints, regex) · 2. Utilidades (UUID, storage seguro con try/catch, `t(key)` con interpolación) · 3. i18n · 4. Navegación y drawer · 5. CTAs y analytics · 6. reCAPTCHA (carga diferida, `getToken(action)`) · 7. Formulario (validación, envío, estados) · 8. Inicialización.

### 18.3 Convenciones
- CSS: clases tipo BEM; estados con `is-` / `has-`; variables con `--`.
- JS: `camelCase` para funciones y variables, `UPPER_SNAKE_CASE` para constantes, IDs del DOM en `kebab-case`.
- Claves i18n en `snake_case`.

---

## 19. Pruebas de Frontend

| Prueba | Cómo |
|--------|------|
| Catálogo i18n completo | Script de consola que compara `Object.keys(TRANSLATIONS.es)` con `TRANSLATIONS.en` y con todos los `data-i18n*` del DOM: ninguna clave faltante ni sobrante |
| Flujo empleo | Clic en "Buscar empleo" → selector en `empleo` → envío → mensaje de éxito |
| Flujo freelance | Igual con "Servicio freelance" |
| Flujo directo | Menú → Contacto → selector sin valor → error `err_interest_required` al enviar sin elegir |
| CTA del footer | Envía `general_contact` / `footer`; no preselecciona |
| Deduplicación | Dos clics en el mismo CTA → un solo POST en la pestaña Network |
| Errores | Con `netlify dev` y variables incorrectas o red desactivada, verificar cada fila de §13 |
| Idioma | Cambiar idioma con un error visible → el error se re-traduce; `<html lang>` cambia |
| Teclado | Recorrer toda la página solo con teclado, incluido el drawer |
| Lector de pantalla | Orca (Fedora), NVDA (Windows) o VoiceOver (macOS/iOS): anuncios de estado y errores |
| Movimiento reducido | Activar la preferencia del sistema → sin scroll suave ni transiciones |
| Rendimiento y accesibilidad | Lighthouse en móvil: métricas de §16.2 y puntaje de accesibilidad ≥ 95 |
| Responsive | 360px, 768px y 1280px de ancho |

---

## 20. Criterios de Aceptación

### 20.1 HTML
- [ ] Estructura semántica correcta y un solo `h1`
- [ ] Todo texto visible traducible tiene `data-i18n*` (excepto el nombre en el `h1`)
- [ ] Meta tags (title, description, viewport, Open Graph)
- [ ] `translations.js` y `script.js` con `defer`; reCAPTCHA **no** está en el HTML inicial

### 20.2 CSS
- [ ] Variables con los hex de §17.2
- [ ] Media queries solo con `min-width`
- [ ] Estados hover, focus-visible y active definidos
- [ ] Bloque `prefers-reduced-motion`

### 20.3 JavaScript
- [ ] Toggle de idioma traduce texto, placeholders, `aria-label`, `lang`, título y meta descripción
- [ ] Persistencia de idioma y `session_id` con manejo de localStorage no disponible
- [ ] CTAs según §9.4, con deduplicación por sesión
- [ ] Token de reCAPTCHA generado al enviar, con la acción correcta
- [ ] Mensajes elegidos por `code`, nunca por texto del backend
- [ ] Ningún `innerHTML` con datos variables

### 20.4 Accesibilidad
- [ ] Contraste según `Arquitectura.md` §4.1
- [ ] Navegación completa por teclado, foco visible, drawer con foco retenido
- [ ] Labels visibles, `aria-live`, `aria-invalid`, `aria-describedby`
- [ ] Áreas táctiles ≥ 44×44px

### 20.5 Rendimiento
- [ ] Métricas de §16.2 en Lighthouse móvil
- [ ] Presupuesto de tamaño de §16.3 respetado

---

## Aprobación

| Rol | Estado | Fecha |
|-----|--------|-------|
| Senior Frontend Engineer | Aprobado | 22/09/2026 |

---

*Documento generado por Senior Frontend Engineer — OpenCode Workspace Framework v1.2*

*v2.0 — Corregido tras auditoría técnica*
