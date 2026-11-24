'use strict';

(async () => {
  DC.applyI18n();
  document.documentElement.lang = chrome.i18n.getUILanguage();
  // Opened as the toolbar popup (narrow) or as the options page (full tab).
  if (window.innerWidth < 500) document.body.classList.add('popup');

  const settings = await DC.loadSettings();
  const add = (container, key) => {
    const label = document.createElement('label');
    label.className = 'check';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = !!settings[key];
    input.addEventListener('change', () => DC.saveSettings({ [key]: input.checked }));
    const text = document.createElement('span');
    const title = document.createElement('b');
    title.textContent = DC.t('set_' + key);
    const hint = document.createElement('small');
    hint.textContent = DC.t('hint_' + key);
    text.append(title, hint);
    label.append(input, text);
    container.appendChild(label);
  };
  ['drm', 'antiCheat', 'modes', 'ai', 'gog'].forEach(k => add(document.getElementById('checks'), k));
  ['lists'].forEach(k => add(document.getElementById('where'), k));
})();
