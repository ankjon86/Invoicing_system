// API Service for Google Apps Script Backend
class ApiService {
    constructor() {
        // Replace with your Google Apps Script Web App URL
        this.BASE_URL = 'https://script.google.com/macros/s/ABCDEFG1234567/exec';
        this.cache = new Map();
        this.requestQueue = [];
        this.isProcessingQueue = false;
    }

    // Generic request method
    async request(action, data = {}, method = 'POST') {
        // Check cache first for GET requests
        if (method === 'GET') {
            const cacheKey = `${action}_${JSON.stringify(data)}`;
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }
        }

        // Add to queue to prevent rate limiting
        return new Promise((resolve, reject) => {
            this.requestQueue.push({
                action,
                data,
                method,
                resolve,
                reject
            });
            
            if (!this.isProcessingQueue) {
                this.processQueue();
            }
        });
    }

    // Process request queue with delay
    async processQueue() {
        if (this.requestQueue.length === 0) {
            this.isProcessingQueue = false;
            return;
        }

        this.isProcessingQueue = true;
        const request = this.requestQueue.shift();

        try {
            const result = await this.executeRequest(request);
            request.resolve(result);
        } catch (error) {
            request.reject(error);
        }

        // Delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Process next request
        this.processQueue();
    }

    // Execute single request
    async executeRequest({ action, data, method }) {
        Utils.showLoading(true);
        
        try {
            // Create form data
            const formData = new FormData();
            formData.append('action', action);
            formData.append('data', JSON.stringify(data));
            formData.append('timestamp', Date.now());

            // Create iframe for response
            const iframeId = `api-frame-${Date.now()}`;
            const iframe = document.createElement('iframe');
            iframe.id = iframeId;
            iframe.name = iframeId;
            iframe.style.display = 'none';
            document.body.appendChild(iframe);

            // Create form
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = this.BASE_URL;
            form.target = iframeId;
            form.style.display = 'none';
            
            // Add form data
            for (const [key, value] of formData.entries()) {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                input.value = value;
                form.appendChild(input);
            }
            
            document.body.appendChild(form);

            // Wait for response
            const response = await new Promise((resolve, reject) => {
                iframe.onload = () => {
                    try {
                        const responseText = iframe.contentDocument.body.textContent;
                        const result = JSON.parse(responseText);
                        
                        // Cache GET responses
                        if (method === 'GET' && result.success) {
                            const cacheKey = `${action}_${JSON.stringify(data)}`;
                            this.cache.set(cacheKey, result);
                        }
                        
                        resolve(result);
                    } catch (error) {
                        reject(new Error('Failed to parse response'));
                    } finally {
                        // Cleanup
                        if (iframe.parentNode) iframe.remove();
                        if (form.parentNode) form.remove();
                    }
                };

                iframe.onerror = () => {
                    reject(new Error('Network error'));
                    if (iframe.parentNode) iframe.remove();
                    if (form.parentNode) form.remove();
                };

                form.submit();
            });

            Utils.showLoading(false);
            return response;

        } catch (error) {
            Utils.showLoading(false);
            console.error('API Request Error:', error);
            
            // Show user-friendly error message
            let errorMessage = 'Network error. Please check your connection.';
            if (error.message.includes('Failed to parse')) {
                errorMessage = 'Server response error. Please try again.';
            }
            
            Utils.showNotification(errorMessage, 'danger');
            throw error;
        }
    }

    // Billing APIs
async addContract(contractData) {
    return this.request('add_contract', contractData);
}

async getContracts(filters = {}) {
    return this.request('get_contracts', filters, 'GET');
}

async getContract(contractId) {
    return this.request('get_contract', { id: contractId }, 'GET');
}

async updateContractStatus(contractId, status) {
    return this.request('update_contract_status', { id: contractId, status });
}

async addBillingSchedule(scheduleData) {
    return this.request('add_billing_schedule', scheduleData);
}

async getBillingSchedules(filters = {}) {
    return this.request('get_billing_schedules', filters, 'GET');
}

async updateBillingSchedule(scheduleId, updates) {
    return this.request('update_billing_schedule', { id: scheduleId, updates });
}

async pauseBillingSchedule(scheduleId) {
    return this.request('pause_billing_schedule', { id: scheduleId });
}

async resumeBillingSchedule(scheduleId) {
    return this.request('resume_billing_schedule', { id: scheduleId });
}

async getUpcomingInvoices(filters = {}) {
    return this.request('get_upcoming_invoices', filters, 'GET');
}

async getClientBillingHistory(clientId) {
    return this.request('get_client_billing_history', { client_id: clientId }, 'GET');
}

async processDueInvoices() {
    return this.request('process_due_invoices', {});
}

    // Client APIs
    async addClient(clientData) {
        return this.request('add_client', clientData);
    }

    async getClients(filters = {}) {
        return this.request('get_clients', filters, 'GET');
    }

    async getClient(clientId) {
        return this.request('get_client', { id: clientId }, 'GET');
    }

    async updateClient(clientData) {
        return this.request('update_client', clientData);
    }

    async deleteClient(clientId) {
        return this.request('delete_client', { id: clientId });
    }

    // Invoice APIs
    async createInvoice(invoiceData) {
        return this.request('create_invoice', invoiceData);
    }

    async getInvoices(filters = {}) {
        return this.request('get_invoices', filters, 'GET');
    }

    async getInvoice(invoiceId) {
        return this.request('get_invoice', { id: invoiceId }, 'GET');
    }

    async updateInvoiceStatus(data) {
        return this.request('update_invoice_status', data);
    }

    async sendInvoice(invoiceId) {
        return this.request('send_invoice', { invoice_id: invoiceId });
    }

    async downloadInvoicePDF(invoiceId) {
        return this.request('download_invoice', { invoice_id: invoiceId });
    }

    // Product APIs
    async addProduct(productData) {
        return this.request('add_product', productData);
    }

    async getProducts() {
        return this.request('get_products', {}, 'GET');
    }

    async updateProduct(productData) {
        return this.request('update_product', productData);
    }

    async deleteProduct(productId) {
        return this.request('delete_product', { id: productId });
    }

    // Billing APIs
    async addBillingSchedule(scheduleData) {
        return this.request('add_billing_schedule', scheduleData);
    }

    async getBillingSchedules() {
        return this.request('get_billing_schedules', {}, 'GET');
    }

    async updateBillingSchedule(data) {
        return this.request('update_billing_schedule', data);
    }

    // System APIs
    async initializeSystem() {
        return this.request('initialize_system', {});
    }

    async getDashboardStats() {
        return this.request('get_stats', {}, 'GET');
    }

    async getReports(timeframe = 'monthly') {
        return this.request('get_reports', { timeframe }, 'GET');
    }

    async exportData(type) {
        return this.request('export_data', { type });
    }

    // Clear cache
    clearCache() {
        this.cache.clear();
        Utils.showNotification('Cache cleared', 'info');
    }

    // Test connection
    async testConnection() {
        try {
            const response = await this.getDashboardStats();
            return {
                connected: response.success,
                message: response.success ? 'Connected to server' : 'Connection failed'
            };
        } catch (error) {
            return {
                connected: false,
                message: 'Connection failed: ' + error.message
            };
        }
    }
}

// Create global API instance
window.apiService = new ApiService();
