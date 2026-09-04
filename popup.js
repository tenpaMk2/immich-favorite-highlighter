const enabledInput = document.getElementById("enabled");
const statusEl = document.getElementById("status");
const openOptionsButton = document.getElementById("open-options");

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
}

async function render() {
  try {
    const settings = await getSettings();

    enabledInput.checked = settings.enabled;

    if (!settings.origin) {
      setStatus("先にオプションで Immich URL を設定してください。", true);
      enabledInput.disabled = true;
      return;
    }

    enabledInput.disabled = false;
    setStatus(
      settings.enabled
        ? `${settings.origin} のサムネイルでお気に入りを強調しています。`
        : `${settings.origin} 向けに設定済み。強調表示はオフです。`,
    );
  } catch {
    enabledInput.disabled = true;
    setStatus("設定を読み込めませんでした。", true);
  }
}

enabledInput.addEventListener("change", async () => {
  try {
    await setSettings({ enabled: enabledInput.checked });
    await render();
  } catch {
    setStatus("保存に失敗しました。", true);
  }
});

openOptionsButton.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

void render();
