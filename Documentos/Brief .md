# MASTER-BRIEF — Landing Page Personal de Análisis de Datos

Versión: 1.2

Estado: Aprobado

Cliente: Neider Steven Peña Riaño

---

## 1. Información General

- **Nombre:** Neider Steven Peña Riaño
- **Perfil:** Estudiante de Ingeniería de Sistemas, en transición hacia analista de datos
- **Trayectoria relevante:** SME (Subject Matter Expert) en operaciones de soporte (Concentrix), renunció para dedicarse de tiempo completo a su preparación técnica
- **Inversión:** $0 (proyecto personal, restricción de costo cero en todo el stack)
- **Plazo:** Urgente — meta de 5-7 días para tener la landing publicada

---

## 2. Servicios Ofrecidos

- **SQL:** extracción, limpieza y consulta de datos — filtros, CASE, GROUP BY, HAVING, JOINs (dominado).
- **Excel Avanzado:** fórmulas de búsqueda (XLOOKUP, INDEX+MATCH), funciones de texto y lógica condicional, tablas dinámicas, automatización de reportes (en desarrollo activo, nivel avanzado).
- **Power BI:** dashboards interactivos para visualización de KPIs (habilidad en desarrollo, aún no iniciada formalmente).

### Diferenciador principal

Combina experiencia operativa real (SME en soporte) con habilidades técnicas afiladas mediante autoestudio intensivo y disciplinado — no es un perfil junior genérico, entiende el dato de negocio desde adentro antes de analizarlo.

---

## 3. Objetivo del Proyecto

**Doble propósito:**
1. **Portafolio profesional** para búsqueda de empleo como analista de datos (dirigido a reclutadores y hiring managers de empresas de operaciones/soporte, tipo BPO/contact center).
2. **Captación de clientes freelance** de servicios de análisis de datos (dirigido a emprendedores y pequeñas empresas sin analista de datos interno).

La landing debe distinguir claramente estos dos públicos sin que se sientan mezclados.

---

## 4. Público Objetivo

| Segmento | Descripción |
|----------|-------------|
| Reclutadores / empresas | Empresas medianas-grandes de operaciones y soporte (BPO, contact centers) |
| Clientes freelance | Emprendedores o pequeñas empresas que necesitan análisis de datos puntual |

---

## 5. Problema que Resuelve

Convertir datos operativos crudos (tickets de soporte, métricas de SLA, hojas de Excel desordenadas) en reportes y análisis claros y accionables para la toma de decisiones.

---

## 6. Objetivo de la Landing Page

- **Meta principal:** generar contactos calificados (leads), diferenciados por tipo de interés.
- **Acción esperada del visitante:** completar el formulario de contacto indicando si su interés es una vacante o un servicio freelance. El CTA que usó deja esa opción preseleccionada en un selector visible, que el visitante puede cambiar; si llega al formulario sin pasar por un CTA, la elige él mismo.
- **CTAs:**
  - CTA primario (Hero): "Buscar empleo" → interest_type = "empleo"
  - CTA secundario (Hero): "Servicio freelance" → interest_type = "freelance"
  - CTA de refuerzo (Footer): "Contactarme" → sin preselección

---

## 7. Contenido y Tono

- **Tono:** profesional pero cercano.
- **Secciones esenciales:** Hero, Sobre Mí, Servicios, Habilidades, Casos de Estudio, Contacto, Footer.
- **Materiales existentes:** aún no hay fotos profesionales ni portafolio armado; se usarán casos de estudio basados en retos de SQL/Excel ya practicados, marcados como plantilla hasta ser reemplazados con datos reales.
- **Idioma:** bilingüe (español/inglés) con toggle en la navegación, español por defecto, persistencia de preferencia en localStorage.

---

## 8. Referencias y Restricciones de Estilo

- Evitar plantillas genéricas de "freelancer creativo" con colores muy saturados.
- Preferencia por estética minimalista tipo "dev/data portfolio": secciones cortas, tipografía técnica, paleta profesional (azul + gris neutro).
- Tipografía con fuentes del sistema (sin descargas externas) y una fuente monoespaciada para acentos técnicos.

---

## 9. Restricciones Técnicas

- **Stack:** HTML5 + CSS3 + JavaScript puro (ES6+). Cero frameworks, cero CDN, cero preprocesadores, cero herramientas de build, cero bibliotecas de utilidad (jQuery, Lodash, etc.). Única excepción externa: el script de reCAPTCHA v3 de Google (servicio de seguridad, no librería).
- **Hosting:** Netlify (sitio estático + Functions en el mismo dominio). En el plan Free por créditos, cada deploy de producción consume créditos: máximo 10 deploys de producción al mes.
- **Almacenamiento y CRM:** Airtable (free tier) — guarda contactos, permite filtrar por tipo de interés y dar seguimiento (Nuevo → Contactado → En proceso → Cerrado). Contactos y analytics van en workspaces separados porque el plan Free limita a 1,000 llamadas API por workspace al mes.
- **Notificaciones:** EmailJS (free tier, sin necesidad de dominio propio), enviado desde el servidor.
- **Analytics:** registro de clics por CTA (uno por CTA por sesión del navegador), correlacionado con envíos de formulario vía session_id (UUID en localStorage).
- **Seguridad anti-spam:** honeypot + reCAPTCHA v3 en el formulario y en el registro de clics.
- **Responsive:** mobile-first — Móvil (0-576px), Tablet (577-991px), Desktop (992px+).
- **Accesibilidad:** cumplimiento WCAG 2.1 AA (contraste, navegación por teclado, lectores de pantalla).
- **Costo total:** $0.

---

## 10. Métrica de Éxito

Número de contactos/consultas recibidas — meta inicial de 3-5 contactos calificados en las primeras 4 semanas, distinguidos entre leads de empleo y de freelance.

---

## 11. Entregables Esperados

- **Frontend** (carpeta `public/`, la única que se publica): `index.html`, `css/style.css`, `js/script.js`, `js/translations.js`
- **Recursos estáticos:** `public/assets/images/og-image.png`, `public/assets/images/favicon.ico`
- **Funciones serverless:** `netlify/functions/contact.js`, `netlify/functions/analytics.js`, con código compartido en `netlify/lib/`
- **Configuración:** `netlify.toml`, `package.json`, `.env.example`, `.gitignore`
- **Pruebas:** carpeta `tests/`
- **Documentación técnica** (carpeta `Documentos/`, no se publica): `Brief.md`, `Arquitectura.md`, `backend.md`, `frontend.md`, `Respuesta-Auditoria.md` (alineados entre sí)

La estructura completa del repositorio está definida en `Arquitectura.md` §3.

---

## Aprobación

| Rol | Estado |
|-----|--------|
| Senior Product Manager | Aprobado |
| Cliente (Neider Steven Peña Riaño) | Aprobado |
