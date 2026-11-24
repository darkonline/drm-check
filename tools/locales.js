// Source of truth for UI strings: node tools/locales.js → extension/_locales/{en,ru}/messages.json
const fs = require('fs');
const path = require('path');

const S = {
  extName: ['DRM Check — DRM, anti-cheat, online and AI on Steam', 'DRM Check — DRM, античит, онлайн и ИИ в Steam'],
  extShortName: ['DRM Check', 'DRM Check'],
  extDescription: [
    'Shows on Steam what restricts a game: Denuvo and other DRM, kernel anti-cheat, online only, AI content, DRM-free on GOG.',
    'Показывает в Steam, что ограничивает игру: Denuvo и другой DRM, античит ядра, только онлайн, ИИ-контент, наличие в GOG.'],

  secChecks: ['What to check', 'Что проверять'],
  secWhere: ['Where to show', 'Где показывать'],
  set_drm: ['Third-party DRM and accounts', 'Сторонний DRM и аккаунты'],
  hint_drm: ['Denuvo and other DRM, activation limits, required third-party accounts (EA, Ubisoft, Rockstar…).',
    'Denuvo и другой DRM, лимиты активаций, обязательные сторонние аккаунты (EA, Ubisoft, Rockstar…).'],
  set_antiCheat: ['Kernel-level anti-cheat', 'Античит на уровне ядра'],
  hint_antiCheat: ['As disclosed by the developer on the Steam page.', 'Как указал разработчик на странице Steam.'],
  set_modes: ['Online only / MMO', 'Только по сети / MMO'],
  hint_modes: ['Whether the game has single-player, from Steam categories.', 'Есть ли одиночный режим — по категориям Steam.'],
  set_ai: ['AI-generated content', 'Контент, созданный ИИ'],
  hint_ai: ['Steam’s “AI Generated Content Disclosure”.', 'Раздел Steam «Информация об ИИ-контенте».'],
  set_gog: ['DRM-free on GOG', 'Без DRM в GOG'],
  hint_gog: ['Looks the title up in the public GOG catalog.', 'Ищет игру в открытом каталоге GOG.'],
  set_lists: ['Chips in search results', 'Значки в результатах поиска'],
  hint_lists: ['Only what stands out. Looks up visible rows two at a time and remembers results for two weeks.',
    'Только заметное. Проверяет видимые строки по две за раз и запоминает результат на две недели.'],
  privacyNote: ['Nothing about you is collected or sent anywhere. Requests go only to Steam and the GOG catalog.',
    'Расширение ничего о вас не собирает и никуда не отправляет. Запросы идут только в Steam и в каталог GOG.'],

  plateTitle: ['DRM check', 'Проверка DRM'],
  factSingle: ['Single-player', 'Есть одиночный режим'],
  factOnlineOnly: ['Online only — no single-player', 'Только по сети — без одиночного режима'],
  factMmo: ['MMO — needs a permanent connection', 'MMO — нужно постоянное подключение'],
  factModesTip: ['Based on the game’s categories on Steam.', 'По категориям игры в Steam.'],
  factKernelAc: ['Kernel anti-cheat: $1', 'Античит ядра: $1'],
  factAc: ['Anti-cheat: $1', 'Античит: $1'],
  factNoKernelAc: ['No kernel anti-cheat declared', 'Античит ядра не заявлен'],
  factNoKernelAcTip: ['Steam requires games to disclose kernel-level anti-cheat; this page has none.',
    'Steam требует указывать античит уровня ядра; на этой странице его нет.'],
  factDrm: ['DRM: $1', 'DRM: $1'],
  factAccount: ['Requires account: $1', 'Нужен аккаунт: $1'],
  factNoDrm: ['No third-party DRM declared', 'Сторонний DRM не заявлен'],
  factNoDrmTip: ['Steam’s own DRM may still apply; this page names no third-party DRM or required accounts.',
    'Собственный DRM Steam может быть; сторонний DRM и обязательные аккаунты на странице не указаны.'],
  factAi: ['Uses AI-generated content', 'Использует ИИ-контент'],
  factAiTip: ['Developer: “$1”', 'Разработчик: «$1»'],
  factNoAi: ['No AI content declared', 'ИИ-контент не заявлен'],
  factNoAiTip: ['The page has no AI Generated Content Disclosure.', 'На странице нет раздела об ИИ-контенте.'],
  factGogChecking: ['GOG: checking…', 'GOG: проверяю…'],
  factGogYes: ['DRM-free on GOG ↗', 'Без DRM в GOG ↗'],
  factGogTip: ['Found on GOG as “$1”. GOG sells games without DRM; online features may still need an account.',
    'Найдено в GOG как «$1». GOG продаёт игры без DRM; сетевые функции всё равно могут требовать аккаунт.'],
  factGogNo: ['Not on GOG', 'В GOG нет'],
  factGogNoTip: ['No game with this exact title in the GOG catalog. It may be sold there under a different name.',
    'В каталоге GOG нет игры с точно таким названием. Возможно, она продаётся там под другим именем.'],
  factGogError: ['GOG: could not check', 'GOG: не удалось проверить'],

  chipOnline: ['Online only', 'Только онлайн'],
  chipMmo: ['MMO', 'MMO'],
  chipKernelAc: ['Kernel anti-cheat', 'Античит ядра'],
  chipDrm: ['3rd-party DRM', 'Сторонний DRM'],
  chipAccount: ['$1 account', 'Аккаунт $1'],
  chipAi: ['AI content', 'ИИ-контент'],
  chipGog: ['DRM-free on GOG', 'Без DRM в GOG']
};

for (const [lang, i] of Object.entries({ en: 0, ru: 1 })) {
  const out = {};
  for (const [k, v] of Object.entries(S)) out[k] = { message: v[i] };
  const dir = path.join(__dirname, '..', 'extension', '_locales', lang);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'messages.json'), JSON.stringify(out, null, 2) + '\n');
}
console.log('locales written:', Object.keys(S).length, 'keys');
