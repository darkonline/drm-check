/* Background worker: GOG catalog lookups (cross-origin, so the content script cannot do them itself). */
'use strict';

if (typeof DC === 'undefined' && typeof importScripts === 'function') importScripts('shared.js');

const GOG_TTL = 7 * 24 * 3600 * 1000;

async function gogCache(key, value) {
  const { gogCache: cache = {} } = await chrome.storage.local.get('gogCache');
  if (value === undefined) {
    const hit = cache[key];
    return hit && Date.now() - hit.at < GOG_TTL ? hit : null;
  }
  cache[key] = Object.assign({ at: Date.now() }, value);
  const keys = Object.keys(cache);
  if (keys.length > 3000) keys.sort((a, b) => cache[a].at - cache[b].at).slice(0, keys.length - 3000).forEach(k => delete cache[k]);
  await chrome.storage.local.set({ gogCache: cache });
  return cache[key];
}

/** { found, title?, url? } or { error }. GOG's search is fuzzy, so titles are compared strictly. */
async function lookupGog(title) {
  const norm = DC.normalizeTitle(title);
  const loose = DC.looseTitle(title);
  if (!norm) return { found: false };
  const cached = await gogCache(norm);
  if (cached) return cached;
  let data;
  try {
    const r = await fetch('https://catalog.gog.com/v1/catalog?limit=20&productType=in:game,pack&locale=en-US&query=like:' + encodeURIComponent(title), { credentials: 'omit' });
    if (!r.ok) return { error: 'http ' + r.status };
    data = await r.json();
  } catch (e) {
    return { error: String(e) };
  }
  const products = (data && data.products) || [];
  const exact = products.find(p => DC.normalizeTitle(p.title) === norm);
  const near = exact || products.find(p => loose && DC.looseTitle(p.title) === loose);
  const result = near
    ? { found: true, title: near.title, url: near.storeLink || ('https://www.gog.com/game/' + near.slug) }
    : { found: false };
  return gogCache(norm, result);
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'dc-gog') {
    lookupGog(msg.title).then(sendResponse, e => sendResponse({ error: String(e) }));
    return true;
  }
  return false;
});
