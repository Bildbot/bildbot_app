# AGENTS.md

**Root playbook for Cursor agents building _BildBot Desktop_ — a Windows app with an embedded Chromium browser and a local photo editor.**

> This file is the single source of truth for roles, rules, structure, workflows, and quality gates. Any deviation must be added as an ADR in `/docs/ADR/`.

---

## 0) Product vision (confirmed)

**Audience:** newsroom image editors (бильд‑редакторы) who source images from agencies & social, ensure licensing/attribution, and publish to a CMS.

**v1 scope & priorities**

- **P0:** Browser shell for agency sites, CMS, Telegram Web, etc. (10+ tabs steady; batch refresh of ≥5 tabs on demand).
- **P1:** Local photo editor focused on speed and export discipline.
- **Offline:** only the editor must work offline; browser is online‑first.
- **Auth:** users sign in with the **same credentials as BildBot site** (backed by BildBot API). No mailbox in v1.

**Data**

- User settings, cache, and exported images live **locally** on the user’s PC.
- Identities/roles live in **BildBot** backend; app consumes tokens from it.
- Import/Export of app settings is required.

---

## 1) Platform & runtime

- **Windows:** Win10 22H2+ (and Win11) minimum.
- **Runtime:** **Electron (Chromium + Node)** with contextIsolation and strict IPC.
- **Performance target:** mid‑range 2025 laptops; cold start < 2.5s; 10+ tabs sustained.
- **Portable build:** supported. Auto‑update works if the app is placed in a user‑writable folder.

---

## 2) Architecture & repo

```
/ (root)
  AGENTS.md
  package.json            # pnpm workspaces
  pnpm-lock.yaml
  /apps
    /desktop              # Electron main + preload + updater
    /renderer             # React + Vite UI
  /modules
    /browser              # tabs, profiles/containers, downloads, permissions
    /photo                # CanvasKit core, tools, export, ffmpeg storyboard
    /shared               # types, config, IPC contracts, feature flags
  /resources              # icons, assets, extension bundles (whitelisted)
  /scripts                # dev/build/release scripts
  /docs
    /ADR
    /SECURITY.md
    /CONTRIBUTING.md
  /tests
    e2e/                  # Playwright app-level tests on Windows
    unit/
```

- **Package manager:** **pnpm**.
- **Monorepo:** yes (apps + modules).

---

## 3) Security, privacy & networking

- **IPC:** typed & validated (Zod) in `/modules/shared/ipc`; deny unknown channels.
- **Renderer:** `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`.
- **Secrets:** store tokens with **Windows DPAPI** (no master password in v1).
- **Telemetry:** _opt‑in_ at first run. Collect crash/perf **without PII**; scrub file paths, URLs, EXIF GPS, usernames. Users can toggle anytime.
- **Crash reports:** allowed when telemetry is on; always anonymized.
- **Allowlist:** the app itself may call only **BildBot API**, **Update server**, and optional **Crash endpoint**. Browser web content is not restricted by the allowlist.
- **CSP:** block eval/inline; only hashed/preload scripts.

---

## 4) Authentication & profile

- **Login:** username/password (same as BildBot site) via secure auth flow → exchange for **access/refresh** tokens; never store raw passwords.
- **Profile layout (default in `%APPDATA%/BildBot Desktop/` or portable next to exe):**

```
/profile/
  /browser/
    /Default/              # default Chromium profile (cookies, storage)
    /Containers/           # per‑container profiles (Agencies/Editorial/Social)
    downloads.json
    permissions.json
  /photo/
    /cache/
    /exports/
  settings.json            # theme, hotkeys, proxy, feature flags
  telemetry.json
  logs/
```

- **Containers:** start with three logical containers: **Agencies**, **Editorial**, **Social**. The set is configurable later.

---

## 5) Browser shell

- **Tabs:** open/close/restore; batch refresh action; crash isolation per tab.
- **Profiles/Containers:** segregated storage per container (cookies/localStorage). Quick switcher in the toolbar.
- **Permissions:** camera/mic/notifications prompt UI; deny by default; persist per site.
- **Downloads:** single configurable directory; “Show in Explorer”; (auto‑cleanup policy TBD → off by default in v1).
- **Extensions:** **curated whitelist only**, bundled unpacked and loaded via `session.loadExtension`.
  - Target: **Ad blocking**. Primary plan: include a **built‑in blocker** using EasyList/EasyPrivacy rules.
  - If an unpacked AdGuard‑like extension passes compatibility tests, we load it; otherwise fall back to the built‑in blocker.
  - No user‑installed arbitrary extensions in v1.

- **Proxy/VPN:** support **external HTTP/SOCKS5 proxy** configured in settings (per container or global). Admin preconfigures defaults at build time.

---

## 6) Photo editor

**Core choice:** Canvas via **CanvasKit (Skia WASM)** for high‑quality transforms + workers.

- **Heavy ops:** Node side via **sharp/libvips** for resize/export;
- **Video storyboard:** packaged **ffmpeg**; extract **5 frames around current pause point** (2 before, 1 at pause, 2 after) or nearest timestamps.

**Tools (v1)**

