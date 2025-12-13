// Forms Page Module (for Client, Invoice, Receipt forms)
class FormsPage {
    constructor(app) {
        this.app = app;
        this.currentForm = '';
        this.clients = [];
        this.products = [];
    }

    async render(formType) {
        this.currentForm = formType;
        
        try {
            // Client form
            if (formType === 'client-form') {
                const template = await Utils.loadTemplate('templates/forms/client-form.html');
                return template;
            }

            // Invoice form
            if (formType === 'invoice-form') {
                const [clientsResponse, template] = await Promise.all([
                    apiService.getClients(),
                    Utils.loadTemplate('templates/forms/invoice-form.html')
                ]);

                this.clients = clientsResponse.success ? clientsResponse.data : [];
                
                const clientOptions = this.clients.map(client => 
                    `<option value="${client.client_id}">${client.company_name} (${client.client_code || ''})</option>`
                ).join('');
                
                const today = new Date().toISOString().split('T')[0];
                const dueDate = new Date(); dueDate.setDate(dueDate.getDate() + 30);
                const dueDateStr = dueDate.toISOString().split('T')[0];
                
                return Utils.renderTemplate(template, {
                    'CLIENT_OPTIONS': clientOptions,
                    'TODAY': today,
                    'DUE_DATE': dueDateStr
                });
            }

            // Receipt form (simple inline template)
            if (formType === 'receipt-form') {
                // Build a basic receipt form using client list
                const clientsResponse = await apiService.getClients();
                this.clients = clientsResponse.success ? clientsResponse.data : [];
                const clientOptions = this.clients.map(client => 
                    `<option value="${client.client_id}">${client.company_name} (${client.client_code || ''})</option>`
                ).join('');

                return `
                    <div class="container-fluid">
                        <div class="row justify-content-center">
                            <div class="col-lg-8">
                                <div class="card">
                                    <div class="card-header">
                                        <h5 class="mb-0">Create Receipt</h5>
                                    </div>
                                    <div class="card-body">
                                        <form id="receiptForm" onsubmit="return formsPage.submitReceiptForm(event)">
                                            <div class="mb-3">
                                                <label class="form-label">Select Client</label>
                                                <select class="form-select" name="client_id" required>
                                                    <option value="">Choose a client...</option>
                                                    ${clientOptions}
                                                </select>
                                            </div>
                                            <div class="mb-3">
                                                <label class="form-label">Amount</label>
                                                <input type="number" class="form-control" name="amount" step="0.01" required>
                                            </div>
                                            <div class="mb-3">
                                                <label class="form-label">Payment Date</label>
                                                <input type="date" class="form-control" name="payment_date" value="${new Date().toISOString().split('T')[0]}" required>
                                            </div>
                                            <div class="mb-3">
                                                <label class="form-label">Payment Method</label>
                                                <select class="form-select" name="payment_method">
                                                    <option value="CASH">Cash</option>
                                                    <option value="BANK_TRANSFER">Bank Transfer</option>
                                                    <option value="MOBILE_MONEY">Mobile Money</option>
                                                    <option value="CARD">Card</option>
                                                </select>
                                            </div>
                                            <div class="mb-3">
                                                <label class="form-label">Notes</label>
                                                <textarea class="form-control" name="notes" rows="2"></textarea>
                                            </div>
                                            <div class="d-flex justify-content-between">
                                                <button type="button" class="btn btn-secondary" onclick="app.loadPage('receipts')">Cancel</button>
                                                <button type="submit" class="btn btn-primary">Save Receipt</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }

            return '';
            
        } catch (error) {
            console.error('Error loading ' + formType + ':', error);
            return this.getErrorTemplate(error);
        }
    }

    // Full implementation of submitClientForm (copied/adapted from original)
    async submitClientForm(event) {
        event.preventDefault();
        
        try {
            Utils.showLoading(true);
            
            const form = event.target;
            const formData = new FormData(form);
            const clientData = {};
            
            // Convert FormData to object
            for (const pair of formData.entries()) {
                const key = pair[0];
                const value = pair[1];
                
                if (key === 'tags' && value) {
                    clientData[key] = value.split(',').map(function(tag) { return tag.trim(); });
                } else if (['billing_amount', 'payment_terms', 'tax_rate', 'quantity', 'billing_day'].indexOf(key) >= 0) {
                    clientData[key] = parseFloat(value) || 0;
                } else if (key === 'tax_inclusive' || key === 'auto_renew') {
                    clientData[key] = value === 'true';
                } else if (key === 'reminder_days' && value) {
                    clientData[key] = value.split(',').map(function(day) { 
                        return parseInt(day.trim()); 
                    }).filter(function(day) { 
                        return !isNaN(day); 
                    });
                } else {
                    clientData[key] = value;
                }
            }
            
            // Add default values
            clientData.status = 'ACTIVE';
            
            // Create billing schedule data for invoice generation
            const billingSchedule = {
                billing_frequency: clientData.billing_frequency,
                billing_amount: clientData.billing_amount,
                tax_rate: clientData.tax_rate,
                tax_inclusive: clientData.tax_inclusive,
                quantity: clientData.quantity,
                start_date: clientData.start_date,
                end_date: clientData.end_date,
                payment_terms: clientData.payment_terms,
                bill_description: clientData.bill_description,
                auto_renew: clientData.auto_renew,
                billing_day: clientData.billing_day,
                reminder_days: clientData.reminder_days || [7, 3, 1],
                status: 'ACTIVE',
                auto_generate: true
            };
            
            // Remove billing fields from main client data
            const billingFields = [
                'billing_frequency', 'billing_amount', 'tax_rate', 'tax_inclusive',
                'quantity', 'start_date', 'end_date', 'payment_terms', 
                'bill_description', 'auto_renew', 'billing_day', 'reminder_days'
            ];
            
            billingFields.forEach(function(field) {
                delete clientData[field];
            });
            
            // Add billing schedule data
            clientData.billing_schedule = billingSchedule;
            
            // Call API to add client
            const response = await apiService.addClient(clientData);
            
            if (response.success) {
                // If client added successfully, create billing schedule
                try {
                    const scheduleResponse = await apiService.addBillingSchedule({
                        client_id: response.data.clientId || response.data.client_id,
                        billing_frequency: billingSchedule.billing_frequency,
                        billing_amount: billingSchedule.billing_amount,
                        tax_rate: billingSchedule.tax_rate,
                        tax_inclusive: billingSchedule.tax_inclusive,
                        quantity: billingSchedule.quantity,
                        start_date: billingSchedule.start_date,
                        end_date: billingSchedule.end_date,
                        payment_terms: billingSchedule.payment_terms,
                        bill_description: billingSchedule.bill_description,
                        auto_renew: billingSchedule.auto_renew,
                        billing_day: billingSchedule.billing_day,
                        reminder_days: billingSchedule.reminder_days,
                        status: billingSchedule.status,
                        auto_generate: billingSchedule.auto_generate
                    });
                    
                    if (scheduleResponse.success) {
                        Utils.showNotification('Client and billing schedule added successfully!', 'success');
                    } else {
                        Utils.showNotification('Client added, but billing schedule failed', 'warning');
                    }
                } catch (scheduleError) {
                    console.error('Error creating billing schedule:', scheduleError);
                    Utils.showNotification('Client added, but billing schedule failed', 'warning');
                }
                
                this.app.loadPage('clients');
            } else {
                throw new Error(response.error || 'Failed to add client');
            }
            
        } catch (error) {
            console.error('Error adding client:', error);
            Utils.showNotification('Error: ' + error.message, 'danger');
        } finally {
            Utils.showLoading(false);
        }
    }

    // Full implementation of submitInvoiceForm (copied/adapted from original)
    async submitInvoiceForm(event) {
        event.preventDefault();
        
        try {
            Utils.showLoading(true);
            
            // Gather invoice data
            const form = event.target;
            const formData = new FormData(form);
            const invoiceData = {
                client_id: formData.get('client_id'),
                date: formData.get('date'),
                due_date: formData.get('due_date'),
                currency: formData.get('currency') || 'GHS',
                notes: formData.get('notes'),
                items: []
            };
            
            // Gather items
            const items = document.querySelectorAll('.invoice-item');
            items.forEach(function(item) {
                const description = item.querySelector('.item-description').value;
                const quantity = parseFloat(item.querySelector('.item-quantity').value) || 1;
                const unitPrice = parseFloat(item.querySelector('.item-unit-price').value) || 0;
                const taxRate = parseFloat(item.querySelector('.item-tax-rate').value) || 0;
                
                if (description && unitPrice > 0) {
                    invoiceData.items.push({
                        description: description,
                        quantity: quantity,
                        unit_price: unitPrice,
                        tax_rate: taxRate
                    });
                }
            });
            
            if (invoiceData.items.length === 0) {
                throw new Error('Please add at least one item to the invoice');
            }
            
            // Call API
            const response = await apiService.createInvoice(invoiceData);
            
            if (response.success) {
                Utils.showNotification('Invoice created successfully!', 'success');
                this.app.loadPage('invoices');
            } else {
                throw new Error(response.error || 'Failed to create invoice');
            }
            
        } catch (error) {
            console.error('Error creating invoice:', error);
            Utils.showNotification('Error: ' + error.message, 'danger');
        } finally {
            Utils.showLoading(false);
        }
    }

    addInvoiceItem() {
        const itemsContainer = document.getElementById('invoiceItems');
        if (!itemsContainer) return;
        
        const newItem = document.createElement('div');
        newItem.className = 'invoice-item row g-3 mb-3';
        newItem.innerHTML = `
            <div class="col-md-5">
                <input type="text" class="form-control item-description" placeholder="Item description" required oninput="formsPage.calculateInvoiceTotal()">
            </div>
            <div class="col-md-2">
                <input type="number" class="form-control item-quantity" value="1" min="1" step="1" oninput="formsPage.calculateInvoiceTotal()">
            </div>
            <div class="col-md-2">
                <input type="number" class="form-control item-unit-price" placeholder="0.00" step="0.01" required oninput="formsPage.calculateInvoiceTotal()">
            </div>
            <div class="col-md-2">
                <input type="number" class="form-control item-tax-rate" value="0" step="0.01" oninput="formsPage.calculateInvoiceTotal()">
            </div>
            <div class="col-md-1">
                <button type="button" class="btn btn-danger w-100" onclick="this.closest('.invoice-item').remove(); formsPage.calculateInvoiceTotal()">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
        itemsContainer.appendChild(newItem);
    }

    calculateInvoiceTotal() {
        const items = document.querySelectorAll('.invoice-item');
        let subtotal = 0;
        let tax = 0;
        
        items.forEach(function(item) {
            const quantity = parseFloat(item.querySelector('.item-quantity').value) || 0;
            const unitPrice = parseFloat(item.querySelector('.item-unit-price').value) || 0;
            const taxRate = parseFloat(item.querySelector('.item-tax-rate').value) || 0;
            
            const itemTotal = quantity * unitPrice;
            const itemTax = itemTotal * (taxRate / 100);
            
            subtotal += itemTotal;
            tax += itemTax;
        });
        
        const total = subtotal + tax;
        
        const subtotalEl = document.getElementById('subtotal');
        const taxEl = document.getElementById('tax');
        const totalEl = document.getElementById('total');
        
        if (subtotalEl) subtotalEl.textContent = Utils.formatCurrency(subtotal, 'GHS');
        if (taxEl) taxEl.textContent = Utils.formatCurrency(tax, 'GHS');
        if (totalEl) totalEl.textContent = Utils.formatCurrency(total, 'GHS');
    }

    async submitReceiptForm(event) {
        event.preventDefault();
        try {
            Utils.showLoading(true);
            const form = event.target;
            const formData = new FormData(form);
            const receiptData = {
                client_id: formData.get('client_id'),
                amount: parseFloat(formData.get('amount')) || 0,
                payment_date: formData.get('payment_date'),
                payment_method: formData.get('payment_method'),
                notes: formData.get('notes') || ''
            };

            // Basic validation
            if (!receiptData.client_id) throw new Error('Client is required');
            if (!receiptData.amount || receiptData.amount <= 0) throw new Error('Amount must be greater than 0');

            const response = await apiService.addReceipt(receiptData);
            if (response.success) {
                Utils.showNotification('Receipt saved successfully!', 'success');
                this.app.loadPage('receipts');
            } else {
                throw new Error(response.error || 'Failed to save receipt');
            }

        } catch (error) {
            console.error('Error saving receipt:', error);
            Utils.showNotification('Error: ' + error.message, 'danger');
        } finally {
            Utils.showLoading(false);
        }
    }

    saveAsDraft() {
        Utils.showNotification('Draft saved!', 'info');
    }

    getErrorTemplate(error) {
        return `
            <div class="alert alert-danger">
                <h4>Error Loading Form</h4>
                <p>${error.message}</p>
                <button class="btn btn-primary" onclick="app.loadPage('dashboard')">
                    Return to Dashboard
                </button>
            </div>
        `;
    }

    initialize() {
        // Store reference to this instance for event handlers
        window.formsPage = this;
        
        // Initialize tabs for client form
        if (this.currentForm === 'client-form') {
            setTimeout(function() {
                const triggerTabList = document.querySelectorAll('#clientFormTabs button');
                triggerTabList.forEach(function(triggerEl) {
                    triggerEl.addEventListener('click', function(event) {
                        event.preventDefault();
                        const tab = new bootstrap.Tab(this);
                        tab.show();
                    });
                });
            }, 100);
        }
        
        console.log('Forms page initialized');
    }
}

// Export the class
window.FormsPage = FormsPage;
