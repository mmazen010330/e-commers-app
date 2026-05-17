/**
 * Auth API Explorer - Logic & Simulation
 * Handles the simulated backend server and interactive UI.
 */

class AuthServer {
    /**
     * Initializes the simulated server with data from LocalStorage.
     */
    constructor() {
        this.users = JSON.parse(localStorage.getItem('auth_explorer_users') || '[]');
        this.tokens = JSON.parse(localStorage.getItem('auth_explorer_tokens') || '[]');
        this.otpStore = {};
    }

    /**
     * Persists current state to LocalStorage.
     */
    persist() {
        localStorage.setItem('auth_explorer_users', JSON.stringify(this.users));
        localStorage.setItem('auth_explorer_tokens', JSON.stringify(this.tokens));
    }

    /**
     * Generates a mock JWT token.
     */
    generateToken(userId, type = 'access') {
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const now = Math.floor(Date.now() / 1000);
        const exp = now + (type === 'access' ? 900 : 604800); // 15 mins or 7 days
        const payload = btoa(JSON.stringify({
            sub: userId,
            type: type,
            iat: now,
            exp: exp,
            jti: Math.random().toString(36).substring(2, 15)
        }));
        const signature = btoa(Math.random().toString(36).substring(2, 30));
        return `${header}.${payload}.${signature}`;
    }

    /**
     * Verifies a mock JWT token and returns payload if valid.
     */
    verifyToken(token) {
        if (!token) return null;
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return null;
            const payload = JSON.parse(atob(parts[1]));
            if (payload.exp < Math.floor(Date.now() / 1000)) return null;
            return payload;
        } catch (e) { return null; }
    }

    // --- API Endpoint Simulations ---

    async register(body) {
        await this.simulateLatency();
        const { name, email, password } = body;
        
        if (!name || !email || !password) return { status: 400, json: { success: false, message: 'Missing required fields' }};
        if (password.length < 8) return { status: 400, json: { success: false, message: 'Password too short' }};
        if (this.users.find(u => u.email === email)) return { status: 409, json: { success: false, message: 'Email exists' }};

        const user = {
            id: 'usr_' + Math.random().toString(36).substring(2, 10),
            name, email, password: btoa(password),
            emailVerified: false, createdAt: new Date().toISOString(), provider: 'local'
        };
        this.users.push(user);
        
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        this.otpStore[user.id] = otp;
        
        this.persist();
        return { status: 201, json: { success: true, message: 'Registered successfully', data: { userId: user.id, email: user.email, otp }}};
    }

    async login(body) {
        await this.simulateLatency();
        const { email, password } = body;
        const user = this.users.find(u => u.email === email);
        if (!user || user.password !== btoa(password)) return { status: 401, json: { success: false, message: 'Invalid credentials' }};

        const accessToken = this.generateToken(user.id, 'access');
        const refreshToken = this.generateToken(user.id, 'refresh');
        this.tokens.push({ token: refreshToken, userId: user.id, revoked: false });
        this.persist();

        return { status: 200, json: { success: true, message: 'Login successful', data: { accessToken, refreshToken, expiresIn: 900, user: { id: user.id, name: user.name, email: user.email, emailVerified: user.emailVerified }}}};
    }

    async oauth(provider) {
        await this.simulateLatency(800);
        const mockOAuthId = 'oauth_' + Math.random().toString(36).substring(2, 8);
        let user = this.users.find(u => u.providerId === mockOAuthId);
        
        if (!user) {
            user = {
                id: 'usr_' + Math.random().toString(36).substring(2, 10),
                name: `${provider} User`, email: `user@${provider}.com`,
                provider, providerId: mockOAuthId, emailVerified: true, createdAt: new Date().toISOString()
            };
            this.users.push(user);
            this.persist();
        }

        const accessToken = this.generateToken(user.id, 'access');
        const refreshToken = this.generateToken(user.id, 'refresh');
        this.tokens.push({ token: refreshToken, userId: user.id, revoked: false });
        this.persist();

        return { status: 200, json: { success: true, message: 'OAuth successful', data: { accessToken, refreshToken, expiresIn: 900, user: { id: user.id, name: user.name, email: user.email, emailVerified: true }}}};
    }

    async refresh(body) {
        await this.simulateLatency();
        const { refreshToken } = body;
        const tokenRecord = this.tokens.find(t => t.token === refreshToken && !t.revoked);
        if (!tokenRecord) return { status: 401, json: { success: false, message: 'Invalid refresh token' }};

        const user = this.users.find(u => u.id === tokenRecord.userId);
        const newAccessToken = this.generateToken(user.id, 'access');
        return { status: 200, json: { success: true, message: 'Token refreshed', data: { accessToken: newAccessToken, expiresIn: 900 }}};
    }

    async logout(headers) {
        await this.simulateLatency();
        const refreshToken = headers['X-Refresh-Token'];
        const tokenRecord = this.tokens.find(t => t.token === refreshToken);
        if (tokenRecord) { tokenRecord.revoked = true; this.persist(); }
        return { status: 200, json: { success: true, message: 'Logout successful' } };
    }

    async forgotPassword(body) {
        await this.simulateLatency(600);
        const { email } = body;
        const user = this.users.find(u => u.email === email);
        if (!user) return { status: 200, json: { success: true, message: 'Reset link sent if account exists' }};

        const resetToken = 'rst_' + Math.random().toString(36).substring(2, 15);
        user.resetToken = resetToken;
        user.resetExpires = Date.now() + 3600000;
        this.persist();
        return { status: 200, json: { success: true, message: 'Reset link sent', data: { resetToken } }};
    }

    async resetPassword(body) {
        await this.simulateLatency();
        const { token, newPassword } = body;
        const user = this.users.find(u => u.resetToken === token && u.resetExpires > Date.now());
        if (!user) return { status: 400, json: { success: false, message: 'Invalid or expired token' }};

        user.password = btoa(newPassword);
        user.resetToken = null;
        user.resetExpires = null;
        this.persist();
        return { status: 200, json: { success: true, message: 'Password reset successful' } };
    }

    async verifyEmail(body) {
        await this.simulateLatency();
        const { userId, otp } = body;
        if (this.otpStore[userId] === otp) {
            const user = this.users.find(u => u.id === userId);
            if (user) {
                user.emailVerified = true;
                delete this.otpStore[userId];
                this.persist();
                return { status: 200, json: { success: true, message: 'Email verified' }};
            }
        }
        return { status: 400, json: { success: false, message: 'Invalid OTP' }};
    }

    async simulateLatency(ms = 300) {
        return new Promise(r => setTimeout(r, ms + Math.random() * 200));
    }
}

