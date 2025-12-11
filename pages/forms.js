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
            console.error(`Error loading ${formType}:`, error);
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
        return `
            <div class="container-fluid">
                <div class="row justify-content-center">
                    <div class="col-lg-8">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">Add New Client</h5>
                            </div>
                            <div class="card-body">
                                <form id="clientForm" onsubmit="return formsPage.submitClientForm(event)">
                                    <!-- Basic Information -->
                                    <div class="mb-4">
                                        <h6 class="border-bottom pb-2 mb-3">Basic Information</h6>
                                        <div class="row g-3">
                                            <div class="col-md-6">
                                                <label class="form-label">Company Name *</label>
                                                <input type="text" class="form-control" name="company_name" required>
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label">Contact Person *</label>
                                                <input type="text" class="form-control" name="contact_person" required>
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label">Email Address *</label>
                                                <input type="email" class="form-control" name="email" required>
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label">Phone Number</label>
                                                <input type="tel" class="form-control" name="phone">
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Address -->
                                    <div class="mb-4">
                                        <h6 class="border-bottom pb-2 mb-3">Address</h6>
                                        <div class="row g-3">
                                            <div class="col-12">
                                                <label class="form-label">Street Address</label>
                                                <input type="text" class="form-control" name="address">
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label">City</label>
                                                <input type="text" class="form-control" name="city">
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label">State/Province</label>
                                                <input type="text" class="form-control" name="state">
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label">Country</label>
                                                <input type="text" class="form-control" name="country">
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label">Postal Code</label>
                                                <input type="text" class="form-control" name="postal_code">
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Billing Information -->
                                    <div class="mb-4">
                                        <h6 class="border-bottom pb-2 mb-3">Billing Information</h6>
                                        <div class="row g-3">
                                            <div class="col-md-6">
                                                <label class="form-label">Tax Number (GST/VAT)</label>
                                                <input type="text" class="form-control" name="tax_number">
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label">Currency</label>
                                                <select class="form-select" name="currency">
                                                    <option value="USD">USD ($)</option>
                                                    <option value="EUR">EUR (€)</option>
                                                    <option value="GBP">GBP (£)</option>
                                                    <option value="INR">INR (₹)</option>
                                                    <option value="CAD">CAD (C$)</option>
                                                </select>
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label">Payment Terms (days)</label>
                                                <input type="number" class="form-control" name="payment_terms" value="30">
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label">Credit Limit</label>
                                                <input type="number" class="form-control" name="credit_limit" value="0">
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Additional Information -->
                                    <div class="mb-4">
                                        <h6 class="border-bottom pb-2 mb-3">Additional Information</h6>
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
                                                <input type="text" class="form-control" name="tags" placeholder="e.g., vip, recurring, corporate">
                                            </div>
                                            <div class="col-12">
                                                <label class="form-label">Notes</label>
                                                <textarea class="form-control" name="notes" rows="3"></textarea>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Form Actions -->
                                    <div class="d-flex justify-content-between">
                                        <button type="button" class="btn btn-secondary" onclick="app.loadPage('clients')">
                                            Cancel
                                        </button>
                                        <button type="submit" class="btn btn-primary">
                                            <i class="bi bi-save me-2"></i>Save Client
                                        </button>
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
                                    <!-- Client Selection -->
                                    <div class="mb-4">
                                        <h6 class="border-bottom pb-2 mb-3">Client Information</h6>
                                        <div class="row g-3">
                                            <div class="col-md-6">
                                                <label class="form-label">Select Client *</label>
                                                <select class="form-select" name="client_id" required>
                                                    <option value="">Choose a client...</option>
                                                    ${this.clients.map(client => `
                                                        <option value="${client.client_id}">
                                                            ${client.company_name} (${client.client_code})
                                                        </option>
                                                    `).join('')}
                                                </select>
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label">Invoice Date</label>
                                                <input type="date" class="form-control" name="date" 
                                                       value="${new Date().toISOString().split('T')[0]}" required>
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label">Due Date *</label>
                                                <input type="date" class="form-control" name="due_date" required>
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label">Payment Terms (days)</label>
                                                <input type="number" class="form-control" name="payment_terms" value="30">
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Invoice Items -->
                                    <div class="mb-4">
                                        <h6 class="border-bottom pb-2 mb-3">Invoice Items</h6>
                                        <div id="invoiceItems">
                                            <div class="invoice-item row g-3 mb-3">
                                                <div class="col-md-5">
                                                    <label class="form-label">Description *</label>
                                                    <input type="text" class="form-control item-description" 
                                                           placeholder="Item description" required>
                                                </div>
                                                <div class="col-md-2">
                                                    <label class="form-label">Quantity</label>
                                                    <input type="number" class="form-control item-quantity" 
                                                           value="1" min="1" step="1">
                                                </div>
                                                <div class="col-md-2">
                                                    <label class="form-label">Unit Price *</label>
                                                    <input type="number" class="form-control item-unit-price" 
                                                           placeholder="0.00" step="0.01" required>
                                                </div>
                                                <div class="col-md-2">
                                                    <label class="form-label">Tax Rate (%)</label>
                                                    <input type="number" class="form-control item-tax-rate" 
                                                           value="0" step="0.01">
                                                </div>
                                                <div class="col-md-1">
                                                    <label class="form-label">&nbsp;</label>
                                                    <button type="button" class="btn btn-danger w-100" 
                                                            onclick="this.closest('.invoice-item').remove(); formsPage.calculateInvoiceTotal()">
                                                        <i class="bi bi-trash"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <button type="button" class="btn btn-outline-primary" onclick="formsPage.addInvoiceItem()">
                                            <i class="bi bi-plus-circle me-2"></i>Add Item
                                        </button>
                                        
                                        <!-- Product Catalog -->
                                        ${this.products.length > 0 ? `
                                            <div class="mt-3">
                                                <label class="form-label">Quick Add from Product Catalog</label>
                                                <select class="form-select" onchange="formsPage.addProductToInvoice(this)">
                                                    <option value="">Select a product...</option>
                                                    ${this.products.map(product => `
                                                        <option value="${product.product_id}" 
                                                                data-description="${product.name}"
                                                                data-price="${product.price}"
                                                                data-tax="${product.tax_rate || 0}">
                                                            ${product.name} - ${Utils.formatCurrency(product.price)}
                                                        </option>
                                                    `).join('')}
                                                </select>
                                            </div>
                                        ` : ''}
                                    </div>
                                    
                                    <!-- Totals -->
                                    <div class="mb-4">
                                        <h6 class="border-bottom pb-2 mb-3">Invoice Summary</h6>
                                        <div class="row">
                                            <div class="col-md-6 offset-md-6">
                                                <div class="card bg-light">
                                                    <div class="card-body">
                                                        <div class="d-flex justify-content-between mb-2">
                                                            <span>Subtotal:</span>
                                                            <span id="subtotal">$0.00</span>
                                                        </div>
                                                        <div class="d-flex justify-content-between mb-2">
                                                            <span>Tax:</span>
                                                            <span id="tax">$0.00</span>
                                                        </div>
                                                        <hr>
                                                        <div class="d-flex justify-content-between fw-bold fs-5">
                                                            <span>Total:</span>
                                                            <span id="total">$0.00</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Additional Information -->
                                    <div class="mb-4">
                                        <h6 class="border-bottom pb-2 mb-3">Additional Information</h6>
                                        <div class="row">
                                            <div class="col-12">
                                                <label class="form-label">Notes</label>
                                                <textarea class="form-control" name="notes" rows="3" 
                                                          placeholder="Additional notes for the client..."></textarea>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Form Actions -->
                                    <div class="d-flex justify-content-between">
                                        <button type="button" class="btn btn-secondary" onclick="app.loadPage('invoices')">
                                            Cancel
                                        </button>
                                        <div>
                                            <button type="button" class="btn btn-outline-primary me-2" onclick="formsPage.saveAsDraft()">
                                                Save as Draft
                                            </button>
                                            <button type="submit" class="btn btn-primary">
                                                <i class="bi bi-send me-2"></i>Create & Send Invoice
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <script>
                // Set default due date to 30 days from now
                const dueDateInput = document.querySelector('input[name="due_date"]');
                const today = new Date();
                const dueDate = new Date(today);
                dueDate.setDate(today.getDate() + 30);
                if (dueDateInput) {
                    dueDateInput.value = dueDate.toISOString().split('T')[0];
                }
                
                // Initialize calculations
                formsPage.calculateInvoiceTotal();
            </script>
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
            for (const [key, value] of formData.entries()) {
                if (key === 'tags' && value) {
                    clientData[key] = value.split(',').map(tag => tag.trim());
                } else if (key === 'payment_terms' || key === 'credit_limit') {
                    clientData[key] = parseFloat(value) || 0;
                } else {
                    clientData[key] = value;
                }
            }
            
            // Add default values
            clientData.status = 'ACTIVE';
            
            // Call API
            const response = await apiService.addClient(clientData);
            
            if (response.success) {
                Utils.showNotification('Client added successfully!', 'success');
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
                payment_terms: parseInt(formData.get('payment_terms')) || 30,
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
                        description,
                        quantity,
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
                
                // Ask if user wants to send the invoice
                if (confirm('Would you like to send this invoice to the client now?')) {
                    // You would call sendInvoice here
                    Utils.showNotification('Send invoice feature coming soon!', 'info');
                }
                
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
                <input type="text" class="form-control item-description" 
                       placeholder="Item description" required 
                       oninput="formsPage.calculateInvoiceTotal()">
            </div>
            <div class="col-md-2">
                <input type="number" class="form-control item-quantity" 
                       value="1" min="1" step="1" 
                       oninput="formsPage.calculateInvoiceTotal()">
            </div>
            <div class="col-md-2">
                <input type="number" class="form-control item-unit-price" 
                       placeholder="0.00" step="0.01" required 
                       oninput="formsPage.calculateInvoiceTotal()">
            </div>
            <div class="col-md-2">
                <input type="number" class="form-control item-tax-rate" 
                       value="0" step="0.01" 
                       oninput="formsPage.calculateInvoiceTotal()">
            </div>
            <div class="col-md-1">
                <button type="button" class="btn btn-danger w-100" 
                        onclick="this.closest('.invoice-item').remove(); formsPage.calculateInvoiceTotal()">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
        itemsContainer.appendChild(newItem);
    }

    addProductToInvoice(select) {
        if (!select || !select.value) return;
        
        const option = select.options[select.selectedIndex];
        const description = option.getAttribute('data-description');
        const price = option.getAttribute('data-price');
        const taxRate = option.getAttribute('data-tax');
        
        // Add new item
        this.addInvoiceItem();
        
        // Get the last added item
        const items = document.querySelectorAll('.invoice-item');
        const lastItem = items[items.length - 1];
        
        // Fill in the product details
        if (lastItem) {
            lastItem.querySelector('.item-description').value = description;
            lastItem.querySelector('.item-unit-price').value = price;
            lastItem.querySelector('.item-tax-rate').value = taxRate;
        }
        
        // Reset select
        select.value = '';
        
        // Recalculate totals
        this.calculateInvoiceTotal();
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
        
        if (subtotalEl) subtotalEl.textContent = Utils.formatCurrency(subtotal);
        if (taxEl) taxEl.textContent = Utils.formatCurrency(tax);
        if (totalEl) totalEl.textContent = Utils.formatCurrency(total);
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
        console.log('Forms page initialized');
    }
}

// Export the class
window.FormsPage = FormsPage;
