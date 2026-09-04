# Agent notes

This is a Manifest V3 Chrome extension. Brave is supported with the same package. Load it unpacked from this folder; keep `manifest.json` at the repo root.

Follow Chrome's chrome-extensions skill (Modern Web Guidance) for MV3 APIs and extension pitfalls. Search guides with `npx modern-web-guidance@latest search "..."` when an API is unfamiliar.

Do not create or maintain `CHROMEWEBSTORE.md`. This extension is not published to the Chrome Web Store.

## Project rules

- Use `chrome.*` with `async`/`await`. Do not chain `.then()`.
- The service worker must not keep state in globals. Persist with `chrome.storage`.
- Call `chrome.permissions.request()` from a user gesture with no `await` before it.
- Grant host access only for the Immich origin the user enters (`optional_host_permissions` + runtime request), not static `<all_urls>` content scripts.
- Favorite highlighting is CSS on Immich's thumbnail DOM (`[data-asset]` + `[data-icon-favorite]` / MDI heart path). Do not add a MAIN-world WebSocket hook unless Immich stops exposing favorites in the DOM.
