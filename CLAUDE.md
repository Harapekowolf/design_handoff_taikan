# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Nature of this repository

This is a **design handoff / prototype**, not a production app. It's a static bundle of HTML + JSX + CSS + JS intended to be read as a **pixel-perfect design reference** for the "体感温度アプリ" (Perceived Temperature App) — a mobile-first Japanese weather app that surfaces *feels-like* temperature split by 日向 (sun) / 日陰 (shade).

Per `README.md`: the HTML here is **not production code**. When asked to "implement" or "build" the app, the expectation is to **re-implement** it in the target project's stack (e.g. Next.js + TypeScript + Tailwind), preserving the exact colors, typography, spacing, and interactions from this reference. Do not treat `.jsx` files here as the shipping artifact.

## Running locally

There is **no build step, no package.json, no bundler**. React, ReactDOM, and Babel Standalone are loaded from unpkg at runtime; `.jsx` files are transpiled in-browser via `<script type="text/babel">`.

Start a static file server from the repo root and open one of the HTML entry points:

```bash
python3 -m http.server 8765
```

Entry points:
- `index.html` → loads the **mobile** experience (`mobile-app.jsx` + `mobile-styles.css` + `weather.js` live data). This is what Netlify serves.
- `体感温度アプリ - Mobile.html` → mobile experience wrapped in an iOS device frame (`ios-frame.jsx`), dummy data only.
- `体感温度アプリ.html` / `desktop.html` → desktop reference (`app.jsx` + `screens-*.jsx` + `browser-window.jsx` + `styles.css`).

`netlify.toml` publishes the repo root and serves `.jsx` as `text/babel` so Babel Standalone can transpile them. Any server change must preserve that MIME mapping.

No tests, no linter, no typecheck. Validate changes by loading the page in a browser and exercising all six screens + the tweaks panel.

## Architecture

### Two parallel implementations

The repo contains **two separate UIs** that share `data.js` but nothing else:

| Target | Entry HTML | Root component | Styles |
|---|---|---|---|
| Mobile (primary, 402px) | `index.html`, `体感温度アプリ - Mobile.html` | `mobile-app.jsx` (`MobileApp`) | `mobile-styles.css` |
| Desktop (reference) | `desktop.html`, `体感温度アプリ.html` | `app.jsx` (`App`) + `screens-home.jsx`, `screens-forecast.jsx`, `screens-more.jsx` + `browser-window.jsx` | `styles.css` |

`mobile-app.jsx` is a single file containing all six screens (`HomeM`, `HourlyM`, `WeeklyM`, `OutfitM`, `MapM`, `ColorsM`) plus the header, tab bar, icon set, and tweaks panel. The desktop version splits screens across `screens-*.jsx` and wraps the app in a fake browser chrome (`browser-window.jsx`).

The `ios-frame.jsx` file is used only by `体感温度アプリ - Mobile.html` to draw an iOS device chrome around the app. It is **not** loaded by `index.html` / production — the README notes it is not needed in a real implementation.

### Data flow

- `data.js` defines `window.APP_DATA` with dummy values (Tokyo, 2026-04-18). Shape: `{ now, hourly[], weekly[], regions[], outfit, clothingColors, materials }`. Type sketches are in `README.md`.
  - `now` also carries `weatherCode` + `cond` (`'sun' | 'partly' | 'cloud' | 'rain'`) + `condNote` so UI copy can branch on condition.
  - `now` also carries `aqi` (European AQI 0–100), `pm25`, `pm10` for the `AirQualityCard` on Home.
  - `hourly[]` entries include `precipProb` (%) and `precipMm` so the Hourly chart can overlay a rain layer.
- `weather.js` (mobile only, loaded by `index.html`) is an IIFE that:
  1. Requests geolocation (falls back to Tokyo if denied).
  2. Reverse-geocodes via bigdatacloud.net.
  3. Fetches current + hourly + 7-day forecast from **Open-Meteo** (no API key). Hourly request includes `precipitation_probability,precipitation`.
  4. Computes `feelsLikeSun = apparent_temperature + shortwave_radiation × 0.007`.
  5. Mutates `window.APP_DATA` in place and dispatches `weather:loaded` / `weather:updated` events.
  6. Also per-region fetches for the map screen.
  7. Fetches air quality (PM2.5 / PM10 / European AQI) from `air-quality-api.open-meteo.com` and re-dispatches `weather:updated` on completion. Failure is silent — existing dummy values stay put.
- Components read `window.APP_DATA` directly on render (no context/store). `MobileApp` subscribes to the `weather:*` events and force-updates via `useReducer`.

When editing data-driven logic, remember that `APP_DATA` is mutated after mount — do not cache derived values outside of render. **Never hardcode numeric copy** (e.g. "+5.2°", "最大 +6.3°C", "5°C以上違う") — derive those strings from `APP_DATA` on render.

### Routing & state

- Screen routing is a single string (`'home' | 'hourly' | 'weekly' | 'outfit' | 'map' | 'colors'`) stored in `localStorage` under `taikan.m.screen` (mobile) or `taikan.screen` (desktop).
- `inSun: boolean` is local to the Home screen.
- `tweaks` is local component state. `DEFAULT_M_TWEAKS` / `DEFAULT_TWEAKS` are wrapped in `/*EDITMODE-BEGIN*/ ... /*EDITMODE-END*/` marker comments — an external tooling harness rewrites the JSON between these markers, so **do not remove or rename these markers** when editing defaults.

