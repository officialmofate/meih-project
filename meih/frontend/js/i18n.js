import { translations } from './translations.js';

const STORAGE_KEY = 'meih_lang';
let currentLang = localStorage.getItem(STORAGE_KEY) || 'en';

export function t(key) {
  return (translations[currentLang] && translations[currentLang][key]) ||
         (translations.en && translations.en[key]) ||
         key;
}

export function getLang() {
  return currentLang;
}

export function setLang(lang) {
  if (!translations[lang]) return;
  currentLang = lang;
  localStorage.setItem(STORAGE_KEY, lang);
  document.documentElement.lang = lang === 'sw' ? 'sw' : 'en';
  applyTranslations();
}

export function toggleLang() {
  setLang(currentLang === 'en' ? 'sw' : 'en');
}

export function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(function(el) {
    var key = el.getAttribute('data-i18n');
    var translated = t(key);
    if (translated !== key) {
      if (el.tagName === 'INPUT' && el.type !== 'submit') {
        if (el.placeholder !== undefined && el.hasAttribute('data-i18n-ph')) {
          el.placeholder = t(el.getAttribute('data-i18n-ph'));
        }
        el.value = translated;
      } else {
        el.innerHTML = translated;
      }
    }
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(function(el) {
    var key = el.getAttribute('data-i18n-ph');
    var translated = t(key);
    if (translated !== key) {
      el.placeholder = translated;
    }
  });
  document.querySelectorAll('[data-i18n-title]').forEach(function(el) {
    var key = el.getAttribute('data-i18n-title');
    var translated = t(key);
    if (translated !== key) {
      el.title = translated;
    }
  });
}
