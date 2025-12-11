// Lightweight app stub + queue to avoid "app is undefined" on early clicks.
// It queues calls to app.loadPage(page) until the real app is ready.
// The real app should call window.__flushAppQueue(appInstance) once initialized.

(function() {
    if (window.app && window.app.loadPage) {
        // real app already there
        return;
    }

    // simple queue
    window.__appCallQueue = window.__appCallQueue || [];

    // minimal stub app exposing loadPage so onclick handlers don't throw
    window.app = window.app || {
        loadPage: function(page) {
            // queue the call to replay later
            window.__appCallQueue.push({ method: 'loadPage', args: [page] });
            console.warn('[app-stub] queued loadPage(', page, ')');
            // also update hash so loader/real app can pick it up
            try { window.location.hash = page; } catch (e) {}
        },
        initializeSystem: function() {
            window.__appCallQueue.push({ method: 'initializeSystem', args: [] });
            console.warn('[app-stub] queued initializeSystem()');
        },
        refreshDashboard: function() {
            window.__appCallQueue.push({ method: 'refreshDashboard', args: [] });
            console.warn('[app-stub] queued refreshDashboard()');
        }
    };

    // helper for real app to flush queued calls
    window.__flushAppQueue = function(appInstance) {
        if (!window.__appCallQueue || !Array.isArray(window.__appCallQueue)) return;
        while (window.__appCallQueue.length) {
            const entry = window.__appCallQueue.shift();
            try {
                if (entry.method && typeof appInstance[entry.method] === 'function') {
                    appInstance[entry.method].apply(appInstance, entry.args || []);
                    console.info('[app-stub] replayed', entry.method, entry.args || []);
                } else {
                    // If not a method on appInstance, try global function fallback
                    if (entry.method === 'loadPage' && typeof window.loadPage === 'function') {
                        window.loadPage.apply(null, entry.args || []);
                    } else {
                        console.warn('[app-stub] cannot replay', entry);
                    }
                }
            } catch (e) {
                console.error('[app-stub] error replaying queued call', entry, e);
            }
        }
    };
})();
