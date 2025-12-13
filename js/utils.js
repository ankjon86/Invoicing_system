// Utility Functions (complete, includes template loader)
const Utils = {
    // Format date
    formatDate: function(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        };
        return date.toLocaleDateString('en-US', options);
    },

    // Format currency
    formatCurrency: function(amount, currency = 'USD') {
        const currencyOptions = {
            'GHS': { style: 'currency', currency: 'GHS' },
            'USD': { style: 'currency', currency: 'USD' },
            'EUR': { style: 'currency', currency: 'EUR' },
            'GBP': { style: 'currency', currency: 'GBP' }
        };
        
        return new Intl.NumberFormat('en-GH', currencyOptions[currency] || currencyOptions['USD'])
            .format(amount || 0);
    },

    // Generate unique ID
    generateId: function() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    // Debounce function
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Validate email
    validateEmail: function(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    // Validate phone
    validatePhone: function(phone) {
        const re = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
        return re.test(phone);
    },

    // Show notification
    showNotification: function(message, type = 'info') {
        // Remove existing notifications
        const existing = document.querySelector('.notification-toast');
        if (existing) existing.remove();

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification-toast alert alert-${type} alert-dismissible fade show`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            border-radius: 8px;
        `;
        
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    },

    // Show loading indicator
    showLoading: function(show = true) {
        let loader = document.getElementById('global-loader');
        
        if (show) {
            if (!loader) {
                loader = document.createElement('div');
                loader.id = 'global-loader';
                loader.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(255,255,255,0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                `;
                loader.innerHTML = `
                    <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                `;
                document.body.appendChild(loader);
            }
        } else {
            if (loader && loader.parentNode) {
                loader.remove();
            }
        }
    },

    // Format file size
    formatFileSize: function(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // Copy to clipboard
    copyToClipboard: function(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showNotification('Copied to clipboard!', 'success');
        }).catch(err => {
            console.error('Failed to copy: ', err);
            this.showNotification('Failed to copy', 'danger');
        });
    },

    // Get query parameters
    getQueryParams: function() {
        const params = {};
        window.location.search.substring(1).split('&').forEach(pair => {
            const [key, value] = pair.split('=');
            if (key) params[decodeURIComponent(key)] = decodeURIComponent(value || '');
        });
        return params;
    },

    // Set query parameters
    setQueryParams: function(params) {
        const query = Object.keys(params)
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
            .join('&');
        window.history.replaceState({}, '', `${window.location.pathname}?${query}`);
    },

    // Download CSV
    downloadCSV: function(data, filename) {
        if (!data || data.length === 0) {
            this.showNotification('No data to export', 'warning');
            return;
        }

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => {
                const cell = row[header];
                return typeof cell === 'string' && cell.includes(',') 
                    ? `"${cell.replace(/"/g, '""')}"` 
                    : cell;
            }).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showNotification('File downloaded successfully!', 'success');
    },

    // --- Template helpers ---
    // Load an HTML template from the templates/ folder
    loadTemplate: async function(path) {
        try {
            const res = await fetch(path, { cache: 'no-cache' });
            if (!res.ok) throw new Error('Failed to load template: ' + path);
            return await res.text();
        } catch (err) {
            console.error(err);
            throw err;
        }
    },

    // Simple template renderer that replaces {{KEY}} placeholders
    renderTemplate: function(templateString, data = {}) {
        let out = templateString;
        Object.keys(data).forEach(key => {
            const re = new RegExp('\\{\\{\\s*' + key + '\\s*\\}\\}', 'g');
            out = out.replace(re, data[key] != null ? data[key] : '');
        });
        return out;
    }
};

// Make Utils available globally
window.Utils = Utils;
