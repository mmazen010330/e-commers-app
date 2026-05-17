import API from './api.js';

/**
 * AuraShop Auth Service
 * Handles user sessions, tokens, and login/register logic.
 */
const Auth = {
    init() {
        this.updateUI();
    },

    async login(email, password) {
        try {
            const response = await API.auth.login({ email, password });
            if (response.success) {
                localStorage.setItem('access_token', response.data.accessToken);
                localStorage.setItem('refresh_token', response.data.refreshToken);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                this.updateUI();
                return { success: true };
            }
            return { success: false, message: response.message || 'Login failed' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async register(userData) {
        try {
            const response = await API.auth.register(userData);
            return response;
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    logout() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.hash = '#login';
        this.updateUI();
    },

    isLoggedIn() {
        return !!localStorage.getItem('access_token');
    },

    getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    updateUI() {
        const userMenu = document.querySelector('nav a[href="#login"]');
        const user = this.getUser();
        
        if (user && userMenu) {
            userMenu.innerHTML = `<i class="fas fa-user-circle"></i> <span style="font-size:0.8rem; margin-left:5px;">${user.full_name.split(' ')[0]}</span>`;
            if (user.role === 'admin') {
                userMenu.href = '#admin';
            } else {
                userMenu.href = '#profile';
            }
        } else if (userMenu) {
            userMenu.innerHTML = `<i class="far fa-user"></i>`;
            userMenu.href = '#login';
        }
    }
};

export default Auth;
