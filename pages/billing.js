// Billing Page Module
class BillingPage {
    constructor(app) {
        this.app = app;
        this.contracts = [];
        this.schedules = [];
        this.upcomingInvoices = [];
    }

    async render() {
        try {
            const [contractsResponse, schedulesResponse, upcomingResponse] = await Promise.all([
                apiService.getContracts(),
                apiService.getBillingSchedules(),
                apiService.getUpcomingInvoices({ days: 30 })
            ]);

            this.contracts = contractsResponse.success ? contractsResponse.data : [];
            this.schedules = schedulesResponse.success ? schedulesResponse.data : [];
            this.upcomingInvoices = upcomingResponse.success ? upcomingResponse.data : [];

            return this.getTemplate();
            
        } catch (error) {
            console.error('Error loading billing:', error);
            return this.getErrorTemplate(error);
        }
    }

    getTemplate() {
        return `
            <div class="container-fluid">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2>Billing & Contracts</h2>
                    <div>
                        <button class="btn btn-primary me-2" onclick="billingPage.addContract()">
                            <i class="bi bi-file-earmark-plus me-1"></i> Add Contract
                        </button>
                        <button class="btn btn-success" onclick="billingPage.addBillingSchedule()">
                            <i class="bi bi-calendar-plus me-1"></i> Add Billing Schedule
                        </button>
                    </div>
                </div>
                
                <!-- Stats -->
                <div class="row mb-4">
                    <div class="col-md-3 col-sm-6 mb-3">
                        <div class="card stats-card border-primary">
                            <div class="card-body text-center">
                                <i class="bi bi-file-text text-primary mb-2" style="font-size: 2rem;"></i>
                                <h6 class="text-muted">Active Contracts</h6>
                                <h3 class="mt-2">${this.contracts.filter(c => c.status === 'ACTIVE').length}</h3>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-3 col-sm-6 mb-3">
                        <div class="card stats-card border-success">
                            <div class="card-body text-center">
                                <i class="bi bi-calendar-check text-success mb-2" style="font-size: 2rem;"></i>
                                <h6 class="text-muted">Active Schedules</h6>
                                <h3 class="mt-2">${this.schedules.filter(s => s.status === 'ACTIVE').length}</h3>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-3 col-sm-6 mb-3">
                        <div class="card stats-card border-warning">
                            <div class="card-body text-center">
                                <i class="bi bi-clock text-warning mb-2" style="font-size: 2rem;"></i>
                                <h6 class="text-muted">Upcoming Invoices</h6>
                                <h3 class="mt-2">${this.upcomingInvoices.length}</h3>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-3 col-sm-6 mb-3">
                        <div class="card stats-card border-info">
                            <div class="card-body text-center">
                                <i class="bi bi-arrow-repeat text-info mb-2" style="font-size: 2rem;"></i>
                                <h6 class="text-muted">Recurring Revenue</h6>
                                <h3 class="mt-2">${this.calculateRecurringRevenue()}</h3>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Tabs -->
                <ul class="nav nav-tabs mb-4" id="billingTabs">
                    <li class="nav-item">
                        <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#upcoming">
                            Upcoming Invoices (30 days)
                        </button>
                    </li>
                    <li class="nav-item">
                        <button class="nav-link" data-bs-toggle="tab" data-bs-target="#contracts">
                            Contracts
                        </button>
                    </li>
                    <li class="nav-item">
                        <button class="nav-link" data-bs-toggle="tab" data-bs-target="#schedules">
                            Billing Schedules
                        </button>
                    </li>
                </ul>
                
                <div class="tab-content">
                    <!-- Upcoming Invoices Tab -->
                    <div class="tab-pane fade show active" id="upcoming">
                        ${this.renderUpcomingInvoices()}
                    </div>
                    
                    <!-- Contracts Tab -->
                    <div class="tab-pane fade" id="contracts">
                        ${this.renderContracts()}
                    </div>
                    
                    <!-- Schedules Tab -->
                    <div class="tab-pane fade" id="schedules">
                        ${this.renderBillingSchedules()}
                    </div>
                </div>
            </div>
        `;
    }

    calculateRecurringRevenue() {
        const activeSchedules = this.schedules.filter(s => s.status === 'ACTIVE');
        const monthlyRevenue = activeSchedules.reduce((total, schedule) => {
            let multiplier = 1;
            
            switch(schedule.billing_frequency) {
                case 'DAILY': multiplier = 30; break;
                case 'WEEKLY': multiplier = 4.33; break;
                case 'BIWEEKLY': multiplier = 2.17; break;
                case 'MONTHLY': multiplier = 1; break;
                case 'QUARTERLY': multiplier = 0.33; break;
                case 'YEARLY': multiplier = 0.083; break;
                default: multiplier = 1;
            }
            
            return total + (schedule.billing_amount * multiplier);
        }, 0);
        
        return Utils.formatCurrency(monthlyRevenue);
    }

