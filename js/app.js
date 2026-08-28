// Main Application Bootstrapper & Routing (DOTRA Edition - Perfect RTL/LTR & SAP Enterprise Alignment)
// المحرك الرئيسي للتطبيق - ضبط دقيق للمحاذاة والاتجاهات للعربية والإنجليزية

class AppController {
    constructor() {
        this.currentView = 'login';
        this.loginRoleTab = 'management'; // 'management' | 'gates'
    }

    async init() {
        const savedLang = localStorage.getItem('gate_lang') || 'ar';
        window.i18n.setLanguage(savedLang);

        if (window.DB && typeof window.DB.syncFromCloud === 'function') {
            await window.DB.syncFromCloud();
        }

        const currentUser = window.Auth.getCurrentUser();
        if (currentUser) {
            if (currentUser.role === 'ceo') {
                this.currentView = 'ceo';
            } else if (currentUser.role === 'manager' || currentUser.role === 'admin') {
                this.currentView = 'manager';
            } else {
                this.currentView = 'officer';
            }
        } else if (window.DB.needsSetup()) {
            this.currentView = 'setup';
        } else {
            this.currentView = 'login';
        }

        if (window.PushService) {
            window.PushService.startPolling(3000);
        }


        window.addEventListener('online', () => this.updateNetworkBadge());
        window.addEventListener('offline', () => this.updateNetworkBadge());

        // 1. Instant Real-time synchronization across local tabs/windows (<1ms)
        window.addEventListener('storage', (e) => {
            if (e.key && e.key.startsWith('gate_')) {
                if (this.currentView === 'ceo' && window.CEO) {
                    window.CEO.renderDashboard();
                } else if (this.currentView === 'manager' && window.Manager) {
                    window.Manager.renderDashboard();
                } else if (this.currentView === 'officer' && window.Officer) {
                    window.Officer.renderTerminal();
                }
            }
        });

        // 2. Real-time Live Event Announcements Broadcast Channel
        if (typeof BroadcastChannel !== 'undefined') {
            this.channel = new BroadcastChannel('dotra_gate_live_announcements');
            this.channel.onmessage = (event) => {
                const data = event.data;
                if (data && data.type) {
                    this.handleLiveAnnouncement(data);
                }
            };
        }

        // 3. Continuous Cloud Synchronization across PC, Mobile, and Gate Terminals (every 2s)
        if (typeof setInterval !== 'undefined') {
            setInterval(async () => {
                if (typeof navigator !== 'undefined' && navigator.onLine && window.DB && typeof window.DB.syncFromCloud === 'function') {
                    const changed = await window.DB.syncFromCloud();
                    if (changed) {
                        if (this.currentView === 'ceo' && window.CEO) {
                            window.CEO.renderDashboard();
                        } else if (this.currentView === 'manager' && window.Manager) {
                            window.Manager.renderDashboard();
                        } else if (this.currentView === 'officer' && window.Officer) {
                            window.Officer.renderTerminal();
                        }
                    }
                }
            }, 2000);
        }

        this.renderApp();
    }

