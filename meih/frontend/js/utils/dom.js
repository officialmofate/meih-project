export function $(selector) {
  try {
    return document.querySelector(selector);
  } catch (e) { return null; }
}

export function $$(selector) {
  try {
    return Array.from(document.querySelectorAll(selector));
  } catch (e) { return []; }
}

export function createElement(tag, attrs = {}, children = []) {
  try {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([key, val]) => {
      if (key === 'style' && typeof val === 'object') {
        Object.assign(el.style, val);
      } else if (key === 'dataset' && typeof val === 'object') {
        Object.entries(val).forEach(([k, v]) => { el.dataset[k] = v; });
      } else if (key.startsWith('on') && typeof val === 'function') {
        el.addEventListener(key.slice(2).toLowerCase(), val);
      } else if (key === 'className') {
        el.className = val;
      } else {
        el.setAttribute(key, val);
      }
    });
    children.forEach((child) => {
      if (typeof child === 'string') {
        el.appendChild(document.createTextNode(child));
      } else if (child instanceof Node) {
        el.appendChild(child);
      }
    });
    return el;
  } catch (e) { console.error('[createElement]', e); return document.createElement(tag); }
}

export function animateCSS(element, animationName, callback) {
  try {
    if (!element) return;
    const prefix = 'animate__';
    element.classList.add(`${prefix}animated`, `${prefix}${animationName}`);
    function handleEnd() {
      element.classList.remove(`${prefix}animated`, `${prefix}${animationName}`);
      element.removeEventListener('animationend', handleEnd);
      if (typeof callback === 'function') callback();
    }
    element.addEventListener('animationend', handleEnd);
  } catch (e) { console.error('[animateCSS]', e); }
}

export function debounce(fn, ms = 250) {
  let timer;
  return function (...args) {
    try {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    } catch (e) { console.error('[debounce]', e); }
  };
}

export function throttle(fn, ms = 250) {
  let last = 0;
  let timer;
  return function (...args) {
    try {
      const now = Date.now();
      const remaining = ms - (now - last);
      clearTimeout(timer);
      if (remaining <= 0) {
        last = now;
        fn.apply(this, args);
      } else {
        timer = setTimeout(() => {
          last = Date.now();
          fn.apply(this, args);
        }, remaining);
      }
    } catch (e) { console.error('[throttle]', e); }
  };
}

export function formatNumber(n) {
  try {
    return new Intl.NumberFormat().format(n);
  } catch (e) { return String(n); }
}

export function formatDate(dateStr) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch (e) { return dateStr || ''; }
}

export function timeAgo(dateStr) {
  try {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const seconds = Math.floor((now - then) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`;
    const years = Math.floor(months / 12);
    return `${years} year${years !== 1 ? 's' : ''} ago`;
  } catch (e) { return ''; }
}
