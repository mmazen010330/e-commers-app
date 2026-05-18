/* ─────────────────────────────────────────────
   AuraShop Seller Dashboard — seller.js
   All API calls, tab navigation, form handling
───────────────────────────────────────────── */

const API = 'http://localhost:5000/api';

// ──────────────────────────────────────────
// Auth helpers
// ──────────────────────────────────────────
let sellerProfile = null;

function getToken() { return localStorage.getItem('access_token'); }
function getUser()  { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } }

function authHeaders() {
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` };
}

function updateSellerTabVisibility(profile) {
  const showAddProduct = !!profile.can_sell;
  const showOffers = !!profile.can_make_offers;

  document.querySelector('.nav-btn[data-tab="add-product"]').style.display = showAddProduct ? '' : 'none';
  document.querySelector('.nav-btn[data-tab="add-offer"]').style.display = showOffers ? '' : 'none';
  document.querySelector('.nav-btn[data-tab="offers"]').style.display = showOffers ? '' : 'none';

  if (!showAddProduct && document.querySelector('.nav-btn.active')?.dataset.tab === 'add-product') {
    switchTab('overview');
  }
  if (!showOffers && ['offers','add-offer'].includes(document.querySelector('.nav-btn.active')?.dataset.tab)) {
    switchTab('overview');
  }
}


// ──────────────────────────────────────────
// Init — redirect if not seller
// ──────────────────────────────────────────
(function init() {
  const user = getUser();
  if (!user || user.role !== 'seller') {
    alert('Access denied. Seller accounts only.');
    window.location.href = '../index.html';
    return;
  }
  document.getElementById('sellerName').textContent = user.full_name || user.name || 'Seller';
  document.getElementById('sellerAvatar').textContent = (user.full_name || user.name || 'S')[0].toUpperCase();
  loadOverview();
})();

// ──────────────────────────────────────────
// Tab navigation
// ──────────────────────────────────────────
const TAB_TITLES = {
  'overview':    'Overview',
  'products':    'My Products',
  'add-product': 'Add Product',
  'offers':      'My Offers',
  'add-offer':   'New Offer',
  'orders':      'Orders',
  'earnings':    'Earnings',
};

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

function switchTab(tab) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === `tab-${tab}`));
  document.getElementById('pageTitle').textContent = TAB_TITLES[tab] || tab;
  hideAlert();

  if (tab === 'products')  loadProducts();
  if (tab === 'offers')    loadOffers();
  if (tab === 'add-offer') loadProductSelectForOffer();
  if (tab === 'orders')    loadOrders();
  if (tab === 'earnings')  loadEarnings();
}

// ──────────────────────────────────────────
// Alert Banner
// ──────────────────────────────────────────
function showAlert(msg, type = 'info') {
  const el = document.getElementById('alertBanner');
  el.textContent = msg;
  el.className = `alert-banner ${type}`;
}
function hideAlert() {
  const el = document.getElementById('alertBanner');
  el.className = 'alert-banner hidden';
}

// ──────────────────────────────────────────
// Overview (Dashboard Stats)
// ──────────────────────────────────────────
async function loadOverview() {
  try {
    const res  = await fetch(`${API}/seller/dashboard`, { headers: authHeaders() });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    const { stats, profile } = data.data;
    sellerProfile = profile;

    document.getElementById('stat-products-val').textContent = stats.productsCount ?? 0;
    document.getElementById('stat-sales-val').textContent    = stats.salesCount ?? 0;
    document.getElementById('stat-earnings-val').textContent = `SAR ${(stats.earnings || 0).toFixed(2)}`;

    const status = profile.verification_status;
    const statusEl = document.getElementById('stat-verify-val');
    statusEl.textContent = status === 'verified' ? '✅ Verified' : '⏳ Pending';
    statusEl.style.color = status === 'verified' ? 'var(--green)' : 'var(--orange)';
    document.getElementById('sellerStatus').textContent = status === 'verified' ? 'Verified Seller' : 'Pending Approval';

    setPerm('perm-sell',  profile.can_sell);
    setPerm('perm-offer', profile.can_make_offers);
    setPerm('perm-edit',  profile.can_edit_products);
    updateSellerTabVisibility(profile);

    if (status !== 'verified') {
      showAlert('⚠️ Your seller account is pending admin approval. Products you add will go live once verified.', 'info');
    }
  } catch (err) {
    showAlert('Failed to load dashboard: ' + err.message, 'error');
  }
}

function setPerm(id, enabled) {
  const el = document.getElementById(id);
  el.classList.toggle('on',  !!enabled);
  el.classList.toggle('off', !enabled);
}

// ──────────────────────────────────────────
// Load Categories (for product form)
// ──────────────────────────────────────────
async function loadCategories(selectId) {
  try {
    const res  = await fetch(`${API}/products/categories`, { headers: authHeaders() });
    const data = await res.json();
    const sel  = document.getElementById(selectId);
    sel.innerHTML = '<option value="">— Select Category —</option>';
    const cats = Array.isArray(data) ? data : (data.data || []);
    cats.forEach(c => {
      const opt = document.createElement('option');
      opt.value       = c.category_id;
      opt.textContent = c.parent_name ? `${c.parent_name} › ${c.category_name}` : c.category_name;
      sel.appendChild(opt);
    });
  } catch { /* silently fail */ }
}

// ──────────────────────────────────────────
// Products Tab
// ──────────────────────────────────────────
async function loadProducts() {
  const tbody = document.getElementById('productsBody');
  tbody.innerHTML = '<tr><td colspan="8" class="loading-row">Loading…</td></tr>';
  try {
    const res  = await fetch(`${API}/seller/products`, { headers: authHeaders() });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    const products = data.data;
    if (!products.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="loading-row">No products yet. <a href="#" onclick="switchTab(\'add-product\')">Add your first product →</a></td></tr>';
      return;
    }
    tbody.innerHTML = products.map(p => {
      const actions = sellerProfile && sellerProfile.can_edit_products
        ? `<button class="btn btn-sm btn-ghost" onclick="openEditModal(${JSON.stringify(p).replace(/"/g,'&quot;')})">✏️ Edit</button>
           <button class="btn btn-sm btn-danger" onclick="deleteProduct('${p.product_id}')">🗑️</button>`
        : '<span class="badge badge-orange">Edit locked</span>';

      return `
      <tr>
        <td>${p.primary_image
              ? `<img src="${escHtml(p.primary_image)}" class="thumb" alt="${escHtml(p.name)}" onerror="this.outerHTML='<div class=thumb-placeholder>📦</div>'" />`
              : '<div class="thumb-placeholder">📦</div>'}</td>
        <td><strong>${escHtml(p.name)}</strong><br/><span style="color:var(--text-secondary);font-size:12px">${escHtml(p.sku||'')}</span></td>
        <td>${escHtml(p.category_name||'—')}</td>
        <td>SAR ${parseFloat(p.base_price).toFixed(2)}${p.offer_price ? `<br/><span class="badge badge-orange">Offer: SAR ${parseFloat(p.offer_price).toFixed(2)}</span>` : ''}</td>
        <td>${p.stock_quantity}</td>
        <td>
          ${p.is_offer    ? '<span class="badge badge-purple">Offer</span> '   : ''}
          ${p.is_factory  ? '<span class="badge badge-blue">Factory</span>'    : ''}
          ${!p.is_offer && !p.is_factory ? '<span class="badge badge-green">Standard</span>' : ''}
        </td>
        <td>${p.is_active ? '<span class="badge badge-green">Live</span>' : '<span class="badge badge-orange">Pending</span>'}</td>
        <td style="display:flex;gap:6px;flex-wrap:wrap">${actions}</td>
      </tr>
    `;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" class="loading-row" style="color:var(--red)">Error: ${err.message}</td></tr>`;
  }
}

