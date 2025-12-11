// Dashboard Page Module
class DashboardPage {
    constructor(app) {
        this.app = app;
        this.stats = {};
        this.recentClients = [];
        this.recentInvoices = [];
    }

    async render() {
        try {
            const [statsResponse, recentClientsResponse, recentInvoicesResponse] = await Promise.all([
                apiService.getDashboardStats(),
                apiService.getClients({ limit: 5 }),
                apiService.getInvoices({ limit: 5, sort: 'newest' })
            ]);

            this.stats = statsResponse.success ? statsResponse.data : {};
            this.recentClients = recentClientsResponse.success ? recentClientsResponse.data : [];
            this.recentInvoices = recentInvoicesResponse.success ? recentInvoicesResponse.data : [];

            return this.getTemplate();
            
        } catch (error) {
            console.error('Error loading dashboard:', error);
            return this.getErrorTemplate(error);
        }
    }

    getTemplate() {
        return `
            <div class="container-fluid">
                <!-- Header -->
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2>Dashboard</h2>
                    <div>
                        <button class="btn btn-outline-primary me-2" onclick="app.refreshDashboard()">
                            <i class="bi bi-arrow-clockwise"></i> Refresh
                        </button>
                        <button class="btn btn-primary" onclick="app.initializeSystem()">
                            <i class="bi bi-gear"></i> Initialize System
                        </button>
                    </div>
                </div>
                
                <!-- Stats Row -->
                <div class="row mb-4">
                    ${this.renderStatsCards()}
                </div>
                
                <!-- Quick Actions -->
                <div class="row mb-4">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">Quick Actions</h5>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-3 col-6 mb-2">
                                        <button class="btn btn-primary w-100" onclick="app.loadPage('client-form')">
                                            <i class="bi bi-person-plus me-2"></i>Add Client
                                        </button>
                                    </div>
                                    <div class="col-md-3 col-6 mb-2">
                                        <button class="btn btn-success w-100" onclick="app.loadPage('invoice-form')">
                                            <i class="bi bi-plus-circle me-2"></i>Create Invoice
                                        </button>
                                    </div>
                                    <div class="col-md-3 col-6 mb-2">
                                        <button class="btn btn-info w-100" onclick="app.loadPage('invoices')">
                                            <i class="bi bi-receipt me-2"></i>View Invoices
                                        </button>
                                    </div>
                                    <div class="col-md-3 col-6 mb-2">
                                        <button class="btn btn-warning w-100" onclick="app.exportData()">
                                            <i class="bi bi-download me-2"></i>Export Data
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Recent Data -->
                <div class="row">
                    <div class="col-md-6 mb-4">
                        <div class="card">
                            <div class="card-header d-flex justify-content-between align-items-center">
                                <h5 class="mb-0">Recent Clients</h5>
                                <a href="#" class="btn btn-sm btn-outline-primary" onclick="app.loadPage('clients')">
                                    View All
                                </a>
                            </div>
                            <div class="card-body">
                                ${this.renderRecentClients()}
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-6 mb-4">
                        <div class="card">
                            <div class="card-header d-flex justify-content-between align-items-center">
                                <h5 class="mb-0">Recent Invoices</h5>
                                <a href="#" class="btn btn-sm btn-outline-primary" onclick="app.loadPage('invoices')">
                                    View All
                                </a>
                            </div>
                            <div class="card-body">
                                ${this.renderRecentInvoices()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderStatsCards() {
        return `
            <div class="col-md-3 col-sm-6 mb-3">
                <div class="card stats-card border-primary">
                    <div class="card-body text-center">
                        <i class="bi bi-people text-primary mb-2" style="font-size: 2.5rem;"></i>
                        <h6 class="text-muted">Active Clients</h6>
                        <h3 class="mt-2">${this.stats.activeClients || 0}</h3>
                    </div>
                </div>
            </div>
            
            <div class="col-md-3 col-sm-6 mb-3">
                <div class="card stats-card border-success">
                    <div class="card-body text-center">
                        <i class="bi bi-currency-dollar text-success mb-2" style="font-size: 2.5rem;"></i>
                        <h6 class="text-muted">Total Revenue</h6>
                        <h3 class="mt-2">${Utils.formatCurrency(this.stats.totalRevenue || 0)}</h3>
                    </div>
                </div>
            </div>
            
            <div class="col-md-3 col-sm-6 mb-3">
                <div class="card stats-card border-warning">
                    <div class="card-body text-center">
                        <i class="bi bi-clock text-warning mb-2" style="font-size: 2.5rem;"></i>
                        <h6 class="text-muted">Pending Invoices</h6>
                        <h3 class="mt-2">${this.stats.pendingInvoices || 0}</h3>
                    </div>
                </div>
            </div>
            
            <div class="col-md-3 col-sm-6 mb-3">
                <div class="card stats-card border-info">
                    <div class="card-body text-center">
                        <i class="bi bi-receipt text-info mb-2" style="font-size: 2.5rem;"></i>
                        <h6 class="text-muted">Total Invoices</h6>
                        <h3 class="mt-2">${this.stats.totalInvoices || 0}</h3>
                    </div>
                </div>
            </div>
        `;
    }

    renderRecentClients() {
        if (!this.recentClients || this.recentClients.length === 0) {
            return `
                <div class="text-center py-3">
                    <i class="bi bi-people display-6 text-muted"></i>
                    <p class="mt-2 text-muted">No clients yet</p>
                </div>
            `;
        }

        const items = this.recentClients.map(client => `
            <div class="list-group-item list-group-item-action border-0 py-3">
                <div class="d-flex w-100 justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1">${client.company_name || 'Unnamed Company'}</h6>
                        <p class="mb-1 text-muted small">
                            <i class="bi bi-person me-1"></i>${client.contact_person || 'No contact'}
                        </p>
                    </div>
                    <span class="badge ${client.status === 'ACTIVE' ? 'bg-success' : 'bg-secondary'}">
                        ${client.status || 'UNKNOWN'}
                    </span>
                </div>
                <small class="text-muted">
                    <i class="bi bi-envelope me-1"></i>${client.email || 'No email'}
                </small>
            </div>
        `).join('');

        return `<div class="list-group list-group-flush">${items}</div>`;
    }

    renderRecentInvoices() {
        if (!this.recentInvoices || this.recentInvoices.length === 0) {
            return `
                <div class="text-center py-3">
                    <i class="bi bi-receipt display-6 text-muted"></i>
                    <p class="mt-2 text-muted">No invoices yet</p>
                </div>
            `;
        }

        const items = this.recentInvoices.map(invoice => {
            const dueDate = new Date(invoice.due_date);
            const isOverdue = dueDate < new Date() && invoice.status !== 'PAID';
            
            return `
                <div class="list-group-item list-group-item-action border-0 py-3">
                    <div class="d-flex w-100 justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-1">${invoice.invoice_number || 'No Number'}</h6>
                            <p class="mb-1 text-muted small">
                                ${Utils.formatCurrency(invoice.total || 0)}
                            </p>
                        </div>
                        <div class="text-end">
                            <span class="badge ${invoice.status === 'PAID' ? 'bg-success' : isOverdue ? 'bg-danger' : 'bg-warning'}">
                                ${invoice.status || 'PENDING'}
                            </span>
                            <div class="mt-1">
                                <small class="text-muted">Due: ${Utils.formatDate(invoice.due_date)}</small>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        return `<div class="list-group list-group-flush">${items}</div>`;
    }

    getErrorTemplate(error) {
        return `
            <div class="alert alert-danger">
                <h4>Error Loading Dashboard</h4>
                <p>${error.message}</p>
                <button class="btn btn-primary" onclick="app.loadPage('dashboard')">
                    Retry
                </button>
            </div>
        `;
    }

    initialize() {
        // Any dashboard-specific initialization
        console.log('Dashboard initialized');
    }
}

// Export the class
window.DashboardPage = DashboardPage;
