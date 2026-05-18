import API from '../js/api.js';

const state = {
  allSellers: [],
  pendingSellers: [],
  pendingProducts: [],
  allProducts: [],
  pendingOffers: [],
  pendingOrders: []
};

function getUser() {
  try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
}

function authRedirect() {
  const user = getUser();
  if (!user || user.role !== 'admin') {
    alert('Access denied. Admins only.');
    window.location.href = '../index.html';
  }
}

function showAlert(message, type = 'info') {
  const el = document.getElementById('alertBanner');
  el.textContent = message;
  el.className = `alert-banner ${type}`;
}

function hideAlert() {
  const el = document.getElementById('alertBanner');
  el.className = 'alert-banner hidden';
}

function switchTab(tab) {
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
  document.querySelectorAll('.tab-panel').forEach(section => section.id === `tab-${tab}` ? section.classList.add('active') : section.classList.remove('active'));
  document.getElementById('pageTitle').textContent = tab.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  hideAlert();

  if (tab === 'dashboard') loadDashboard();
  if (tab === 'sellers-pending') loadPendingSellers();
  if (tab === 'sellers-all') loadAllSellers();
  if (tab === 'products-pending') loadPendingProducts();
  if (tab === 'products-all') loadAllProducts();
  if (tab === 'offers-pending') loadPendingOffers();
  if (tab === 'orders-pending') loadPendingOrders();
}

async function loadDashboard() {
  try {
    const [pendingSellersRes, pendingProductsRes, pendingOffersRes] = await Promise.all([
      API.admin.getPendingSellers(),
      API.admin.getPendingProducts(),
      API.admin.getPendingOffers()
    ]);
    if (!pendingSellersRes.success || !pendingProductsRes.success || !pendingOffersRes.success) {
      throw new Error('Failed to load dashboard counts.');
    }

    document.getElementById('s-users').textContent = '---';
    document.getElementById('s-sellers').textContent = '---';
    document.getElementById('s-products').textContent = '---';
    document.getElementById('s-orders').textContent = '---';
    document.getElementById('s-revenue').textContent = '---';
    document.getElementById('s-pend-sell').textContent = pendingSellersRes.data.length;
    document.getElementById('s-pend-prod').textContent = pendingProductsRes.data.length;
    document.getElementById('s-pend-ofr').textContent = pendingOffersRes.data.length;

    document.getElementById('cnt-sellers').textContent = pendingSellersRes.data.length;
    document.getElementById('cnt-products').textContent = pendingProductsRes.data.length;
    document.getElementById('cnt-offers').textContent = pendingOffersRes.data.length;
  } catch (err) {
    showAlert(err.message || 'Unable to load admin dashboard.', 'error');
  }
}

