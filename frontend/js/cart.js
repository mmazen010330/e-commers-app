import API from './api.js';

/**
 * AuraShop Cart Service
 * Manages shopping cart state, syncing with backend and updating UI badges.
 */
const Cart = {
    items: [],

    async init() {
        if (localStorage.getItem('access_token')) {
            await this.load();
        }
        this.updateBadge();
    },

    async load(skipRefresh = false) {
        try {
            if (!navigator.onLine) {
                // Offline fallback
                const offlineCart = JSON.parse(localStorage.getItem('offline_cart') || '[]');
                this.items = offlineCart;
                this.updateBadge();
                if (!skipRefresh && window.location.hash === '#cart') window.dispatchEvent(new HashChangeEvent('hashchange'));
                return;
            }
            
            const response = await API.cart.get();
            if (response.success) {
                this.items = response.data.items || [];
                localStorage.setItem('offline_cart', JSON.stringify(this.items)); // Sync offline cache
                this.updateBadge();
                // Trigger a view refresh if we are currently on the cart page and not skipping
                if (!skipRefresh && window.location.hash === '#cart') {
                    window.dispatchEvent(new HashChangeEvent('hashchange'));
                }
            }
        } catch (error) {
            console.error('Cart Load Error:', error);
            const offlineCart = JSON.parse(localStorage.getItem('offline_cart') || '[]');
            this.items = offlineCart;
            this.updateBadge();
            if (!skipRefresh && window.location.hash === '#cart') window.dispatchEvent(new HashChangeEvent('hashchange'));
        }
    },

    async addItem(product, quantity = 1) {
        try {
            // Check if logged in
            if (!localStorage.getItem('access_token')) {
                window.location.hash = '#login';
                return;
            }

            if (!navigator.onLine) {
                // Add to offline cart
                const offlineCart = JSON.parse(localStorage.getItem('offline_cart') || '[]');
                const existing = offlineCart.find(i => i.product_id === product.product_id);
                if (existing) {
                    existing.quantity += quantity;
                } else {
                    offlineCart.push({ ...product, cart_item_id: 'offline-' + Date.now(), quantity, unit_price: product.base_price });
                }
                localStorage.setItem('offline_cart', JSON.stringify(offlineCart));
                await this.load();
                this.showToast(`${product.name} added to cart! (Offline)`);
                return;
            }

            const response = await API.cart.add({ product_id: product.product_id, quantity });
            if (response.success) {
                await this.load();
                this.showToast(`${product.name} added to cart!`);
            }
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    },

    async removeItem(itemId) {
        try {
            if (!navigator.onLine) {
                let offlineCart = JSON.parse(localStorage.getItem('offline_cart') || '[]');
                offlineCart = offlineCart.filter(i => i.cart_item_id !== itemId);
                localStorage.setItem('offline_cart', JSON.stringify(offlineCart));
                await this.load();
                return;
            }

            const response = await API.cart.remove(itemId);
            if (response.success) {
                await this.load();
            }
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    },

    async updateQuantity(itemId, quantity) {
        if (quantity < 1) return this.removeItem(itemId);
        try {
            if (!navigator.onLine) {
                let offlineCart = JSON.parse(localStorage.getItem('offline_cart') || '[]');
                const item = offlineCart.find(i => i.cart_item_id === itemId);
                if (item) item.quantity = quantity;
                localStorage.setItem('offline_cart', JSON.stringify(offlineCart));
                await this.load();
                return;
            }

            const response = await API.cart.update(itemId, quantity);
            if (response.success) {
                await this.load();
            }
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    },

    updateBadge() {
        const badge = document.getElementById('cart-badge');
        if (!badge) return;
        
        const count = this.items.reduce((sum, item) => sum + item.quantity, 0);
        if (count > 0) {
            badge.innerText = count;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    },

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerText = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);

        if (window.electronAPI) {
            window.electronAPI.showNotification('AuraShop', message);
        }
    }
};

export default Cart;
