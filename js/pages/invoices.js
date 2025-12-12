[file name]: invoices.js
[file content begin]
// Invoices Page Module
class InvoicesPage {
    constructor(app) {
        this.app = app;
        this.invoices = [];
        this.filteredInvoices = [];
    }

    async render() {
        try {
            const response = await apiService.getInvoices();
            this.invoices = response.success ? response.data : [];
            this.filteredInvoices = [...this.invoices];
            
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
                        <button class="btn btn-outline-secondary ms-2" onclick="invoicesPage.exportInvoices()">
                            <i class="bi bi-download me-1"></i> Export
                        </button>
                    </div>
                </div>
                
                <!-- Filters -->
                <div class="card mb-4">
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-md-4">
                                <input type="text" class="form-control" 
                                       placeholder="Search invoices..." 
                                       id="invoiceSearch" 
                                       onkeyup="invoicesPage.filterInvoices()">
                            </div>
                            <div class="col-md-3">
                                <select class="form-select" id="invoiceStatusFilter" onchange="invoicesPage.filterInvoices()">
                                    <option value="">All Status</option>
                                    <option value="DRAFT">Draft</option>
                                    <option value="PENDING">Pending</option>
                                    <option value="SENT">Sent</option>
                                    <option value="PAID">Paid</option>
                                    <option value="OVERDUE">Overdue</option>
                                    <option value="CANCELLED">Cancelled</option>
                                </select>
                            </div>
                            <div class="col-md-3">
                                <select class="form-select" id="invoiceDateFilter" onchange="invoicesPage.filterInvoices()">
                                    <option value="">All Time</option>
                                    <option value="today">Today</option>
                                    <option value="week">This Week</option>
                                    <option value="month">This Month</option>
                                    <option value="quarter">This Quarter</option>
                                    <option value="year">This Year</option>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <select class="form-select" id="invoiceSort" onchange="invoicesPage.filterInvoices()">
                                    <option value="newest">Newest First</option>
                                    <option value="oldest">Oldest First</option>
                                    <option value="dueDate">Due Date</option>
                                    <option value="amountHigh">Amount (High to Low)</option>
                                    <option value="amountLow">Amount (Low to High)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Stats Summary -->
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="card border-primary">
                            <div class="card-body py-2">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 class="text-muted mb-1">Pending</h6>
                                        <h4 class="mb-0">${this.getInvoiceCountByStatus('PENDING')}</h4>
                                    </div>
                                    <div class="bg-primary rounded p-2">
                                        <i class="bi bi-clock text-white"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card border-success">
                            <div class="card-body py-2">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 class="text-muted mb-1">Paid</h6>
                                        <h4 class="mb-0">${this.getInvoiceCountByStatus('PAID')}</h4>
                                    </div>
                                    <div class="bg-success rounded p-2">
                                        <i class="bi bi-check-circle text-white"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card border-danger">
                            <div class="card-body py-2">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 class="text-muted mb-1">Overdue</h6>
                                        <h4 class="mb-0">${this.getOverdueCount()}</h4>
                                    </div>
                                    <div class="bg-danger rounded p-2">
                                        <i class="bi bi-exclamation-triangle text-white"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card border-warning">
                            <div class="card-body py-2">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 class="text-muted mb-1">Total Due</h6>
                                        <h4 class="mb-0">${this.getTotalDue()}</h4>
                                    </div>
                                    <div class="bg-warning rounded p-2">
                                        <i class="bi bi-cash text-white"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Invoices Table -->
                <div class="card">
                    <div class="card-body">
                        ${this.invoices.length > 0 ? `
                            <div class="table-responsive">
                                <table class="table table-hover">
                                    <thead>
                                        <tr>
                                            <th width="100">Invoice #</th>
                                            <th>Client</th>
                                            <th width="100">Date</th>
                                            <th width="100">Due Date</th>
                                            <th width="120">Amount</th>
                                            <th width="100">Status</th>
                                            <th width="150" class="text-end">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody id="invoicesTableBody">
                                        ${this.renderInvoicesTable()}
                                    </tbody>
                                </table>
                            </div>
                            
                            <!-- Pagination -->
                            ${this.renderPagination()}
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

    renderInvoicesTable() {
        return this.filteredInvoices.map(invoice => {
            const client = this.app.state.clients.find(c => c.client_id === invoice.client_id);
            const isOverdue = this.isInvoiceOverdue(invoice);
            const status = isOverdue ? 'OVERDUE' : invoice.status;
            
            return `
                <tr>
                    <td>
                        <strong>${invoice.invoice_number || 'N/A'}</strong>
                        <div class="text-muted small">${invoice.invoice_id.substring(0, 8)}...</div>
                    </td>
                    <td>
                        <div class="fw-semibold">${client ? client.company_name : 'Unknown Client'}</div>
                        <div class="text-muted small">
                            ${client ? client.contact_person : ''}
                            ${client && client.email ? `<br>${client.email}` : ''}
                        </div>
                    </td>
                    <td>
                        ${Utils.formatDate(invoice.date)}
                    </td>
                    <td>
                        ${Utils.formatDate(invoice.due_date)}
                        ${isOverdue ? '<div class="text-danger small">Overdue</div>' : ''}
                    </td>
                    <td>
                        <strong>${Utils.formatCurrency(invoice.total)}</strong>
                        <div class="text-muted small">
                            ${invoice.tax ? `Tax: ${Utils.formatCurrency(invoice.tax)}` : ''}
                        </div>
                    </td>
                    <td>
                        ${this.getStatusBadge(status)}
                    </td>
                    <td class="text-end">
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" onclick="invoicesPage.viewInvoice('${invoice.invoice_id}')">
                                <i class="bi bi-eye"></i>
                            </button>
                            <button class="btn btn-outline-secondary" onclick="invoicesPage.editInvoice('${invoice.invoice_id}')">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-outline-success" onclick="invoicesPage.sendInvoice('${invoice.invoice_id}')" 
                                    ${invoice.status === 'SENT' || invoice.status === 'PAID' ? 'disabled' : ''}>
                                <i class="bi bi-send"></i>
                            </button>
                            <button class="btn btn-outline-danger" onclick="invoicesPage.deleteInvoice('${invoice.invoice_id}')">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    getStatusBadge(status) {
        const statusColors = {
            'DRAFT': 'secondary',
            'PENDING': 'warning',
            'SENT': 'info',
            'PAID': 'success',
            'OVERDUE': 'danger',
            'CANCELLED': 'dark'
        };
        
        const color = statusColors[status] || 'secondary';
        return `<span class="badge bg-${color}">${status}</span>`;
    }

    isInvoiceOverdue(invoice) {
        if (invoice.status === 'PAID' || invoice.status === 'CANCELLED') {
            return false;
        }
        
        const dueDate = new Date(invoice.due_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return dueDate < today;
    }

    getInvoiceCountByStatus(status) {
        return this.invoices.filter(invoice => invoice.status === status).length;
    }

    getOverdueCount() {
        return this.invoices.filter(invoice => this.isInvoiceOverdue(invoice)).length;
    }

    getTotalDue() {
        const pendingInvoices = this.invoices.filter(invoice => 
            invoice.status === 'PENDING' || invoice.status === 'SENT' || this.isInvoiceOverdue(invoice)
        );
        
        const total = pendingInvoices.reduce((sum, invoice) => sum + (parseFloat(invoice.total) || 0), 0);
        return Utils.formatCurrency(total);
    }

    filterInvoices() {
        const search = document.getElementById('invoiceSearch')?.value.toLowerCase() || '';
        const status = document.getElementById('invoiceStatusFilter')?.value || '';
        const dateFilter = document.getElementById('invoiceDateFilter')?.value || '';
        const sort = document.getElementById('invoiceSort')?.value || 'newest';
        
        this.filteredInvoices = this.invoices.filter(invoice => {
            const client = this.app.state.clients.find(c => c.client_id === invoice.client_id);
            const clientName = client ? client.company_name.toLowerCase() : '';
            const clientEmail = client ? client.email.toLowerCase() : '';
            
            const matchesSearch = 
                (invoice.invoice_number || '').toLowerCase().includes(search) ||
                clientName.includes(search) ||
                clientEmail.includes(search);
            
            const matchesStatus = !status || 
                (status === 'OVERDUE' ? this.isInvoiceOverdue(invoice) : invoice.status === status);
            
            const matchesDate = !dateFilter || this.matchesDateFilter(invoice, dateFilter);
            
            return matchesSearch && matchesStatus && matchesDate;
        });
        
        // Sort results
        this.filteredInvoices.sort((a, b) => {
            switch(sort) {
                case 'newest':
                    return new Date(b.date) - new Date(a.date);
                case 'oldest':
                    return new Date(a.date) - new Date(b.date);
                case 'dueDate':
                    return new Date(a.due_date) - new Date(b.due_date);
                case 'amountHigh':
                    return (parseFloat(b.total) || 0) - (parseFloat(a.total) || 0);
                case 'amountLow':
                    return (parseFloat(a.total) || 0) - (parseFloat(b.total) || 0);
                default:
                    return new Date(b.date) - new Date(a.date);
            }
        });
        
        this.updateTable();
    }

    matchesDateFilter(invoice, filter) {
        const date = new Date(invoice.date);
        const today = new Date();
        
        switch(filter) {
            case 'today':
                return date.toDateString() === today.toDateString();
            case 'week':
                const weekAgo = new Date(today);
                weekAgo.setDate(today.getDate() - 7);
                return date >= weekAgo;
            case 'month':
                const monthAgo = new Date(today);
                monthAgo.setMonth(today.getMonth() - 1);
                return date >= monthAgo;
            case 'quarter':
                const quarterAgo = new Date(today);
                quarterAgo.setMonth(today.getMonth() - 3);
                return date >= quarterAgo;
            case 'year':
                const yearAgo = new Date(today);
                yearAgo.setFullYear(today.getFullYear() - 1);
                return date >= yearAgo;
            default:
                return true;
        }
    }

    renderPagination() {
        // Simple pagination - you can extend this for larger datasets
        if (this.filteredInvoices.length <= 10) return '';
        
        return `
            <div class="d-flex justify-content-between align-items-center mt-3">
                <div class="text-muted">
                    Showing ${Math.min(this.filteredInvoices.length, 10)} of ${this.filteredInvoices.length} invoices
                </div>
                <nav>
                    <ul class="pagination pagination-sm mb-0">
                        <li class="page-item active"><a class="page-link" href="#">1</a></li>
                        ${this.filteredInvoices.length > 10 ? `
                            <li class="page-item"><a class="page-link" href="#">2</a></li>
                        ` : ''}
                        ${this.filteredInvoices.length > 20 ? `
                            <li class="page-item"><a class="page-link" href="#">3</a></li>
                        ` : ''}
                    </ul>
                </nav>
            </div>
        `;
    }

    updateTable() {
        const tableBody = document.getElementById('invoicesTableBody');
        if (tableBody) {
            tableBody.innerHTML = this.renderInvoicesTable();
        }
    }

    async viewInvoice(invoiceId) {
        try {
            const response = await apiService.getInvoice(invoiceId);
            if (response.success) {
                const invoice = response.data;
                this.showInvoiceModal(invoice);
            }
        } catch (error) {
            Utils.showNotification('Error loading invoice details', 'danger');
        }
    }

    async editInvoice(invoiceId) {
        Utils.showNotification('Edit invoice feature coming soon!', 'info');
        // In a real app: app.loadPage(`invoice-edit?id=${invoiceId}`);
    }

    async sendInvoice(invoiceId) {
        if (!confirm('Send this invoice to the client?')) return;
        
        try {
            Utils.showLoading(true);
            const response = await apiService.sendInvoice(invoiceId);
            
            if (response.success) {
                Utils.showNotification('Invoice sent successfully!', 'success');
                // Refresh the page
                this.app.loadPage('invoices');
            } else {
                throw new Error(response.error || 'Failed to send invoice');
            }
            
        } catch (error) {
            Utils.showNotification('Error: ' + error.message, 'danger');
        } finally {
            Utils.showLoading(false);
        }
    }

    async deleteInvoice(invoiceId) {
        if (!confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
            return;
        }
        
        try {
            Utils.showLoading(true);
            // Note: You need to add deleteInvoice method to apiService
            // For now, just show a notification
            Utils.showNotification('Delete feature requires backend implementation', 'info');
            
            // In a real app:
            // const response = await apiService.deleteInvoice(invoiceId);
            // if (response.success) {
            //     Utils.showNotification('Invoice deleted successfully', 'success');
            //     // Remove from local array
            //     this.invoices = this.invoices.filter(i => i.invoice_id !== invoiceId);
            //     this.filteredInvoices = this.filteredInvoices.filter(i => i.invoice_id !== invoiceId);
            //     this.updateTable();
            // }
            
        } catch (error) {
            Utils.showNotification('Error: ' + error.message, 'danger');
        } finally {
            Utils.showLoading(false);
        }
    }

    showInvoiceModal(invoice) {
        const client = invoice.client || this.app.state.clients.find(c => c.client_id === invoice.client_id);
        
        const modalHtml = `
            <div class="modal fade" id="invoiceModal" tabindex="-1">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Invoice ${invoice.invoice_number || 'Details'}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row mb-4">
                                <div class="col-md-6">
                                    <h6>Invoice Details</h6>
                                    <p><strong>Invoice Number:</strong> ${invoice.invoice_number || 'N/A'}</p>
                                    <p><strong>Date:</strong> ${Utils.formatDate(invoice.date)}</p>
                                    <p><strong>Due Date:</strong> ${Utils.formatDate(invoice.due_date)}</p>
                                    <p><strong>Status:</strong> ${this.getStatusBadge(invoice.status)}</p>
                                </div>
                                <div class="col-md-6">
                                    <h6>Client Information</h6>
                                    ${client ? `
                                        <p><strong>Client:</strong> ${client.company_name}</p>
                                        <p><strong>Contact:</strong> ${client.contact_person}</p>
                                        <p><strong>Email:</strong> ${client.email}</p>
                                        <p><strong>Phone:</strong> ${client.phone || 'N/A'}</p>
                                    ` : '<p class="text-muted">Client information not available</p>'}
                                </div>
                            </div>
                            
                            <!-- Invoice Items -->
                            ${invoice.items && invoice.items.length > 0 ? `
                                <div class="table-responsive mb-4">
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
                            ` : ''}
                            
                            <!-- Invoice Summary -->
                            <div class="row">
                                <div class="col-md-6">
                                    ${invoice.notes ? `
                                        <h6>Notes</h6>
                                        <div class="bg-light p-3 rounded">
                                            ${invoice.notes}
                                        </div>
                                    ` : ''}
                                </div>
                                <div class="col-md-6">
                                    <div class="card bg-light">
                                        <div class="card-body">
                                            <h6 class="card-title">Invoice Summary</h6>
                                            <div class="d-flex justify-content-between mb-2">
                                                <span>Subtotal:</span>
                                                <span>${Utils.formatCurrency(invoice.subtotal || 0)}</span>
                                            </div>
                                            <div class="d-flex justify-content-between mb-2">
                                                <span>Tax:</span>
                                                <span>${Utils.formatCurrency(invoice.tax || 0)}</span>
                                            </div>
                                            <hr>
                                            <div class="d-flex justify-content-between fw-bold fs-5">
                                                <span>Total:</span>
                                                <span>${Utils.formatCurrency(invoice.total || 0)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-primary" onclick="invoicesPage.printInvoice('${invoice.invoice_id}')">
                                <i class="bi bi-printer me-2"></i>Print
                            </button>
                            ${invoice.status !== 'SENT' && invoice.status !== 'PAID' ? `
                                <button type="button" class="btn btn-success" onclick="invoicesPage.sendInvoice('${invoice.invoice_id}')">
                                    <i class="bi bi-send me-2"></i>Send Invoice
                                </button>
                            ` : ''}
                            ${invoice.status === 'PENDING' ? `
                                <button type="button" class="btn btn-warning" onclick="invoicesPage.markAsPaid('${invoice.invoice_id}')">
                                    <i class="bi bi-check-circle me-2"></i>Mark as Paid
                                </button>
                            ` : ''}
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

    async markAsPaid(invoiceId) {
        if (!confirm('Mark this invoice as paid?')) return;
        
        try {
            Utils.showLoading(true);
            // Note: You need to add updateInvoiceStatus method to apiService
            const response = await apiService.updateInvoiceStatus({
                invoice_id: invoiceId,
                status: 'PAID'
            });
            
            if (response.success) {
                Utils.showNotification('Invoice marked as paid!', 'success');
                this.app.loadPage('invoices');
            } else {
                throw new Error(response.error || 'Failed to update invoice');
            }
            
        } catch (error) {
            Utils.showNotification('Error: ' + error.message, 'danger');
        } finally {
            Utils.showLoading(false);
        }
    }

    printInvoice(invoiceId) {
        Utils.showNotification('Print feature coming soon!', 'info');
        // In a real app, you would generate a PDF or open print dialog
    }

    exportInvoices() {
        if (this.invoices.length === 0) {
            Utils.showNotification('No invoices to export', 'warning');
            return;
        }
        
        // Prepare data for export
        const exportData = this.invoices.map(invoice => {
            const client = this.app.state.clients.find(c => c.client_id === invoice.client_id);
            return {
                'Invoice Number': invoice.invoice_number || '',
                'Client': client ? client.company_name : 'Unknown',
                'Date': Utils.formatDate(invoice.date),
                'Due Date': Utils.formatDate(invoice.due_date),
                'Amount': invoice.total || 0,
                'Status': invoice.status,
                'Notes': invoice.notes || ''
            };
        });
        
        Utils.downloadCSV(exportData, 'invoices');
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