// ──────────────────────────────────────────
// Add Product Form
// ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadCategories('prod-category');

  document.getElementById('addProductForm').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = e.submitter;
    btn.disabled = true;
    btn.textContent = '⏳ Submitting…';

    const body = {
      name:           document.getElementById('prod-name').value.trim(),
      brand:          document.getElementById('prod-brand').value.trim(),
      base_price:     parseFloat(document.getElementById('prod-price').value),
      stock_quantity: parseInt(document.getElementById('prod-stock').value),
      category_id:    document.getElementById('prod-category').value,
      weight_kg:      parseFloat(document.getElementById('prod-weight').value) || null,
      description:    document.getElementById('prod-desc').value.trim(),
      image_url:      document.getElementById('prod-image').value.trim() || null,
      is_offer:       document.getElementById('prod-isOffer').checked,
      is_factory:     document.getElementById('prod-isFactory').checked,
      offer_price:    parseFloat(document.getElementById('prod-offerPrice').value) || null,
    };

    try {
      const res  = await fetch(`${API}/seller/products`, { method:'POST', headers: authHeaders(), body: JSON.stringify(body) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      showAlert('✅ ' + data.message, 'success');
      e.target.reset();
      document.getElementById('offerPriceGroup').style.display = 'none';
    } catch (err) {
      showAlert('❌ ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '🚀 Submit Product';
    }
  });

  // Offer form submit
  document.getElementById('addOfferForm').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = e.submitter;
    btn.disabled = true;
    btn.textContent = '⏳ Submitting…';

    const body = {
      product_id:     document.getElementById('offer-product').value,
      offer_title:    document.getElementById('offer-title').value.trim(),
      discount_type:  document.getElementById('offer-discType').value,
      discount_value: parseFloat(document.getElementById('offer-discValue').value),
      offer_price:    parseFloat(document.getElementById('offer-price').value) || null,
      start_date:     document.getElementById('offer-start').value,
      end_date:       document.getElementById('offer-end').value,
    };

    try {
      const res  = await fetch(`${API}/seller/offers`, { method:'POST', headers: authHeaders(), body: JSON.stringify(body) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      showAlert('✅ ' + data.message, 'success');
      e.target.reset();
    } catch (err) {
      showAlert('❌ ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '🏷️ Submit Offer for Approval';
    }
  });
});

