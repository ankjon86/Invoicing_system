// Main Application Entry Point
class InvoiceApp {
    constructor() {
        this.currentPage = 'dashboard';
        this.state = {
            clients: [],
            invoices: [],
            products: [],
            loading: false
        };
        
        this.init();
    }

    async init() {
        // Check authentication
        if (!isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }

        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize page modules
        this.initPageModules();
        
        // Load initial data
        await this.loadInitialData();
    }

    setupEventListeners() {
        // Handle sidebar toggle on mobile
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('navbar-toggler')) {
                const sidebar = document.querySelector('.sidebar');
                sidebar.classList.toggle('show');
            }
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                const sidebar = document.querySelector('.sidebar');
                const target = e.target;
                
                if (sidebar.classList.contains('show') && 
                    !sidebar.contains(target) && 
                    !target.classList.contains('navbar-toggler')) {
                    sidebar.classList.remove('show');
                }
            }
        });
    }

    initPageModules() {
        // Initialize page modules if they exist
        if (window.DashboardPage) {
            this.dashboardPage = new DashboardPage(this);
        }
        if (window.ClientsPage) {
            this.clientsPage = new ClientsPage(this);
        }
        if (window.InvoicesPage) {
            this.invoicesPage = new InvoicesPage(this);
        }
        if (window.FormsPage) {
            this.formsPage = new FormsPage(this);
        }
    }

    async loadInitialData() {
        try {
            Utils.showLoading(true);
            
            // Load clients and invoices in parallel
            const [clientsResponse, invoicesResponse] = await Promise.all([
                apiService.getClients(),
                apiService.getInvoices()
            ]);

            if (clientsResponse.success) {
                this.state.clients = clientsResponse.data || [];
            }

            if (invoicesResponse.success) {
                this.state.invoices = invoicesResponse.data || [];
            }

            Utils.showLoading(false);
            
        } catch (error) {
            console.error('Error loading initial data:', error);
            Utils.showLoading(false);
        }
    }

    async loadPage(page) {
        try {
            this.currentPage = page;
            
            // Update active nav link
            this.updateActiveNav(page);
            
            // Show loading state
            this.showLoadingState(page);
            
            // Load page content based on module
            let html = '';
            
            if (page === 'dashboard' && this.dashboardPage) {
                html = await this.dashboardPage.render();
            } else if (page === 'clients' && this.clientsPage) {
                html = await this.clientsPage.render();
            } else if (page === 'invoices' && this.invoicesPage) {
                html = await this.invoicesPage.render();
            } else if ((page === 'client-form' || page === 'invoice-form') && this.formsPage) {
                html = await this.formsPage.render(page);
            } else {
                html = this.loadFallbackPage(page);
            }
            
            // Update content
            document.getElementById('content').innerHTML = html;
            
            // Add fade-in animation
            document.getElementById('content').classList.add('fade-in');
            
            // Update URL hash
            window.location.hash = page;
            
            // Initialize page-specific scripts
            this.initializePageScripts(page);
            
        } catch (error) {
            console.error(`Error loading page ${page}:`, error);
            this.showErrorPage(error);
        }
    }

    updateActiveNav(page) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('onclick')?.includes(page)) {
                link.classList.add('active');
            }
        });
    }

    showLoadingState(page) {
        document.getElementById('content').innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading ${page.replace('-', ' ')}...</p>
            </div>
        `;
    }

    loadFallbackPage(page) {
        switch(page) {
            case 'products':
                return `
                    <div class="container-fluid">
                        <div class="d-flex justify-content-between align-items-center mb-4">
                            <h2>Products</h2>
                        </div>
                        <div class="alert alert-info">
                            Products page coming soon!
                        </div>
                    </div>
                `;
            case 'reports':
                return `
                    <div class="container-fluid">
                        <div class="d-flex justify-content-between align-items-center mb-4">
                            <h2>Reports</h2>
                        </div>
                        <div class="alert alert-info">
                            Reports page coming soon!
                        </div>
                    </div>
                `;
            default:
                return this.loadNotFoundPage();
        }
    }

    loadNotFoundPage() {
        return `
            <div class="container-fluid">
                <div class="text-center py-5">
                    <i class="bi bi-exclamation-triangle display-1 text-warning"></i>
                    <h1 class="mt-3">404</h1>
                    <h4 class="text-muted mb-4">Page Not Found</h4>
                    <p>The page you're looking for doesn't exist or has been moved.</p>
                    <button class="btn btn-primary" onclick="app.loadPage('dashboard')">
                        <i class="bi bi-house me-2"></i>Return to Dashboard
                    </button>
                </div>
            </div>
        `;
    }

    initializePageScripts(page) {
        // Initialize page-specific scripts after content loads
        setTimeout(() => {
            if (page === 'dashboard' && this.dashboardPage && this.dashboardPage.initialize) {
                this.dashboardPage.initialize();
            } else if (page === 'clients' && this.clientsPage && this.clientsPage.initialize) {
                this.clientsPage.initialize();
            }
        }, 100);
    }

    showErrorPage(error) {
        document.getElementById('content').innerHTML = `
            <div class="alert alert-danger">
                <h4>Error Loading Page</h4>
                <p>${error.message}</p>
                <button class="btn btn-primary" onclick="app.loadPage('dashboard')">
                    Return to Dashboard
                </button>
            </div>
        `;
    }

    // System functions
    async initializeSystem() {
        if (!confirm('This will initialize the system and create required database sheets. Continue?')) {
            return;
        }

        try {
            Utils.showLoading(true);
            const response = await apiService.initializeSystem();
            
            if (response.success) {
                Utils.showNotification('System initialized successfully!', 'success');
                this.loadPage('dashboard');
            } else {
                throw new Error(response.error || 'Failed to initialize system');
            }
            
        } catch (error) {
            Utils.showNotification('Error: ' + error.message, 'danger');
        } finally {
            Utils.showLoading(false);
        }
    }

    async refreshDashboard() {
        // Clear cache and reload dashboard
        apiService.clearCache();
        this.loadPage('dashboard');
    }

    async exportData() {
        try {
            Utils.showLoading(true);
            const [clientsResponse, invoicesResponse] = await Promise.all([
                apiService.getClients(),
                apiService.getInvoices()
            ]);

            const clients = clientsResponse.success ? clientsResponse.data : [];
            const invoices = invoicesResponse.success ? invoicesResponse.data : [];

            // Export clients
            Utils.downloadCSV(clients, 'clients');
            
            // Export invoices
            setTimeout(() => {
                Utils.downloadCSV(invoices, 'invoices');
            }, 1000);
            
        } catch (error) {
            Utils.showNotification('Error exporting data: ' + error.message, 'danger');
        } finally {
            Utils.showLoading(false);
        }
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.app = new InvoiceApp();
    window.loadPage = (page) => window.app.loadPage(page);
});
