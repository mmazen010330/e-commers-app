import CONFIG from './config.js';

/**
 * AuraShop Mock Data
 * Curated high-quality placeholders for when the backend is offline.
 */
const MOCK_DATA = {
    products: [
        { product_id: '1', name: 'Aura Phone 16 Pro', slug: 'aura-phone-16-pro', base_price: 999.00, category_name: 'Electronics', brand: 'Aura', primary_image: 'https://images.unsplash.com/photo-1696446701796-da61225697cc?q=80&w=800&auto=format&fit=crop', description: 'The pinnacle of mobile technology. Titanium design, A18 Pro chip, and revolutionary camera system.' },
        { product_id: '2', name: 'Sonic Studio Headphones', slug: 'sonic-studio', base_price: 299.00, category_name: 'Audio', brand: 'Sonic', primary_image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop', description: 'Immersive spatial audio with active noise cancellation. Professional grade sound for creators.' },
        { product_id: '3', name: 'Minimalist Quartz Watch', slug: 'minimalist-watch', base_price: 189.00, category_name: 'Accessories', brand: 'Luxe', primary_image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop', description: 'Timeless elegance meets modern precision. Sapphire glass and premium leather strap.' },
        { product_id: '4', name: 'EcoSmart Coffee Maker', slug: 'ecosmart-coffee', base_price: 449.00, category_name: 'Home', brand: 'Eco', primary_image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=800&auto=format&fit=crop', description: 'Barista-quality coffee at home. Energy-efficient brewing with smart temperature control.' },
        { product_id: '5', name: 'Horizon Drone X4', slug: 'horizon-drone', base_price: 1299.00, category_name: 'Electronics', brand: 'Horizon', primary_image: 'https://images.unsplash.com/photo-1473960104312-bf2e1203402d?q=80&w=800&auto=format&fit=crop', description: 'Professional 4K aerial cinematography. 45-minute flight time and obstacle avoidance.' },
        { product_id: '6', name: 'Performance Running Shoes', slug: 'running-shoes', base_price: 159.00, category_name: 'Fashion', brand: 'Velocity', primary_image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop', description: 'Maximum cushioning and energy return. Breathable mesh for long-distance comfort.' }
    ],
    categories: [
        { category_id: 'c1', category_name: 'Electronics', slug: 'electronics' },
        { category_id: 'c2', category_name: 'Fashion', slug: 'fashion' },
        { category_id: 'c3', category_name: 'Home', slug: 'home' },
        { category_id: 'c4', category_name: 'Audio', slug: 'audio' }
    ]
};

localStorage.removeItem('cache_/products/categories');
localStorage.removeItem('cache_categories');

const API = {
    async request(endpoint, options = {}) {
        const url = `${CONFIG.API_BASE_URL}${endpoint}`;
        const token = localStorage.getItem('access_token');

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, { ...options, headers, cache: 'no-store' });
            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401 || response.status === 403 || (data.message && data.message.toLowerCase().includes('token'))) {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    localStorage.removeItem('user');
                    setTimeout(() => {
                        window.location.hash = '#login';
                        window.location.reload(); // Hard reload to clear app state
                    }, 500);
                }
                throw new Error(data.message || 'Something went wrong');
            }

            // Cache products/categories for offline use
            if (endpoint.includes('/products') || endpoint.includes('/categories')) {
                localStorage.setItem(`cache_${endpoint}`, JSON.stringify(data));
            }

            return data;
        } catch (error) {
            // Only fall back to mock data if it's a network error (server unreachable)
            // If it's a real API error (401, 400, 500), we want to show it.
            if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
                console.warn(`Server unreachable at ${endpoint}. Using mock data.`);
                return this.handleFallback(endpoint);
            }
            throw error;
        }
    },

    /**
     * Smart Fallback Logic
     */
    handleFallback(endpoint) {
        // Try to load from offline cache first
        const cached = localStorage.getItem(`cache_${endpoint}`);
        if (cached) {
            console.log(`Loaded ${endpoint} from offline cache`);
            return JSON.parse(cached);
        }

        if (endpoint.includes('/categories') || endpoint.includes('categories')) {
            return { success: true, data: MOCK_DATA.categories };
        }

        if (endpoint.includes('/products')) {
            if (endpoint.includes('/products/') && !endpoint.includes('/products/categories')) {
                const slug = endpoint.split('/').pop();
                return { success: true, data: { ...MOCK_DATA.products.find(p => p.slug === slug), images: [{image_url: MOCK_DATA.products.find(p => p.slug === slug).primary_image}], variants: [] } };
            }
            return { success: true, data: MOCK_DATA.products };
        }
        if (endpoint.includes('/search')) return { success: true, data: MOCK_DATA.products };
        if (endpoint.includes('/cart')) return { success: true, data: { items: [], total_amount: 0 } };
        
        return { success: false, message: 'Backend connection failed. Please ensure the server is running.' };
    },

    // --- API ENDPOINTS ---
    auth: {
        login: (credentials) => API.request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
        register: (userData) => API.request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
        logout: () => API.request('/auth/logout', { method: 'POST' })
    },

    products: {
        getAll: (params = '') => API.request(`/products?${params}`),
        getOne: (slug) => API.request(`/products/${slug}`),
        search: (q) => API.request(`/search?q=${q}`),
        getCategories: () => API.request('/products/categories'),
        create: (data) => API.request('/products', { method: 'POST', body: JSON.stringify(data) })
    },

    cart: {
        get: () => API.request('/cart'),
        add: (item) => API.request('/cart', { method: 'POST', body: JSON.stringify(item) }),
        update: (id, qty) => API.request(`/cart/${id}`, { method: 'PUT', body: JSON.stringify({ quantity: qty }) }),
        remove: (id) => API.request(`/cart/${id}`, { method: 'DELETE' }),
        clear: () => API.request('/cart', { method: 'DELETE' })
    },

    orders: {
        checkout: (data) => API.request('/orders/checkout', { method: 'POST', body: JSON.stringify(data) }),
        create: (data) => API.request('/orders', { method: 'POST', body: JSON.stringify(data) }),
        getAll: () => API.request('/orders'),
        getOne: (id) => API.request(`/orders/${id}`)
    },

    seller: {
        getDashboard: () => API.request('/seller/dashboard'),
        getProducts: () => API.request('/seller/products'),
        createProduct: (data) => API.request('/seller/products', { method: 'POST', body: JSON.stringify(data) }),
        updateProduct: (id, data) => API.request(`/seller/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        deleteProduct: (id) => API.request(`/seller/products/${id}`, { method: 'DELETE' }),
        getOrders: () => API.request('/seller/orders'),
        updateOrderStatus: (id, status) => API.request(`/seller/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
        getEarnings: () => API.request('/seller/earnings')
    },

    admin: {
        getPendingCodOrders: () => API.request('/admin/orders/pending'),
        confirmCodOrder: (id) => API.request(`/admin/orders/${id}/confirm`, { method: 'PUT' }),
        getSellers: () => API.request('/admin/sellers'),
        getPendingSellers: () => API.request('/admin/sellers/pending'),
        verifySeller: (id) => API.request(`/admin/sellers/${id}/verify`, { method: 'PUT' }),
        rejectSeller: (id) => API.request(`/admin/sellers/${id}/reject`, { method: 'PUT' }),
        updateSellerPermissions: (id, perms) => API.request(`/admin/sellers/${id}/permissions`, { method: 'PUT', body: JSON.stringify(perms) }),
        getPendingProducts: () => API.request('/admin/products/pending'),
        getAllProducts: () => API.request('/admin/products'),
        addProduct: (data) => API.request('/admin/products', { method: 'POST', body: JSON.stringify(data) }),
        approveProduct: (id) => API.request(`/admin/products/${id}/approve`, { method: 'PUT' }),
        deleteProduct: (id) => API.request(`/admin/products/${id}`, { method: 'DELETE' }),
        editProduct: (id, data) => API.request(`/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        getPendingOffers: () => API.request('/admin/offers/pending'),
        approveOffer: (id) => API.request(`/admin/offers/${id}/approve`, { method: 'PUT' }),
        rejectOffer: (id, note) => API.request(`/admin/offers/${id}/reject`, { method: 'PUT', body: JSON.stringify({ note }) })
    }
};

export default API;
