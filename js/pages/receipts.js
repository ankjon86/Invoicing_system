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
                                                <button class="btn btn-outline-secondary" onclick="receiptsPage.editReceipt('${r.receipt_id}')">
                                                    <i class="bi bi-pencil"></i>
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

    // Convert number to words (simple English)
    numberToWords(amount) {
        if (isNaN(amount)) return '';
        const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
        const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];

        function convertHundred(n) {
            let str = '';
            if (n >= 100) {
                str += ones[Math.floor(n/100)] + ' Hundred';
                n = n % 100;
                if (n) str += ' and ';
            }
            if (n >= 20) {
                str += tens[Math.floor(n/10)];
                if (n %10) str += '-' + ones[n%10];
            } else if (n > 0) {
                str += ones[n];
            }
            return str;
        }

        amount = Number(Math.round(amount * 100) / 100);
        const whole = Math.floor(amount);
        const cents = Math.round((amount - whole) * 100);

        if (whole === 0) {
            return (cents ? `${cents}/100` : 'Zero');
        }

        const parts = [];
        const scales = ['', 'Thousand', 'Million', 'Billion'];
        let scale = 0;
        let n = whole;
        while (n > 0) {
            const chunk = n % 1000;
            if (chunk) {
                const text = convertHundred(chunk);
                parts.unshift(text + (scales[scale] ? ' ' + scales[scale] : ''));
            }
            n = Math.floor(n/1000);
            scale++;
        }

        let final = parts.join(', ');
        if (cents) final += ` and ${cents}/100`;
        return final;
    }

    async viewReceipt(receiptId) {
        try {
            const response = await apiService.getReceipt(receiptId);
            if (!response.success) {
                Utils.showNotification('Receipt not found', 'warning');
                return;
            }
            const r = response.data;

            // Load the printable receipt template
            let template;
            try {
                template = await Utils.loadTemplate('templates/receipts/receipt-template.html');
            } catch (tplErr) {
                console.warn('Receipt template not found, falling back to modal', tplErr);
                const modalHtml = `
                    <div class="modal fade" id="receiptModal" tabindex="-1">
                        <div class="modal-dialog modal-md">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title">Receipt ${r.receipt_number || r.receipt_id}</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                </div>
                                <div class="modal-body">
                                    <p><strong>Client:</strong> ${this.getClientName(r.client_id)}</p>
                                    <p><strong>Date:</strong> ${Utils.formatDate(r.payment_date)}</p>
                                    <p><strong>Amount:</strong> ${Utils.formatCurrency(r.amount)}</p>
                                    <p><strong>Method:</strong> ${r.payment_method || 'N/A'}</p>
                                    ${r.notes ? `<hr><p>${r.notes}</p>` : ''}
                                </div>
                                <div class="modal-footer">
                                    <button class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                    <button class="btn btn-primary" onclick="receiptsPage.printReceipt('${receiptId}')">Print</button>
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
                document.getElementById('receiptModal').addEventListener('hidden.bs.modal', function () { modalContainer.remove(); });
                return;
            }

            // Prepare data for template placeholders
            const client = this.app.state.clients.find(c => c.client_id === r.client_id) || {};
            const createdBy = r.created_by || '';
            const createdDate = r.created_date || new Date().toISOString();

            const filled = Utils.renderTemplate(template, {
                'RECEIPT_NUMBER': r.receipt_number || (r.receipt_id ? r.receipt_id.substring(0,8) : ''),
                'DATE': Utils.formatDate(r.payment_date),
                'COMPANY_NAME': 'ACME Billing Solutions',
                'COMPANY_ADDRESS': 'Your Company Address Here',
                'COMPANY_LOGO': '/assets/logo.png',
                'CLIENT_NAME': client.company_name || 'Unknown',
                'CLIENT_EMAIL': client.email || '',
                'CLIENT_ADDRESS': client.address || '',
                'PAYMENT_METHOD': r.payment_method || '',
                'DESCRIPTION': `Payment received`,
                'NOTES': r.notes || '',
                'AMOUNT': Utils.formatCurrency(r.amount || 0),
                'AMOUNT_WORDS': this.numberToWords(parseFloat(r.amount || 0)),
                'CREATED_BY': createdBy || '',
                'CREATED_DATE': Utils.formatDate(createdDate),
                'INVOICE_NUMBER': r.invoice_number || ''
            });

            // Show in a modal and allow printing
            const modalContainer = document.createElement('div');
            modalContainer.innerHTML = `
                <div class="modal fade" id="receiptTemplateModal" tabindex="-1">
                    <div class="modal-dialog modal-lg modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-body p-0">
                                ${filled}
                            </div>
                            <div class="modal-footer no-print">
                                <button class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                <button class="btn btn-primary" id="printFromModalBtn">Print / Save PDF</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modalContainer);

            const modalEl = document.getElementById('receiptTemplateModal');
            const modal = new bootstrap.Modal(modalEl);
            modal.show();

            document.getElementById('printFromModalBtn').addEventListener('click', function () {
                const receiptHtml = modalEl.querySelector('.receipt-container') ? modalEl.querySelector('.receipt-container').outerHTML : modalEl.querySelector('.receipt-page').outerHTML;
                const printWindow = window.open('', '_blank', 'width=800,height=600');
                printWindow.document.write(`
                    <html>
                      <head>
                        <title>Receipt ${r.receipt_number || r.receipt_id}</title>
                        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet"/>
                        <style>body{font-family: "Segoe UI", Tahoma, Verdana, sans-serif; padding:20px; color:#222;}</style>
                      </head>
                      <body>
                        ${receiptHtml}
                        <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 300); };</script>
                      </body>
                    </html>
                `);
                printWindow.document.close();
            });

            modalEl.addEventListener('hidden.bs.modal', function () {
                modalContainer.remove();
            });

        } catch (error) {
            console.error('Error viewing receipt:', error);
            Utils.showNotification('Error loading receipt', 'danger');
        }
    }

    // Edit receipt: store data and go to receipt form
    async editReceipt(receiptId) {
        try {
            const res = await apiService.getReceipt(receiptId);
            if (!res.success) throw new Error(res.error || 'Receipt not found');
            localStorage.setItem('editReceipt', JSON.stringify(res.data));
            window.location.hash = 'receipt-form';
        } catch (error) {
            console.error('Error preparing receipt edit:', error);
            Utils.showNotification('Error preparing receipt edit: ' + error.message, 'danger');
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
