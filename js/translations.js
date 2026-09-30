/* =========================================================
   Traducciones ES / EN
   Cada clave coincide con un atributo del HTML:
     data-i18n="clave"             -> texto del elemento
     data-i18n-placeholder="clave" -> placeholder de un campo
     data-i18n-aria="clave"        -> aria-label del elemento
   Para agregar un idioma: copiar el bloque "en" con otro
   código (ej. "pt") y traducir los valores.
   ========================================================= */

const TRANSLATIONS = Object.freeze({
  es: {
    /* Metadatos de la página */
    "meta.title": "Neider Peña | Analista de Datos & Desarrollador Full Stack Junior",
    "meta.description": "Neider Steven Peña Riaño: analista de datos (SQL, Excel, Power BI) y desarrollador full stack junior (Node.js, React Native, Flutter). Disponible para vacantes y proyectos freelance.",

    /* Comunes */
    "common.skip": "Saltar al contenido",
    "common.tag_data": "Datos",
    "common.tag_dev": "Desarrollo",

    /* Navegación */
    "nav.aria": "Navegación principal",
    "nav.about": "Sobre mí",
    "nav.services": "Servicios",
    "nav.skills": "Stack",
    "nav.projects": "Proyectos",
    "nav.contact": "Contacto",
    "nav.open": "Abrir menú",
    "nav.close": "Cerrar menú",
    "nav.lang_switch": "Cambiar idioma a inglés",

    /* Hero */
    "hero.status": "Disponible para vacantes y proyectos freelance",
    "hero.greeting": "Hola, soy",
    "hero.role_data": "Analista de Datos",
    "hero.role_dev": "Desarrollador Full Stack Junior",
    "hero.description": "Transformo datos en decisiones y construyo el software que las hace posibles: desde la consulta SQL hasta la API y la app que la usa.",

    /* Llamados a la acción */
    "cta.job": "Tengo una vacante",
    "cta.freelance": "Necesito un proyecto",

    /* Sobre mí */
    "about.eyebrow": "Sobre mí",
    "about.title": "Dos perfiles, una misma forma de pensar",
    "about.p1": "Empecé en operaciones de soporte como SME, donde entendí cómo los datos (tickets, SLAs, métricas) mueven las decisiones del día a día.",
    "about.p2": "Hoy combino ese criterio de negocio con el desarrollo: analizo datos con SQL y Excel, y construyo aplicaciones web y móviles con Node.js, React Native y Flutter.",
    "about.t1_date": "2026 · Actual",
    "about.t1_title": "Practicante Full Stack",
    "about.t1_text": "Desarrollo de un portal administrativo de clientes: contrato de API, modelo de datos y vistas de gestión.",
    "about.t2_date": "Hasta 2026",
    "about.t2_title": "SME en Operaciones de Soporte",
    "about.t2_text": "Referente de conocimiento del equipo, trabajando a diario con métricas operativas, tickets y SLAs.",
    "about.t3_date": "En curso",
    "about.t3_title": "Ingeniería de Sistemas",
    "about.t3_place": "Sexto semestre",
    "about.t3_text": "Formación en desarrollo de software, bases de datos y arquitectura de sistemas.",

    /* Servicios */
    "services.eyebrow": "Servicios",
    "services.title": "Qué puedo hacer por tu equipo",
    "services.s1_title": "Análisis de datos y SQL",
    "services.s1_text": "Extracción, limpieza y consulta de datos con SQL, desde filtros simples hasta JOINs y agregaciones, para convertir datos crudos en información confiable.",
    "services.s2_title": "Reporting y dashboards",
    "services.s2_text": "Reportes automatizados en Excel avanzado (XLOOKUP, INDEX+MATCH, tablas dinámicas) y dashboards de KPIs en Power BI, habilidad en desarrollo.",
    "services.s3_title": "Desarrollo web full stack",
    "services.s3_text": "APIs REST con Node.js y Express, bases de datos relacionales y NoSQL, e interfaces web claras, responsive y accesibles.",
    "services.s4_title": "Apps móviles",
    "services.s4_text": "Aplicaciones multiplataforma con React Native y Flutter, conectadas a su propio backend y desplegadas en la nube.",

    /* Stack */
    "skills.eyebrow": "Stack",
    "skills.title": "Herramientas con las que trabajo",
    "skills.g_data": "Datos",
    "skills.g_front": "Frontend y móvil",
    "skills.g_tools": "Herramientas",
    "skills.excel": "Excel avanzado",
    "skills.powerbi": "Power BI (aprendiendo)",

    /* Proyectos */
    "projects.eyebrow": "Proyectos",
    "projects.title": "Trabajo reciente",
    "projects.filter_label": "Filtrar proyectos",
    "projects.f_all": "Todos",
    "projects.f_data": "Datos",
    "projects.f_dev": "Desarrollo",
    "projects.view_code": "Ver código",
    "projects.p1_tag": "App móvil · Full Stack",
    "projects.p1_text": "App que enseña a adultos mayores a usar su celular con lecciones progresivas y simuladores seguros. Lidero un equipo de tres desarrolladores.",
    "projects.p2_tag": "MVP · Full Stack",
    "projects.p2_title": "Onboarding KYC",
    "projects.p2_text": "MVP de verificación de identidad para pequeños negocios: captura de documentos, OCR, validación y resultado con puntaje. Probado en dispositivo real.",
    "projects.p3_tag": "Práctica profesional · Privado",
    "projects.p3_title": "Expediente Digital del Cliente",
    "projects.p3_text": "Portal administrativo 360° de clientes para una empresa de distribución: contrato de API, modelo de datos y vista de expediente con métricas.",
    "projects.p4_tag": "Web · Serverless",
    "projects.p4_title": "Este portafolio",
    "projects.p4_text": "Landing bilingüe con formulario serverless, CRM en Airtable, analytics de conversión y protección anti-spam. Costo de operación: cero.",
    "projects.p5_tag": "Excel · Reto de práctica",
    "projects.p5_title": "Resumen automático de estados",
    "projects.p5_text": "Reto propio: fórmulas combinadas con TEXTJOIN, IFS y TEXT que generan resúmenes de estado y prioridades a partir de una tabla de registros.",
    "projects.p6_tag": "SQL · Reto de práctica",
    "projects.p6_title": "Consultas de segmentación",
    "projects.p6_text": "Ejercicios de consulta con JOIN, CASE, GROUP BY y HAVING para clasificar registros y resumir grupos por categoría.",

    /* Contacto */
    "contact.eyebrow": "Contacto",
    "contact.title": "Hablemos",
    "contact.intro": "¿Tienes una vacante o un proyecto en mente? Escríbeme y te respondo lo antes posible.",
    "contact.interest_legend": "¿Me contactas por una vacante o por un proyecto freelance?",
    "contact.interest_job": "Vacante laboral",
    "contact.interest_freelance": "Proyecto freelance",
    "contact.name_label": "Nombre",
    "contact.name_ph": "Tu nombre completo",
    "contact.email_label": "Correo electrónico",
    "contact.email_ph": "tu@correo.com",
    "contact.message_label": "Mensaje",
    "contact.message_ph": "Cuéntame brevemente qué necesitas",
    "contact.submit": "Enviar mensaje",
    "contact.sending": "Enviando...",
    "contact.success": "¡Gracias por escribirme! Te responderé lo antes posible.",
    "contact.error": "Hubo un problema al enviar tu mensaje. Intenta de nuevo o copia mi correo y escríbeme directamente.",
    "contact.copy_email": "Copiar email de contacto",
    "contact.copied": "¡Correo copiado!",
    "contact.copy_failed": "No se pudo copiar. Mi correo es: ",

    /* Footer */
    "footer.cta_text": "¿Trabajamos juntos?",
    "footer.availability": "Analista de Datos · Desarrollador Full Stack Junior"
  },

  en: {
    /* Page metadata */
    "meta.title": "Neider Peña | Data Analyst & Junior Full Stack Developer",
    "meta.description": "Neider Steven Peña Riaño: data analyst (SQL, Excel, Power BI) and junior full stack developer (Node.js, React Native, Flutter). Open to job opportunities and freelance projects.",

    /* Common */
    "common.skip": "Skip to content",
    "common.tag_data": "Data",
    "common.tag_dev": "Development",

    /* Navigation */
    "nav.aria": "Main navigation",
    "nav.about": "About",
    "nav.services": "Services",
    "nav.skills": "Stack",
    "nav.projects": "Projects",
    "nav.contact": "Contact",
    "nav.open": "Open menu",
    "nav.close": "Close menu",
    "nav.lang_switch": "Switch language to Spanish",

    /* Hero */
    "hero.status": "Open to job opportunities and freelance projects",
    "hero.greeting": "Hi, I'm",
    "hero.role_data": "Data Analyst",
    "hero.role_dev": "Junior Full Stack Developer",
    "hero.description": "I turn data into decisions and build the software that makes them possible: from the SQL query to the API and the app that uses it.",

    /* Calls to action */
    "cta.job": "I have a job opening",
    "cta.freelance": "I need a project",

    /* About */
    "about.eyebrow": "About me",
    "about.title": "Two profiles, one way of thinking",
    "about.p1": "I started in support operations as an SME, where I learned how data (tickets, SLAs, metrics) drives day-to-day decisions.",
    "about.p2": "Today I combine that business sense with development: I analyze data with SQL and Excel, and I build web and mobile apps with Node.js, React Native and Flutter.",
    "about.t1_date": "2026 · Present",
    "about.t1_title": "Full Stack Intern",
    "about.t1_text": "Building a client management admin portal: API contract, data model and management views.",
    "about.t2_date": "Until 2026",
    "about.t2_title": "Support Operations SME",
    "about.t2_text": "Go-to knowledge expert for the team, working daily with operational metrics, tickets and SLAs.",
    "about.t3_date": "In progress",
    "about.t3_title": "Systems Engineering",
    "about.t3_place": "Sixth semester",
    "about.t3_text": "Training in software development, databases and systems architecture.",

    /* Services */
    "services.eyebrow": "Services",
    "services.title": "What I can do for your team",
    "services.s1_title": "Data analysis & SQL",
    "services.s1_text": "Data extraction, cleaning and querying with SQL, from simple filters to JOINs and aggregations, turning raw data into reliable information.",
    "services.s2_title": "Reporting & dashboards",
    "services.s2_text": "Automated reports in advanced Excel (XLOOKUP, INDEX+MATCH, pivot tables) and KPI dashboards in Power BI, a skill in progress.",
    "services.s3_title": "Full stack web development",
    "services.s3_text": "REST APIs with Node.js and Express, relational and NoSQL databases, and clear, responsive, accessible web interfaces.",
    "services.s4_title": "Mobile apps",
    "services.s4_text": "Cross-platform apps with React Native and Flutter, connected to their own backend and deployed to the cloud.",

    /* Stack */
    "skills.eyebrow": "Stack",
    "skills.title": "Tools I work with",
    "skills.g_data": "Data",
    "skills.g_front": "Frontend & mobile",
    "skills.g_tools": "Tools",
    "skills.excel": "Advanced Excel",
    "skills.powerbi": "Power BI (learning)",

    /* Projects */
    "projects.eyebrow": "Projects",
    "projects.title": "Recent work",
    "projects.filter_label": "Filter projects",
    "projects.f_all": "All",
    "projects.f_data": "Data",
    "projects.f_dev": "Development",
    "projects.view_code": "View code",
    "projects.p1_tag": "Mobile app · Full Stack",
    "projects.p1_text": "An app that teaches older adults to use their phones through progressive lessons and safe simulators. I lead a team of three developers.",
    "projects.p2_tag": "MVP · Full Stack",
    "projects.p2_title": "KYC Onboarding",
    "projects.p2_text": "Identity verification MVP for small businesses: document capture, OCR, validation and a scored result. Tested on a real device.",
    "projects.p3_tag": "Internship · Private",
    "projects.p3_title": "Digital Client File",
    "projects.p3_text": "360° client admin portal for a distribution company: API contract, data model and a client file view with metrics.",
    "projects.p4_tag": "Web · Serverless",
    "projects.p4_title": "This portfolio",
    "projects.p4_text": "Bilingual landing page with a serverless form, Airtable CRM, conversion analytics and anti-spam protection. Running cost: zero.",
    "projects.p5_tag": "Excel · Practice challenge",
    "projects.p5_title": "Automatic status summary",
    "projects.p5_text": "Self-made challenge: formulas combining TEXTJOIN, IFS and TEXT that generate status and priority summaries from a records table.",
    "projects.p6_tag": "SQL · Practice challenge",
    "projects.p6_title": "Segmentation queries",
    "projects.p6_text": "Query exercises with JOIN, CASE, GROUP BY and HAVING to classify records and summarize groups by category.",

    /* Contact */
    "contact.eyebrow": "Contact",
    "contact.title": "Let's talk",
    "contact.intro": "Do you have a job opening or a project in mind? Write to me and I'll get back to you as soon as possible.",
    "contact.interest_legend": "Are you reaching out about a job opening or a freelance project?",
    "contact.interest_job": "Job opening",
    "contact.interest_freelance": "Freelance project",
    "contact.name_label": "Name",
    "contact.name_ph": "Your full name",
    "contact.email_label": "Email",
    "contact.email_ph": "you@email.com",
    "contact.message_label": "Message",
    "contact.message_ph": "Briefly tell me what you need",
    "contact.submit": "Send message",
    "contact.sending": "Sending...",
    "contact.success": "Thanks for reaching out! I'll get back to you as soon as possible.",
    "contact.error": "There was a problem sending your message. Try again or copy my email and write to me directly.",
    "contact.copy_email": "Copy contact email",
    "contact.copied": "Email copied!",
    "contact.copy_failed": "Couldn't copy it. My email is: ",

    /* Footer */
    "footer.cta_text": "Shall we work together?",
    "footer.availability": "Data Analyst · Junior Full Stack Developer"
  }
});