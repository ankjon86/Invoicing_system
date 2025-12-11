// API Service for Google Apps Script Backend
class ApiService {
    constructor() {
        // Your Google Apps Script Web App URL (update this!)
        this.BASE_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
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
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Process next request
        this.processQueue();
    }

    // Execute single request - FIXED for Google Apps Script
    async executeRequest({ action, data, method }) {
        Utils.showLoading(true);
        
        try {
            // Create request payload
            const payload = {
                action: action,
                data: data
            };
            
            // Use fetch with proper headers for GAS
            const response = await fetch(this.BASE_URL, {
                method: 'POST',
                mode: 'no-cors', // GAS requires no-cors for POST
                cache: 'no-cache',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: this.encodeFormData(payload)
            });

            // For no-cors mode, we can't read the response directly
            // Google Apps Script will handle the response via ContentService
            // We'll use a different approach with JSONP-like callback
            return await this.executeJsonpRequest(action, data);
            
        } catch (error) {
            Utils.showLoading(false);
            console.error('API Request Error:', error);
            
            // Fallback to iframe method for GAS
            return this.executeIframeRequest(action, data);
        }
    }

    // Alternative method for GAS using JSONP pattern
    async executeJsonpRequest(action, data) {
        return new Promise((resolve, reject) => {
            const callbackName = 'callback_' + Date.now() + '_' + Math.random().toString(36).substr(2);
            
            // Create script element
            const script = document.createElement('script');
            const url = new URL(this.BASE_URL);
            url.searchParams.append('action', action);
            url.searchParams.append('data', JSON.stringify(data));
            url.searchParams.append('callback', callbackName);
            
            // Define callback function
            window[callbackName] = (response) => {
                // Cleanup
                document.head.removeChild(script);
                delete window[callbackName];
                
                Utils.showLoading(false);
                
                // Cache GET responses
                if (action.startsWith('get_')) {
                    const cacheKey = `${action}_${JSON.stringify(data)}`;
                    this.cache.set(cacheKey, response);
                }
                
                resolve(response);
            };
            
            script.src = url.toString();
            script.onerror = () => {
                document.head.removeChild(script);
                delete window[callbackName];
                Utils.showLoading(false);
                reject(new Error('Failed to load script'));
            };
            
            document.head.appendChild(script);
            
            // Timeout after 30 seconds
            setTimeout(() => {
                if (script.parentNode) {
                    document.head.removeChild(script);
                    delete window[callbackName];
                    Utils.showLoading(false);
                    reject(new Error('Request timeout'));
                }
            }, 30000);
        });
    }

    // Fallback method using iframe (works with GAS)
    async executeIframeRequest(action, data) {
        return new Promise((resolve, reject) => {
            const iframeId = 'api-frame-' + Date.now();
            const iframe = document.createElement('iframe');
            iframe.id = iframeId;
            iframe.name = iframeId;
            iframe.style.display = 'none';
            document.body.appendChild(iframe);

            const form = document.createElement('form');
            form.method = 'POST';
            form.action = this.BASE_URL;
            form.target = iframeId;
            form.style.display = 'none';
            
            // Add form data
            const actionInput = document.createElement('input');
            actionInput.type = 'hidden';
            actionInput.name = 'action';
            actionInput.value = action;
            form.appendChild(actionInput);
            
            const dataInput = document.createElement('input');
            dataInput.type = 'hidden';
            dataInput.name = 'data';
            dataInput.value = JSON.stringify(data);
            form.appendChild(dataInput);
            
            document.body.appendChild(form);

            // Listen for iframe load
            iframe.onload = () => {
                try {
                    const responseText = iframe.contentDocument?.body?.textContent || '';
                    if (responseText) {
                        const result = JSON.parse(responseText);
                        
                        // Cache GET responses
                        if (action.startsWith('get_')) {
                            const cacheKey = `${action}_${JSON.stringify(data)}`;
                            this.cache.set(cacheKey, result);
                        }
                        
                        resolve(result);
                    } else {
                        reject(new Error('Empty response'));
                    }
                } catch (error) {
                    reject(new Error('Failed to parse response: ' + error.message));
                } finally {
                    // Cleanup
                    if (iframe.parentNode) iframe.remove();
                    if (form.parentNode) form.remove();
                    Utils.showLoading(false);
                }
            };

            iframe.onerror = () => {
                if (iframe.parentNode) iframe.remove();
                if (form.parentNode) form.remove();
                Utils.showLoading(false);
                reject(new Error('Network error'));
            };

            form.submit();
        });
    }

    // Helper method to encode form data
    encodeFormData(data) {
        const formData = new URLSearchParams();
        for (const key in data) {
            if (typeof data[key] === 'object') {
                formData.append(key, JSON.stringify(data[key]));
            } else {
                formData.append(key, data[key]);
            }
        }
        return formData.toString();
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

    // System APIs
    async initializeSystem() {
        return this.request('initialize_system', {});
    }

    async getDashboardStats() {
        return this.request('get_stats', {}, 'GET');
    }

    // Clear cache
    clearCache() {
        this.cache.clear();
        Utils.showNotification('Cache cleared', 'info');
    }

    // Test connection
    async testConnection() {
        try {
            const response = await this.request('test', {}, 'GET');
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
