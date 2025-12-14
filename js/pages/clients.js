// Clients Page Module
class ClientsPage {
    constructor(app) {
        this.app = app;
        this.clients = [];
        this.filteredClients = [];
    }

    async render() {
        try {
            const response = await apiService.getClients();
            this.clients = response.success ? response.data : [];
            this.filteredClients = [...this.clients];
            
            return this.getTemplate();
            
        } catch (error) {
            console.error('Error loading clients:', error);
            return this.getErrorTemplate(error);
        }
    }

    getTemplate() {
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
                                       onkeyup="clientsPage.filterClients()">
                            </div>
                            <div class="col-md-3">
                                <select class="form-select" id="clientStatusFilter" onchange="clientsPage.filterClients()">
                                    <option value="">All Status</option>
                                    <option value="ACTIVE">Active</option>
                                    <option value="INACTIVE">Inactive</option>
                                </select>
                            </div>
                            <div class="col-md-3">
                                <select class="form-select" id="clientSort" onchange="clientsPage.filterClients()">
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
                        ${this.clients.length > 0 ? `
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
                                        ${this.renderClientsTable()}
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
        `;
    }

    renderClientsTable() {
        return this.filteredClients.map(client => `
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
                        <button class="btn btn-outline-primary" onclick="clientsPage.viewClient('${client.client_id}')">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-outline-secondary" onclick="clientsPage.editClient('${client.client_id}')">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="clientsPage.deleteClient('${client.client_id}')">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    filterClients() {
        const search = document.getElementById('clientSearch')?.value.toLowerCase() || '';
        const status = document.getElementById('clientStatusFilter')?.value || '';
        const sort = document.getElementById('clientSort')?.value || 'name';
        
        this.filteredClients = this.clients.filter(client => {
            const matchesSearch = 
                (client.company_name || '').toLowerCase().includes(search) ||
                (client.contact_person || '').toLowerCase().includes(search) ||
                (client.email || '').toLowerCase().includes(search) ||
                (client.client_code || '').toLowerCase().includes(search);
            
            const matchesStatus = !status || client.status === status;
            
            return matchesSearch && matchesStatus;
        });
        
        // Sort results
        this.filteredClients.sort((a, b) => {
            if (sort === 'name') {
                return (a.company_name || '').localeCompare(b.company_name || '');
            } else if (sort === 'date') {
                return new Date(b.created_date) - new Date(a.created_date);
            }
            return 0;
        });
        
        this.updateTable();
    }

    updateTable() {
        const tableBody = document.getElementById('clientsTableBody');
        if (tableBody) {
            tableBody.innerHTML = this.renderClientsTable();
        }
    }

    getClientById(id) {
        return this.clients.find(c => c.client_id === id);
    }

    
    viewClient(clientId) {
        const client = this.getClientById(clientId);
        if (!client) {
            Utils.showNotification('Client not found', 'warning');
            return;
        }
        // Simple details modal
        const modalHtml = `
          <div class="modal fade" id="clientViewModal" tabindex="-1">
            <div class="modal-dialog modal-md">
              <div class="modal-content">
                <div class="modal-header">
                  <h5 class="modal-title">${client.company_name}</h5>
                  <button class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                  <p><strong>Contact:</strong> ${client.contact_person || ''}</p>
                  <p><strong>Email:</strong> ${client.email || ''}</p>
                  <p><strong>Phone:</strong> ${client.phone || ''}</p>
                  <p><strong>Address:</strong><br/>${client.address || ''}</p>
                </div>
                <div class="modal-footer">
                  <button class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                  <button class="btn btn-primary" onclick="clientsPage.editClient('${client.client_id}')">Edit</button>
                </div>
              </div>
            </div>
          </div>
        `;
        const container = document.createElement('div');
        container.innerHTML = modalHtml;
        document.body.appendChild(container);
        const modal = new bootstrap.Modal(document.getElementById('clientViewModal'));
        modal.show();
        document.getElementById('clientViewModal').addEventListener('hidden.bs.modal', () => container.remove());
    }

    // Opens the client form for editing (stores the client data in localStorage & navigates)
    openClientForm(client) {
        try {
            localStorage.setItem('editClient', JSON.stringify(client));
            window.location.hash = 'client-form';
        } catch (e) {
            console.error('openClientForm error:', e);
            Utils.showNotification('Failed to open edit form', 'danger');
        }
    }

    async editClient(clientId) {
        const client = this.getClientById(clientId);
        if (!client) {
            // call backend in case page's state is stale
            try {
                const res = await apiService.getClient(clientId);
                if (res && res.success) {
                    this.openClientForm(res.data);
                    return;
                }
            } catch (e) {
                console.error('Error fetching client for edit:', e);
            }
            Utils.showNotification('Client not found', 'warning');
            return;
        }
        this.openClientForm(client);
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
                // Remove from local array
                this.clients = this.clients.filter(c => c.client_id !== clientId);
                this.filteredClients = this.filteredClients.filter(c => c.client_id !== clientId);
                this.updateTable();
            } else {
                throw new Error(response.error || 'Failed to delete client');
            }
            
        } catch (error) {
            Utils.showNotification('Error: ' + error.message, 'danger');
        } finally {
            Utils.showLoading(false);
        }
    }

    showClientModal(client) {
        // Create and show a modal with client details
        const modalHtml = `
            <div class="modal fade" id="clientModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${client.company_name}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6>Contact Information</h6>
                                    <p><strong>Contact:</strong> ${client.contact_person || 'N/A'}</p>
                                    <p><strong>Email:</strong> ${client.email || 'N/A'}</p>
                                    <p><strong>Phone:</strong> ${client.phone || 'N/A'}</p>
                                </div>
                                <div class="col-md-6">
                                    <h6>Billing Information</h6>
                                    <p><strong>Status:</strong> 
                                        <span class="badge ${client.status === 'ACTIVE' ? 'bg-success' : 'bg-secondary'}">
                                            ${client.status || 'UNKNOWN'}
                                        </span>
                                    </p>
                                    <p><strong>Payment Terms:</strong> ${client.payment_terms || 30} days</p>
                                    <p><strong>Credit Limit:</strong> ${Utils.formatCurrency(client.credit_limit || 0)}</p>
                                </div>
                            </div>
                            ${client.address ? `
                                <hr>
                                <h6>Address</h6>
                                <p>${client.address}<br>
                                ${client.city ? client.city + ', ' : ''}${client.state || ''} ${client.postal_code || ''}<br>
                                ${client.country || ''}</p>
                            ` : ''}
                            ${client.notes ? `
                                <hr>
                                <h6>Notes</h6>
                                <p>${client.notes}</p>
                            ` : ''}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-primary" onclick="clientsPage.editClient('${client.client_id}')">
                                Edit Client
                            </button>
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
        const modal = new bootstrap.Modal(document.getElementById('clientModal'));
        modal.show();
        
        // Remove modal from DOM after it's hidden
        document.getElementById('clientModal').addEventListener('hidden.bs.modal', function () {
            modalContainer.remove();
        });
    }

    getErrorTemplate(error) {
        return `
            <div class="alert alert-danger">
                <h4>Error Loading Clients</h4>
                <p>${error.message}</p>
                <button class="btn btn-primary" onclick="app.loadPage('clients')">
                    Retry
                </button>
            </div>
        `;
    }

    initialize() {
        // Store reference to this instance for event handlers
        window.clientsPage = this;
        console.log('Clients page initialized');
    }
}

// Export the class
window.ClientsPage = ClientsPage;