/**
 * Main App Controller
 */
class App {
    constructor() {
        this.server = new AuthServer();
        this.logs = [];
        this.currentUser = JSON.parse(localStorage.getItem('auth_explorer_user') || 'null');
        this.tokens = {
            access: localStorage.getItem('auth_explorer_access'),
            refresh: localStorage.getItem('auth_explorer_refresh')
        };
        this.init();
    }

    init() {
        this.updateAuthUI();
        this.startClock();
        this.startExpirationTimer();
        if (this.tokens.access) this.showToast('Session restored', 'info');
    }

    startClock() {
        setInterval(() => {
            const el = document.getElementById('serverTime');
            if (el) el.textContent = new Date().toLocaleTimeString();
        }, 1000);
    }

    startExpirationTimer() {
        setInterval(() => {
            if (this.tokens.access) {
                const payload = this.server.verifyToken(this.tokens.access);
                if (payload) {
                    const remaining = payload.exp - Math.floor(Date.now() / 1000);
                    const el = document.getElementById('expiresDisplay');
                    if (el) {
                        if (remaining > 0) {
                            const m = Math.floor(remaining / 60);
                            const s = remaining % 60;
                            el.textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
                            el.className = remaining < 60 ? 'text-red-400 font-bold' : 'text-indigo-400 font-bold';
                        } else {
                            el.textContent = 'EXPIRED';
                            el.className = 'text-red-600 font-bold';
                        }
                    }
                }
            }
        }, 1000);
    }

