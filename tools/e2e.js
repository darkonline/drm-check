// Loads the extension into headless Edge and prints what it shows on Steam game pages and in search results.
// Usage: node tools/e2e.js [appid ...]   Env: OE_LANG=en-US|ru-RU, OE_SHOTS=<dir>, OE_SEARCH=<term>
const path = require('path');
const { launch, sleep } = require('./cdp');

const extDir = path.resolve(__dirname, '..', 'extension');
const apps = process.argv.slice(2).length ? process.argv.slice(2) : ['2246340', '2073850', '3240220', '632470', '730'];
const shots = process.env.OE_SHOTS;

(async () => {
  const b = await launch({ extDir, lang: process.env.OE_LANG });
  try {
    const st = await b.newPage(`chrome-extension://${b.extId}/settings/settings.html`, { width: 900, height: 700 });
    console.log('settings:', await b.evaluate(st, `[...document.querySelectorAll('.check')].map(c => (c.querySelector('input').checked ? '[x] ' : '[ ] ') + c.querySelector('b').textContent).join(' | ')`));
    if (shots) await b.screenshot(st, path.join(shots, 'settings.png'));

    for (const id of apps) {
      const s = await b.newPage(`https://store.steampowered.com/app/${id}/`, { wait: 6000 });
      const r = await b.evaluate(s, `JSON.stringify({ title: document.title, facts: [...document.querySelectorAll('.dc-fact')].map(f => f.className.replace('dc-fact dc-', '') + ': ' + f.textContent) })`);
      console.log('app', id, r);
      if (shots) {
        await b.evaluate(s, `(()=>{const e=document.querySelector('.dc-plate')||document.querySelector('.glance_ctn');if(e)e.scrollIntoView({block:'center'})})()`);
        await sleep(400);
        await b.screenshot(s, path.join(shots, 'app-' + id + '.png'));
      }
    }

    const term = process.env.OE_SEARCH || 'monster hunter';
    const s = await b.newPage('https://store.steampowered.com/search/?term=' + encodeURIComponent(term), { wait: 4000 });
    await sleep(14000);
    console.log('search:', await b.evaluate(s, `JSON.stringify([...document.querySelectorAll('a.search_result_row')].slice(0, 12).map(r => r.querySelector('.title').textContent + ' | ' + [...r.querySelectorAll('.dc-chip')].map(c => c.className.replace('dc-chip dc-', '') + ':' + c.textContent).join(', ')), null, 1)`));
    if (shots) { await b.evaluate(s, `document.querySelector('#search_resultsRows').scrollIntoView({block:'start'});window.scrollBy(0,-90)`); await sleep(400); await b.screenshot(s, path.join(shots, 'search.png')); }
  } finally {
    await b.close();
  }
})().catch(e => { console.error('E2E FAILED:', e); process.exit(1); });
