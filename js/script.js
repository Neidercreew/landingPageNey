/* =========================================================
   Neider Peña — Lógica de cliente
   Orden: 1. Configuración · 2. Utilidades · 3. Idioma
          4. Navegación · 5. Proyectos y animaciones
          6. Analytics · 7. reCAPTCHA · 8. Formulario · 9. Inicio
   ========================================================= */

"use strict";

(() => {
  /* ---------- 1. CONFIGURACIÓN ---------- */
  const CONFIG = Object.freeze({
    defaultLang: "es",
    storageKeys: Object.freeze({ lang: "np_lang", session: "np_session_id" }),
    endpoints: Object.freeze({
      contact: "/api/contact",
      ctaClick: "/api/analytics/cta-click",
    }),
    requestTimeoutMs: 10000,
    copiedFeedbackMs: 2500,
    scrollShadowThreshold: 8,
    desktopNavQuery: "(min-width: 768px)",
    reducedMotionQuery: "(prefers-reduced-motion: reduce)",
    // Se completa en el paso de backend, al registrar el sitio en Google reCAPTCHA v3
    recaptchaSiteKey: "",
    recaptchaAction: "contact",
  });

  // Valores que espera la función de analytics (ver backend.md §3.2)
  const CTA_TYPES = Object.freeze({
    empleo: "employment_inquiry",
    freelance: "freelance_service",
  });

  const dom = {
    html: document.documentElement,
    metaDescription: document.querySelector('meta[name="description"]'),
    header: document.getElementById("nav"),
    menu: document.getElementById("nav-menu"),
    menuToggle: document.getElementById("menu-toggle"),
    overlay: document.getElementById("nav-overlay"),
    langToggle: document.getElementById("lang-toggle"),
    navLinks: document.querySelectorAll(".nav__link"),
    filterButtons: document.querySelectorAll(".filters__btn"),
    projects: document.querySelectorAll(".project"),
    ctaLinks: document.querySelectorAll("[data-cta]"),
    form: document.getElementById("contact-form"),
    submitButton: document.getElementById("form-submit"),
    status: document.getElementById("form-status"),
    copyEmailButton: document.getElementById("copy-email"),
  };

  const hasTranslations = typeof TRANSLATIONS !== "undefined";
  let currentLang = CONFIG.defaultLang;
  let isSubmitting = false;

  /* ---------- 2. UTILIDADES ---------- */

  // localStorage puede no existir o lanzar error (modo privado, cookies bloqueadas).
  // En ese caso la página funciona igual, solo que sin recordar preferencias.
  const storage = {
    get(key) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    set(key, value) {
      try {
        window.localStorage.setItem(key, value);
        return true;
      } catch {
        return false;
      }
    },
  };

  function generateUUID() {
    if (window.crypto?.randomUUID) {
      return window.crypto.randomUUID();
    }
    // Respaldo para navegadores antiguos: UUID v4 con getRandomValues
    const bytes = window.crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  // Mismo session_id para clics y envíos: permite medir conversión (backend.md §4.3)
  function getSessionId() {
    let sessionId = storage.get(CONFIG.storageKeys.session);
    if (!sessionId) {
      sessionId = generateUUID();
      storage.set(CONFIG.storageKeys.session, sessionId);
    }
    return sessionId;
  }

  async function postJSON(url, payload, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.requestTimeoutMs);
    try {
      return await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
        ...options,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  const prefersReducedMotion = () => window.matchMedia(CONFIG.reducedMotionQuery).matches;

  /* ---------- 3. IDIOMA ---------- */

  function t(key) {
    if (!hasTranslations) return "";
    return TRANSLATIONS[currentLang]?.[key] ?? TRANSLATIONS[CONFIG.defaultLang]?.[key] ?? "";
  }

  function applyTranslations() {
    dom.html.lang = currentLang;
    document.title = t("meta.title") || document.title;
    if (dom.metaDescription) {
      dom.metaDescription.setAttribute("content", t("meta.description"));
    }

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const text = t(el.dataset.i18n);
      if (text) el.textContent = text;
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const text = t(el.dataset.i18nPlaceholder);
      if (text) el.setAttribute("placeholder", text);
    });

    document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      const text = t(el.dataset.i18nAria);
      if (text) el.setAttribute("aria-label", text);
    });

    // El botón muestra el idioma al que se va a cambiar
    dom.langToggle.textContent = currentLang === "es" ? "EN" : "ES";
    dom.langToggle.setAttribute("aria-label", t("nav.lang_switch"));
    updateMenuToggleLabel();
  }

  function setLanguage(lang, { persist = false } = {}) {
    if (!hasTranslations || !TRANSLATIONS[lang]) return;
    currentLang = lang;
    applyTranslations();
    if (persist) storage.set(CONFIG.storageKeys.lang, lang);
  }

  function initLanguage() {
    if (!hasTranslations) {
      // Sin traducciones la página queda en español (texto del HTML)
      dom.langToggle.hidden = true;
      return;
    }
    const savedLang = storage.get(CONFIG.storageKeys.lang);
    setLanguage(TRANSLATIONS[savedLang] ? savedLang : CONFIG.defaultLang);

    dom.langToggle.addEventListener("click", () => {
      setLanguage(currentLang === "es" ? "en" : "es", { persist: true });
    });
  }

  /* ---------- 4. NAVEGACIÓN ---------- */

  const isDesktopNav = () => window.matchMedia(CONFIG.desktopNavQuery).matches;
  const isMenuOpen = () => dom.menu.classList.contains("is-open");

  function updateMenuToggleLabel() {
    const key = isMenuOpen() ? "nav.close" : "nav.open";
    const label = t(key);
    if (label) dom.menuToggle.setAttribute("aria-label", label);
  }

  function openMenu() {
    dom.menu.classList.add("is-open");
    dom.menuToggle.setAttribute("aria-expanded", "true");
    dom.overlay.hidden = false;
    document.body.style.overflow = "hidden";
    updateMenuToggleLabel();
    dom.navLinks[0]?.focus();
  }

  function closeMenu({ returnFocus = true } = {}) {
    if (!isMenuOpen()) return;
    dom.menu.classList.remove("is-open");
    dom.menuToggle.setAttribute("aria-expanded", "false");
    dom.overlay.hidden = true;
    document.body.style.overflow = "";
    updateMenuToggleLabel();
    if (returnFocus) dom.menuToggle.focus();
  }

  function initMenu() {
    dom.menuToggle.addEventListener("click", () => {
      if (isMenuOpen()) closeMenu();
      else openMenu();
    });

    dom.overlay.addEventListener("click", () => closeMenu());

    dom.navLinks.forEach((link) => {
      link.addEventListener("click", () => closeMenu({ returnFocus: false }));
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });

    // Si la pantalla crece a tamaño escritorio con el menú abierto, se cierra
    window.matchMedia(CONFIG.desktopNavQuery).addEventListener("change", () => {
      if (isDesktopNav()) closeMenu({ returnFocus: false });
    });
  }

  function initHeaderShadow() {
    const update = () => {
      dom.header.classList.toggle("is-scrolled", window.scrollY > CONFIG.scrollShadowThreshold);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  // Resalta en el menú la sección que se está viendo
  function initActiveLink() {
    if (!("IntersectionObserver" in window)) return;

    const linkBySection = new Map();
    dom.navLinks.forEach((link) => {
      const section = document.querySelector(link.getAttribute("href"));
      if (section) linkBySection.set(section, link);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          dom.navLinks.forEach((link) => {
            link.classList.remove("is-active");
            link.removeAttribute("aria-current");
          });
          const activeLink = linkBySection.get(entry.target);
          activeLink.classList.add("is-active");
          activeLink.setAttribute("aria-current", "true");
        });
      },
      // Una sección se considera activa cuando cruza la franja central de la pantalla
      { rootMargin: "-45% 0px -50% 0px" }
    );

    linkBySection.forEach((_link, section) => observer.observe(section));
  }

  /* ---------- 5. PROYECTOS Y ANIMACIONES ---------- */

  function filterProjects(filter) {
    dom.projects.forEach((project) => {
      const categories = project.dataset.category.split(" ");
      const visible = filter === "all" || categories.includes(filter);
      project.classList.toggle("is-hidden", !visible);
    });
  }

  function initFilters() {
    dom.filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        dom.filterButtons.forEach((btn) => {
          const isActive = btn === button;
          btn.classList.toggle("is-active", isActive);
          btn.setAttribute("aria-pressed", String(isActive));
        });
        filterProjects(button.dataset.filter);
      });
    });
  }

  function initReveal() {
    if (!("IntersectionObserver" in window) || prefersReducedMotion()) return;

    const targets = document.querySelectorAll(
      ".section__eyebrow, .section__title, .about__text, .timeline__item, .card, .stack__group, .project, .form"
    );

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12 }
    );

    targets.forEach((el) => {
      el.classList.add("reveal");
      observer.observe(el);
    });
  }

  /* ---------- 6. ANALYTICS ---------- */

  // Rastreo silencioso (backend.md §4.1): si falla, no debe afectar al visitante
  function trackCtaClick(interest, source) {
    const ctaType = CTA_TYPES[interest];
    if (!ctaType) return;

    postJSON(
      CONFIG.endpoints.ctaClick,
      { cta_type: ctaType, session_id: getSessionId(), source },
      { keepalive: true }
    ).catch(() => {
      // Intencional: el analytics nunca bloquea ni muestra errores al usuario
    });
  }

  function selectInterest(interest) {
    const radio = dom.form?.querySelector(`input[name="interest_type"][value="${interest}"]`);
    if (radio) radio.checked = true;
  }

  function initCtas() {
    dom.ctaLinks.forEach((link) => {
      link.addEventListener("click", () => {
        const { cta: interest, source } = link.dataset;
        selectInterest(interest);
        trackCtaClick(interest, source);
      });
    });
  }

  /* ---------- 7. reCAPTCHA ---------- */

  // Devuelve null mientras reCAPTCHA no esté configurado (paso de backend)
  function getRecaptchaToken() {
    if (!CONFIG.recaptchaSiteKey || typeof window.grecaptcha === "undefined") {
      return Promise.resolve(null);
    }
    return new Promise((resolve, reject) => {
      window.grecaptcha.ready(() => {
        window.grecaptcha
          .execute(CONFIG.recaptchaSiteKey, { action: CONFIG.recaptchaAction })
          .then(resolve, reject);
      });
    });
  }

  /* ---------- 8. FORMULARIO ---------- */

  // Estados: idle → submitting → success | error (frontend.md §14)
  function setFormState(state) {
    const submitting = state === "submitting";
    isSubmitting = submitting;

    dom.form.classList.toggle("is-submitting", submitting);
    dom.form.setAttribute("aria-busy", String(submitting));
    dom.submitButton.disabled = submitting;
    dom.submitButton.classList.toggle("is-loading", submitting);

    const submitText = dom.submitButton.querySelector(".form__submit-text");
    submitText.dataset.i18n = submitting ? "contact.sending" : "contact.submit";
    submitText.textContent = t(submitText.dataset.i18n) || submitText.textContent;

    const statusKey = { success: "contact.success", error: "contact.error" }[state];
    dom.status.classList.toggle("is-success", state === "success");
    dom.status.classList.toggle("is-error", state === "error");
    if (statusKey) {
      // Con data-i18n el mensaje se re-traduce si el visitante cambia de idioma
      dom.status.dataset.i18n = statusKey;
      dom.status.textContent = t(statusKey);
    } else {
      delete dom.status.dataset.i18n;
      dom.status.textContent = "";
    }

    dom.copyEmailButton.hidden = state !== "error";
  }

  function buildContactPayload(recaptchaToken) {
    const data = new FormData(dom.form);
    const value = (field) => String(data.get(field) ?? "").trim();
    return {
      name: value("name"),
      email: value("email"),
      message: value("message"),
      interest_type: value("interest_type"),
      session_id: getSessionId(),
      honeypot: value("website"),
      recaptcha_token: recaptchaToken,
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;

    if (!dom.form.checkValidity()) {
      dom.form.reportValidity();
      return;
    }

    setFormState("submitting");

    try {
      const recaptchaToken = await getRecaptchaToken();
      const response = await postJSON(CONFIG.endpoints.contact, buildContactPayload(recaptchaToken));
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const result = await response.json();
      if (!result.success) {
        throw new Error("La función respondió success=false");
      }
      dom.form.reset();
      setFormState("success");
    } catch (error) {
      // Solo el tipo de error, nunca los datos del visitante (Arquitectura §7.5)
      console.error("[contacto] No se pudo enviar el formulario:", error.message);
      setFormState("error");
    }
  }

  async function handleCopyEmail() {
    const email = dom.copyEmailButton.dataset.email;
    try {
      await navigator.clipboard.writeText(email);
      dom.copyEmailButton.dataset.i18n = "contact.copied";
      dom.copyEmailButton.textContent = t("contact.copied");
      setTimeout(() => {
        dom.copyEmailButton.dataset.i18n = "contact.copy_email";
        dom.copyEmailButton.textContent = t("contact.copy_email");
      }, CONFIG.copiedFeedbackMs);
    } catch {
      // Sin acceso al portapapeles (permiso denegado o sitio sin HTTPS): se muestra el correo
      delete dom.status.dataset.i18n;
      dom.status.textContent = t("contact.copy_failed") + email;
    }
  }

  function initForm() {
    if (!dom.form) return;
    dom.form.addEventListener("submit", handleSubmit);
    dom.copyEmailButton.addEventListener("click", handleCopyEmail);
  }

  /* ---------- 9. INICIO ---------- */
  getSessionId();
  initLanguage();
  initMenu();
  initHeaderShadow();
  initActiveLink();
  initFilters();
  initReveal();
  initCtas();
  initForm();
})();