    renderUpcomingInvoices() {
        if (this.upcomingInvoices.length === 0) {
            return `
                <div class="card">
                    <div class="card-body text-center py-5">
                        <i class="bi bi-calendar display-1 text-muted"></i>
                        <h4 class="mt-3">No Upcoming Invoices</h4>
                        <p class="text-muted">No invoices scheduled for the next 30 days</p>
                    </div>
                </div>
            `;
        }

        return `
            <div class="card">
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Client</th>
                                    <th>Date</th>
                                    <th>Amount</th>
                                    <th>Frequency</th>
                                    <th>Contract</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.upcomingInvoices.map(invoice => `
                                    <tr>
                                        <td>
                                            <strong>${invoice.client_name}</strong>
                                            <div class="text-muted small">Client ID: ${invoice.client_id}</div>
                                        </td>
                                        <td>
                                            <strong>${Utils.formatDate(invoice.next_billing_date)}</strong>
                                            <div class="text-muted small">${this.getDaysUntil(invoice.next_billing_date)} days</div>
                                        </td>
                                        <td><strong>${Utils.formatCurrency(invoice.amount)}</strong></td>
                                        <td>
                                            <span class="badge bg-info">${invoice.frequency}</span>
                                        </td>
                                        <td>
                                            ${invoice.contract_id ? 
                                                `<span class="badge bg-secondary">${invoice.contract_id.substring(0, 8)}...</span>` : 
                                                '<span class="text-muted">No contract</span>'
                                            }
                                        </td>
                                        <td>
                                            <button class="btn btn-sm btn-outline-primary" 
                                                    onclick="billingPage.viewSchedule('${invoice.schedule_id}')">
                                                <i class="bi bi-eye"></i> View
                                            </button>
                                            <button class="btn btn-sm btn-outline-success" 
                                                    onclick="billingPage.createInvoiceFromSchedule('${invoice.schedule_id}')">
                                                <i class="bi bi-plus-circle"></i> Create Invoice
                                            </button>
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

    renderContracts() {
        if (this.contracts.length === 0) {
            return `
                <div class="card">
                    <div class="card-body text-center py-5">
                        <i class="bi bi-file-text display-1 text-muted"></i>
                        <h4 class="mt-3">No Contracts</h4>
                        <p class="text-muted mb-4">Add your first contract to get started</p>
                        <button class="btn btn-primary" onclick="billingPage.addContract()">
                            <i class="bi bi-file-earmark-plus me-2"></i>Add First Contract
                        </button>
                    </div>
                </div>
            `;
        }

        return `
            <div class="card">
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Contract #</th>
                                    <th>Name</th>
                                    <th>Client</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th>Value</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.contracts.map(contract => `
                                    <tr>
                                        <td><strong>${contract.contract_number}</strong></td>
                                        <td>${contract.contract_name}</td>
                                        <td>
                                            ${contract.client ? contract.client.company_name : 'Unknown'}
                                            <div class="text-muted small">${contract.client ? contract.client.email : ''}</div>
                                        </td>
                                        <td>${Utils.formatDate(contract.start_date)}</td>
                                        <td>${Utils.formatDate(contract.end_date)}</td>
                                        <td><strong>${Utils.formatCurrency(contract.contract_value)}</strong></td>
                                        <td>
                                            <span class="badge ${contract.status === 'ACTIVE' ? 'bg-success' : 
                                                             contract.status === 'DRAFT' ? 'bg-warning' : 'bg-secondary'}">
                                                ${contract.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div class="btn-group btn-group-sm">
                                                <button class="btn btn-outline-primary" 
                                                        onclick="billingPage.viewContract('${contract.contract_id}')">
                                                    <i class="bi bi-eye"></i>
                                                </button>
                                                <button class="btn btn-outline-secondary" 
                                                        onclick="billingPage.editContract('${contract.contract_id}')">
                                                    <i class="bi bi-pencil"></i>
                                                </button>
                                                <button class="btn btn-outline-info" 
                                                        onclick="billingPage.addScheduleToContract('${contract.contract_id}')">
                                                    <i class="bi bi-calendar-plus"></i>
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

    renderBillingSchedules() {
        if (this.schedules.length === 0) {
            return `
                <div class="card">
                    <div class="card-body text-center py-5">
                        <i class="bi bi-calendar display-1 text-muted"></i>
                        <h4 class="mt-3">No Billing Schedules</h4>
                        <p class="text-muted mb-4">Add your first billing schedule to automate invoicing</p>
                        <button class="btn btn-primary" onclick="billingPage.addBillingSchedule()">
                            <i class="bi bi-calendar-plus me-2"></i>Add First Schedule
                        </button>
                    </div>
                </div>
            `;
        }

        return `
            <div class="card">
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Client</th>
                                    <th>Frequency</th>
                                    <th>Next Billing</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Auto-generate</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.schedules.map(schedule => {
                                    const client = this.app.state.clients.find(c => c.client_id === schedule.client_id);
                                    const nextDate = new Date(schedule.next_billing_date);
                                    const daysUntil = this.getDaysUntil(schedule.next_billing_date);
                                    
                                    return `
                                        <tr>
                                            <td>
                                                <strong>${client ? client.company_name : 'Unknown'}</strong>
                                                <div class="text-muted small">${schedule.client_id.substring(0, 8)}...</div>
                                            </td>
                                            <td>
                                                <span class="badge bg-info">${schedule.billing_frequency}</span>
                                                <div class="text-muted small">${schedule.billing_cycle}</div>
                                            </td>
                                            <td>
                                                <strong>${Utils.formatDate(schedule.next_billing_date)}</strong>
                                                <div class="text-muted small ${daysUntil <= 7 ? 'text-warning' : ''}">
                                                    ${daysUntil} days
                                                </div>
                                            </td>
                                            <td><strong>${Utils.formatCurrency(schedule.billing_amount)}</strong></td>
                                            <td>
                                                <span class="badge ${schedule.status === 'ACTIVE' ? 'bg-success' : 
                                                                 schedule.status === 'PAUSED' ? 'bg-warning' : 'bg-secondary'}">
                                                    ${schedule.status}
                                                </span>
                                            </td>
                                            <td>
                                                ${schedule.auto_generate ? 
                                                    '<i class="bi bi-check-circle text-success"></i> Yes' : 
                                                    '<i class="bi bi-x-circle text-danger"></i> No'
                                                }
                                            </td>
                                            <td>
                                                <div class="btn-group btn-group-sm">
                                                    <button class="btn btn-outline-primary" 
                                                            onclick="billingPage.viewSchedule('${schedule.schedule_id}')">
                                                        <i class="bi bi-eye"></i>
                                                    </button>
                                                    <button class="btn btn-outline-secondary" 
                                                            onclick="billingPage.editSchedule('${schedule.schedule_id}')">
                                                        <i class="bi bi-pencil"></i>
                                                    </button>
                                                    ${schedule.status === 'ACTIVE' ? 
                                                        `<button class="btn btn-outline-warning" 
                                                                onclick="billingPage.pauseSchedule('${schedule.schedule_id}')">
                                                            <i class="bi bi-pause"></i>
                                                        </button>` :
                                                        `<button class="btn btn-outline-success" 
                                                                onclick="billingPage.resumeSchedule('${schedule.schedule_id}')">
                                                            <i class="bi bi-play"></i>
                                                        </button>`
                                                    }
                                                    <button class="btn btn-outline-info" 
                                                            onclick="billingPage.createInvoiceFromSchedule('${schedule.schedule_id}')">
                                                        <i class="bi bi-plus-circle"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    getDaysUntil(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const diffTime = date - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Action Methods
    async viewContract(contractId) {
        try {
            const response = await apiService.getContract(contractId);
            if (response.success) {
                this.showContractModal(response.data);
            }
        } catch (error) {
            Utils.showNotification('Error loading contract details', 'danger');
        }
    }

    async viewSchedule(scheduleId) {
        Utils.showNotification('View schedule feature coming soon!', 'info');
    }

    async pauseSchedule(scheduleId) {
        if (confirm('Are you sure you want to pause this billing schedule?')) {
            try {
                const response = await apiService.pauseBillingSchedule(scheduleId);
                if (response.success) {
                    Utils.showNotification('Billing schedule paused', 'success');
                    this.app.loadPage('billing');
                }
            } catch (error) {
                Utils.showNotification('Error pausing schedule', 'danger');
            }
        }
    }

    async resumeSchedule(scheduleId) {
        try {
            const response = await apiService.resumeBillingSchedule(scheduleId);
            if (response.success) {
                Utils.showNotification('Billing schedule resumed', 'success');
                this.app.loadPage('billing');
            }
        } catch (error) {
            Utils.showNotification('Error resuming schedule', 'danger');
        }
    }

    async createInvoiceFromSchedule(scheduleId) {
        if (confirm('Create invoice from this schedule now?')) {
            Utils.showNotification('Invoice creation from schedule coming soon!', 'info');
            // You would call an API endpoint to generate invoice from schedule
        }
    }

    addContract() {
        Utils.showNotification('Add contract feature coming soon!', 'info');
    }

    addBillingSchedule() {
        Utils.showNotification('Add billing schedule feature coming soon!', 'info');
    }

    editContract(contractId) {
        Utils.showNotification('Edit contract feature coming soon!', 'info');
    }

    editSchedule(scheduleId) {
        Utils.showNotification('Edit schedule feature coming soon!', 'info');
    }

    addScheduleToContract(contractId) {
        Utils.showNotification('Add schedule to contract feature coming soon!', 'info');
    }

    showContractModal(contract) {
        const modalHtml = `
            <div class="modal fade" id="contractModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${contract.contract_name} (${contract.contract_number})</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6>Contract Details</h6>
                                    <p><strong>Status:</strong> 
                                        <span class="badge ${contract.status === 'ACTIVE' ? 'bg-success' : 
                                                         contract.status === 'DRAFT' ? 'bg-warning' : 'bg-secondary'}">
                                            ${contract.status}
                                        </span>
                                    </p>
                                    <p><strong>Start Date:</strong> ${Utils.formatDate(contract.start_date)}</p>
                                    <p><strong>End Date:</strong> ${Utils.formatDate(contract.end_date)}</p>
                                    <p><strong>Value:</strong> ${Utils.formatCurrency(contract.contract_value)}</p>
                                </div>
                                <div class="col-md-6">
                                    <h6>Client Information</h6>
                                    ${contract.client ? `
                                        <p><strong>Company:</strong> ${contract.client.company_name}</p>
                                        <p><strong>Contact:</strong> ${contract.client.contact_person}</p>
                                        <p><strong>Email:</strong> ${contract.client.email}</p>
                                        <p><strong>Phone:</strong> ${contract.client.phone || 'N/A'}</p>
                                    ` : '<p class="text-muted">Client information not available</p>'}
                                </div>
                            </div>
                            ${contract.terms_conditions ? `
                                <hr>
                                <h6>Terms & Conditions</h6>
                                <div class="bg-light p-3 rounded">
                                    ${contract.terms_conditions}
                                </div>
                            ` : ''}
                            ${contract.billing_schedules && contract.billing_schedules.length > 0 ? `
                                <hr>
                                <h6>Billing Schedules</h6>
                                <div class="table-responsive">
                                    <table class="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>Frequency</th>
                                                <th>Amount</th>
                                                <th>Next Billing</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${contract.billing_schedules.map(schedule => `
                                                <tr>
                                                    <td>${schedule.billing_frequency}</td>
                                                    <td>${Utils.formatCurrency(schedule.billing_amount)}</td>
                                                    <td>${Utils.formatDate(schedule.next_billing_date)}</td>
                                                    <td>
                                                        <span class="badge ${schedule.status === 'ACTIVE' ? 'bg-success' : 'bg-secondary'}">
                                                            ${schedule.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            ` : ''}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-primary" onclick="billingPage.editContract('${contract.contract_id}')">
                                Edit Contract
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
        const modal = new bootstrap.Modal(document.getElementById('contractModal'));
        modal.show();
        
        // Remove modal from DOM after it's hidden
        document.getElementById('contractModal').addEventListener('hidden.bs.modal', function () {
            modalContainer.remove();
        });
    }

    getErrorTemplate(error) {
        return `
            <div class="alert alert-danger">
                <h4>Error Loading Billing Information</h4>
                <p>${error.message}</p>
                <button class="btn btn-primary" onclick="app.loadPage('billing')">
                    Retry
                </button>
            </div>
        `;
    }

    initialize() {
        // Store reference to this instance for event handlers
        window.billingPage = this;
        
        // Initialize tab functionality
        setTimeout(() => {
            const triggerTabList = [].slice.call(document.querySelectorAll('#billingTabs button'));
            triggerTabList.forEach(triggerEl => {
                const tabTrigger = new bootstrap.Tab(triggerEl);
                triggerEl.addEventListener('click', event => {
                    event.preventDefault();
                    tabTrigger.show();
                });
            });
        }, 100);
        
        console.log('Billing page initialized');
    }
}

// Export the class
window.BillingPage = BillingPage;
