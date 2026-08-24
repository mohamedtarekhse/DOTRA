// Main Application Bootstrapper & Routing
// المحرك الرئيسي للتطبيق وإدارة التنقل وتسجيل الدخول

class AppController {
    constructor() {
        this.currentView = 'login';
        this.loginRoleTab = 'manager';
    }

    init() {
        // Initialize language
        const savedLang = localStorage.getItem('gate_lang') || 'ar';
        window.i18n.setLanguage(savedLang);

        const currentUser = window.Auth.getCurrentUser();
        if (currentUser) {
            this.currentView = currentUser.role === 'manager' ? 'manager' : 'officer';
        } else {
            this.currentView = 'login';
        }

        this.renderApp();
    }

    renderApp() {
        const headerContainer = document.getElementById('app-header');
        const user = window.Auth.getCurrentUser();
        const lang = window.i18n.getLang();

        if (headerContainer) {
            headerContainer.innerHTML = `
                <header class="glass-panel border-b border-slate-800 py-3 px-4 sm:px-6 sticky top-0 z-40">
                    <div class="max-w-7xl mx-auto flex items-center justify-between">
                        <!-- Brand / Logo -->
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center text-xl shadow-lg border border-sky-400/40">
                                🛡️
                            </div>
                            <div>
                                <h1 class="text-base sm:text-lg font-black text-white leading-tight">
                                    ${window.i18n.t('appName')}
                                </h1>
                                <p class="text-[11px] text-slate-400 hidden sm:block">
                                    ${window.i18n.t('appSubtitle')}
                                </p>
                            </div>
                        </div>

                        <!-- Right Actions: Language & User Profile -->
                        <div class="flex items-center gap-3">
                            <!-- Language Toggle -->
                            <div class="flex items-center bg-slate-900 border border-slate-700 p-0.5 rounded-xl text-xs font-bold">
                                <button type="button" id="lang-btn-ar" onclick="window.i18n.setLanguage('ar')" class="px-2.5 py-1 rounded-lg transition-all ${lang === 'ar' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'}">
                                    العربية
                                </button>
                                <button type="button" id="lang-btn-en" onclick="window.i18n.setLanguage('en')" class="px-2.5 py-1 rounded-lg transition-all ${lang === 'en' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'}">
                                    EN
                                </button>
                            </div>

                            ${user ? `
                                <!-- User Profile & Switcher -->
                                <div class="flex items-center gap-2 bg-slate-900/80 border border-slate-700/80 py-1 px-2.5 rounded-xl text-xs">
                                    <span class="text-sm">${user.role === 'manager' ? '🏢' : '👮'}</span>
                                    <div class="hidden sm:block text-left" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                                        <div class="font-bold text-white text-xs">${lang === 'ar' ? user.name_ar : user.name_en}</div>
                                        <div class="text-[10px] text-sky-400 font-mono">${user.role === 'manager' ? 'MANAGER' : user.badge_id}</div>
                                    </div>
                                    <button type="button" onclick="window.Auth.logout()" title="${window.i18n.t('logout')}" class="ml-1 text-slate-400 hover:text-rose-400 p-1">
                                        🚪
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </header>
            `;
        }

        if (this.currentView === 'login') {
            this.renderLoginScreen();
        } else if (this.currentView === 'manager') {
            window.Manager.renderDashboard();
        } else if (this.currentView === 'officer') {
            window.Officer.renderTerminal();
        }
    }

    renderLoginScreen() {
        const container = document.getElementById('main-content');
        if (!container) return;
        const lang = window.i18n.getLang();

        container.innerHTML = `
            <div class="max-w-md mx-auto my-6 px-4 animate-fadeIn" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                <div class="glass-panel p-6 rounded-3xl border border-sky-600/40 shadow-2xl relative overflow-hidden">
                    
                    <!-- Top Icon & Header -->
                    <div class="text-center mb-6">
                        <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-600 to-blue-700 mx-auto flex items-center justify-center text-3xl shadow-xl border border-sky-400/50 mb-3">
                            🛡️
                        </div>
                        <h2 class="text-2xl font-black text-white">${window.i18n.t('loginTitle')}</h2>
                        <p class="text-xs text-slate-400 mt-1">${window.i18n.t('loginDesc')}</p>
                    </div>

                    <!-- Role Switcher Tabs -->
                    <div class="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 mb-6">
                        <button type="button" onclick="App.switchLoginTab('manager')" class="py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${this.loginRoleTab === 'manager' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}">
                            <span>🏢</span>
                            <span>${lang === 'ar' ? 'مدير المكتب (PC)' : 'Office Manager'}</span>
                        </button>
                        <button type="button" onclick="App.switchLoginTab('officer')" class="py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${this.loginRoleTab === 'officer' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}">
                            <span>👮</span>
                            <span>${lang === 'ar' ? 'حارس البوابة (Mobile)' : 'Gate Officer'}</span>
                        </button>
                    </div>

                    <!-- Manager Login Form -->
                    ${this.loginRoleTab === 'manager' ? `
                        <form onsubmit="App.handleManagerLogin(event)" class="space-y-4">
                            <div>
                                <label class="block text-xs font-bold text-slate-300 mb-1.5">${window.i18n.t('emailLabel')}</label>
                                <input type="email" id="login-email" required value="manager@factory.com" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:border-sky-500 focus:outline-none font-mono" />
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-slate-300 mb-1.5">${window.i18n.t('passwordLabel')}</label>
                                <input type="password" id="login-password" required value="Manager@2026" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:border-sky-500 focus:outline-none font-mono" />
                            </div>
                            <button type="submit" class="w-full py-3.5 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white font-bold rounded-xl text-sm shadow-xl flex items-center justify-center gap-2 mt-2">
                                <span>🏢</span>
                                <span>${window.i18n.t('signInBtn')}</span>
                            </button>
                        </form>
                    ` : `
                        <!-- Officer Quick Login Form -->
                        <form onsubmit="App.handleOfficerLogin(event)" class="space-y-4">
                            <div>
                                <label class="block text-xs font-bold text-slate-300 mb-1.5">${window.i18n.t('badgeLabel')}</label>
                                <select id="login-badge" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm font-mono focus:border-sky-500 focus:outline-none">
                                    <option value="GT-01">GT-01 (الضابط طارق - بوابة 1)</option>
                                    <option value="GT-02">GT-02 (الضابط خالد - بوابة 2)</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-slate-300 mb-1.5">${window.i18n.t('pinLabel')}</label>
                                <input type="password" id="login-pin" required maxlength="4" placeholder="••••" value="1234" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-center text-xl tracking-widest font-mono focus:border-sky-500 focus:outline-none" />
                            </div>
                            <button type="submit" class="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold rounded-xl text-sm shadow-xl flex items-center justify-center gap-2 mt-2">
                                <span>👮</span>
                                <span>${window.i18n.t('openGateBtn')}</span>
                            </button>
                        </form>
                    `}

                    <!-- Demo Credentials Helper Box -->
                    <div class="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400">
                        <div class="font-bold text-slate-300 mb-2 flex items-center gap-1">
                            <span>💡</span>
                            <span>${lang === 'ar' ? 'حسابات التجربة الجاهزة (اضغط للدخول فوراً):' : 'Pre-configured Test Accounts:'}</span>
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <button type="button" onclick="App.quickLogin('manager')" class="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-left text-slate-300 text-[11px] transition-all" dir="ltr">
                                <div class="font-bold text-sky-400">🏢 Manager</div>
                                <div class="text-[10px] text-slate-400">manager@factory.com</div>
                            </button>
                            <button type="button" onclick="App.quickLogin('officer')" class="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-left text-slate-300 text-[11px] transition-all" dir="ltr">
                                <div class="font-bold text-emerald-400">👮 Gate Officer</div>
                                <div class="text-[10px] text-slate-400">Badge: GT-01 (PIN: 1234)</div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    switchLoginTab(role) {
        this.loginRoleTab = role;
        this.renderLoginScreen();
    }

    handleManagerLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const res = window.Auth.loginManager(email, password);

        if (res.success) {
            this.currentView = 'manager';
            this.renderApp();
        } else {
            alert(res.message);
        }
    }

    handleOfficerLogin(e) {
        e.preventDefault();
        const badge = document.getElementById('login-badge').value;
        const pin = document.getElementById('login-pin').value;
        const res = window.Auth.loginOfficer(badge, pin);

        if (res.success) {
            this.currentView = 'officer';
            this.renderApp();
        } else {
            alert(res.message);
        }
    }

    quickLogin(role) {
        if (role === 'manager') {
            window.Auth.loginManager('manager@factory.com', 'Manager@2026');
            this.currentView = 'manager';
        } else {
            window.Auth.loginOfficer('GT-01', '1234');
            this.currentView = 'officer';
        }
        this.renderApp();
    }

    refreshUI() {
        this.renderApp();
    }
}

window.App = new AppController();
document.addEventListener('DOMContentLoaded', () => {
    window.App.init();
});
