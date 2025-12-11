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
                
                <div class="card">
                    <div class="card-body">
                        ${this.invoices.length > 0 ? `
                            <div class="table-responsive">
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th>Invoice #</th>
                                            <th>Client</th>
                                            <th>Date</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${this.invoices.map(invoice => `
                                            <tr>
                                                <td>${invoice.invoice_number || 'N/A'}</td>
                                                <td>${this.getClientName(invoice.client_id)}</td>
                                                <td>${Utils.formatDate(invoice.date)}</td>
                                                <td>${Utils.formatCurrency(invoice.total)}</td>
                                                <td><span class="badge ${invoice.status === 'PAID' ? 'bg-success' : 'bg-warning'}">${invoice.status}</span></td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        ` : `
                            <div class="text-center py-5">
                                <i class="bi bi-receipt display-1 text-muted"></i>
                                <h4 class="mt-3">No Invoices</h4>
                                <button class="btn btn-primary" onclick="app.loadPage('invoice-form')">
                                    Create First Invoice
                                </button>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
    }

    getClientName(clientId) {
        const client = this.app.state.clients.find(c => c.client_id === clientId);
        return client ? client.company_name : 'Unknown';
    }

    getErrorTemplate(error) {
        return `
            <div class="alert alert-danger">
                <h4>Error Loading Invoices</h4>
                <p>${error.message}</p>
            </div>
        `;
    }

    initialize() {
        console.log('Invoices page initialized');
    }
}

window.InvoicesPage = InvoicesPage;