function toggleOfferPrice() {
  document.getElementById('offerPriceGroup').style.display =
    document.getElementById('prod-isOffer').checked ? 'flex' : 'none';
}
function toggleEditOfferPrice() {
  document.getElementById('editOfferPriceGroup').style.display =
    document.getElementById('edit-isOffer').checked ? 'flex' : 'none';
}

// ──────────────────────────────────────────
// Delete Product
// ──────────────────────────────────────────
async function deleteProduct(id) {
  if (!confirm('Are you sure you want to delete this product? This cannot be undone.')) return;
  try {
    const res  = await fetch(`${API}/seller/products/${id}`, { method:'DELETE', headers: authHeaders() });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    showAlert('✅ ' + data.message, 'success');
    loadProducts();
  } catch (err) {
    showAlert('❌ ' + err.message, 'error');
  }
}

// ──────────────────────────────────────────
// Edit Product Modal
// ──────────────────────────────────────────
function openEditModal(product) {
  document.getElementById('edit-product-id').value   = product.product_id;
  document.getElementById('edit-name').value         = product.name || '';
  document.getElementById('edit-brand').value        = product.brand || '';
  document.getElementById('edit-price').value        = product.base_price || '';
  document.getElementById('edit-stock').value        = product.stock_quantity || '';
  document.getElementById('edit-desc').value         = product.description || '';
  document.getElementById('edit-image').value        = product.primary_image || '';
  document.getElementById('edit-isOffer').checked    = !!product.is_offer;
  document.getElementById('edit-isFactory').checked  = !!product.is_factory;
  document.getElementById('edit-offerPrice').value   = product.offer_price || '';
  document.getElementById('editOfferPriceGroup').style.display = product.is_offer ? 'flex' : 'none';
  openModal('editModal');
}

document.getElementById('editProductForm').addEventListener('submit', async e => {
  e.preventDefault();
  const id  = document.getElementById('edit-product-id').value;
  const btn = e.submitter;
  btn.disabled = true;

  const body = {
    name:           document.getElementById('edit-name').value.trim(),
    brand:          document.getElementById('edit-brand').value.trim(),
    base_price:     parseFloat(document.getElementById('edit-price').value),
    stock_quantity: parseInt(document.getElementById('edit-stock').value),
    description:    document.getElementById('edit-desc').value.trim(),
    image_url:      document.getElementById('edit-image').value.trim() || null,
    is_offer:       document.getElementById('edit-isOffer').checked,
    is_factory:     document.getElementById('edit-isFactory').checked,
    offer_price:    parseFloat(document.getElementById('edit-offerPrice').value) || null,
  };

  try {
    const res  = await fetch(`${API}/seller/products/${id}`, { method:'PUT', headers: authHeaders(), body: JSON.stringify(body) });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    showAlert('✅ ' + data.message, 'success');
    closeModal('editModal');
    loadProducts();
  } catch (err) {
    showAlert('❌ ' + err.message, 'error');
  } finally {
    btn.disabled = false;
  }
});