    async makeRequest(endpoint, method, body = null, headers = {}) {
        const startTime = performance.now();
        let response;
        try {
            switch(endpoint) {
                case '/register': response = await this.server.register(body); break;
                case '/login': response = await this.server.login(body); break;
                case '/google': response = await this.server.oauth('google', body); break;
                case '/facebook': response = await this.server.oauth('facebook', body); break;
                case '/refresh': response = await this.server.refresh(body); break;
                case '/logout': response = await this.server.logout(headers); break;
                case '/forgot-password': response = await this.server.forgotPassword(body); break;
                case '/reset-password': response = await this.server.resetPassword(body); break;
                case '/verify-email': response = await this.server.verifyEmail(body); break;
            }
        } catch (e) { response = { status: 500, json: { success: false, message: e.message }}; }

        const latency = Math.round(performance.now() - startTime);
        const latEl = document.getElementById('latencyDisplay');
        if (latEl) latEl.textContent = `${latency}ms`;
        
        this.logRequest(endpoint, method, body, response, latency);
        
        if (response.json.success) {
            if (['/login', '/google', '/facebook'].includes(endpoint)) {
                this.tokens.access = response.json.data.accessToken;
                this.tokens.refresh = response.json.data.refreshToken;
                this.currentUser = response.json.data.user;
                this.saveState();
                this.updateAuthUI();
                this.showToast('Login Successful', 'success');
            } else if (endpoint === '/refresh') {
                this.tokens.access = response.json.data.accessToken;
                this.saveState();
                this.updateAuthUI();
                this.showToast('Token Refreshed', 'success');
            } else if (endpoint === '/logout') {
                this.tokens = { access: null, refresh: null };
                this.currentUser = null;
                this.saveState();
                this.updateAuthUI();
                this.showToast('Logged Out', 'info');
            }
        }
        return response;
    }

    saveState() {
        localStorage.setItem('auth_explorer_access', this.tokens.access || '');
        localStorage.setItem('auth_explorer_refresh', this.tokens.refresh || '');
        localStorage.setItem('auth_explorer_user', JSON.stringify(this.currentUser));
    }

    logRequest(endpoint, method, body, response, latency) {
        this.logs.unshift({ id: Date.now(), timestamp: new Date().toLocaleTimeString(), endpoint, method, status: response.status, latency, request: body, response: response.json });
        this.renderLogs();
    }

    renderLogs() {
        const container = document.getElementById('logContainer');
        if (!container) return;
        document.getElementById('logCount').textContent = `${this.logs.length} entries`;
        container.innerHTML = this.logs.length ? this.logs.map(log => `
            <div class="log-entry glass-panel rounded-lg p-3 border-l-2 ${log.status >= 400 ? 'border-l-red-500' : 'border-l-emerald-500'}">
                <div class="flex justify-between items-start mb-2">
                    <div class="flex items-center space-x-2">
                        <span class="method-post px-1.5 py-0.5 rounded text-[10px] font-bold">${log.method}</span>
                        <span class="text-xs font-mono text-slate-300">${log.endpoint}</span>
                    </div>
                    <span class="text-xs font-bold ${log.status >= 400 ? 'text-red-400' : 'text-emerald-400'}">${log.status}</span>
                </div>
                <pre class="text-[10px] text-slate-300 overflow-x-auto whitespace-pre-wrap font-mono">${this.syntaxHighlight(JSON.stringify(log.response, null, 2))}</pre>
            </div>
        `).join('') : '<div class="text-center text-slate-600 text-xs py-8 italic">No requests made yet</div>';
    }

