const isDev = location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.protocol === 'file:';
const metrics = {};

export const perf = {
  mark(name) {
    try {
      if (!isDev) return;
      if (typeof performance.mark === 'function') {
        performance.mark(name);
      }
    } catch (e) { /* silent */ }
  },

  measure(name, startMark, endMark) {
    try {
      if (!isDev) return;
      if (typeof performance.measure === 'function') {
        performance.measure(name, startMark, endMark);
        const entry = performance.getEntriesByName(name).pop();
        if (entry) {
          metrics[name] = entry.duration;
          console.log(`%c[perf] ${name}: ${entry.duration.toFixed(2)}ms`, 'color:#6c5ce7;font-weight:bold;');
        }
      }
    } catch (e) { /* silent */ }
  },

  observeLongTasks() {
    try {
      if (!isDev || typeof PerformanceObserver === 'undefined') return;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            console.warn(`%c[perf] Long task: ${entry.duration.toFixed(1)}ms`, 'color:#ff6b6b;font-weight:bold;', entry);
          }
        }
      });
      observer.observe({ type: 'longtask', buffered: true });
    } catch (e) { /* silent */ }
  },

  observeLCP() {
    try {
      if (!isDev || typeof PerformanceObserver === 'undefined') return;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        if (last) {
          metrics.lcp = last.startTime;
          console.log(`%c[perf] LCP: ${last.startTime.toFixed(1)}ms`, 'color:#00b894;font-weight:bold;');
        }
      });
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) { /* silent */ }
  },

  observeFID() {
    try {
      if (!isDev || typeof PerformanceObserver === 'undefined') return;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.processingStart - entry.startTime > 0) {
            const fid = entry.processingStart - entry.startTime;
            metrics.fid = fid;
            console.log(`%c[perf] FID: ${fid.toFixed(1)}ms`, 'color:#00cec9;font-weight:bold;');
          }
        }
      });
      observer.observe({ type: 'first-input', buffered: true });
    } catch (e) { /* silent */ }
  },

  observeCLS() {
    try {
      if (!isDev || typeof PerformanceObserver === 'undefined') return;
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            metrics.cls = clsValue;
          }
        }
        console.log(`%c[perf] CLS: ${clsValue.toFixed(4)}`, 'color:#ffd93d;font-weight:bold;');
      });
      observer.observe({ type: 'layout-shift', buffered: true });
    } catch (e) { /* silent */ }
  },

  getMetrics() {
    try {
      return { ...metrics };
    } catch (e) { return {}; }
  },

  reportMetrics() {
    try {
      if (!isDev) return;
      console.log('%c── Performance Metrics ──', 'color:#6c5ce7;font-size:14px;font-weight:bold;');
      Object.entries(metrics).forEach(([key, val]) => {
        console.log(`  ${key}: ${typeof val === 'number' ? val.toFixed(2) : val}`);
      });
      console.log('%c────────────────────────', 'color:#6c5ce7;');
    } catch (e) { /* silent */ }
  },
};
