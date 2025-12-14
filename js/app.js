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
        
        this.refreshInterval = null;
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
        
        // Start auto-refresh
        this.startAutoRefresh();

        // Load initial page from hash or default
        const hash = window.location.hash.replace('#', '') || 'dashboard';
        this.loadPage(hash);
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

        window.addEventListener('hashchange', () => {
            const page = window.location.hash.replace('#','') || 'dashboard';
            this.loadPage(page);
        });
    }

    initPageModules() {
        // Page classes are loaded via scripts in index.html
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
        if (window.BillingPage) {
            this.billingPage = new BillingPage(this);
        }
        if (window.ReceiptsPage) {
            this.receiptsPage = new ReceiptsPage(this);
        }
        if (window.ProductsPage) {
            this.productsPage = new ProductsPage(this);
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

            if (clientsResponse && clientsResponse.success) {
                this.state.clients = clientsResponse.data || [];
            }

            if (invoicesResponse && invoicesResponse.success) {
                this.state.invoices = invoicesResponse.data || [];
            }

            Utils.showLoading(false);
            
        } catch (error) {
            console.error('Error loading initial data:', error);
            Utils.showLoading(false);
        }
    }

    startAutoRefresh() {
        // Refresh every 60 seconds
        this.refreshInterval = setInterval(() => {
            this.backgroundRefresh();
        }, 60000); // 60 seconds
    }

    async backgroundRefresh() {
        try {
            // Refresh data based on current page
            switch(this.currentPage) {
                case 'dashboard':
                    await this.refreshDashboardData();
                    break;
                case 'clients':
                    await this.refreshClientsData();
                    break;
                case 'invoices':
                    await this.refreshInvoicesData();
                    break;
                case 'billing':
                    await this.refreshBillingData();
                    break;
                case 'receipts':
                    await this.refreshReceiptsData();
                    break;
                case 'products':
                    await this.refreshProductsData();
                    break;
            }
            
            // Show refresh indicator
            this.showRefreshIndicator();
            
        } catch (error) {
            console.log('Background refresh failed:', error);
        }
    }

    async refreshDashboardData() {
        const [statsResponse, recentClientsResponse, recentInvoicesResponse] = await Promise.all([
            apiService.getDashboardStats(),
            apiService.getClients({ limit: 5 }),
            apiService.getInvoices({ limit: 5, sort: 'newest' })
        ]);

        if (statsResponse && statsResponse.success && this.dashboardPage) {
            this.dashboardPage.stats = statsResponse.data || {};
        }
        
        if (recentClientsResponse && recentClientsResponse.success && this.dashboardPage) {
            this.dashboardPage.recentClients = recentClientsResponse.data || [];
        }
        
        if (recentInvoicesResponse && recentInvoicesResponse.success && this.dashboardPage) {
            this.dashboardPage.recentInvoices = recentInvoicesResponse.data || [];
        }
    }

    async refreshClientsData() {
        const response = await apiService.getClients();
        if (response && response.success && this.clientsPage) {
            this.clientsPage.clients = response.data || [];
            this.clientsPage.filteredClients = [...this.clientsPage.clients];
            this.clientsPage.updateTable();
        }
    }

    async refreshInvoicesData() {
        const response = await apiService.getInvoices();
        if (response && response.success && this.invoicesPage) {
            this.invoicesPage.invoices = response.data || [];
            // Re-render if on invoices page
            if (this.currentPage === 'invoices') {
                const content = document.getElementById('content');
                if (content) {
                    content.innerHTML = await this.invoicesPage.render();
                    this.invoicesPage.initialize();
                }
            }
        }
    }

    async refreshBillingData() {
        const [contractsResponse, schedulesResponse, upcomingResponse] = await Promise.all([
            apiService.getContracts(),
            apiService.getBillingSchedules(),
            apiService.getUpcomingInvoices({ days: 30 })
        ]);

        if (this.billingPage) {
            if (contractsResponse && contractsResponse.success) {
                this.billingPage.contracts = contractsResponse.data || [];
            }
            if (schedulesResponse && schedulesResponse.success) {
                this.billingPage.schedules = schedulesResponse.data || [];
            }
            if (upcomingResponse && upcomingResponse.success) {
                this.billingPage.upcomingInvoices = upcomingResponse.data || [];
            }
        }
    }

    async refreshReceiptsData() {
        const response = await apiService.getReceipts();
        if (response && response.success && this.receiptsPage) {
            this.receiptsPage.receipts = response.data || [];
            if (this.currentPage === 'receipts') {
                const content = document.getElementById('content');
                if (content) {
                    content.innerHTML = await this.receiptsPage.render();
                    this.receiptsPage.initialize();
                }
            }
        }
    }

    async refreshProductsData() {
        const response = await apiService.getProducts();
        if (response && response.success && this.productsPage) {
            this.productsPage.products = response.data || [];
            if (this.currentPage === 'products') {
                const content = document.getElementById('content');
                if (content) {
                    content.innerHTML = await this.productsPage.render();
                    this.productsPage.initialize();
                }
            }
        }
    }

    showRefreshIndicator() {
        const indicator = document.getElementById('refreshIndicator');
        if (indicator) {
            indicator.style.display = 'block';
            setTimeout(() => {
                indicator.style.display = 'none';
            }, 2000);
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
            } else if (page === 'billing' && this.billingPage) {
                html = await this.billingPage.render();
            } else if (page === 'products' && this.productsPage) {
                html = await this.productsPage.render();
            } else if ((page === 'client-form' || page === 'invoice-form' || page === 'receipt-form') && this.formsPage) {
                html = await this.formsPage.render(page);
            } else if (page === 'receipts' && this.receiptsPage) {
                html = await this.receiptsPage.render();
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
            } else if (page === 'invoices' && this.invoicesPage && this.invoicesPage.initialize) {
                this.invoicesPage.initialize();
            } else if (page === 'billing' && this.billingPage && this.billingPage.initialize) {
                this.billingPage.initialize();
            } else if (page === 'products' && this.productsPage && this.productsPage.initialize) {
                this.productsPage.initialize();
            } else if ((page === 'client-form' || page === 'invoice-form' || page === 'receipt-form') && this.formsPage && this.formsPage.initialize) {
                this.formsPage.initialize();
            } else if (page === 'receipts' && this.receiptsPage && this.receiptsPage.initialize) {
                this.receiptsPage.initialize();
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

    // System functions - keep exportData
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

// Initialize the app when the page loads and flush any queued calls from app-stub
document.addEventListener('DOMContentLoaded', () => {
    if (!window.app || window.app === undefined || !window.app.loadPage) {
        window.app = new InvoiceApp();
        window.loadPage = (page) => window.app.loadPage(page);
    }
    // Flush queued early calls from app-stub (if any)
    if (typeof window.__flushAppQueue === 'function') {
        try { window.__flushAppQueue(window.app); } catch (e) { console.error(e); }
    }
});

// Make app globally available
window.InvoiceApp = InvoiceApp;
