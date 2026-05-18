/**
 * AuraShop Main Application Entry Point
 * Handles routing, view rendering, and global event management.
 */

import CONFIG from './config.js';
import API from './api.js';
import Auth from './auth.js';
import Cart from './cart.js';

const fixImageUrl = (url) => {
    if (!url) return 'https://via.placeholder.com/300';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const cleanUrl = url.startsWith('/') ? url : '/' + url;
    return 'http://localhost:5000' + cleanUrl;
};

const extractDirectImageUrl = (url) => {
    if (!url) return url;
    try {
        const parsedUrl = new URL(url);
        // Check for Bing Images Detail URL
        if (parsedUrl.hostname.includes('bing.com') && parsedUrl.pathname.includes('/images/')) {
            const mediaUrl = parsedUrl.searchParams.get('mediaurl');
            if (mediaUrl) return decodeURIComponent(mediaUrl);
        }
        // Check for Google Images URL
        if (parsedUrl.hostname.includes('google.') && parsedUrl.pathname.includes('/imgres')) {
            const imgUrl = parsedUrl.searchParams.get('imgurl');
            if (imgUrl) return decodeURIComponent(imgUrl);
        }
        // Check for Google Search redirect link
        if (parsedUrl.hostname.includes('google.') && parsedUrl.pathname.includes('/url')) {
            const qUrl = parsedUrl.searchParams.get('url') || parsedUrl.searchParams.get('q');
            if (qUrl) return extractDirectImageUrl(decodeURIComponent(qUrl));
        }
    } catch (e) {
        // Not a valid URL or parsing failed
    }
    return url;
};

