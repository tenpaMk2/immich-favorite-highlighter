(() => {
  if (window.__immichFavoriteHighlighterContentInstalled) {
    return;
  }

  window.__immichFavoriteHighlighterContentInstalled = true;

  const STYLE_ID = "immich-favorite-highlighter-style";

  function buildCss(settings) {
    const color = sanitizeBorderColor(settings.borderColor);
    const width = sanitizeBorderWidth(settings.borderWidth);
    const edge = width + 2;

    return `
[data-asset]:has([data-icon-favorite]),
[data-asset]:has(path[d^="M12,21.35"]),
[data-asset]:has(path[d^="M12 21.35"]) {
  position: relative;
}

[data-asset]:has([data-icon-favorite])::after,
[data-asset]:has(path[d^="M12,21.35"])::after,
[data-asset]:has(path[d^="M12 21.35"])::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 8;
  pointer-events: none;
  border-radius: inherit;
  box-shadow:
    inset 0 0 0 ${width}px ${color},
    inset 0 0 0 ${edge}px #111827;
}

[data-icon-favorite],
[data-asset] svg:has(path[d^="M12,21.35"]),
[data-asset] svg:has(path[d^="M12 21.35"]) {
  filter: drop-shadow(0 1px 1px rgb(0 0 0 / 0.8));
}

[data-icon-favorite] path,
[data-asset] path[d^="M12,21.35"],
[data-asset] path[d^="M12 21.35"] {
  stroke: #111827;
  stroke-width: 1.75;
  stroke-linejoin: round;
  paint-order: stroke fill;
}
`;
  }

  function ensureStyleElement() {
    let style = document.getElementById(STYLE_ID);
    if (style) {
      return style;
    }

    style = document.createElement("style");
    style.id = STYLE_ID;
    (document.head || document.documentElement).appendChild(style);
    return style;
  }

  function applySettings(settings) {
    const style = document.getElementById(STYLE_ID);

    if (!settings.enabled) {
      style?.remove();
      return;
    }

    ensureStyleElement().textContent = buildCss(settings);
  }

  async function refresh() {
    applySettings(await getSettings());
  }

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "sync") {
      return;
    }

    if (
      !Object.prototype.hasOwnProperty.call(changes, "enabled") &&
      !Object.prototype.hasOwnProperty.call(changes, "borderColor") &&
      !Object.prototype.hasOwnProperty.call(changes, "borderWidth")
    ) {
      return;
    }

    void refresh();
  });

  void refresh();
})();
