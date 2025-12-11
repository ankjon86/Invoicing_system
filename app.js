// Main Application
class InvoiceApp {
  constructor() {
    this.currentPage = 'dashboard';
    this.state = {
      clients: [],
      invoices: []
    };
    this.init();
  }

  async init() {
    // Setup
    this.setupEventListeners();
    this.initPageModules();
    
    // Test connection
    try {
      const test = await apiService.testConnection();
      if (!test.connected) {
        this.showError('Cannot connect to server. Please check your Google Apps Script URL in api.js');
      }
    } catch (error) {
      console.warn('Connection test failed:', error);
    }
    
    // Load initial page
    const hash = window.location.hash.substring(1) || 'dashboard';
    await this.loadPage(hash);
  }

  setupEventListeners() {
    // Mobile sidebar toggle
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('navbar-toggler')) {
        const sidebar = document.querySelector('.sidebar');
        sidebar.classList.toggle('show');
      }
    });
  }

  initPageModules() {
    if (window.DashboardPage) this.dashboardPage = new DashboardPage(this);
    if (window.ClientsPage) this.clientsPage = new ClientsPage(this);
    if (window.InvoicesPage) this.invoicesPage = new InvoicesPage(this);
    if (window.BillingPage) this.billingPage = new BillingPage(this);
    if (window.FormsPage) this.formsPage = new FormsPage(this);
  }

  async loadPage(page) {
    try {
      this.currentPage = page;
      this.updateActiveNav(page);
      this.showLoading();
      
      let html = '';
      
      switch(page) {
        case 'dashboard':
          html = this.dashboardPage ? await this.dashboardPage.render() : this.getFallbackPage(page);
          break;
        case 'clients':
          html = this.clientsPage ? await this.clientsPage.render() : this.getFallbackPage(page);
          break;
        case 'invoices':
          html = this.invoicesPage ? await this.invoicesPage.render() : this.getFallbackPage(page);
          break;
        case 'billing':
          html = this.billingPage ? await this.billingPage.render() : this.getFallbackPage(page);
          break;
        case 'client-form':
        case 'invoice-form':
          html = this.formsPage ? await this.formsPage.render(page) : this.getFallbackPage(page);
          break;
        default:
          html = this.getNotFoundPage();
      }
      
      document.getElementById('content').innerHTML = html;
      window.location.hash = page;
      this.initializePage(page);
      
    } catch (error) {
      console.error(`Error loading ${page}:`, error);
      this.showError(`Failed to load ${page}: ${error.message}`);
    }
  }

  updateActiveNav(page) {
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${page}`) {
        link.classList.add('active');
      }
    });
  }

  showLoading() {
    document.getElementById('content').innerHTML = `
      <div class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2">Loading...</p>
      </div>
    `;
  }

  getFallbackPage(page) {
    return `
      <div class="container-fluid">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h2>${page.charAt(0).toUpperCase() + page.slice(1).replace('-', ' ')}</h2>
        </div>
        <div class="alert alert-info">
          ${page} page is loading...
        </div>
      </div>
    `;
  }

  getNotFoundPage() {
    return `
      <div class="container-fluid">
        <div class="text-center py-5">
          <i class="bi bi-exclamation-triangle display-1 text-warning"></i>
          <h1 class="mt-3">404</h1>
          <h4 class="text-muted mb-4">Page Not Found</h4>
          <button class="btn btn-primary" onclick="app.loadPage('dashboard')">
            Return to Dashboard
          </button>
        </div>
      </div>
    `;
  }

  initializePage(page) {
    setTimeout(() => {
      const pageMap = {
        'dashboard': this.dashboardPage,
        'clients': this.clientsPage,
        'invoices': this.invoicesPage,
        'billing': this.billingPage,
        'client-form': this.formsPage,
        'invoice-form': this.formsPage
      };
      
      const pageObj = pageMap[page];
      if (pageObj && pageObj.initialize) {
        pageObj.initialize();
      }
    }, 100);
  }

  showError(message) {
    document.getElementById('content').innerHTML = `
      <div class="alert alert-danger">
        <h4>Error</h4>
        <p>${message}</p>
        <button class="btn btn-primary" onclick="app.loadPage('dashboard')">
          Return to Dashboard
        </button>
      </div>
    `;
  }

  async refreshDashboard() {
    apiService.cache.clear();
    this.loadPage('dashboard');
  }

  async initializeSystem() {
    if (!confirm('Initialize system? This will create required sheets.')) return;
    
    try {
      Utils.showLoading(true);
      const response = await apiService.initializeSystem();
      
      if (response.success) {
        Utils.showNotification('System initialized!', 'success');
        this.refreshDashboard();
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      Utils.showNotification('Error: ' + error.message, 'danger');
    } finally {
      Utils.showLoading(false);
    }
  }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  window.app = new InvoiceApp();
  window.loadPage = (page) => window.app.loadPage(page);
});
