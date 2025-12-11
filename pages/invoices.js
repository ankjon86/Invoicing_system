// Invoices Page Module
class InvoicesPage {
    constructor(app) {
        this.app = app;
        this.invoices = [];
    }

    async render() {
        try {
            const response = await apiService.getInvoices();
            this.invoices = response.success ? response.data : [];
            
            return this.getTemplate();
            
        } catch (error) {
            console.error('Error loading invoices:', error);
            return this.getErrorTemplate(error);
        }
    }

    getTemplate() {
        return `
            <div class="container-fluid">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2>Invoices</h2>
                    <div>
                        <button class="btn btn-primary" onclick="app.loadPage('invoice-form')">
                            <i class="bi bi-plus-circle me-1"></i> Create Invoice
                        </button>
                    </div>
                </div>
                
                <!-- Invoice Stats -->
                <div class="row mb-4">
                    ${this.renderInvoiceStats()}
                </div>
                
                <!-- Invoices Table -->
                <div class="card">
                    <div class="card-body">
                        ${this.invoices.length > 0 ? `
                            <div class="table-responsive">
                                <table class="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Invoice #</th>
                                            <th>Client</th>
                                            <th>Date</th>
                                            <th>Due Date</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody id="invoicesTableBody">
                                        ${this.renderInvoicesTable()}
                                    </tbody>
                                </table>
                            </div>
                        ` : `
                            <div class="text-center py-5">
                                <i class="bi bi-receipt display-1 text-muted"></i>
                                <h4 class="mt-3">No Invoices Found</h4>
                                <p class="text-muted mb-4">Create your first invoice to get started</p>
                                <button class="btn btn-primary" onclick="app.loadPage('invoice-form')">
                                    <i class="bi bi-plus-circle me-2"></i>Create First Invoice
                                </button>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
    }

    renderInvoiceStats() {
        const total = this.invoices.length;
        const paid = this.invoices.filter(i => i.status === 'PAID').length;
        const pending = this.invoices.filter(i => i.status === 'PENDING').length;
        const overdue = this.invoices.filter(i => {
            return new Date(i.due_date) < new Date() && i.status !== 'PAID';
        }).length;
        
        const totalAmount = this.invoices
            .filter(i => i.status === 'PAID')
            .reduce((sum, i) => sum + (parseFloat(i.total) || 0), 0);
        
        return `
            <div class="col-md-3 col-sm-6 mb-3">
                <div class="card stats-card border-primary">
                    <div class="card-body text-center">
                        <i class="bi bi-receipt text-primary mb-2" style="font-size: 2rem;"></i>
                        <h6 class="text-muted">Total Invoices</h6>
                        <h3 class="mt-2">${total}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-3 col-sm-6 mb-3">
                <div class="card stats-card border-success">
                    <div class="card-body text-center">
                        <i class="bi bi-check-circle text-success mb-2" style="font-size: 2rem;"></i>
                        <h6 class="text-muted">Paid</h6>
                        <h3 class="mt-2">${paid}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-3 col-sm-6 mb-3">
                <div class="card stats-card border-warning">
                    <div class="card-body text-center">
                        <i class="bi bi-clock text-warning mb-2" style="font-size: 2rem;"></i>
                        <h6 class="text-muted">Pending</h6>
                        <h3 class="mt-2">${pending}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-3 col-sm-6 mb-3">
                <div class="card stats-card border-danger">
                    <div class="card-body text-center">
                        <i class="bi bi-exclamation-triangle text-danger mb-2" style="font-size: 2rem;"></i>
                        <h6 class="text-muted">Overdue</h6>
                        <h3 class="mt-2">${overdue}</h3>
                    </div>
                </div>
            </div>
        `;
    }

    renderInvoicesTable() {
        return this.invoices.map(invoice => {
            const dueDate = new Date(invoice.due_date);
            const isOverdue = dueDate < new Date() && invoice.status !== 'PAID';
            const client = this.app.state.clients.find(c => c.client_id === invoice.client_id);
            
            return `
                <tr>
                    <td>
                        <strong>${invoice.invoice_number || 'N/A'}</strong>
                        ${isOverdue ? '<span class="badge bg-danger ms-2">OVERDUE</span>' : ''}
                    </td>
                    <td>${client ? client.company_name : 'Unknown Client'}</td>
                    <td>${Utils.formatDate(invoice.date)}</td>
                    <td>${Utils.formatDate(invoice.due_date)}</td>
                    <td><strong>${Utils.formatCurrency(invoice.total || 0)}</strong></td>
                    <td>
                        <span class="badge ${invoice.status === 'PAID' ? 'bg-success' : 'bg-warning'}">
                            ${invoice.status || 'PENDING'}
                        </span>
                    </td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" onclick="invoicesPage.viewInvoice('${invoice.invoice_id}')">
                                <i class="bi bi-eye"></i>
                            </button>
                            <button class="btn btn-outline-success" onclick="invoicesPage.sendInvoice('${invoice.invoice_id}')">
                                <i class="bi bi-envelope"></i>
                            </button>
                            <button class="btn btn-outline-info" onclick="invoicesPage.downloadInvoice('${invoice.invoice_id}')">
                                <i class="bi bi-download"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    async viewInvoice(invoiceId) {
        Utils.showNotification('View invoice feature coming soon!', 'info');
    }

    async sendInvoice(invoiceId) {
        try {
            Utils.showLoading(true);
            const response = await apiService.sendInvoice(invoiceId);
            
            if (response.success) {
                Utils.showNotification('Invoice sent successfully!', 'success');
            } else {
                throw new Error(response.error || 'Failed to send invoice');
            }
            
        } catch (error) {
            Utils.showNotification('Error: ' + error.message, 'danger');
        } finally {
            Utils.showLoading(false);
        }
    }

    async downloadInvoice(invoiceId) {
        try {
            Utils.showLoading(true);
            const response = await apiService.downloadInvoicePDF(invoiceId);
            
            if (response.success) {
                // Open PDF in new tab
                window.open(response.data.url, '_blank');
                Utils.showNotification('Invoice downloaded!', 'success');
            } else {
                throw new Error(response.error || 'Failed to download invoice');
            }
            
        } catch (error) {
            Utils.showNotification('Error: ' + error.message, 'danger');
        } finally {
            Utils.showLoading(false);
        }
    }

    getErrorTemplate(error) {
        return `
            <div class="alert alert-danger">
                <h4>Error Loading Invoices</h4>
                <p>${error.message}</p>
                <button class="btn btn-primary" onclick="app.loadPage('invoices')">
                    Retry
                </button>
            </div>
        `;
    }

    initialize() {
        // Store reference to this instance for event handlers
        window.invoicesPage = this;
        console.log('Invoices page initialized');
    }
}

// Export the class
window.InvoicesPage = InvoicesPage;
