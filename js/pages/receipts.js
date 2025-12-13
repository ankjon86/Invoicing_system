// Receipts Page Module
class ReceiptsPage {
    constructor(app) {
        this.app = app;
        this.receipts = [];
    }

    async render() {
        try {
            const [response, template] = await Promise.all([
                apiService.getReceipts(),
                Utils.loadTemplate('templates/receipts.html')
            ]);

            this.receipts = response.success ? response.data : [];

            const contentHtml = this.receipts.length > 0 ? this.buildReceiptsTable() : this.buildEmptyState();

            return Utils.renderTemplate(template, {
                'RECEIPTS_CONTENT': contentHtml
            });
        } catch (error) {
            console.error('Error loading receipts:', error);
            return this.getErrorTemplate(error);
        }
    }

    buildReceiptsTable() {
        return `
            <div class="card">
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Receipt #</th>
                                    <th>Client</th>
                                    <th>Date</th>
                                    <th>Amount</th>
                                    <th>Method</th>
                                    <th>Notes</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.receipts.map(r => `
                                    <tr>
                                        <td><strong>${r.receipt_number || (r.receipt_id ? r.receipt_id.substring(0,8) : 'N/A')}</strong></td>
                                        <td>${this.getClientName(r.client_id)}</td>
                                        <td>${Utils.formatDate(r.payment_date)}</td>
                                        <td>${Utils.formatCurrency(r.amount)}</td>
                                        <td>${r.payment_method || 'N/A'}</td>
                                        <td>${r.notes || ''}</td>
                                        <td>
                                            <div class="btn-group btn-group-sm">
                                                <button class="btn btn-outline-primary" onclick="receiptsPage.viewReceipt('${r.receipt_id}')">
                                                    <i class="bi bi-eye"></i>
                                                </button>
                                                <button class="btn btn-outline-danger" onclick="receiptsPage.deleteReceipt('${r.receipt_id}')">
                                                    <i class="bi bi-trash"></i>
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
                <i class="bi bi-journal-text display-1 text-muted"></i>
                <h4 class="mt-3">No Receipts</h4>
                <p class="text-muted mb-4">Record your first receipt to get started</p>
                <button class="btn btn-primary" onclick="app.loadPage('receipt-form')">
                    <i class="bi bi-receipt-cutoff me-2"></i>Create First Receipt
                </button>
            </div>
        `;
    }

    getClientName(clientId) {
        const client = this.app.state.clients.find(c => c.client_id === clientId);
        return client ? client.company_name : 'Unknown Client';
    }

    async viewReceipt(receiptId) {
        try {
            const response = await apiService.getReceipt(receiptId);
            if (response.success) {
                const r = response.data;
                const clientName = this.getClientName(r.client_id);
                const modalHtml = `
                    <div class="modal fade" id="receiptModal" tabindex="-1">
                        <div class="modal-dialog modal-md">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title">Receipt ${r.receipt_number || r.receipt_id}</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                </div>
                                <div class="modal-body">
                                    <p><strong>Client:</strong> ${clientName}</p>
                                    <p><strong>Date:</strong> ${Utils.formatDate(r.payment_date)}</p>
                                    <p><strong>Amount:</strong> ${Utils.formatCurrency(r.amount)}</p>
                                    <p><strong>Method:</strong> ${r.payment_method || 'N/A'}</p>
                                    ${r.notes ? `<hr><p>${r.notes}</p>` : ''}
                                </div>
                                <div class="modal-footer">
                                    <button class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                const modalContainer = document.createElement('div');
                modalContainer.innerHTML = modalHtml;
                document.body.appendChild(modalContainer);
                const modal = new bootstrap.Modal(document.getElementById('receiptModal'));
                modal.show();
                document.getElementById('receiptModal').addEventListener('hidden.bs.modal', function () {
                    modalContainer.remove();
                });
            } else {
                Utils.showNotification('Receipt not found', 'warning');
            }
        } catch (error) {
            console.error('Error viewing receipt:', error);
            Utils.showNotification('Error loading receipt', 'danger');
        }
    }

    async deleteReceipt(receiptId) {
        if (!confirm('Are you sure you want to delete this receipt?')) return;
        try {
            Utils.showLoading(true);
            const response = await apiService.deleteReceipt(receiptId);
            if (response.success) {
                Utils.showNotification('Receipt deleted', 'success');
                this.receipts = this.receipts.filter(r => r.receipt_id !== receiptId);
                const content = document.getElementById('content');
                if (content) {
                    content.innerHTML = await this.render();
                    this.initialize();
                }
            } else {
                throw new Error(response.error || 'Failed to delete receipt');
            }
        } catch (error) {
            console.error('Error deleting receipt:', error);
            Utils.showNotification('Error: ' + error.message, 'danger');
        } finally {
            Utils.showLoading(false);
        }
    }

    getErrorTemplate(error) {
        return `
            <div class="alert alert-danger">
                <h4>Error Loading Receipts</h4>
                <p>${error.message}</p>
                <button class="btn btn-primary" onclick="app.loadPage('receipts')">
                    Retry
                </button>
            </div>
        `;
    }

    initialize() {
        window.receiptsPage = this;
        console.log('Receipts page initialized');
    }
}

window.ReceiptsPage = ReceiptsPage;
