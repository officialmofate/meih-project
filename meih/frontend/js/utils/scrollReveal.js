let mainObserver = null;

export function initScrollReveal() {
  try {
    if (mainObserver) mainObserver.disconnect();

    mainObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = parseInt(el.dataset.delay || '0', 10);
          if (delay > 0) {
            setTimeout(() => el.classList.add('visible'), delay);
          } else {
            el.classList.add('visible');
          }
          mainObserver.unobserve(el);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    });

    document.querySelectorAll('.reveal').forEach((el) => {
      mainObserver.observe(el);
    });
  } catch (e) {
    console.error('[scrollReveal]', e);
  }
}

export function revealOnScroll(element, options = {}) {
  try {
    if (!element) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = parseInt(el.dataset.delay || options.delay || '0', 10);
          if (delay > 0) {
            setTimeout(() => el.classList.add('visible'), delay);
          } else {
            el.classList.add('visible');
          }
          observer.unobserve(el);
        }
      });
    }, {
      threshold: options.threshold || 0.1,
      rootMargin: options.rootMargin || '0px 0px -50px 0px',
    });

    observer.observe(element);
    return observer;
  } catch (e) {
    console.error('[revealOnScroll]', e);
  }
}

export function revealAll(container) {
  try {
    const root = container || document;
    const elements = root.querySelectorAll ? root.querySelectorAll('.reveal') : document.querySelectorAll('.reveal');
    elements.forEach((el) => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const delay = parseInt(el.dataset.delay || '0', 10);
            if (delay > 0) {
              setTimeout(() => el.classList.add('visible'), delay);
            } else {
              el.classList.add('visible');
            }
            observer.unobserve(el);
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
      });
      observer.observe(el);
    });
  } catch (e) {
    console.error('[revealAll]', e);
  }
}