    handleLiveAnnouncement(data) {
        const lang = window.i18n.getLang();
        let title = '🔔 تنبيه بوابة دوترا';
        let body = '';
        let notifType = 'info';

        if (data.type === 'PERMIT_CREATED') {
            title = lang === 'ar' ? '🎫 تم إصدار تصريح جديد' : 'New Pass Issued';
            body = lang === 'ar' ? `تصريح للمركبة: ${data.plate} • كود التحقق: ${data.pin}` : `Pass created for ${data.plate} (PIN: ${data.pin})`;
            notifType = 'info';
            this.showToast(title, body, 'info', 'shield');
        } else if (data.type === 'VEHICLE_ENTRY') {
            title = lang === 'ar' ? '📥 تسجيل دخول شاحنة' : 'Vehicle Entry Recorded';
            body = lang === 'ar' ? `دخلت ${data.plate} عبر ${data.gate} (👮 ${data.officer})` : `Vehicle ${data.plate} entered via ${data.gate}`;
            notifType = 'success';
            this.showToast(title, body, 'success', 'truck');
        } else if (data.type === 'VEHICLE_EXIT') {
            title = lang === 'ar' ? '📤 تسجيل خروج شاحنة' : 'Vehicle Exit Recorded';
            body = lang === 'ar' ? `غادرت ${data.plate} عبر ${data.gate} (⏱️ المدة: ${data.duration} دقيقة)` : `Vehicle ${data.plate} exited via ${data.gate} (${data.duration} min)`;
            notifType = 'warning';
            this.showToast(title, body, 'warning', 'logout');
        } else if (data.type === 'BLACKLIST_UPDATED') {
            title = lang === 'ar' ? '⛔ تحديث القائمة السوداء' : 'Security Alert';
            body = lang === 'ar' ? `تم تحديث حالة أمان المركبة ${data.plate}` : `Security status updated for ${data.plate}`;
            notifType = 'error';
            this.showToast(title, body, 'error', 'ban');
        } else if (data.type === 'INSPECTION_REQUEST_CREATED') {
            title = lang === 'ar' ? '🚨 طلب فحص واستئذان دخول جديد' : 'New Gate Pass Request';
            body = lang === 'ar' ? `شاحنة: ${data.plate} عند ${data.gate} (👮 ${data.officer})` : `Truck ${data.plate} at ${data.gate} awaiting approval`;
            notifType = 'warning';
            this.showToast(title, body, 'warning', 'shield');
        } else if (data.type === 'INSPECTION_REQUEST_DECIDED') {
            const isApprove = data.status === 'approved';
            title = isApprove ? (lang === 'ar' ? '✅ تم اعتماد الدخول من الإدارة' : 'Entry Approved by Manager') : (lang === 'ar' ? '⛔ تم رفض طلب الدخول' : 'Entry Denied by Manager');
            body = isApprove 
                ? (lang === 'ar' ? `المركبة: ${data.plate} • كود: ${data.permit_code} • PIN: ${data.pin_code}` : `Vehicle: ${data.plate} • Pass: ${data.permit_code}`)
                : (lang === 'ar' ? `المركبة: ${data.plate} • السبب: ${data.manager_notes || 'مرفوض'}` : `Vehicle: ${data.plate} denied`);
            notifType = isApprove ? 'success' : 'error';
            this.showToast(title, body, notifType, isApprove ? 'check' : 'ban');

            // If Officer is currently active or waiting on modal, auto-refresh and display decision
            if (this.currentView === 'officer' && window.Officer) {
                if (typeof window.Officer.handleInspectionDecision === 'function') {
                    window.Officer.handleInspectionDecision(data);
                }
            }
        } else if (data.type === 'ROSTER_UPDATED') {
            title = lang === 'ar' ? '📊 تحديث جدول المناوبات' : 'Roster Updated';
            body = lang === 'ar' ? 'تم تحديث جدول توزيع البوابات والمناوبات من الإدارة' : 'Gate shift roster updated by manager';
            notifType = 'info';
            this.showToast(title, body, 'info', 'shield');
        }

        // Re-render current view with updated state
        if (this.currentView === 'ceo' && window.CEO) {
            window.CEO.renderDashboard();
        } else if (this.currentView === 'manager' && window.Manager) {
            window.Manager.renderDashboard();
        } else if (this.currentView === 'officer' && window.Officer) {
            window.Officer.renderTerminal();
        }

        // Trigger System / OS Notification & Audio Chime
        if (window.PushService && typeof window.PushService.showSystemNotification === 'function') {
            window.PushService.showSystemNotification(title, body, notifType, `live-${Date.now()}`);
        }
    }


    playChime(type = 'info') {
        try {
            if (typeof window === 'undefined' || !window.AudioContext && !window.webkitAudioContext) return;
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            const now = ctx.currentTime;
            if (type === 'success') {
                osc.frequency.setValueAtTime(587.33, now); // D5
                osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
            } else if (type === 'warning') {
                osc.frequency.setValueAtTime(659.25, now); // E5
                osc.frequency.exponentialRampToValueAtTime(523.25, now + 0.2); // C5
            } else if (type === 'error') {
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.exponentialRampToValueAtTime(330, now + 0.25);
            } else {
                osc.frequency.setValueAtTime(523.25, now); // C5
                osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5
            }

            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

            osc.start(now);
            osc.stop(now + 0.35);
        } catch (e) {
            // Audio context policy fallback
        }
    }

