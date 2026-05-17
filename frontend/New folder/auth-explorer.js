
/**
 * Simulated Authentication API Server
 * Handles all 9 endpoints with realistic JWT behavior
 */
class AuthServer {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('auth_users') || '[]');
        this.tokens = JSON.parse(localStorage.getItem('auth_tokens') || '[]');
        this.otpStore = {};
    }

    persist() {
        localStorage.setItem('auth_users', JSON.stringify(this.users));
        localStorage.setItem('auth_tokens', JSON.stringify(this.tokens));
    }

    generateToken(userId, type = 'access') {
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const now = Math.floor(Date.now() / 1000);
        const payload = btoa(JSON.stringify({
            sub: userId,
            type: type,
            iat: now,
            exp: now + (type === 'access' ? 900 : 604800),
            jti: Math.random().toString(36).substring(2, 15)
        }));
        const signature = btoa(Math.random().toString(36).substring(2, 30));
        return `${header}.${payload}.${signature}`;
    }

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

    async register(body) {
        await this.simulateLatency();
        const { name, email, password } = body;

        if (!name || !email || !password) {
            return { status: 400, json: { success: false, message: 'Missing required fields' }};
        }
        if (password.length < 8) {
            return { status: 400, json: { success: false, message: 'Password must be at least 8 characters' }};
        }
        if (this.users.find(u => u.email === email)) {
            return { status: 409, json: { success: false, message: 'Email already registered' }};
        }

        const user = {
            id: 'usr_' + Math.random().toString(36).substring(2, 10),
            name,
            email,
            password: btoa(password),
            emailVerified: false,
            createdAt: new Date().toISOString(),
            provider: 'local'
        };
        this.users.push(user);

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        this.otpStore[user.id] = otp;

        this.persist();
        return {
            status: 201,
            json: {
                success: true,
                message: 'User registered successfully. Please verify your email.',
                data: {
                    userId: user.id,
                    email: user.email,
                    otp: otp
                }
            }
        };
    }

    async login(body) {
        await this.simulateLatency();
        const { email, password } = body;

        const user = this.users.find(u => u.email === email);
        if (!user || user.password !== btoa(password)) {
            return { status: 401, json: { success: false, message: 'Invalid credentials' }};
        }

        const accessToken = this.generateToken(user.id, 'access');
        const refreshToken = this.generateToken(user.id, 'refresh');

        this.tokens.push({ token: refreshToken, userId: user.id, revoked: false });
        this.persist();

        return {
            status: 200,
            json: {
                success: true,
                message: 'Login successful',
                data: {
                    accessToken,
                    refreshToken,
                    expiresIn: 900,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        emailVerified: user.emailVerified
                    }
                }
            }
        };
    }

    async oauth(provider, body) {
        await this.simulateLatency(800);
        const { code } = body || {};

        const mockOAuthId = 'oauth_' + Math.random().toString(36).substring(2, 8);
        let user = this.users.find(u => u.providerId === mockOAuthId);

        if (!user) {
            user = {
                id: 'usr_' + Math.random().toString(36).substring(2, 10),
                name: provider === 'google' ? 'Google User' : 'Facebook User',
                email: `user_${Math.floor(Math.random()*1000)}@${provider}.com`,
                provider: provider,
                providerId: mockOAuthId,
                emailVerified: true,
                createdAt: new Date().toISOString()
            };
            this.users.push(user);
            this.persist();
        }

        const accessToken = this.generateToken(user.id, 'access');
        const refreshToken = this.generateToken(user.id, 'refresh');
        this.tokens.push({ token: refreshToken, userId: user.id, revoked: false });
        this.persist();

        return {
            status: 200,
            json: {
                success: true,
                message: `${provider} OAuth login successful`,
                data: {
                    accessToken,
                    refreshToken,
                    expiresIn: 900,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        emailVerified: true
                    }
                }
            }
        };
    }

    async refresh(body) {
        await this.simulateLatency();
        const { refreshToken } = body;

        const tokenRecord = this.tokens.find(t => t.token === refreshToken && !t.revoked);
        if (!tokenRecord) {
            return { status: 401, json: { success: false, message: 'Invalid or expired refresh token' }};
        }

        const user = this.users.find(u => u.id === tokenRecord.userId);
        const newAccessToken = this.generateToken(user.id, 'access');

        return {
            status: 200,
            json: {
                success: true,
                message: 'Token refreshed',
                data: {
                    accessToken: newAccessToken,
                    expiresIn: 900
                }
            }
        };
    }

    async logout(headers) {
        await this.simulateLatency();
        const refreshToken = headers['X-Refresh-Token'];

        const tokenRecord = this.tokens.find(t => t.token === refreshToken);
        if (tokenRecord) {
            tokenRecord.revoked = true;
            this.persist();
        }

        return {
            status: 200,
            json: { success: true, message: 'Logout successful. Token invalidated.' }
        };
    }

    async forgotPassword(body) {
        await this.simulateLatency(600);
        const { email } = body;

        const user = this.users.find(u => u.email === email);
        if (!user) {
            return { status: 200, json: { success: true, message: 'If email exists, reset link sent.' }};
        }

        const resetToken = 'rst_' + Math.random().toString(36).substring(2, 15);
        user.resetToken = resetToken;
        user.resetExpires = Date.now() + 3600000;
        this.persist();

        return {
            status: 200,
            json: {
                success: true,
                message: 'Password reset email sent.',
                data: { resetToken }
            }
        };
    }

    async resetPassword(body) {
        await this.simulateLatency();
        const { token, newPassword } = body;

        const user = this.users.find(u => u.resetToken === token && u.resetExpires > Date.now());
        if (!user) {
            return { status: 400, json: { success: false, message: 'Invalid or expired reset token' }};
        }

        user.password = btoa(newPassword);
        user.resetToken = null;
        user.resetExpires = null;
        this.persist();

        return {
            status: 200,
            json: { success: true, message: 'Password reset successfully' }
        };
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
                return { status: 200, json: { success: true, message: 'Email verified successfully' }};
            }
        }
        return { status: 400, json: { success: false, message: 'Invalid OTP' }};
    }

    async simulateLatency(ms = 300) {
        return new Promise(r => setTimeout(r, ms + Math.random() * 200));
    }
}

