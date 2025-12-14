// API Service for Google Apps Script Backend
class ApiService {
  constructor() {
    // UPDATE THIS with your Google Apps Script Web App URL
    this.BASE_URL = 'https://script.google.com/macros/s/AKfycbxFMMpImLf5BdTkOihOd4RZ-Kk70smJxse8M7sHFrTElgGKXheyOPyIyY0prvPPgVD8/exec';
    this.cache = new Map();
  }

  // Generic request method (JSONP)
  // options: { showLoading: true/false }
  async request(action, data = {}, options = {}) {
    const showLoading = options.showLoading !== false;
    try {
      if (showLoading && window.Utils) window.Utils.showLoading(true);

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
          
          if (showLoading && window.Utils) window.Utils.showLoading(false);
          
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
          if (showLoading && window.Utils) window.Utils.showLoading(false);
          reject(new Error('Network error'));
        };
        
        document.head.appendChild(script);
        
        // Timeout after 30 seconds
        setTimeout(() => {
          if (script.parentNode) {
            document.head.removeChild(script);
            delete window[callbackName];
            if (showLoading && window.Utils) window.Utils.showLoading(false);
            reject(new Error('Request timeout'));
          }
        }, 30000);
      });
      
    } catch (error) {
      if (showLoading && window.Utils) window.Utils.showLoading(false);
      throw error;
    }
  }

  // Client APIs
  async addClient(clientData, options = {}) {
    return this.request('add_client', clientData, options);
  }

  async getClients(filters = {}, options = {}) {
    return this.request('get_clients', filters, options);
  }

  async getClient(clientId, options = {}) {
    return this.request('get_client', { id: clientId }, options);
  }

  async updateClient(clientData, options = {}) {
    return this.request('update_client', clientData, options);
  }

  async deleteClient(clientId, options = {}) {
    return this.request('delete_client', { id: clientId }, options);
  }

  // Invoice APIs
  async createInvoice(invoiceData, options = {}) {
    return this.request('create_invoice', invoiceData, options);
  }

  async getInvoices(filters = {}, options = {}) {
    return this.request('get_invoices', filters, options);
  }

  async getInvoice(invoiceId, options = {}) {
    return this.request('get_invoice', { id: invoiceId }, options);
  }

  async updateInvoiceStatus(data, options = {}) {
    return this.request('update_invoice_status', data, options);
  }

  async sendInvoice(invoiceId, options = {}) {
    return this.request('send_invoice', { invoice_id: invoiceId }, options);
  }

  // New: update invoice (header + items)
  async updateInvoice(invoiceData, options = {}) {
    return this.request('update_invoice', invoiceData, options);
  }

  // Billing APIs
  async addContract(contractData, options = {}) {
    return this.request('add_contract', contractData, options);
  }

  async getContracts(filters = {}, options = {}) {
    return this.request('get_contracts', filters, options);
  }

  async getContract(contractId, options = {}) {
    return this.request('get_contract', { id: contractId }, options);
  }

  async addBillingSchedule(scheduleData, options = {}) {
    return this.request('add_billing_schedule', scheduleData, options);
  }

  async getBillingSchedules(filters = {}, options = {}) {
    return this.request('get_billing_schedules', filters, options);
  }

  async updateBillingSchedule(data, options = {}) {
    return this.request('update_billing_schedule', data, options);
  }

  async pauseBillingSchedule(scheduleId, options = {}) {
    return this.request('pause_billing_schedule', { id: scheduleId }, options);
  }

  async resumeBillingSchedule(scheduleId, options = {}) {
    return this.request('resume_billing_schedule', { id: scheduleId }, options);
  }

  async getUpcomingInvoices(days = 30, options = {}) {
    return this.request('get_upcoming_invoices', { days }, options);
  }

  // Product APIs
  async addProduct(productData, options = {}) {
    return this.request('add_product', productData, options);
  }

  async getProducts(options = {}) {
    return this.request('get_products', {}, options);
  }

  // New product endpoints
  async updateProduct(productData, options = {}) {
    return this.request('update_product', productData, options);
  }

  async deleteProduct(productId, options = {}) {
    return this.request('delete_product', { id: productId }, options);
  }

  // System APIs
  async initializeSystem(options = {}) {
    return this.request('initialize_system', {}, options);
  }

  async getDashboardStats(options = {}) {
    return this.request('get_stats', {}, options);
  }

  // Receipts APIs (new)
  async addReceipt(receiptData, options = {}) {
    return this.request('add_receipt', receiptData, options);
  }

  async getReceipts(filters = {}, options = {}) {
    return this.request('get_receipts', filters, options);
  }

  async getReceipt(receiptId, options = {}) {
    return this.request('get_receipt', { id: receiptId }, options);
  }

  async deleteReceipt(receiptId, options = {}) {
    return this.request('delete_receipt', { id: receiptId }, options);
  }

  async updateReceipt(receiptData, options = {}) {
    return this.request('update_receipt', receiptData, options);
  }

  // Test connection
  async testConnection(options = {}) {
    try {
      const response = await this.request('test', {}, options);
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
