// API Service for Google Apps Script Backend
class ApiService {
  constructor() {
    // UPDATE THIS with your Google Apps Script Web App URL
    this.BASE_URL = 'https://script.google.com/macros/s/AKfycbxFMMpImLf5BdTkOihOd4RZ-Kk70smJxse8M7sHFrTElgGKXheyOPyIyY0prvPPgVD8/exec';
    this.cache = new Map();
  }

  // Generic request method (JSONP)
  async request(action, data = {}) {
    try {
      if (window.Utils) window.Utils.showLoading(true);

      return new Promise((resolve, reject) => {
        const callbackName = 'callback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        const script = document.createElement('script');
        const url = new URL(this.BASE_URL);
        url.searchParams.append('action', action);
        url.searchParams.append('data', JSON.stringify(data));
        url.searchParams.append('callback', callbackName);
        
        window[callbackName] = (response) => {
          // Cleanup
          if (script.parentNode) document.head.removeChild(script);
          delete window[callbackName];
          
          if (window.Utils) window.Utils.showLoading(false);
          
          if (response && response.success) {
            const cacheKey = `${action}_${JSON.stringify(data)}`;
            this.cache.set(cacheKey, response);
            resolve(response);
          } else {
            reject(new Error((response && response.error) || 'API request failed'));
          }
        };
        
        script.src = url.toString();
        script.onerror = () => {
          if (script.parentNode) document.head.removeChild(script);
          delete window[callbackName];
          if (window.Utils) window.Utils.showLoading(false);
          reject(new Error('Network error'));
        };
        
        document.head.appendChild(script);
        
        // Timeout after 30 seconds
        setTimeout(() => {
          if (script.parentNode) {
            document.head.removeChild(script);
            delete window[callbackName];
            if (window.Utils) window.Utils.showLoading(false);
            reject(new Error('Request timeout'));
          }
        }, 30000);
      });
      
    } catch (error) {
      if (window.Utils) window.Utils.showLoading(false);
      throw error;
    }
  }

  // Client APIs
  async addClient(clientData) {
    return this.request('add_client', clientData);
  }

  async getClients(filters = {}) {
    return this.request('get_clients', filters);
  }

  async getClient(clientId) {
    return this.request('get_client', { id: clientId });
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
    return this.request('get_invoices', filters);
  }

  async getInvoice(invoiceId) {
    return this.request('get_invoice', { id: invoiceId });
  }

  async updateInvoiceStatus(data) {
    return this.request('update_invoice_status', data);
  }

  async sendInvoice(invoiceId) {
    return this.request('send_invoice', { invoice_id: invoiceId });
  }

  // Billing APIs
  async addContract(contractData) {
    return this.request('add_contract', contractData);
  }

  async getContracts(filters = {}) {
    return this.request('get_contracts', filters);
  }

  async addBillingSchedule(scheduleData) {
    return this.request('add_billing_schedule', scheduleData);
  }

  async getBillingSchedules(filters = {}) {
    return this.request('get_billing_schedules', filters);
  }

  async updateBillingSchedule(data) {
    return this.request('update_billing_schedule', data);
  }

  async pauseBillingSchedule(scheduleId) {
    return this.request('pause_billing_schedule', { id: scheduleId });
  }

  async resumeBillingSchedule(scheduleId) {
    return this.request('resume_billing_schedule', { id: scheduleId });
  }

  async getUpcomingInvoices(days = 30) {
    return this.request('get_upcoming_invoices', { days });
  }

  // Product APIs
  async addProduct(productData) {
    return this.request('add_product', productData);
  }

  async getProducts() {
    return this.request('get_products', {});
  }

  // System APIs
  async initializeSystem() {
    return this.request('initialize_system', {});
  }

  async getDashboardStats() {
    return this.request('get_stats', {});
  }

  // Receipts APIs (new)
  async addReceipt(receiptData) {
    return this.request('add_receipt', receiptData);
  }

  async getReceipts(filters = {}) {
    return this.request('get_receipts', filters);
  }

  async getReceipt(receiptId) {
    return this.request('get_receipt', { id: receiptId });
  }

  async deleteReceipt(receiptId) {
    return this.request('delete_receipt', { id: receiptId });
  }

  // Test connection
  async testConnection() {
    try {
      const response = await this.request('test', {});
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
