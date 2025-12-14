// Products Page Module
class ProductsPage {
  constructor(app) {
    this.app = app;
    this.products = [];
  }

  async render() {
    try {
      const [res, tpl] = await Promise.all([
        apiService.getProducts(),
        Utils.loadTemplate('templates/products.html')
      ]);

      this.products = (res && res.success) ? (res.data || []) : [];

      const content = this.products.length ? this.buildTable() : this.buildEmpty();
      return Utils.renderTemplate(tpl, { 'PRODUCTS_CONTENT': content });
    } catch (err) {
      console.error('Products render error:', err);
      return this.getErrorTemplate(err);
    }
  }

  buildTable() {
    return `
      <div class="card">
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-hover" id="productsTable">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Tax %</th>
                  <th>Unit</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${this.products.map(p => `
                  <tr data-id="${p.product_id}">
                    <td>${p.name || ''}</td>
                    <td>${p.category || ''}</td>
                    <td>${Utils.formatCurrency(parseFloat(p.price) || 0)}</td>
                    <td>${p.tax_rate || 0}%</td>
                    <td>${p.unit || ''}</td>
                    <td>${p.description || ''}</td>
                    <td>
                      <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="productsPage.openEditProduct('${p.product_id}')"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-outline-danger" onclick="productsPage.confirmDeleteProduct('${p.product_id}')"><i class="bi bi-trash"></i></button>
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

  buildEmpty() {
    return `
      <div class="text-center py-5">
        <i class="bi bi-box-seam display-1 text-muted"></i>
        <h4 class="mt-3">No Products</h4>
        <p class="text-muted mb-4">Add products to populate the catalog</p>
        <button class="btn btn-primary" id="addProductEmptyBtn" onclick="productsPage.openAddProduct()">
          <i class="bi bi-plus-lg me-1"></i> Add Product
        </button>
      </div>
    `;
  }

  getErrorTemplate(err) {
    return `
      <div class="alert alert-danger">
        <h4>Error Loading Products</h4>
        <p>${err.message || String(err)}</p>
        <button class="btn btn-primary" onclick="app.loadPage('products')">Retry</button>
      </div>
    `;
  }

  initialize() {
    window.productsPage = this;

    // wire add product quick button if present on page
    setTimeout(() => {
      const addBtn = document.getElementById('addProductQuickBtn');
      if (addBtn) addBtn.addEventListener('click', (e) => { e.preventDefault(); this.openAddProduct(); });

      // simple table row click to edit (optional)
      const table = document.getElementById('productsTable');
      if (table) {
        table.querySelectorAll('tbody tr').forEach(row => {
          row.addEventListener('dblclick', () => {
            const id = row.getAttribute('data-id');
            if (id) this.openEditProduct(id);
          });
        });
      }
    }, 100);
  }

  // open Add Product (use formsPage if available to reuse product form/modal)
  async openAddProduct() {
    if (window.formsPage && typeof window.formsPage.openAddProductModal === 'function') {
      return window.formsPage.openAddProductModal();
    }
    // Fallback: create modal inline using same template
    try {
      const tpl = await Utils.loadTemplate('templates/forms/product-form.html');
      this._showProductModal({ mode: 'add', tpl });
    } catch (err) {
      console.error('openAddProduct fallback error:', err);
      Utils.showNotification('Unable to open product form', 'danger');
    }
  }

  // open edit product modal
  async openEditProduct(productId) {
    try {
      // find product
      let product = this.products.find(p => p.product_id === productId);
      if (!product) {
        const res = await apiService.getProducts();
        this.products = (res && res.success) ? (res.data || []) : this.products;
        product = this.products.find(p => p.product_id === productId);
      }
      if (!product) return Utils.showNotification('Product not found', 'warning');

      const tpl = await Utils.loadTemplate('templates/forms/product-form.html');
      this._showProductModal({ mode: 'edit', tpl, product });
    } catch (err) {
      console.error('openEditProduct error:', err);
      Utils.showNotification('Failed to open edit product', 'danger');
    }
  }

  // internal: show modal for add/edit product (tpl string, mode add/edit, product optional)
  _showProductModal({ mode = 'add', tpl, product = {} }) {
    const container = document.createElement('div');
    container.innerHTML = `
      <div class="modal fade" id="productMgmtModal" tabindex="-1">
        <div class="modal-dialog modal-md modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">${mode === 'add' ? 'Add Product' : 'Edit Product'}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-0">
              ${tpl}
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(container);
    const modalEl = document.getElementById('productMgmtModal');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    // populate fields if editing
    const form = modalEl.querySelector('#productForm');
    if (!form) return;
    if (mode === 'edit' && product) {
      form.querySelector('[name="name"]').value = product.name || '';
      form.querySelector('[name="category"]').value = product.category || '';
      form.querySelector('[name="price"]').value = product.price != null ? product.price : '';
      form.querySelector('[name="tax_rate"]').value = product.tax_rate != null ? product.tax_rate : 0;
      form.querySelector('[name="unit"]').value = product.unit || 'each';
      form.querySelector('[name="description"]').value = product.description || '';
    }

    // handle submit
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        Utils.showLoading(true);
        const fd = new FormData(form);
        const payload = {
          name: fd.get('name'),
          description: fd.get('description') || '',
          price: parseFloat(fd.get('price')) || 0,
          tax_rate: parseFloat(fd.get('tax_rate')) || 0,
          category: fd.get('category') || '',
          unit: fd.get('unit') || 'each'
        };
        if (mode === 'add') {
          const res = await apiService.addProduct(payload);
          if (!res || !res.success) throw new Error((res && res.error) || 'Failed to add product');
          Utils.showMessageModal('Success', 'Product added successfully.');
        } else {
          payload.product_id = product.product_id;
          const res = await apiService.updateProduct(payload);
          if (!res || !res.success) throw new Error((res && res.error) || 'Failed to update product');
          Utils.showMessageModal('Success', 'Product updated successfully.');
        }

        modal.hide();
        // refresh list
        await this.reload();
      } catch (err) {
        console.error('product save error:', err);
        Utils.showNotification('Error saving product: ' + (err.message || err), 'danger');
      } finally {
        Utils.showLoading(false);
      }
    }, { once: true });

    modalEl.addEventListener('hidden.bs.modal', () => {
      container.remove();
    });
  }

  async confirmDeleteProduct(productId) {
    // simple confirm modal
    const ok = await this._showConfirmModal('Delete Product', 'Are you sure you want to delete this product? This action cannot be undone.');
    if (!ok) return;
    try {
      Utils.showLoading(true);
      const res = await apiService.deleteProduct(productId);
      if (!res || !res.success) throw new Error((res && res.error) || 'Failed to delete product');
      Utils.showMessageModal('Deleted', 'Product deleted successfully.');
      await this.reload();
    } catch (err) {
      console.error('delete product error:', err);
      Utils.showNotification('Error deleting product: ' + (err.message || err), 'danger');
    } finally {
      Utils.showLoading(false);
    }
  }

  // reload page data
  async reload() {
    try {
      const res = await apiService.getProducts();
      this.products = (res && res.success) ? (res.data || []) : [];
      const content = this.products.length ? this.buildTable() : this.buildEmpty();
      const container = document.getElementById('products-content');
      if (container) container.innerHTML = content;
      this.initialize(); // re-wire events
    } catch (err) {
      console.error('reload products error:', err);
    }
  }

  // small confirm modal helper returns Promise<boolean>
  _showConfirmModal(title, message) {
    return new Promise((resolve) => {
      const id = 'confirmModal_' + Date.now();
      const container = document.createElement('div');
      container.innerHTML = `
        <div class="modal fade" id="${id}" tabindex="-1">
          <div class="modal-dialog modal-sm modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">${title}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body">
                <p>${message}</p>
              </div>
              <div class="modal-footer">
                <button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button class="btn btn-danger" id="${id}_ok">Delete</button>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(container);
      const modalEl = document.getElementById(id);
      const modal = new bootstrap.Modal(modalEl);
      modal.show();

      modalEl.querySelector(`#${id}_ok`).addEventListener('click', () => {
        resolve(true);
        modal.hide();
      });

      modalEl.addEventListener('hidden.bs.modal', () => {
        resolve(false);
        container.remove();
      }, { once: true });
    });
  }
}

// small helpers in Utils to show message modal (add to Utils if not present)
if (!Utils.showMessageModal) {
  Utils.showMessageModal = function(title, message) {
    const id = 'messageModal_' + Date.now();
    const container = document.createElement('div');
    container.innerHTML = `
      <div class="modal fade" id="${id}" tabindex="-1">
        <div class="modal-dialog modal-md modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">${title}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <p>${message}</p>
            </div>
            <div class="modal-footer">
              <button class="btn btn-primary" data-bs-dismiss="modal">OK</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(container);
    const modalEl = document.getElementById(id);
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
    modalEl.addEventListener('hidden.bs.modal', () => container.remove(), { once: true });
  };
}

window.ProductsPage = ProductsPage;
