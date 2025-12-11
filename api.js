// API Service for Google Apps Script Backend
class ApiService {
  constructor() {
    // UPDATE THIS with your Google Apps Script Web App URL
    this.BASE_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
    this.cache = new Map();
  }

  // Generic request method
  async request(action, data = {}) {
    try {
      // Show loading indicator
      if (window.Utils) window.Utils.showLoading(true);

      // Use JSONP for cross-domain requests
      return new Promise((resolve, reject) => {
        const callbackName = 'callback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
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
          
          if (window.Utils) window.Utils.showLoading(false);
          
          if (response.success) {
            // Cache responses
            const cacheKey = `${action}_${JSON.stringify(data)}`;
            this.cache.set(cacheKey, response);
            resolve(response);
          } else {
            reject(new Error(response.error || 'API request failed'));
          }
        };
        
        script.src = url.toString();
        script.onerror = () => {
          document.head.removeChild(script);
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

  async getUpcomingInvoices(days = 30) {
    return this.request('get_upcoming_invoices', { days });
  }

  // System APIs
  async initializeSystem() {
    return this.request('initialize_system', {});
  }

  async getDashboardStats() {
    return this.request('get_stats', {});
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
