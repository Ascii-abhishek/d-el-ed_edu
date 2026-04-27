(function () {
  const STORAGE_KEY = "deled-settings";
  const THEMES = ["light", "dark", "warm"];
  const defaults = {
    language: "en",
    theme: "light",
    fontScale: 1,
    fontFamily: "system"
  };

  function readSettings() {
    try {
      return { ...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) };
    } catch (error) {
      return { ...defaults };
    }
  }

  function writeSettings(settings) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }

  function applySettings(settings) {
    document.documentElement.lang = settings.language;
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.dataset.fontFamily = settings.fontFamily;
    document.documentElement.style.setProperty("--base-font-scale", settings.fontScale);

    document.querySelectorAll("[data-i18n]").forEach((node) => {
      const key = node.dataset.i18n;
      node.textContent = window.I18N[settings.language][key] || window.I18N.en[key] || key;
    });

    const languageToggle = document.getElementById("languageToggle");
    const fontSizeValue = document.getElementById("fontSizeValue");
    const fontFamilySelect = document.getElementById("fontFamilySelect");

    if (languageToggle) {
      const code = languageToggle.querySelector(".language-code");
      const nextLanguage = settings.language === "hi" ? "en" : "hi";
      if (code) code.textContent = nextLanguage === "hi" ? "हि" : "EN";
      languageToggle.title = nextLanguage === "hi" ? "हिंदी में बदलें" : "Switch to English";
      languageToggle.setAttribute("aria-label", languageToggle.title);
    }
    if (fontSizeValue) fontSizeValue.textContent = `${Math.round(settings.fontScale * 100)}%`;
    if (fontFamilySelect) fontFamilySelect.value = settings.fontFamily;

    window.dispatchEvent(new CustomEvent("settingschange", { detail: settings }));
  }

  function updateSettings(patch) {
    const next = { ...readSettings(), ...patch };
    writeSettings(next);
    applySettings(next);
  }

  function initSettingsControls() {
    const languageToggle = document.getElementById("languageToggle");
    const themeToggle = document.getElementById("themeToggle");
    const fontButton = document.getElementById("fontMenuButton");
    const fontPopover = document.getElementById("fontPopover");
    const decreaseFont = document.getElementById("decreaseFont");
    const increaseFont = document.getElementById("increaseFont");
    const fontFamilySelect = document.getElementById("fontFamilySelect");

    languageToggle.addEventListener("click", () => {
      const current = readSettings();
      updateSettings({ language: current.language === "en" ? "hi" : "en" });
    });

    themeToggle.addEventListener("click", () => {
      const current = readSettings();
      const index = THEMES.indexOf(current.theme);
      updateSettings({ theme: THEMES[(index + 1) % THEMES.length] });
    });

    fontButton.addEventListener("click", () => {
      const nextHidden = !fontPopover.hidden;
      fontPopover.hidden = nextHidden;
      fontButton.setAttribute("aria-expanded", String(!nextHidden));
    });

    document.addEventListener("click", (event) => {
      if (!fontPopover.hidden && !event.target.closest(".font-menu")) {
        fontPopover.hidden = true;
        fontButton.setAttribute("aria-expanded", "false");
      }
    });

    decreaseFont.addEventListener("click", () => {
      const current = readSettings();
      updateSettings({ fontScale: Math.max(0.85, Number((current.fontScale - 0.05).toFixed(2))) });
    });

    increaseFont.addEventListener("click", () => {
      const current = readSettings();
      updateSettings({ fontScale: Math.min(1.3, Number((current.fontScale + 0.05).toFixed(2))) });
    });

    fontFamilySelect.addEventListener("change", () => {
      updateSettings({ fontFamily: fontFamilySelect.value });
    });

    applySettings(readSettings());
  }

  window.Settings = {
    read: readSettings,
    update: updateSettings,
    init: initSettingsControls
  };
})();