const App = {
    /**
     * Application Entry Point
     */
    async init() {
        // Expose modules to window for inline onclick handlers
        window.API = API;
        window.Auth = Auth;
        window.Cart = Cart;

        // Initialize Core Services
        Auth.init();
        Cart.init();
        
        // Setup Router
        window.addEventListener('hashchange', () => this.router());
        this.router(); // Handle initial load
        
        // Setup Global UI Listeners
        this.setupEventListeners();
        
        this.setupNetworkListeners();

        console.log('AuraShop Application Initialized');
    },

    setupNetworkListeners() {
        const banner = document.getElementById('offline-banner');
        const updateOnlineStatus = () => {
            if (navigator.onLine) {
                if(banner) banner.style.display = 'none';
            } else {
                if(banner) banner.style.display = 'block';
            }
        };

        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        updateOnlineStatus();

        document.getElementById('retry-connection-btn')?.addEventListener('click', () => {
            if (navigator.onLine) {
                window.location.reload();
            } else {
                alert('Still offline. Please check your connection.');
            }
        });

        if (window.electronAPI) {
            document.getElementById('nav-settings').style.display = 'inline-block';
            window.electronAPI.onMenuNavigate((path) => {
                window.location.hash = `#${path}`;
            });
        }
    },

    /**
     * SPA Router - Maps URL hash to view rendering methods
     */
    async router() {
        const path = window.location.hash.slice(1) || 'home';
        const main = document.getElementById('main-content');
        
        // Show loading state
        main.innerHTML = '<div class="loader-container" style="display:flex; justify-content:center; align-items:center; height:50vh;"><div class="loader"></div></div>';

        // Parse path and params
        const [route, queryStr] = path.split('?');
        const parts = route.split('/');
        const view = parts[0];
        const id = parts[1];

        // Parse search params
        const params = new URLSearchParams(queryStr);

        try {
            switch (view) {
                case 'home':      await this.renderHome(main); break;
                case 'shop':      await this.renderShop(main, params); break;
                case 'product':   await this.renderProductDetail(main, id); break;
                case 'cart':      await this.renderCart(main); break;
                case 'payment':   await this.renderPayment(main); break;
                case 'login':     await this.renderLogin(main); break;
                case 'register':  await this.renderRegister(main); break;
                case 'settings':  await this.renderSettings(main); break;
                case 'profile':
                    if (!Auth.isLoggedIn()) { window.location.hash = '#login'; return; }
                    await this.renderProfile(main);
                    break;
                case 'admin':
                    if (!Auth.isLoggedIn()) { window.location.hash = '#login'; return; }
                    const user = Auth.getUser();
                    if (!user || user.role !== 'admin') { 
                        alert('Access Denied: Administrators only.');
                        window.location.hash = '#home'; 
                        return; 
                    }
                    await this.renderAdmin(main);
                    break;
                case 'seller':
                    if (!Auth.isLoggedIn()) { window.location.hash = '#login'; return; }
                    const sellerUser = Auth.getUser();
                    if (!sellerUser || (sellerUser.role !== 'seller' && sellerUser.role !== 'admin')) { 
                        alert('Access Denied: Seller accounts only.');
                        window.location.hash = '#home'; 
                        return; 
                    }
                    await this.renderSellerDashboard(main);
                    break;
                default:
                    await this.renderHome(main);
            }
        } catch (error) {
            console.error('Routing error:', error);
            main.innerHTML = `<div class="container" style="padding: 100px 0; text-align: center;"><h1>System Error</h1><p>${error.message}</p></div>`;
        }
        
        window.scrollTo(0, 0); // Reset scroll on navigation
    },

    setupEventListeners() {
        // Search execution
        const searchInput = document.querySelector('.search-bar input');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') window.location.hash = `#shop?q=${searchInput.value}`;
            });
        }
    },

    // --- VIEW RENDERERS ---

    /**
     * Home Page View
     */
    async renderHome(container) {
        try {
            const products = await API.products.getAll('limit=4');
            
            container.innerHTML = `
                <!-- Hero Section -->
                <section class="container" style="padding-top: 5rem; display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: 4rem;">
                    <div>
                        <h1 style="font-size: 4rem; line-height: 1.1; margin-bottom: 2rem;">Elevate Your <span class="text-gradient">Daily Life</span></h1>
                        <p style="color: var(--text-muted); font-size: 1.2rem; margin-bottom: 3rem;">Premium products curated for quality, style, and performance. Experience the future of shopping.</p>
                        <div style="display: flex; gap: 1rem;">
                            <a href="#shop" class="btn-primary">Shop Collection</a>
                            <a href="#shop?cat=electronics" class="btn-primary" style="background: var(--surface); color: white;">Latest Tech</a>
                        </div>
                    </div>
                    <div style="border-radius: 40px; overflow: hidden; height: 600px; box-shadow: var(--shadow-xl); background: var(--surface);">
                        <img src="https://images.unsplash.com/photo-1491933382434-500287f9b54b?q=80&w=1200&auto=format&fit=crop" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.8;">
                    </div>
                </section>

                <!-- Featured Products -->
                <section class="container" style="padding: 100px 0;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 4rem;">
                        <div>
                            <p style="color: var(--primary); font-weight: 700; text-transform: uppercase; letter-spacing: 2px;">Curated for you</p>
                            <h2 style="font-size: 2.5rem;">Featured Products</h2>
                        </div>
                        <a href="#shop" style="color: var(--text-muted); text-decoration: none; font-weight: 600;">View All <i class="fas fa-arrow-right" style="margin-left: 8px;"></i></a>
                    </div>
                    <div class="product-grid">
                        ${products.data.map(p => this.renderProductCard(p)).join('')}
                    </div>
                </section>

                <!-- Categories -->
                <section style="background: var(--surface); padding: 100px 0;">
                    <div class="container">
                        <h2 style="text-align: center; margin-bottom: 4rem;">Browse by Category</h2>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem;">
                            ${['Electronics', 'Fashion', 'Home', 'Beauty'].map(cat => `
                                <a href="#shop?cat=${cat.toLowerCase()}" class="glass-panel" style="padding: 3rem; text-align: center; text-decoration: none; color: white; border-radius: 24px; transition: var(--transition);">
                                    <h3 style="font-size: 1.5rem;">${cat}</h3>
                                    <p style="color: var(--text-muted); margin-top: 1rem;">Explore Collection</p>
                                </a>
                            `).join('')}
                        </div>
                    </div>
                </section>
            `;
        } catch (error) {
            container.innerHTML = `<div class="container" style="padding: 100px 0; text-align: center;"><h2>Error loading home page</h2><p>${error.message}</p></div>`;
        }
    },

    /**
     * Shop View
     */
    async renderShop(container, params) {
        const query = params.toString();
        const products = await API.products.getAll(query);
        
        container.innerHTML = `
            <div class="container" style="padding: 50px 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4rem;">
                    <h1>Explore Store</h1>
                    <div style="display: flex; gap: 1rem;">
                        <select class="btn-primary" style="background: var(--surface); color: white; border: 1px solid var(--border);">
                            <option>Newest First</option>
                            <option>Price: Low to High</option>
                            <option>Price: High to Low</option>
                        </select>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 280px 1fr; gap: 4rem;">
                    <!-- Sidebar Filters -->
                    <aside>
                        <div class="glass-panel" style="padding: 2rem; border-radius: 20px; position: sticky; top: 120px;">
                            <h3 style="margin-bottom: 2rem;">Filters</h3>
                            <div style="margin-bottom: 2rem;">
                                <h4 style="margin-bottom: 1rem; font-size: 0.9rem; color: var(--text-muted);">CATEGORIES</h4>
                                <div style="display: flex; flex-direction: column; gap: 0.8rem;">
                                    <label><input type="checkbox"> Electronics</label>
                                    <label><input type="checkbox"> Fashion</label>
                                    <label><input type="checkbox"> Home</label>
                                </div>
                            </div>
                            <div style="margin-bottom: 2rem;">
                                <h4 style="margin-bottom: 1rem; font-size: 0.9rem; color: var(--text-muted);">PRICE RANGE</h4>
                                <input type="range" style="width: 100%;">
                                <div style="display: flex; justify-content: space-between; margin-top: 0.5rem; font-size: 0.8rem;">
                                    <span>$0</span>
                                    <span>$5000</span>
                                </div>
                            </div>
                            <button class="btn-primary" style="width: 100%;">Apply Filters</button>
                        </div>
                    </aside>

                    <!-- Main Grid -->
                    <div>
                        <div class="product-grid">
                            ${products.data.length > 0 ? products.data.map(p => this.renderProductCard(p)).join('') : '<p>No products found.</p>'}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Product Card Helper
     */
    renderProductCard(product) {
        const imageUrl = fixImageUrl(product.primary_image);
        
        return `
            <div class="product-card" onclick="window.location.hash = '#product/${product.slug}'">
                <div style="position: relative; height: 300px;">
                    <img src="${imageUrl}" class="product-image" alt="${product.name}">
                    <div class="product-badge">${product.brand || 'Premium'}</div>
                </div>
                <div class="product-info">
                    <p style="color: var(--primary); font-size: 0.7rem; font-weight: 800; text-transform: uppercase;">${product.category_name}</p>
                    <h3 style="margin: 0.5rem 0; font-size: 1.1rem;">${product.name}</h3>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1.5rem;">
                        <span style="font-weight: 800; font-size: 1.2rem;">$${product.base_price}</span>
                        <button onclick="event.stopPropagation(); window.Cart.addItem(${JSON.stringify(product).replace(/"/g, '&quot;')})" class="btn-primary" style="padding: 0.5rem 1rem; border-radius: 8px;">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Product Detail View
     */
    async renderProductDetail(main, slug) {
        const product = await API.products.getOne(slug);
        const p = product.data;
        
        const mainImageUrl = fixImageUrl(p.images[0]?.image_url);

        main.innerHTML = `
            <div class="container" style="padding: 100px 0;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6rem;">
                    <!-- Gallery -->
                    <div>
                        <div style="border-radius: 30px; overflow: hidden; background: var(--surface); height: 600px; margin-bottom: 1rem;">
                            <img src="${mainImageUrl}" style="width: 100%; height: 100%; object-fit: cover;">
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem;">
                            ${p.images.map(img => {
                                const thumbUrl = fixImageUrl(img.image_url);
                                return `<div style="height: 100px; border-radius: 12px; overflow: hidden; background: var(--surface);"><img src="${thumbUrl}" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.6; cursor: pointer;"></div>`;
                            }).join('')}
                        </div>
                    </div>

                    <!-- Info -->
                    <div>
                        <p style="color: var(--primary); font-weight: 700; margin-bottom: 1rem;">${p.category_name} / ${p.brand}</p>
                        <h1 style="font-size: 3.5rem; margin-bottom: 1.5rem;">${p.name}</h1>
                        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem;">
                            <div style="color: #fbbf24;"><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star-half-alt"></i></div>
                            <span style="color: var(--text-muted); font-size: 0.9rem;">(128 customer reviews)</span>
                        </div>
                        <p style="font-size: 2.5rem; font-weight: 800; margin-bottom: 2rem;">$${p.base_price}</p>
                        <p style="color: var(--text-muted); line-height: 1.8; margin-bottom: 3rem; font-size: 1.1rem;">${p.description}</p>
                        
                        <!-- Variants -->
                        ${p.variants.length > 0 ? `
                            <div style="margin-bottom: 3rem;">
                                <h4 style="margin-bottom: 1rem;">Select Variant</h4>
                                <div style="display: flex; gap: 1rem;">
                                    ${p.variants.map(v => `<button class="glass-panel" style="padding: 0.8rem 1.5rem; border-radius: 10px; color: white;">${v.variant_name}</button>`).join('')}
                                </div>
                            </div>
                        ` : ''}

                        <div style="display: flex; gap: 1.5rem;">
                            <button onclick="window.Cart.addItem(${JSON.stringify(p).replace(/"/g, '&quot;')})" class="btn-primary" style="flex: 1; padding: 1.5rem; font-size: 1.1rem;">Add to Cart</button>
                            <button class="btn-primary" style="background: white; color: var(--background); padding: 1.5rem;"><i class="far fa-heart"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Login View
     */
    async renderLogin(main) {
        main.innerHTML = `
            <div class="container" style="display: flex; justify-content: center; align-items: center; min-height: 80vh;">
                <div class="glass-panel" style="width: 100%; max-width: 450px; padding: 4rem; border-radius: 30px;">
                    <h2 style="font-size: 2rem; margin-bottom: 1rem; text-align: center;">Welcome Back</h2>
                    <p style="color: var(--text-muted); text-align: center; margin-bottom: 1rem;">Login to your AuraShop account</p>
                    <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 8px; margin-bottom: 2rem; font-size: 0.85rem; color: var(--text-muted);">
                        <strong style="color: white;">Requirements:</strong><br>
                        • Valid Email Address<br>
                        • Your Password
                    </div>
                    
                    <form id="login-form" novalidate>
                        <div style="margin-bottom: 1.5rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">Email Address</label>
                            <input type="email" id="email" style="width: 100%; background: var(--surface); border: 1px solid var(--border); padding: 1rem; border-radius: 12px; color: white;">
                        </div>
                        <div style="margin-bottom: 2.5rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">Password</label>
                            <input type="password" id="password" style="width: 100%; background: var(--surface); border: 1px solid var(--border); padding: 1rem; border-radius: 12px; color: white;">
                        </div>
                        <button type="submit" class="btn-primary" style="width: 100%; padding: 1.2rem;">Login</button>
                    </form>
                    
                    <p style="text-align: center; margin-top: 2rem; font-size: 0.9rem;">
                        Don't have an account? <a href="#register" style="color: var(--primary); font-weight: 600;">Register</a>
                    </p>
                </div>
            </div>
        `;

        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = e.target.email.value;
            const password = e.target.password.value;
            
            if (!email || !password) {
                alert('Please fill out all fields.');
                return;
            }

            const btn = e.target.querySelector('button');
            btn.innerText = 'Logging in...';
            btn.disabled = true;
            
            const response = await Auth.login(email, password);
            if (response.success) {
                const user = Auth.getUser();
                if (user && user.role === 'admin') {
                    window.location.hash = '#admin';
                } else {
                    window.location.hash = '#home';
                }
            } else {
                alert(response.message || 'Login failed. Please check your credentials.');
                btn.innerText = 'Login';
                btn.disabled = false;
            }
        });
    },

    /**
     * Cart View
     */
    async renderCart(main) {
        if (!Auth.isLoggedIn()) { window.location.hash = '#login'; return; }
        
        await Cart.load(true);
        const items = Cart.items;

        main.innerHTML = `
            <div class="container" style="padding: 80px 0;">
                <h1 style="margin-bottom: 4rem;">Your Shopping Bag</h1>
                
                <div style="display: grid; grid-template-columns: 1fr 380px; gap: 5rem;">
                    <div style="max-height: 60vh; overflow-y: auto; padding-right: 15px;">
                        ${items.length === 0 ? '<p>Your cart is empty.</p>' : items.map(item => {
                            const itemImg = fixImageUrl(item.image_url);
                            return `
                            <div class="glass-panel" style="display: flex; gap: 2rem; padding: 2rem; border-radius: 20px; margin-bottom: 1.5rem; align-items: center;">
                                <img src="${itemImg}" style="width: 120px; height: 120px; border-radius: 15px; object-fit: cover;">
                                <div style="flex: 1;">
                                    <h3 style="margin-bottom: 0.5rem;">${item.name}</h3>
                                    <p style="color: var(--text-muted);">$${item.unit_price}</p>
                                </div>
                                <div style="display: flex; align-items: center; gap: 1.5rem;">
                                    <div style="display: flex; align-items: center; background: var(--surface); border-radius: 10px; padding: 0.5rem;">
                                        <button onclick="window.Cart.updateQuantity('${item.cart_item_id}', ${item.quantity - 1})" style="background: none; border: none; color: white; cursor: pointer; padding: 0 10px;"><i class="fas fa-minus"></i></button>
                                        <span style="width: 30px; text-align: center; font-weight: 700;">${item.quantity}</span>
                                        <button onclick="window.Cart.updateQuantity('${item.cart_item_id}', ${item.quantity + 1})" style="background: none; border: none; color: white; cursor: pointer; padding: 0 10px;"><i class="fas fa-plus"></i></button>
                                    </div>
                                    <button onclick="window.Cart.removeItem('${item.cart_item_id}')" style="background: none; border: none; color: var(--accent); cursor: pointer; font-size: 1.2rem;"><i class="far fa-trash-alt"></i></button>
                                </div>
                            </div>
                        `;
                        }).join('')}
                    </div>

                    <aside>
                        <div class="glass-panel" style="padding: 3rem; border-radius: 30px; position: sticky; top: 120px;">
                            <h3 style="margin-bottom: 2rem;">Order Summary</h3>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 1rem; color: var(--text-muted);">
                                <span>Subtotal</span>
                                <span>$${items.reduce((s, i) => s + i.unit_price * i.quantity, 0).toFixed(2)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 1rem; color: var(--text-muted);">
                                <span>Shipping</span>
                                <span>Free</span>
                            </div>
                            <div style="border-top: 1px solid var(--border); margin-top: 2rem; padding-top: 2rem; display: flex; justify-content: space-between; font-size: 1.5rem; font-weight: 800;">
                                <span>Total</span>
                                <span>$${items.reduce((s, i) => s + i.unit_price * i.quantity, 0).toFixed(2)}</span>
                            </div>
                            <button id="checkout-btn" class="btn-primary" style="width: 100%; padding: 1.5rem; margin-top: 3rem; font-size: 1.1rem;">Checkout Now</button>
                            ${window.electronAPI ? `<button onclick="window.electronAPI.printInvoice()" class="btn-primary" style="width: 100%; padding: 1.5rem; margin-top: 1rem; font-size: 1.1rem; background: var(--surface); color: white; border: 1px solid var(--border);">Print Invoice</button>` : ''}
                        </div>
                    </aside>
                </div>
            </div>
        `;

        document.getElementById('checkout-btn')?.addEventListener('click', (e) => {
            window.location.hash = '#payment';
        });
    },

    /**
     * Register View
     */
    async renderRegister(main) {
        main.innerHTML = `
            <div class="container" style="display: flex; justify-content: center; align-items: center; min-height: 80vh;">
                <div class="glass-panel" style="width: 100%; max-width: 450px; padding: 4rem; border-radius: 30px;">
                    <h2 style="font-size: 2rem; margin-bottom: 1rem; text-align: center;">Join AuraShop</h2>
                    <p style="color: var(--text-muted); text-align: center; margin-bottom: 1rem;">Create your premium shopping account</p>
                    <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 8px; margin-bottom: 2rem; font-size: 0.85rem; color: var(--text-muted);">
                        <strong style="color: white;">Registration Requirements:</strong><br>
                        • All fields must be filled out<br>
                        • Valid Email Address<br>
                        • Phone Number is required<br>
                        • Passwords must match
                    </div>
                    
                    <form id="register-form" novalidate>
                        <div style="margin-bottom: 1.5rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">Full Name</label>
                            <input type="text" id="fullname" style="width: 100%; background: var(--surface); border: 1px solid var(--border); padding: 1rem; border-radius: 12px; color: white;">
                        </div>
                        <div style="margin-bottom: 1.5rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">Email Address</label>
                            <input type="email" id="email" style="width: 100%; background: var(--surface); border: 1px solid var(--border); padding: 1rem; border-radius: 12px; color: white;">
                        </div>
                        <div style="margin-bottom: 1.5rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">Phone Number</label>
                            <input type="tel" id="phone" style="width: 100%; background: var(--surface); border: 1px solid var(--border); padding: 1rem; border-radius: 12px; color: white;">
                        </div>
                        <div style="margin-bottom: 1.5rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">Password</label>
                            <input type="password" id="password" style="width: 100%; background: var(--surface); border: 1px solid var(--border); padding: 1rem; border-radius: 12px; color: white;">
                        </div>
                         <div style="margin-bottom: 1.5rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">Confirm Password</label>
                            <input type="password" id="confirm-password" style="width: 100%; background: var(--surface); border: 1px solid var(--border); padding: 1rem; border-radius: 12px; color: white;">
                        </div>
                        <div style="margin-bottom: 2.5rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">Account Role</label>
                            <select id="role" style="width: 100%; background: var(--surface); border: 1px solid var(--border); padding: 1rem; border-radius: 12px; color: white;">
                                <option value="customer">Customer (Buy Products)</option>
                                <option value="seller">Seller (Sell Products)</option>
                                <option value="admin">Administrator (Manage Store & COD Orders)</option>
                            </select>
                        </div>
                        <button type="submit" class="btn-primary" style="width: 100%; padding: 1.2rem;">Create Account</button>
                    </form>
                    
                    <p style="text-align: center; margin-top: 2rem; font-size: 0.9rem;">
                        Already have an account? <a href="#login" style="color: var(--primary); font-weight: 600;">Login</a>
                    </p>
                </div>
            </div>
        `;

        document.getElementById('register-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const fullName = e.target.fullname.value;
            const email = e.target.email.value;
            const phone = e.target.phone.value;
            const password = e.target.password.value;
            const confirmPassword = e.target['confirm-password'].value;
            const role = e.target.role.value;
            
            if (!fullName || !email || !phone || !password || !confirmPassword || !role) {
                alert('Please fill out all fields.');
                return;
            }
            
            if (password !== confirmPassword) {
                alert('Passwords do not match');
                return;
            }

            const btn = e.target.querySelector('button');
            btn.innerText = 'Creating account...';
            btn.disabled = true;
            
            const response = await Auth.register({
                full_name: fullName,
                email: email,
                phone: phone,
                password: password,
                role: role
            });

            if (response.success) {
                alert('Registration successful! Please login.');
                window.location.hash = '#login';
            } else {
                alert('Registration failed: ' + response.message);
                btn.innerText = 'Create Account';
                btn.disabled = false;
            }
        });
    },

    /**
     * Profile View
     */
    async renderProfile(main) {
        const user = Auth.getUser();
        
        let ordersHtml = '<p style="color: var(--text-muted);">No orders placed yet.</p>';
        try {
            const ordersRes = await API.orders.getAll();
            const orders = ordersRes.data || [];
            if (orders.length > 0) {
                ordersHtml = `
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; text-align: left;">
                            <thead>
                                <tr style="border-bottom: 1px solid var(--border); color: var(--text-muted); font-size: 0.85rem;">
                                    <th style="padding: 1rem 0;">ORDER ID</th>
                                    <th style="padding: 1rem 0;">DATE</th>
                                    <th style="padding: 1rem 0;">TOTAL</th>
                                    <th style="padding: 1rem 0;">STATUS</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${orders.map(o => `
                                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                                        <td style="padding: 1.5rem 0; font-family: monospace; font-size: 0.9rem; color: var(--primary); cursor: pointer; text-decoration: underline;" onclick="window.App.showOrderDetail('${o.order_id}')">${o.order_id.substring(0, 8)}...</td>
                                        <td style="padding: 1.5rem 0;">${new Date(o.created_at).toLocaleDateString()}</td>
                                        <td style="padding: 1.5rem 0; font-weight: bold;">$${Number(o.final_amount).toFixed(2)}</td>
                                        <td style="padding: 1.5rem 0;">
                                            ${(o.order_status || 'pending') === 'pending' ? `
                                                <span style="background: rgba(255, 170, 0, 0.1); color: rgb(255, 185, 0); padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600; text-transform: capitalize;">Pending</span>
                                            ` : (o.order_status || '').toLowerCase() === 'cancelled' || (o.order_status || '').toLowerCase() === 'refunded' ? `
                                                <span style="background: rgba(255, 75, 75, 0.1); color: rgb(255, 90, 90); padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600; text-transform: capitalize;">${o.order_status}</span>
                                            ` : `
                                                <span style="background: rgba(0, 200, 80, 0.1); color: rgb(0, 220, 100); padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600; text-transform: capitalize;">${o.order_status}</span>
                                            `}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            ordersHtml = '<p style="color: var(--accent);">Failed to load order history.</p>';
        }

        main.innerHTML = `
            <div class="container" style="padding: 80px 0;">
                <div style="display: grid; grid-template-columns: 300px 1fr; gap: 4rem;">
                    <aside>
                        <div class="glass-panel" style="padding: 2rem; border-radius: 20px; text-align: center;">
                            <div style="width: 100px; height: 100px; background: var(--primary); border-radius: 50%; margin: 0 auto 1.5rem; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; color: white;">
                                ${user.full_name[0]}
                            </div>
                            <h3>${user.full_name}</h3>
                            <p style="color: var(--text-muted); margin-bottom: 2rem;">${user.email}</p>
                            <button onclick="window.Auth.logout()" class="btn-primary" style="width: 100%; background: var(--accent);">Logout</button>
                        </div>
                    </aside>
                    <div>
                        <h2 style="margin-bottom: 2rem;">Account Overview</h2>
                        <div class="glass-panel" style="padding: 3rem; border-radius: 20px; margin-bottom: 3rem;">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                                <div>
                                    <label style="color: var(--text-muted); font-size: 0.8rem;">FULL NAME</label>
                                    <p style="font-size: 1.2rem; margin-top: 0.5rem;">${user.full_name}</p>
                                </div>
                                <div>
                                    <label style="color: var(--text-muted); font-size: 0.8rem;">EMAIL</label>
                                    <p style="font-size: 1.2rem; margin-top: 0.5rem;">${user.email}</p>
                                </div>
                                <div>
                                    <label style="color: var(--text-muted); font-size: 0.8rem;">MEMBER SINCE</label>
                                    <p style="font-size: 1.2rem; margin-top: 0.5rem;">${new Date().toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>

                        <h2 style="margin-bottom: 2rem;">Order History</h2>
                        <div class="glass-panel" style="padding: 3rem; border-radius: 20px;">
                            ${ordersHtml}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Settings View (Desktop Only)
     */
    async renderSettings(main) {
        let currentUrl = 'http://localhost:3000';
        let autoLaunch = false;
        let notifications = true;

        if (window.electronAPI) {
            currentUrl = await window.electronAPI.getStoreValue('settings.serverUrl') || 'http://localhost:3000';
            autoLaunch = await window.electronAPI.getStoreValue('settings.autoLaunch') || false;
            notifications = await window.electronAPI.getStoreValue('settings.notifications') !== false;
        }

        main.innerHTML = `
            <div class="container" style="padding: 80px 0; max-width: 600px;">
                <h1 style="margin-bottom: 2rem;">Application Settings</h1>
                <div class="glass-panel" style="padding: 2rem; border-radius: 20px;">
                    <div style="margin-bottom: 2rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: bold;">Server URL (Local / Live)</label>
                        <select id="setting-server-url" style="width: 100%; background: var(--surface); border: 1px solid var(--border); padding: 1rem; border-radius: 12px; color: white;">
                            <option value="http://localhost:3000" ${currentUrl === 'http://localhost:3000' ? 'selected' : ''}>Local (http://localhost:3000)</option>
                            <option value="https://api.aurashop.com" ${currentUrl === 'https://api.aurashop.com' ? 'selected' : ''}>Live (https://api.aurashop.com)</option>
                        </select>
                    </div>
                    <div style="margin-bottom: 2rem; display: flex; align-items: center; justify-content: space-between;">
                        <label style="font-weight: bold;">Auto-launch on startup</label>
                        <input type="checkbox" id="setting-auto-launch" ${autoLaunch ? 'checked' : ''} style="width: 20px; height: 20px;">
                    </div>
                    <div style="margin-bottom: 2rem; display: flex; align-items: center; justify-content: space-between;">
                        <label style="font-weight: bold;">Enable Notifications</label>
                        <input type="checkbox" id="setting-notifications" ${notifications ? 'checked' : ''} style="width: 20px; height: 20px;">
                    </div>
                    <button id="save-settings-btn" class="btn-primary" style="width: 100%; padding: 1.2rem;">Save Settings</button>
                </div>
            </div>
        `;

        document.getElementById('save-settings-btn').addEventListener('click', () => {
            if (window.electronAPI) {
                const newUrl = document.getElementById('setting-server-url').value;
                const newAutoLaunch = document.getElementById('setting-auto-launch').checked;
                const newNotifs = document.getElementById('setting-notifications').checked;
                
                window.electronAPI.setStoreValue('settings.serverUrl', newUrl);
                window.electronAPI.setStoreValue('settings.autoLaunch', newAutoLaunch);
                window.electronAPI.setStoreValue('settings.notifications', newNotifs);
                
                alert('Settings saved successfully!');
            } else {
                alert('Settings are only available in the Desktop app.');
            }
        });
    },

    async renderPayment(main) {
        if (!Auth.isLoggedIn()) { window.location.hash = '#login'; return; }
        
        await Cart.load(true);
        const items = Cart.items;
        if (items.length === 0) {
            window.location.hash = '#cart';
            return;
        }

        const subtotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
        const shipping = subtotal > 500 ? 0 : 20;
        const tax = subtotal * 0.15;
        const total = subtotal + shipping + tax;

        main.innerHTML = `
            <div class="container" style="padding: 80px 0;">
                <h1 style="margin-bottom: 3rem; text-align: center;">Secure Checkout</h1>
                <div style="display: grid; grid-template-columns: 1fr 450px; gap: 4rem; align-items: start;">
                    
                    <!-- Left Column: Payment Form -->
                    <div class="glass-panel" style="padding: 4rem; border-radius: 30px;">
                        <h2 style="margin-bottom: 2rem;">Select Payment Method</h2>
                        
                        <!-- Tabs -->
                        <div style="display: flex; gap: 1rem; margin-bottom: 3rem; background: rgba(255,255,255,0.05); padding: 0.5rem; border-radius: 15px;">
                            <button onclick="window.App.setPaymentMethod('card')" id="tab-card" class="btn-primary" style="flex: 1; padding: 1rem; border-radius: 10px; background: var(--primary); cursor: pointer;">💳 Card</button>
                            <button onclick="window.App.setPaymentMethod('wallet')" id="tab-wallet" class="btn-primary" style="flex: 1; padding: 1rem; border-radius: 10px; background: none; color: white; cursor: pointer;">📱 Mobile Wallet</button>
                            <button onclick="window.App.setPaymentMethod('cod')" id="tab-cod" class="btn-primary" style="flex: 1; padding: 1rem; border-radius: 10px; background: none; color: white; cursor: pointer;">🚚 COD</button>
                        </div>
                        
                        <!-- Form Sections -->
                        <form id="payment-form">
                            <!-- Card Section -->
                            <div id="payment-section-card">
                                <div style="margin-bottom: 1.5rem;">
                                    <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">Card Number</label>
                                    <input type="text" id="card-number" placeholder="4000 1234 5678 9010" style="width: 100%; background: var(--surface); border: 1px solid var(--border); padding: 1rem; border-radius: 12px; color: white;">
                                </div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
                                    <div>
                                        <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">Expiry Date</label>
                                        <input type="text" id="card-expiry" placeholder="MM/YY" style="width: 100%; background: var(--surface); border: 1px solid var(--border); padding: 1rem; border-radius: 12px; color: white;">
                                    </div>
                                    <div>
                                        <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">CVV</label>
                                        <input type="password" id="card-cvv" placeholder="123" maxlength="3" style="width: 100%; background: var(--surface); border: 1px solid var(--border); padding: 1rem; border-radius: 12px; color: white;">
                                    </div>
                                </div>
                                <div style="margin-bottom: 2rem;">
                                    <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">Card Password / Secure PIN</label>
                                    <input type="password" id="card-pin" placeholder="••••" maxlength="6" style="width: 100%; background: var(--surface); border: 1px solid var(--border); padding: 1rem; border-radius: 12px; color: white;">
                                </div>
                                
                                <!-- Demo Card Autofill Card -->
                                <div onclick="window.App.autofillDemoCard()" class="glass-panel" style="padding: 1.5rem; border-radius: 15px; background: rgba(0, 200, 100, 0.1); border: 1px dashed rgba(0, 200, 100, 0.3); cursor: pointer; margin-bottom: 2rem;">
                                    <p style="color: rgb(0, 220, 120); font-weight: bold; margin: 0 0 0.5rem 0; font-size: 0.9rem;"><i class="fas fa-magic"></i> Click to Auto-fill Demo Card Details</p>
                                    <span style="font-size: 0.8rem; color: var(--text-muted);">Card: 4000 1234 5678 9010 | Exp: 12/28 | CVV: 123 | PIN: 1234</span>
                                </div>
                            </div>
                            
                            <!-- Wallet Section -->
                            <div id="payment-section-wallet" style="display: none;">
                                <div style="margin-bottom: 1.5rem;">
                                    <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">Mobile Wallet Provider</label>
                                    <select id="wallet-provider" style="width: 100%; background: var(--surface); border: 1px solid var(--border); padding: 1rem; border-radius: 12px; color: white;">
                                        <option value="Vodafone Cash">Vodafone Cash</option>
                                        <option value="Orange Cash">Orange Cash</option>
                                        <option value="Etisalat Cash">Etisalat Cash</option>
                                        <option value="InstaPay">InstaPay Wallet</option>
                                    </select>
                                </div>
                                <div style="margin-bottom: 1.5rem;">
                                    <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">Wallet Phone Number</label>
                                    <input type="text" id="wallet-number" placeholder="01012345678" style="width: 100%; background: var(--surface); border: 1px solid var(--border); padding: 1rem; border-radius: 12px; color: white;">
                                </div>
                                <div style="margin-bottom: 2rem;">
                                    <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">Wallet OTP / PIN</label>
                                    <input type="password" id="wallet-pin" placeholder="••••" style="width: 100%; background: var(--surface); border: 1px solid var(--border); padding: 1rem; border-radius: 12px; color: white;">
                                </div>
                            </div>
                            
                            <!-- COD Section -->
                            <div id="payment-section-cod" style="display: none;">
                                <div class="glass-panel" style="padding: 2rem; border-radius: 15px; background: rgba(255,255,255,0.02); margin-bottom: 2rem;">
                                    <p style="margin: 0; color: var(--text-muted); font-size: 0.95rem; line-height: 1.6;">
                                        🚚 <strong>Cash on Delivery selected.</strong> You will pay the final amount in cash when the courier delivers your package to your default address.
                                    </p>
                                </div>
                            </div>
                            
                            <button type="submit" class="btn-primary" style="width: 100%; padding: 1.5rem; font-size: 1.1rem; cursor: pointer;">Pay & Place Order</button>
                        </form>
                    </div>
                    
                    <!-- Right Column: Order Summary -->
                    <aside class="glass-panel" style="padding: 3rem; border-radius: 25px;">
                        <h3 style="font-size: 1.5rem; margin-bottom: 2rem;">Order Summary</h3>
                        <div style="max-height: 250px; overflow-y: auto; margin-bottom: 2rem; padding-right: 10px;">
                            ${items.map(item => `
                                <div style="display: flex; justify-content: space-between; margin-bottom: 1rem; font-size: 0.9rem;">
                                    <span style="color: var(--text-muted);">${item.quantity}x ${item.name}</span>
                                    <span>$${(item.unit_price * item.quantity).toFixed(2)}</span>
                                </div>
                            `).join('')}
                        </div>
                        <div style="border-top: 1px solid var(--border); padding-top: 2rem;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 1rem; color: var(--text-muted);">
                                <span>Subtotal</span>
                                <span>$${subtotal.toFixed(2)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 1rem; color: var(--text-muted);">
                                <span>Shipping</span>
                                <span>${shipping === 0 ? 'Free' : '$' + shipping.toFixed(2)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 1rem; color: var(--text-muted);">
                                <span>VAT (15%)</span>
                                <span>$${tax.toFixed(2)}</span>
                            </div>
                            <div style="border-top: 1px solid var(--border); margin-top: 2rem; padding-top: 2rem; display: flex; justify-content: space-between; font-size: 1.5rem; font-weight: 800;">
                                <span>Total</span>
                                <span>$${total.toFixed(2)}</span>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        `;

        window.App.currentPaymentMethod = 'Card';

        document.getElementById('payment-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const method = window.App.currentPaymentMethod;
            
            if (method === 'Card') {
                const card = document.getElementById('card-number').value;
                const exp = document.getElementById('card-expiry').value;
                const cvv = document.getElementById('card-cvv').value;
                const pin = document.getElementById('card-pin').value;
                if (!card || !exp || !cvv || !pin) {
                    alert('Please enter your card details and password.');
                    return;
                }
            } else if (method === 'Wallet') {
                const num = document.getElementById('wallet-number').value;
                const pin = document.getElementById('wallet-pin').value;
                if (!num || !pin) {
                    alert('Please enter your mobile wallet number and PIN.');
                    return;
                }
            }
            
            const btn = e.target.querySelector('button');
            btn.innerText = 'Authorizing Payment...';
            btn.disabled = true;

            try {
                const response = await window.API.orders.create({ 
                    address_id: '00000000-0000-0000-0000-000000000000', 
                    payment_method: method === 'Card' ? 'Credit Card' : (method === 'Wallet' ? document.getElementById('wallet-provider').value : 'COD')
                });
                
                if (response.success) {
                    window.Cart.showToast('Payment Authorized & Order placed successfully!');
                    await window.Cart.load();
                    window.location.hash = '#profile';
                } else {
                    alert('Order placement failed: ' + response.message);
                }
            } catch (err) {
                alert('Transaction error: ' + err.message);
            } finally {
                btn.innerText = 'Pay & Place Order';
                btn.disabled = false;
            }
        });
    },

    setPaymentMethod(type) {
        const sections = ['card', 'wallet', 'cod'];
        sections.forEach(s => {
            document.getElementById(`payment-section-${s}`).style.display = s === type ? 'block' : 'none';
            const tab = document.getElementById(`tab-${s}`);
            if (s === type) {
                tab.style.background = 'var(--primary)';
                tab.style.color = 'white';
            } else {
                tab.style.background = 'none';
                tab.style.color = 'white';
            }
        });
        
        if (type === 'card') window.App.currentPaymentMethod = 'Card';
        else if (type === 'wallet') window.App.currentPaymentMethod = 'Wallet';
        else window.App.currentPaymentMethod = 'COD';
    },

    autofillDemoCard() {
        document.getElementById('card-number').value = '4000 1234 5678 9010';
        document.getElementById('card-expiry').value = '12/28';
        document.getElementById('card-cvv').value = '123';
        document.getElementById('card-pin').value = '1234';
    },

    async showOrderDetail(orderId) {
        const overlay = document.createElement('div');
        overlay.id = 'order-modal-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.background = 'rgba(0,0,0,0.7)';
        overlay.style.backdropFilter = 'blur(10px)';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.zIndex = '9999';
        
        overlay.innerHTML = `
            <div class="loader" style="width: 50px; height: 50px;"></div>
        `;
        document.body.appendChild(overlay);

        try {
            const orderRes = await API.orders.getOne(orderId);
            const o = orderRes.data;
            
            const subtotal = o.total_amount;
            const finalAmount = o.final_amount;
            const shipping = finalAmount - subtotal > 0 ? finalAmount - subtotal : 0;
            
            overlay.innerHTML = `
                <div class="glass-panel" style="width: 90%; max-width: 700px; max-height: 85vh; overflow-y: auto; padding: 4rem; border-radius: 30px; position: relative;">
                    <button onclick="document.getElementById('order-modal-overlay').remove()" style="position: absolute; top: 2rem; right: 2rem; background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer;"><i class="fas fa-times"></i></button>
                    
                    <h2 style="margin-bottom: 2rem;">Order Details</h2>
                    <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 2rem;">Order ID: <span style="font-family: monospace; color: white;">${o.order_id}</span></p>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 3rem; background: rgba(255,255,255,0.02); padding: 2rem; border-radius: 15px;">
                        <div>
                            <span style="color: var(--text-muted); font-size: 0.8rem; display: block;">DATE PLACED</span>
                            <strong style="font-size: 1rem;">${new Date(o.created_at).toLocaleString()}</strong>
                        </div>
                        <div>
                            <span style="color: var(--text-muted); font-size: 0.8rem; display: block;">PAYMENT METHOD</span>
                            <strong style="font-size: 1rem; color: var(--primary);">${o.payment_method || 'COD'} (${o.payment_status || 'Pending'})</strong>
                        </div>
                    </div>

                    <h3 style="margin-bottom: 1.5rem;">Products Ordered</h3>
                    <div style="margin-bottom: 3rem;">
                        ${o.items.map(item => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 1.5rem 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                                <div>
                                    <strong style="font-size: 1.05rem;">${item.name}</strong>
                                    <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.3rem;">Quantity: ${item.quantity} | Unit Price: $${Number(item.unit_price).toFixed(2)}</div>
                                </div>
                                <span style="font-weight: bold; font-size: 1.1rem;">$${Number(item.item_total).toFixed(2)}</span>
                            </div>
                        `).join('')}
                    </div>

                    <div style="border-top: 1px solid var(--border); padding-top: 2rem; margin-bottom: 3rem;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 1rem; color: var(--text-muted);">
                            <span>Subtotal</span>
                            <span>$${Number(subtotal).toFixed(2)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 1rem; color: var(--text-muted);">
                            <span>Shipping</span>
                            <span>$${Number(shipping).toFixed(2)}</span>
                        </div>
                        <div style="border-top: 1px solid var(--border); margin-top: 1.5rem; padding-top: 1.5rem; display: flex; justify-content: space-between; font-size: 1.4rem; font-weight: 800;">
                            <span>Total Paid</span>
                            <span>$${Number(finalAmount).toFixed(2)}</span>
                        </div>
                    </div>

                    <div style="display: flex; gap: 1rem;">
                        <button onclick="document.getElementById('order-modal-overlay').remove()" class="btn-primary" style="flex: 1; padding: 1.2rem; background: var(--surface); border: 1px solid var(--border); color: white; cursor: pointer;">Close</button>
                        ${window.electronAPI ? `<button onclick="window.electronAPI.printInvoice()" class="btn-primary" style="flex: 1; padding: 1.2rem; cursor: pointer;"><i class="fas fa-print" style="margin-right: 8px;"></i> Print Invoice</button>` : ''}
                    </div>
                </div>
            `;
        } catch (err) {
            console.error('Error fetching order details:', err);
            overlay.innerHTML = `
                <div class="glass-panel" style="padding: 3rem; text-align: center; border-radius: 20px;">
                    <p style="color: var(--accent); margin-bottom: 2rem;">Failed to load order details: ${err.message}</p>
                    <button onclick="document.getElementById('order-modal-overlay').remove()" class="btn-primary" style="padding: 1rem 2rem;">Close</button>
                </div>
            `;
        }
    },

    async renderAdmin(main) {
        main.innerHTML = `
            <div class="container" style="padding: 80px 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4rem;">
                    <div>
                        <h1 style="font-size: 2.8rem; font-weight: 800; background: linear-gradient(135deg, #fff 0%, var(--text-muted) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Admin Dashboard</h1>
                        <p style="color: var(--text-muted); margin-top: 0.5rem;">Manage pending COD orders and add products</p>
                    </div>
                    <button onclick="window.Auth.logout()" class="btn-primary" style="background: rgba(255, 75, 75, 0.15); border: 1px solid rgba(255, 75, 75, 0.3); color: #ff4b4b; padding: 0.8rem 1.5rem; border-radius: 12px; cursor: pointer;">
                        <i class="fas fa-sign-out-alt" style="margin-right: 8px;"></i> Logout
                    </button>
                </div>

                <!-- Tabs -->
                <div style="display: flex; gap: 1rem; margin-bottom: 3rem; border-bottom: 1px solid var(--border); padding-bottom: 1rem;">
                    <button id="admin-tab-cod" onclick="window.App.setAdminTab('cod')" class="btn-primary" style="padding: 1rem 2rem; background: var(--primary); color: white; border-radius: 12px; cursor: pointer;">
                        <i class="fas fa-shipping-fast" style="margin-right: 8px;"></i> COD Order Queue
                    </button>
                    <button id="admin-tab-product" onclick="window.App.setAdminTab('product')" class="btn-primary" style="padding: 1rem 2rem; background: none; border: 1px solid var(--border); color: var(--text-muted); border-radius: 12px; cursor: pointer;">
                        <i class="fas fa-plus-circle" style="margin-right: 8px;"></i> Add Product
                    </button>
                </div>

                <!-- Sections -->
                <div id="admin-section-cod">
                    <div class="glass-panel" style="padding: 3rem; border-radius: 20px;">
                        <h3 style="font-size: 1.5rem; margin-bottom: 2rem;">Pending Cash on Delivery Orders</h3>
                        <div id="cod-orders-container">
                            <p style="color: var(--text-muted);">Loading pending COD orders...</p>
                        </div>
                    </div>
                </div>

                <div id="admin-section-product" style="display: none;">
                    <div class="glass-panel" style="padding: 4rem; border-radius: 20px; max-width: 800px;">
                        <h3 style="font-size: 1.5rem; margin-bottom: 2rem;">Add Product to Catalog</h3>
                        <form id="add-product-form">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
                                <div>
                                    <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">Product Name *</label>
                                    <input type="text" id="prod-name" required style="width: 100%; background: var(--surface); border: 1px solid var(--border); padding: 1rem; border-radius: 12px; color: white;">
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">Brand</label>
                                    <input type="text" id="prod-brand" placeholder="e.g. Aura" style="width: 100%; background: var(--surface); border: 1px solid var(--border); padding: 1rem; border-radius: 12px; color: white;">
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
                                <div>
                                    <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">Base Price ($) *</label>
                                    <input type="number" step="0.01" id="prod-price" required style="width: 100%; background: var(--surface); border: 1px solid var(--border); padding: 1rem; border-radius: 12px; color: white;">
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">Stock Quantity *</label>
                                    <input type="number" id="prod-stock" required value="10" style="width: 100%; background: var(--surface); border: 1px solid var(--border); padding: 1rem; border-radius: 12px; color: white;">
                                </div>
                            </div>

                            <div style="margin-bottom: 2rem;">
                                <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">Category *</label>
                                <select id="prod-category" required style="width: 100%; background: var(--surface); border: 1px solid var(--border); padding: 1rem; border-radius: 12px; color: white;">
                                    <option value="">Select Category</option>
                                </select>
                            </div>

                            <div style="margin-bottom: 2rem;">
                                <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">Primary Image URL</label>
                                <input type="url" id="prod-image" placeholder="https://images.unsplash.com/..." style="width: 100%; background: var(--surface); border: 1px solid var(--border); padding: 1rem; border-radius: 12px; color: white;">
                            </div>

                            <div style="margin-bottom: 3rem;">
                                <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">Description</label>
                                <textarea id="prod-desc" rows="4" style="width: 100%; background: var(--surface); border: 1px solid var(--border); padding: 1rem; border-radius: 12px; color: white; font-family: inherit; resize: vertical;"></textarea>
                            </div>

                            <button type="submit" class="btn-primary" style="padding: 1.2rem 3rem;">Create Product</button>
                        </form>
                    </div>
                </div>
            </div>
        `;

        // Fetch and load pending COD orders
        await this.loadPendingCodOrders();

        // Load Categories into dropdown select option
        try {
            const catRes = await window.API.products.getCategories();
            const categories = catRes.data || [];
            const selectEl = document.getElementById('prod-category');
            selectEl.innerHTML = '<option value="">Select Category</option>' + categories.map(c => 
                `<option value="${c.category_id}">${c.category_name}</option>`
            ).join('');
        } catch (err) {
            console.error('Failed to load categories:', err);
        }

        // Add form submission handler
        document.getElementById('add-product-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            btn.innerText = 'Creating Product...';
            btn.disabled = true;

            const name = document.getElementById('prod-name').value;
            const brand = document.getElementById('prod-brand').value;
            const price = parseFloat(document.getElementById('prod-price').value);
            const stock = parseInt(document.getElementById('prod-stock').value);
            const categoryId = document.getElementById('prod-category').value;
            const imageUrl = extractDirectImageUrl(document.getElementById('prod-image').value);
            const description = document.getElementById('prod-desc').value;

            try {
                const res = await window.API.products.create({
                    name,
                    brand,
                    base_price: price,
                    stock_quantity: stock,
                    category_id: categoryId,
                    image_url: imageUrl,
                    description
                });

                if (res.success) {
                    window.Cart.showToast('Product added to catalog successfully!');
                    e.target.reset();
                } else {
                    alert('Failed to add product: ' + res.message);
                }
            } catch (err) {
                alert('Error creating product: ' + err.message);
            } finally {
                btn.innerText = 'Create Product';
                btn.disabled = false;
            }
        });
    },

    async loadPendingCodOrders() {
        const container = document.getElementById('cod-orders-container');
        if (!container) return;

        try {
            const res = await window.API.admin.getPendingCodOrders();
            const orders = res.data || [];

            if (orders.length === 0) {
                container.innerHTML = `<p style="color: var(--text-muted);">No pending Cash on Delivery orders at the moment.</p>`;
                return;
            }

            container.innerHTML = `
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; margin-top: 1rem; text-align: left;">
                        <thead>
                            <tr style="border-bottom: 2px solid var(--border);">
                                <th style="padding: 1.2rem 1rem;">Order ID</th>
                                <th style="padding: 1.2rem 1rem;">Customer</th>
                                <th style="padding: 1.2rem 1rem;">Final Amount</th>
                                <th style="padding: 1.2rem 1rem;">Date</th>
                                <th style="padding: 1.2rem 1rem;">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${orders.map(o => `
                                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.3s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='none'">
                                    <td style="padding: 1.5rem 1rem;">
                                        <a href="javascript:void(0)" onclick="window.App.showOrderDetail('${o.order_id}')" style="color: var(--primary); text-decoration: underline; font-weight: bold; font-family: monospace;">
                                            ${o.order_id.substring(0, 8)}...
                                        </a>
                                    </td>
                                    <td style="padding: 1.5rem 1rem; font-weight: 500;">${o.customer_name}</td>
                                    <td style="padding: 1.5rem 1rem; font-weight: bold; color: white;">$${Number(o.final_amount).toFixed(2)}</td>
                                    <td style="padding: 1.5rem 1rem; color: var(--text-muted);">${new Date(o.created_at).toLocaleDateString()}</td>
                                    <td style="padding: 1.5rem 1rem;">
                                        <button onclick="window.App.confirmCodOrder('${o.order_id}')" class="btn-primary" style="padding: 0.6rem 1.2rem; font-size: 0.85rem; border-radius: 8px; cursor: pointer;">
                                            <i class="fas fa-check-circle" style="margin-right: 6px;"></i> Confirm Payment
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (err) {
            container.innerHTML = `<p style="color: var(--accent);">Failed to load pending COD orders: ${err.message}</p>`;
        }
    },

    async confirmCodOrder(orderId) {
        if (!confirm('Are you sure you want to confirm this Cash on Delivery payment? This will mark the order as paid.')) {
            return;
        }

        try {
            const res = await window.API.admin.confirmCodOrder(orderId);
            if (res.success) {
                window.Cart.showToast('COD Order confirmed & Payment marked as PAID!');
                await this.loadPendingCodOrders();
            } else {
                alert('Failed to confirm order: ' + res.message);
            }
        } catch (err) {
            alert('Error confirming COD order: ' + err.message);
        }
    },

    setAdminTab(tab) {
        const sections = ['cod', 'product'];
        sections.forEach(s => {
            document.getElementById(`admin-section-${s}`).style.display = s === tab ? 'block' : 'none';
            const btn = document.getElementById(`admin-tab-${s}`);
            if (s === tab) {
                btn.style.background = 'var(--primary)';
                btn.style.color = 'white';
                btn.style.border = 'none';
            } else {
                btn.style.background = 'none';
                btn.style.color = 'var(--text-muted)';
                btn.style.border = '1px solid var(--border)';
            }
        });
    }
};

window.Cart = Cart; // Make Cart globally accessible for onclick handlers
window.Auth = Auth; // Make Auth globally accessible for onclick handlers
window.App = App;   // Make App globally accessible for onclick handlers
export default App;
// Run App
App.init();