    syntaxHighlight(json) {
        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
            let cls = 'json-syntax-number';
            if (/^"/.test(match)) cls = /:$/.test(match) ? 'json-syntax-key' : 'json-syntax-string';
            else if (/true|false/.test(match)) cls = 'json-syntax-boolean';
            else if (/null/.test(match)) cls = 'json-syntax-null';
            return `<span class="${cls}">${match}</span>`;
        });
    }

    updateAuthUI() {
        const isAuth = !!this.tokens.access;
        const dot = document.getElementById('statusDot');
        const txt = document.getElementById('statusText');
        const logout = document.getElementById('logoutBtn');
        const dash = document.getElementById('dashboardBtn');
        if (dot) dot.className = `w-2 h-2 rounded-full ${isAuth ? 'bg-emerald-500' : 'bg-slate-500'}`;
        if (txt) txt.textContent = isAuth ? (this.currentUser?.email || 'Authenticated') : 'Unauthenticated';
        if (logout) logout.classList.toggle('hidden', !isAuth);
        if (dash) dash.classList.toggle('hidden', !isAuth);
        
        const tok = document.getElementById('tokenDisplay');
        const ref = document.getElementById('refreshDisplay');
        if (tok) tok.textContent = isAuth ? this.tokens.access.substring(0, 32) + '...' : 'None';
        if (ref) ref.textContent = this.tokens.refresh ? this.tokens.refresh.substring(0, 32) + '...' : 'None';
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const msg = document.getElementById('toastMessage');
        if (toast && msg) {
            msg.textContent = message;
            toast.classList.remove('translate-y-20', 'opacity-0');
            setTimeout(() => toast.classList.add('translate-y-20', 'opacity-0'), 3000);
        }
    }

    clearLogs() { this.logs = []; this.renderLogs(); }

    async register() {
        const body = { name: document.getElementById('reg-name').value, email: document.getElementById('reg-email').value, password: document.getElementById('reg-password').value };
        if (body.password !== document.getElementById('reg-confirm').value) return this.showToast('Passwords do not match', 'error');
        const res = await this.makeRequest('/register', 'POST', body);
        if (res.json.success) {
            const otpEl = document.getElementById('verify-otp');
            otpEl.dataset.userId = res.json.data.userId;
            otpEl.value = res.json.data.otp;
            this.showToast(`Registered! OTP: ${res.json.data.otp}`, 'success');
        }
    }

    async login() { await this.makeRequest('/login', 'POST', { email: document.getElementById('login-email').value, password: document.getElementById('login-password').value }); }
    async oauth(provider) { await this.makeRequest(`/${provider}`, 'POST'); }
    async refresh() { if (this.tokens.refresh) await this.makeRequest('/refresh', 'POST', { refreshToken: this.tokens.refresh }); }
    async logout() { await this.makeRequest('/logout', 'POST', null, { 'X-Refresh-Token': this.tokens.refresh }); }
    async forgotPassword() {
        const res = await this.makeRequest('/forgot-password', 'POST', { email: document.getElementById('forgot-email').value });
        if (res.json.success && res.json.data?.resetToken) document.getElementById('reset-token').value = res.json.data.resetToken;
    }
    async resetPassword() { await this.makeRequest('/reset-password', 'POST', { token: document.getElementById('reset-token').value, newPassword: document.getElementById('reset-password').value }); }
    async verifyEmail() { await this.makeRequest('/verify-email', 'POST', { userId: document.getElementById('verify-otp').dataset.userId, otp: document.getElementById('verify-otp').value }); }

    openDashboard() {
        if (!this.tokens.access) return this.showToast('Please login first', 'error');
        const content = document.getElementById('dashboardContent');
        if (content) {
            content.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div class="glass-panel p-4 rounded-xl border-l-4 border-indigo-500">
                        <div class="text-slate-400 text-xs font-bold mb-1">USER ID</div>
                        <div class="text-white font-mono text-sm">${this.currentUser?.id}</div>
                    </div>
                    <div class="glass-panel p-4 rounded-xl border-l-4 border-emerald-500">
                        <div class="text-slate-400 text-xs font-bold mb-1">VERIFIED</div>
                        <div class="text-emerald-400 text-sm font-bold">${this.currentUser?.emailVerified ? 'YES' : 'NO'}</div>
                    </div>
                    <div class="glass-panel p-4 rounded-xl border-l-4 border-purple-500">
                        <div class="text-slate-400 text-xs font-bold mb-1">PROVIDER</div>
                        <div class="text-white text-sm font-bold uppercase">${this.currentUser?.provider}</div>
                    </div>
                </div>
                <div class="glass-panel p-6 rounded-xl border border-slate-800">
                    <h3 class="text-lg font-bold text-white mb-4">Protected Data Simulation</h3>
                    <p class="text-slate-400 text-sm mb-4">RETRIEVED WITH VALID JWT</p>
                    <div class="bg-black/40 p-4 rounded-lg font-mono text-xs text-indigo-300">
                        { "secret": "xp_aura_7721", "balance": "$1,240.50" }
                    </div>
                </div>
            `;
            document.getElementById('dashboardModal').classList.remove('hidden');
        }
    }
    closeDashboard() { document.getElementById('dashboardModal').classList.add('hidden'); }
}

const app = new App();
window.app = app; // Expose to global scope for HTML onclick handlers
