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
            const [statsResponse, recentClientsResponse, recentInvoicesResponse, template] = await Promise.all([
                apiService.getDashboardStats(),
                apiService.getClients({ limit: 5 }),
                apiService.getInvoices({ limit: 5, sort: 'newest' }),
                Utils.loadTemplate('templates/dashboard.html')
            ]);

            this.stats = statsResponse.success ? statsResponse.data : {};
            this.recentClients = recentClientsResponse.success ? recentClientsResponse.data : [];
            this.recentInvoices = recentInvoicesResponse.success ? recentInvoicesResponse.data : [];

            const statsHtml = this.renderStatsCards();
            const recentClientsHtml = this.renderRecentClients();
            const recentInvoicesHtml = this.renderRecentInvoices();

            const html = Utils.renderTemplate(template, {
                'STATS_CARDS': statsHtml,
                'RECENT_CLIENTS': recentClientsHtml,
                'RECENT_INVOICES': recentInvoicesHtml
            });

            return html;
            
        } catch (error) {
            console.error('Error loading dashboard:', error);
            return this.getErrorTemplate(error);
        }
    }

    renderStatsCards() {
        return `
            <div class="col-md-3 col-sm-6 mb-3">
                <div class="card stats-card border-primary">
                    <div class="card-body text-center">
                        <i class="bi bi-people text-primary mb-2" style="font-size: 1.5rem;"></i>
                        <h6 class="text-muted">Active Clients</h6>
                        <h3 class="mt-2">${this.stats.activeClients || 0}</h3>
                    </div>
                </div>
            </div>
            
            <div class="col-md-3 col-sm-6 mb-3">
                <div class="card stats-card border-success">
                    <div class="card-body text-center">
                        <i class="bi bi-currency-dollar text-success mb-2" style="font-size: 1.5rem;"></i>
                        <h6 class="text-muted">Total Revenue</h6>
                        <h3 class="mt-2">${Utils.formatCurrency(this.stats.totalRevenue || 0)}</h3>
                    </div>
                </div>
            </div>
            
            <div class="col-md-3 col-sm-6 mb-3">
                <div class="card stats-card border-warning">
                    <div class="card-body text-center">
                        <i class="bi bi-clock text-warning mb-2" style="font-size: 1.5rem;"></i>
                        <h6 class="text-muted">Pending Invoices</h6>
                        <h3 class="mt-2">${this.stats.pendingInvoices || 0}</h3>
                    </div>
                </div>
            </div>
            
            <div class="col-md-3 col-sm-6 mb-3">
                <div class="card stats-card border-info">
                    <div class="card-body text-center">
                        <i class="bi bi-receipt text-info mb-2" style="font-size: 1.5rem;"></i>
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