### Tweaks / edit-mode postMessage protocol

Both `mobile-app.jsx` and `app.jsx` talk to a parent window via `postMessage`:

- Incoming: `__activate_edit_mode`, `__deactivate_edit_mode` → toggle the Tweaks panel.
- Outgoing on mount: `__edit_mode_available`.
- Outgoing on tweak change: `__edit_mode_set_keys` with the current tweaks object.

This is **prototype-only plumbing** for the handoff environment and should be dropped when re-implementing in production.

### Physics model

`mobile-app.jsx` contains a small set of physics helpers that drive the "feels-like" numbers, clothing color/cover deltas, factor-row contributions, WBGT badge, and hourly insights. Keep these in sync when tuning copy or adding UI:

- **`sunHeatCoef(wind, rh)`** — °C per W/m² of solar radiation. Calibrated so that `wind=2 m/s, RH=50%` returns `0.007` (matching `feelsLikeSun`). Wind reduces the coefficient (convective cooling); humidity above 50% raises it (hindered evaporation).
- **Cover fraction** `COVER_FRAC = { parasol: 0.80 }` — share of the sun-only delta a parasol neutralizes (UV-cut parasols block ~80% of direct shortwave per 環境省 field tests).
- **JMA apparent-temperature decomposition** — `AT = T + 0.33·e − 0.70·WS − 4.00`:
  - `vaporPressureHpa(t, rh)` (Tetens).
  - `humidityDeltaC(t, rh) = 0.33 · (e(T,RH) − e(T,50))` — humidity's departure from the RH=50% baseline.
  - `windDeltaC(windMS) = −0.70 · windMS` — wind's cooling contribution.
  These power the 日射 / 湿度 / 風速 rows in the "体感の内訳" section.
- **WBGT** (`wbgtValue` + `wbgtCategory`) uses an Ono/Tonouchi-style fit: `0.735T + 0.0374RH + 0.00292·T·RH + 0.004·solar − 4.064`, mapped to the 環境省 5 categories (`ほぼ安全 / 注意 / 警戒 / 厳重警戒 / 危険`). `WbgtBadge` renders the current value on Home; `WbgtTimeline` on Hourly renders a ribbon of 16 cells (06–21 JST), highlights the current hour, and surfaces the peak/警戒-window headline.
- **Air quality** (`pm25Category` + `AirQualityCard`) categorizes PM2.5 (µg/m³) into 良好/普通/注意/悪い/非常に悪い using WHO-leaning cutoffs (12 / 25 / 50 / 100), and reuses the WBGT color ramp (`.lv-safe..danger`).
- **Color delta** in `ColorsM` scales `clothingColors[].deltaC` by `(solar · sunHeatCoef) / (800 · 0.007)` — the `data.js` values are calibrated for the reference condition `(solar=800, wind=2, RH=50)`.

### Theming

Themes (`paper` / `snow` / `ink`) are applied by setting CSS custom properties (`--paper`, `--ink`, `--card`, etc.) on `document.documentElement` in a `useEffect`. `--accent` (`#d94b1a`) is intentionally constant across themes.

### PWA / offline

`index.html` is served as an installable PWA:
- `manifest.json` + `apple-touch-icon.png` + `icon-192.png`/`icon-512.png` + `apple-mobile-web-app-*` meta tags.
- `service-worker.js` (registered on `load`) uses `taikan-v1` cache with:
  - **Stale-While-Revalidate** for the app shell (HTML/CSS/JSX/data/weather/manifest/icons + the 3 unpkg scripts).
  - **Network-First** for the Open-Meteo + bigdatacloud API calls, falling back to the last good cached response when offline.
- Netlify is configured with `Cache-Control: no-cache` for the shell, so SW updates always propagate. Bump the `CACHE_NAME` in `service-worker.js` when the shell file list changes.

## Design-system conventions

When making visual changes, the values in `README.md` § Design System are authoritative:
- Colors are CSS vars (`--ink`, `--ink-2..5`, `--paper`, `--paper-2`, `--card`, `--accent`, `--rule`, `--rule-2`). `#d94b1a` is the **only** accent color and is reserved for the hero feels-like number, the NOW marker, the sun/日向 line, and positive deltas.
- Three Google Fonts: **Noto Sans JP** (UI/body, `palt` feature on), **Fraunces** (display, italics used heavily), **JetBrains Mono** (numbers/times, `tnum` feature on).
- Radii are **0** everywhere except the sun/shade pill toggle (100px). Mobile horizontal padding is 22px. Section separators are 1px `--rule` or 2px `--ink`.
- Icons are inline SVG, `stroke-width: 1.3`, `stroke: currentColor`. No icon libraries.

## Conventions & gotchas

- Components use `React.useState` / `React.useEffect` (via the UMD global) rather than imported hooks — there is no module system. If you add new `.jsx` files, wire them into the HTML as `<script type="text/babel" src="...">` and have them assign to `window` or rely on global function declarations (as existing files do).
- The desktop entry declares `<meta viewport width=1200>` and renders a fake browser window around the app; it is **reference-only** and should not get new features unless the mobile version already has them.
- All Japanese text in the UI is part of the design — preserve it verbatim when editing copy unless instructed otherwise.
- `.claude/launch.json` runs `python3 -m http.server 8766`; the `.claude/settings.local.json` allowlist uses port 8765. Either port is fine — pick one and stay consistent.
