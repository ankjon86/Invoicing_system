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
            const [contractsResponse, schedulesResponse, upcomingResponse, template] = await Promise.all([
                apiService.getContracts(),
                apiService.getBillingSchedules(),
                apiService.getUpcomingInvoices({ days: 30 }),
                Utils.loadTemplate('templates/billing.html')
            ]);

            this.contracts = contractsResponse.success ? contractsResponse.data : [];
            this.schedules = schedulesResponse.success ? schedulesResponse.data : [];
            this.upcomingInvoices = upcomingResponse.success ? upcomingResponse.data : [];

            const statsHtml = this.renderTopStats();
            const upcomingHtml = this.renderUpcomingInvoices();
            const contractsHtml = this.renderContracts();
            const schedulesHtml = this.renderBillingSchedules();

            return Utils.renderTemplate(template, {
                'STATS': statsHtml,
                'UPCOMING_INVOICES': upcomingHtml,
                'CONTRACTS': contractsHtml,
                'SCHEDULES': schedulesHtml
            });

        } catch (error) {
            console.error('Error loading billing:', error);
            return this.getErrorTemplate(error);
        }
    }

    renderTopStats() {
        return `
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
        `;
    }

    calculateRecurringRevenue() {
        const activeSchedules = this.schedules.filter(s => s.status === 'ACTIVE');
        const monthlyRevenue = activeSchedules.reduce((total, schedule) => {
            let multiplier = 1;
            
            switch((schedule.billing_frequency || '').toUpperCase()) {
                case 'DAILY': multiplier = 30; break;
                case 'WEEKLY': multiplier = 4.33; break;
                case 'BIWEEKLY': multiplier = 2.17; break;
                case 'MONTHLY': multiplier = 1; break;
                case 'QUARTERLY': multiplier = 0.33; break;
                case 'YEARLY': multiplier = 0.083; break;
                default: multiplier = 1;
            }
            
            return total + ((parseFloat(schedule.billing_amount) || 0) * multiplier);
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
                                    const nextDate = new Date(schedule.next_billing_date || new Date());
                                    const daysUntil = this.getDaysUntil(schedule.next_billing_date || new Date());
                                    
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

    // Action Methods (full implementations)

    async viewContract(contractId) {
        try {
            const response = await apiService.getContract(contractId);
            if (response.success) {
                this.showContractModal(response.data);
            } else {
                Utils.showNotification('Contract not found', 'warning');
            }
        } catch (error) {
            Utils.showNotification('Error loading contract details', 'danger');
        }
    }

    async viewSchedule(scheduleId) {
        try {
            const response = await apiService.getBillingSchedules();
            if (response.success) {
                const schedule = response.data.find(s => s.schedule_id === scheduleId);
                if (schedule) {
                    this.showScheduleModal(schedule);
                } else {
                    Utils.showNotification('Schedule not found', 'warning');
                }
            } else {
                Utils.showNotification('Error loading schedule details', 'danger');
            }
        } catch (error) {
            Utils.showNotification('Error loading schedule details', 'danger');
        }
    }

    async pauseSchedule(scheduleId) {
        if (confirm('Are you sure you want to pause this billing schedule?')) {
            try {
                const response = await apiService.pauseBillingSchedule(scheduleId);
                if (response.success) {
                    Utils.showNotification('Billing schedule paused', 'success');
                    this.app.loadPage('billing');
                } else {
                    throw new Error(response.error || 'Failed to pause schedule');
                }
            } catch (error) {
                Utils.showNotification('Error pausing schedule: ' + error.message, 'danger');
            }
        }
    }

    async resumeSchedule(scheduleId) {
        try {
            const response = await apiService.resumeBillingSchedule(scheduleId);
            if (response.success) {
                Utils.showNotification('Billing schedule resumed', 'success');
                this.app.loadPage('billing');
            } else {
                throw new Error(response.error || 'Failed to resume schedule');
            }
        } catch (error) {
            Utils.showNotification('Error resuming schedule: ' + error.message, 'danger');
        }
    }

    async createInvoiceFromSchedule(scheduleId) {
        try {
            if (!confirm('Create invoice from this schedule now? This will generate an invoice for the current billing period.')) {
                return;
            }
            Utils.showLoading(true);

            const schedulesResponse = await apiService.getBillingSchedules();
            if (!schedulesResponse.success) throw new Error('Failed to get schedule details');

            const schedule = schedulesResponse.data.find(s => s.schedule_id === scheduleId);
            if (!schedule) throw new Error('Schedule not found');

            const clientResponse = await apiService.getClient(schedule.client_id);
            if (!clientResponse.success) throw new Error('Failed to get client details');

            const client = clientResponse.data;

            const today = new Date();
            const dueDate = new Date(today);
            dueDate.setDate(today.getDate() + (client.payment_terms || 30));

            const invoiceData = {
                client_id: schedule.client_id,
                date: today.toISOString().split('T')[0],
                due_date: dueDate.toISOString().split('T')[0],
                currency: client.currency || 'GHS',
                notes: `Auto-generated from billing schedule ${schedule.schedule_id}`,
                items: []
            };

            if (schedule.items && Array.isArray(schedule.items) && schedule.items.length > 0) {
                invoiceData.items = schedule.items.map(item => ({
                    description: item.description || `Service - ${schedule.billing_frequency}`,
                    quantity: item.quantity || schedule.quantity || 1,
                    unit_price: item.unit_price || schedule.billing_amount,
                    tax_rate: item.tax_rate || schedule.tax_rate || 0
                }));
            } else {
                invoiceData.items.push({
                    description: schedule.bill_description || `Recurring service - ${schedule.billing_frequency}`,
                    quantity: schedule.quantity || 1,
                    unit_price: schedule.billing_amount,
                    tax_rate: schedule.tax_rate || 0
                });
            }

            const invoiceResponse = await apiService.createInvoice(invoiceData);

            if (invoiceResponse.success) {
                await this.updateNextBillingDate(schedule);
                Utils.showNotification(`Invoice ${invoiceResponse.data.invoiceNumber} created successfully!`, 'success');

                if (confirm('Invoice created successfully! Would you like to view it now?')) {
                    this.viewGeneratedInvoice(invoiceResponse.data.invoiceId || invoiceResponse.data.invoice_id);
                }
            } else {
                throw new Error(invoiceResponse.error || 'Failed to create invoice');
            }

        } catch (error) {
            console.error('Error creating invoice from schedule:', error);
            Utils.showNotification(`Error: ${error.message}`, 'danger');
        } finally {
            Utils.showLoading(false);
        }
    }

    async updateNextBillingDate(schedule) {
        try {
            const nextDate = this.calculateNextBillingDate(
                schedule.billing_frequency,
                schedule.billing_day,
                schedule.billing_cycle,
                schedule.next_billing_date || new Date()
            );

            const updateData = {
                schedule_id: schedule.schedule_id,
                last_billed_date: new Date().toISOString().split('T')[0],
                next_billing_date: nextDate.toISOString().split('T')[0],
                cycles_completed: (schedule.cycles_completed || 0) + 1,
                last_modified: new Date().toISOString()
            };

            // Attempt to update via API if available
            try {
                const updateResponse = await apiService.updateBillingSchedule(updateData);
                if (!updateResponse.success) {
                    console.warn('Failed to update schedule via API:', updateResponse.error);
                }
            } catch (err) {
                console.warn('updateBillingSchedule API not available or failed:', err);
            }

        } catch (error) {
            console.error('Error updating next billing date:', error);
        }
    }

    calculateNextBillingDate(frequency, billingDay = 1, billingCycle = 'END_OF_MONTH', fromDate = null) {
        const date = fromDate ? new Date(fromDate) : new Date();
        
        switch((frequency || '').toUpperCase()) {
            case 'DAILY':
                date.setDate(date.getDate() + 1);
                break;
                
            case 'WEEKLY':
                date.setDate(date.getDate() + 7);
                break;
                
            case 'BIWEEKLY':
                date.setDate(date.getDate() + 14);
                break;
                
            case 'MONTHLY':
                date.setMonth(date.getMonth() + 1);
                if (billingCycle === 'FIRST_OF_MONTH') {
                    date.setDate(1);
                } else if (billingCycle === 'END_OF_MONTH') {
                    date.setMonth(date.getMonth() + 1);
                    date.setDate(0); // Last day of next month
                } else {
                    const day = parseInt(billingDay) || 1;
                    date.setDate(Math.min(day, this.getDaysInMonth(date)));
                }
                break;
                
            case 'QUARTERLY':
                date.setMonth(date.getMonth() + 3);
                if (billingCycle === 'FIRST_OF_QUARTER') {
                    const quarterStartMonth = Math.floor(date.getMonth() / 3) * 3;
                    date.setMonth(quarterStartMonth);
                    date.setDate(1);
                } else {
                    const day = parseInt(billingDay) || 1;
                    date.setDate(Math.min(day, this.getDaysInMonth(date)));
                }
                break;
                
            case 'YEARLY':
                date.setFullYear(date.getFullYear() + 1);
                const day = parseInt(billingDay) || 1;
                date.setDate(Math.min(day, this.getDaysInMonth(date)));
                break;
                
            default:
                // Custom number of days
                const days = parseInt(frequency) || 30;
                date.setDate(date.getDate() + days);
        }
        
        return date;
    }

    getDaysInMonth(date) {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    }

    async viewGeneratedInvoice(invoiceId) {
        try {
            const response = await apiService.getInvoice(invoiceId);
            if (response.success) {
                this.showInvoiceModal(response.data);
            } else {
                Utils.showNotification('Invoice created but could not load details', 'warning');
            }
        } catch (error) {
            console.error('Error loading invoice:', error);
            Utils.showNotification('Error loading invoice details', 'danger');
        }
    }

    showScheduleModal(schedule) {
        const client = this.app.state.clients.find(c => c.client_id === schedule.client_id);
        
        const modalHtml = `
            <div class="modal fade" id="scheduleModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Billing Schedule Details</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6>Schedule Information</h6>
                                    <p><strong>Schedule ID:</strong> ${schedule.schedule_id.substring(0, 12)}...</p>
                                    <p><strong>Frequency:</strong> <span class="badge bg-info">${schedule.billing_frequency}</span></p>
                                    <p><strong>Status:</strong> 
                                        <span class="badge ${schedule.status === 'ACTIVE' ? 'bg-success' : 
                                                         schedule.status === 'PAUSED' ? 'bg-warning' : 'bg-secondary'}">
                                            ${schedule.status}
                                        </span>
                                    </p>
                                    <p><strong>Auto-generate:</strong> ${schedule.auto_generate ? 'Yes' : 'No'}</p>
                                </div>
                                <div class="col-md-6">
                                    <h6>Billing Details</h6>
                                    <p><strong>Next Billing Date:</strong> ${Utils.formatDate(schedule.next_billing_date)}</p>
                                    <p><strong>Last Billed Date:</strong> ${schedule.last_billed_date ? Utils.formatDate(schedule.last_billed_date) : 'Never'}</p>
                                    <p><strong>Amount:</strong> ${Utils.formatCurrency(schedule.billing_amount)}</p>
                                    <p><strong>Cycles:</strong> ${schedule.cycles_completed || 0} / ${schedule.total_cycles || '∞'}</p>
                                </div>
                            </div>
                            
                            <div class="row mt-3">
                                <div class="col-12">
                                    <h6>Client Information</h6>
                                    ${client ? `
                                        <p><strong>Company:</strong> ${client.company_name}</p>
                                        <p><strong>Contact:</strong> ${client.contact_person}</p>
                                        <p><strong>Email:</strong> ${client.email}</p>
                                    ` : '<p class="text-muted">Client information not available</p>'}
                                </div>
                            </div>
                            
                            ${schedule.items && schedule.items.length > 0 ? `
                                <hr>
                                <h6>Schedule Items</h6>
                                <div class="table-responsive">
                                    <table class="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>Description</th>
                                                <th>Quantity</th>
                                                <th>Unit Price</th>
                                                <th>Tax Rate</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${schedule.items.map(item => `
                                                <tr>
                                                    <td>${item.description || 'Service'}</td>
                                                    <td>${item.quantity || 1}</td>
                                                    <td>${Utils.formatCurrency(item.unit_price || schedule.billing_amount)}</td>
                                                    <td>${item.tax_rate || schedule.tax_rate || 0}%</td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            ` : ''}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-primary" onclick="billingPage.createInvoiceFromSchedule('${schedule.schedule_id}')">
                                <i class="bi bi-plus-circle me-1"></i>Create Invoice Now
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHtml;
        document.body.appendChild(modalContainer);
        
        const modal = new bootstrap.Modal(document.getElementById('scheduleModal'));
        modal.show();
        
        document.getElementById('scheduleModal').addEventListener('hidden.bs.modal', function () {
            modalContainer.remove();
        });
    }

    showInvoiceModal(invoice) {
        const modalHtml = `
            <div class="modal fade" id="invoiceModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Invoice ${invoice.invoice_number}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row mb-4">
                                <div class="col-md-6">
                                    <h6>Invoice Details</h6>
                                    <p><strong>Status:</strong> 
                                        <span class="badge ${invoice.status === 'PAID' ? 'bg-success' : 'bg-warning'}">
                                            ${invoice.status}
                                        </span>
                                    </p>
                                    <p><strong>Date:</strong> ${Utils.formatDate(invoice.date)}</p>
                                    <p><strong>Due Date:</strong> ${Utils.formatDate(invoice.due_date)}</p>
                                    <p><strong>Total:</strong> ${Utils.formatCurrency(invoice.total)}</p>
                                </div>
                                <div class="col-md-6">
                                    <h6>Client Information</h6>
                                    ${invoice.client ? `
                                        <p><strong>Company:</strong> ${invoice.client.company_name}</p>
                                        <p><strong>Contact:</strong> ${invoice.client.contact_person}</p>
                                        <p><strong>Email:</strong> ${invoice.client.email}</p>
                                    ` : '<p class="text-muted">Client information not available</p>'}
                                </div>
                            </div>
                            
                            ${invoice.items && invoice.items.length > 0 ? `
                                <h6>Items</h6>
                                <div class="table-responsive">
                                    <table class="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>Description</th>
                                                <th>Quantity</th>
                                                <th>Unit Price</th>
                                                <th>Tax</th>
                                                <th>Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${invoice.items.map(item => {
                                                const amount = (item.quantity || 1) * (item.unit_price || 0);
                                                const tax = amount * ((item.tax_rate || 0) / 100);
                                                return `
                                                    <tr>
                                                        <td>${item.description}</td>
                                                        <td>${item.quantity || 1}</td>
                                                        <td>${Utils.formatCurrency(item.unit_price || 0)}</td>
                                                        <td>${item.tax_rate || 0}%</td>
                                                        <td>${Utils.formatCurrency(amount)}</td>
                                                    </tr>
                                                `;
                                            }).join('')}
                                            <tr class="table-light">
                                                <td colspan="4" class="text-end"><strong>Subtotal:</strong></td>
                                                <td><strong>${Utils.formatCurrency(invoice.subtotal || 0)}</strong></td>
                                            </tr>
                                            <tr class="table-light">
                                                <td colspan="4" class="text-end"><strong>Tax:</strong></td>
                                                <td><strong>${Utils.formatCurrency(invoice.tax || 0)}</strong></td>
                                            </tr>
                                            <tr class="table-success">
                                                <td colspan="4" class="text-end"><strong>Total:</strong></td>
                                                <td><strong>${Utils.formatCurrency(invoice.total || 0)}</strong></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            ` : ''}
                            
                            ${invoice.notes ? `
                                <hr>
                                <h6>Notes</h6>
                                <div class="bg-light p-3 rounded">
                                    ${invoice.notes}
                                </div>
                            ` : ''}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-primary" onclick="app.loadPage('invoices')">
                                View All Invoices
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHtml;
        document.body.appendChild(modalContainer);
        
        const modal = new bootstrap.Modal(document.getElementById('invoiceModal'));
        modal.show();
        
        document.getElementById('invoiceModal').addEventListener('hidden.bs.modal', function () {
            modalContainer.remove();
        });
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
        
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHtml;
        document.body.appendChild(modalContainer);
        
        const modal = new bootstrap.Modal(document.getElementById('contractModal'));
        modal.show();
        
        document.getElementById('contractModal').addEventListener('hidden.bs.modal', function () {
            modalContainer.remove();
        });
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