async function loadPendingSellers() {
  try {
    const res = await API.admin.getPendingSellers();
    if (!res.success) throw new Error(res.message || 'Failed to load pending sellers.');

    state.pendingSellers = res.data;
    const tbody = document.getElementById('pendingSellerBody');
    if (!state.pendingSellers.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="loading-row">No sellers pending approval.</td></tr>';
      return;
    }

    tbody.innerHTML = state.pendingSellers.map(s => `
      <tr>
        <td>${escapeHtml(s.business_name)}</td>
        <td>${escapeHtml(s.full_name || s.user_email || '—')}</td>
        <td>${escapeHtml(s.user_email)}</td>
        <td>${escapeHtml(s.phone || '—')}</td>
        <td>${escapeHtml(s.rating || '—')}</td>
        <td>${formatDate(s.created_at)}</td>
        <td style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn btn-sm btn-success" onclick="window.verifySeller('${s.seller_id}')">Approve</button>
          <button class="btn btn-sm btn-danger" onclick="window.rejectSeller('${s.seller_id}')">Reject</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    document.getElementById('pendingSellerBody').innerHTML = `<tr><td colspan="7" class="loading-row" style="color:var(--red)">${escapeHtml(err.message)}</td></tr>`;
  }
}

async function loadAllSellers() {
  try {
    const res = await API.admin.getSellers();
    if (!res.success) throw new Error(res.message || 'Failed to load sellers.');

    state.allSellers = res.data;
    const tbody = document.getElementById('allSellerBody');
    if (!state.allSellers.length) {
      tbody.innerHTML = '<tr><td colspan="9" class="loading-row">No sellers found.</td></tr>';
      return;
    }

    tbody.innerHTML = state.allSellers.map(s => `
      <tr>
        <td>${escapeHtml(s.business_name)}</td>
        <td>${escapeHtml(s.full_name || s.user_email || '—')}</td>
        <td>${escapeHtml(s.verification_status)}</td>
        <td>${escapeHtml(s.product_count || 0)}</td>
        <td>${escapeHtml(s.rating || '—')}</td>
        <td>${permissionBadge(s.can_sell)}</td>
        <td>${permissionBadge(s.can_make_offers)}</td>
        <td>${permissionBadge(s.can_edit_products)}</td>
        <td style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn btn-sm btn-primary" onclick="window.toggleSellerPermission('${s.seller_id}', 'can_sell')">Sell</button>
          <button class="btn btn-sm btn-primary" onclick="window.toggleSellerPermission('${s.seller_id}', 'can_make_offers')">Offers</button>
          <button class="btn btn-sm btn-primary" onclick="window.toggleSellerPermission('${s.seller_id}', 'can_edit_products')">Edit</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    document.getElementById('allSellerBody').innerHTML = `<tr><td colspan="9" class="loading-row" style="color:var(--red)">${escapeHtml(err.message)}</td></tr>`;
  }
}

async function toggleSellerPermission(id, permission) {
  try {
    const seller = state.allSellers.find(item => item.seller_id === id);
    if (!seller) throw new Error('Seller not found');

    const perms = {
      can_sell: seller.can_sell,
      can_make_offers: seller.can_make_offers,
      can_edit_products: seller.can_edit_products
    };
    perms[permission] = !seller[permission];

    const res = await API.admin.updateSellerPermissions(id, perms);
    if (!res.success) throw new Error(res.message || 'Unable to update permissions.');
    showAlert(res.message, 'success');
    await loadAllSellers();
  } catch (err) {
    showAlert(err.message || 'Permission update failed.', 'error');
  }
}

async function verifySeller(id) {
  try {
    const res = await API.admin.verifySeller(id);
    if (!res.success) throw new Error(res.message || 'Unable to verify seller.');
    showAlert(res.message, 'success');
    await loadPendingSellers();
    await loadAllSellers();
  } catch (err) {
    showAlert(err.message || 'Verification failed.', 'error');
  }
}

async function rejectSeller(id) {
  if (!confirm('Reject this seller? This will revoke selling and offer permissions.')) return;
  try {
    const res = await API.admin.rejectSeller(id);
    if (!res.success) throw new Error(res.message || 'Unable to reject seller.');
    showAlert(res.message, 'success');
    await loadPendingSellers();
    await loadAllSellers();
  } catch (err) {
    showAlert(err.message || 'Reject failed.', 'error');
  }
}

async function loadPendingProducts() {
  try {
    const res = await API.admin.getPendingProducts();
    if (!res.success) throw new Error(res.message || 'Failed to load pending products.');
    state.pendingProducts = res.data;
    const tbody = document.getElementById('pendingProductBody');
    if (!state.pendingProducts.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="loading-row">No pending products.</td></tr>';
      return;
    }
    tbody.innerHTML = state.pendingProducts.map(p => `
      <tr>
        <td>${p.primary_image ? `<img src="${escapeHtml(p.primary_image)}" class="thumb" alt="${escapeHtml(p.name)}" />` : '<div class="thumb-placeholder">📦</div>'}</td>
        <td>${escapeHtml(p.name)}</td>
        <td>${escapeHtml(p.business_name)}</td>
        <td>${escapeHtml(p.category_name)}</td>
        <td>SAR ${parseFloat(p.base_price).toFixed(2)}</td>
        <td>${permissionBadge(p.is_offer ? 1 : 0)} ${permissionBadge(p.is_factory ? 1 : 0, 'type')}</td>
        <td>${formatDate(p.created_at)}</td>
        <td style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn btn-sm btn-success" onclick="window.approveProduct('${p.product_id}')">Approve</button>
          <button class="btn btn-sm btn-danger" onclick="window.deleteProduct('${p.product_id}')">Delete</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    document.getElementById('pendingProductBody').innerHTML = `<tr><td colspan="8" class="loading-row" style="color:var(--red)">${escapeHtml(err.message)}</td></tr>`;
  }
}

async function loadAllProducts() {
  try {
    const res = await API.admin.getAllProducts();
    if (!res.success) throw new Error(res.message || 'Failed to load products.');
    state.allProducts = res.data;
    const tbody = document.getElementById('allProductBody');
    if (!state.allProducts.length) {
      tbody.innerHTML = '<tr><td colspan="9" class="loading-row">No products found.</td></tr>';
      return;
    }
    tbody.innerHTML = state.allProducts.map(p => `
      <tr>
        <td>${p.primary_image ? `<img src="${escapeHtml(p.primary_image)}" class="thumb" alt="${escapeHtml(p.name)}" />` : '<div class="thumb-placeholder">📦</div>'}</td>
        <td>${escapeHtml(p.name)}</td>
        <td>${escapeHtml(p.business_name)}</td>
        <td>${escapeHtml(p.category_name)}</td>
        <td>SAR ${parseFloat(p.base_price).toFixed(2)}</td>
        <td>${escapeHtml(p.stock_quantity || 0)}</td>
        <td>${p.is_active ? '<span class="badge badge-green">Live</span>' : '<span class="badge badge-orange">Pending</span>'}</td>
        <td>${permissionBadge(p.is_offer ? 1 : 0)} ${permissionBadge(p.is_factory ? 1 : 0, 'type')}</td>
        <td style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn btn-sm btn-primary" onclick="window.openEditProductModal('${p.product_id}')">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="window.deleteProduct('${p.product_id}')">Delete</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    document.getElementById('allProductBody').innerHTML = `<tr><td colspan="9" class="loading-row" style="color:var(--red)">${escapeHtml(err.message)}</td></tr>`;
  }
}

function filterProducts() {
  const query = document.getElementById('productSearch').value.toLowerCase();
  const rows = Array.from(document.querySelectorAll('#allProductBody tr'));
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(query) ? '' : 'none';
  });
}

