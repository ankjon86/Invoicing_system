(function() {
    // Ordered list of scripts to load (relative to repository root)
    const scripts = [
        'js/utils.js',
        'js/auth.js',
        'js/api.js',
        'js/pages/dashboard.js',
        'js/pages/clients.js',
        'js/pages/invoices.js',
        'js/pages/billing.js',
        'js/pages/forms.js',
        'js/app.js'
    ];

    // Compute base path where index.html is served.
    // If index is at /Repo/ or /Repo/index.html, base becomes '/Repo'
    function computeBase() {
        const path = window.location.pathname; // e.g. /Repo/, /Repo/index.html, /
        // If path ends with a slash, remove trailing slash(es)
        if (path.endsWith('/')) {
            return path.replace(/\/+$/, '');
        }
        // If path ends with a filename (index.html), strip filename
        const lastSegment = path.split('/').pop();
        if (lastSegment.includes('.')) {
            return path.replace(/\/[^\/]*$/, '');
        }
        return path;
    }

    const base = computeBase();

    function normalize(p) {
        if (!p) return p;
        // If p is absolute URL, return as-is
        if (/^(https?:)?\/\//.test(p)) return p;
        // Build normalized path: base + '/' + p (avoid duplicate slashes)
        const prefix = (base === '' || base === '/') ? '' : base;
        const joined = prefix + (p.startsWith('/') ? p : '/' + p);
        // Collapse consecutive slashes
        return joined.replace(/\/+/g, '/');
    }

    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = normalize(src);
            // preserve execution order
            s.async = false;
            s.onload = function() { resolve({ src: s.src }); };
            s.onerror = function() { reject(new Error('Failed to load script: ' + s.src)); };
            document.head.appendChild(s);
        });
    }

    async function loadAll() {
        for (const script of scripts) {
            try {
                const res = await loadScript(script);
                console.info('Loaded', res.src);
            } catch (err) {
                console.error(err);
                // Notify user visually (but keep it unobtrusive)
                try {
                    const msg = document.createElement('div');
                    msg.style.cssText = 'position:fixed;left:20px;bottom:20px;z-index:9999;padding:10px 14px;background:#fff3cd;color:#856404;border:1px solid #ffeeba;border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.08);';
                    msg.textContent = 'Error loading application scripts. Check console for details.';
                    document.body.appendChild(msg);
                } catch (e) {
                    // ignore UI errors
                }
                // Stop loading further scripts to avoid cascading failures
                break;
            }
        }
    }

    // Start loading as soon as safe
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadAll);
    } else {
        loadAll();
    }
})();
