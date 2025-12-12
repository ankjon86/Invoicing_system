[file name]: invoices.js
[file content begin]
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
                                    <tbody>
                                        ${this.invoices.map(invoice => `
                                            <tr>
                                                <td><strong>${invoice.invoice_number || 'N/A'}</strong></td>
                                                <td>${this.getClientName(invoice.client_id)}</td>
                                                <td>${Utils.formatDate(invoice.date)}</td>
                                                <td>${Utils.formatDate(invoice.due_date)}</td>
                                                <td>${Utils.formatCurrency(invoice.total)}</td>
                                                <td>
                                                    <span class="badge ${this.getStatusBadgeClass(invoice)}">
                                                        ${invoice.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div class="btn-group btn-group-sm">
                                                        <button class="btn btn-outline-primary" 
                                                                onclick="invoicesPage.viewInvoice('${invoice.invoice_id}')"
                                                                title="View Invoice">
                                                            <i class="bi bi-eye"></i>
                                                        </button>
                                                        <button class="btn btn-outline-secondary" 
                                                                onclick="invoicesPage.editInvoice('${invoice.invoice_id}')"
                                                                title="Edit Invoice">
                                                            <i class="bi bi-pencil"></i>
                                                        </button>
                                                        <button class="btn btn-outline-success" 
                                                                onclick="invoicesPage.sendInvoice('${invoice.invoice_id}')"
                                                                title="Send Invoice">
                                                            <i class="bi bi-send"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        ` : `
                            <div class="text-center py-5">
                                <i class="bi bi-receipt display-1 text-muted"></i>
                                <h4 class="mt-3">No Invoices</h4>
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

    getClientName(clientId) {
        const client = this.app.state.clients.find(c => c.client_id === clientId);
        return client ? client.company_name : 'Unknown Client';
    }

    getStatusBadgeClass(invoice) {
        const dueDate = new Date(invoice.due_date);
        const isOverdue = dueDate < new Date() && invoice.status !== 'PAID';
        
        if (invoice.status === 'PAID') {
            return 'bg-success';
        } else if (isOverdue) {
            return 'bg-danger';
        } else if (invoice.status === 'SENT') {
            return 'bg-info';
        } else if (invoice.status === 'PENDING') {
            return 'bg-warning';
        } else {
            return 'bg-secondary';
        }
    }

    async viewInvoice(invoiceId) {
        try {
            const response = await apiService.getInvoice(invoiceId);
            if (response.success) {
                this.showInvoiceModal(response.data);
            } else {
                Utils.showNotification('Error loading invoice details', 'danger');
            }
        } catch (error) {
            console.error('Error viewing invoice:', error);
            Utils.showNotification('Error loading invoice details', 'danger');
        }
    }

    async editInvoice(invoiceId) {
        // For now, just show a notification
        // In a real app, you would load the edit form
        Utils.showNotification('Edit invoice feature coming soon!', 'info');
        
        // Example of how you might implement it:
        // app.loadPage(`invoice-edit?id=${invoiceId}`);
    }

    async sendInvoice(invoiceId) {
        if (confirm('Send this invoice to the client now?')) {
            try {
                Utils.showLoading(true);
                const response = await apiService.sendInvoice(invoiceId);
                
                if (response.success) {
                    Utils.showNotification('Invoice sent successfully!', 'success');
                    // Refresh the invoices list
                    this.app.loadPage('invoices');
                } else {
                    throw new Error(response.error || 'Failed to send invoice');
                }
            } catch (error) {
                console.error('Error sending invoice:', error);
                Utils.showNotification('Error: ' + error.message, 'danger');
            } finally {
                Utils.showLoading(false);
            }
        }
    }

    showInvoiceModal(invoice) {
        const client = this.app.state.clients.find(c => c.client_id === invoice.client_id);
        
        const modalHtml = `
            <div class="modal fade" id="invoiceModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Invoice ${invoice.invoice_number}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row mb-4">
                                <div class="col-md-6">
                                    <h6>Invoice Details</h6>
                                    <p><strong>Status:</strong> 
                                        <span class="badge ${this.getStatusBadgeClass(invoice)}">
                                            ${invoice.status}
                                        </span>
                                    </p>
                                    <p><strong>Date:</strong> ${Utils.formatDate(invoice.date)}</p>
                                    <p><strong>Due Date:</strong> ${Utils.formatDate(invoice.due_date)}</p>
                                    <p><strong>Invoice ID:</strong> <code>${invoice.invoice_id}</code></p>
                                </div>
                                <div class="col-md-6">
                                    <h6>Client Information</h6>
                                    ${client ? `
                                        <p><strong>Company:</strong> ${client.company_name}</p>
                                        <p><strong>Contact:</strong> ${client.contact_person}</p>
                                        <p><strong>Email:</strong> ${client.email}</p>
                                        <p><strong>Phone:</strong> ${client.phone || 'N/A'}</p>
                                    ` : '<p class="text-muted">Client information not available</p>'}
                                </div>
                            </div>
                            
                            <!-- Financial Summary -->
                            <div class="row mb-4">
                                <div class="col-md-8 offset-md-2">
                                    <div class="card bg-light">
                                        <div class="card-body">
                                            <div class="d-flex justify-content-between mb-2">
                                                <span class="fw-semibold">Subtotal:</span>
                                                <span>${Utils.formatCurrency(invoice.subtotal || 0)}</span>
                                            </div>
                                            <div class="d-flex justify-content-between mb-2">
                                                <span class="fw-semibold">Tax:</span>
                                                <span>${Utils.formatCurrency(invoice.tax || 0)}</span>
                                            </div>
                                            <hr>
                                            <div class="d-flex justify-content-between fw-bold fs-5">
                                                <span>Total Amount:</span>
                                                <span class="text-primary">${Utils.formatCurrency(invoice.total || 0)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Invoice Items -->
                            ${invoice.items && invoice.items.length > 0 ? `
                                <h6>Invoice Items</h6>
                                <div class="table-responsive">
                                    <table class="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>Description</th>
                                                <th>Quantity</th>
                                                <th>Unit Price</th>
                                                <th>Tax Rate</th>
                                                <th>Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${invoice.items.map(item => {
                                                const amount = (item.quantity || 1) * (item.unit_price || 0);
                                                const tax = amount * ((item.tax_rate || 0) / 100);
                                                return `
                                                    <tr>
                                                        <td>${item.description}</td>
                                                        <td>${item.quantity || 1}</td>
                                                        <td>${Utils.formatCurrency(item.unit_price || 0)}</td>
                                                        <td>${item.tax_rate || 0}%</td>
                                                        <td>${Utils.formatCurrency(amount)}</td>
                                                    </tr>
                                                `;
                                            }).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            ` : '<p class="text-muted">No items found for this invoice</p>'}
                            
                            ${invoice.notes ? `
                                <hr>
                                <h6>Notes</h6>
                                <div class="bg-light p-3 rounded">
                                    ${invoice.notes}
                                </div>
                            ` : ''}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-primary" onclick="invoicesPage.editInvoice('${invoice.invoice_id}')">
                                <i class="bi bi-pencil me-1"></i>Edit Invoice
                            </button>
                            <button type="button" class="btn btn-success" onclick="invoicesPage.sendInvoice('${invoice.invoice_id}')">
                                <i class="bi bi-send me-1"></i>Send Invoice
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to DOM
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHtml;
        document.body.appendChild(modalContainer);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('invoiceModal'));
        modal.show();
        
        // Remove modal from DOM after it's hidden
        document.getElementById('invoiceModal').addEventListener('hidden.bs.modal', function () {
            modalContainer.remove();
        });
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

window.InvoicesPage = InvoicesPage;
[file content end]
