(() => {
  "use strict";

  const DEFAULTS = Object.freeze({
    hideAIOverview: true,
    blockAIMode: true,
    forceWebMode: false
  });

  let settings = { ...DEFAULTS };
  let scanQueued = false;

  const OVERVIEW_CLASS = "gsai-controls-overview-hidden";
  const AI_MODE_CLASS = "gsai-controls-mode-hidden";

  // Install the known-container CSS immediately at document_start. This prevents
  // most visible AI Overview flashes before managed policy has finished loading.
  // The DOM scanner below remains active as a fallback if Google changes markup.
  const overviewStyle = document.createElement("style");
  overviewStyle.id = "gsai-controls-overview-style";
  overviewStyle.textContent = `
    #m-x-content,
    div[data-hveid]:has(#m-x-content),
    .${OVERVIEW_CLASS} {
      display: none !important;
    }
  `;

  const aiModeStyle = document.createElement("style");
  aiModeStyle.id = "gsai-controls-mode-style";
  aiModeStyle.textContent = `
    a[href*="udm=50"],
    a[href^="/ai"],
    a[href^="https://www.google.com/ai"],
    a[href^="https://google.com/ai"],
    .${AI_MODE_CLASS} {
      display: none !important;
    }
  `;

  function appendStyle(styleElement) {
    const root = document.documentElement || document.head;
    if (root && !styleElement.isConnected) {
      root.appendChild(styleElement);
    }
  }

  function removeStyle(styleElement) {
    if (styleElement.isConnected) {
      styleElement.remove();
    }
  }

  function setFeatureStyles() {
    if (settings.hideAIOverview) {
      appendStyle(overviewStyle);
    } else {
      removeStyle(overviewStyle);
      document.querySelectorAll(`.${OVERVIEW_CLASS}`).forEach((element) => {
        element.classList.remove(OVERVIEW_CLASS);
      });
    }

    if (settings.blockAIMode) {
      appendStyle(aiModeStyle);
    } else {
      removeStyle(aiModeStyle);
      document.querySelectorAll(`.${AI_MODE_CLASS}`).forEach((element) => {
        element.classList.remove(AI_MODE_CLASS);
      });
    }
  }

  function isExactText(element, pattern) {
    const text = element.textContent?.replace(/\s+/g, " ").trim() || "";
    return pattern.test(text);
  }

  function findSafeOverviewContainer(heading) {
    const knownContainer = heading.closest("[data-mcpr]");
    if (knownContainer) {
      return knownContainer;
    }

    const resultBlock = heading.closest("div[data-hveid]");
    if (resultBlock) {
      const rect = resultBlock.getBoundingClientRect();
      const maxHeight = Math.max(1500, window.innerHeight * 0.75);
      if (rect.height > 0 && rect.height <= maxHeight) {
        return resultBlock;
      }
    }

    return null;
  }

  function hideAIOverviews() {
    if (!settings.hideAIOverview) {
      return;
    }

    const knownContent = document.getElementById("m-x-content");
    if (knownContent) {
      const container = knownContent.closest("div[data-hveid]") || knownContent;
      container.classList.add(OVERVIEW_CLASS);
    }

    document.querySelectorAll("h1, h2, h3").forEach((heading) => {
      if (!isExactText(heading, /^AI Overview$/i)) {
        return;
      }

      const container = findSafeOverviewContainer(heading);
      if (container) {
        container.classList.add(OVERVIEW_CLASS);
      }
    });
  }

  function hideAIModeEntryPoints() {
    if (!settings.blockAIMode) {
      return;
    }

    document.querySelectorAll("a, button").forEach((element) => {
      const href = element instanceof HTMLAnchorElement ? element.href : "";
      const isKnownURL =
        href.includes("udm=50") ||
        /^https:\/\/(?:www\.)?google\.com\/ai(?:[/?#]|$)/i.test(href);

      if (isKnownURL) {
        element.classList.add(AI_MODE_CLASS);
        return;
      }

      if (!isExactText(element, /^AI Mode$/i)) {
        return;
      }

      const rect = element.getBoundingClientRect();
      if (rect.width <= 320 && rect.height <= 100) {
        element.classList.add(AI_MODE_CLASS);
      }
    });
  }

  // Fallback for the force_web_mode DNR ruleset. Normally the network rule adds
  // udm=14 before the page loads. This catches a just-changed policy or a request
  // that reaches the page before the service worker has enabled that ruleset.
  function enforceWebModeFallback() {
    if (!settings.forceWebMode) {
      return false;
    }

    if (!/^\/?search\/?$/.test(window.location.pathname)) {
      return false;
    }

    const url = new URL(window.location.href);

    if (!url.searchParams.has("q")) {
      return false;
    }

    // Preserve explicit non-AI Google modes such as Images/News/etc.
    if (url.searchParams.has("udm") || url.searchParams.has("tbm")) {
      return false;
    }

    url.hostname = "www.google.com";
    url.searchParams.set("udm", "14");
    window.location.replace(url.toString());
    return true;
  }

  function applyControls() {
    if (enforceWebModeFallback()) {
      return;
    }

    setFeatureStyles();
    hideAIOverviews();
    hideAIModeEntryPoints();
  }

  function queueScan() {
    if (scanQueued) {
      return;
    }

    scanQueued = true;
    requestAnimationFrame(() => {
      scanQueued = false;
      applyControls();
    });
  }

  async function loadManagedSettings() {
    try {
      const policy = await chrome.storage.managed.get([
        "hideAIOverview",
        "blockAIMode",
        "forceWebMode"
      ]);

      settings = {
        hideAIOverview:
          typeof policy.hideAIOverview === "boolean"
            ? policy.hideAIOverview
            : DEFAULTS.hideAIOverview,
        blockAIMode:
          typeof policy.blockAIMode === "boolean"
            ? policy.blockAIMode
            : DEFAULTS.blockAIMode,
        forceWebMode:
          typeof policy.forceWebMode === "boolean"
            ? policy.forceWebMode
            : DEFAULTS.forceWebMode
      };
    } catch (error) {
      console.warn(
        "Google Search AI Controls: unable to read managed policy; using defaults.",
        error
      );
      settings = { ...DEFAULTS };
    }

    applyControls();
  }

  // Defaults are intentional: hide both AI surfaces immediately. If managed
  // policy disables either feature, the style is removed as soon as policy loads.
  appendStyle(overviewStyle);
  appendStyle(aiModeStyle);

  const observer = new MutationObserver(queueScan);

  function startObserver() {
    if (document.documentElement) {
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true
      });
      return;
    }

    document.addEventListener(
      "readystatechange",
      () => {
        if (document.documentElement) {
          observer.observe(document.documentElement, {
            childList: true,
            subtree: true
          });
        }
      },
      { once: true }
    );
  }

  startObserver();

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "managed") {
      return;
    }

    if (
      Object.prototype.hasOwnProperty.call(changes, "hideAIOverview") ||
      Object.prototype.hasOwnProperty.call(changes, "blockAIMode") ||
      Object.prototype.hasOwnProperty.call(changes, "forceWebMode")
    ) {
      void loadManagedSettings();
    }
  });

  void loadManagedSettings();
})();
