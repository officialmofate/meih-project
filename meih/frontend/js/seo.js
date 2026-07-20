function initPageMeta(opts) {
  opts = opts || {};
  var title = opts.title || 'MEIH — MOFATE Event & Innovation Hub';
  var desc = opts.description || 'MEIH connects event planners, vendors, and innovators across Tanzania. Browse events, discover vendors, and explore innovations.';
  var image = opts.image || (window.MEIH_BACKEND_URL || '') + '/images/og-default.jpg';
  var url = opts.url || window.location.href;
  var type = opts.type || 'website';

  document.title = title;

  setMeta('description', desc);
  setMeta('robots', opts.robots || 'index, follow');

  setMeta('og:title', title);
  setMeta('og:description', desc);
  setMeta('og:image', image);
  setMeta('og:url', url);
  setMeta('og:type', type);

  setMeta('twitter:card', opts.twitterCard || 'summary_large_image');
  setMeta('twitter:title', title);
  setMeta('twitter:description', desc);
  setMeta('twitter:image', image);

  setLink('canonical', url, 'canonical');
}

function setMeta(name, content) {
  if (!content) return;
  var el = document.querySelector('meta[name="' + name + '"], meta[property="' + name + '"]');
  if (el) { el.setAttribute('content', content); return; }
  el = document.createElement('meta');
  if (name.startsWith('og:') || name.startsWith('twitter:')) el.setAttribute('property', name);
  else el.setAttribute('name', name);
  el.setAttribute('content', content);
  document.head.appendChild(el);
}

function setLink(rel, href, title) {
  if (!href) return;
  var el = document.querySelector('link[rel="' + rel + '"]');
  if (el) { el.setAttribute('href', href); return; }
  el = document.createElement('link');
  el.setAttribute('rel', rel);
  el.setAttribute('href', href);
  if (title) el.setAttribute('title', title);
  document.head.appendChild(el);
}
