
        // Initialize when everything is loaded
        window.addEventListener('DOMContentLoaded', function() {
            // Set demo user email
            localStorage.setItem('userEmail', 'demo@example.com');
            const userEmailEl = document.getElementById('userEmail');
            if (userEmailEl) userEmailEl.textContent = 'demo@example.com';
            
            // Initialize app
            setTimeout(function() {
                if (typeof InvoiceApp !== 'undefined') {
                    window.app = new InvoiceApp();
                    window.loadPage = (page) => window.app.loadPage(page);
                    
                    // Load page from hash
                    const hash = window.location.hash.substring(1);
                    window.app.loadPage(hash || 'dashboard');
                } else {
                    console.error('App not loaded. Check console for errors.');
                }
            }, 100);
        });
        
        // Handle hash changes
        window.addEventListener('hashchange', function() {
            const page = window.location.hash.substring(1);
            if (page && window.app) {
                window.app.loadPage(page);
            }
        });
        
        function logout() {
            localStorage.clear();
            window.location.reload();
        }
        
        function initializeSystem() {
            if (window.app && window.app.initializeSystem) {
                window.app.initializeSystem();
            }
        }