    showToast(title, message, type = 'info', iconName = 'bell') {
        this.playChime(type);
        const container = document.getElementById('toast-container');
        if (!container) return;

        const colors = {
            info: { bg: 'bg-[#002b66]', border: 'border-[#0070f2]', text: 'text-white', badge: 'bg-[#0070f2]' },
            success: { bg: 'bg-[#003816]', border: 'border-[#107e3e]', text: 'text-white', badge: 'bg-[#107e3e]' },
            warning: { bg: 'bg-[#3d1e00]', border: 'border-[#b85500]', text: 'text-white', badge: 'bg-[#b85500]' },
            error: { bg: 'bg-[#400000]', border: 'border-[#bb0000]', text: 'text-white', badge: 'bg-[#bb0000]' }
        };
        const c = colors[type] || colors.info;
        const iconHtml = window.Icons ? window.Icons.get(iconName, 'w-4 h-4 text-white') : '🔔';

        const toast = document.createElement('div');
        toast.className = `pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl ${c.bg} border-2 ${c.border} shadow-2xl animate-scaleUp text-right backdrop-blur-md`;
        toast.dir = window.i18n.getLang() === 'ar' ? 'rtl' : 'ltr';
        toast.innerHTML = `
            <div class="p-2 rounded-xl ${c.badge} flex-shrink-0 shadow-sm">
                ${iconHtml}
            </div>
            <div class="flex-1 min-w-0">
                <div class="font-black text-xs ${c.text} flex items-center justify-between">
                    <span>${title}</span>
                    <span class="text-[9px] font-mono opacity-70">الآن</span>
                </div>
                <div class="text-[11px] text-slate-200 mt-0.5 leading-snug font-medium break-words">
                    ${message}
                </div>
            </div>
            <button type="button" onclick="this.parentElement.remove()" class="text-white/60 hover:text-white text-xs font-bold p-1">
                ✕
            </button>
        `;

        container.appendChild(toast);
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(-10px)';
                toast.style.transition = 'all 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }
        }, 4500);
    }

    updateNetworkBadge() {
        const badge = document.getElementById('network-status-badge');
        if (!badge) return;
        const isOnline = navigator.onLine;
        const lang = window.i18n.getLang();

        if (isOnline) {
            badge.className = 'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30';
            badge.innerHTML = `
                <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>${lang === 'ar' ? 'متصل' : 'Online'}</span>
            `;
        } else {
            badge.className = 'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30';
            badge.innerHTML = `
                <span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                <span>${lang === 'ar' ? 'أوفلاين (محلي)' : 'Offline (Local)'}</span>
            `;
        }
    }

    renderApp() {
        const headerContainer = document.getElementById('app-header');
        const user = window.Auth.getCurrentUser();
        const lang = window.i18n.getLang();
        const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
        const icon = (name, cls = 'w-3.5 h-3.5') => window.Icons ? window.Icons.get(name, cls) : '';

        if (headerContainer) {
            headerContainer.innerHTML = `
                <header class="sap-header py-2 px-4 sm:px-6 sticky top-0 z-40" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                    <div class="max-w-7xl mx-auto flex items-center justify-between">
                        
                        <!-- DOTRA Official Brand Logo & Name -->
                        <div class="flex items-center gap-3">
                            <div class="bg-white p-1 rounded-xl shadow-md border border-white/20 flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 overflow-hidden flex-shrink-0">
                                <img src="assets/logo.jpg" alt="DOTRA دوترا" class="h-full w-full object-contain transform scale-105" />
                            </div>
                            <div class="${lang === 'ar' ? 'text-right' : 'text-left'}">
                                <div class="flex items-center gap-2">
                                    <h1 class="text-sm sm:text-base font-black text-white leading-tight">
                                        ${lang === 'ar' ? 'مجموعة دوترا' : 'DOTRA Group'}
                                    </h1>
                                    <span class="text-[9px] bg-white/15 text-blue-100 border border-white/20 px-1.5 py-0.5 rounded-md font-mono font-bold uppercase tracking-wider">
                                        GATE CONTROL
                                    </span>
                                </div>
                                <p class="text-[10px] text-blue-200 hidden sm:block font-medium">
                                    ${window.i18n.t('appSubtitle')}
                                </p>
                            </div>
                        </div>

                        <!-- Desktop View Actions (Unified Professional Palette) -->
                        <div class="hidden md:flex items-center gap-2">
                            
                            <!-- Network Status Indicator -->
                            <div id="network-status-badge" class="nav-action-btn text-[10px] pointer-events-none" title="${isOnline ? 'Network Connected' : 'Offline Mode'}">
                                <span class="w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-amber-400 animate-ping'}"></span>
                                <span>${isOnline ? (lang === 'ar' ? 'متصل' : 'Online') : (lang === 'ar' ? 'محلي' : 'Offline')}</span>
                            </div>

                            <!-- Cache Buster Button -->
                            <button type="button"
                                onclick="App.bustCache()"
                                title="${lang === 'ar' ? 'مسح الذاكرة المؤقتة وإعادة المزامنة' : 'Clear cache & re-sync'}"
                                class="nav-action-btn">
                                ${icon('refresh', 'w-3.5 h-3.5 opacity-90')}
                                <span>${lang === 'ar' ? 'تحديث الكاش' : 'Sync Cache'}</span>
                            </button>

                            <!-- Push Notification Toggle -->
                            <button type="button"
                                onclick="App.toggleUserPush()"
                                title="${localStorage.getItem('gate_push_enabled') === 'true' ? (lang === 'ar' ? 'الإشعارات الفورية مفعلة (انقر للتعطيل)' : 'Push Notifications Active (Click to disable)') : (lang === 'ar' ? 'تفعيل الإشعارات الفورية لهذا الحساب' : 'Enable Push Notifications')}"
                                class="nav-action-btn relative ${localStorage.getItem('gate_push_enabled') === 'true' ? 'bg-white/20 border-white/30 text-white' : ''}">
                                ${icon(localStorage.getItem('gate_push_enabled') === 'true' ? 'bell' : 'bellOff', 'w-3.5 h-3.5')}
                                <span>${localStorage.getItem('gate_push_enabled') === 'true' ? (lang === 'ar' ? 'الإشعارات' : 'Push') : (lang === 'ar' ? 'تفعيل التنبيهات' : 'Enable Push')}</span>
                                ${localStorage.getItem('gate_push_enabled') === 'true' ? `<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>` : ''}
                                <span id="notif-badge" class="hidden absolute -top-1 ${lang === 'ar' ? '-left-1' : '-right-1'} w-3.5 h-3.5 bg-rose-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center shadow"></span>
                            </button>

                            <!-- Language Segmented Control -->
                            <div class="flex items-center bg-black/25 border border-white/15 p-0.5 rounded-xl text-xs font-bold shadow-inner">
                                <button type="button" id="lang-btn-ar" onclick="window.i18n.setLanguage('ar')" class="px-2.5 py-1 rounded-lg transition-all ${lang === 'ar' ? 'bg-[#0070f2] text-white shadow-sm' : 'text-blue-200 hover:text-white'}">
                                    العربية
                                </button>
                                <button type="button" id="lang-btn-en" onclick="window.i18n.setLanguage('en')" class="px-2.5 py-1 rounded-lg transition-all ${lang === 'en' ? 'bg-[#0070f2] text-white shadow-sm' : 'text-blue-200 hover:text-white'}">
                                    EN
                                </button>
                            </div>

                            ${user ? `
                                <!-- User Profile Badge (Locked to assigned role) -->
                                <div class="flex items-center gap-2 bg-white/10 border border-white/20 py-1.5 px-3 rounded-xl text-xs backdrop-blur-md shadow-sm">
                                    <span class="w-7 h-7 rounded-lg ${user.role === 'ceo' ? 'bg-amber-400 text-slate-950' : (user.role === 'manager' ? 'bg-[#0070f2] text-white' : 'bg-[#107e3e] text-white')} flex items-center justify-center text-xs font-black shadow-inner">
                                        ${icon(user.role === 'ceo' ? 'building' : (user.role === 'manager' ? 'building' : 'shield'), 'w-4 h-4')}
                                    </span>
                                    <div class="${lang === 'ar' ? 'text-right' : 'text-left'}">
                                        <div class="font-bold text-white text-xs leading-none">${lang === 'ar' ? user.name_ar : user.name_en}</div>
                                        <div class="text-[9px] ${user.role === 'ceo' ? 'text-amber-300' : 'text-blue-200'} font-mono font-bold mt-0.5">
                                            ${user.role === 'ceo' ? '🏛️ CHIEF EXECUTIVE (CEO)' : (user.role === 'manager' ? '🏢 OPERATIONS MANAGER' : `👮 GATE OFFICER (${user.badge_id})`)}
                                        </div>
                                    </div>
                                    <button type="button" onclick="window.Auth.logout()" title="${window.i18n.t('logout')}" class="p-1 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors mr-1">
                                        ${icon('logout', 'w-3.5 h-3.5')}
                                    </button>
                                </div>
                            ` : ''}
                        </div>

                        <!-- Mobile Hamburger Button -->
                        <div class="flex md:hidden items-center gap-2">
                            <button type="button"
                                id="mobile-hamburger-btn"
                                onclick="App.toggleMobileMenu()"
                                class="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/20 shadow-sm flex items-center justify-center focus:outline-none"
                                aria-label="Toggle Navigation Menu">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                                </svg>
                                ${localStorage.getItem('gate_push_enabled') === 'true' ? `
                                    <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-400 rounded-full"></span>
                                ` : ''}
                            </button>
                        </div>
                    </div>

                    <!-- Mobile Drawer Menu (Unified Clean Palette) -->
                    <div id="mobile-nav-menu" class="hidden md:hidden mt-2.5 pt-2.5 border-t border-white/15 space-y-2.5 animate-scaleUp">
                        ${user ? `
                            <div class="flex items-center justify-between p-2.5 rounded-xl bg-white/10 border border-white/15 backdrop-blur-md">
                                <div class="flex items-center gap-2.5">
                                    <div class="w-8 h-8 rounded-lg ${user.role === 'ceo' ? 'bg-amber-400 text-slate-950' : 'bg-white/15 text-white'} flex items-center justify-center">
                                        ${icon(user.role === 'ceo' ? 'building' : (user.role === 'manager' ? 'building' : 'shield'), 'w-4 h-4')}
                                    </div>
                                    <div class="${lang === 'ar' ? 'text-right' : 'text-left'}">
                                        <div class="font-bold text-white text-xs">${lang === 'ar' ? user.name_ar : user.name_en}</div>
                                        <div class="text-[10px] ${user.role === 'ceo' ? 'text-amber-300' : 'text-blue-200'} font-mono font-bold">${user.role === 'ceo' ? '🏛️ CEO EXECUTIVE' : (user.role === 'manager' ? '🏢 MANAGER' : (`👮 ${user.badge_id}` + (user.gate_assigned ? ' • ' + user.gate_assigned : '')))}</div>
                                    </div>
                                </div>
                                <button type="button" onclick="window.Auth.logout()" class="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all">
                                    ${icon('logout', 'w-3.5 h-3.5')}
                                    <span>${window.i18n.t('logout')}</span>
                                </button>
                            </div>
                        ` : ''}

                        <!-- Mobile Controls Row -->
                        <div class="grid grid-cols-2 gap-2">
                            <div class="nav-action-btn justify-center text-xs pointer-events-none">
                                <span class="w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-amber-400 animate-ping'}"></span>
                                <span>${isOnline ? (lang === 'ar' ? 'الشبكة: متصل' : 'Online') : (lang === 'ar' ? 'الشبكة: محلي' : 'Offline')}</span>
                            </div>

                            <div class="flex items-center bg-black/25 border border-white/15 p-0.5 rounded-xl text-xs font-bold shadow-inner">
                                <button type="button" onclick="window.i18n.setLanguage('ar')" class="flex-1 py-1 rounded-lg text-center transition-all ${lang === 'ar' ? 'bg-[#0070f2] text-white shadow-sm' : 'text-blue-200 hover:text-white'}">
                                    العربية
                                </button>
                                <button type="button" onclick="window.i18n.setLanguage('en')" class="flex-1 py-1 rounded-lg text-center transition-all ${lang === 'en' ? 'bg-[#0070f2] text-white shadow-sm' : 'text-blue-200 hover:text-white'}">
                                    EN
                                </button>
                            </div>
                        </div>

                        <!-- Mobile Action Buttons -->
                        <div class="grid grid-cols-2 gap-2">
                            <button type="button"
                                onclick="App.toggleUserPush()"
                                class="nav-action-btn justify-center py-2 text-xs ${localStorage.getItem('gate_push_enabled') === 'true' ? 'bg-white/20 border-white/30' : ''}">
                                ${icon(localStorage.getItem('gate_push_enabled') === 'true' ? 'bell' : 'bellOff', 'w-4 h-4')}
                                <span>${localStorage.getItem('gate_push_enabled') === 'true' ? (lang === 'ar' ? 'الإشعارات مفعلة' : 'Push Active') : (lang === 'ar' ? 'تفعيل الإشعارات' : 'Enable Push')}</span>
                            </button>

                            <button type="button"
                                onclick="App.bustCache()"
                                class="nav-action-btn justify-center py-2 text-xs">
                                ${icon('refresh', 'w-4 h-4')}
                                <span>${lang === 'ar' ? 'تحديث الكاش' : 'Sync Cache'}</span>
                            </button>
                        </div>
                    </div>
                </header>
            `;
        }

        // Strict Role-Based View Access Enforcement
        if (this.currentView === 'setup') {
            this.renderSetupScreen();
        } else if (this.currentView === 'login' || !user) {
            this.renderLoginScreen();
        } else if (user.role === 'ceo') {
            this.currentView = 'ceo';
            if (window.CEO) window.CEO.renderDashboard();
        } else if (user.role === 'manager' || user.role === 'admin') {
            this.currentView = 'manager';
            if (window.Manager) window.Manager.renderDashboard();
        } else if (user.role === 'officer') {
            this.currentView = 'officer';
            if (window.Officer) window.Officer.renderTerminal();
        }
    }

    renderLoginScreen() {
        const container = document.getElementById('main-content');
        if (!container) return;
        const lang = window.i18n.getLang();

        container.innerHTML = `
            <div class="max-w-md mx-auto my-8 px-4 animate-fadeIn" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                <div class="sap-panel p-8 rounded-3xl border border-[#d7e2ee] shadow-xl relative overflow-hidden bg-white">
                    
                    <!-- DOTRA Logo Banner in Login Card -->
                    <div class="text-center mb-6">
                        <div class="w-24 h-24 rounded-3xl bg-white p-2 mx-auto shadow-md border border-[#d7e2ee] mb-3 flex items-center justify-center">
                            <img src="assets/logo.jpg" alt="DOTRA دوترا" class="h-full w-full object-contain" />
                        </div>
                        <h2 class="text-2xl font-black text-[#002b66]">${lang === 'ar' ? 'مجموعة دوترا' : 'DOTRA Group'}</h2>
                        <p class="text-xs text-[#556b82] mt-0.5 font-bold">${window.i18n.t('appSubtitle')}</p>
                    </div>

                    <!-- Role Switcher Tabs (2 Clear Categories: Management vs Gates) -->
                    <div class="grid grid-cols-2 gap-2 bg-[#f5f8fc] p-1.5 rounded-2xl border border-[#d7e2ee] mb-6 shadow-inner">
                        <button type="button" onclick="App.switchLoginTab('management')" class="py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${this.loginRoleTab !== 'gates' ? 'bg-[#002b66] text-white font-black shadow-md' : 'text-[#556b82] hover:text-[#002b66]'}">
                            <span class="text-base">🏢</span>
                            <span>${lang === 'ar' ? 'الإدارة والعمليات' : 'Management'}</span>
                        </button>
                        <button type="button" onclick="App.switchLoginTab('gates')" class="py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${this.loginRoleTab === 'gates' ? 'bg-[#107e3e] text-white font-black shadow-md' : 'text-[#556b82] hover:text-[#107e3e]'}">
                            <span class="text-base">👮</span>
                            <span>${lang === 'ar' ? 'بوابات المصنع' : 'Factory Gates'}</span>
                        </button>
                    </div>

                    <!-- 1. MANAGEMENT & EXECUTIVE LOGIN FORM (CEO / Operations Manager) -->
                    ${this.loginRoleTab !== 'gates' ? `
                        <form onsubmit="App.handleManagerLogin(event)" class="space-y-4">
                            <div class="bg-blue-50/80 p-3 rounded-2xl border border-[#b0cfee] text-xs text-[#002b66] font-bold flex items-center gap-2.5">
                                <span class="text-lg">🏛️</span>
                                <div class="leading-tight">
                                    ${lang === 'ar' ? 'تسجيل الدخول الموحد للقيادة التنفيذية (الرئيس التنفيذي) وإدارة العمليات' : 'Unified sign-in for CEO Executive Leadership & Operations Management'}
                                </div>
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-[#1d2d3e] mb-1.5">${window.i18n.t('emailLabel')}</label>
                                <input type="email" id="login-email" required placeholder="ceo@dotra.com / manager@dotra.com" class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl px-4 py-3 text-[#1d2d3e] text-sm focus:border-[#0070f2] focus:bg-white focus:outline-none font-mono font-bold" />
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-[#1d2d3e] mb-1.5">${window.i18n.t('passwordLabel')}</label>
                                <input type="password" id="login-password" required placeholder="••••••••" class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl px-4 py-3 text-[#1d2d3e] text-sm focus:border-[#0070f2] focus:bg-white focus:outline-none font-mono" />
                            </div>
                            <button type="submit" class="w-full py-3.5 bg-[#002b66] hover:bg-[#001b40] text-white font-black rounded-xl text-sm shadow-md flex items-center justify-center gap-2 mt-2 transition-transform hover:-translate-y-0.5 active:scale-95">
                                <span>🏢</span>
                                <span>${lang === 'ar' ? 'دخول لوحة الإدارة والتحكم' : 'Sign In to Management Portal'}</span>
                            </button>
                        </form>
                    ` : `
                        <!-- 2. FACTORY GATE OFFICERS & SECURITY TERMINAL LOGIN FORM -->
                        <form onsubmit="App.handleOfficerLogin(event)" class="space-y-4">
                            <div class="bg-emerald-50 p-3 rounded-2xl border border-emerald-200 text-xs text-[#107e3e] font-bold flex items-center gap-2.5">
                                <span class="text-lg">👮</span>
                                <div class="leading-tight">
                                    ${lang === 'ar' ? 'تسجيل الدخول السريع لمحطات أمن بوابات المصنع والورديات' : 'Station terminal login for factory gate security officers'}
                                </div>
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-[#1d2d3e] mb-1.5">${window.i18n.t('badgeLabel')}</label>
                                <input type="text" id="login-badge" required placeholder="GT-01" class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl px-4 py-3 text-[#1d2d3e] text-sm font-mono uppercase font-bold focus:border-[#107e3e] focus:bg-white focus:outline-none" />
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-[#1d2d3e] mb-1.5">${window.i18n.t('pinLabel')}</label>
                                <input type="password" id="login-pin" required maxlength="4" placeholder="••••" class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl px-4 py-3 text-[#1d2d3e] text-center text-xl tracking-widest font-mono font-bold focus:border-[#107e3e] focus:bg-white focus:outline-none" />
                            </div>
                            <button type="submit" class="w-full py-3.5 bg-[#107e3e] hover:bg-[#0c6b33] text-white font-black rounded-xl text-sm shadow-md flex items-center justify-center gap-2 mt-2 transition-transform hover:-translate-y-0.5 active:scale-95">
                                <span>👮</span>
                                <span>${lang === 'ar' ? 'فتح محطة أمن البوابة' : 'Open Gate Security Terminal'}</span>
                            </button>
                        </form>
                    `}
                </div>
            </div>
        `;
    }

    renderSetupScreen() {
        const container = document.getElementById('main-content');
        if (!container) return;
        const lang = window.i18n.getLang();

        container.innerHTML = `
            <div class="max-w-md mx-auto my-8 px-4 animate-fadeIn" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                <div class="sap-panel p-8 rounded-3xl border border-[#d7e2ee] shadow-xl relative overflow-hidden bg-white">
                    <div class="text-center mb-6">
                        <div class="w-24 h-24 rounded-3xl bg-white p-2 mx-auto shadow-md border border-[#d7e2ee] mb-3 flex items-center justify-center">
                            <img src="assets/logo.jpg" alt="DOTRA دوترا" class="h-full w-full object-contain" />
                        </div>
                        <h2 class="text-xl font-black text-[#002b66]">${lang === 'ar' ? 'الإعداد الأولي' : 'Initial Setup'}</h2>
                        <p class="text-xs text-[#556b82] mt-1">${lang === 'ar' ? 'إنشاء حساب المدير الأولي' : 'Create the initial manager account'}</p>
                    </div>
                    <form onsubmit="App.handleSetup(event)" class="space-y-4">
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-xs font-bold text-[#1d2d3e] mb-1.5">${lang === 'ar' ? 'الاسم بالعربي' : 'Name (AR)'}</label>
                                <input type="text" id="setup-name-ar" required class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl px-4 py-3 text-[#1d2d3e] text-sm focus:border-[#0070f2] focus:bg-white focus:outline-none" />
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-[#1d2d3e] mb-1.5">${lang === 'ar' ? 'الاسم بالإنجليزي' : 'Name (EN)'}</label>
                                <input type="text" id="setup-name-en" required class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl px-4 py-3 text-[#1d2d3e] text-sm focus:border-[#0070f2] focus:bg-white focus:outline-none" />
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-[#1d2d3e] mb-1.5">${window.i18n.t('emailLabel')}</label>
                            <input type="email" id="setup-email" required placeholder="admin@dotra.com" class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl px-4 py-3 text-[#1d2d3e] text-sm focus:border-[#0070f2] focus:bg-white focus:outline-none font-mono" />
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-[#1d2d3e] mb-1.5">${window.i18n.t('passwordLabel')}</label>
                            <input type="password" id="setup-password" required minlength="8" placeholder="••••••••" class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl px-4 py-3 text-[#1d2d3e] text-sm focus:border-[#0070f2] focus:bg-white focus:outline-none font-mono" />
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-[#1d2d3e] mb-1.5">${lang === 'ar' ? 'رقم التعريف الشخصي (4 أرقام)' : 'PIN Code (4 digits)'}</label>
                            <input type="password" id="setup-pin" required maxlength="4" minlength="4" placeholder="••••" class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl px-4 py-3 text-[#1d2d3e] text-center text-xl tracking-widest font-mono font-bold focus:border-[#0070f2] focus:bg-white focus:outline-none" />
                        </div>
                        <button type="submit" class="w-full py-3.5 sap-btn-primary text-sm shadow-md flex items-center justify-center gap-2 mt-2">
                            <span>🏢</span>
                            <span>${lang === 'ar' ? 'إنشاء حساب المدير' : 'Create Manager Account'}</span>
                        </button>
                    </form>
                </div>
            </div>
        `;
    }

    async handleSetup(e) {
        e.preventDefault();
        const name_ar = document.getElementById('setup-name-ar').value;
        const name_en = document.getElementById('setup-name-en').value;
        const email = document.getElementById('setup-email').value;
        const password = document.getElementById('setup-password').value;
        const pin_code = document.getElementById('setup-pin').value;

        await window.DB.setupManager({ name_ar, name_en, email, password, pin_code });

        const res = await window.Auth.loginManager(email, password);
        if (res.success) {
            this.currentView = 'manager';
            this.renderApp();
            if (window.PushService) window.PushService.startPolling(5000);
        } else {
            alert(res.message);
        }
    }

    switchLoginTab(role) {
        this.loginRoleTab = role;
        this.renderLoginScreen();
    }

    async handleManagerLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const res = await window.Auth.loginManager(email, password);

        if (res.success) {
            if (res.user && res.user.role === 'ceo') {
                this.currentView = 'ceo';
            } else if (res.user && (res.user.role === 'manager' || res.user.role === 'admin')) {
                this.currentView = 'manager';
            } else {
                this.currentView = 'officer';
            }
            this.renderApp();
            if (window.PushService) window.PushService.startPolling(5000);
        } else {
            alert(res.message);
        }
    }

    async handleOfficerLogin(e) {
        e.preventDefault();
        const badge = document.getElementById('login-badge').value;
        const pin = document.getElementById('login-pin').value;
        const res = await window.Auth.loginOfficer(badge, pin);

        if (res.success) {
            this.currentView = 'officer';
            this.renderApp();
            if (window.PushService) window.PushService.startPolling(5000);
        } else {
            alert(res.message);
        }
    }

    // 🧹 Cache Buster: clears localStorage, SW caches, then reloads fresh from cloud
    async bustCache() {
        const lang = window.i18n ? window.i18n.getLang() : 'ar';
        const confirmed = confirm(
            lang === 'ar'
                ? 'هل تريد مسح الذاكرة المؤقتة وإعادة تحميل البيانات من السحابة؟\n⚠️ سيتم حذف البيانات المحلية غير المرفوعة.'
                : 'Clear local cache and reload all data fresh from cloud?\n⚠️ Any un-synced local data will be lost.'
        );
        if (!confirmed) return;

        // 1. Clear all gate_ localStorage keys
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('gate_')) keysToRemove.push(key);
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));

        // 2. Unregister all service workers and clear their caches
        try {
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (const reg of registrations) {
                    await reg.unregister();
                }
            }
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map(name => caches.delete(name)));
            }
        } catch (e) {
            // SW not available in this context — continue
        }

        // 3. Hard reload — bypass browser cache entirely
        window.location.reload(true);
    }

    // 🔔 Push Notification Toggle for Currently Logged-in User
    async toggleUserPush() {
        if (!window.PushService) {
            alert('Push notification service is loading or not supported on this browser.');
            return;
        }
        const isEnabled = localStorage.getItem('gate_push_enabled') === 'true';
        const lang = window.i18n ? window.i18n.getLang() : 'ar';
        const currentUser = window.Auth ? window.Auth.getCurrentUser() : null;
        const role = currentUser ? currentUser.role : (this.currentView === 'manager' ? 'manager' : 'officer');
        const userId = currentUser ? currentUser.id : null;

        if (!isEnabled) {
            const res = await window.PushService.requestPermissionAndSubscribe(role, userId);
            if (res.success) {
                this.showToast(
                    lang === 'ar' ? '🔔 تم تفعيل الإشعارات' : 'Push Enabled',
                    lang === 'ar' ? `تم تفعيل التنبيهات الفورية لحساب (${currentUser ? currentUser.name_ar : 'المستخدم'})` : `Push alerts active for ${currentUser ? currentUser.name_en : 'User'}`,
                    'success',
                    'shield'
                );
            } else {
                alert(lang === 'ar' ? `⚠️ تعذر تفعيل الإشعارات: ${res.message}` : `Could not enable push: ${res.message}`);
            }
        } else {
            await window.PushService.unsubscribe();
            this.showToast(
                lang === 'ar' ? '🔕 تم إيقاف الإشعارات' : 'Push Disabled',
                lang === 'ar' ? 'تم إيقاف الإشعارات الفورية لهذا الجهاز' : 'Push alerts disabled on this device',
                'warning',
                'bell'
            );
        }
        this.renderApp();
    }

    // 📱 Mobile Hamburger Navigation Menu Toggle
    toggleMobileMenu(forceState) {
        const menu = document.getElementById('mobile-nav-menu');
        if (!menu) return;
        if (forceState !== undefined) {
            if (forceState) menu.classList.remove('hidden');
            else menu.classList.add('hidden');
        } else {
            menu.classList.toggle('hidden');
        }
    }

    refreshUI() {
        this.renderApp();
    }

}

window.App = new AppController();
document.addEventListener('DOMContentLoaded', () => {
    window.App.init();
});