/**
 * Frontend Application Controller
 */
class App {
    constructor() {
        this.server = new AuthServer();
        this.logs = [];
        this.currentUser = null;
        this.tokens = {
            access: localStorage.getItem('access_token'),
            refresh: localStorage.getItem('refresh_token')
        };
        this.init();
    }

    init() {
        this.updateAuthUI();
        this.startClock();

        if (this.tokens.access) {
            this.showToast('Session restored from localStorage', 'info');
        }
    }

    startClock() {
        setInterval(() => {
            const el = document.getElementById('serverTime');
            if (el) el.textContent = new Date().toLocaleTimeString();
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
                default: throw new Error('Unknown endpoint');
            }
        } catch (error) {
            response = { status: 500, json: { success: false, message: error.message }};
        }

        const latency = Math.round(performance.now() - startTime);
        this.logRequest(endpoint, method, body, response, latency);

        if (response.json.success && (endpoint === '/login' || 
            ((endpoint === '/google' || endpoint === '/facebook') && response.json.success))) {
            this.tokens.access = response.json.data.accessToken;
            this.tokens.refresh = response.json.data.refreshToken;
            localStorage.setItem('access_token', this.tokens.access);
            localStorage.setItem('refresh_token', this.tokens.refresh);
            this.currentUser = response.json.data.user;
            this.updateAuthUI();
            this.showToast('Authentication successful', 'success');
        }

        if (response.json.success && endpoint === '/refresh') {
            this.tokens.access = response.json.data.accessToken;
            localStorage.setItem('access_token', this.tokens.access);
            this.updateAuthUI();
        }

        if (response.json.success && endpoint === '/logout') {
            this.tokens = { access: null, refresh: null };
            this.currentUser = null;
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            this.updateAuthUI();
            this.showToast('Logged out successfully', 'info');
        }

        if (response.json.success && endpoint === '/verify-email') {
            this.showToast('Email verified! You can now log in.', 'success');
        }

        return response;
    }

