// Invoices Page Module (updated to render invoice via external HTML template and include status badge)
class InvoicesPage {
    constructor(app) {
        this.app = app;
        this.invoices = [];
    }

    async render() {
        try {
            const [response, template] = await Promise.all([
                apiService.getInvoices(),
                Utils.loadTemplate('templates/invoices.html')
            ]);

            this.invoices = response.success ? response.data : [];

            const contentHtml = this.invoices.length > 0 ? this.buildInvoicesTable() : this.buildEmptyState();

            return Utils.renderTemplate(template, {
                'INVOICES_CONTENT': contentHtml
            });
        } catch (error) {
            console.error('Error loading invoices:', error);
            return this.getErrorTemplate(error);
        }
    }

    buildInvoicesTable() {
        return `
            <div class="card">
                <div class="card-body">
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
                                            <span class="badge ${invoice.status === 'PAID' ? 'bg-success' : 'bg-warning text-dark'}">
                                                ${invoice.status || 'UNPAID'}
                                            </span>
                                            ${this.isOverdue(invoice) ? '<br><small class="text-danger">Overdue</small>' : ''}
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
                                                        onclick="invoicesPage.markAsPaid('${invoice.invoice_id}')"
                                                        title="Mark as Paid"
                                                        ${invoice.status === 'PAID' ? 'disabled' : ''}>
                                                    <i class="bi bi-check-circle"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    buildEmptyState() {
        return `
            <div class="text-center py-5">
                <i class="bi bi-receipt display-1 text-muted"></i>
                <h4 class="mt-3">No Invoices</h4>
                <p class="text-muted mb-4">Create your first invoice to get started</p>
                <button class="btn btn-primary" onclick="app.loadPage('invoice-form')">
                    <i class="bi bi-plus-circle me-2"></i>Create First Invoice
                </button>
            </div>
        `;
    }

    getClientName(clientId) {
        const client = this.app.state.clients.find(c => c.client_id === clientId);
        return client ? client.company_name : 'Unknown Client';
    }

    isOverdue(invoice) {
        if (invoice.status === 'PAID') return false;
        const dueDate = new Date(invoice.due_date);
        const today = new Date();
        return dueDate < today;
    }

    async viewInvoice(invoiceId) {
        try {
            const response = await apiService.getInvoice(invoiceId);
            if (response.success) {
                await this.showInvoiceModal(response.data);
            } else {
                Utils.showNotification('Error loading invoice details', 'danger');
            }
        } catch (error) {
            console.error('Error viewing invoice:', error);
            Utils.showNotification('Error loading invoice details', 'danger');
        }
    }

    editInvoice(invoiceId) {
        Utils.showNotification('Edit invoice feature coming soon!', 'info');
    }

    async markAsPaid(invoiceId) {
        if (confirm('Mark this invoice as PAID? This action cannot be undone.')) {
            try {
                Utils.showLoading(true);
                const invoiceResponse = await apiService.getInvoice(invoiceId);
                if (!invoiceResponse.success) {
                    throw new Error('Invoice not found');
                }
                
                const updateResponse = await apiService.updateInvoiceStatus({
                    invoice_id: invoiceId,
                    status: 'PAID'
                });
                
                if (updateResponse.success) {
                    Utils.showNotification('Invoice marked as PAID successfully!', 'success');
                    this.app.loadPage('invoices');
                } else {
                    throw new Error(updateResponse.error || 'Failed to update invoice status');
                }
            } catch (error) {
                console.error('Error marking invoice as paid:', error);
                Utils.showNotification('Error: ' + error.message, 'danger');
            } finally {
                Utils.showLoading(false);
            }
        }
    }

    // Render invoice using external HTML template (templates/invoices/invoice-template.html)
    async showInvoiceModal(invoice) {
        try {
            // Attempt to load template
            let template;
            try {
                template = await Utils.loadTemplate('templates/invoices/invoice-template.html');
            } catch (tplErr) {
                console.warn('Invoice template load failed, falling back to inline modal:', tplErr);
                // Fallback to original inline modal
                this.showInvoiceModalInline(invoice);
                return;
            }

            // Prepare client info
            const client = this.app.state.clients.find(c => c.client_id === invoice.client_id) || {};

            // Build item rows HTML expected by the template
            const itemRows = (invoice.items || []).map(item => {
                const qty = item.quantity || 1;
                const unit = parseFloat(item.unit_price) || 0;
                const amount = qty * unit;
                const desc = item.description || '';
                return `
                    <tr>
                      <td>${desc}</td>
                      <td class="text-center">${qty}</td>
                      <td class="text-nowrap">${Utils.formatCurrency(unit || 0)}</td>
                      <td class="text-right">${Utils.formatCurrency(amount)}</td>
                    </tr>
                `;
            }).join('') || `
                <tr>
                  <td colspan="4" class="text-center text-muted">No items</td>
                </tr>
            `;

            // Determine status badge HTML
            const status = (invoice.status || 'UNPAID').toString().toUpperCase();
            const statusBadge = (status === 'PAID')
                ? '<span class="badge bg-success">PAID</span>'
                : (status === 'CANCELLED' ? '<span class="badge bg-secondary">CANCELLED</span>' : '<span class="badge bg-warning text-dark">UNPAID</span>');

            // Prepare placeholder data
            const data = {
                'COMPANY_LOGO': '/assets/logo.png',
                'COMPANY_NAME': 'ACME Billing Solutions',
                'COMPANY_TAGLINE': 'Professional Invoice Management',
                'COMPANY_ADDRESS': 'Your Company Address Here',
                'INVOICE_NUMBER': invoice.invoice_number || '',
                'DATE': Utils.formatDate(invoice.date),
                'DUE_DATE': Utils.formatDate(invoice.due_date),
                'PERIOD': invoice.period || '',
                'CLIENT_NAME': client.company_name || '',
                'CLIENT_CONTACT': client.contact_person || '',
                'CLIENT_EMAIL': client.email || '',
                'CLIENT_ADDRESS': client.address || '',
                'BILLER_NAME': 'ACME Billing Solutions',
                'BILLER_ADDRESS': 'Your Company Address Here',
                'BILLER_EMAIL': 'billing@example.com',
                'ITEM_ROWS': itemRows,
                'SUBTOTAL': Utils.formatCurrency(invoice.subtotal || 0),
                'TAX': Utils.formatCurrency(invoice.tax || 0),
                'TOTAL': Utils.formatCurrency(invoice.total || 0),
                // removed NOTES as requested
                'PAYMENT_TERMS': (client.payment_terms || 30) + ' days',
                'REFERENCE': invoice.invoice_number || '',
                'STATUS_BADGE': statusBadge
            };

            const filled = Utils.renderTemplate(template, data);

            // Show modal with rendered template
            const modalContainer = document.createElement('div');
            modalContainer.innerHTML = `
                <div class="modal fade" id="invoiceTemplateModal" tabindex="-1">
                    <div class="modal-dialog modal-xl modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-body p-0">
                                ${filled}
                            </div>
                            <div class="modal-footer no-print">
                                <button class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                <button class="btn btn-primary" id="printInvoiceBtn">Print / Save PDF</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modalContainer);

