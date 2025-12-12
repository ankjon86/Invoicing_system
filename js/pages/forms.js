// Forms Page Module (for Client and Invoice forms)
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
            // Load necessary data based on form type
            if (formType === 'invoice-form') {
                const [clientsResponse, productsResponse] = await Promise.all([
                    apiService.getClients(),
                    apiService.getProducts()
                ]);
                
                this.clients = clientsResponse.success ? clientsResponse.data : [];
                this.products = productsResponse.success ? productsResponse.data : [];
            }
            
            return this.getTemplate();
            
        } catch (error) {
            console.error('Error loading ' + formType + ':', error);
            return this.getErrorTemplate(error);
        }
    }

    getTemplate() {
        if (this.currentForm === 'client-form') {
            return this.getClientFormTemplate();
        } else if (this.currentForm === 'invoice-form') {
            return this.getInvoiceFormTemplate();
        }
        return '';
    }

    getClientFormTemplate() {
        const today = new Date().toISOString().split('T')[0];
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const nextMonthDate = nextMonth.toISOString().split('T')[0];
        
        return `
            <div class="container-fluid">
                <div class="row justify-content-center">
                    <div class="col-lg-10">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">Add New Client</h5>
                            </div>
                            <div class="card-body">
                                <form id="clientForm" onsubmit="return formsPage.submitClientForm(event)">
                                    <!-- Tab Navigation -->
                                    <ul class="nav nav-tabs mb-4" id="clientFormTabs">
                                        <li class="nav-item">
                                            <button class="nav-link active" type="button" data-bs-toggle="tab" data-bs-target="#basicInfoTab">
                                                <i class="bi bi-person me-1"></i>Basic Information
                                            </button>
                                        </li>
                                        <li class="nav-item">
                                            <button class="nav-link" type="button" data-bs-toggle="tab" data-bs-target="#billingTermsTab">
                                                <i class="bi bi-calendar-check me-1"></i>Billing Terms
                                            </button>
                                        </li>
                                    </ul>
                                    
                                    <div class="tab-content">
                                        <!-- Tab 1: Basic Information -->
                                        <div class="tab-pane fade show active" id="basicInfoTab">
                                            <div class="row g-3">
                                                <!-- Column 1 -->
                                                <div class="col-md-4">
                                                    <div class="mb-3">
                                                        <label class="form-label">Company Name *</label>
                                                        <input type="text" class="form-control" name="company_name" required>
                                                    </div>
                                                    <div class="mb-3">
                                                        <label class="form-label">Contact Person *</label>
                                                        <input type="text" class="form-control" name="contact_person" required>
                                                    </div>
                                                    <div class="mb-3">
                                                        <label class="form-label">Email Address *</label>
                                                        <input type="email" class="form-control" name="email" required>
                                                    </div>
                                                </div>
                                                
                                                <!-- Column 2 -->
                                                <div class="col-md-4">
                                                    <div class="mb-3">
                                                        <label class="form-label">Phone Number</label>
                                                        <input type="tel" class="form-control" name="phone">
                                                    </div>
                                                    <div class="mb-3">
                                                        <label class="form-label">Address</label>
                                                        <input type="text" class="form-control" name="address">
                                                    </div>
                                                    <div class="mb-3">
                                                        <label class="form-label">City</label>
                                                        <input type="text" class="form-control" name="city">
                                                    </div>
                                                </div>
                                                
                                                <!-- Column 3 -->
                                                <div class="col-md-4">
                                                    <div class="mb-3">
                                                        <label class="form-label">Country</label>
                                                        <input type="text" class="form-control" name="country" value="Ghana">
                                                    </div>
                                                    <div class="mb-3">
                                                        <label class="form-label">Tax Number</label>
                                                        <input type="text" class="form-control" name="tax_number">
                                                    </div>
                                                    <div class="mb-3">
                                                        <label class="form-label">Currency</label>
                                                        <select class="form-select" name="currency">
                                                            <option value="GHS" selected>Ghana Cedi (₵)</option>
                                                            <option value="USD">US Dollar ($)</option>
                                                            <option value="EUR">Euro (€)</option>
                                                            <option value="GBP">British Pound (£)</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div class="row g-3">
                                                <div class="col-md-6">
                                                    <label class="form-label">Category</label>
                                                    <select class="form-select" name="category">
                                                        <option value="CORPORATE">Corporate</option>
                                                        <option value="RETAIL">Retail</option>
                                                        <option value="STARTUP">Startup</option>
                                                        <option value="NONPROFIT">Non-Profit</option>
                                                        <option value="GOVERNMENT">Government</option>
                                                    </select>
                                                </div>
                                                <div class="col-md-6">
                                                    <label class="form-label">Tags (comma separated)</label>
                                                    <input type="text" class="form-control" name="tags" placeholder="vip, recurring, corporate">
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <!-- Tab 2: Billing Terms -->
                                        <div class="tab-pane fade" id="billingTermsTab">
                                            <div class="alert alert-info mb-4">
                                                <i class="bi bi-info-circle me-2"></i>
                                                These billing terms will be used to automatically generate invoices for this client.
                                            </div>
                                            
                                            <div class="row g-3">
                                                <!-- Column 1 -->
                                                <div class="col-md-6">
                                                    <div class="mb-3">
                                                        <label class="form-label">Billing Frequency *</label>
                                                        <select class="form-select" name="billing_frequency" required>
                                                            <option value="">Select frequency...</option>
                                                            <option value="DAILY">Daily</option>
                                                            <option value="WEEKLY">Weekly</option>
                                                            <option value="BIWEEKLY">Bi-weekly</option>
                                                            <option value="MONTHLY" selected>Monthly</option>
                                                            <option value="QUARTERLY">Quarterly</option>
                                                            <option value="BIANNUALLY">Bi-annually</option>
                                                            <option value="YEARLY">Yearly</option>
                                                            <option value="ONE_TIME">One-time</option>
                                                        </select>
                                                    </div>
                                                    <div class="mb-3">
                                                        <label class="form-label">Amount *</label>
                                                        <input type="number" class="form-control" name="billing_amount" placeholder="0.00" step="0.01" required>
                                                    </div>
                                                    <div class="mb-3">
                                                        <label class="form-label">Tax Rate (%)</label>
                                                        <input type="number" class="form-control" name="tax_rate" value="0" step="0.01" min="0" max="100">
                                                    </div>
                                                    <div class="mb-3">
                                                        <label class="form-label">Tax Inclusive</label>
                                                        <select class="form-select" name="tax_inclusive">
                                                            <option value="false">No</option>
                                                            <option value="true">Yes</option>
                                                        </select>
                                                        <div class="form-text">If "Yes", tax is included in the amount above</div>
                                                    </div>
                                                </div>
                                                
                                                <!-- Column 2 -->
                                                <div class="col-md-6">
                                                    <div class="mb-3">
                                                        <label class="form-label">Start Date *</label>
                                                        <input type="date" class="form-control" name="start_date" value="${today}" required>
                                                        <div class="form-text">First billing date</div>
                                                    </div>
                                                    <div class="mb-3">
                                                        <label class="form-label">End Date</label>
                                                        <input type="date" class="form-control" name="end_date" value="${nextMonthDate}">
                                                        <div class="form-text">Leave empty for ongoing billing</div>
                                                    </div>
                                                    <div class="mb-3">
                                                        <label class="form-label">Quantity (Units)</label>
                                                        <input type="number" class="form-control" name="quantity" value="1" min="1" step="1">
                                                        <div class="form-text">Number of units to bill</div>
                                                    </div>
                                                    <div class="mb-3">
                                                        <label class="form-label">Payment Terms (days) *</label>
                                                        <input type="number" class="form-control" name="payment_terms" value="30" min="1" required>
                                                        <div class="form-text">Number of days client has to pay</div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <!-- Description of Bill -->
                                            <div class="row">
                                                <div class="col-12">
                                                    <div class="mb-3">
                                                        <label class="form-label">Description of Bill *</label>
                                                        <textarea class="form-control" name="bill_description" rows="3" placeholder="Describe the service/product being billed. This will appear on invoices..." required></textarea>
                                                        <div class="form-text">This description will appear on generated invoices</div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <!-- Auto-renew toggle -->
                                            <div class="row">
                                                <div class="col-12">
                                                    <div class="mb-3">
                                                        <div class="form-check form-switch">
                                                            <input class="form-check-input" type="checkbox" id="autoRenewSwitch" name="auto_renew" value="true">
                                                            <label class="form-check-label" for="autoRenewSwitch">Auto-renew billing schedule</label>
                                                        </div>
                                                        <div class="form-text">When enabled, billing will automatically continue after end date</div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <!-- Billing Day/Time options -->
                                            <div class="row">
                                                <div class="col-md-6">
                                                    <div class="mb-3">
                                                        <label class="form-label">Billing Day of Month</label>
                                                        <input type="number" class="form-control" name="billing_day" value="1" min="1" max="31">
                                                        <div class="form-text">For monthly billing: day of month to bill (1-31)</div>
                                                    </div>
                                                </div>
                                                <div class="col-md-6">
                                                    <div class="mb-3">
                                                        <label class="form-label">Send Reminders (days before due)</label>
                                                        <input type="text" class="form-control" name="reminder_days" placeholder="7,3,1">
                                                        <div class="form-text">Comma-separated: days before due date to send reminders</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Form Actions -->
                                    <div class="d-flex justify-content-between mt-4">
                                        <button type="button" class="btn btn-secondary" onclick="app.loadPage('clients')">Cancel</button>
                                        <div>
                                            <button type="button" class="btn btn-outline-primary me-2" onclick="formsPage.saveAsDraft()">Save as Draft</button>
                                            <button type="submit" class="btn btn-primary"><i class="bi bi-save me-2"></i>Save Client</button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getInvoiceFormTemplate() {
        const clientOptions = this.clients.map(client => 
            `<option value="${client.client_id}">${client.company_name} (${client.client_code || ''})</option>`
        ).join('');
        
        const today = new Date().toISOString().split('T')[0];
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        const dueDateStr = dueDate.toISOString().split('T')[0];
        
        return `
            <div class="container-fluid">
                <div class="row justify-content-center">
                    <div class="col-lg-10">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">Create New Invoice</h5>
                            </div>
                            <div class="card-body">
                                <form id="invoiceForm" onsubmit="return formsPage.submitInvoiceForm(event)">
                                    <div class="mb-4">
                                        <h6 class="border-bottom pb-2 mb-3">Client Information</h6>
                                        <div class="row g-3">
                                            <div class="col-md-6">
                                                <label class="form-label">Select Client *</label>
                                                <select class="form-select" name="client_id" required>
                                                    <option value="">Choose a client...</option>
                                                    ${clientOptions}
                                                </select>
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label">Invoice Date</label>
                                                <input type="date" class="form-control" name="date" value="${today}" required>
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label">Due Date *</label>
                                                <input type="date" class="form-control" name="due_date" value="${dueDateStr}" required>
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label">Currency</label>
                                                <select class="form-select" name="currency">
                                                    <option value="GHS" selected>Ghana Cedi (₵)</option>
                                                    <option value="USD">US Dollar ($)</option>
                                                    <option value="EUR">Euro (€)</option>
                                                    <option value="GBP">British Pound (£)</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="mb-4">
                                        <h6 class="border-bottom pb-2 mb-3">Invoice Items</h6>
                                        <div id="invoiceItems">
                                            <div class="invoice-item row g-3 mb-3">
                                                <div class="col-md-5">
                                                    <label class="form-label">Description *</label>
                                                    <input type="text" class="form-control item-description" placeholder="Item description" required>
                                                </div>
                                                <div class="col-md-2">
                                                    <label class="form-label">Quantity</label>
                                                    <input type="number" class="form-control item-quantity" value="1" min="1" step="1">
                                                </div>
                                                <div class="col-md-2">
                                                    <label class="form-label">Unit Price *</label>
                                                    <input type="number" class="form-control item-unit-price" placeholder="0.00" step="0.01" required>
                                                </div>
                                                <div class="col-md-2">
                                                    <label class="form-label">Tax Rate (%)</label>
                                                    <input type="number" class="form-control item-tax-rate" value="0" step="0.01">
                                                </div>
                                                <div class="col-md-1">
                                                    <label class="form-label">&nbsp;</label>
                                                    <button type="button" class="btn btn-danger w-100" onclick="this.closest('.invoice-item').remove(); formsPage.calculateInvoiceTotal()">
                                                        <i class="bi bi-trash"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <button type="button" class="btn btn-outline-primary" onclick="formsPage.addInvoiceItem()">
                                            <i class="bi bi-plus-circle me-2"></i>Add Item
                                        </button>
                                    </div>
                                    
                                    <div class="mb-4">
                                        <h6 class="border-bottom pb-2 mb-3">Invoice Summary</h6>
                                        <div class="row">
                                            <div class="col-md-6 offset-md-6">
                                                <div class="card bg-light">
                                                    <div class="card-body">
                                                        <div class="d-flex justify-content-between mb-2">
                                                            <span>Subtotal:</span>
                                                            <span id="subtotal">₵0.00</span>
                                                        </div>
                                                        <div class="d-flex justify-content-between mb-2">
                                                            <span>Tax:</span>
                                                            <span id="tax">₵0.00</span>
                                                        </div>
                                                        <hr>
                                                        <div class="d-flex justify-content-between fw-bold fs-5">
                                                            <span>Total:</span>
                                                            <span id="total">₵0.00</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="mb-4">
                                        <h6 class="border-bottom pb-2 mb-3">Additional Information</h6>
                                        <div class="row">
                                            <div class="col-12">
                                                <label class="form-label">Notes</label>
                                                <textarea class="form-control" name="notes" rows="3" placeholder="Additional notes for the client..."></textarea>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="d-flex justify-content-between">
                                        <button type="button" class="btn btn-secondary" onclick="app.loadPage('invoices')">Cancel</button>
                                        <button type="submit" class="btn btn-primary"><i class="bi bi-send me-2"></i>Create Invoice</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

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
                    clientData[key] = value.split(',').map(tag => tag.trim());
                } else if (['billing_amount', 'payment_terms', 'tax_rate', 'quantity', 'billing_day'].includes(key)) {
                    clientData[key] = parseFloat(value) || 0;
                } else if (key === 'tax_inclusive' || key === 'auto_renew') {
                    clientData[key] = value === 'true';
                } else if (key === 'reminder_days' && value) {
                    clientData[key] = value.split(',').map(day => parseInt(day.trim())).filter(day => !isNaN(day));
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
            
            billingFields.forEach(field => delete clientData[field]);
            
            // Add billing schedule data
            clientData.billing_schedule = billingSchedule;
            
            // Call API to add client
            const response = await apiService.addClient(clientData);
            
            if (response.success) {
                // If client added successfully, create billing schedule
                try {
                    const scheduleResponse = await apiService.addBillingSchedule({
                        client_id: response.data.clientId || response.data.client_id,
                        ...billingSchedule
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
            items.forEach(item => {
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
        
        items.forEach(item => {
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
            setTimeout(() => {
                const triggerTabList = document.querySelectorAll('#clientFormTabs button');
                triggerTabList.forEach(triggerEl => {
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