    logRequest(endpoint, method, body, response, latency) {
        const log = {
            id: Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            endpoint,
            method,
            status: response.status,
            latency,
            request: body,
            response: response.json
        };
        this.logs.unshift(log);
        this.renderLogs();
    }

    renderLogs() {
        const container = document.getElementById('logContainer');
        const countEl = document.getElementById('logCount');
        if (!container) return;

        if (countEl) countEl.textContent = `${this.logs.length} entries`;

        if (this.logs.length === 0) {
            container.innerHTML = '<div class="text-center text-slate-600 text-xs py-8 italic">No requests made yet</div>';
            return;
        }

        container.innerHTML = this.logs.map(log => `
            <div class="log-entry glass-panel rounded-lg p-3 border-l-2 ${log.status >= 400 ? 'border-l-red-500' : 'border-l-emerald-500'}">
                <div class="flex justify-between items-start mb-2">
                    <div class="flex items-center space-x-2">
                        <span class="method-post px-1.5 py-0.5 rounded text-[10px] font-bold">${log.method}</span>
                        <span class="text-xs font-mono text-slate-300">${log.endpoint}</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <span class="text-[10px] text-slate-500">${log.latency}ms</span>
                        <span class="text-xs font-bold ${log.status >= 400 ? 'text-red-400' : 'text-emerald-400'}">${log.status}</span>
                    </div>
                </div>
                <div class="space-y-1">
                    <div class="text-[10px] text-slate-500 font-mono">Response:</div>
                    <pre class="text-[11px] text-slate-300 overflow-x-auto whitespace-pre-wrap break-all">${this.syntaxHighlight(JSON.stringify(log.response, null, 2))}</pre>
                </div>
            </div>
        `).join('');
    }