            const modalEl = document.getElementById('invoiceTemplateModal');
            const modal = new bootstrap.Modal(modalEl);
            modal.show();

            // Print handler: open new window with invoice HTML and trigger print
            document.getElementById('printInvoiceBtn').addEventListener('click', function () {
                const invoiceHtml = modalEl.querySelector('.invoice-card').outerHTML;
                const printWindow = window.open('', '_blank', 'width=900,height=700');
                printWindow.document.write(`
                    <html>
                      <head>
                        <title>Invoice ${invoice.invoice_number || ''}</title>
                        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet"/>
                        <style>body{font-family: "Segoe UI", Tahoma, Verdana, sans-serif; padding:20px; color:#222;}</style>
                      </head>
                      <body>${invoiceHtml}<script>window.onload=function(){setTimeout(()=>window.print(),300);}</script></body>
                    </html>
                `);
                printWindow.document.close();
            });

            modalEl.addEventListener('hidden.bs.modal', function () {
                modalContainer.remove();
            });

        } catch (error) {
            console.error('Error loading invoice template or rendering modal:', error);
            Utils.showNotification('Error loading invoice view: ' + error.message, 'danger');
            // Fallback to inline modal if anything fails
            this.showInvoiceModalInline(invoice);
        }
    }

    // Original inline modal kept as fallback
    showInvoiceModalInline(invoice) {
        const client = this.app.state.clients.find(c => c.client_id === invoice.client_id);
        const isOverdue = this.isOverdue(invoice);
        
        const modalHtml = `
            <div class="modal fade" id="invoiceModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Invoice ${invoice.invoice_number}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert ${invoice.status === 'PAID' ? 'alert-success' : isOverdue ? 'alert-danger' : 'alert-warning'}">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <i class="bi ${invoice.status === 'PAID' ? 'bi-check-circle' : isOverdue ? 'bi-exclamation-triangle' : 'bi-clock'} me-2"></i>
                                        <strong>${invoice.status === 'PAID' ? 'PAID' : 'UNPAID'}</strong>
                                        ${isOverdue ? ' - <strong>OVERDUE</strong>' : ''}
                                    </div>
                                    ${invoice.status !== 'PAID' ? `
                                        <button class="btn btn-sm btn-success" onclick="invoicesPage.markAsPaid('${invoice.invoice_id}')">
                                            <i class="bi bi-check-circle me-1"></i>Mark as Paid
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                            
                            <div class="row mb-4">
                                <div class="col-md-6">
                                    <h6>Invoice Details</h6>
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
                            
                            <div class="row mb-4">
                                <div class="col-md-8 offset-md-2">
                                    <div class="card ${invoice.status === 'PAID' ? 'border-success' : isOverdue ? 'border-danger' : 'border-warning'}">
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
                                                <span class="${invoice.status === 'PAID' ? 'text-success' : isOverdue ? 'text-danger' : 'text-warning'}">
                                                    ${Utils.formatCurrency(invoice.total || 0)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
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
                            
                            <!-- notes removed in fallback modal too -->
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            ${invoice.status !== 'PAID' ? `
                                <button type="button" class="btn btn-success" onclick="invoicesPage.markAsPaid('${invoice.invoice_id}')">
                                    <i class="bi bi-check-circle me-1"></i>Mark as Paid
                                </button>
                            ` : ''}
                            <button type="button" class="btn btn-primary" onclick="invoicesPage.editInvoice('${invoice.invoice_id}')">
                                <i class="bi bi-pencil me-1"></i>Edit Invoice
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHtml;
        document.body.appendChild(modalContainer);
        
        const modal = new bootstrap.Modal(document.getElementById('invoiceModal'));
        modal.show();
        
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
        window.invoicesPage = this;
        console.log('Invoices page initialized');
    }
}

window.InvoicesPage = InvoicesPage;
