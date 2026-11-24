/* Shared helpers for the content script, the background worker and the settings page. */
'use strict';

var DC = (() => {
  const DEFAULT_SETTINGS = {
    modes: true,      // single-player / online only / MMO (Steam categories)
    antiCheat: true,  // kernel-level anti-cheat (Steam's disclosure)
    drm: true,        // third-party DRM such as Denuvo, required third-party accounts
    ai: true,         // AI-generated content disclosure
    gog: true,        // sold DRM-free on GOG
    lists: true       // compact chips in search results
  };

  async function loadSettings() {
    const st = await chrome.storage.local.get('settings');
    return Object.assign({}, DEFAULT_SETTINGS, st.settings || {});
  }

  async function saveSettings(patch) {
    const s = await loadSettings();
    await chrome.storage.local.set({ settings: Object.assign(s, patch) });
  }

  function t(key, subs) {
    try { return chrome.i18n.getMessage(key, subs) || key; } catch (e) { return key; }
  }

  // Title comparison for the GOG catalog: case-insensitive, ignores ™/®/©, punctuation and spacing.
  function normalizeTitle(title) {
    if (!title) return '';
    return String(title)
      .replace(/[™®©℠]/g, '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^\p{L}\p{N}]+/gu, '');
  }

  // Also drops edition suffixes, so "Disco Elysium" meets "Disco Elysium - The Final Cut".
  const EDITION_WORDS = [
    'game of the year edition', 'game of the year', 'goty edition', 'goty', 'definitive edition', 'complete edition',
    'digital deluxe edition', 'deluxe edition', 'gold edition', 'ultimate edition', 'enhanced edition', 'special edition',
    'standard edition', 'premium edition', 'anniversary edition', 'legendary edition', 'directors cut', "director's cut",
    'final cut', 'remastered', 'enhanced', 'edition'
  ].sort((a, b) => b.length - a.length);

  function looseTitle(title) {
    if (!title) return '';
    let s = String(title).replace(/[™®©℠]/g, '').toLowerCase().replace(/[()[\]]/g, ' ').replace(/\s+/g, ' ').trim();
    for (let changed = true; changed;) {
      changed = false;
      s = s.replace(/[\s:\-–—,.]+$/, '');
      if (/[\s:\-–—]the$/.test(s)) { s = s.slice(0, -3); changed = true; continue; }
      for (const w of EDITION_WORDS) {
        if (s.endsWith(' ' + w) || s.endsWith('-' + w) || s.endsWith(':' + w)) { s = s.slice(0, -w.length); changed = true; break; }
      }
    }
    return normalizeTitle(s.replace(/^the /, ''));
  }

  function applyI18n(root) {
    (root || document).querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  }

  return { DEFAULT_SETTINGS, loadSettings, saveSettings, t, normalizeTitle, looseTitle, applyI18n };
})();
