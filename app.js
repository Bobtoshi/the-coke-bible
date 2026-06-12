(function () {
  const BOOK_URL = "assets/the-coke-bible.epub";
  const START_HREF = "text/ch001.xhtml#admonition-to-the-reader";
  const STORAGE = {
    cfi: "the-coke-bible-location",
    theme: "the-coke-bible-theme",
    fontSize: "the-coke-bible-font-size",
  };

  const $ = (selector) => document.querySelector(selector);
  const tocRoot = $("#toc");
  const chapterTitle = $("#chapterTitle");
  const progressText = $("#progressText");
  const progressBar = $("#progressBar");
  const loadingState = $("#loadingState");
  const themeSelect = $("#themeSelect");
  const fontSize = $("#fontSize");
  const prevButton = $("#prevButton");
  const nextButton = $("#nextButton");
  const startButton = $("#startButton");

  const state = {
    book: null,
    rendition: null,
    navigation: [],
    activeHref: "",
    activeLabel: "",
    currentHref: "",
    locationsReady: false,
    theme: localStorage.getItem(STORAGE.theme) || "light",
    fontSize: Number(localStorage.getItem(STORAGE.fontSize) || 100),
  };

  function setAppTheme(theme) {
    state.theme = theme;
    document.documentElement.dataset.theme = theme === "light" ? "" : theme;
    themeSelect.value = theme;
    localStorage.setItem(STORAGE.theme, theme);

    if (state.rendition) {
      state.rendition.themes.select(theme);
    }
  }

  function registerReaderThemes() {
    state.rendition.themes.register("light", {
      html: {
        background: "#fffdf7 !important",
        color: "#1c1814 !important",
      },
      body: {
        background: "#fffdf7 !important",
        color: "#1c1814 !important",
        "font-family": "Georgia, 'Times New Roman', serif !important",
        "line-height": "1.72 !important",
      },
      p: {
        "font-size": "1em !important",
      },
      a: {
        color: "#8d171e !important",
      },
      "h1, h2, h3, h4, h5, h6, p, li, em, strong": {
        color: "#1c1814 !important",
      },
    });

    state.rendition.themes.register("sepia", {
      html: {
        background: "#fff7e6 !important",
        color: "#2a2117 !important",
      },
      body: {
        background: "#fff7e6 !important",
        color: "#2a2117 !important",
        "font-family": "Georgia, 'Times New Roman', serif !important",
        "line-height": "1.72 !important",
      },
      a: {
        color: "#7f201f !important",
      },
      "h1, h2, h3, h4, h5, h6, p, li, em, strong": {
        color: "#2a2117 !important",
      },
    });

    state.rendition.themes.register("dark", {
      html: {
        background: "#11100f !important",
        color: "#f1eee8 !important",
      },
      body: {
        background: "#11100f !important",
        color: "#f1eee8 !important",
        "font-family": "Georgia, 'Times New Roman', serif !important",
        "line-height": "1.72 !important",
      },
      a: {
        color: "#ff8387 !important",
      },
      "h1, h2, h3, h4, h5, h6, p, li, em, strong": {
        color: "#f1eee8 !important",
      },
    });
  }

  function applyReaderTypeSize(value) {
    state.fontSize = Number(value);
    fontSize.value = state.fontSize;
    localStorage.setItem(STORAGE.fontSize, String(state.fontSize));

    if (state.rendition) {
      state.rendition.themes.fontSize(`${state.fontSize}%`);
    }
  }

  function createTocItem(item, depth = 0) {
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = item.label.trim();
    button.dataset.href = item.href;
    button.style.paddingLeft = `${9 + depth * 8}px`;
    button.addEventListener("click", async () => {
      await displayLocation(item.href, item.label.trim());
      document.querySelector(".reader-shell").scrollIntoView({ block: "start" });
    });
    li.appendChild(button);

    if (item.subitems && item.subitems.length) {
      const childList = document.createElement("ol");
      item.subitems.forEach((child) => childList.appendChild(createTocItem(child, depth + 1)));
      li.appendChild(childList);
    }

    return li;
  }

  function renderToc(navigation) {
    state.navigation = navigation.toc || [];
    tocRoot.replaceChildren();
    state.navigation.forEach((item) => tocRoot.appendChild(createTocItem(item)));
    markCurrentToc();
  }

  async function displayLocation(href, label) {
    state.activeHref = href;
    state.activeLabel = label;
    chapterTitle.textContent = label;
    await state.rendition.display(href);
    markCurrentToc();
  }

  function markCurrentToc(location) {
    const buttons = Array.from(tocRoot.querySelectorAll("button[data-href]"));
    buttons.forEach((button) => button.removeAttribute("aria-current"));

    const href = location?.start?.href || state.activeHref.split("#")[0] || "";
    const current =
      buttons.find((button) => button.dataset.href === state.activeHref) ||
      buttons.find((button) => button.dataset.href === href);

    if (current) {
      current.setAttribute("aria-current", "true");
      chapterTitle.textContent = current.textContent || "The Coke Bible";
      return;
    }

    chapterTitle.textContent = state.activeLabel || "The Coke Bible";
  }

  function updateProgress(location) {
    prevButton.disabled = Boolean(location?.atStart);
    nextButton.disabled = Boolean(location?.atEnd);

    if (!location?.start?.cfi) {
      progressText.textContent = "Reader ready";
      return;
    }

    localStorage.setItem(STORAGE.cfi, location.start.cfi);

    if (!state.locationsReady) {
      progressText.textContent = "Reader ready";
      return;
    }

    const percentage = state.book.locations.percentageFromCfi(location.start.cfi);
    const progress = Math.max(0, Math.min(100, Math.round(percentage * 100)));
    progressBar.style.width = `${progress}%`;
    progressText.textContent = `${progress}%`;
  }

  function bindControls() {
    prevButton.addEventListener("click", () => state.rendition.prev());
    nextButton.addEventListener("click", () => state.rendition.next());
    startButton.addEventListener("click", async () => {
      await displayLocation(START_HREF, "Admonition to the Reader");
      document.querySelector(".reader-shell").scrollIntoView({ block: "start" });
    });
    themeSelect.addEventListener("change", (event) => setAppTheme(event.target.value));
    fontSize.addEventListener("input", (event) => applyReaderTypeSize(event.target.value));

    document.addEventListener("keydown", (event) => {
      if (event.defaultPrevented) return;
      if (event.key === "ArrowLeft") state.rendition.prev();
      if (event.key === "ArrowRight") state.rendition.next();
    });
  }

  async function initReader() {
    setAppTheme(state.theme);
    applyReaderTypeSize(state.fontSize);

    state.book = ePub(BOOK_URL);
    state.rendition = state.book.renderTo("viewer", {
      width: "100%",
      height: "100%",
      spread: "none",
      manager: "default",
      flow: "paginated",
      allowScriptedContent: false,
    });

    registerReaderThemes();
    setAppTheme(state.theme);
    applyReaderTypeSize(state.fontSize);
    bindControls();

    state.book.loaded.navigation.then(renderToc);
    state.rendition.on("relocated", (location) => {
      loadingState.classList.add("is-hidden");
      markCurrentToc(location);
      updateProgress(location);
    });

    state.rendition.on("rendered", (_section, view) => {
      const contents = view?.contents;
      if (!contents) return;
      contents.document.documentElement.style.scrollBehavior = "smooth";
    });

    const savedLocation = localStorage.getItem(STORAGE.cfi);
    state.activeHref = savedLocation ? "" : START_HREF;
    state.activeLabel = savedLocation ? "Continue reading" : "Admonition to the Reader";
    try {
      await state.rendition.display(savedLocation || START_HREF);
    } catch (_error) {
      await state.rendition.display(START_HREF);
    }

    state.book.ready
      .then(() => state.book.locations.generate(900))
      .then(() => {
        state.locationsReady = true;
        const current = state.rendition.currentLocation();
        if (current) updateProgress(current);
      })
      .catch(() => {
        progressText.textContent = "Reader ready";
      });
  }

  window.addEventListener("DOMContentLoaded", () => {
    if (typeof ePub !== "function") {
      chapterTitle.textContent = "Reader failed to load";
      progressText.textContent = "Download the EPUB instead";
      loadingState.innerHTML = "<strong>Reader unavailable</strong>";
      return;
    }

    initReader().catch(() => {
      chapterTitle.textContent = "Reader failed to load";
      progressText.textContent = "Download the EPUB instead";
      loadingState.innerHTML = "<strong>Reader unavailable</strong>";
    });
  });
})();
