let imgObserver = null;

export function initLazyLoad() {
  try {
    if (imgObserver) imgObserver.disconnect();

    imgObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          lazyLoadImage(entry.target);
          imgObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.01,
      rootMargin: '200px 0px',
    });

    document.querySelectorAll('img[data-src]').forEach((img) => {
      if (!img.src || img.src === window.location.href) {
        imgObserver.observe(img);
      }
    });
  } catch (e) {
    console.error('[lazyLoad]', e);
  }
}

export function lazyLoadImage(img) {
  try {
    if (!img) return;
    const src = img.dataset.src;
    if (!src) return;

    img.style.transition = 'opacity 0.3s ease';
    img.style.opacity = '0';

    const tempImg = new Image();
    tempImg.onload = () => {
      img.src = src;
      img.classList.add('loaded');
      img.style.opacity = '1';
      delete img.dataset.src;
    };
    tempImg.onerror = () => {
      img.style.opacity = '1';
      img.alt = img.alt || 'Image failed to load';
    };
    tempImg.src = src;
  } catch (e) {
    console.error('[lazyLoadImage]', e);
  }
}

export function lazyLoadSection(container, loadFn) {
  try {
    if (!container || typeof loadFn !== 'function') return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadFn(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.01,
      rootMargin: '100px 0px',
    });

    observer.observe(container);
    return observer;
  } catch (e) {
    console.error('[lazyLoadSection]', e);
  }
}
