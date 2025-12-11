// Main Application Logic
class InvoiceApp {
    constructor() {
        this.currentPage = 'dashboard';
        this.state = {
            clients: [],
            invoices: [],
            products: [],
            loading: false
        };
        
        this.init();
    }

    async init() {
        // Check authentication
        if (!isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }

        // Set up event listeners
        this.setupEventListeners();
        
        // Load initial data
        await this.loadInitialData();
    }

    setupEventListeners() {
        // Handle sidebar toggle on mobile
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('navbar-toggler')) {
                const sidebar = document.querySelector('.sidebar');
                sidebar.classList.toggle('show');
            }
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                const sidebar = document.querySelector('.sidebar');
                const target = e.target;
                
                if (sidebar.classList.contains('show') && 
                    !sidebar.contains(target) && 
                    !target.classList.contains('navbar-toggler')) {
                    sidebar.classList.remove('show');
                }
            }
        });

        // Handle window resize
        window.addEventListener('resize', Utils.debounce(() => {
            if (window.innerWidth > 768) {
                const sidebar = document.querySelector('.sidebar');
                sidebar.classList.remove('show');
            }
        }, 250));
    }

    async loadInitialData() {
        try {
            Utils.showLoading(true);
            
            // Load clients and invoices in parallel
            const [clientsResponse, invoicesResponse] = await Promise.all([
                apiService.getClients(),
                apiService.getInvoices()
            ]);

            if (clientsResponse.success) {
                this.state.clients = clientsResponse.data || [];
            }

            if (invoicesResponse.success) {
                this.state.invoices = invoicesResponse.data || [];
            }

            Utils.showLoading(false);
            
        } catch (error) {
            console.error('Error loading initial data:', error);
            Utils.showLoading(false);
        }
    }

    // Page loading functions
    async loadPage(page) {
        try {
            this.currentPage = page;
            
            // Update active nav link
            this.updateActiveNav(page);
            
            // Show loading state
            this.showLoadingState(page);
            
            // Load page content
            let html = '';
            switch(page) {
                case 'dashboard':
                    html = await this.loadDashboard();
                    break;
                case 'clients':
                    html = await this.loadClientsPage();
                    break;
                case 'client-form':
                    html = await this.loadClientForm();
                    break;
                case 'invoices':
                    html = await this.loadInvoicesPage();
                    break;
                case 'invoice-form':
                    html = await this.loadInvoiceForm();
                    break;
                case 'products':
                    html = await this.loadProductsPage();
                    break;
                case 'reports':
                    html = await this.loadReportsPage();
                    break;
                default:
                    html = this.loadNotFoundPage();
            }
            
            // Update content
            document.getElementById('content').innerHTML = html;
            
            // Add fade-in animation
            document.getElementById('content').classList.add('fade-in');
            
            // Update URL hash
            window.location.hash = page;
            
        } catch (error) {
            console.error(`Error loading page ${page}:`, error);
            this.showErrorPage(error);
        }
    }

    updateActiveNav(page) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('onclick')?.includes(page)) {
                link.classList.add('active');
            }
        });
    }

    showLoadingState(page) {
        document.getElementById('content').innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading ${page.replace('-', ' ')}...</p>
            </div>
        `;
    }

    async loadDashboard() {
        try {
            const [statsResponse, recentClientsResponse, recentInvoicesResponse] = await Promise.all([
                apiService.getDashboardStats(),
                apiService.getClients({ limit: 5 }),
                apiService.getInvoices({ limit: 5, sort: 'newest' })
            ]);

            const stats = statsResponse.success ? statsResponse.data : {};
            const recentClients = recentClientsResponse.success ? recentClientsResponse.data : [];
            const recentInvoices = recentInvoicesResponse.success ? recentInvoicesResponse.data : [];

            return `
                <div class="container-fluid">
                    <!-- Header -->
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h2>Dashboard</h2>
                        <div>
                            <button class="btn btn-outline-primary me-2" onclick="app.refreshDashboard()">
                                <i class="bi bi-arrow-clockwise"></i> Refresh
                            </button>
                            <button class="btn btn-primary" onclick="app.initializeSystem()">
                                <i class="bi bi-gear"></i> Initialize System
                            </button>
                        </div>
                    </div>
                    
                    <!-- Stats Row -->
                    <div class="row mb-4">
                        <div class="col-md-3 col-sm-6 mb-3">
                            <div class="card stats-card border-primary">
                                <div class="card-body text-center">
                                    <i class="bi bi-people text-primary mb-2" style="font-size: 2.5rem;"></i>
                                    <h6 class="text-muted">Active Clients</h6>
                                    <h3 class="mt-2">${stats.activeClients || 0}</h3>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-3 col-sm-6 mb-3">
                            <div class="card stats-card border-success">
                                <div class="card-body text-center">
                                    <i class="bi bi-currency-dollar text-success mb-2" style="font-size: 2.5rem;"></i>
                                    <h6 class="text-muted">Total Revenue</h6>
                                    <h3 class="mt-2">${Utils.formatCurrency(stats.totalRevenue || 0)}</h3>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-3 col-sm-6 mb-3">
                            <div class="card stats-card border-warning">
                                <div class="card-body text-center">
                                    <i class="bi bi-clock text-warning mb-2" style="font-size: 2.5rem;"></i>
                                    <h6 class="text-muted">Pending Invoices</h6>
                                    <h3 class="mt-2">${stats.pendingInvoices || 0}</h3>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-3 col-sm-6 mb-3">
                            <div class="card stats-card border-info">
                                <div class="card-body text-center">
                                    <i class="bi bi-receipt text-info mb-2" style="font-size: 2.5rem;"></i>
                                    <h6 class="text-muted">Total Invoices</h6>
                                    <h3 class="mt-2">${stats.totalInvoices || 0}</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Quick Actions -->
                    <div class="row mb-4">
                        <div class="col-12">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="mb-0">Quick Actions</h5>
                                </div>
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col-md-3 col-6 mb-2">
                                            <button class="btn btn-primary w-100" onclick="app.loadPage('client-form')">
                                                <i class="bi bi-person-plus me-2"></i>Add Client
                                            </button>
                                        </div>
                                        <div class="col-md-3 col-6 mb-2">
                                            <button class="btn btn-success w-100" onclick="app.loadPage('invoice-form')">
                                                <i class="bi bi-plus-circle me-2"></i>Create Invoice
                                            </button>
                                        </div>
                                        <div class="col-md-3 col-6 mb-2">
                                            <button class="btn btn-info w-100" onclick="app.loadPage('invoices')">
                                                <i class="bi bi-receipt me-2"></i>View Invoices
                                            </button>
                                        </div>
                                        <div class="col-md-3 col-6 mb-2">
                                            <button class="btn btn-warning w-100" onclick="app.exportData()">
                                                <i class="bi bi-download me-2"></i>Export Data
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Recent Data -->
                    <div class="row">
                        <div class="col-md-6 mb-4">
                            <div class="card">
                                <div class="card-header d-flex justify-content-between align-items-center">
                                    <h5 class="mb-0">Recent Clients</h5>
                                    <a href="#" class="btn btn-sm btn-outline-primary" onclick="app.loadPage('clients')">
                                        View All
                                    </a>
                                </div>
                                <div class="card-body">
                                    ${this.renderRecentClients(recentClients)}
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-6 mb-4">
                            <div class="card">
                                <div class="card-header d-flex justify-content-between align-items-center">
                                    <h5 class="mb-0">Recent Invoices</h5>
                                    <a href="#" class="btn btn-sm btn-outline-primary" onclick="app.loadPage('invoices')">
                                        View All
                                    </a>
                                </div>
                                <div class="card-body">
                                    ${this.renderRecentInvoices(recentInvoices)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
        } catch (error) {
            console.error('Error loading dashboard:', error);
            return this.showErrorCard('Failed to load dashboard data');
        }
    }

    renderRecentClients(clients) {
        if (!clients || clients.length === 0) {
            return `
                <div class="text-center py-3">
                    <i class="bi bi-people display-6 text-muted"></i>
                    <p class="mt-2 text-muted">No clients yet</p>
                </div>
            `;
        }

        const items = clients.slice(0, 5).map(client => `
            <div class="list-group-item list-group-item-action border-0 py-3">
                <div class="d-flex w-100 justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1">${client.company_name || 'Unnamed Company'}</h6>
                        <p class="mb-1 text-muted small">
                            <i class="bi bi-person me-1"></i>${client.contact_person || 'No contact'}
                        </p>
                    </div>
                    <span class="badge ${client.status === 'ACTIVE' ? 'bg-success' : 'bg-secondary'}">
                        ${client.status || 'UNKNOWN'}
                    </span>
                </div>
                <small class="text-muted">
                    <i class="bi bi-envelope me-1"></i>${client.email || 'No email'}
                </small>
            </div>
        `).join('');

        return `<div class="list-group list-group-flush">${items}</div>`;
    }

    renderRecentInvoices(invoices) {
        if (!invoices || invoices.length === 0) {
            return `
                <div class="text-center py-3">
                    <i class="bi bi-receipt display-6 text-muted"></i>
                    <p class="mt-2 text-muted">No invoices yet</p>
                </div>
            `;
        }

        const items = invoices.slice(0, 5).map(invoice => {
            const dueDate = new Date(invoice.due_date);
            const isOverdue = dueDate < new Date() && invoice.status !== 'PAID';
            
            return `
                <div class="list-group-item list-group-item-action border-0 py-3">
                    <div class="d-flex w-100 justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-1">${invoice.invoice_number || 'No Number'}</h6>
                            <p class="mb-1 text-muted small">
                                ${Utils.formatCurrency(invoice.total || 0)}
                            </p>
                        </div>
                        <div class="text-end">
                            <span class="badge ${invoice.status === 'PAID' ? 'bg-success' : isOverdue ? 'bg-danger' : 'bg-warning'}">
                                ${invoice.status || 'PENDING'}
                            </span>
                            <div class="mt-1">
                                <small class="text-muted">Due: ${Utils.formatDate(invoice.due_date)}</small>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        return `<div class="list-group list-group-flush">${items}</div>`;
    }

    async loadClientsPage() {
        try {
            const response = await apiService.getClients();
            const clients = response.success ? response.data : [];
            
            return `
                <div class="container-fluid">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h2>Clients</h2>
                        <div>
                            <button class="btn btn-primary" onclick="app.loadPage('client-form')">
                                <i class="bi bi-person-plus me-1"></i> Add Client
                            </button>
                        </div>
                    </div>
                    
                    <!-- Filters -->
                    <div class="card mb-4">
                        <div class="card-body">
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <input type="text" class="form-control" 
                                           placeholder="Search clients..." 
                                           id="clientSearch" 
                                           onkeyup="app.filterClients()">
                                </div>
                                <div class="col-md-3">
                                    <select class="form-select" id="clientStatusFilter" onchange="app.filterClients()">
                                        <option value="">All Status</option>
                                        <option value="ACTIVE">Active</option>
                                        <option value="INACTIVE">Inactive</option>
                                    </select>
                                </div>
                                <div class="col-md-3">
                                    <select class="form-select" id="clientSort" onchange="app.filterClients()">
                                        <option value="name">Sort by Name</option>
                                        <option value="date">Sort by Date</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Clients Table -->
                    <div class="card">
                        <div class="card-body">
                            ${clients.length > 0 ? `
                                <div class="table-responsive">
                                    <table class="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>Code</th>
                                                <th>Company</th>
                                                <th>Contact</th>
                                                <th>Email</th>
                                                <th>Phone</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody id="clientsTableBody">
                                            ${this.renderClientsTable(clients)}
                                        </tbody>
                                    </table>
                                </div>
                            ` : `
                                <div class="text-center py-5">
                                    <i class="bi bi-people display-1 text-muted"></i>
                                    <h4 class="mt-3">No Clients Found</h4>
                                    <p class="text-muted mb-4">Add your first client to get started</p>
                                    <button class="btn btn-primary" onclick="app.loadPage('client-form')">
                                        <i class="bi bi-person-plus me-2"></i>Add First Client
                                    </button>
                                </div>
                            `}
                        </div>
                    </div>
                </div>
                
                <script>
                    // Store clients globally for filtering
                    window.allClients = ${JSON.stringify(clients)};
                </script>
            `;
            
        } catch (error) {
            console.error('Error loading clients:', error);
            return this.showErrorCard('Failed to load clients');
        }
    }

    renderClientsTable(clients) {
        return clients.map(client => `
            <tr>
                <td><strong>${client.client_code || 'N/A'}</strong></td>
                <td>
                    <div class="fw-semibold">${client.company_name || 'Unnamed'}</div>
                    <small class="text-muted">${client.tags || ''}</small>
                </td>
                <td>${client.contact_person || ''}</td>
                <td>
                    <a href="mailto:${client.email}" class="text-decoration-none">
                        ${client.email || ''}
                    </a>
                </td>
                <td>${client.phone || ''}</td>
                <td>
                    <span class="badge ${client.status === 'ACTIVE' ? 'bg-success' : 'bg-secondary'}">
                        ${client.status || 'UNKNOWN'}
                    </span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="app.viewClient('${client.client_id}')">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-outline-secondary" onclick="app.editClient('${client.client_id}')">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="app.deleteClient('${client.client_id}')">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async loadClientForm() {
        return `
            <div class="container-fluid">
                <div class="row justify-content-center">
                    <div class="col-lg-8">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">Add New Client</h5>
                            </div>
                            <div class="card-body">
                                <form id="clientForm" onsubmit="return app.submitClientForm(event)">
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
                this.loadPage('clients');
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

    async viewClient(clientId) {
        try {
            const response = await apiService.getClient(clientId);
            if (response.success) {
                const client = response.data;
                // Show client details in modal or separate page
                alert(`Viewing client: ${client.company_name}`);
            }
        } catch (error) {
            Utils.showNotification('Error loading client details', 'danger');
        }
    }

    async editClient(clientId) {
        Utils.showNotification('Edit feature coming soon!', 'info');
        // You would load the client form with existing data here
    }

    async deleteClient(clientId) {
        if (!confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
            return;
        }
        
        try {
            Utils.showLoading(true);
            const response = await apiService.deleteClient(clientId);
            
            if (response.success) {
                Utils.showNotification('Client deleted successfully', 'success');
                this.loadPage('clients');
            } else {
                throw new Error(response.error || 'Failed to delete client');
            }
            
        } catch (error) {
            Utils.showNotification('Error: ' + error.message, 'danger');
        } finally {
            Utils.showLoading(false);
        }
    }

    filterClients() {
        const search = document.getElementById('clientSearch')?.value.toLowerCase() || '';
        const status = document.getElementById('clientStatusFilter')?.value || '';
        const sort = document.getElementById('clientSort')?.value || 'name';
        
        if (!window.allClients) return;
        
        let filtered = window.allClients.filter(client => {
            const matchesSearch = 
                (client.company_name || '').toLowerCase().includes(search) ||
                (client.contact_person || '').toLowerCase().includes(search) ||
                (client.email || '').toLowerCase().includes(search) ||
                (client.client_code || '').toLowerCase().includes(search);
            
            const matchesStatus = !status || client.status === status;
            
            return matchesSearch && matchesStatus;
        });
        
        // Sort results
        filtered.sort((a, b) => {
            if (sort === 'name') {
                return (a.company_name || '').localeCompare(b.company_name || '');
            } else if (sort === 'date') {
                return new Date(b.created_date) - new Date(a.created_date);
            }
            return 0;
        });
        
        const tableBody = document.getElementById('clientsTableBody');
        if (tableBody) {
            tableBody.innerHTML = this.renderClientsTable(filtered);
        }
    }

    async loadInvoicesPage() {
        try {
            const response = await apiService.getInvoices();
            const invoices = response.success ? response.data : [];
            
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
                    
                    <!-- Invoice Stats -->
                    <div class="row mb-4">
                        ${this.renderInvoiceStats(invoices)}
                    </div>
                    
                    <!-- Invoices Table -->
                    <div class="card">
                        <div class="card-body">
                            ${invoices.length > 0 ? `
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
                                            ${this.renderInvoicesTable(invoices)}
                                        </tbody>
                                    </table>
                                </div>
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
            
        } catch (error) {
            console.error('Error loading invoices:', error);
            return this.showErrorCard('Failed to load invoices');
        }
    }

    renderInvoiceStats(invoices) {
        const total = invoices.length;
        const paid = invoices.filter(i => i.status === 'PAID').length;
        const pending = invoices.filter(i => i.status === 'PENDING').length;
        const overdue = invoices.filter(i => {
            return new Date(i.due_date) < new Date() && i.status !== 'PAID';
        }).length;
        
        const totalAmount = invoices
            .filter(i => i.status === 'PAID')
            .reduce((sum, i) => sum + (parseFloat(i.total) || 0), 0);
        
        return `
            <div class="col-md-3 col-sm-6 mb-3">
                <div class="card stats-card border-primary">
                    <div class="card-body text-center">
                        <i class="bi bi-receipt text-primary mb-2" style="font-size: 2rem;"></i>
                        <h6 class="text-muted">Total Invoices</h6>
                        <h3 class="mt-2">${total}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-3 col-sm-6 mb-3">
                <div class="card stats-card border-success">
                    <div class="card-body text-center">
                        <i class="bi bi-check-circle text-success mb-2" style="font-size: 2rem;"></i>
                        <h6 class="text-muted">Paid</h6>
                        <h3 class="mt-2">${paid}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-3 col-sm-6 mb-3">
                <div class="card stats-card border-warning">
                    <div class="card-body text-center">
                        <i class="bi bi-clock text-warning mb-2" style="font-size: 2rem;"></i>
                        <h6 class="text-muted">Pending</h6>
                        <h3 class="mt-2">${pending}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-3 col-sm-6 mb-3">
                <div class="card stats-card border-danger">
                    <div class="card-body text-center">
                        <i class="bi bi-exclamation-triangle text-danger mb-2" style="font-size: 2rem;"></i>
                        <h6 class="text-muted">Overdue</h6>
                        <h3 class="mt-2">${overdue}</h3>
                    </div>
                </div>
            </div>
        `;
    }

    renderInvoicesTable(invoices) {
        return invoices.map(invoice => {
            const dueDate = new Date(invoice.due_date);
            const isOverdue = dueDate < new Date() && invoice.status !== 'PAID';
            
            return `
                <tr>
                    <td>
                        <strong>${invoice.invoice_number || 'N/A'}</strong>
                        ${isOverdue ? '<span class="badge bg-danger ms-2">OVERDUE</span>' : ''}
                    </td>
                    <td>${this.getClientName(invoice.client_id)}</td>
                    <td>${Utils.formatDate(invoice.date)}</td>
                    <td>${Utils.formatDate(invoice.due_date)}</td>
                    <td><strong>${Utils.formatCurrency(invoice.total || 0)}</strong></td>
                    <td>
                        <span class="badge ${invoice.status === 'PAID' ? 'bg-success' : 'bg-warning'}">
                            ${invoice.status || 'PENDING'}
                        </span>
                    </td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" onclick="app.viewInvoice('${invoice.invoice_id}')">
                                <i class="bi bi-eye"></i>
                            </button>
                            <button class="btn btn-outline-success" onclick="app.sendInvoice('${invoice.invoice_id}')">
                                <i class="bi bi-envelope"></i>
                            </button>
                            <button class="btn btn-outline-info" onclick="app.downloadInvoice('${invoice.invoice_id}')">
                                <i class="bi bi-download"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    getClientName(clientId) {
        const client = this.state.clients.find(c => c.client_id === clientId);
        return client ? client.company_name : 'Unknown Client';
    }

    async viewInvoice(invoiceId) {
        Utils.showNotification('View invoice feature coming soon!', 'info');
    }

    async sendInvoice(invoiceId) {
        try {
            Utils.showLoading(true);
            const response = await apiService.sendInvoice(invoiceId);
            
            if (response.success) {
                Utils.showNotification('Invoice sent successfully!', 'success');
            } else {
                throw new Error(response.error || 'Failed to send invoice');
            }
            
        } catch (error) {
            Utils.showNotification('Error: ' + error.message, 'danger');
        } finally {
            Utils.showLoading(false);
        }
    }

    async downloadInvoice(invoiceId) {
        try {
            Utils.showLoading(true);
            const response = await apiService.downloadInvoicePDF(invoiceId);
            
            if (response.success) {
                // Open PDF in new tab
                window.open(response.data.url, '_blank');
                Utils.showNotification('Invoice downloaded!', 'success');
            } else {
                throw new Error(response.error || 'Failed to download invoice');
            }
            
        } catch (error) {
            Utils.showNotification('Error: ' + error.message, 'danger');
        } finally {
            Utils.showLoading(false);
        }
    }

    async loadInvoiceForm() {
        try {
            const clientsResponse = await apiService.getClients();
            const productsResponse = await apiService.getProducts();
            
            const clients = clientsResponse.success ? clientsResponse.data : [];
            const products = productsResponse.success ? productsResponse.data : [];
            
            return `
                <div class="container-fluid">
                    <div class="row justify-content-center">
                        <div class="col-lg-10">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="mb-0">Create New Invoice</h5>
                                </div>
                                <div class="card-body">
                                    <form id="invoiceForm" onsubmit="return app.submitInvoiceForm(event)">
                                        <!-- Client Selection -->
                                        <div class="mb-4">
                                            <h6 class="border-bottom pb-2 mb-3">Client Information</h6>
                                            <div class="row g-3">
                                                <div class="col-md-6">
                                                    <label class="form-label">Select Client *</label>
                                                    <select class="form-select" name="client_id" required>
                                                        <option value="">Choose a client...</option>
                                                        ${clients.map(client => `
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
                                                                onclick="this.closest('.invoice-item').remove(); app.calculateInvoiceTotal()">
                                                            <i class="bi bi-trash"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <button type="button" class="btn btn-outline-primary" onclick="app.addInvoiceItem()">
                                                <i class="bi bi-plus-circle me-2"></i>Add Item
                                            </button>
                                            
                                            <!-- Product Catalog -->
                                            ${products.length > 0 ? `
                                                <div class="mt-3">
                                                    <label class="form-label">Quick Add from Product Catalog</label>
                                                    <select class="form-select" onchange="app.addProductToInvoice(this)">
                                                        <option value="">Select a product...</option>
                                                        ${products.map(product => `
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
                                                <button type="button" class="btn btn-outline-primary me-2" onclick="app.saveAsDraft()">
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
                    dueDateInput.value = dueDate.toISOString().split('T')[0];
                    
                    // Initialize calculations
                    app.calculateInvoiceTotal();
                </script>
            `;
            
        } catch (error) {
            console.error('Error loading invoice form:', error);
            return this.showErrorCard('Failed to load invoice form');
        }
    }

    addInvoiceItem() {
        const itemsContainer = document.getElementById('invoiceItems');
        const newItem = document.createElement('div');
        newItem.className = 'invoice-item row g-3 mb-3';
        newItem.innerHTML = `
            <div class="col-md-5">
                <input type="text" class="form-control item-description" 
                       placeholder="Item description" required 
                       oninput="app.calculateInvoiceTotal()">
            </div>
            <div class="col-md-2">
                <input type="number" class="form-control item-quantity" 
                       value="1" min="1" step="1" 
                       oninput="app.calculateInvoiceTotal()">
            </div>
            <div class="col-md-2">
                <input type="number" class="form-control item-unit-price" 
                       placeholder="0.00" step="0.01" required 
                       oninput="app.calculateInvoiceTotal()">
            </div>
            <div class="col-md-2">
                <input type="number" class="form-control item-tax-rate" 
                       value="0" step="0.01" 
                       oninput="app.calculateInvoiceTotal()">
            </div>
            <div class="col-md-1">
                <button type="button" class="btn btn-danger w-100" 
                        onclick="this.closest('.invoice-item').remove(); app.calculateInvoiceTotal()">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
        itemsContainer.appendChild(newItem);
    }

    addProductToInvoice(select) {
        if (!select.value) return;
        
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
        lastItem.querySelector('.item-description').value = description;
        lastItem.querySelector('.item-unit-price').value = price;
        lastItem.querySelector('.item-tax-rate').value = taxRate;
        
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
        
        document.getElementById('subtotal').textContent = Utils.formatCurrency(subtotal);
        document.getElementById('tax').textContent = Utils.formatCurrency(tax);
        document.getElementById('total').textContent = Utils.formatCurrency(total);
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
                    await this.sendInvoice(response.data.invoiceId);
                }
                
                this.loadPage('invoices');
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

    saveAsDraft() {
        Utils.showNotification('Draft saved!', 'info');
        // You would implement draft saving logic here
    }

    async loadProductsPage() {
        return `
            <div class="container-fluid">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2>Products & Services</h2>
                    <button class="btn btn-primary" onclick="app.addProduct()">
                        <i class="bi bi-plus-circle me-1"></i> Add Product
                    </button>
                </div>
                
                <div class="card">
                    <div class="card-body">
                        <div class="text-center py-5">
                            <i class="bi bi-box display-1 text-muted"></i>
                            <h4 class="mt-3">Product Management</h4>
                            <p class="text-muted">Manage your products and services here</p>
                            <button class="btn btn-primary" onclick="app.addProduct()">
                                <i class="bi bi-plus-circle me-2"></i>Add Your First Product
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async loadReportsPage() {
        return `
            <div class="container-fluid">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2>Reports & Analytics</h2>
                    <div>
                        <select class="form-select me-2 d-inline-block w-auto" id="reportPeriod">
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly</option>
                            <option value="yearly">Yearly</option>
                        </select>
                        <button class="btn btn-primary" onclick="app.generateReport()">
                            <i class="bi bi-download me-1"></i> Export Report
                        </button>
                    </div>
                </div>
                
                <!-- Report Cards -->
                <div class="row mb-4">
                    <div class="col-md-4 mb-3">
                        <div class="card">
                            <div class="card-body text-center">
                                <i class="bi bi-graph-up text-primary display-4 mb-3"></i>
                                <h5>Revenue Report</h5>
                                <p class="text-muted">Monthly revenue breakdown</p>
                                <button class="btn btn-outline-primary" onclick="app.viewRevenueReport()">
                                    View Report
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-4 mb-3">
                        <div class="card">
                            <div class="card-body text-center">
                                <i class="bi bi-people text-success display-4 mb-3"></i>
                                <h5>Client Report</h5>
                                <p class="text-muted">Client acquisition and retention</p>
                                <button class="btn btn-outline-success" onclick="app.viewClientReport()">
                                    View Report
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-4 mb-3">
                        <div class="card">
                            <div class="card-body text-center">
                                <i class="bi bi-clock text-warning display-4 mb-3"></i>
                                <h5>Payment Report</h5>
                                <p class="text-muted">Payment timelines and delays</p>
                                <button class="btn btn-outline-warning" onclick="app.viewPaymentReport()">
                                    View Report
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Coming Soon -->
                <div class="card">
                    <div class="card-body text-center py-5">
                        <i class="bi bi-bar-chart display-1 text-muted"></i>
                        <h3 class="mt-3">Advanced Analytics Coming Soon</h3>
                        <p class="text-muted">
                            We're working on comprehensive reporting features including charts, 
                            graphs, and export capabilities.
                        </p>
                    </div>
                </div>
            </div>
        `;
    }

    loadNotFoundPage() {
        return `
            <div class="container-fluid">
                <div class="text-center py-5">
                    <i class="bi bi-exclamation-triangle display-1 text-warning"></i>
                    <h1 class="mt-3">404</h1>
                    <h4 class="text-muted mb-4">Page Not Found</h4>
                    <p>The page you're looking for doesn't exist or has been moved.</p>
                    <button class="btn btn-primary" onclick="app.loadPage('dashboard')">
                        <i class="bi bi-house me-2"></i>Return to Dashboard
                    </button>
                </div>
            </div>
        `;
    }

    showErrorPage(error) {
        document.getElementById('content').innerHTML = `
            <div class="alert alert-danger">
                <h4>Error Loading Page</h4>
                <p>${error.message}</p>
                <button class="btn btn-primary" onclick="app.loadPage('dashboard')">
                    Return to Dashboard
                </button>
            </div>
        `;
    }

    showErrorCard(message) {
        return `
            <div class="card">
                <div class="card-body text-center py-5">
                    <i class="bi bi-exclamation-triangle display-1 text-danger"></i>
                    <h4 class="mt-3">Error</h4>
                    <p class="text-muted">${message}</p>
                    <button class="btn btn-primary" onclick="app.loadPage('dashboard')">
                        Return to Dashboard
                    </button>
                </div>
            </div>
        `;
    }

    // System functions
    async initializeSystem() {
        if (!confirm('This will initialize the system and create required database sheets. Continue?')) {
            return;
        }

        try {
            Utils.showLoading(true);
            const response = await apiService.initializeSystem();
            
            if (response.success) {
                Utils.showNotification('System initialized successfully!', 'success');
                this.loadPage('dashboard');
            } else {
                throw new Error(response.error || 'Failed to initialize system');
            }
            
        } catch (error) {
            Utils.showNotification('Error: ' + error.message, 'danger');
        } finally {
            Utils.showLoading(false);
        }
    }

    async refreshDashboard() {
        // Clear cache and reload dashboard
        apiService.clearCache();
        this.loadPage('dashboard');
    }

    async exportData() {
        try {
            Utils.showLoading(true);
            const [clientsResponse, invoicesResponse] = await Promise.all([
                apiService.getClients(),
                apiService.getInvoices()
            ]);

            const clients = clientsResponse.success ? clientsResponse.data : [];
            const invoices = invoicesResponse.success ? invoicesResponse.data : [];

            // Export clients
            Utils.downloadCSV(clients, 'clients');
            
            // Export invoices
            setTimeout(() => {
                Utils.downloadCSV(invoices, 'invoices');
            }, 1000);
            
        } catch (error) {
            Utils.showNotification('Error exporting data: ' + error.message, 'danger');
        } finally {
            Utils.showLoading(false);
        }
    }

    // Placeholder methods for future features
    addProduct() {
        Utils.showNotification('Add product feature coming soon!', 'info');
    }

    generateReport() {
        Utils.showNotification('Report generation coming soon!', 'info');
    }

    viewRevenueReport() {
        Utils.showNotification('Revenue report coming soon!', 'info');
    }

    viewClientReport() {
        Utils.showNotification('Client report coming soon!', 'info');
    }

    viewPaymentReport() {
        Utils.showNotification('Payment report coming soon!', 'info');
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.app = new InvoiceApp();
    window.loadPage = (page) => window.app.loadPage(page);
});