// ──────────────────────────────────────────
// Offers Tab
// ──────────────────────────────────────────
async function loadOffers() {
  const tbody = document.getElementById('offersBody');
  tbody.innerHTML = '<tr><td colspan="8" class="loading-row">Loading…</td></tr>';
  try {
    const res  = await fetch(`${API}/seller/offers`, { headers: authHeaders() });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    const offers = data.data;
    if (!offers.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="loading-row">No offers submitted yet.</td></tr>';
      return;
    }
    tbody.innerHTML = offers.map(o => `
      <tr>
        <td><strong>${escHtml(o.offer_title)}</strong></td>
        <td>${escHtml(o.product_name||'—')}</td>
        <td>${o.discount_type === 'percentage' ? `${o.discount_value}%` : `SAR ${o.discount_value}`}</td>
        <td>${o.offer_price ? `SAR ${parseFloat(o.offer_price).toFixed(2)}` : '—'}</td>
        <td style="font-size:12px">${fmtDate(o.start_date)} – ${fmtDate(o.end_date)}</td>
        <td>${statusBadge(o.status)}</td>
        <td style="font-size:12px;color:var(--text-secondary)">${escHtml(o.admin_note||'—')}</td>
        <td>
          ${o.status === 'pending'
            ? `<button class="btn btn-sm btn-danger" onclick="deleteOffer('${o.offer_id}')">Withdraw</button>`
            : '—'}
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" class="loading-row" style="color:var(--red)">Error: ${err.message}</td></tr>`;
  }
}

async function deleteOffer(id) {
  if (!confirm('Withdraw this offer?')) return;
  try {
    const res  = await fetch(`${API}/seller/offers/${id}`, { method:'DELETE', headers: authHeaders() });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    showAlert('✅ ' + data.message, 'success');
    loadOffers();
  } catch (err) {
    showAlert('❌ ' + err.message, 'error');
  }
}

async function loadProductSelectForOffer() {
  try {
    const res  = await fetch(`${API}/seller/products`, { headers: authHeaders() });
    const data = await res.json();
    const sel  = document.getElementById('offer-product');
    sel.innerHTML = '<option value="">— Select your product —</option>';
    (data.data || []).forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.product_id;
      opt.textContent = p.name;
      sel.appendChild(opt);
    });
  } catch { /* silently fail */ }
}

// ──────────────────────────────────────────
// Orders Tab
// ──────────────────────────────────────────
async function loadOrders() {
  const tbody = document.getElementById('ordersBody');
  tbody.innerHTML = '<tr><td colspan="8" class="loading-row">Loading…</td></tr>';
  try {
    const res  = await fetch(`${API}/seller/orders`, { headers: authHeaders() });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    const orders = data.data;
    if (!orders.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="loading-row">No orders yet.</td></tr>';
      return;
    }
    tbody.innerHTML = orders.map(o => `
      <tr>
        <td>${escHtml(o.product_name||'—')}</td>
        <td style="font-size:11px;color:var(--text-secondary)">${o.order_id.split('-')[0]}…</td>
        <td>${o.quantity}</td>
        <td>SAR ${parseFloat(o.item_total).toFixed(2)}</td>
        <td>${statusBadge(o.order_status)}</td>
        <td>${statusBadge(o.fulfillment_status)}</td>
        <td style="font-size:12px">${fmtDate(o.created_at)}</td>
        <td>
          <select class="status-select" onchange="updateOrderStatus('${o.order_item_id}', this.value)">
            <option ${o.fulfillment_status==='pending' ?'selected':''} value="pending">Pending</option>
            <option ${o.fulfillment_status==='picked'  ?'selected':''} value="picked">Picked</option>
            <option ${o.fulfillment_status==='shipped' ?'selected':''} value="shipped">Shipped</option>
          </select>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" class="loading-row" style="color:var(--red)">Error: ${err.message}</td></tr>`;
  }
}

async function updateOrderStatus(orderItemId, status) {
  try {
    const res  = await fetch(`${API}/seller/orders/${orderItemId}/status`, {
      method: 'PUT', headers: authHeaders(), body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    showAlert('✅ Fulfillment status updated.', 'success');
  } catch (err) {
    showAlert('❌ ' + err.message, 'error');
  }
}

// ──────────────────────────────────────────
// Earnings Tab
// ──────────────────────────────────────────
async function loadEarnings() {
  try {
    const res  = await fetch(`${API}/seller/earnings`, { headers: authHeaders() });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    const d = data.data;
    document.getElementById('earn-revenue').textContent    = `SAR ${parseFloat(d.total_revenue||0).toFixed(2)}`;
    document.getElementById('earn-commission').textContent = `SAR ${parseFloat(d.platform_commission||0).toFixed(2)}`;
    document.getElementById('earn-net').textContent        = `SAR ${parseFloat(d.seller_earnings||0).toFixed(2)}`;
  } catch (err) {
    showAlert('❌ ' + err.message, 'error');
  }
}

// ──────────────────────────────────────────
// Logout
// ──────────────────────────────────────────
document.getElementById('logoutBtn').addEventListener('click', () => {
  if (confirm('Log out of seller dashboard?')) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '../index.html';
  }
});

// ──────────────────────────────────────────
// Modal helpers
// ──────────────────────────────────────────
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});

// ──────────────────────────────────────────
// Utilities
// ──────────────────────────────────────────
function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' });
}

function statusBadge(status) {
  const map = {
    verified:  'badge-green',  approved:  'badge-green',  live:      'badge-green',
    pending:   'badge-orange', shipped:   'badge-blue',   picked:    'badge-blue',
    confirmed: 'badge-green',  delivered: 'badge-green',
    rejected:  'badge-red',    cancelled: 'badge-red',    suspended: 'badge-red',
  };
  const cls = map[status] || 'badge-blue';
  return `<span class="badge ${cls}">${escHtml(status)}</span>`;
}