- **Crop** (free + presets 16:9, 4:3, 1:1, 3:2; min size; guides).
- **Rotate** (arbitrary angle + ±90°).
- **Adjust** (brightness/contrast/saturation).
- **Resize** (by width/height/percent; min width enforced at **620 px**).
- **History** undo/redo; non‑destructive pipeline.
- **Export**: **JPEG** max quality, **preserve EXIF/IPTC**.
- **No project files** in v1; edit→export.

**Performance policy**

- Smooth interaction up to **24–50 MP**; for larger images show a “heavy file” banner but proceed.

**Shortcuts**

- Adopt **Photoshop‑like** bindings where feasible; ship a reference table in Help → Shortcuts.

---

## 7) UX & theming

- **UI kit:** Tailwind CSS + shadcn/ui components.
- **Themes:** light/dark (system default; user toggle persists).
- **Command palette & hotkeys:** yes, configurable.
- **Onboarding (first run):** login → choose profile folder / portable mode → privacy/telemetry opt‑in → (proxy is preconfigured in build if needed).

---

## 8) Build, CI & quality gates

- **Tooling:** TypeScript strict, ESLint, Prettier, pre‑commit hooks.
- **CI:** GitHub Actions (Windows runner): typecheck, lint, unit, e2e smoke, build artifact.
- **Minimum tests**
  - **Unit:** JPEG export preserves EXIF; crop/rotate math; IPC validators.
  - **E2E:** open 10 tabs; batch refresh; download file; open image→crop→export; login/logout.

- **Performance checks:** bundle size budget and cold start budget enforced.

---

## 9) Release & updates

- **Channels:** `dev`, `stable`.
- **Format:** **portable zip** only for v1.
- **Updates:** built‑in auto‑updater for portable install when the folder is user‑writable; checks the **private update endpoint** and pulls latest **stable**.
- **Update server:** owned by us; always serves the latest stable metadata and delta/full packages.
- **Code signing:** obtain an **individual Code Signing Certificate**; sign the portable executable to reduce SmartScreen warnings.

---

## 10) Licensing & branding

- **Name:** **BildBot Desktop**.
- **License:** proprietary (internal use).
- **Assets:** provide app icon set; keep brand consistent with BildBot site.

---

## 11) Support & feedback

- In‑app **Send feedback**: previewable payload → send to developer’s Telegram (user must consent; remove PII/paths by default; include anonymized diagnostics if telemetry is on).
- Link to troubleshooting guide in `/docs/user/`.

---

## 12) Roles (Cursor agents) & PR checklists

### Repo Architect

**Goal:** bootstrap monorepo, secure Electron skeleton, updater, scripts.
**Deliverables:** Electron+Vite+TS; electron‑builder; portable build; code signing stubs; secure IPC.
**Checklist:**

- [ ] `pnpm dev` opens window; preload exposes approved APIs only.
- [ ] CSP & security flags set.
- [ ] Windows CI build succeeds; artifact uploaded.
- [ ] `ADR/0001-monorepo.md` added.

### Browser Shell Engineer

**Goal:** tabs, containers, permissions, downloads, blocker, proxy.
**Checklist:**

- [ ] 10+ tabs stable; batch refresh works.
- [ ] Containers isolate storage; quick switch.
- [ ] Built‑in blocker active; extension fallback tested.
- [ ] Proxy per container or global; persisted.

### Photo Editor Engineer

**Goal:** CanvasKit core, tools, export, ffmpeg storyboard.
**Checklist:**

- [ ] Crop/Rotate/Adjust/Resize implemented with undo/redo.
- [ ] Export JPEG preserves EXIF/IPTC; min width 620 px enforced.
- [ ] 5‑frame storyboard around pause works.
- [ ] Heavy files warning displayed >50 MP.

### UX Engineer

**Goal:** theming, palette, onboarding, shortcuts.
**Checklist:**

- [ ] Tailwind/shadcn baseline; dark/light toggle.
- [ ] Photoshop‑like hotkeys mapped and documented.
- [ ] Onboarding flow complete.

### Security & Privacy Engineer

**Goal:** IPC hardening, DPAPI vault, telemetry scrubbing.
**Checklist:**

- [ ] DPAPI storage for tokens; no raw passwords saved.
- [ ] Telemetry opt‑in + scrubbing rules implemented.
- [ ] Allowlist enforced for app network calls.

### Release Engineer

**Goal:** portable auto‑updates, signing, release metadata.
**Checklist:**

- [ ] Update check & download from private endpoint.
- [ ] Binary signed with Code Signing cert.
- [ ] Rollback path validated.

### QA Engineer

**Goal:** tests & plans.
**Checklist:**

- [ ] Unit + E2E suites as defined pass in CI.
- [ ] Performance budgets enforced.

---

## 13) IPC contract (must)

- All renderer↔main calls live in `/modules/shared/ipc` with Zod‑validated payloads and exported TS types.
- Long tasks (export, storyboard) are **cancellable** and report progress.

---

## 14) Acceptance definition

A feature is **done** when:

- Security flags & IPC validation intact; feature flags applied if risky.
- Unit/E2E tests pass; docs updated; telemetry scrubbing verified.
- Works in both standard and portable modes.

---

## 15) Roadmap (approved)

- **M1:** shell + browser (tabs, containers, downloads, blocker, proxy), login, settings.
- **M2:** photo core (CanvasKit), tools, export with EXIF, video storyboard.
- **M3:** portable auto‑update, allowlist & telemetry, CI smoke, signing.
