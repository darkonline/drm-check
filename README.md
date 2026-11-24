# DRM Check — DRM, anti-cheat, online and AI on Steam

A browser extension that shows on the Steam store what restricts a game — before you buy it.

On a **game page** a pink "DRM check" plate appears in the product card:

- **Third-party DRM** — Denuvo and others, activation limits (e.g. "5 different PC within a day").
- **Required third-party accounts** — EA, Ubisoft, Rockstar, Embark ID…
- **Kernel-level anti-cheat** — as disclosed by the developer on Steam.
- **Online only / MMO** — whether the game has single-player.
- **AI-generated content** — from Steam's AI content disclosure, with the developer's own words.
- **DRM-free on GOG** — with a link, if the game is sold there.

In **search results** a row of chips under the title shows only what stands out: Denuvo, kernel anti-cheat, required
account, online only, AI content, DRM-free on GOG.

All checks are on by default and can be switched off in the settings.

## How it works

- Everything except the GOG check is read from Steam's own store pages (DRM notices, anti-cheat disclosure, categories,
  AI content disclosure). In search results, categories come from Steam's store API in one request per page; the rest is
  read from the game pages of rows that scroll into view, two at a time, and remembered for two weeks.
- The GOG check searches the public catalog `catalog.gog.com` and compares titles strictly, so a game sold on GOG under a
  different name is shown as "Not on GOG".
- Nothing about you is collected or sent anywhere. See [PRIVACY.md](PRIVACY.md).

## Install from source

`chrome://extensions` or `edge://extensions` → Developer mode → **Load unpacked** → the `extension` folder.

## Development

```bash
npm run locales   # regenerate extension/_locales from tools/locales.js (English, Russian)
npm run e2e       # headless Edge: loads the extension and prints what it shows on Steam pages and search
npm run build     # dist/*-chrome.zip, dist/*-firefox.zip
```

## License

MIT © 2026 Kreata Media — see [LICENSE](LICENSE). Not affiliated with Valve, GOG or any DRM vendor.
