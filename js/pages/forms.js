// Forms Page Module (for Client, Invoice, Receipt forms)
// Updated: client-form now loads product options and supports prefill when editing a schedule
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
                // Load template and fetch products to render dropdown options
                const [template, productsRes] = await Promise.all([
                    Utils.loadTemplate('templates/forms/client-form.html'),
                    apiService.getProducts()
                ]);

                this.products = (productsRes && productsRes.success) ? (productsRes.data || []) : [];

                const productOptions = this.products.map(p => {
                    const price = p.price != null ? p.price : '';
                    const tax = p.tax_rate != null ? p.tax_rate : 0;
                    // NOTE: template may not have currency on product; fallback to USD
                    return `<option value="${p.product_id}" data-price="${price}" data-tax="${tax}" data-description="${(p.description || '').replace(/"/g, '&quot;')}">
                              ${p.name} — ${Utils.formatCurrency(price || 0, p.currency || 'USD')}
                            </option>`;
                }).join('\n');

                return Utils.renderTemplate(template, { 'PRODUCT_OPTIONS': productOptions });
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
                                            <input type="hidden" name="receipt_id" id="receipt_id_hidden" value="">
                                            <div class="mb-3">
                                                <label class="form-label">Select Client</label>
                                                <select class="form-select" name="client_id" required id="receipt-client-select">
                                                    <option value="">Choose a client...</option>
                                                    ${clientOptions}
                                                </select>
                                            </div>
                                            <div class="mb-3">
                                                <label class="form-label">Amount</label>
                                                <input type="number" class="form-control" name="amount" step="0.01" required id="receipt-amount">
                                            </div>
                                            <div class="mb-3">
                                                <label class="form-label">Payment Date</label>
                                                <input type="date" class="form-control" name="payment_date" value="${new Date().toISOString().split('T')[0]}" required id="receipt-payment-date">
                                            </div>
                                            <div class="mb-3">
                                                <label class="form-label">Payment Method</label>
                                                <select class="form-select" name="payment_method" id="receipt-method">
                                                    <option value="CASH">Cash</option>
                                                    <option value="BANK_TRANSFER">Bank Transfer</option>
                                                    <option value="MOBILE_MONEY">Mobile Money</option>
                                                    <option value="CARD">Card</option>
                                                </select>
                                            </div>
                                            <div class="mb-3">
                                                <label class="form-label">Notes</label>
                                                <textarea class="form-control" name="notes" rows="2" id="receipt-notes"></textarea>
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

    // Full implementation of submitClientForm (handles add, update, AND schedule-edit flow)
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
                    clientData[key] = (value === 'true' || value === true);
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
            clientData.status = clientData.status || 'ACTIVE';

            // Check if we are in an "editSchedule" handoff (user came from Billing -> Edit)
            const editScheduleRaw = localStorage.getItem('editSchedule');
            if (editScheduleRaw) {
                // If editSchedule exists, prioritize saving schedule updates.
                const schedule = JSON.parse(editScheduleRaw);

                // Build updates object based on billing fields present on the client form
                const updates = {};
                // Only include fields that are set (to avoid overwriting unintended fields)
                if (clientData.billing_frequency) updates.billing_frequency = clientData.billing_frequency;
                if (clientData.billing_amount != null) updates.billing_amount = clientData.billing_amount;
                if (clientData.billing_day != null) updates.billing_day = clientData.billing_day;
                if (clientData.billing_cycle) updates.billing_cycle = clientData.billing_cycle;
                if (clientData.tax_rate != null) updates.tax_rate = clientData.tax_rate;
                if (clientData.reminder_days != null) updates.reminder_days_before = Array.isArray(clientData.reminder_days) ? clientData.reminder_days.join(',') : (clientData.reminder_days || '');
                if (clientData.auto_renew != null) updates.auto_generate = !!clientData.auto_renew;
                if (clientData.billing_amount != null) updates.billing_amount = clientData.billing_amount;
                if (clientData.bill_description) updates.bill_description = clientData.bill_description;
                if (clientData.quantity != null) updates.quantity = clientData.quantity;
                if (clientData.status) updates.status = clientData.status;
                updates.last_modified = new Date().toISOString();

                // Determine if user also filled client basic info intending to create/update a client.
                // If so, create/update client first and use that client_id in schedule update.
                let resultingClientId = schedule.client_id; // default to original
                const hasClientInfo = !!(clientData.company_name || clientData.email || clientData.client_id);

                if (hasClientInfo) {
                    // If client_id provided, update client
                    if (clientData.client_id) {
                        // call updateClient (partial)
                        try {
                            const updateResp = await apiService.updateClient(clientData);
                            if (updateResp && updateResp.success) {
                                resultingClientId = clientData.client_id;
                            } else {
                                // proceed but warn
                                console.warn('updateClient failed while editing schedule:', updateResp);
                            }
                        } catch (e) {
                            console.warn('updateClient call failed:', e);
                        }
                    } else {
                        // Create a new client and use its id
                        try {
                            const addResp = await apiService.addClient({
                                company_name: clientData.company_name,
                                contact_person: clientData.contact_person,
                                email: clientData.email,
                                phone: clientData.phone,
                                address: clientData.address,
                                city: clientData.city,
                                country: clientData.country,
                                tax_number: clientData.tax_number,
                                currency: clientData.currency,
                                payment_terms: clientData.payment_terms || 30,
                                status: clientData.status || 'ACTIVE',
                                tags: clientData.tags || ''
                            });
                            if (addResp && addResp.success) {
                                resultingClientId = addResp.data.clientId || addResp.data.client_id;
                                Utils.showNotification('Client created; will update schedule with new client', 'success');
                            } else {
                                console.warn('addClient failed while editing schedule:', addResp);
                            }
                        } catch (e) {
                            console.warn('addClient call failed:', e);
                        }
                    }
                }

                // Attach client_id to updates if it changed
                if (resultingClientId) updates.client_id = resultingClientId;

                // If a product was selected on the form, update schedule.items accordingly
                if (clientData.product_id) {
                    // Map to an items array expected by billing schedule (simple single-item)
                    updates.items = JSON.stringify([{
                        product_id: clientData.product_id,
                        quantity: clientData.quantity || 1,
                        unit_price: clientData.billing_amount || 0,
                        tax_rate: clientData.tax_rate || 0,
                        description: clientData.bill_description || ''
                    }]);
                }

                // Call updateBillingSchedule via API wrapper; wrapper expects { id, updates }
                try {
                    const resp = await apiService.updateBillingSchedule({ id: schedule.schedule_id, updates });
                    if (resp && resp.success) {
                        Utils.showNotification('Billing schedule updated successfully', 'success');
                        // cleanup handoff keys
                        localStorage.removeItem('editSchedule');
                        localStorage.removeItem('openTab');
                        // redirect back to billing page
                        this.app.loadPage('billing');
                        return;
                    } else {
                        throw new Error((resp && resp.error) || 'Failed to update schedule');
                    }
                } catch (err) {
                    console.error('Failed to update billing schedule:', err);
                    Utils.showNotification('Failed to update billing schedule: ' + (err.message || err), 'danger');
                    // do not return — allow normal client creation fallback if desired
                    return;
                } finally {
                    Utils.showLoading(false);
                }
            } // end editSchedule flow

            // If not editing a schedule, continue with normal client create/update flow

            // If editing (client_id present), call updateClient
            if (clientData.client_id) {
                const response = await apiService.updateClient(clientData);
                if (response.success) {
                    Utils.showNotification('Client updated successfully!', 'success');
                    localStorage.removeItem('editClient');
                    this.app.loadPage('clients');
                    return;
                } else {
                    throw new Error(response.error || 'Failed to update client');
                }
            }

            // Create billing schedule data for invoice generation (for new client)
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
                'bill_description', 'auto_renew', 'billing_day', 'reminder_days', 'product_id'
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
                        auto_generate: billingSchedule.auto_generate,
                        items: billingSchedule.product_id ? [{ product_id: billingSchedule.product_id, unit_price: billingSchedule.billing_amount }] : []
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
            console.error('Error adding/updating client or schedule:', error);
            Utils.showNotification('Error: ' + (error.message || String(error)), 'danger');
        } finally {
            Utils.showLoading(false);
        }
    }

    // Full implementation of submitInvoiceForm (handles create & update)
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
            
            const invoiceIdHidden = form.querySelector('input[name="invoice_id"]') ? form.querySelector('input[name="invoice_id"]').value : null;
            if (invoiceIdHidden) invoiceData.invoice_id = invoiceIdHidden;
            
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
            
            // If editing existing invoice -> call updateInvoice
            if (invoiceData.invoice_id) {
                const response = await apiService.updateInvoice(invoiceData);
                if (response.success) {
                    Utils.showNotification('Invoice updated successfully!', 'success');
                    localStorage.removeItem('editInvoice');
                    this.app.loadPage('invoices');
                    return;
                } else {
                    throw new Error(response.error || 'Failed to update invoice');
                }
            }

            // Call API to create new invoice
            const response = await apiService.createInvoice(invoiceData);
            
            if (response.success) {
                Utils.showNotification('Invoice created successfully!', 'success');
                this.app.loadPage('invoices');
            } else {
                throw new Error(response.error || 'Failed to create invoice');
            }
            
        } catch (error) {
            console.error('Error creating/updating invoice:', error);
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

            const receiptId = formData.get('receipt_id') || form.querySelector('#receipt_id_hidden')?.value;
            if (receiptId) receiptData.receipt_id = receiptId;

            // Basic validation
            if (!receiptData.client_id) throw new Error('Client is required');
            if (!receiptData.amount || receiptData.amount <= 0) throw new Error('Amount must be greater than 0');

            let response;
            if (receiptData.receipt_id) {
                response = await apiService.updateReceipt(receiptData);
            } else {
                response = await apiService.addReceipt(receiptData);
            }

            if (response.success) {
                Utils.showNotification('Receipt saved successfully!', 'success');
                localStorage.removeItem('editReceipt');
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
            setTimeout(() => {
                const triggerTabList = document.querySelectorAll('#clientFormTabs button');
                triggerTabList.forEach(function(triggerEl) {
                    triggerEl.addEventListener('click', function(event) {
                        event.preventDefault();
                        const tab = new bootstrap.Tab(this);
                        tab.show();
                    });
                });

                // If products were loaded during render, wire product select change to prefill amount/tax/description
                const productSelect = document.getElementById('billing-product-select');
                if (productSelect) {
                    productSelect.addEventListener('change', (ev) => {
                        const pid = ev.target.value;
                        const selected = this.products ? this.products.find(p => p.product_id === pid) : null;
                        if (selected) {
                            const price = selected.price != null ? selected.price : 0;
                            const tax = selected.tax_rate != null ? selected.tax_rate : 0;
                            const desc = selected.description || '';
                            const amountEl = document.getElementById('billing-amount');
                            const taxEl = document.getElementById('billing-tax-rate');
                            const descEl = document.getElementById('billing-description');
                            if (amountEl) amountEl.value = price;
                            if (taxEl) taxEl.value = tax;
                            if (descEl && !descEl.value) descEl.value = desc;
                        }
                    });
                }

                // If an editSchedule has been set, prefill the billing tab fields and show billing tab
                const editScheduleRaw = localStorage.getItem('editSchedule');
                const openTab = localStorage.getItem('openTab');
                if (openTab === 'billing') {
                    // show billing tab
                    const billingTabTrigger = Array.from(document.querySelectorAll('#clientFormTabs button')).find(b => b.getAttribute('data-bs-target') === '#billingTermsTab');
                    if (billingTabTrigger) {
                        const tab = new bootstrap.Tab(billingTabTrigger);
                        tab.show();
                    }
                }

                if (editScheduleRaw) {
                    try {
                        const schedule = JSON.parse(editScheduleRaw);
                        // Wait a tick to ensure fields are present
                        setTimeout(() => {
                            const form = document.getElementById('clientForm');
                            if (!form) return;

                            // Fill billing fields if present on schedule
                            if (schedule.billing_frequency) form.querySelector('[name="billing_frequency"]').value = schedule.billing_frequency;
                            if (schedule.billing_amount) form.querySelector('[name="billing_amount"]').value = schedule.billing_amount;
                            if (schedule.tax_rate) form.querySelector('[name="tax_rate"]').value = schedule.tax_rate;
                            if (schedule.quantity) form.querySelector('[name="quantity"]').value = schedule.quantity;
                            if (schedule.start_date) form.querySelector('[name="start_date"]').value = schedule.start_date;
                            if (schedule.end_date) form.querySelector('[name="end_date"]').value = schedule.end_date;
                            if (schedule.payment_terms) form.querySelector('[name="payment_terms"]').value = schedule.payment_terms;
                            if (schedule.billing_day) form.querySelector('[name="billing_day"]').value = schedule.billing_day;
                            if (schedule.auto_generate !== undefined) {
                                form.querySelector('[name="auto_generate"]').value = schedule.auto_generate ? 'true' : 'false';
                            }
                            if (schedule.reminder_days_before) form.querySelector('[name="reminder_days"]').value = schedule.reminder_days_before;
                            if (schedule.bill_description) form.querySelector('[name="bill_description"]').value = schedule.bill_description;

                            // If schedule has items and a product_id is present, select it
                            try {
                                const items = schedule.items || [];
                                if (items.length > 0) {
                                    const first = items[0];
                                    if (first.product_id) {
                                        const sel = document.getElementById('billing-product-select');
                                        if (sel) sel.value = first.product_id;
                                        // trigger change to set amount/tax/description from product
                                        sel && sel.dispatchEvent(new Event('change'));
                                    }
                                }
                            } catch (e) {
                                // ignore
                            }

                            // Once used, keep editSchedule if you want user to submit changes; do NOT auto-remove here.
                        }, 120);
                    } catch (e) {
                        console.error('Failed to parse editSchedule:', e);
                    }
                }

            }, 100);
        }

        // Prefill edit forms for client/invoice/receipt if present (existing logic)
        try {
            // Prefill client edit if present
            if (this.currentForm === 'client-form') {
                const edit = localStorage.getItem('editClient');
                if (edit) {
                    const client = JSON.parse(edit);
                    const form = document.getElementById('clientForm');
                    if (form) {
                        let input = form.querySelector('input[name="client_id"]');
                        if (!input) {
                            input = document.createElement('input');
                            input.type = 'hidden';
                            input.name = 'client_id';
                            form.prepend(input);
                        }
                        input.value = client.client_id || '';

                        Object.keys(client).forEach(k => {
                            try {
                                const el = form.querySelector(`[name="${k}"]`);
                                if (!el) return;
                                if (el.tagName === 'SELECT') {
                                    el.value = client[k] || '';
                                } else if (el.type === 'checkbox' || el.type === 'radio') {
                                    el.checked = !!client[k];
                                } else {
                                    el.value = Array.isArray(client[k]) ? client[k].join(',') : (client[k] != null ? client[k] : '');
                                }
                            } catch (e) {}
                        });
                    }
                    localStorage.removeItem('editClient');
                }
            }

            // Prefill invoice form if editing
            if (this.currentForm === 'invoice-form') {
                const editInv = localStorage.getItem('editInvoice');
                if (editInv) {
                    const invoice = JSON.parse(editInv);
                    setTimeout(() => {
                        const form = document.getElementById('invoiceForm');
                        if (!form) return;
                        let hid = form.querySelector('input[name="invoice_id"]');
                        if (!hid) {
                            hid = document.createElement('input');
                            hid.type = 'hidden';
                            hid.name = 'invoice_id';
                            form.appendChild(hid);
                        }
                        hid.value = invoice.invoice_id || '';

                        const clientSelect = document.getElementById('invoice-client-select');
                        if (clientSelect) clientSelect.value = invoice.client_id || '';

                        form.querySelector('input[name="date"]').value = (invoice.date ? invoice.date.toString().split('T')[0] : '') || '';
                        form.querySelector('input[name="due_date"]').value = (invoice.due_date ? invoice.due_date.toString().split('T')[0] : '') || '';
                        form.querySelector('select[name="currency"]').value = invoice.currency || 'GHS';
                        form.querySelector('textarea[name="notes"]').value = invoice.notes || '';

                        const itemsContainer = document.getElementById('invoiceItems');
                        if (itemsContainer) {
                            itemsContainer.innerHTML = '';
                            const items = invoice.items || [];
                            if (items.length === 0) {
                                this.addInvoiceItem();
                            } else {
                                items.forEach(it => {
                                    const newItem = document.createElement('div');
                                    newItem.className = 'invoice-item row g-3 mb-3';
                                    newItem.innerHTML = `
                                        <div class="col-md-5">
                                            <input type="text" class="form-control item-description" placeholder="Item description" required oninput="formsPage.calculateInvoiceTotal()" value="${it.description || ''}">
                                        </div>
                                        <div class="col-md-2">
                                            <input type="number" class="form-control item-quantity" value="${it.quantity || 1}" min="1" step="1" oninput="formsPage.calculateInvoiceTotal()">
                                        </div>
                                        <div class="col-md-2">
                                            <input type="number" class="form-control item-unit-price" placeholder="0.00" step="0.01" required oninput="formsPage.calculateInvoiceTotal()" value="${it.unit_price || 0}">
                                        </div>
                                        <div class="col-md-2">
                                            <input type="number" class="form-control item-tax-rate" value="${it.tax_rate || 0}" step="0.01" oninput="formsPage.calculateInvoiceTotal()">
                                        </div>
                                        <div class="col-md-1">
                                            <button type="button" class="btn btn-danger w-100" onclick="this.closest('.invoice-item').remove(); formsPage.calculateInvoiceTotal()">
                                                <i class="bi bi-trash"></i>
                                            </button>
                                        </div>
                                    `;
                                    itemsContainer.appendChild(newItem);
                                });
                            }
                            this.calculateInvoiceTotal();
                        }
                    }, 150);
                    localStorage.removeItem('editInvoice');
                }
            }

            // Prefill receipt form if editing
            if (this.currentForm === 'receipt-form') {
                const editR = localStorage.getItem('editReceipt');
                if (editR) {
                    const receipt = JSON.parse(editR);
                    setTimeout(() => {
                        const form = document.getElementById('receiptForm');
                        if (!form) return;
                        let hid = form.querySelector('input[name="receipt_id"]') || document.getElementById('receipt_id_hidden');
                        if (hid) hid.value = receipt.receipt_id || receipt.receiptId || '';
                        const sel = document.getElementById('receipt-client-select');
                        if (sel) sel.value = receipt.client_id || '';
                        const amt = document.getElementById('receipt-amount');
                        if (amt) amt.value = receipt.amount || '';
                        const pd = document.getElementById('receipt-payment-date');
                        if (pd) pd.value = receipt.payment_date ? receipt.payment_date.toString().split('T')[0] : '';
                        const pm = document.getElementById('receipt-method');
                        if (pm) pm.value = receipt.payment_method || '';
                        const notes = document.getElementById('receipt-notes');
                        if (notes) notes.value = receipt.notes || '';
                    }, 100);
                    localStorage.removeItem('editReceipt');
                }
            }

        } catch (e) {
            console.error('Forms initialize error:', e);
        }
        
        console.log('Forms page initialized');
    }
}

// Export the class
window.FormsPage = FormsPage;
