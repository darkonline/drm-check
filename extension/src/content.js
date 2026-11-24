/* DRM Check — content script for store.steampowered.com.
   Game pages: a "DRM check" plate inside the product card. Search results: compact chips under titles. */
'use strict';

(() => {
  const t = DC.t;
  let settings = DC.DEFAULT_SETTINGS;
  // Firefox content scripts need content.fetch to make requests as the page itself.
  const pageFetch = (typeof content !== 'undefined' && content && content.fetch) ? content.fetch.bind(content) : fetch.bind(window);

  // Steam store categories (category2= on feature links, categoryids in the store API).
  const CAT_SINGLE = '2';
  const CAT_MMO = '20';
  const CAT_ONLINE = ['1', '9', '24', '27', '36', '37', '38', '39', '47', '48', '49'];

  // ---------- helpers ----------

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function appIdFromHref(href) {
    const m = /\/app\/(\d+)/.exec(href || '');
    return m ? m[1] : null;
  }

  // Own tooltip: native ones are cut off in the Steam client and cannot wrap long text.
  let tipEl = null;
  function attachTip(target, lines) {
    lines = lines.filter(Boolean);
    if (!lines.length) return;
    target.setAttribute('aria-label', lines.join('. '));
    target.addEventListener('mouseenter', () => {
      if (!tipEl) { tipEl = el('div', 'dc-tip'); document.body.appendChild(tipEl); }
      tipEl.textContent = '';
      lines.forEach(l => tipEl.appendChild(el('div', null, l)));
      tipEl.style.display = 'block';
      const r = target.getBoundingClientRect();
      const w = tipEl.offsetWidth, h = tipEl.offsetHeight;
      tipEl.style.left = Math.min(Math.max(8, r.left), window.innerWidth - w - 8) + 'px';
      let top = r.bottom + 6;
      if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 6);
      tipEl.style.top = top + 'px';
    });
    target.addEventListener('mouseleave', () => { if (tipEl) tipEl.style.display = 'none'; });
  }

  function modesFromCategories(ids) {
    const cats = new Set([...(ids || [])].map(String));
    if (!cats.size) return null;
    if (cats.has(CAT_MMO)) return 'mmo';
    if (cats.has(CAT_SINGLE)) return 'single';
    if (CAT_ONLINE.some(c => cats.has(c))) return 'online';
    return null;
  }

  // Text of a node with <br> kept as line breaks (works for parsed, not rendered, documents too).
  function lines(node) {
    let text = '';
    const walk = n => {
      n.childNodes.forEach(c => {
        if (c.nodeType === 3) text += c.nodeValue;
        else if (c.nodeType === 1) {
          if (c.tagName === 'BR') { text += '\n'; return; }
          walk(c);
          if (c.tagName === 'DIV' || c.tagName === 'P') text += '\n';
        }
      });
    };
    walk(node);
    return text.split('\n').map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
  }

  /** "Incorporates 3rd-party DRM: Denuvo Anti-tamper" → { name: "Denuvo Anti-tamper", details: "…" } */
  function parseNotice(node) {
    const ls = lines(node);
    const first = ls[0] || '';
    const ci = first.indexOf(':');
    let name = ci >= 0 ? first.slice(ci + 1).trim() : first;
    const rest = ls.slice(1);
    if (!name && rest.length) name = rest.shift();
    // "Embark ID (Supports Linking to Steam Account)" → name "Embark ID", the rest goes to details
    const paren = /\s*\(([^)]*)\)\s*$/.exec(name);
    if (paren) { name = name.slice(0, paren.index).trim(); rest.unshift(paren[1]); }
    return { name, details: rest.join(' · '), text: ls.join(' · ') };
  }

  /** Everything the plate needs, read from a Steam game page (the live one or a fetched copy). */
  function parseFacts(doc) {
    const cats = [...doc.querySelectorAll('a[href*="category2="]')]
      .map(a => (/category2=(\d+)/.exec(a.getAttribute('href')) || [])[1]).filter(Boolean);
    const facts = { modes: modesFromCategories(cats), ac: null, drm: [], accounts: [], ai: null };

    const acEl = doc.querySelector('.anticheat_section');
    if (acEl) {
      const nameEl = acEl.querySelector('.anticheat_name');
      const name = nameEl ? (nameEl.firstChild ? nameEl.firstChild.textContent : nameEl.textContent).trim() : '';
      facts.ac = { name, kernel: /kernel|ядр/i.test(acEl.textContent), text: lines(acEl).join(' · ') };
    }

    doc.querySelectorAll('.DRM_notice').forEach(n => {
      if (n.classList.contains('anticheat_section') || n.querySelector('a[href*="/eula/"]')) return;
      const text = n.textContent;
      if (/DRM|denuvo|anti-?tamper/i.test(text)) facts.drm.push(parseNotice(n));
      else if (/account|аккаунт|учётн|учетн|konto|compte|cuenta|conta|账户|アカウント/i.test(text)) facts.accounts.push(parseNotice(n));
    });

    // The AI disclosure shares its element id with the mature content description; tell them apart by the heading.
    const aiEl = [...doc.querySelectorAll('[id="game_area_content_descriptors"]')]
      .find(d => /\bAI\b|ИИ|\bKI\b|\bIA\b|\bSI\b|人工智能|生成|AI生成/.test((d.querySelector('h2') || {}).textContent || ''));
    if (aiEl) {
      const quote = aiEl.querySelector('i');
      facts.ai = { text: (quote ? quote.textContent : aiEl.textContent).replace(/\s+/g, ' ').trim().slice(0, 400) };
    }
    return facts;
  }

  // ---------- cache (lists reuse what game pages and background fetches found) ----------

  const TTL = 14 * 24 * 3600 * 1000;
  let cache = null;
  let saveTimer = null;

  async function cacheGet(appid) {
    if (!cache) cache = (await chrome.storage.local.get('factsCache')).factsCache || {};
    const e = cache[appid];
    return e && Date.now() - e.at < TTL ? e : null;
  }

  async function cacheSet(appid, patch) {
    if (!appid) return;
    await cacheGet(appid);
    cache[appid] = Object.assign({}, cache[appid], patch, { at: Date.now() });
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const keys = Object.keys(cache);
      if (keys.length > 5000) keys.sort((a, b) => cache[a].at - cache[b].at).slice(0, keys.length - 5000).forEach(k => delete cache[k]);
      chrome.storage.local.set({ factsCache: cache });
    }, 1000);
  }

  // ---------- facts → labels ----------

  /** [{ kind: good|warn|bad|neutral, text, tip, href, list }] ; list = also shown as a chip in search results */
  function describe(f, gog) {
    const out = [];
    if (settings.modes && f.modes) {
      if (f.modes === 'mmo') out.push({ kind: 'warn', text: t('factMmo'), chip: t('chipMmo'), tip: t('factModesTip'), list: true });
      else if (f.modes === 'single') out.push({ kind: 'good', text: t('factSingle'), tip: t('factModesTip') });
      else out.push({ kind: 'warn', text: t('factOnlineOnly'), chip: t('chipOnline'), tip: t('factModesTip'), list: true });
    }
    if (settings.antiCheat && 'ac' in f) {
      if (f.ac && f.ac.kernel) out.push({ kind: 'bad', text: t('factKernelAc', [f.ac.name || '?']), chip: t('chipKernelAc'), tip: f.ac.text, list: true });
      else if (f.ac) out.push({ kind: 'warn', text: t('factAc', [f.ac.name || '?']), tip: f.ac.text });
      else out.push({ kind: 'good', text: t('factNoKernelAc'), tip: t('factNoKernelAcTip') });
    }
    if (settings.drm && 'drm' in f) {
      (f.drm || []).forEach(d => out.push({ kind: 'bad', text: t('factDrm', [d.name]), chip: /denuvo/i.test(d.name) ? 'Denuvo' : (d.name && d.name.length <= 22 ? d.name : t('chipDrm')), tip: [d.text, d.details].filter(Boolean).join(' · '), list: true }));
      (f.accounts || []).forEach(a => out.push({ kind: 'warn', text: t('factAccount', [a.name]), chip: t('chipAccount', [a.name]), tip: a.text, list: true }));
      if (!(f.drm || []).length && !(f.accounts || []).length) out.push({ kind: 'good', text: t('factNoDrm'), tip: t('factNoDrmTip') });
    }
    if (settings.ai && 'ai' in f) {
      if (f.ai) out.push({ kind: 'warn', text: t('factAi'), chip: t('chipAi'), tip: t('factAiTip', [f.ai.text || '']), list: true });
      else out.push({ kind: 'good', text: t('factNoAi'), tip: t('factNoAiTip') });
    }
    if (settings.gog && gog !== undefined) {
      if (gog && gog.found) out.push({ kind: 'good', text: t('factGogYes'), chip: t('chipGog'), tip: t('factGogTip', [gog.title]), href: gog.url, list: true });
      else if (gog && gog.error) out.push({ kind: 'neutral', text: t('factGogError') });
      else if (gog) out.push({ kind: 'neutral', text: t('factGogNo'), tip: t('factGogNoTip') });
    }
    return out;
  }

  function factNode(d, cls) {
    const n = el(d.href ? 'a' : 'span', cls + ' dc-' + d.kind, cls === 'dc-chip' ? (d.chip || d.text) : d.text);
    if (d.href) { n.href = d.href; n.target = '_blank'; n.rel = 'noopener'; n.addEventListener('click', e => e.stopPropagation()); }
    if (d.tip) attachTip(n, [d.tip]);
    return n;
  }

  // ---------- game page: plate inside the product card ----------

  async function processAppPage() {
    const host = document.querySelector('.glance_ctn');
    if (!host || host.dataset.dcDone) return;
    host.dataset.dcDone = '1';
    const appid = appIdFromHref(location.pathname);
    const titleEl = document.querySelector('#appHubAppName, .apphub_AppName');
    const title = titleEl ? titleEl.textContent.trim() : '';
    const facts = parseFacts(document);
    cacheSet(appid, { facts });

    const plate = el('div', 'dc-plate');
    plate.appendChild(el('div', 'dc-head', t('plateTitle')));
    const list = el('div', 'dc-list');
    plate.appendChild(list);
    const render = gog => {
      list.textContent = '';
      describe(facts, gog).forEach(d => list.appendChild(factNode(d, 'dc-fact')));
      if (settings.gog && gog === undefined) list.appendChild(el('span', 'dc-fact dc-pending', t('factGogChecking')));
    };
    render(undefined);
    if (!list.children.length) return;
    host.appendChild(plate);

    if (settings.gog && title) {
      let gog;
      try { gog = await chrome.runtime.sendMessage({ type: 'dc-gog', title }); } catch (e) { gog = { error: String(e) }; }
      gog = gog || { error: 'no response' };
      if (!gog.error) cacheSet(appid, { gog });
      render(gog);
    }
  }

  // ---------- search results: chips for what stands out ----------

  async function fetchModes(appids) {
    const out = {};
    for (let i = 0; i < appids.length; i += 50) {
      const input = {
        ids: appids.slice(i, i + 50).map(a => ({ appid: Number(a) })),
        context: { language: 'english', country_code: 'US', steam_realm: 1 },
        data_request: { include_basic_info: false }
      };
      try {
        const r = await pageFetch('https://api.steampowered.com/IStoreBrowseService/GetItems/v1?input_json=' + encodeURIComponent(JSON.stringify(input)), { credentials: 'omit' });
        const j = await r.json();
        ((j.response && j.response.store_items) || []).forEach(it => {
          const c = it.categories || {};
          out[it.appid || it.id] = modesFromCategories([].concat(c.supported_player_categoryids || [], c.feature_categoryids || []));
        });
      } catch (e) { /* unknown */ }
    }
    return out;
  }

  /** Fetches the English game page and reads the facts from it; undefined if the page is not available (age gate…). */
  async function fetchPageFacts(appid) {
    try {
      const r = await pageFetch(location.origin + '/app/' + appid + '/?l=english', { credentials: 'include' });
      if (!r.ok || /agecheck|\/login/.test(r.url)) return undefined;
      const doc = new DOMParser().parseFromString(await r.text(), 'text/html');
      if (!doc.querySelector('.glance_ctn, #game_area_purchase')) return undefined;
      return parseFacts(doc);
    } catch (e) {
      return undefined;
    }
  }

  // Background lookups run two at a time: they are real page / catalog requests.
  const queue = [];
  let running = 0;
  function enqueue(job) {
    return new Promise(resolve => {
      queue.push(async () => { try { resolve(await job()); } catch (e) { resolve(undefined); } });
      pump();
    });
  }
  function pump() {
    while (running < 2 && queue.length) {
      const job = queue.shift();
      running++;
      job().finally(() => { running--; pump(); });
    }
  }

  const needsPage = () => settings.antiCheat || settings.drm || settings.ai;
  let observer = null;

  function renderChips(row, facts, gog) {
    const box = row.querySelector('.dc-chips');
    if (!box) return;
    box.textContent = '';
    describe(facts, gog).filter(d => d.list).forEach(d => box.appendChild(factNode(d, 'dc-chip')));
    box.hidden = !box.children.length;
  }

  async function fillRow(row) {
    const appid = row.getAttribute('data-ds-appid');
    const title = ((row.querySelector('.title') || {}).textContent || '').trim();
    let entry = (await cacheGet(appid)) || {};
    let facts = Object.assign({ modes: row._dcModes || null }, entry.facts || {});
    if (row._dcModes) facts.modes = row._dcModes;

    if (needsPage() && !entry.facts) {
      const page = await enqueue(() => fetchPageFacts(appid));
      if (page) { await cacheSet(appid, { facts: page }); facts = Object.assign(page, row._dcModes ? { modes: row._dcModes } : {}); }
    }
    renderChips(row, facts, entry.gog);

    if (settings.gog && title && !('gog' in entry)) {
      const gog = await enqueue(() => chrome.runtime.sendMessage({ type: 'dc-gog', title }));
      if (gog && !gog.error) { await cacheSet(appid, { gog }); renderChips(row, facts, gog); }
    }
  }


  /**
   * Places the shared badge row of a search result on the platform-icons line, right after the icons and before the
   * release date, so it covers nothing and the row keeps its height. Owned Elsewhere and DRM Check share this code.
   */
  function placeBadgeRow(row) {
    const box = row.querySelector('.steam-ext-badges');
    const plats = row.querySelector('.search_platforms');
    if (!box || !plats) return;
    const rb = row.getBoundingClientRect();
    if (!rb.width) return;
    const pr = plats.getBoundingClientRect();
    const icons = [...plats.children].filter(c => c.getBoundingClientRect().width);
    const left = (icons.length ? icons[icons.length - 1].getBoundingClientRect().right + 10 : pr.left) - rb.left;
    const released = row.querySelector('.search_released');
    const limit = released && released.getBoundingClientRect().width ? released.getBoundingClientRect().left - rb.left - 10 : rb.width * 0.6;
    box.classList.add('steam-ext-badges-placed');
    box.style.left = left + 'px';
    box.style.top = (pr.top - rb.top + (pr.height - 16) / 2) + 'px';
    box.style.maxWidth = Math.max(60, limit - left) + 'px';
  }
  window.addEventListener('resize', () => document.querySelectorAll('a.search_result_row').forEach(placeBadgeRow));

  async function processSearch() {
    if (!settings.lists) return;
    const rows = [...document.querySelectorAll('a.search_result_row[data-ds-appid]')]
      .filter(r => !r.dataset.dcDone && !/,/.test(r.getAttribute('data-ds-appid')));
    if (!rows.length) return;
    rows.forEach(r => {
      r.dataset.dcDone = '1';
      const titleEl = r.querySelector('.title');
      if (!titleEl) return;
      const box = el('div', 'dc-chips');
      box.hidden = true;
      // Shared row under the title, laid over the free space so the row keeps its height.
      // Owned Elsewhere puts its badge into the same element; ours goes after it.
      let shared = titleEl.parentElement.querySelector(':scope > .steam-ext-badges');
      if (!shared) {
        shared = el('div', 'steam-ext-badges');
        titleEl.insertAdjacentElement('afterend', shared);
      }
      shared.appendChild(box);
      placeBadgeRow(r);
    });

    if (settings.modes) {
      const ids = rows.map(r => r.getAttribute('data-ds-appid'));
      const modes = await fetchModes(ids);
      rows.forEach(r => { r._dcModes = modes[r.getAttribute('data-ds-appid')] || null; renderChips(r, { modes: r._dcModes }); });
    }

    if (!observer) {
      observer = new IntersectionObserver(entries => entries.forEach(e => {
        if (!e.isIntersecting) return;
        observer.unobserve(e.target);
        fillRow(e.target);
      }), { rootMargin: '200px' });
    }
    rows.forEach(r => observer.observe(r));
  }

  // ---------- main ----------

  function run() {
    const path = location.pathname;
    if (/^\/app\/\d+/.test(path)) processAppPage();
    if (/^\/search/.test(path)) processSearch();
  }

  let scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => { scheduled = false; run(); }, 300);
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes.settings) return;
    DC.loadSettings().then(s => {
      settings = s;
      document.querySelectorAll('.dc-plate, .dc-chips').forEach(n => n.remove());
      document.querySelectorAll('.steam-ext-badges').forEach(b => { if (!b.children.length) b.remove(); });
      document.querySelectorAll('[data-dc-done]').forEach(n => delete n.dataset.dcDone);
      run();
    });
  });

  DC.loadSettings().then(s => {
    settings = s;
    run();
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
  });
})();
