// Robust Chart.js loader + readiness signal
// - Loads Chart.js from CDN if Chart is not already present
// - Emits window event 'chartjs:ready' when Chart is available
// - Exposes window.ChartReadyPromise for code to await the library
(function (global) {
  const EVENT_NAME = 'chartjs:ready';
  const CDN_PRIMARY = 'https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js';
  const CDN_FALLBACK = 'https://unpkg.com/chart.js@4/dist/chart.umd.min.js';
  const ATTR_LOADER = 'data-chartjs-loader';

  // If Chart already exists, notify listeners asynchronously
  if (global.Chart && typeof global.Chart === 'function') {
    if (!global.ChartReadyPromise) {
      global.ChartReadyPromise = Promise.resolve(global.Chart);
      setTimeout(() => global.dispatchEvent(new Event(EVENT_NAME)), 0);
    }
    return;
  }

  // Prevent double-insertion if this loader was already executed
  if (document.querySelector('script[' + ATTR_LOADER + ']')) {
    // ensure ChartReadyPromise exists and will resolve when Chart becomes available
    if (!global.ChartReadyPromise) {
      global.ChartReadyPromise = new Promise((resolve) => {
        const onReady = () => {
          global.removeEventListener(EVENT_NAME, onReady);
          resolve(global.Chart);
        };
        global.addEventListener(EVENT_NAME, onReady);
      });
    }
    return;
  }

  // Create a Promise that resolves once Chart is loaded
  global.ChartReadyPromise = new Promise((resolve, reject) => {
    function notifyReady() {
      try { global.dispatchEvent(new Event(EVENT_NAME)); } catch (e) { /* old browsers */ }
      resolve(global.Chart);
    }

    function loadScript(src, onload, onerror) {
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.setAttribute(ATTR_LOADER, 'true');
      s.onload = onload;
      s.onerror = onerror;
      document.head.appendChild(s);
      return s;
    }

    // Primary load
    loadScript(CDN_PRIMARY,
      () => {
        // small timeout to ensure Chart global is initialized by the loaded script
        setTimeout(() => {
          if (global.Chart && typeof global.Chart === 'function') {
            notifyReady();
          } else {
            // If Chart is still not defined, try fallback
            console.warn('Chart.js loaded but Chart is not defined. Trying fallback CDN.');
            loadFallback();
          }
        }, 0);
      },
      (err) => {
        console.warn('Failed to load Chart.js from primary CDN:', CDN_PRIMARY, err);
        loadFallback();
      }
    );

    function loadFallback() {
      loadScript(CDN_FALLBACK,
        () => {
          setTimeout(() => {
            if (global.Chart && typeof global.Chart === 'function') {
              notifyReady();
            } else {
              reject(new Error('Chart.js loaded from fallback but Chart is not defined.'));
            }
          }, 0);
        },
        (err) => {
          reject(new Error('Failed to load Chart.js from both primary and fallback CDNs.'));
          console.error('Chart.js fallback load failed:', err);
        }
      );
    }
  });

  // Safety: in case other scripts expect a synchronous global "Chart" immediately,
  // we provide a tiny proxy that throws helpful error messages if used before ready.
  if (!global.Chart) {
    const proxy = new Proxy(function () {}, {
      apply: function () {
        throw new Error('Chart.js not loaded yet. Await window.ChartReadyPromise or listen for the "chartjs:ready" event before creating charts.');
      },
      construct: function () {
        throw new Error('Chart.js not loaded yet. Await window.ChartReadyPromise or listen for the "chartjs:ready" event before constructing Chart instances.');
      },
      get: function () {
        // return undefined for properties so code checking typeof Chart still sees "function"
        return undefined;
      }
    });
    // define as non-enumerable writable so that real Chart replaces it later
    Object.defineProperty(global, 'Chart', {
      configurable: true,
      writable: true,
      value: proxy
    });
  }
})(window);