    syntaxHighlight(json) {
        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
            let cls = 'json-syntax-number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'json-syntax-key';
                } else {
                    cls = 'json-syntax-string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'json-syntax-boolean';
            } else if (/null/.test(match)) {
                cls = 'json-syntax-null';
            }
            return '<span class="' + cls + '">' + match + '</span>';
        });
    }

    updateAuthUI() {
        const dot = document.getElementById('statusDot');
        const text = document.getElementById('statusText');
        const logoutBtn = document.getElementById('logoutBtn');
        const tokenDisplay = document.getElementById('tokenDisplay');
        const refreshDisplay = document.getElementById('refreshDisplay');
        const expiresDisplay = document.getElementById('expiresDisplay');

        if (!dot || !text) return;

        if (this.tokens.access) {
            dot.className = 'w-2 h-2 rounded-full bg-emerald-500 animate-pulse';
            text.textContent = this.currentUser ? `Authenticated: ${this.currentUser.email}` : 'Authenticated';
            text.className = 'text-xs font-mono text-emerald-400';
            if (logoutBtn) logoutBtn.classList.remove('hidden');

            if (tokenDisplay) {
                tokenDisplay.textContent = this.tokens.access.substring(0, 20) + '...';
                tokenDisplay.className = 'bg-slate-950 rounded p-2 text-emerald-400 break-all border border-slate-800 font-mono text-[10px]';
            }

            if (refreshDisplay && this.tokens.refresh) {
                refreshDisplay.textContent = this.tokens.refresh.substring(0, 20) + '...';
                refreshDisplay.className = 'bg-slate-950 rounded p-2 text-indigo-400 break-all border border-slate-800 font-mono text-[10px]';
            }
            if (expiresDisplay) expiresDisplay.textContent = '14m 59s';
        } else {
            dot.className = 'w-2 h-2 rounded-full bg-slate-500';
            text.textContent = 'Unauthenticated';
            text.className = 'text-xs font-mono text-slate-400';
            if (logoutBtn) logoutBtn.classList.add('hidden');
            if (tokenDisplay) {
                tokenDisplay.textContent = 'None';
                tokenDisplay.className = 'bg-slate-950 rounded p-2 text-slate-500 break-all border border-slate-800 font-mono text-[10px]';
            }
            if (refreshDisplay) {
                refreshDisplay.textContent = 'None';
                refreshDisplay.className = 'bg-slate-950 rounded p-2 text-slate-500 break-all border border-slate-800 font-mono text-[10px]';
            }
            if (expiresDisplay) expiresDisplay.textContent = '--';
        }
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const icon = document.getElementById('toastIcon');
        const msg = document.getElementById('toastMessage');
        if (!toast || !icon || !msg) return;

        const icons = {
            success: '<svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>',
            error: '<svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>',
            info: '<svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
        };

        icon.innerHTML = icons[type];
        msg.textContent = message;

        toast.classList.remove('translate-y-20', 'opacity-0');
        setTimeout(() => {
            toast.classList.add('translate-y-20', 'opacity-0');
        }, 3000);
    }

    clearLogs() {
        this.logs = [];
        this.renderLogs();
    }

    async register() {
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const confirm = document.getElementById('reg-confirm').value;

        if (password !== confirm) {
            this.showToast('Passwords do not match', 'error');
            return;
        }
        if (!name || !email || !password) {
            this.showToast('Please fill all fields', 'error');
            return;
        }

        const res = await this.makeRequest('/register', 'POST', { name, email, password });
        if (res.json.success) {
            this.showToast(`Registered! OTP: ${res.json.data.otp}`, 'success');
            const otpInput = document.getElementById('verify-otp');
            if (otpInput) otpInput.dataset.userId = res.json.data.userId;
        } else {
            this.showToast(res.json.message, 'error');
        }
    }

    async login() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        if (!email || !password) {
            this.showToast('Please enter credentials', 'error');
            return;
        }

        const res = await this.makeRequest('/login', 'POST', { email, password });
        if (!res.json.success) {
            this.showToast(res.json.message, 'error');
        }
    }

    async oauth(provider) {
        await this.makeRequest(`/${provider}`, 'POST', { code: 'mock_auth_code_' + Date.now() });
    }

    async refresh() {
        if (!this.tokens.refresh) {
            this.showToast('No refresh token available', 'error');
            return;
        }
        const res = await this.makeRequest('/refresh', 'POST', { refreshToken: this.tokens.refresh });
        if (res.json.success) {
            this.showToast('Access token refreshed', 'success');
        } else {
            this.showToast(res.json.message, 'error');
        }
    }

    async logout() {
        if (!this.tokens.refresh) {
            this.showToast('Not logged in', 'error');
            return;
        }
        await this.makeRequest('/logout', 'POST', null, { 'X-Refresh-Token': this.tokens.refresh });
    }

    async forgotPassword() {
        const email = document.getElementById('forgot-email').value;
        if (!email) {
            this.showToast('Please enter email', 'error');
            return;
        }
        const res = await this.makeRequest('/forgot-password', 'POST', { email });
        if (res.json.success && res.json.data && res.json.data.resetToken) {
            const resetTokenInput = document.getElementById('reset-token');
            if (resetTokenInput) resetTokenInput.value = res.json.data.resetToken;
            this.showToast(`Reset token: ${res.json.data.resetToken}`, 'success');
        } else {
            this.showToast(res.json.message, 'info');
        }
    }

    async resetPassword() {
        const token = document.getElementById('reset-token').value;
        const newPassword = document.getElementById('reset-password').value;

        if (!token || !newPassword) {
            this.showToast('Please provide token and new password', 'error');
            return;
        }
        const res = await this.makeRequest('/reset-password', 'POST', { token, newPassword });
        if (res.json.success) {
            this.showToast('Password reset successfully', 'success');
        } else {
            this.showToast(res.json.message, 'error');
        }
    }

    async verifyEmail() {
        const otp = document.getElementById('verify-otp').value;
        const userId = document.getElementById('verify-otp').dataset.userId;

        if (!otp || !userId) {
            this.showToast('Please enter OTP or register first', 'error');
            return;
        }
        const res = await this.makeRequest('/verify-email', 'POST', { userId, otp });
        if (!res.json.success) {
            this.showToast(res.json.message, 'error');
        }
    }

    openDashboard() {
        if (!this.tokens.access) {
            this.showToast('Please login first', 'error');
            return;
        }

        const modal = document.getElementById('dashboardModal');
        const content = document.getElementById('dashboardContent');
        if (!modal || !content) return;

        content.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div class="glass-panel p-4 rounded-xl border-l-4 border-indigo-500">
                    <div class="text-slate-400 text-xs uppercase mb-1">User ID</div>
                    <div class="text-white font-mono text-sm">${this.currentUser ? this.currentUser.id : 'N/A'}</div>
                </div>
                <div class="glass-panel p-4 rounded-xl border-l-4 border-purple-500">
                    <div class="text-slate-400 text-xs uppercase mb-1">Email Status</div>
                    <div class="text-emerald-400 text-sm font-medium flex items-center">
                        <span class="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                        ${this.currentUser && this.currentUser.emailVerified ? 'Verified' : 'Unverified'}
                    </div>
                </div>
                <div class="glass-panel p-4 rounded-xl border-l-4 border-pink-500">
                    <div class="text-slate-400 text-xs uppercase mb-1">Provider</div>
                    <div class="text-white text-sm capitalize">${this.currentUser ? this.currentUser.provider : 'local'}</div>
                </div>
            </div>

            <div class="glass-panel rounded-xl p-6">
                <h3 class="text-lg font-semibold text-white mb-4">Session Activity</h3>
                <div class="space-y-3">
                    <div class="flex justify-between items-center py-2 border-b border-slate-800">
                        <span class="text-slate-400 text-sm">Current Session</span>
                        <span class="text-emerald-400 text-xs bg-emerald-400/10 px-2 py-1 rounded">Active</span>
                    </div>
                    <div class="flex justify-between items-center py-2 border-b border-slate-800">
                        <span class="text-slate-400 text-sm">Token Type</span>
                        <span class="text-indigo-400 text-xs font-mono">JWT (HS256)</span>
                    </div>
                    <div class="flex justify-between items-center py-2 border-b border-slate-800">
                        <span class="text-slate-400 text-sm">Last Login</span>
                        <span class="text-slate-300 text-xs">${new Date().toLocaleString()}</span>
                    </div>
                    <div class="flex justify-between items-center py-2">
                        <span class="text-slate-400 text-sm">IP Address</span>
                        <span class="text-slate-300 text-xs font-mono">192.168.1.${Math.floor(Math.random()*255)}</span>
                    </div>
                </div>
            </div>

            <div class="glass-panel rounded-xl p-6 mt-4">
                <h3 class="text-lg font-semibold text-white mb-4">Security Recommendations</h3>
                <div class="space-y-2">
                    <div class="flex items-start space-x-3 text-sm text-slate-300">
                        <svg class="w-5 h-5 text-emerald-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                        <span>Two-factor authentication is enabled</span>
                    </div>
                    <div class="flex items-start space-x-3 text-sm text-slate-300">
                        <svg class="w-5 h-5 text-emerald-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                        <span>Recent security audit passed</span>
                    </div>
                    <div class="flex items-start space-x-3 text-sm text-yellow-300">
                        <svg class="w-5 h-5 text-yellow-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                        <span>Consider updating your password every 90 days</span>
                    </div>
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
    }

    closeDashboard() {
        const modal = document.getElementById('dashboardModal');
        if (modal) modal.classList.add('hidden');
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.app = new App();
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && window.app) window.app.closeDashboard();
});
