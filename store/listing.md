# Store listing — DRM Check 1.0

Package: `dist/drm-check-1.0-chrome.zip` (Edge Add-ons, Chrome Web Store), `dist/drm-check-1.0-firefox.zip` (AMO).
Logo 300×300: `store/edge/logo-300.png` · Small promo tile 440×280: `store/edge/promo-440x280.png`
Screenshots 1280×800: `store/screenshots/{en,ru}/` — `app-2073850.png`, `app-2246340.png`, `app-632470.png`, `search.png`
(`settings.png` is 900×700 — not for store upload).
Category: Shopping. Website: https://github.com/darkonline/drm-check · Support: https://github.com/darkonline/drm-check/issues
Privacy policy: https://github.com/darkonline/drm-check/blob/main/PRIVACY.md
Search terms: steam, drm, denuvo, anti-cheat, drm-free, gog, always online

## English description

See what restricts a Steam game before you buy it. DRM Check adds a "DRM check" plate to every game page on the Steam store:

- Third-party DRM - Denuvo and others, including activation limits.
- Required third-party accounts - EA, Ubisoft, Rockstar, Embark ID and others.
- Kernel-level anti-cheat - as disclosed by the developer.
- Online only / MMO - whether the game has a single-player mode.
- AI-generated content - from Steam's AI content disclosure, with the developer's own words.
- DRM-free on GOG - with a link, if the game is sold there.

In search results, chips under each title show only what stands out: Denuvo, kernel anti-cheat, required account, online only, AI content, DRM-free on GOG.

All checks are on by default and can be switched off one by one.

Private by design: nothing about you is collected or sent anywhere. Requests go only to Steam and to the public GOG catalog.

Not affiliated with Valve, GOG or any DRM vendor.

## Russian description

Узнайте, что ограничивает игру в Steam, до покупки. DRM Check добавляет на страницу каждой игры в магазине Steam плашку «Проверка DRM»:

- Сторонний DRM - Denuvo и другие, в том числе лимиты активаций.
- Обязательные сторонние аккаунты - EA, Ubisoft, Rockstar, Embark ID и другие.
- Античит на уровне ядра - как указал разработчик.
- Только по сети / MMO - есть ли в игре одиночный режим.
- Контент, созданный ИИ - из раздела Steam об ИИ-контенте, со словами самого разработчика.
- Без DRM в GOG - со ссылкой, если игра там продаётся.

В результатах поиска под каждым названием - значки только с заметным: Denuvo, античит ядра, обязательный аккаунт, только онлайн, ИИ-контент, без DRM в GOG.

Все проверки включены по умолчанию, каждую можно выключить.

Конфиденциально: расширение ничего о вас не собирает и никуда не отправляет. Запросы идут только в Steam и в открытый каталог GOG.

Проект не связан с Valve, GOG и разработчиками DRM.

## Privacy fields (Edge / Chrome)

- Single purpose: Shows on Steam store pages what restricts a game - third-party DRM, required accounts, kernel anti-cheat, online-only play, AI-generated content - and whether it is sold DRM-free on GOG.
- storage: Saves the user's settings and a local cache of looked-up game facts and GOG results (2 weeks / 1 week). Nothing is sent anywhere.
- Host permission (catalog.gog.com, store.steampowered.com): The content script reads the Steam game page and, for search results, Steam's store API and the English game pages of listed games. The background worker sends only the game title to the public GOG catalog to check whether the game is sold there DRM-free.
- Remote code: No. Data collected: none.

## Notes for certification

Open any Steam game page, e.g. https://store.steampowered.com/app/2073850/ (THE FINALS) or https://store.steampowered.com/app/2246340/ (Monster Hunter Wilds): a pink "DRM check" plate appears under the tags in the top-right product card. In search results (https://store.steampowered.com/search/?term=monster+hunter) chips such as "Denuvo" appear under titles. No account or setup is needed; all checks are on by default.
