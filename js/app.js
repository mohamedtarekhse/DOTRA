// Main Application Bootstrapper & Routing (DOTRA Edition - SAP Blue & White Theme)
// المحرك الرئيسي للتطبيق - مجموعة دوترا (نمط ساب أزرق وأبيض)

class AppController {
    constructor() {
        this.currentView = 'login';
        this.loginRoleTab = 'manager';
    }

    init() {
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
                <header class="sap-header py-2.5 px-4 sm:px-6 sticky top-0 z-40">
                    <div class="max-w-7xl mx-auto flex items-center justify-between">
                        
                        <!-- DOTRA Official Brand Logo & Name -->
                        <div class="flex items-center gap-3">
                            <div class="bg-white p-1 rounded-xl shadow-md border border-white/30 flex items-center justify-center h-12 w-12 overflow-hidden">
                                <img src="assets/logo.jpg" alt="DOTRA دوترا" class="h-full w-full object-contain transform scale-110" />
                            </div>
                            <div>
                                <div class="flex items-center gap-2">
                                    <h1 class="text-base sm:text-lg font-black text-white leading-tight">
                                        ${lang === 'ar' ? 'مجموعة دوترا' : 'DOTRA Group'}
                                    </h1>
                                    <span class="text-[10px] bg-emerald-500 text-white font-mono px-1.5 py-0.5 rounded font-bold uppercase shadow-sm">
                                        GATE CONTROL
                                    </span>
                                </div>
                                <p class="text-[11px] text-blue-100 hidden sm:block font-medium">
                                    ${window.i18n.t('appSubtitle')}
                                </p>
                            </div>
                        </div>

                        <!-- Right Actions: Language & User Profile -->
                        <div class="flex items-center gap-3">
                            <!-- Language Toggle -->
                            <div class="flex items-center bg-[#001940] border border-blue-900 p-0.5 rounded-xl text-xs font-bold shadow-inner">
                                <button type="button" id="lang-btn-ar" onclick="window.i18n.setLanguage('ar')" class="px-2.5 py-1 rounded-lg transition-all ${lang === 'ar' ? 'bg-[#0070f2] text-white shadow' : 'text-blue-200 hover:text-white'}">
                                    العربية
                                </button>
                                <button type="button" id="lang-btn-en" onclick="window.i18n.setLanguage('en')" class="px-2.5 py-1 rounded-lg transition-all ${lang === 'en' ? 'bg-[#0070f2] text-white shadow' : 'text-blue-200 hover:text-white'}">
                                    EN
                                </button>
                            </div>

                            ${user ? `
                                <!-- User Profile Badge -->
                                <div class="flex items-center gap-2.5 bg-white/10 hover:bg-white/15 border border-white/20 py-1 px-3 rounded-xl text-xs backdrop-blur-md shadow-sm">
                                    <span class="text-lg">${user.role === 'manager' ? '🏢' : '👮'}</span>
                                    <div class="hidden sm:block text-right" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                                        <div class="font-bold text-white text-xs">${lang === 'ar' ? user.name_ar : user.name_en}</div>
                                        <div class="text-[10px] text-emerald-300 font-mono font-bold">${user.role === 'manager' ? 'OPERATIONS MANAGER' : user.badge_id}</div>
                                    </div>
                                    <button type="button" onclick="window.Auth.logout()" title="${window.i18n.t('logout')}" class="mr-1 text-red-200 hover:text-white p-1 rounded font-bold">
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
                <div class="sap-panel p-7 rounded-3xl border border-[#d7e2ee] shadow-xl relative overflow-hidden bg-white">
                    
                    <!-- DOTRA Logo Banner in Login Card -->
                    <div class="text-center mb-6">
                        <div class="w-24 h-24 rounded-3xl bg-white p-2 mx-auto shadow-md border border-[#d7e2ee] mb-3 flex items-center justify-center">
                            <img src="assets/logo.jpg" alt="DOTRA دوترا" class="h-full w-full object-contain" />
                        </div>
                        <h2 class="text-2xl font-black text-[#002b66]">${lang === 'ar' ? 'مجموعة دوترا' : 'DOTRA Group'}</h2>
                        <p class="text-xs text-[#556b82] mt-0.5 font-bold">${window.i18n.t('appSubtitle')}</p>
                    </div>

                    <!-- Role Switcher Tabs -->
                    <div class="grid grid-cols-2 gap-2 bg-[#f5f8fc] p-1.5 rounded-2xl border border-[#d7e2ee] mb-6">
                        <button type="button" onclick="App.switchLoginTab('manager')" class="py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${this.loginRoleTab === 'manager' ? 'bg-[#0070f2] text-white shadow-md' : 'text-[#556b82] hover:text-[#1d2d3e]'}">
                            <span>🏢</span>
                            <span>${lang === 'ar' ? 'مدير المكتب (PC)' : 'Office Manager'}</span>
                        </button>
                        <button type="button" onclick="App.switchLoginTab('officer')" class="py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${this.loginRoleTab === 'officer' ? 'bg-[#0070f2] text-white shadow-md' : 'text-[#556b82] hover:text-[#1d2d3e]'}">
                            <span>👮</span>
                            <span>${lang === 'ar' ? 'حارس البوابة (Mobile)' : 'Gate Officer'}</span>
                        </button>
                    </div>

                    <!-- Manager Login Form -->
                    ${this.loginRoleTab === 'manager' ? `
                        <form onsubmit="App.handleManagerLogin(event)" class="space-y-4">
                            <div>
                                <label class="block text-xs font-bold text-[#1d2d3e] mb-1.5">${window.i18n.t('emailLabel')}</label>
                                <input type="email" id="login-email" required value="manager@factory.com" class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl px-4 py-3 text-[#1d2d3e] text-sm focus:border-[#0070f2] focus:bg-white focus:outline-none font-mono" />
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-[#1d2d3e] mb-1.5">${window.i18n.t('passwordLabel')}</label>
                                <input type="password" id="login-password" required value="Manager@2026" class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl px-4 py-3 text-[#1d2d3e] text-sm focus:border-[#0070f2] focus:bg-white focus:outline-none font-mono" />
                            </div>
                            <button type="submit" class="w-full py-3.5 sap-btn-primary text-sm shadow-md flex items-center justify-center gap-2 mt-2">
                                <span>🏢</span>
                                <span>${window.i18n.t('signInBtn')}</span>
                            </button>
                        </form>
                    ` : `
                        <!-- Officer Quick Login Form -->
                        <form onsubmit="App.handleOfficerLogin(event)" class="space-y-4">
                            <div>
                                <label class="block text-xs font-bold text-[#1d2d3e] mb-1.5">${window.i18n.t('badgeLabel')}</label>
                                <select id="login-badge" class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl px-4 py-3 text-[#1d2d3e] text-sm font-mono focus:border-[#0070f2] focus:bg-white focus:outline-none font-bold">
                                    <option value="GT-01">GT-01 (أمين الشرطة طارق - بوابة 1 دوترا)</option>
                                    <option value="GT-02">GT-02 (أمين الشرطة خالد - بوابة 2 دوترا)</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-[#1d2d3e] mb-1.5">${window.i18n.t('pinLabel')}</label>
                                <input type="password" id="login-pin" required maxlength="4" placeholder="••••" value="1234" class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl px-4 py-3 text-[#1d2d3e] text-center text-xl tracking-widest font-mono font-bold focus:border-[#0070f2] focus:bg-white focus:outline-none" />
                            </div>
                            <button type="submit" class="w-full py-3.5 bg-[#107e3e] hover:bg-[#0c6b33] text-white font-bold rounded-xl text-sm shadow-md flex items-center justify-center gap-2 mt-2">
                                <span>👮</span>
                                <span>${window.i18n.t('openGateBtn')}</span>
                            </button>
                        </form>
                    `}

                    <!-- Demo Credentials Helper Box -->
                    <div class="mt-6 pt-4 border-t border-[#d7e2ee] text-[11px] text-[#556b82]">
                        <div class="font-bold text-[#1d2d3e] mb-2 flex items-center gap-1">
                            <span>💡</span>
                            <span>${lang === 'ar' ? 'حسابات التجربة السريعة (اضغط للدخول فوراً):' : 'Pre-configured Test Accounts:'}</span>
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <button type="button" onclick="App.quickLogin('manager')" class="p-2.5 bg-[#f5f8fc] hover:bg-[#ebf3fb] border border-[#d7e2ee] hover:border-[#0070f2] rounded-xl text-left text-[#1d2d3e] transition-all" dir="ltr">
                                <div class="font-bold text-[#0070f2]">🏢 Manager</div>
                                <div class="text-[10px] text-[#556b82]">manager@factory.com</div>
                            </button>
                            <button type="button" onclick="App.quickLogin('officer')" class="p-2.5 bg-[#f5f8fc] hover:bg-[#e5f6eb] border border-[#d7e2ee] hover:border-[#107e3e] rounded-xl text-left text-[#1d2d3e] transition-all" dir="ltr">
                                <div class="font-bold text-[#107e3e]">👮 Gate Officer</div>
                                <div class="text-[10px] text-[#556b82]">Badge: GT-01 (PIN: 1234)</div>
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
