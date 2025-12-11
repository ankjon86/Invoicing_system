mkdir -p js/pages

# If loader doesn't exist, create it
cat > js/loader.js <<'JS'
(function() {
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

    function computeBase() {
        const path = window.location.pathname;
        if (path.endsWith('/')) return path.replace(/\/+$/, '');
        const lastSegment = path.split('/').pop();
        if (lastSegment.includes('.')) return path.replace(/\/[^\/]*$/, '');
        return path;
    }

    const base = computeBase();

    function normalize(p) {
        if (!p) return p;
        if (/^(https?:)?\/\//.test(p)) return p;
        const prefix = (base === '' || base === '/') ? '' : base;
        const joined = prefix + (p.startsWith('/') ? p : '/' + p);
        return joined.replace(/\/+/g, '/');
    }

    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = normalize(src);
            s.async = false;
            s.onload = () => resolve({ src: s.src });
            s.onerror = () => reject(new Error('Failed to load script: ' + s.src));
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
                try {
                    const msg = document.createElement('div');
                    msg.style.cssText = 'position:fixed;left:20px;bottom:20px;z-index:9999;padding:10px 14px;background:#fff3cd;color:#856404;border:1px solid #ffeeba;border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.08);';
                    msg.textContent = 'Error loading application scripts. Check console for details.';
                    document.body.appendChild(msg);
                } catch (e) {}
                break;
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadAll);
    } else {
        loadAll();
    }
})();
JS

git add js/loader.js
