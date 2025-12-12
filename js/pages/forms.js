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
                                            <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#basicInfoTab">
                                                <i class="bi bi-person me-1"></i>Basic Information
                                            </button>
                                        </li>
                                        <li class="nav-item">
                                            <button class="nav-link" data-bs-toggle="tab" data-bs-target="#contractTermsTab">
                                                <i class="bi bi-file-text me-1"></i>Contract & Terms
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
                                                        <input type="text" class="form-control" name="country">
                                                    </div>
                                                    <div class="mb-3">
                                                        <label class="form-label">Tax Number (GST/VAT)</label>
                                                        <input type="text" class="form-control" name="tax_number">
                                                    </div>
                                                    <div class="mb-3">
                                                        <label class="form-label">Currency</label>
                                                        <select class="form-select" name="currency">
                                                            <option value="USD">USD ($)</option>
                                                            <option value="EUR">EUR (€)</option>
                                                            <option value="GBP">GBP (£)</option>
                                                            <option value="INR">INR (₹)</option>
                                                            <option value="CAD">CAD (C$)</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <!-- Additional Fields in Single Row -->
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
                                            </div>
                                        </div>
                                        
                                        <!-- Tab 2: Contract & Terms -->
                                        <div class="tab-pane fade" id="contractTermsTab">
                                            <div class="row g-3">
                                                <!-- Column 1 -->
                                                <div class="col-md-6">
                                                    <div class="mb-3">
                                                        <label class="form-label">Payment Terms (days)</label>
                                                        <input type="number" class="form-control" name="payment_terms" value="30">
                                                    </div>
                                                    <div class="mb-3">
                                                        <label class="form-label">Billing Frequency</label>
                                                        <select class="form-select" name="billing_frequency">
                                                            <option value="MONTHLY">Monthly</option>
                                                            <option value="QUARTERLY">Quarterly</option>
                                                            <option value="YEARLY">Yearly</option>
                                                            <option value="ONE_TIME">One-time</option>
                                                            <option value="CUSTOM">Custom</option>
                                                        </select>
                                                    </div>
                                                    <div class="mb-3">
                                                        <label class="form-label">Contract Start Date</label>
                                                        <input type="date" class="form-control" name="contract_start_date">
                                                    </div>
                                                </div>
                                                
                                                <!-- Column 2 -->
                                                <div class="col-md-6">
                                                    <div class="mb-3">
                                                        <label class="form-label">Contract End Date</label>
                                                        <input type="date" class="form-control" name="contract_end_date">
                                                    </div>
                                                    <div class="mb-3">
                                                        <label class="form-label">Auto-renew Contract</label>
                                                        <select class="form-select" name="auto_renew">
                                                            <option value="false">No</option>
                                                            <option value="true">Yes</option>
                                                        </select>
                                                    </div>
                                                    <div class="mb-3">
                                                        <label class="form-label">Payment Method</label>
                                                        <select class="form-select" name="payment_method">
                                                            <option value="BANK_TRANSFER">Bank Transfer</option>
                                                            <option value="CREDIT_CARD">Credit Card</option>
                                                            <option value="PAYPAL">PayPal</option>
                                                            <option value="CHECK">Check</option>
                                                            <option value="CASH">Cash</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <!-- Contract Value -->
                                            <div class="row">
                                                <div class="col-md-12">
                                                    <div class="mb-3">
                                                        <label class="form-label">Contract Value</label>
                                                        <input type="number" class="form-control" name="contract_value" placeholder="0.00" step="0.01">
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <!-- Contract Details -->
                                            <div class="row">
                                                <div class="col-md-12">
                                                    <div class="mb-3">
                                                        <label class="form-label">Contract Description</label>
                                                        <textarea class="form-control" name="contract_description" rows="3" 
                                                                  placeholder="Brief description of services covered..."></textarea>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Form Actions -->
                                    <div class="d-flex justify-content-between mt-4">
                                        <button type="button" class="btn btn-secondary" onclick="app.loadPage('clients')">
                                            Cancel
                                        </button>
                                        <div>
                                            <button type="button" class="btn btn-outline-primary me-2" onclick="formsPage.saveAsDraft()">
                                                Save as Draft
                                            </button>
                                            <button type="submit" class="btn btn-primary">
                                                <i class="bi bi-save me-2"></i>Save Client
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
                // Initialize tabs
                document.addEventListener('DOMContentLoaded', function() {
                    const triggerTabList = [].slice.call(document.querySelectorAll('#clientFormTabs button'));
                    triggerTabList.forEach(triggerEl => {
                        const tabTrigger = new bootstrap.Tab(triggerEl);
                        triggerEl.addEventListener('click', function(event) {
                            event.preventDefault();
                            tabTrigger.show();
                        });
                    });
                });
            </script>
        `;
    }

    getInvoiceFormTemplate() {
        // Keep existing invoice form template
        return `
            <div class="container-fluid">
                <div class="row justify-content-center">
                    <div class="col-lg-10">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">Create New Invoice</h5>
                            </div>
                            <div class="card-body">
                                <!-- Your existing invoice form here -->
                                <p>Invoice form will be here...</p>
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
            for (const [key, value] of formData.entries()) {
                if (key === 'tags' && value) {
                    clientData[key] = value.split(',').map(tag => tag.trim());
                } else if (key === 'payment_terms' || key === 'contract_value') {
                    clientData[key] = parseFloat(value) || 0;
                } else if (key === 'auto_renew') {
                    clientData[key] = value === 'true';
                } else {
                    clientData[key] = value;
                }
            }
            
            // Add default values
            clientData.status = 'ACTIVE';
            
            // Merge contract terms into metadata
            const contractData = {
                billing_frequency: clientData.billing_frequency,
                contract_start_date: clientData.contract_start_date,
                contract_end_date: clientData.contract_end_date,
                auto_renew: clientData.auto_renew,
                payment_method: clientData.payment_method,
                contract_value: clientData.contract_value,
                contract_description: clientData.contract_description
            };
            
            // Remove contract fields from main client data
            delete clientData.billing_frequency;
            delete clientData.contract_start_date;
            delete clientData.contract_end_date;
            delete clientData.auto_renew;
            delete clientData.payment_method;
            delete clientData.contract_value;
            delete clientData.contract_description;
            
            // Add contract data to metadata
            clientData.contract_terms = contractData;
            
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
