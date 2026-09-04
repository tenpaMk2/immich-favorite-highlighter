const form = document.getElementById("options-form");
const originInput = document.getElementById("origin");
const borderColorInput = document.getElementById("border-color");
const borderColorValue = document.getElementById("border-color-value");
const borderWidthInput = document.getElementById("border-width");
const borderWidthValue = document.getElementById("border-width-value");
const previewTile = document.getElementById("preview-tile");
const statusEl = document.getElementById("status");

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
}

function setOriginInvalid(isInvalid) {
  originInput.toggleAttribute("aria-invalid", isInvalid);
}

function updatePreview() {
  const color = sanitizeBorderColor(borderColorInput.value);
  const width = sanitizeBorderWidth(borderWidthInput.value);
  const edge = width + 2;

  borderColorInput.value = color;
  borderColorValue.textContent = color;
  borderWidthInput.value = String(width);
  borderWidthValue.textContent = `${width}px`;
  previewTile.style.boxShadow = "none";
  previewTile.style.setProperty(
    "--preview-shadow",
    `inset 0 0 0 ${width}px ${color}, inset 0 0 0 ${edge}px #111827`,
  );
}

async function loadOptions() {
  try {
    const settings = await getSettings();
    originInput.value = settings.origin;
    borderColorInput.value = settings.borderColor;
    borderWidthInput.value = String(settings.borderWidth);
    updatePreview();
  } catch {
    setStatus("設定を読み込めませんでした。", true);
  }
}

borderColorInput.addEventListener("input", updatePreview);
borderWidthInput.addEventListener("input", updatePreview);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("");
  setOriginInvalid(false);

  let origin;
  try {
    origin = normalizeOrigin(originInput.value);
  } catch (error) {
    setOriginInvalid(true);
    setStatus(error.message, true);
    return;
  }

  const borderColor = sanitizeBorderColor(borderColorInput.value);
  const borderWidth = sanitizeBorderWidth(borderWidthInput.value);

  if (!origin) {
    try {
      const { origin: previousOrigin } = await getSettings();
      await setSettings({
        origin: "",
        enabled: false,
        borderColor,
        borderWidth,
      });
      if (previousOrigin) {
        await chrome.permissions.remove({
          origins: [originToMatchPattern(previousOrigin)],
        });
      }
      setStatus("保存しました。Immich URL を設定するまで拡張機能は無効です。");
    } catch {
      setStatus("保存に失敗しました。", true);
    }
    return;
  }

  const pattern = originToMatchPattern(origin);
  let granted;
  try {
    granted = await chrome.permissions.request({ origins: [pattern] });
  } catch {
    setStatus("ホスト許可が承認されませんでした。", true);
    return;
  }

  if (!granted) {
    setStatus("ホスト許可が承認されませんでした。", true);
    return;
  }

  try {
    const { origin: previousOrigin } = await getSettings();
    await setSettings({ origin, borderColor, borderWidth });
    originInput.value = origin;
    updatePreview();
    if (previousOrigin && previousOrigin !== origin) {
      await chrome.permissions.remove({
        origins: [originToMatchPattern(previousOrigin)],
      });
    }
    setStatus(`保存しました。${origin} で動作します。`);
  } catch {
    setStatus("保存に失敗しました。", true);
  }
});

void loadOptions();
