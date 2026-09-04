const CONTENT_SCRIPT_ID = "immich-fav-border-content";

async function unregisterScripts() {
  try {
    await chrome.scripting.unregisterContentScripts({
      ids: [CONTENT_SCRIPT_ID],
    });
  } catch {
    // Scripts may not be registered yet.
  }
}

async function registerScripts(origin) {
  await unregisterScripts();

  if (!origin) {
    return;
  }

  const matches = [`${origin}/*`];

  await chrome.scripting.registerContentScripts([
    {
      id: CONTENT_SCRIPT_ID,
      js: ["shared.js", "content.js"],
      matches,
      runAt: "document_start",
      world: "ISOLATED",
    },
  ]);
}

async function syncScripts() {
  try {
    const { origin } = await chrome.storage.sync.get({ origin: "" });
    await registerScripts(origin);
  } catch (error) {
    console.error("Failed to sync content scripts", error);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  void syncScripts();
});

chrome.runtime.onStartup.addListener(() => {
  void syncScripts();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "sync" && Object.prototype.hasOwnProperty.call(changes, "origin")) {
    void syncScripts();
  }
});