async function loadPendingOffers() {
  try {
    const res = await API.admin.getPendingOffers();
    if (!res.success) throw new Error(res.message || 'Failed to load pending offers.');
    state.pendingOffers = res.data;
    const tbody = document.getElementById('pendingOfferBody');
    if (!state.pendingOffers.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="loading-row">No pending offers.</td></tr>';
      return;
    }
    tbody.innerHTML = state.pendingOffers.map(offer => `
      <tr>
        <td>${escapeHtml(offer.offer_title)}</td>
        <td>${escapeHtml(offer.product_name)}</td>
        <td>${escapeHtml(offer.business_name)}</td>
        <td>${offer.discount_type === 'percentage' ? `${escapeHtml(offer.discount_value)}%` : `SAR ${parseFloat(offer.discount_value).toFixed(2)}`}</td>
        <td>${offer.offer_price ? `SAR ${parseFloat(offer.offer_price).toFixed(2)}` : '—'}</td>
        <td>${formatDate(offer.start_date)} – ${formatDate(offer.end_date)}</td>
        <td>${formatDate(offer.created_at)}</td>
        <td style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn btn-sm btn-success" onclick="window.approveOffer('${offer.offer_id}')">Approve</button>
          <button class="btn btn-sm btn-danger" onclick="window.openRejectOfferModal('${offer.offer_id}')">Reject</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    document.getElementById('pendingOfferBody').innerHTML = `<tr><td colspan="8" class="loading-row" style="color:var(--red)">${escapeHtml(err.message)}</td></tr>`;
  }
}

async function loadPendingOrders() {
  try {
    const res = await API.admin.getPendingCodOrders();
    if (!res.success) throw new Error(res.message || 'Failed to load pending orders.');
    state.pendingOrders = res.data;
    const tbody = document.getElementById('pendingOrderBody');
    if (!state.pendingOrders.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="loading-row">No pending orders.</td></tr>';
      return;
    }
    tbody.innerHTML = state.pendingOrders.map(order => `
      <tr>
        <td>${escapeHtml(order.order_id)}</td>
        <td>${escapeHtml(order.customer_name || order.customer_email || '—')}</td>
        <td>SAR ${parseFloat(order.final_amount).toFixed(2)}</td>
        <td>${escapeHtml(order.payment_method || 'COD')}</td>
        <td>${escapeHtml(order.order_status)}</td>
        <td>${formatDate(order.created_at)}</td>
        <td><button class="btn btn-sm btn-success" onclick="window.confirmCodOrder('${order.order_id}')">Confirm</button></td>
      </tr>
    `).join('');
  } catch (err) {
    document.getElementById('pendingOrderBody').innerHTML = `<tr><td colspan="7" class="loading-row" style="color:var(--red)">${escapeHtml(err.message)}</td></tr>`;
  }
}

async function approveProduct(id) {
  try {
    const res = await API.admin.approveProduct(id);
    if (!res.success) throw new Error(res.message || 'Approve failed.');
    showAlert(res.message, 'success');
    await loadPendingProducts();
    await loadAllProducts();
  } catch (err) {
    showAlert(err.message || 'Unable to approve product.', 'error');
  }
}

async function deleteProduct(id) {
  if (!confirm('Delete this product permanently?')) return;
  try {
    const res = await API.admin.deleteProduct(id);
    if (!res.success) throw new Error(res.message || 'Delete failed.');
    showAlert(res.message, 'success');
    await loadPendingProducts();
    await loadAllProducts();
  } catch (err) {
    showAlert(err.message || 'Unable to delete product.', 'error');
  }
}

async function openEditProductModal(productId) {
  const product = state.allProducts.find(p => p.product_id === productId);
  if (!product) return showAlert('Product not found.', 'error');

  document.getElementById('ep-id').value = product.product_id;
  document.getElementById('ep-name').value = product.name || '';
  document.getElementById('ep-brand').value = product.brand || '';
  document.getElementById('ep-price').value = product.base_price || '';
  document.getElementById('ep-stock').value = product.stock_quantity || '';
  document.getElementById('ep-desc').value = product.description || '';
  document.getElementById('ep-image').value = product.primary_image || '';
  document.getElementById('ep-isOffer').checked = !!product.is_offer;
  document.getElementById('ep-isFactory').checked = !!product.is_factory;
  document.getElementById('ep-isActive').checked = !!product.is_active;
  document.getElementById('ep-offerPrice').value = product.offer_price || '';
  document.getElementById('ep-offerPriceGroup').style.display = product.is_offer ? 'flex' : 'none';
  openModal('editProductModal');
}

document.getElementById('editProductForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const id = document.getElementById('ep-id').value;
  const body = {
    name: document.getElementById('ep-name').value.trim(),
    brand: document.getElementById('ep-brand').value.trim(),
    base_price: parseFloat(document.getElementById('ep-price').value),
    stock_quantity: parseInt(document.getElementById('ep-stock').value, 10),
    description: document.getElementById('ep-desc').value.trim(),
    image_url: document.getElementById('ep-image').value.trim() || null,
    is_offer: document.getElementById('ep-isOffer').checked,
    is_factory: document.getElementById('ep-isFactory').checked,
    is_active: document.getElementById('ep-isActive').checked,
    offer_price: parseFloat(document.getElementById('ep-offerPrice').value) || null
  };
  try {
    const res = await API.admin.editProduct(id, body);
    if (!res.success) throw new Error(res.message || 'Failed to update product.');
    showAlert(res.message, 'success');
    closeModal('editProductModal');
    await loadAllProducts();
    await loadPendingProducts();
  } catch (err) {
    showAlert(err.message || 'Unable to save product.', 'error');
  }
});

async function loadCategoriesAndSellers() {
  try {
    const [cats, sellers] = await Promise.all([
      API.products.getCategories(),
      API.admin.getSellers()
    ]);
    if (cats.success) {
      const categorySelect = document.getElementById('a-prod-category');
      categorySelect.innerHTML = '<option value="">— Select Category —</option>';
      cats.data.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.category_id;
        opt.textContent = c.category_name;
        categorySelect.appendChild(opt);
      });
    }
    if (sellers.success) {
      const sellerSelect = document.getElementById('a-prod-seller');
      sellerSelect.innerHTML = '<option value="">— Select Seller —</option>';
      sellers.data.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.seller_id;
        opt.textContent = `${s.business_name} (${s.full_name || s.user_email || 'seller'})`;
        sellerSelect.appendChild(opt);
      });
    }
  } catch (err) {
    showAlert('Unable to load categories or sellers for admin product form.', 'error');
  }
}

document.getElementById('adminAddProductForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const body = {
    name: document.getElementById('a-prod-name').value.trim(),
    brand: document.getElementById('a-prod-brand').value.trim(),
    base_price: parseFloat(document.getElementById('a-prod-price').value),
    stock_quantity: parseInt(document.getElementById('a-prod-stock').value, 10),
    description: document.getElementById('a-prod-desc').value.trim(),
    image_url: document.getElementById('a-prod-image').value.trim() || null,
    category_id: document.getElementById('a-prod-category').value,
    seller_id: document.getElementById('a-prod-seller').value,
    is_offer: document.getElementById('a-prod-isOffer').checked,
    is_factory: document.getElementById('a-prod-isFactory').checked,
    offer_price: parseFloat(document.getElementById('a-prod-offerPrice').value) || null
  };
  try {
    const res = await API.admin.addProduct(body);
    if (!res.success) throw new Error(res.message || 'Unable to add product.');
    showAlert(res.message, 'success');
    event.target.reset();
    document.getElementById('a-offerPriceGroup').style.display = 'none';
    await loadAllProducts();
  } catch (err) {
    showAlert(err.message || 'Admin product creation failed.', 'error');
  }
});

function toggleAdminOfferPrice() {
  document.getElementById('a-offerPriceGroup').style.display = document.getElementById('a-prod-isOffer').checked ? 'flex' : 'none';
}

function toggleEpOfferPrice() {
  document.getElementById('ep-offerPriceGroup').style.display = document.getElementById('ep-isOffer').checked ? 'flex' : 'none';
}

function openRejectOfferModal(offerId) {
  document.getElementById('confirmRejectBtn').dataset.offerId = offerId;
  openModal('rejectOfferModal');
}

document.getElementById('confirmRejectBtn').addEventListener('click', async () => {
  const offerId = document.getElementById('confirmRejectBtn').dataset.offerId;
  const note = document.getElementById('rejectNote').value.trim();
  try {
    const res = await API.admin.rejectOffer(offerId, note);
    if (!res.success) throw new Error(res.message || 'Failed to reject offer.');
    showAlert(res.message, 'success');
    closeModal('rejectOfferModal');
    document.getElementById('rejectNote').value = '';
    await loadPendingOffers();
  } catch (err) {
    showAlert(err.message || 'Unable to reject offer.', 'error');
  }
});

async function confirmCodOrder(orderId) {
  try {
    const res = await API.admin.confirmCodOrder(orderId);
    if (!res.success) throw new Error(res.message || 'Unable to confirm order.');
    showAlert(res.message, 'success');
    await loadPendingOrders();
  } catch (err) {
    showAlert(err.message || 'COD order confirmation failed.', 'error');
  }
}

function openModal(id) {
  document.getElementById(id).classList.add('open');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeModal(overlay.id);
  });
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  if (confirm('Logout?')) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    window.location.href = '../index.html';
  }
});

function escapeHtml(value) {
  if (value === undefined || value === null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

function permissionBadge(value, type = 'perm') {
  if (type === 'type') {
    return value ? '<span class="badge badge-purple">Yes</span>' : '<span class="badge badge-secondary">No</span>';
  }
  return value ? '<span class="badge badge-green">Yes</span>' : '<span class="badge badge-red">No</span>';
}

async function init() {
  authRedirect();

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  await loadCategoriesAndSellers();
  loadDashboard();
  loadPendingSellers();
  loadAllSellers();
  loadPendingProducts();
  loadAllProducts();
  loadPendingOffers();
  loadPendingOrders();
}

window.verifySeller = verifySeller;
window.rejectSeller = rejectSeller;
window.toggleSellerPermission = toggleSellerPermission;
window.approveProduct = approveProduct;
window.deleteProduct = deleteProduct;
window.openEditProductModal = openEditProductModal;
window.openRejectOfferModal = openRejectOfferModal;
window.confirmCodOrder = confirmCodOrder;

init();
