const DEFAULT_BORDER_COLOR = "#ffdd00";
const DEFAULT_BORDER_WIDTH = 3;
const MIN_BORDER_WIDTH = 2;
const MAX_BORDER_WIDTH = 8;

const DEFAULT_SETTINGS = {
  origin: "",
  enabled: true,
  borderColor: DEFAULT_BORDER_COLOR,
  borderWidth: DEFAULT_BORDER_WIDTH,
};

function normalizeOrigin(input) {
  const trimmed = String(input || "").trim();
  if (!trimmed) {
    return "";
  }

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  let url;
  try {
    url = new URL(withProtocol);
  } catch {
    throw new Error("有効な Immich URL を入力してください。例: https://photos.example.com");
  }

  if (url.pathname !== "/" && url.pathname !== "") {
    throw new Error("パスは含めず、オリジンだけを指定してください");
  }

  if (url.username || url.password) {
    throw new Error("URL にユーザー名やパスワードは含められません");
  }

  return url.origin;
}

function originToMatchPattern(origin) {
  return `${origin}/*`;
}

function sanitizeBorderColor(value) {
  return /^#[0-9a-fA-F]{6}$/.test(String(value || ""))
    ? String(value)
    : DEFAULT_BORDER_COLOR;
}

function sanitizeBorderWidth(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_BORDER_WIDTH;
  }

  return Math.min(MAX_BORDER_WIDTH, Math.max(MIN_BORDER_WIDTH, Math.round(parsed)));
}

async function getSettings() {
  const stored = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    enabled: stored.enabled !== false,
    borderColor: sanitizeBorderColor(stored.borderColor),
    borderWidth: sanitizeBorderWidth(stored.borderWidth),
  };
}

async function setSettings(partial) {
  await chrome.storage.sync.set(partial);
}
