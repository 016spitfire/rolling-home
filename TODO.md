# TODO

- **Visible update prompt instead of silent auto-update.** Currently uses `registerType: "autoUpdate"` in vite.config.ts, which swaps in new deploys silently in the background and can leave a stale cached version visible if the tab doesn't stay open through the detect/install/reload cycle (caused confusion on 2026-06-21 — looked like missing features, wasn't). Add a "New version available — tap to refresh" toast/banner using the PWA's `needRefresh` state instead of relying on the automatic reload.
