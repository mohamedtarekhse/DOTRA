// Office Manager Dashboard Controller (DOTRA Enterprise SVG & Micro-Interactions Edition)
// وحدة التحكم ببوابة مدير المكتب - مجموعة دوترا (واجهة مؤسسية فائقة مع أيقونات SVG ومحاذاة متطورة)

class ManagerController {
    constructor() {
        this.activeFilter = 'all';
        this.searchQuery = '';
        this._quickPermitData = [];
    }

    handleQuickPermitEdit(idx) {
        const data = this._quickPermitData[idx];
        if (data) this.openQuickPermitModal(data);
    }

    handleQuickPermitConfirm(idx) {
        const data = this._quickPermitData[idx];
        if (data) this.finalizeQuickPermit(data);
    }

    handleUniversalSearch(query) {
        this.searchQuery = query || '';
        if (typeof document !== 'undefined') {
            const tableBody = document.getElementById('manager-table-body') || (document.querySelector ? document.querySelector('tbody') : null);
            if (tableBody) tableBody.innerHTML = this.renderTableRows(window.i18n.getLang());
            const mobileList = document.getElementById('manager-mobile-cards-list');
            if (mobileList) mobileList.innerHTML = this.renderMobileCards(window.i18n.getLang());
        }
    }

    clearUniversalSearch() {
        this.searchQuery = '';
        if (typeof document !== 'undefined') {
            const input = document.getElementById('manager-universal-search');
            if (input) input.value = '';
            const tableBody = document.getElementById('manager-table-body') || (document.querySelector ? document.querySelector('tbody') : null);
            if (tableBody) tableBody.innerHTML = this.renderTableRows(window.i18n.getLang());
            const mobileList = document.getElementById('manager-mobile-cards-list');
            if (mobileList) mobileList.innerHTML = this.renderMobileCards(window.i18n.getLang());
        }
    }

    renderTableHeader(lang) {
        return `
            <tr>
                <th class="py-3.5 px-4">${window.i18n.t('plateNumber')}</th>
                <th class="py-3.5 px-4">${lang === 'ar' ? 'الوجهة وبيانات التصريح' : 'Destination & Pass Details'}</th>
                <th class="py-3.5 px-4">${lang === 'ar' ? 'آخر بوابة دخول' : 'Last Entry Gate'}</th>
                <th class="py-3.5 px-4">${lang === 'ar' ? 'توقيت وتاريخ الدخول والمدة' : 'Entry Time & Duration'}</th>
                <th class="py-3.5 px-4">${lang === 'ar' ? 'حالة التواجد والتصريح' : 'Current Status'}</th>
                <th class="py-3.5 px-4">${window.i18n.t('driverName')} / ${window.i18n.t('company')}</th>
                <th class="py-3.5 px-4 text-center">${window.i18n.t('actions')}</th>
            </tr>
        `;
    }

    renderDashboard() {
        const container = document.getElementById('main-content');
        if (!container) return;

        const lang = window.i18n.getLang();
        const vehicles = window.DB.getVehicles();
        const permits = window.DB.getPermits();
        const logs = window.DB.getLogs();
        const settings = window.DB.getSettings();

        const insideLogs = logs.filter(l => l.action_type === 'entry' && !l.exit_timestamp);
        const insideCount = insideLogs.length;

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEntries = logs.filter(l => l.action_type === 'entry' && new Date(l.timestamp) >= todayStart).length;

        const exitedLogs = logs.filter(l => l.action_type === 'exit' || (l.action_type === 'entry' && l.exit_timestamp));
        const exitedToday = exitedLogs.filter(l => new Date(l.exit_timestamp || l.timestamp) >= todayStart).length;

        const overstayLogs = insideLogs.filter(l => {
            const entryTime = window.DB.parseTimestamp(l.timestamp);
            const durationHrs = (Date.now() - entryTime.getTime()) / 3600000;
            return durationHrs >= (settings.overstay_hours_threshold || 3);
        });

        const activePermits = permits.filter(p => p.status === 'active').length;
        const icon = (name, cls = 'w-4 h-4') => window.Icons ? window.Icons.get(name, cls) : '';

        // SMART IN-PLACE UPDATE: If table & dashboard layout already exists in DOM, only update table rows, mobile cards, and KPI numbers!
        const existingTableBody = document.getElementById('manager-table-body');
        const existingMobileList = document.getElementById('manager-mobile-cards-list');
        const existingInsideKpi = document.getElementById('kpi-inside-count');

        if (existingTableBody && existingMobileList && existingInsideKpi) {
            // Update KPI metric numbers in-place
            existingInsideKpi.textContent = insideCount;
            const elExited = document.getElementById('kpi-exited-count');
            if (elExited) elExited.textContent = exitedToday;
            const elOverstay = document.getElementById('kpi-overstay-count');
            if (elOverstay) elOverstay.textContent = overstayLogs.length;
            const elPermits = document.getElementById('kpi-permits-count');
            if (elPermits) elPermits.textContent = activePermits;

            // Update Tab Badge Counts in-place
            const bPermits = document.getElementById('tab-count-permits');
            if (bPermits) bPermits.textContent = `(${permits.length})`;
            const bInside = document.getElementById('tab-count-inside');
            if (bInside) bInside.textContent = `(${insideCount})`;
            const bExited = document.getElementById('tab-count-exited');
            if (bExited) bExited.textContent = `(${exitedLogs.length})`;
            const bOverstay = document.getElementById('tab-count-overstay');
            if (bOverstay) bOverstay.textContent = `(${overstayLogs.length})`;

            // Update Pending Inspection Requests Button & Badge in-place
            const pendingRequests = window.DB.getPendingInspectionRequests();
            const btnRequests = document.getElementById('btn-pending-inspection-requests');
            if (btnRequests) {
                btnRequests.className = `px-3.5 py-2.5 rounded-xl border text-sm font-bold flex items-center gap-1.5 shadow-sm transition-all ${pendingRequests.length > 0 ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-400 animate-pulse font-black' : 'sap-btn-secondary'}`;
                btnRequests.innerHTML = `
                    <span>🚨</span>
                    <span>${lang === 'ar' ? 'طلبات الاستئذان' : 'Requests'}</span>
                    ${pendingRequests.length > 0 ? `<span class="px-2 py-0.5 bg-slate-950 text-amber-300 rounded-full text-xs font-mono font-black">${pendingRequests.length}</span>` : ''}
                `;
            }

            // Update Tab Button Active Classes
            const tabButtons = container.querySelectorAll ? container.querySelectorAll('[data-manager-filter]') : (typeof document !== 'undefined' && document.querySelectorAll ? document.querySelectorAll('[data-manager-filter]') : []);
            if (tabButtons && tabButtons.forEach) {
                tabButtons.forEach(btn => {
                    const f = btn.getAttribute ? btn.getAttribute('data-manager-filter') : null;
                    if (f === this.activeFilter) {
                        btn.className = `px-3 py-1.5 rounded-lg font-bold transition-all ${f === 'inside' ? 'bg-[#107e3e] text-white shadow-sm' : (f === 'overstay' ? 'bg-[#bb0000] text-white shadow-sm' : 'bg-[#0070f2] text-white shadow-sm')}`;
                    } else {
                        btn.className = 'px-3 py-1.5 rounded-lg font-bold transition-all text-[#556b82] hover:text-[#1d2d3e]';
                    }
                });
            }


            // Update Table Header
            const thead = document.getElementById('manager-table-head');
            if (thead) thead.innerHTML = this.renderTableHeader(lang);

            // Update Table Body in-place (without rebuilding the whole page or stealing focus!)
            existingTableBody.innerHTML = this.renderTableRows(lang);
            existingMobileList.innerHTML = this.renderMobileCards(lang);
            return;
        }

        container.innerHTML = `
            <!-- Top Dashboard Bar -->
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                <div class="${lang === 'ar' ? 'text-right' : 'text-left'}">
                    <h1 class="text-2xl font-black text-[#002b66] flex items-center gap-2.5">
                        <span class="p-2 rounded-xl bg-[#ebf3fb] text-[#0070f2] shadow-sm border border-[#b3d5fa]">
                            ${icon('building', 'w-6 h-6')}
                        </span>
                        <span>${lang === 'ar' ? 'لوحة تحكم مدير العمليات وتصاريح البوابات' : 'Operations & Gate Permits Dashboard'}</span>
                    </h1>
                    <p class="text-xs text-[#556b82] mt-1 font-medium">
                        ${lang === 'ar' ? 'نظام تصاريح بوابات مصانع مجموعة دوترا - إرسال فوري لواتساب وطباعة معتمدة A4' : 'DOTRA Gate System - WhatsApp Dispatch & Official A4 Pass Printing'}
                    </p>
                </div>
                <div class="flex items-center gap-2 flex-wrap justify-end">
                    <!-- Pending Officer Inspection & Hold Requests Button -->
                    ${(() => {
                        const inspCount = window.DB ? window.DB.getPendingInspectionRequests().length : 0;
                        const holdCount = window.DB ? window.DB.getPendingPermitHoldRequests().length : 0;
                        const totalReqs = inspCount + holdCount;
                        return `
                            <button type="button" id="btn-pending-inspection-requests" onclick="Manager.openPendingRequestsModal()" class="px-3.5 py-2.5 rounded-xl border text-sm font-bold flex items-center gap-1.5 shadow-sm transition-all ${totalReqs > 0 ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-400 animate-pulse font-black' : 'sap-btn-secondary'}" title="طلبات الاستئذان والتفتيش وتعليق التصاريح من ضباط البوابات">
                                <span>🚨</span>
                                <span>${lang === 'ar' ? 'طلبات البوابات' : 'Gate Requests'}</span>
                                ${totalReqs > 0 ? `<span class="px-2 py-0.5 bg-slate-950 text-amber-300 rounded-full text-xs font-mono font-black">${totalReqs}</span>` : ''}
                            </button>
                        `;
                    })()}
                    <!-- Quick Actions Dropdown Menu -->
                    <div class="relative inline-block text-right">
                        <button type="button" 
                            id="btn-quick-actions-menu" 
                            onclick="Manager.toggleQuickActionsMenu(event)" 
                            class="sap-btn-primary px-4 py-2.5 flex items-center gap-2 text-sm font-black shadow-md active:scale-95 transition-all" 
                            title="${lang === 'ar' ? 'أوامر سريعة: كشف الوصول، تصدير الإكسل، وإصدار تصريح' : 'Quick Actions'}">
                            ${icon('bolt', 'w-4 h-4 text-amber-300')}
                            <span>${lang === 'ar' ? 'أوامر سريعة' : 'Quick Actions'}</span>
                            <svg class="w-4 h-4 text-white/80 transition-transform duration-200" id="quick-actions-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </button>

                        <!-- Dropdown Content -->
                        <div id="quick-actions-dropdown" class="hidden absolute ${lang === 'ar' ? 'left-0' : 'right-0'} mt-2 w-64 bg-white rounded-2xl shadow-2xl border-2 border-[#b0cfee] py-2 z-50 animate-scaleUp">
                            
                            <!-- 1. Issue Quick Permit -->
                            <button type="button" 
                                onclick="Manager.closeQuickActionsMenu(); Manager.openQuickPermitModal();" 
                                class="w-full px-4 py-2.5 ${lang === 'ar' ? 'text-right' : 'text-left'} hover:bg-[#ebf3fb] flex items-center gap-3 transition-colors group">
                                <div class="w-8 h-8 rounded-xl bg-amber-100 group-hover:bg-amber-200 text-amber-900 flex items-center justify-center font-bold text-sm flex-shrink-0">
                                    ⚡
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="font-black text-xs text-[#002b66]">${lang === 'ar' ? 'إصدار تصريح سريع' : 'Issue Quick Pass'}</div>
                                    <div class="text-[10px] text-[#556b82] font-semibold">${lang === 'ar' ? 'توليد كارت فوري مع كود PIN' : 'Instant pass generation'}</div>
                                </div>
                            </button>

                            <div class="border-t border-[#edf2f7] my-1"></div>

                            <!-- 2. Pre-Arrival Manifest (Excel) -->
                            <button type="button" 
                                onclick="Manager.closeQuickActionsMenu(); Manager.openImportCsvModal();" 
                                class="w-full px-4 py-2.5 ${lang === 'ar' ? 'text-right' : 'text-left'} hover:bg-[#ebf3fb] flex items-center gap-3 transition-colors group">
                                <div class="w-8 h-8 rounded-xl bg-emerald-100 group-hover:bg-emerald-200 text-[#107e3e] flex items-center justify-center font-bold text-sm flex-shrink-0">
                                    📋
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="font-black text-xs text-[#002b66]">${lang === 'ar' ? 'كشف الوصول (Excel)' : 'Pre-Arrival Manifest'}</div>
                                    <div class="text-[10px] text-[#556b82] font-semibold">${lang === 'ar' ? 'استيراد وإدارة الشاحنات المتوقعة' : 'Import expected trucks'}</div>
                                </div>
                            </button>

                            <div class="border-t border-[#edf2f7] my-1"></div>

                            <!-- 3. Export Excel Sheet -->
                            <button type="button" 
                                onclick="Manager.closeQuickActionsMenu(); Manager.exportExcel();" 
                                class="w-full px-4 py-2.5 ${lang === 'ar' ? 'text-right' : 'text-left'} hover:bg-[#ebf3fb] flex items-center gap-3 transition-colors group">
                                <div class="w-8 h-8 rounded-xl bg-blue-100 group-hover:bg-blue-200 text-[#0070f2] flex items-center justify-center font-bold text-sm flex-shrink-0">
                                    📊
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="font-black text-xs text-[#002b66]">${lang === 'ar' ? 'تصدير شيت الإكسيل' : 'Export Excel Sheet'}</div>
                                    <div class="text-[10px] text-[#556b82] font-semibold">${lang === 'ar' ? 'تنزيل سجل الحركات بصيغة Excel' : 'Download logs as Excel'}</div>
                                </div>
                            </button>

                        </div>
                    </div>

                    <!-- Settings & Roster Button -->
                    <button type="button" onclick="Manager.openSettingsModal()" class="sap-btn-secondary px-3.5 py-2.5 flex items-center gap-1.5 text-sm shadow-sm" title="${lang === 'ar' ? 'إعدادات النظام، وتوزيع المناوبات والبوابات' : 'Settings & Roster'}">
                        ${icon('settings', 'w-4 h-4 text-[#0070f2]')}
                        <span>${lang === 'ar' ? 'الإعدادات والمناوبات' : 'Settings & Roster'}</span>
                    </button>
                </div>
            </div>

            <!-- SAP Enterprise KPI Metric Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                <div class="sap-card p-5 border-t-4 border-t-[#107e3e] flex items-center justify-between">
                    <div class="${lang === 'ar' ? 'text-right' : 'text-left'}">
                        <p class="text-xs font-bold text-[#556b82] uppercase tracking-wider">${window.i18n.t('metricInside')}</p>
                        <h3 id="kpi-inside-count" class="text-3xl font-black text-[#1d2d3e] mt-1 font-mono">${insideCount}</h3>
                        <p class="text-[11px] text-[#107e3e] mt-1 font-bold flex items-center gap-1.5">
                            <span class="inline-block w-2 h-2 rounded-full bg-[#107e3e] animate-pulse"></span>
                            <span>${lang === 'ar' ? 'متواجدون داخل المصنع' : 'Active on premises'}</span>
                        </p>
                    </div>
                    <div class="w-12 h-12 rounded-2xl bg-[#e5f6eb] text-[#107e3e] flex items-center justify-center border border-[#b4e3c4] shadow-sm">
                        ${icon('truck', 'w-6 h-6')}
                    </div>
                </div>

                <div class="sap-card p-5 border-t-4 border-t-[#0070f2] flex items-center justify-between">
                    <div class="${lang === 'ar' ? 'text-right' : 'text-left'}">
                        <p class="text-xs font-bold text-[#556b82] uppercase tracking-wider">${lang === 'ar' ? 'غادروا المصنع اليوم' : 'Exited Today'}</p>
                        <h3 id="kpi-exited-count" class="text-3xl font-black text-[#0070f2] mt-1 font-mono">${exitedToday}</h3>
                        <p class="text-[11px] text-[#556b82] mt-1 font-bold">
                            ${lang === 'ar' ? `إجمالي المغادرين: ${exitedLogs.length}` : `Total Exits: ${exitedLogs.length}`}
                        </p>
                    </div>
                    <div class="w-12 h-12 rounded-2xl bg-[#ebf3fb] text-[#0070f2] flex items-center justify-center border border-[#b3d5fa] shadow-sm">
                        ${icon('logout', 'w-6 h-6')}
                    </div>
                </div>

                <div class="sap-card p-5 border-t-4 border-t-[#bb0000] flex items-center justify-between ${overstayLogs.length > 0 ? 'ring-2 ring-red-300' : ''}">
                    <div class="${lang === 'ar' ? 'text-right' : 'text-left'}">
                        <p class="text-xs font-bold text-[#556b82] uppercase tracking-wider">${window.i18n.t('metricOverstay')}</p>
                        <h3 id="kpi-overstay-count" class="text-3xl font-black text-[#bb0000] mt-1 font-mono">${overstayLogs.length}</h3>
                        <p class="text-[11px] text-[#bb0000] mt-1 font-bold">
                            ${overstayLogs.length > 0 ? (lang === 'ar' ? `تجاوزوا مدة البقاء (>${settings.overstay_hours_threshold || 3} س)` : 'Overstayed') : (lang === 'ar' ? 'لا توجد تجاوزات' : 'Zero violations')}
                        </p>
                    </div>
                    <div class="w-12 h-12 rounded-2xl bg-[#ffebeb] text-[#bb0000] flex items-center justify-center border border-[#f6b3b3] shadow-sm">
                        ${icon('alert', 'w-6 h-6')}
                    </div>
                </div>

                <div class="sap-card p-5 border-t-4 border-t-[#b85500] flex items-center justify-between">
                    <div class="${lang === 'ar' ? 'text-right' : 'text-left'}">
                        <p class="text-xs font-bold text-[#556b82] uppercase tracking-wider">${window.i18n.t('metricPending')}</p>
                        <h3 id="kpi-permits-count" class="text-3xl font-black text-[#1d2d3e] mt-1 font-mono">${activePermits}</h3>
                        <p class="text-[11px] text-[#b85500] mt-1 font-bold">
                            ${lang === 'ar' ? 'تصاريح فعالة بانتظار الوصول' : 'Active valid permits'}
                        </p>
                    </div>
                    <div class="w-12 h-12 rounded-2xl bg-[#fff1e5] text-[#b85500] flex items-center justify-center border border-[#ffd8b3] shadow-sm">
                        ${icon('shield', 'w-6 h-6')}
                    </div>
                </div>
            </div>

            <!-- SAP Live Vehicle Activity & Location Tracking Table -->
            <div class="sap-panel overflow-hidden shadow-md">
                <div class="p-4 bg-[#f8fafc] border-b border-[#d7e2ee] flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
                    <div class="flex items-center gap-2 flex-shrink-0">
                        <h2 class="text-base font-bold text-[#002b66] flex items-center gap-2">
                            ${icon('activity', 'w-5 h-5 text-[#0070f2]')}
                            <span>${lang === 'ar' ? 'سجل وتتبع حركة ومواقع المركبات' : 'Vehicle Stream & Location Tracker'}</span>
                        </h2>
                        <span class="px-2.5 py-0.5 bg-[#e5f6eb] text-[#107e3e] text-[11px] rounded-full font-mono font-bold border border-[#b4e3c4]">
                            LIVE
                        </span>
                    </div>

                    <!-- Universal Multi-Criteria Search Input (Plate, Officer, Gate, Time, Destination) -->
                    <div class="relative flex-1 max-w-lg">
                        <span class="absolute ${lang === 'ar' ? 'right-3' : 'left-3'} top-2.5 text-[#556b82]">
                            ${icon('search', 'w-4 h-4 text-[#0070f2]')}
                        </span>
                        <input 
                            type="text" 
                            id="manager-universal-search"
                            value="${this.searchQuery || ''}"
                            placeholder="${lang === 'ar' ? '🔍 ابحث باللوحة، اسم الضابط، البوابة، التوقيت، أو الوجهة لمعرفة آخر موقع...' : 'Search plate, officer, gate, time, or location...'}" 
                            class="w-full bg-white border border-[#b0cfee] rounded-xl ${lang === 'ar' ? 'pr-9 pl-8' : 'pl-9 pr-8'} py-2 text-xs font-bold text-[#1d2d3e] focus:border-[#0070f2] focus:outline-none shadow-sm transition-all"
                            oninput="Manager.handleUniversalSearch(this.value)"
                        />
                        ${this.searchQuery ? `
                            <button type="button" onclick="Manager.clearUniversalSearch()" class="absolute ${lang === 'ar' ? 'left-2.5' : 'right-2.5'} top-2 text-[#556b82] hover:text-red-600 text-xs font-bold">
                                ✕
                            </button>
                        ` : ''}
                    </div>

                    <!-- Filter Tabs (Vehicles Flow, Inside, Exited, Overstay) -->
                    <div class="flex items-center gap-1 bg-[#ffffff] p-1 rounded-xl border border-[#d7e2ee] text-xs flex-shrink-0 flex-wrap">
                        <button type="button" data-manager-filter="all" onclick="Manager.setFilter('all')" class="px-3.5 py-1.5 rounded-lg font-bold transition-all ${this.activeFilter === 'all' ? 'bg-[#0070f2] text-white shadow-sm' : 'text-[#556b82] hover:text-[#1d2d3e]'}">
                            🚛 ${lang === 'ar' ? 'حركة المركبات والتصاريح' : 'All Vehicles & Passes'}
                        </button>
                        <button type="button" data-manager-filter="inside" onclick="Manager.setFilter('inside')" class="px-3 py-1.5 rounded-lg font-bold transition-all ${this.activeFilter === 'inside' ? 'bg-[#107e3e] text-white shadow-sm' : 'text-[#556b82] hover:text-[#1d2d3e]'}">
                            🟢 ${lang === 'ar' ? 'بالداخل' : 'Inside'} <span id="tab-count-inside">(${insideCount})</span>
                        </button>
                        <button type="button" data-manager-filter="exited" onclick="Manager.setFilter('exited')" class="px-3 py-1.5 rounded-lg font-bold transition-all ${this.activeFilter === 'exited' ? 'bg-[#0070f2] text-white shadow-sm' : 'text-[#556b82] hover:text-[#1d2d3e]'}">
                            📤 ${lang === 'ar' ? 'المغادرين' : 'Exited'} <span id="tab-count-exited">(${exitedLogs.length})</span>
                        </button>
                        <button type="button" data-manager-filter="overstay" onclick="Manager.setFilter('overstay')" class="px-3 py-1.5 rounded-lg font-bold transition-all ${this.activeFilter === 'overstay' ? 'bg-[#bb0000] text-white shadow-sm' : 'text-[#556b82] hover:text-[#1d2d3e]'}">
                            ⚠️ ${lang === 'ar' ? 'متجاوزون' : 'Overstay'} <span id="tab-count-overstay">(${overstayLogs.length})</span>
                        </button>
                    </div>
                </div>

                <!-- Desktop Table View (Hidden on Small Phones) -->
                <div class="hidden md:block overflow-x-auto bg-white">
                    <table class="w-full text-sm ${lang === 'ar' ? 'text-right' : 'text-left'}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                        <thead id="manager-table-head" class="bg-[#f5f8fc] text-[#556b82] text-xs uppercase tracking-wider font-bold border-b border-[#d7e2ee]">
                            ${this.renderTableHeader(lang)}
                        </thead>
                        <tbody id="manager-table-body" class="divide-y divide-[#e7eff7] font-medium">
                            ${this.renderTableRows(lang)}
                        </tbody>
                    </table>
                </div>

                <!-- Mobile Responsive Cards View (Optimized for Mobile Screens) -->
                <div class="block md:hidden p-3 bg-[#f8fafc] space-y-3" id="manager-mobile-cards-list">
                    ${this.renderMobileCards(lang)}
                </div>
            </div>
        `;
    }

    renderMobileCards(lang) {
        const vehicles = window.DB.getVehicles();
        const permits = window.DB.getPermits();
        const logs = window.DB.getLogs();
        const users = window.DB.getUsers();
        const settings = window.DB.getSettings();
        const icon = (name, cls = 'w-3.5 h-3.5') => window.Icons ? window.Icons.get(name, cls) : '';

        const norm = (str) => window.ArabicPlate && window.ArabicPlate.normalizeSearchText ? window.ArabicPlate.normalizeSearchText(str) : String(str || '').toLowerCase().trim();
        const normPlate = (str) => window.ArabicPlate && window.ArabicPlate.normalizePlateCompact ? window.ArabicPlate.normalizePlateCompact(str) : norm(str).replace(/[\s\-_/.,]+/g, '');
        const qNorm = norm(this.searchQuery);
        const qPlate = normPlate(this.searchQuery);

        let filteredVehicles = vehicles.filter(vehicle => {
            const insideLog = window.DB.isVehicleInside(vehicle.id);
            const vehicleLogs = logs.filter(l => l.vehicle_id === vehicle.id);
            const hasExitedLog = vehicleLogs.some(l => l.action_type === 'exit' || l.exit_timestamp);

            if (this.activeFilter === 'inside' && !insideLog) return false;
            if (this.activeFilter === 'exited' && !hasExitedLog) return false;
            if (this.activeFilter === 'overstay') {
                if (!insideLog) return false;
                const hrs = (Date.now() - new Date(insideLog.timestamp).getTime()) / 3600000;
                if (hrs < (settings.overstay_hours_threshold || 3)) return false;
            }

            if (!qNorm) return true;

            const permit = window.DB.findPermitByCodeOrVehicle(null, vehicle.id);
            const lastLog = vehicleLogs.length > 0 ? vehicleLogs[vehicleLogs.length - 1] : null;
            const lastOfficer = lastLog ? users.find(u => u.id === lastLog.officer_id) : null;
            
            const pAr = norm(vehicle.plate_ar);
            const pEn = norm(vehicle.plate_en);
            const pArCompact = normPlate(vehicle.plate_ar);
            const pEnCompact = normPlate(vehicle.plate_en);

            const matchPlate = pAr.includes(qNorm) || pEn.includes(qNorm) || (qPlate && (pArCompact.includes(qPlate) || pEnCompact.includes(qPlate)));
            const matchDriver = norm(`${vehicle.driver_name_ar || ''} ${vehicle.driver_name_en || ''}`).includes(qNorm);
            const matchPhone = norm(vehicle.driver_phone).includes(qNorm);
            const matchCompany = norm(`${vehicle.company_ar || ''} ${vehicle.company_en || ''}`).includes(qNorm);
            const matchDestination = permit ? norm(`${permit.destination_ar} ${permit.destination_en} ${permit.cargo_details || ''} ${permit.invoice_no || ''}`).includes(qNorm) : false;
            const matchPermitCode = permit ? (norm(permit.permit_code).includes(qNorm) || norm(permit.pin_code).includes(qNorm)) : false;
            const matchGate = vehicleLogs.some(l => norm(l.gate_name).includes(qNorm) || norm(l.exit_gate_name).includes(qNorm));
            const matchOfficer = lastOfficer ? norm(`${lastOfficer.name_ar} ${lastOfficer.name_en}`).includes(qNorm) : false;

            return matchPlate || matchDriver || matchPhone || matchCompany || matchDestination || matchPermitCode || matchGate || matchOfficer;
        });

        if (filteredVehicles.length === 0) {
            return `
                <div class="sap-card p-6 text-center text-[#556b82] bg-white border border-[#d7e2ee] shadow-sm">
                    <div class="w-14 h-14 rounded-2xl bg-[#ebf3fb] text-[#0070f2] flex items-center justify-center mx-auto mb-3 border border-[#b3d5fa] shadow-sm">
                        ${icon('truck', 'w-7 h-7')}
                    </div>
                    <p class="font-black text-sm text-[#1d2d3e]">
                        ${this.searchQuery ? (lang === 'ar' ? `لم يتم العثور على نتائج تطابق: "${this.searchQuery}"` : `No matching results for "${this.searchQuery}"`) : (lang === 'ar' ? 'قاعدة البيانات جاهزة - لا توجد حركات مسجلة' : 'Database Ready - No entries recorded')}
                    </p>
                    <p class="text-xs text-[#556b82] mt-1 font-medium">
                        ${this.searchQuery ? (lang === 'ar' ? 'تأكد من كتابة رقم اللوحة أو اسم الضابط بشكل صحيح' : 'Check search criteria') : (lang === 'ar' ? 'اضغط أدناه لإصدار تصريح دخول فوري' : 'Tap below to issue instant pass')}
                    </p>
                    ${!this.searchQuery ? `
                        <button type="button" onclick="Manager.openQuickPermitModal()" class="mt-4 w-full py-2.5 sap-btn-primary text-xs font-bold shadow-md flex items-center justify-center gap-2">
                            ${icon('bolt', 'w-4 h-4 text-amber-300')}
                            <span>${lang === 'ar' ? 'إصدار أول تصريح الآن' : 'Issue First Pass Now'}</span>
                        </button>
                    ` : ''}
                </div>
            `;
        }

        return filteredVehicles.map(vehicle => {
            const insideLog = window.DB.isVehicleInside(vehicle.id);
            const permit = window.DB.findPermitByCodeOrVehicle(null, vehicle.id);
            const vehicleLogs = logs.filter(l => l.vehicle_id === vehicle.id);
            const sortedLogs = vehicleLogs.slice().sort((a, b) => window.DB.parseTimestamp(b.timestamp).getTime() - window.DB.parseTimestamp(a.timestamp).getTime() || (b.id || 0) - (a.id || 0));
            const lastEntryLog = sortedLogs.find(l => l.action_type === 'entry') || null;
            const lastExitLog = sortedLogs.find(l => l.action_type === 'exit' || l.exit_timestamp) || null;
            const isEnteredOnThisPermit = permit ? (
                permit.status === 'used' ||
                logs.some(l => l.permit_id === permit.id) ||
                (!!insideLog && (insideLog.permit_id === permit.id || (permit.created_at && window.DB.parseTimestamp(insideLog.timestamp).getTime() >= window.DB.parseTimestamp(permit.created_at).getTime() - 60000)))
            ) : false;
            const hasVehicleEntered = isEnteredOnThisPermit;
            
            const entryGateName = lastEntryLog ? (lastEntryLog.gate_name || 'البوابة الرئيسية') : '--';
            const entryOfficer = lastEntryLog ? users.find(u => u.id === lastEntryLog.officer_id) : null;
            const entryOfficerName = entryOfficer ? (lang === 'ar' ? entryOfficer.name_ar : entryOfficer.name_en) : (lastEntryLog ? `ضابط #${lastEntryLog.officer_id}` : '--');
            
            let statusBadge = '';
            let timeInfoHtml = '';

            if (vehicle.status === 'blacklist') {
                statusBadge = `<span class="px-2 py-0.5 rounded-full text-xs badge-blacklisted flex items-center gap-1 font-bold">${icon('ban', 'w-3 h-3 text-red-300')} <span>${window.i18n.t('statusBanned')}</span></span>`;
            } else if (insideLog) {
                const entryTime = window.DB.parseTimestamp(insideLog.timestamp);
                const entryTimeStr = entryTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const diffMinutes = Math.max(0, Math.round((Date.now() - entryTime.getTime()) / 60000));
                statusBadge = `<span class="px-2.5 py-0.5 rounded-full text-xs badge-inside flex items-center gap-1 font-bold"><span class="w-1.5 h-1.5 rounded-full bg-[#107e3e] animate-pulse"></span> <span>${window.i18n.t('statusInside')}</span></span>`;
                timeInfoHtml = `<div class="text-xs text-[#107e3e] font-bold">📥 دخلت: ${entryTimeStr} (${diffMinutes} دقيقة بالداخل)</div>`;
            } else if (permit && permit.status === 'hold') {
                statusBadge = `<span class="px-2.5 py-0.5 rounded-full text-xs bg-amber-100 text-amber-900 font-bold border border-amber-300 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> <span>⏸️ تصريح معلق</span></span>`;
            } else if (permit && permit.status === 'revoked') {
                statusBadge = `<span class="px-2.5 py-0.5 rounded-full text-xs bg-rose-100 text-rose-900 font-bold border border-rose-300 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span> <span>⛔ تصريح ملغي</span></span>`;
            } else if (permit && permit.status === 'active' && !hasVehicleEntered) {
                statusBadge = `<span class="px-2.5 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> <span>🟢 تصريح ساري بانتظار الدخول</span></span>`;
            } else {
                statusBadge = `<span class="px-2.5 py-0.5 rounded-full text-xs badge-exited flex items-center gap-1 font-bold"><span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span> <span>${lang === 'ar' ? 'غادرت المصنع' : 'Exited'}</span></span>`;
                if (lastExitLog) {
                    const exitTime = window.DB.parseTimestamp(lastExitLog.exit_timestamp || lastExitLog.timestamp);
                    const exitTimeStr = exitTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    timeInfoHtml = `<div class="text-xs text-[#0070f2] font-bold">📤 خرجت: ${exitTimeStr} (المدة: ${lastExitLog.duration_minutes || 0} د)</div>`;
                }
            }

            const driverName = (lang === 'ar' ? vehicle.driver_name_ar : vehicle.driver_name_en) || 'سائق مصرح';
            const companyName = (lang === 'ar' ? vehicle.company_ar : vehicle.company_en) || 'عام';
            const destination = permit ? (lang === 'ar' ? (permit.destination_ar || permit.destination_en) : (permit.destination_en || permit.destination_ar)) : (lastEntryLog?.remarks || 'المستودع الرئيسي');

            let cardPermitActions = '';
            if (permit) {
                if (!hasVehicleEntered) {
                    if (permit.status === 'active') {
                        cardPermitActions = `
                            <button type="button" onclick="Manager.openHoldPermitModal(${permit.id})" class="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg border border-amber-300 text-[11px] font-bold inline-flex items-center gap-1">
                                <span>⏸️ تعليق</span>
                            </button>
                        `;
                    } else if (permit.status === 'hold') {
                        cardPermitActions = `
                            <button type="button" onclick="Manager.handleActivatePermit(${permit.id})" class="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-lg border border-emerald-300 text-[11px] font-bold inline-flex items-center gap-1">
                                <span>▶️ تفعيل</span>
                            </button>
                        `;
                    } else if (permit.status === 'revoked') {
                        cardPermitActions = `
                            <button type="button" onclick="Manager.handleActivatePermit(${permit.id})" class="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-lg border border-emerald-300 text-[11px] font-bold inline-flex items-center gap-1">
                                <span>▶️ تفعيل</span>
                            </button>
                        `;
                    }
                } else {
                    if (permit.status === 'active') {
                        cardPermitActions = `
                            <button type="button" onclick="Manager.openHoldPermitModal(${permit.id})" class="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg border border-amber-300 text-[11px] font-bold inline-flex items-center gap-1">
                                <span>⏸️ تعليق</span>
                            </button>
                            <span class="text-[10px] text-[#556b82] font-semibold bg-[#f0f4f8] px-2 py-0.5 rounded border border-[#d7e2ee]">🔒 حركة مسجلة</span>
                        `;
                    } else if (permit.status === 'hold') {
                        cardPermitActions = `
                            <button type="button" onclick="Manager.handleActivatePermit(${permit.id})" class="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-lg border border-emerald-300 text-[11px] font-bold inline-flex items-center gap-1">
                                <span>▶️ تفعيل</span>
                            </button>
                            <span class="text-[10px] text-[#556b82] font-semibold bg-[#f0f4f8] px-2 py-0.5 rounded border border-[#d7e2ee]">🔒 حركة مسجلة</span>
                        `;
                    }
                }
            }

            return `
                <div class="sap-card p-4 bg-white border border-[#b0cfee] shadow-sm animate-fadeIn text-right" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                    <div class="flex items-center justify-between mb-2.5 border-b border-[#f0f4f8] pb-2">
                        <div>
                            ${statusBadge}
                        </div>
                        <div class="flex items-center gap-1">
                            ${permit ? `
                                <button type="button" onclick="Manager.showPassModal(${permit.id})" class="px-3 py-1 bg-[#ebf3fb] hover:bg-[#d5e7fa] text-[#0070f2] rounded-lg border border-[#b3d5fa] text-xs font-bold flex items-center gap-1 shadow-sm">
                                    ${icon('qrcode', 'w-3.5 h-3.5')}
                                    <span>كارت التصريح</span>
                                </button>
                            ` : `
                                <button type="button" onclick="Manager.openQuickPermitModal(${vehicle.id})" class="px-3 py-1 bg-[#e5f6eb] hover:bg-[#cdeed7] text-[#107e3e] rounded-lg border border-[#b4e3c4] text-xs font-bold flex items-center gap-1 shadow-sm">
                                    ${icon('bolt', 'w-3.5 h-3.5')}
                                    <span>تصريح</span>
                                </button>
                            `}
                            <button type="button" onclick="Manager.toggleVehicleNotify(${vehicle.id})" id="bell-${vehicle.id}" class="w-8 h-8 rounded-lg flex items-center justify-center transition-all ${this.isWatchingVehicle(vehicle.id) ? 'bg-amber-100 text-amber-600 border border-amber-300' : 'bg-[#f0f4f8] text-[#556b82] border border-[#d7e2ee] hover:bg-[#e2edf8]'}" title="${lang === 'ar' ? 'إشعار عند دخول/خروج هذه المركبة' : 'Notify on entry/exit'}">
                                <span class="text-sm">${this.isWatchingVehicle(vehicle.id) ? '🔔' : '🔕'}</span>
                            </button>
                        </div>
                    </div>

                    <div class="flex justify-center mb-3">
                        ${window.ArabicPlate.renderEgyptianPlate(vehicle.plate_ar, 'compact', vehicle.vehicle_type)}
                    </div>

                    <div class="bg-[#f8fafc] rounded-xl p-2.5 border border-[#e7eff7] text-xs space-y-1.5 mb-2">
                        <div class="flex justify-between items-center">
                            <span class="text-[#556b82] font-bold">السائق:</span>
                            <span class="font-bold text-[#1d2d3e]">${driverName} (${companyName})</span>
                        </div>
                        ${vehicle.driver_phone ? `
                            <div class="flex justify-between items-center">
                                <span class="text-[#556b82] font-bold">الهاتف:</span>
                                <a href="https://wa.me/2${vehicle.driver_phone.replace(/\D/g, '')}" target="_blank" class="font-mono font-bold text-[#107e3e] flex items-center gap-1">
                                    ${icon('whatsapp', 'w-3 h-3 text-[#107e3e]')}
                                    <span>${vehicle.driver_phone}</span>
                                </a>
                            </div>
                        ` : ''}
                        <div class="flex justify-between items-center">
                            <span class="text-[#556b82] font-bold">📍 الوجهة:</span>
                            <span class="font-bold text-[#002b66]">📍 ${destination}</span>
                        </div>
                        ${permit ? `
                            <div class="flex justify-between items-center bg-white p-1.5 rounded-lg border border-[#e2edf8]">
                                <span class="text-[#556b82] font-bold">كود وPIN التصريح:</span>
                                <div class="flex items-center gap-1">
                                    <span class="font-mono font-black text-[#0070f2]">${permit.permit_code}</span>
                                    <span class="font-mono font-bold bg-[#001940] text-amber-300 px-1.5 py-0.5 rounded text-[10px]">PIN: ${permit.pin_code}</span>
                                </div>
                            </div>
                        ` : ''}
                        ${permit?.hold_reason ? `
                            <div class="p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-bold text-[11px]">
                                ⚠️ سبب التعليق: ${permit.hold_reason}
                            </div>
                        ` : ''}
                        <div class="flex justify-between items-center">
                            <span class="text-[#556b82] font-bold">🚪 آخر بوابة:</span>
                            <span class="font-mono font-bold text-[#002b66]">🚪 ${entryGateName} ${entryOfficerName !== '--' ? `(👮 ${entryOfficerName})` : ''}</span>
                        </div>
                        ${timeInfoHtml ? `<div class="pt-1 border-t border-[#e7eff7]">${timeInfoHtml}</div>` : ''}
                    </div>

                    ${cardPermitActions ? `
                        <div class="pt-2 border-t border-[#e7eff7] flex justify-end gap-1.5">
                            ${cardPermitActions}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    renderTableRows(lang) {
        const vehicles = window.DB.getVehicles();
        const permits = window.DB.getPermits();
        const logs = window.DB.getLogs();
        const users = window.DB.getUsers();
        const settings = window.DB.getSettings();
        const icon = (name, cls = 'w-3.5 h-3.5') => window.Icons ? window.Icons.get(name, cls) : '';

        const norm = (str) => window.ArabicPlate && window.ArabicPlate.normalizeSearchText ? window.ArabicPlate.normalizeSearchText(str) : String(str || '').toLowerCase().trim();
        const normPlate = (str) => window.ArabicPlate && window.ArabicPlate.normalizePlateCompact ? window.ArabicPlate.normalizePlateCompact(str) : norm(str).replace(/[\s\-_/.,]+/g, '');
        const qNorm = norm(this.searchQuery);
        const qPlate = normPlate(this.searchQuery);

        let filteredVehicles = vehicles.filter(vehicle => {
            const insideLog = window.DB.isVehicleInside(vehicle.id);
            const vehicleLogs = logs.filter(l => l.vehicle_id === vehicle.id);
            const hasExitedLog = vehicleLogs.some(l => l.action_type === 'exit' || l.exit_timestamp);

            if (this.activeFilter === 'inside' && !insideLog) return false;
            if (this.activeFilter === 'exited' && !hasExitedLog) return false;
            if (this.activeFilter === 'overstay') {
                if (!insideLog) return false;
                const entryTime = window.DB.parseTimestamp(insideLog.timestamp);
                const hrs = (Date.now() - entryTime.getTime()) / 3600000;
                if (hrs < (settings.overstay_hours_threshold || 3)) return false;
            }

            if (!qNorm) return true;

            const permit = window.DB.findPermitByCodeOrVehicle(null, vehicle.id);
            const lastLog = vehicleLogs.length > 0 ? vehicleLogs[vehicleLogs.length - 1] : null;
            const officer = lastLog ? users.find(u => u.id === lastLog.officer_id) : null;

            const pAr = norm(vehicle.plate_ar);
            const pEn = norm(vehicle.plate_en);
            const pArCompact = normPlate(vehicle.plate_ar);
            const pEnCompact = normPlate(vehicle.plate_en);

            const matchPlate = pAr.includes(qNorm) || pEn.includes(qNorm) || (qPlate && (pArCompact.includes(qPlate) || pEnCompact.includes(qPlate)));
            const matchDriver = norm(vehicle.driver_name_ar).includes(qNorm) || norm(vehicle.driver_name_en).includes(qNorm);
            const matchCompany = norm(vehicle.company_ar).includes(qNorm) || norm(vehicle.company_en).includes(qNorm);
            const matchPhone = norm(vehicle.driver_phone).includes(qNorm);
            const matchPermit = permit && (norm(permit.permit_code).includes(qNorm) || norm(permit.pin_code).includes(qNorm) || norm(permit.destination_ar).includes(qNorm) || norm(permit.cargo_details).includes(qNorm) || norm(permit.invoice_no).includes(qNorm));
            const matchGate = vehicleLogs.some(l => norm(l.gate_name).includes(qNorm) || norm(l.exit_gate_name).includes(qNorm));
            const matchOfficer = officer && (norm(officer.name_ar).includes(qNorm) || norm(officer.name_en).includes(qNorm));

            return matchPlate || matchDriver || matchCompany || matchPhone || matchPermit || matchGate || matchOfficer;
        });

        if (filteredVehicles.length === 0) {
            return `
                <tr>
                    <td colspan="7" class="text-center py-12 text-[#556b82]">
                        <div class="w-14 h-14 rounded-2xl bg-[#ebf3fb] text-[#0070f2] flex items-center justify-center mx-auto mb-3 border border-[#b3d5fa] shadow-sm">
                            ${icon('truck', 'w-7 h-7')}
                        </div>
                        <p class="font-black text-base text-[#1d2d3e]">
                            ${this.searchQuery ? (lang === 'ar' ? `لم يتم العثور على نتائج تطابق: "${this.searchQuery}"` : `No matching records for "${this.searchQuery}"`) : (lang === 'ar' ? 'لا توجد حركات أو تصاريح مسجلة حالياً' : 'No records yet')}
                        </p>
                        ${!this.searchQuery ? `
                            <button type="button" onclick="Manager.openQuickPermitModal()" class="mt-4 inline-flex items-center gap-2 px-5 py-2.5 sap-btn-primary text-xs font-bold shadow-md">
                                ${icon('bolt', 'w-4 h-4 text-amber-300')}
                                <span>${lang === 'ar' ? 'إصدار أول تصريح الآن' : 'Issue First Pass Now'}</span>
                            </button>
                        ` : ''}
                    </td>
                </tr>
            `;
        }

        return filteredVehicles.map(vehicle => {
            const insideLog = window.DB.isVehicleInside(vehicle.id);
            const permit = window.DB.findPermitByCodeOrVehicle(null, vehicle.id);
            const vehicleLogs = logs.filter(l => l.vehicle_id === vehicle.id);
            const sortedLogs = vehicleLogs.slice().sort((a, b) => window.DB.parseTimestamp(b.timestamp).getTime() - window.DB.parseTimestamp(a.timestamp).getTime() || (b.id || 0) - (a.id || 0));
            const lastEntryLog = sortedLogs.find(l => l.action_type === 'entry') || null;
            const lastExitLog = sortedLogs.find(l => l.action_type === 'exit' || l.exit_timestamp) || null;
            const isEnteredOnThisPermit = permit ? (
                permit.status === 'used' ||
                logs.some(l => l.permit_id === permit.id) ||
                (!!insideLog && (insideLog.permit_id === permit.id || (permit.created_at && window.DB.parseTimestamp(insideLog.timestamp).getTime() >= window.DB.parseTimestamp(permit.created_at).getTime() - 60000)))
            ) : false;
            const hasVehicleEntered = isEnteredOnThisPermit;
            
            const entryGateName = lastEntryLog ? (lastEntryLog.gate_name || 'البوابة الرئيسية') : (insideLog ? insideLog.gate_name : '--');
            const entryOfficer = lastEntryLog ? users.find(u => u.id === lastEntryLog.officer_id) : (insideLog ? users.find(u => u.id === insideLog.officer_id) : null);
            const entryOfficerName = entryOfficer ? (lang === 'ar' ? entryOfficer.name_ar : entryOfficer.name_en) : (lastEntryLog ? `ضابط #${lastEntryLog.officer_id}` : '--');
            
            const exitGateName = lastExitLog ? (lastExitLog.exit_gate_name || (lastExitLog.action_type === 'exit' ? lastExitLog.gate_name : null)) : null;
            const exitOfficer = lastExitLog ? users.find(u => u.id === (lastExitLog.exit_officer_id || lastExitLog.officer_id)) : null;
            const exitOfficerName = exitOfficer ? (lang === 'ar' ? exitOfficer.name_ar : exitOfficer.name_en) : (lastExitLog?.exit_officer_id ? `ضابط #${lastExitLog.exit_officer_id}` : '--');

            let statusBadge = '';
            let durationText = '--';
            let entryTimeText = '--';

            if (vehicle.status === 'blacklist') {
                statusBadge = `<span class="px-2.5 py-1 rounded-full text-xs badge-blacklisted flex items-center gap-1 w-fit font-bold">${icon('ban', 'w-3 h-3 text-red-300')} <span>${window.i18n.t('statusBanned')}</span></span>`;
            } else if (insideLog) {
                const entryTime = window.DB.parseTimestamp(insideLog.timestamp);
                entryTimeText = entryTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const diffMinutes = Math.max(0, Math.round((Date.now() - entryTime.getTime()) / 60000));
                const diffHours = (diffMinutes / 60).toFixed(1);
                
                if (diffMinutes >= ((settings.overstay_hours_threshold || 3) * 60)) {
                    statusBadge = `<span class="px-2.5 py-1 rounded-full text-xs badge-overstay flex items-center gap-1 w-fit font-bold">${icon('alert', 'w-3 h-3 text-red-600')} <span>${window.i18n.t('statusOverstay')}</span></span>`;
                    durationText = `<span class="text-[#bb0000] font-bold font-mono">${diffHours} ${lang === 'ar' ? 'ساعة' : 'hrs'}</span>`;
                } else {
                    statusBadge = `<span class="px-2.5 py-1 rounded-full text-xs badge-inside flex items-center gap-1 w-fit font-bold"><span class="w-1.5 h-1.5 rounded-full bg-[#107e3e] animate-pulse"></span> <span>${window.i18n.t('statusInside')}</span></span>`;
                    durationText = `<span class="text-[#107e3e] font-bold font-mono">${diffMinutes < 60 ? `${diffMinutes} ${lang === 'ar' ? 'دقيقة' : 'min'}` : `${diffHours} ${lang === 'ar' ? 'ساعة' : 'hrs'}`}</span>`;
                }
            } else if (permit && permit.status === 'hold') {
                statusBadge = `<span class="px-2.5 py-1 rounded-full text-xs bg-amber-100 text-amber-900 font-bold border border-amber-300 flex items-center gap-1 w-fit"><span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> <span>⏸️ تصريح معلق</span></span>`;
            } else if (permit && permit.status === 'revoked') {
                statusBadge = `<span class="px-2.5 py-1 rounded-full text-xs bg-rose-100 text-rose-900 font-bold border border-rose-300 flex items-center gap-1 w-fit"><span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span> <span>⛔ تصريح ملغي</span></span>`;
            } else if (permit && permit.status === 'active' && !hasVehicleEntered) {
                statusBadge = `<span class="px-2.5 py-1 rounded-full text-xs bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 flex items-center gap-1 w-fit"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> <span>🟢 تصريح ساري بانتظار الدخول</span></span>`;
            } else {
                statusBadge = `<span class="px-2.5 py-1 rounded-full text-xs badge-exited flex items-center gap-1 w-fit font-bold"><span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span> <span>${lang === 'ar' ? 'غادرت المصنع' : window.i18n.t('statusExited')}</span></span>`;
            }

            const driverName = (lang === 'ar' ? vehicle.driver_name_ar : vehicle.driver_name_en) || 'سائق مصرح';
            const companyName = (lang === 'ar' ? vehicle.company_ar : vehicle.company_en) || 'عام';
            const destination = permit ? (lang === 'ar' ? (permit.destination_ar || permit.destination_en) : (permit.destination_en || permit.destination_ar)) : (lastEntryLog?.remarks || 'المستودع الرئيسي');

            let timeCellHtml = '';

            if (insideLog) {
                const entryDate = window.DB.parseTimestamp(insideLog.timestamp);
                const entryDateStr = entryDate.toLocaleDateString();
                timeCellHtml = `
                    <div class="font-bold text-[#107e3e] flex items-center gap-1">
                        <span>📥 دخول:</span>
                        <span>${entryDateStr} • ${entryTimeText}</span>
                    </div>
                    <div class="text-[11px] text-[#556b82] mt-0.5 font-bold">
                        <span>⏱️ بالداخل:</span>
                        <span>${durationText}</span>
                    </div>
                `;
            } else if (lastExitLog) {
                const exitTimeDate = window.DB.parseTimestamp(lastExitLog.exit_timestamp || lastExitLog.timestamp);
                const exitDateStr = exitTimeDate.toLocaleDateString();
                const exitTimeStr = exitTimeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const durMin = lastExitLog.duration_minutes !== null && lastExitLog.duration_minutes !== undefined ? lastExitLog.duration_minutes : 0;
                
                timeCellHtml = `
                    <div class="font-bold text-[#0070f2] flex items-center gap-1">
                        <span>📤 آخر خروج:</span>
                        <span>${exitDateStr} • ${exitTimeStr}</span>
                    </div>
                    <div class="text-[11px] text-[#556b82] mt-0.5">
                        <span>⏱️ مدة التواجد:</span>
                        <b class="text-[#107e3e]">${durMin} ${lang === 'ar' ? 'دقيقة' : 'min'}</b>
                    </div>
                `;
            } else {
                timeCellHtml = `<span class="text-[#556b82] font-mono text-xs">⏳ بانتظار الدخول</span>`;
            }

            // Action Buttons for this row (Pass Card, Hold, Reactivate)
            let tablePermitActions = '';
            if (permit) {
                if (!hasVehicleEntered) {
                    if (permit.status === 'active') {
                        tablePermitActions = `
                            <button type="button" title="تعليق وتجميد التصريح مؤقتاً" onclick="Manager.openHoldPermitModal(${permit.id})" class="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl border border-amber-300 text-xs font-bold inline-flex items-center gap-1 shadow-sm transition-all active:scale-95">
                                <span>⏸️ تعليق</span>
                            </button>
                        `;
                    } else if (permit.status === 'hold') {
                        tablePermitActions = `
                            <button type="button" title="إلغاء التعليق وتفعيل التصريح" onclick="Manager.handleActivatePermit(${permit.id})" class="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-xl border border-emerald-300 text-xs font-bold inline-flex items-center gap-1 shadow-sm transition-all active:scale-95">
                                <span>▶️ تفعيل</span>
                            </button>
                        `;
                    } else if (permit.status === 'revoked') {
                        tablePermitActions = `
                            <button type="button" title="إعادة تفعيل التصريح" onclick="Manager.handleActivatePermit(${permit.id})" class="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-xl border border-emerald-300 text-xs font-bold inline-flex items-center gap-1 shadow-sm transition-all active:scale-95">
                                <span>▶️ تفعيل</span>
                            </button>
                        `;
                    }
                } else {
                    if (permit.status === 'active') {
                        tablePermitActions = `
                            <button type="button" title="تعليق وتجميد التصريح مؤقتاً" onclick="Manager.openHoldPermitModal(${permit.id})" class="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl border border-amber-300 text-xs font-bold inline-flex items-center gap-1 shadow-sm transition-all active:scale-95">
                                <span>⏸️ تعليق</span>
                            </button>
                            <span class="text-[10px] text-[#556b82] font-semibold bg-[#f0f4f8] px-2 py-1 rounded-lg border border-[#d7e2ee]" title="لا يمكن حذف التصريح نظراً لتسجيل حركة دخول فعلية بالمصنع">🔒 حركة مسجلة</span>
                        `;
                    } else if (permit.status === 'hold') {
                        tablePermitActions = `
                            <button type="button" title="إلغاء التعليق وتفعيل التصريح" onclick="Manager.handleActivatePermit(${permit.id})" class="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-xl border border-emerald-300 text-xs font-bold inline-flex items-center gap-1 shadow-sm transition-all active:scale-95">
                                <span>▶️ تفعيل</span>
                            </button>
                            <span class="text-[10px] text-[#556b82] font-semibold bg-[#f0f4f8] px-2 py-1 rounded-lg border border-[#d7e2ee]">🔒 حركة مسجلة</span>
                        `;
                    }
                }
            }

            return `
                <tr class="sap-table-row hover:bg-[#f5f8fc] transition-colors ${permit?.status === 'hold' ? 'bg-amber-50/30' : ''}">
                    <td class="py-3.5 px-4">
                        ${window.ArabicPlate.renderEgyptianPlate(vehicle.plate_ar, 'compact', vehicle.vehicle_type)}
                    </td>
                    <td class="py-3.5 px-4">
                        <div class="flex flex-col gap-1">
                            <span class="text-xs font-black text-[#002b66] flex items-center gap-1">
                                <span>📍</span>
                                <span>${destination}</span>
                            </span>
                            ${permit?.cargo_details ? `<span class="text-[11px] text-[#556b82] font-semibold">📦 ${permit.cargo_details}</span>` : ''}
                            ${permit?.invoice_no ? `<span class="text-[11px] text-[#107e3e] font-mono font-bold">📄 إذن: ${permit.invoice_no}</span>` : ''}
                            ${permit?.permit_code ? `
                                <div class="flex items-center gap-1.5 mt-0.5">
                                    <span class="text-[11px] text-[#0070f2] font-mono font-black">🎫 ${permit.permit_code}</span>
                                    <span class="text-[10px] text-amber-300 font-mono font-black bg-[#001940] px-1.5 py-0.5 rounded">PIN: ${permit.pin_code}</span>
                                </div>
                            ` : ''}
                            ${permit?.hold_reason ? `<span class="text-[10px] text-amber-900 font-bold bg-amber-50 p-1 rounded border border-amber-200">⚠️ السبب: ${permit.hold_reason}</span>` : ''}
                        </div>
                    </td>
                    <td class="py-3.5 px-4">
                        ${entryGateName !== '--' ? `
                            <div class="inline-flex items-center gap-1 font-bold text-xs text-[#002b66] bg-[#ebf3fb] px-2.5 py-1 rounded-xl border border-[#b3d5fa]">
                                <span>🚪 دخول:</span>
                                <span>${entryGateName}</span>
                            </div>
                            <div class="text-[10px] text-[#556b82] font-semibold mt-1">👮 ${entryOfficerName}</div>
                        ` : `
                            <span class="text-[#556b82] text-xs font-mono">--</span>
                        `}
                        ${exitGateName && exitGateName !== '--' && exitGateName !== entryGateName ? `
                            <div class="inline-flex items-center gap-1 font-bold text-xs text-purple-900 bg-purple-50 px-2.5 py-1 rounded-xl border border-purple-200 mt-1.5">
                                <span>🚪 خروج:</span>
                                <span>${exitGateName}</span>
                            </div>
                        ` : ''}
                    </td>
                    <td class="py-3.5 px-4 text-xs font-mono">
                        ${timeCellHtml}
                    </td>
                    <td class="py-3.5 px-4">
                        ${statusBadge}
                    </td>
                    <td class="py-3.5 px-4">
                        <div class="font-bold text-[#1d2d3e] text-xs">${driverName}</div>
                        <div class="text-[11px] text-[#556b82] font-semibold">${companyName}</div>
                        ${vehicle.driver_phone ? `
                            <a href="https://wa.me/2${vehicle.driver_phone.replace(/\D/g, '')}" target="_blank" class="inline-flex items-center gap-1 text-[11px] text-[#107e3e] hover:underline font-mono font-bold mt-1">
                                <span>📱 ${vehicle.driver_phone}</span>
                            </a>
                        ` : ''}
                    </td>
                    <td class="py-3.5 px-4 text-center">
                        <div class="flex items-center justify-center gap-1.5 flex-wrap">
                            ${permit ? `
                                <button type="button" title="عرض وطباعة كارت التصريح A4" onclick="Manager.showPassModal(${permit.id})" class="px-2.5 py-1.5 bg-[#ebf3fb] hover:bg-[#d5e7fa] text-[#0070f2] rounded-xl border border-[#b3d5fa] text-xs font-bold inline-flex items-center gap-1 shadow-sm transition-all active:scale-95">
                                    ${icon('qrcode', 'w-3.5 h-3.5')}
                                    <span>كارت</span>
                                </button>
                            ` : `
                                <button type="button" title="إصدار تصريح دخول" onclick="Manager.openQuickPermitModal(${vehicle.id})" class="px-2.5 py-1.5 bg-[#e5f6eb] hover:bg-[#cdeed7] text-[#107e3e] rounded-xl border border-[#b4e3c4] text-xs font-bold inline-flex items-center gap-1 shadow-sm transition-all active:scale-95">
                                    ${icon('bolt', 'w-3.5 h-3.5')}
                                    <span>تصريح</span>
                                </button>
                            `}
                            ${tablePermitActions}
                            <button type="button" title="${vehicle.status === 'blacklist' ? 'إلغاء الحظر' : 'حظر المركبة'}" onclick="Manager.toggleBlacklist(${vehicle.id})" class="p-1.5 ${vehicle.status === 'blacklist' ? 'bg-[#e5f6eb] text-[#107e3e] border-[#b4e3c4]' : 'bg-[#ffebeb] text-[#bb0000] border-[#f6b3b3]'} hover:opacity-80 rounded-xl border text-xs shadow-sm transition-all active:scale-95">
                                ${vehicle.status === 'blacklist' ? icon('unlock', 'w-3.5 h-3.5') : icon('ban', 'w-3.5 h-3.5')}
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    setFilter(filter) {
        this.activeFilter = filter;
        this.renderDashboard();
    }

    openSettingsModal(activeTab = 'general') {
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) return;
        const lang = window.i18n.getLang();
        const settings = window.DB.getSettings();
        const gates = window.DB.getGates();
        const destinations = window.DB.getDestinations();
        const officers = window.DB.getOfficers();
        const roster = window.DB.getGateRoster();
        const icon = (name, cls = 'w-4 h-4') => window.Icons ? window.Icons.get(name, cls) : '';

        modalContainer.innerHTML = `
            <div class="sap-modal-overlay fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onclick="if(event.target === this) document.getElementById('modal-container').innerHTML = ''">
                <div class="sap-modal-content bg-white rounded-3xl w-full max-w-3xl border border-[#b0cfee] shadow-2xl p-6 relative animate-scaleUp max-h-[92vh] overflow-y-auto ${lang === 'ar' ? 'text-right' : 'text-left'}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                    <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="absolute top-4 ${lang === 'ar' ? 'left-4' : 'right-4'} text-[#556b82] hover:text-[#1d2d3e] text-xl font-bold">
                        ✕
                    </button>

                    <!-- Header -->
                    <div class="flex items-center gap-3 pb-4 border-b border-[#d7e2ee]">
                        <div class="w-11 h-11 rounded-2xl bg-[#ebf3fb] text-[#0070f2] flex items-center justify-center border border-[#b3d5fa] shadow-sm">
                            ${icon('settings', 'w-5 h-5')}
                        </div>
                        <div>
                            <h3 class="text-base font-black text-[#002b66]">${lang === 'ar' ? 'إعدادات النظام وجدول توزيع البوابات والمناوبات' : 'System Settings & Gate Shift Roster'}</h3>
                            <p class="text-xs text-[#556b82] font-semibold">${lang === 'ar' ? 'تخصيص البوابات، تعيين ضباط النهار والليل (Back-to-Back)، وإدارة البيانات' : 'Configure gates, assign day/night shift officers, and manage roster'}</p>
                        </div>
                    </div>

                    <!-- Unified Navigation Tabs -->
                    <div class="grid grid-cols-3 gap-1.5 bg-[#f0f4f8] p-1.5 rounded-2xl border border-[#d7e2ee] mb-4 text-xs font-bold">
                        <button type="button" onclick="Manager.openSettingsModal('general')" class="py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${activeTab === 'general' ? 'bg-[#0070f2] text-white shadow-sm' : 'text-[#556b82] hover:text-[#002b66]'}">
                            ${icon('settings', 'w-3.5 h-3.5')}
                            <span>${lang === 'ar' ? 'عام والنظام' : 'General'}</span>
                        </button>
                        <button type="button" onclick="Manager.openSettingsModal('gates')" class="py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${activeTab === 'gates' ? 'bg-[#0070f2] text-white shadow-sm' : 'text-[#556b82] hover:text-[#002b66]'}">
                            ${icon('shield', 'w-3.5 h-3.5')}
                            <span>${lang === 'ar' ? `المناوبات والبوابات (${gates.length})` : `Gates & Roster (${gates.length})`}</span>
                        </button>
                        <button type="button" onclick="Manager.openSettingsModal('destinations')" class="py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${activeTab === 'destinations' ? 'bg-[#0070f2] text-white shadow-sm' : 'text-[#556b82] hover:text-[#002b66]'}">
                            ${icon('building', 'w-3.5 h-3.5')}
                            <span>${lang === 'ar' ? `الوجهات (${destinations.length})` : `Docks (${destinations.length})`}</span>
                        </button>
                    </div>

                    <!-- TAB 1: General & WhatsApp Settings -->
                    ${activeTab === 'general' ? `
                        <form onsubmit="Manager.saveSettings(event)" class="space-y-4">
                            <!-- Card 1: Dispatcher WhatsApp & General Parameters -->
                            <div class="sap-settings-card space-y-3">
                                <div class="flex items-center gap-2 pb-2 border-b border-[#e2e8f0]">
                                    <span class="text-[#107e3e]">${icon('whatsapp', 'w-4 h-4')}</span>
                                    <span class="text-xs font-black text-[#002b66]">${lang === 'ar' ? 'إعدادات الإرسال عبر واتساب والمنشأة' : 'WhatsApp Dispatch & Company Parameters'}</span>
                                </div>

                                <div>
                                    <label class="block text-xs font-bold text-[#1d2d3e] mb-1">
                                        ${lang === 'ar' ? 'رقم واتساب الإدارة / البوابة الافتراضي (لإرسال التصاريح تلقائياً):' : 'Default Dispatcher WhatsApp Number:'}
                                    </label>
                                    <input type="tel" id="setting-default-whatsapp" required value="${settings.default_whatsapp || '01012345678'}" placeholder="01012345678" class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl px-3.5 py-2 text-[#1d2d3e] font-mono font-bold text-sm focus:border-[#0070f2] focus:bg-white focus:outline-none transition-colors" />
                                </div>

                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label class="block text-xs font-bold text-[#556b82] mb-1">${lang === 'ar' ? 'اسم المنشأة / الشركة' : 'Company Name'}</label>
                                        <input type="text" id="setting-company" value="${settings.company_name_ar || 'مجموعة دوترا'}" class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl px-3 py-2 text-xs font-bold text-[#1d2d3e] focus:border-[#0070f2] focus:bg-white focus:outline-none" />
                                    </div>
                                    <div>
                                        <label class="block text-xs font-bold text-[#556b82] mb-1">${lang === 'ar' ? 'تنبيه تجاوز المدة (بالساعات)' : 'Overstay Alert (Hours)'}</label>
                                        <input type="number" id="setting-overstay" min="1" max="24" value="${settings.overstay_hours_threshold || 3}" class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl px-3 py-2 text-xs font-bold text-[#1d2d3e] focus:border-[#0070f2] focus:bg-white focus:outline-none" />
                                    </div>
                                </div>
                            </div>

                            <div class="flex justify-end gap-2 pt-3 border-t border-[#d7e2ee]">
                                <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="px-4 py-2 sap-btn-secondary text-xs">
                                    ${lang === 'ar' ? 'إلغاء' : 'Cancel'}
                                </button>
                                <button type="submit" class="px-6 py-2.5 sap-btn-primary text-xs flex items-center gap-1.5 shadow-md font-bold">
                                    ${icon('save', 'w-4 h-4')}
                                    <span>${lang === 'ar' ? 'حفظ الإعدادات' : 'Save Settings'}</span>
                                </button>
                            </div>
                        </form>
                    ` : ''}

                    <!-- TAB 2: Gates & Shift Roster Management (Day / Night Shift / Back-to-Back) -->
                    ${activeTab === 'gates' ? `
                        <div class="space-y-3">
                            <!-- Excel / CSV Roster Toolbar -->
                            <div class="p-3 bg-[#f0f4f8] rounded-2xl border border-[#d7e2ee] flex flex-wrap items-center justify-between gap-2">
                                <div class="text-xs font-bold text-[#002b66] flex items-center gap-1.5">
                                    <span>📊</span>
                                    <span>${lang === 'ar' ? 'إدارة وتعيين ورديات ومناوبات البوابات (Excel / CSV):' : 'Gate Shift Roster Excel & CSV Operations:'}</span>
                                </div>
                                <div class="flex items-center gap-1.5 flex-wrap">
                                    <button type="button" onclick="Manager.downloadRosterExcelTemplate()" class="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-[#107e3e] border border-[#a3e635] rounded-xl text-[11px] font-bold shadow-xs flex items-center gap-1" title="تحميل نموذج إكسيل جاهز">
                                        <span>📗</span>
                                        <span>${lang === 'ar' ? 'نموذج Excel (.xls)' : 'Excel Template'}</span>
                                    </button>
                                    <button type="button" onclick="Manager.downloadRosterCsvTemplate()" class="px-2 py-1.5 bg-white hover:bg-slate-50 text-[#0070f2] border border-[#b3d5fa] rounded-xl text-[11px] font-bold shadow-xs flex items-center gap-1" title="تحميل نموذج CSV">
                                        <span>📄</span>
                                        <span>CSV</span>
                                    </button>
                                    <button type="button" onclick="Manager.openImportRosterModal()" class="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold shadow-xs flex items-center gap-1" title="استيراد كشف الوردات">
                                        <span>📥</span>
                                        <span>${lang === 'ar' ? 'استيراد كشف المناوبات (Excel / CSV)' : 'Import Roster'}</span>
                                    </button>
                                    <button type="button" onclick="Manager.exportRosterExcel()" class="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-[#002b66] border border-[#d7e2ee] rounded-xl text-[11px] font-bold shadow-xs flex items-center gap-1" title="تصدير كشف الوردات الحالي إلى إكسيل">
                                        <span>📊</span>
                                        <span>${lang === 'ar' ? 'تصدير المناوبات (Excel)' : 'Export Excel'}</span>
                                    </button>
                                </div>
                            </div>

                            <!-- Add Gate Form -->
                            <form onsubmit="Manager.handleAddGate(event)" class="flex gap-2 bg-[#f8fafc] p-3 rounded-2xl border border-[#d7e2ee]">
                                <input type="text" id="new-gate-name" required placeholder="${lang === 'ar' ? 'اسم البوابة الجديدة (مثال: بوابة 5 الشاحنات والجمارك)...' : 'New Gate Name...'}" class="flex-1 bg-white border border-[#d7e2ee] rounded-xl px-3 py-2 text-xs font-bold text-[#1d2d3e] focus:border-[#0070f2] focus:outline-none" />
                                <button type="submit" class="px-4 py-2 sap-btn-primary text-xs font-bold flex items-center gap-1 shadow-sm flex-shrink-0">
                                    <span>➕</span>
                                    <span>${lang === 'ar' ? 'إضافة بوابة' : 'Add Gate'}</span>
                                </button>
                            </form>

                            <!-- Gates & Shift Roster List -->
                            <div class="space-y-3 max-h-80 overflow-y-auto pr-1">
                                ${roster.map((r, idx) => `
                                    <div class="p-3.5 rounded-2xl bg-white border border-[#d7e2ee] hover:border-[#b0cfee] transition-all space-y-2.5 shadow-sm">
                                        <div class="flex items-center justify-between border-b border-[#e7eff7] pb-2">
                                            <div class="flex items-center gap-2">
                                                <span class="w-6 h-6 rounded-lg bg-[#f0f4f8] text-[#002b66] flex items-center justify-center font-bold text-xs">
                                                    ${idx + 1}
                                                </span>
                                                <span class="font-black text-sm text-[#002b66]">${r.gate_name}</span>
                                            </div>
                                            ${gates.length > 1 ? `
                                                <button type="button" onclick="Manager.handleDeleteGate(${idx})" title="حذف البوابة" class="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors">
                                                    ${icon('trash', 'w-3.5 h-3.5')}
                                                </button>
                                            ` : ''}
                                        </div>

                                        <!-- Shift Assignments: Day and Night (Back-to-Back) -->
                                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                                            <!-- Day Shift Assignment -->
                                            <div class="p-2.5 bg-[#fefce8] rounded-xl border border-amber-200">
                                                <div class="font-bold text-amber-900 mb-1 flex items-center justify-between">
                                                    <span>☀️ وردية النهار (Day Shift)</span>
                                                    <span class="text-[10px] font-mono text-amber-700">${r.day_officer_badge || '--'}</span>
                                                </div>
                                                <select onchange="Manager.handleAssignShiftOfficer('${r.gate_name}', 'day', this.value)" class="w-full bg-white border border-amber-300 rounded-lg p-1.5 text-xs font-bold text-[#1d2d3e]">
                                                    <option value="">${lang === 'ar' ? '-- بدون تعيين --' : '-- Unassigned --'}</option>
                                                    ${officers.map(o => `<option value="${o.id}" ${r.day_officer_id === o.id ? 'selected' : ''}>${o.name_ar} (${o.badge_id})</option>`).join('')}
                                                </select>
                                            </div>

                                            <!-- Night Shift / Back-to-Back Assignment -->
                                            <div class="p-2.5 bg-[#f0fdf4] rounded-xl border border-emerald-200">
                                                <div class="font-bold text-emerald-900 mb-1 flex items-center justify-between">
                                                    <span>🌙 وردية الليل / المناوب البديل (Night Shift)</span>
                                                    <span class="text-[10px] font-mono text-emerald-700">${r.night_officer_badge || '--'}</span>
                                                </div>
                                                <select onchange="Manager.handleAssignShiftOfficer('${r.gate_name}', 'night', this.value)" class="w-full bg-white border border-emerald-300 rounded-lg p-1.5 text-xs font-bold text-[#1d2d3e]">
                                                    <option value="">${lang === 'ar' ? '-- بدون تعيين --' : '-- Unassigned --'}</option>
                                                    ${officers.map(o => `<option value="${o.id}" ${r.night_officer_id === o.id ? 'selected' : ''}>${o.name_ar} (${o.badge_id})</option>`).join('')}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <!-- TAB 3: Internal Destinations Management -->
                    ${activeTab === 'destinations' ? `
                        <div class="space-y-3">
                            <!-- Add Destination Form -->
                            <form onsubmit="Manager.handleAddDestination(event)" class="flex gap-2 bg-[#f8fafc] p-3 rounded-2xl border border-[#d7e2ee]">
                                <input type="text" id="new-destination-name" required placeholder="${lang === 'ar' ? 'اسم الوجهة الجديدة (مثال: مصنع التغليف والتعبئة)...' : 'New Destination Name...'}" class="flex-1 bg-white border border-[#d7e2ee] rounded-xl px-3 py-2 text-xs font-bold text-[#1d2d3e] focus:border-[#0070f2] focus:outline-none" />
                                <button type="submit" class="px-4 py-2 sap-btn-primary text-xs font-bold flex items-center gap-1 shadow-sm flex-shrink-0">
                                    <span>➕</span>
                                    <span>${lang === 'ar' ? 'إضافة وجهة' : 'Add Dock'}</span>
                                </button>
                            </form>

                            <!-- Destinations Grid -->
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                                ${destinations.map((dest, idx) => `
                                    <div class="p-3 rounded-xl bg-white border border-[#d7e2ee] flex items-center justify-between gap-2 shadow-sm hover:border-[#b0cfee] transition-colors">
                                        <div class="flex items-center gap-2">
                                            <span class="w-6 h-6 rounded-lg bg-[#f0f4f8] text-[#002b66] flex items-center justify-center font-bold text-xs">
                                                ${idx + 1}
                                            </span>
                                            <span class="font-bold text-xs text-[#1d2d3e]">${dest}</span>
                                        </div>
                                        ${destinations.length > 1 ? `
                                            <button type="button" onclick="Manager.handleDeleteDestination(${idx})" title="حذف" class="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                                                ${icon('trash', 'w-3.5 h-3.5')}
                                            </button>
                                        ` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                </div>
            </div>
        `;
    }

    handleAddGate(e) {
        e.preventDefault();
        const input = document.getElementById('new-gate-name');
        if (input && input.value.trim()) {
            window.DB.addGate(input.value.trim());
            this.openSettingsModal('gates');
        }
    }

    handleDeleteGate(index) {
        if (confirm("هل أنت متأكد من رغبتك في حذف هذه البوابة؟")) {
            window.DB.deleteGate(index);
            this.openSettingsModal('gates');
        }
    }

    handleAssignOfficerToGate(officerId, gateName) {
        if (!officerId) return;
        window.DB.assignOfficerToGate(parseInt(officerId), gateName);
        this.openSettingsModal('gates');
    }

    handleAssignShiftOfficer(gateName, shift, officerId) {
        const roster = window.DB.getGateRoster();
        let entry = roster.find(r => r.gate_name === gateName);
        if (!entry) {
            entry = { gate_name: gateName, day_officer_id: null, night_officer_id: null, notes: '' };
            roster.push(entry);
        }

        const idNum = officerId ? parseInt(officerId) : null;
        if (shift === 'day') {
            entry.day_officer_id = idNum;
        } else if (shift === 'night') {
            entry.night_officer_id = idNum;
        }

        window.DB.saveGateRoster(roster);
        this.openSettingsModal('gates');
    }

    downloadRosterExcelTemplate() {
        const excelContent = window.DB.getRosterExcelTemplate();
        if (typeof document !== 'undefined' && document.createElement && typeof Blob !== 'undefined' && typeof URL !== 'undefined') {
            try {
                const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `نموذج_جدول_مناوبات_البوابات_دوترا.xls`;
                if (document.body && typeof document.body.appendChild === 'function') {
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                } else {
                    a.click();
                }
                URL.revokeObjectURL(url);
            } catch (e) {
                console.error('Download Roster Excel error:', e);
            }
        }
    }

    downloadRosterCsvTemplate() {
        const csvContent = "\uFEFF" + window.DB.getRosterCsvTemplate();
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `نموذج_جدول_مناوبات_البوابات_دوترا.csv`;
        if (document.body && typeof document.body.appendChild === 'function') {
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } else {
            a.click();
        }
        URL.revokeObjectURL(url);
    }

    exportRosterExcel() {
        const excelContent = window.DB.exportRosterToExcel();
        if (typeof document !== 'undefined' && document.createElement && typeof Blob !== 'undefined' && typeof URL !== 'undefined') {
            try {
                const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `جدول_ورديات_ومناوبات_البوابات_دوترا_${new Date().toISOString().split('T')[0]}.xls`;
                if (document.body && typeof document.body.appendChild === 'function') {
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                } else {
                    a.click();
                }
                URL.revokeObjectURL(url);
            } catch (e) {
                console.error('Export Roster Excel error:', e);
            }
        }
    }

    exportRosterCSV() {
        return this.exportRosterExcel();
    }

    openImportRosterModal() {
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) return;
        const lang = window.i18n.getLang();
        const icon = (name, cls = 'w-4 h-4') => window.Icons ? window.Icons.get(name, cls) : '';

        modalContainer.innerHTML = `
            <div class="sap-modal-overlay fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onclick="if(event.target === this) document.getElementById('modal-container').innerHTML = ''">
                <div class="sap-modal-content bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[92vh] overflow-y-auto shadow-2xl border border-[#d7e2ee]" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                    <div class="flex justify-between items-center pb-3 border-b border-[#d7e2ee]">
                        <div class="flex items-center gap-2">
                            <span class="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                                ${icon('table', 'w-5 h-5')}
                            </span>
                            <div>
                                <h3 class="text-base font-black text-[#002b66]">
                                    ${lang === 'ar' ? '📥 استيراد جدول ورديات ومناوبات البوابات (Excel Sheet / CSV)' : 'Import Gate Shift Roster (Excel / CSV)'}
                                </h3>
                                <p class="text-xs text-[#556b82]">
                                    ${lang === 'ar' ? 'رفع شيت Excel (.xls/.xlsx) أو ملف CSV لتعيين ضباط ورديات النهار والليل لكل بوابة تلقائياً' : 'Upload Excel sheet or CSV assigning day & night officers per gate'}
                                </p>
                            </div>
                        </div>
                        <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm">✕</button>
                    </div>

                    <form onsubmit="Manager.submitImportRoster(event)" class="py-4 space-y-4">
                        <!-- Top Banner with Download Actions -->
                        <div class="bg-[#ebf3fb] p-3 rounded-xl border border-[#b3d5fa] flex items-center justify-between gap-2 flex-wrap">
                            <span class="text-xs font-bold text-[#002b66]">
                                ${lang === 'ar' ? '📄 نماذج الجداول المعتمدة للتحميل المسبق:' : 'Standard Roster Templates:'}
                            </span>
                            <div class="flex items-center gap-2">
                                <button type="button" onclick="Manager.downloadRosterExcelTemplate()" class="px-3 py-1.5 bg-[#107e3e] hover:bg-[#0c6b33] text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-all" title="تحميل نموذج إكسيل جاهز">
                                    <span>📗</span>
                                    <span>${lang === 'ar' ? 'نموذج Excel (.xls)' : 'Excel Template'}</span>
                                </button>
                                <button type="button" onclick="Manager.downloadRosterCsvTemplate()" class="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-[#002b66] border border-[#d7e2ee] rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-all">
                                    <span>📄</span>
                                    <span>CSV</span>
                                </button>
                            </div>
                        </div>

                        <!-- File Picker Box -->
                        <div class="border-2 border-dashed border-[#b0cfee] hover:border-[#0070f2] rounded-2xl p-4 text-center bg-[#f8fafc] transition-all">
                            <label class="cursor-pointer flex flex-col items-center justify-center gap-2">
                                <span class="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shadow-sm">
                                    ${icon('table', 'w-5 h-5')}
                                </span>
                                <span class="text-xs font-bold text-[#002b66]">
                                    ${lang === 'ar' ? 'اختر ملف Excel (.xls / .xlsx) أو CSV من جهازك' : 'Choose Excel (.xls/.xlsx) or CSV file'}
                                </span>
                                <span class="text-[10px] text-[#8fa4b8]">يدعم .xls, .xlsx, .csv, .txt</span>
                                <input type="file" accept=".xlsx, .xls, .csv, .txt" onchange="Manager.handleRosterCsvUpload(event)" class="hidden" />
                            </label>
                        </div>

                        <div>
                            <div class="flex justify-between items-center mb-1">
                                <label class="block text-xs font-bold text-[#1d2d3e]">
                                    ${lang === 'ar' ? 'أو الصق بيانات خلايا الإكسيل مباشرة أدناه (Copy/Paste):' : 'Or paste Excel cells / CSV data directly:'}
                                </label>
                                <button type="button" onclick="Manager.loadSampleRosterDataIntoTextarea()" class="text-[11px] text-[#0070f2] hover:underline font-bold">
                                    ${lang === 'ar' ? '⚡ تجربة بيانات نموذجية' : 'Load Sample'}
                                </button>
                            </div>
                            <textarea id="roster-import-textarea" oninput="Manager.updateRosterPreview()" rows="4" placeholder="${window.DB.getRosterCsvTemplate()}" class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl p-3 text-xs font-mono text-[#1d2d3e] focus:border-[#0070f2] focus:outline-none"></textarea>
                        </div>

                        <!-- Dynamic Interactive Table Preview -->
                        <div id="roster-preview-container" class="space-y-2">
                            <!-- Populated dynamically by updateRosterPreview() -->
                        </div>

                        <div class="flex justify-end gap-2 pt-3 border-t border-[#d7e2ee]">
                            <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="px-4 py-2 sap-btn-secondary text-xs">
                                ${lang === 'ar' ? 'إلغاء' : 'Cancel'}
                            </button>
                            <button type="submit" class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs flex items-center gap-1.5 shadow-md font-bold rounded-xl active:scale-95 transition-all">
                                ${icon('save', 'w-4 h-4')}
                                <span>${lang === 'ar' ? 'اعتماد وتطبيق جدول المناوبات' : 'Apply Shift Roster'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        this.updateRosterPreview();
    }

    loadSampleRosterDataIntoTextarea() {
        const textarea = document.getElementById('roster-import-textarea');
        if (textarea) {
            textarea.value = window.DB.getRosterCsvTemplate();
            this.updateRosterPreview();
        }
    }

    updateRosterPreview() {
        const textarea = document.getElementById('roster-import-textarea');
        const container = document.getElementById('roster-preview-container');
        if (!textarea || !container) return;

        const content = textarea.value.trim();
        const lang = window.i18n.getLang();
        const icon = (name, cls = 'w-3.5 h-3.5') => window.Icons ? window.Icons.get(name, cls) : '';

        if (!content) {
            container.innerHTML = `
                <div class="p-3 bg-[#f8fafc] rounded-xl border border-[#e7eff7] text-center text-xs text-[#8fa4b8]">
                    ${lang === 'ar' ? 'سيظهر جدول المعاينة التفاعلي هنا فور رفع شيت Excel أو لصق البيانات.' : 'Table preview will appear here once Excel/CSV data is provided.'}
                </div>
            `;
            return;
        }

        let parsedRows = [];
        if (content.includes('<tr') || content.includes('<table')) {
            const trMatches = content.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
            trMatches.forEach(tr => {
                const cellMatches = tr.match(/<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi) || [];
                const rowData = cellMatches.map(cell => cell.replace(/<[^>]+>/g, '').trim());
                if (rowData.length > 0) parsedRows.push(rowData);
            });
        } else {
            const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
            lines.forEach(line => {
                let parts = [];
                if (line.includes('\t')) parts = line.split('\t');
                else if (line.includes(';')) parts = line.split(';');
                else parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(s => s.replace(/^"|"$/g, '').trim());
                if (parts.length > 0) parsedRows.push(parts);
            });
        }

        if (parsedRows.length < 2) {
            container.innerHTML = `
                <div class="p-3 bg-amber-50 rounded-xl border border-amber-200 text-center text-xs text-amber-800 font-bold">
                    ${lang === 'ar' ? '⚠️ يرجى التأكد من احتواء الشيت على سطر الرأس وبيانات بوابة واحدة على الأقل.' : 'Ensure file contains a header and at least one gate row.'}
                </div>
            `;
            return;
        }

        const startIdx = (parsedRows[0][0] && (parsedRows[0][0].includes('بوابة') || parsedRows[0][0].toLowerCase().includes('gate'))) ? 1 : 0;
        const rows = [];
        for (let i = startIdx; i < parsedRows.length; i++) {
            const parts = parsedRows[i];
            if (parts.length > 0 && parts[0] && !parts[0].includes('اسم البوابة')) {
                rows.push({
                    gate: parts[0] || '',
                    dayBadge: parts[1] || '-',
                    dayOfficer: parts[2] || '-',
                    nightBadge: parts[3] || '-',
                    nightOfficer: parts[4] || '-',
                    notes: parts[5] || ''
                });
            }
        }

        container.innerHTML = `
            <div class="border border-[#d7e2ee] rounded-xl overflow-hidden shadow-sm bg-white">
                <div class="bg-[#f0f4f8] px-3.5 py-2 border-b border-[#d7e2ee] flex justify-between items-center">
                    <span class="text-xs font-black text-[#002b66] flex items-center gap-1.5">
                        ${icon('table', 'w-4 h-4 text-[#0070f2]')}
                        <span>${lang === 'ar' ? `معاينة جدول المناوبات (${rows.length} بوابة):` : `Roster Preview (${rows.length} Gates):`}</span>
                    </span>
                    <span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-bold">
                        ${lang === 'ar' ? 'جاهز للتطبيق' : 'Ready'}
                    </span>
                </div>
                <div class="max-h-48 overflow-y-auto overflow-x-auto">
                    <table class="w-full text-xs text-right border-collapse" dir="rtl">
                        <thead class="bg-[#f8fafc] text-[#556b82] font-bold border-b border-[#d7e2ee] sticky top-0">
                            <tr>
                                <th class="p-2 border-l border-[#e7eff7]">#</th>
                                <th class="p-2 border-l border-[#e7eff7]">البوابة</th>
                                <th class="p-2 border-l border-[#e7eff7]">شارة النهار</th>
                                <th class="p-2 border-l border-[#e7eff7]">ضابط النهار</th>
                                <th class="p-2 border-l border-[#e7eff7]">شارة الليل</th>
                                <th class="p-2 border-l border-[#e7eff7]">ضابط الليل</th>
                                <th class="p-2">ملاحظات</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-[#e7eff7]">
                            ${rows.map((r, idx) => `
                                <tr class="hover:bg-slate-50 transition-colors">
                                    <td class="p-2 font-mono text-[#8fa4b8] border-l border-[#e7eff7]">${idx + 1}</td>
                                    <td class="p-2 font-black text-[#002b66] border-l border-[#e7eff7]">${r.gate}</td>
                                    <td class="p-2 font-mono font-bold text-amber-700 border-l border-[#e7eff7]">${r.dayBadge}</td>
                                    <td class="p-2 font-bold text-[#1d2d3e] border-l border-[#e7eff7]">${r.dayOfficer}</td>
                                    <td class="p-2 font-mono font-bold text-emerald-700 border-l border-[#e7eff7]">${r.nightBadge}</td>
                                    <td class="p-2 font-bold text-[#1d2d3e] border-l border-[#e7eff7]">${r.nightOfficer}</td>
                                    <td class="p-2 text-[#556b82]">${r.notes || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    handleRosterCsvUpload(event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const textarea = document.getElementById('roster-import-textarea');
            if (textarea) {
                textarea.value = e.target.result;
                this.updateRosterPreview();
            }
        };
        reader.readAsText(file, 'utf-8');
    }

    submitImportRoster(event) {
        if (event && event.preventDefault) event.preventDefault();
        const textarea = document.getElementById('roster-import-textarea');
        const csvContent = textarea ? textarea.value.trim() : '';
        if (!csvContent) {
            alert(window.i18n.getLang() === 'ar' ? 'يرجى إدخال أو رفع بيانات كشف الـ Excel / CSV أولاً' : 'Please provide Excel/CSV content first.');
            return;
        }

        const result = window.DB.importRosterFromCSV(csvContent);
        if (result.success) {
            document.getElementById('modal-container').innerHTML = '';
            this.openSettingsModal('gates');
            if (window.App && typeof window.App.showToast === 'function') {
                window.App.showToast('📊 جدول المناوبات', result.message, 'success');
            } else {
                alert(result.message);
            }
        } else {
            alert(result.message || 'حدث خطأ أثناء معالجة ملف الـ CSV');
        }
    }

    // =========================================================================
    // MANAGER INSPECTION & ENTRY REQUEST REVIEW HUB (DUAL PHOTO VIEW & HOLD REQUESTS)
    // =========================================================================

    openPendingRequestsModal(activeTab = 'inspection') {
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) return;
        const lang = window.i18n.getLang();
        const icon = (name, cls = 'w-4 h-4') => window.Icons ? window.Icons.get(name, cls) : '';
        const requests = window.DB ? window.DB.getInspectionRequests() : [];
        const pending = requests.filter(r => r.status === 'pending');
        const holdRequests = window.DB ? window.DB.getPermitHoldRequests() : [];
        const pendingHold = holdRequests.filter(r => r.status === 'pending');

        modalContainer.innerHTML = `
            <div class="sap-modal-overlay fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onclick="if(event.target === this) document.getElementById('modal-container').innerHTML = ''">
                <div class="sap-modal-content bg-white rounded-2xl max-w-3xl w-full p-6 max-h-[92vh] overflow-y-auto shadow-2xl border border-[#d7e2ee]" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                    <div class="flex justify-between items-center pb-3 border-b border-[#d7e2ee]">
                        <div class="flex items-center gap-2.5">
                            <span class="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-black text-lg border border-amber-300">
                                🚨
                            </span>
                            <div>
                                <h3 class="text-base font-black text-[#002b66]">
                                    ${lang === 'ar' ? 'مركز متابعة طلبات وإشعارات البوابات' : 'Gate Requests & Alerts Center'}
                                </h3>
                                <p class="text-xs text-[#556b82]">
                                    ${lang === 'ar' ? `إجمالي (${pending.length + pendingHold.length}) طلبات بانتظار قرار واعتماد المدير` : `${pending.length + pendingHold.length} total pending requests`}
                                </p>
                            </div>
                        </div>
                        <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm">✕</button>
                    </div>

                    <!-- Hub Switcher Tabs -->
                    <div class="flex items-center gap-2 pt-3 pb-1 border-b border-[#e7eff7]">
                        <button type="button" onclick="Manager.openPendingRequestsModal('inspection')" class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'inspection' ? 'bg-[#0070f2] text-white shadow-sm' : 'bg-[#f0f4f8] text-[#556b82] hover:text-[#002b66]'}">
                            <span>📸</span>
                            <span>${lang === 'ar' ? 'طلبات الاستئذان والفحص بالصور' : 'Inspection Requests'}</span>
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${activeTab === 'inspection' ? 'bg-white text-[#0070f2]' : 'bg-slate-200 text-slate-700'}">${pending.length}</span>
                        </button>
                        <button type="button" onclick="Manager.openPendingRequestsModal('hold')" class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'hold' ? 'bg-amber-600 text-white shadow-sm' : 'bg-[#f0f4f8] text-[#556b82] hover:text-[#002b66]'}">
                            <span>⚠️</span>
                            <span>${lang === 'ar' ? 'طلبات تعليق وسحب التصاريح' : 'Permit Hold Requests'}</span>
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${activeTab === 'hold' ? 'bg-white text-amber-800' : 'bg-slate-200 text-slate-700'}">${pendingHold.length}</span>
                        </button>
                    </div>

                    <div class="py-4 space-y-3">
                        ${activeTab === 'hold' ? `
                            <!-- HOLD / REVOKE REQUESTS LIST -->
                            ${holdRequests.length === 0 ? `
                                <div class="text-center py-10 bg-[#f8fafc] rounded-2xl border border-dashed border-[#d7e2ee]">
                                    <div class="text-3xl mb-2">🛡️</div>
                                    <div class="text-xs font-bold text-[#556b82]">لا توجد طلبات تعليق أو سحب تصاريح واردة من البوابات</div>
                                </div>
                            ` : `
                                <div class="space-y-3 max-h-96 overflow-y-auto pr-1">
                                    ${holdRequests.map(req => {
                                        const isPending = req.status === 'pending';
                                        const isApproved = req.status === 'approved';
                                        const isRevoke = req.request_type === 'revoke';
                                        const typeBadge = isRevoke 
                                            ? '<span class="px-2.5 py-0.5 bg-rose-100 text-rose-900 border border-rose-300 rounded-full text-xs font-black">⛔ طلب سحب وإلغاء</span>'
                                            : '<span class="px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-xs font-black">⏸️ طلب تعليق مؤقت</span>';
                                        const statusBadge = isPending 
                                            ? '<span class="px-2 py-0.5 bg-amber-500 text-slate-950 rounded-full text-[10px] font-black animate-pulse">بانتظار القرار</span>'
                                            : (isApproved ? '<span class="px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded-full text-[10px] font-black">تم التنفيذ ✅</span>' : '<span class="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-[10px] font-black">مرفوض ❌</span>');

                                        return `
                                            <div class="p-4 rounded-2xl bg-white border-2 ${isPending ? 'border-amber-300 bg-amber-50/20' : 'border-[#d7e2ee]'} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm hover:border-[#0070f2] transition-all">
                                                <div class="space-y-1.5 flex-1">
                                                    <div class="flex items-center gap-2 flex-wrap">
                                                        <span class="font-black text-sm text-[#002b66]">${req.plate_ar}</span>
                                                        ${typeBadge}
                                                        ${statusBadge}
                                                        <span class="text-[11px] text-[#556b82] font-mono">📍 ${req.gate_name}</span>
                                                    </div>
                                                    <div class="text-xs text-[#1d2d3e] font-bold">
                                                        <span>👤 السائق: ${req.driver_name}</span>
                                                        ${req.permit_code ? `<span class="text-[#0070f2] font-mono"> • كود: ${req.permit_code}</span>` : ''}
                                                    </div>
                                                    <div class="text-[11px] text-amber-950 bg-amber-50 p-2 rounded-xl border border-amber-200 font-semibold">
                                                        <span>⚠️ سبب الطلب: <b>${req.reason}</b></span>
                                                        ${req.notes ? `<div class="mt-0.5 text-slate-600 font-normal">📝 ملاحظات: ${req.notes}</div>` : ''}
                                                        <div class="mt-1 text-[10px] text-slate-500">مرسل من: 👮 ${req.officer_name} • ${new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                    </div>
                                                </div>
                                                <div class="flex items-center gap-1.5 flex-wrap sm:flex-nowrap flex-shrink-0 w-full sm:w-auto justify-end">
                                                    ${isPending ? `
                                                        <button type="button" onclick="Manager.handleDecideHoldRequest('${req.id}', 'approve_hold')" class="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl shadow-sm flex items-center gap-1 active:scale-95 transition-all text-xs flex-1 sm:flex-initial justify-center" title="اعتماد التعليق المؤقت للتصريح">
                                                            <span>⏸️</span>
                                                            <span>اعتماد التعليق</span>
                                                        </button>
                                                        <button type="button" onclick="Manager.handleDecideHoldRequest('${req.id}', 'approve_revoke')" class="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl shadow-sm flex items-center gap-1 active:scale-95 transition-all text-xs flex-1 sm:flex-initial justify-center" title="سحب وإلغاء التصريح نهائياً">
                                                            <span>⛔</span>
                                                            <span>سحب وإلغاء</span>
                                                        </button>
                                                        <button type="button" onclick="Manager.handleDecideHoldRequest('${req.id}', 'reject')" class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl border border-slate-300 shadow-xs flex items-center gap-1 active:scale-95 transition-all text-xs flex-1 sm:flex-initial justify-center" title="رفض طلب البوابة والإبقاء على التصريح سارياً">
                                                            <span>❌</span>
                                                            <span>رفض الطلب</span>
                                                        </button>
                                                    ` : `
                                                        <div class="text-xs font-bold text-slate-500">
                                                            ${req.manager_decision_notes || 'تم اتخاذ القرار'}
                                                        </div>
                                                    `}
                                                </div>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            `}
                        ` : `
                            <!-- INSPECTION REQUESTS LIST -->
                            ${requests.length === 0 ? `
                                <div class="text-center py-10 bg-[#f8fafc] rounded-2xl border border-dashed border-[#d7e2ee]">
                                    <div class="text-3xl mb-2">🛡️</div>
                                    <div class="text-xs font-bold text-[#556b82]">لا توجد طلبات استئذان مسجلة حالياً</div>
                                </div>
                            ` : `
                                <div class="space-y-3 max-h-96 overflow-y-auto pr-1">
                                    ${requests.map(req => {
                                        const isPending = req.status === 'pending';
                                        const isApproved = req.status === 'approved';
                                        const statusBadge = isPending 
                                            ? '<span class="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-xs font-black animate-pulse">⏳ بانتظار القرار</span>'
                                            : (isApproved ? '<span class="px-2.5 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-full text-xs font-black">✅ معتمد</span>' : '<span class="px-2.5 py-1 bg-rose-100 text-rose-900 border border-rose-300 rounded-full text-xs font-black">⛔ مرفوض</span>');

                                        return `
                                            <div class="p-4 rounded-2xl bg-white border-2 ${isPending ? 'border-amber-300 bg-amber-50/20' : 'border-[#d7e2ee]'} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm hover:border-[#0070f2] transition-all">
                                                <div class="space-y-1.5 flex-1">
                                                    <div class="flex items-center gap-2 flex-wrap">
                                                        <span class="font-black text-sm text-[#002b66]">${req.plate_ar}</span>
                                                        ${statusBadge}
                                                        <span class="text-[11px] text-[#556b82] font-mono">📍 ${req.gate_name}</span>
                                                    </div>
                                                    <div class="text-xs text-[#1d2d3e] font-bold">
                                                        <span>👤 السائق: ${req.driver_name}</span>
                                                        ${req.driver_phone ? `<span class="text-[#0070f2] font-mono"> (${req.driver_phone})</span>` : ''}
                                                        <span class="text-[#556b82]"> • 🏢 ${req.company}</span>
                                                    </div>
                                                    <div class="text-[11px] text-[#556b82]">
                                                        <span>📦 الحمولة: <b>${req.cargo_details}</b></span> • <span>📍 الوجهة: <b>${req.destination}</b></span>
                                                    </div>
                                                    <div class="text-[11px] text-amber-900 bg-amber-50 p-1.5 rounded-lg border border-amber-200">
                                                        📝 ملاحظات الحارس: <b>${req.notes}</b> (👮 ${req.officer_name})
                                                    </div>
                                                    <div class="flex items-center gap-2 pt-1">
                                                        ${req.plate_photo_url ? '<span class="text-[10px] bg-blue-50 text-[#0070f2] px-2 py-0.5 rounded border border-blue-200 font-bold">📸 صورة اللوحة مرفقة</span>' : ''}
                                                        ${req.carriage_photo_url ? '<span class="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200 font-bold">📸 صورة الصندوق مرفقة</span>' : ''}
                                                    </div>
                                                </div>
                                                <div class="flex items-center gap-1.5 flex-wrap sm:flex-nowrap flex-shrink-0 w-full sm:w-auto justify-end">
                                                    <button type="button" onclick="Manager.showRequestReviewModal('${req.id}')" class="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl shadow-sm flex items-center gap-1.5 active:scale-95 transition-all text-xs flex-1 sm:flex-initial justify-center" title="معاينة وفحص الصور بدقة">
                                                        <span>🔍</span>
                                                        <span>${isPending ? 'فحص الصور' : 'عرض التفاصيل'}</span>
                                                    </button>
                                                    ${isPending ? `
                                                        <button type="button" onclick="Manager.handleDecideRequest('${req.id}', 'approve')" class="px-3.5 py-2 bg-[#107e3e] hover:bg-[#0c6b33] text-white font-black rounded-xl shadow-sm flex items-center gap-1 active:scale-95 transition-all text-xs flex-1 sm:flex-initial justify-center" title="اعتماد فوري للدخول وتوليد التصريح">
                                                            <span>✅</span>
                                                            <span>اعتماد فوري</span>
                                                        </button>
                                                        <button type="button" onclick="Manager.handleDecideRequest('${req.id}', 'reject')" class="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl shadow-sm flex items-center gap-1 active:scale-95 transition-all text-xs flex-1 sm:flex-initial justify-center" title="رفض ومنع الدخول">
                                                            <span>⛔</span>
                                                            <span>رفض</span>
                                                        </button>
                                                    ` : ''}
                                                </div>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            `}
                        `}
                    </div>

                    <div class="flex justify-end pt-3 border-t border-[#d7e2ee]">
                        <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="px-4 py-2 sap-btn-secondary text-xs">
                            إغلاق
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    handleDecideHoldRequest(requestId, decision) {
        const user = window.Auth ? window.Auth.getCurrentUser() : { id: 1 };
        const res = window.DB.decidePermitHoldRequest(requestId, decision, '', user ? user.id : 1);
        if (res.success) {
            this.renderDashboard();
            this.openPendingRequestsModal('hold');
            const toastMsg = decision === 'approve_hold' 
                ? 'تم تعليق وتجميد صلاحية التصريح بنجاح ⏸️' 
                : (decision === 'approve_revoke' ? 'تم سحب وإلغاء التصريح نهائياً ⛔' : 'تم رفض الطلب والإبقاء على التصريح سارياً');
            if (window.App && typeof window.App.showToast === 'function') {
                window.App.showToast('⚠️ قرار تعليق التصريح', toastMsg, decision === 'reject' ? 'info' : 'warning');
            }
        } else {
            alert(res.message || 'حدث خطأ أثناء معالجة القرار');
        }
    }

    openHoldPermitModal(permitId) {
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) return;
        const lang = window.i18n.getLang();
        const permit = window.DB.getPermits().find(p => String(p.id) === String(permitId));
        if (!permit) return;
        const vehicle = window.DB.getVehicles().find(v => v.id === permit.vehicle_id) || {};

        modalContainer.innerHTML = `
            <div class="sap-modal-overlay fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onclick="if(event.target === this) document.getElementById('modal-container').innerHTML = ''">
                <div class="sap-modal-content bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-2 border-amber-400 animate-scaleUp text-right" dir="rtl">
                    <div class="flex justify-between items-center pb-3 border-b border-[#d7e2ee]">
                        <div class="flex items-center gap-2.5">
                            <span class="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-black text-xl border border-amber-300">⏸️</span>
                            <div>
                                <h3 class="text-base font-black text-[#002b66]">تعليق وتجميد التصريح مؤقتاً (Hold)</h3>
                                <p class="text-xs text-[#556b82]">إيقاف صلاحية الدخول عند البوابات حتى إشعار آخر</p>
                            </div>
                        </div>
                        <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm">✕</button>
                    </div>

                    <form onsubmit="event.preventDefault(); Manager.handleHoldPermit(${permit.id}, document.getElementById('hold-reason-select').value, document.getElementById('hold-notes-input').value)" class="py-4 space-y-4 text-xs">
                        <div class="bg-[#f8fafc] p-3.5 rounded-2xl border border-[#d7e2ee] space-y-1.5">
                            <div class="flex justify-between items-center">
                                <span class="text-[#556b82] font-bold">كود التصريح:</span>
                                <span class="font-mono font-black text-[#0070f2]">${permit.permit_code} (PIN: ${permit.pin_code})</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-[#556b82] font-bold">رقم اللوحة:</span>
                                <span class="font-black text-sm text-[#002b66]">${vehicle.plate_ar || '—'}</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-[#556b82] font-bold">اسم السائق:</span>
                                <span class="font-bold text-[#1d2d3e]">${vehicle.driver_name_ar || 'سائق مصرح'}</span>
                            </div>
                        </div>

                        <div>
                            <label class="block font-bold text-[#1d2d3e] mb-1.5">سبب التعليق / التجميد:</label>
                            <select id="hold-reason-select" required class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl p-2.5 text-xs font-bold text-[#1d2d3e]">
                                <option value="مراجعة أمنية وإدارية">مراجعة أمنية وإدارية</option>
                                <option value="فحص إضافي للحمولة والفواتير">فحص إضافي للحمولة والفواتير</option>
                                <option value="تأكيد هوية السائق والمورد">تأكيد هوية السائق والمورد</option>
                                <option value="مخالفة معايير السلامة عند البوابة">مخالفة معايير السلامة عند البوابة</option>
                                <option value="أخرى">أخرى (موضحة بالملاحظات)</option>
                            </select>
                        </div>

                        <div>
                            <label class="block font-bold text-[#1d2d3e] mb-1">تفاصيل وملاحظات إضافية:</label>
                            <textarea id="hold-notes-input" rows="3" placeholder="اكتب تفاصيل قرار التعليق لإبلاغ الضباط به عند البوابات..." class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl p-3 text-xs text-[#1d2d3e] focus:border-[#0070f2] focus:outline-none"></textarea>
                        </div>

                        <div class="flex justify-end gap-2 pt-3 border-t border-[#d7e2ee]">
                            <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="px-4 py-2 sap-btn-secondary text-xs">إلغاء</button>
                            <button type="submit" class="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5">
                                <span>⏸️</span>
                                <span>تأكيد تعليق التصريح</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    openRevokePermitModal(permitId) {
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) return;
        const permit = window.DB.getPermits().find(p => String(p.id) === String(permitId));
        if (!permit) return;
        const vehicle = window.DB.getVehicles().find(v => v.id === permit.vehicle_id) || {};

        modalContainer.innerHTML = `
            <div class="sap-modal-overlay fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onclick="if(event.target === this) document.getElementById('modal-container').innerHTML = ''">
                <div class="sap-modal-content bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-2 border-rose-500 animate-scaleUp text-right" dir="rtl">
                    <div class="flex justify-between items-center pb-3 border-b border-[#d7e2ee]">
                        <div class="flex items-center gap-2.5">
                            <span class="w-10 h-10 rounded-2xl bg-rose-100 text-rose-900 flex items-center justify-center font-black text-xl border border-rose-300">⛔</span>
                            <div>
                                <h3 class="text-base font-black text-rose-950">سحب وإلغاء التصريح نهائياً (Revoke)</h3>
                                <p class="text-xs text-[#556b82]">إلغاء صلاحية هذا الكود والـ PIN تماماً ومنع الدخول</p>
                            </div>
                        </div>
                        <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm">✕</button>
                    </div>

                    <form onsubmit="event.preventDefault(); Manager.handleRevokePermit(${permit.id}, document.getElementById('revoke-reason-select').value, document.getElementById('revoke-notes-input').value)" class="py-4 space-y-4 text-xs">
                        <div class="bg-[#fff5f5] p-3.5 rounded-2xl border border-rose-200 space-y-1.5">
                            <div class="flex justify-between items-center">
                                <span class="text-[#556b82] font-bold">كود التصريح:</span>
                                <span class="font-mono font-black text-rose-700">${permit.permit_code} (PIN: ${permit.pin_code})</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-[#556b82] font-bold">رقم اللوحة:</span>
                                <span class="font-black text-sm text-[#002b66]">${vehicle.plate_ar || '—'}</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-[#556b82] font-bold">اسم السائق:</span>
                                <span class="font-bold text-[#1d2d3e]">${vehicle.driver_name_ar || 'سائق مصرح'}</span>
                            </div>
                        </div>

                        <div>
                            <label class="block font-bold text-[#1d2d3e] mb-1.5">سبب السحب والإلغاء النهائي:</label>
                            <select id="revoke-reason-select" required class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl p-2.5 text-xs font-bold text-[#1d2d3e]">
                                <option value="إلغاء أمر التوريد / الشحن من الإدارة">إلغاء أمر التوريد / الشحن من الإدارة</option>
                                <option value="مخالفة أمنية جسيمة ومنع الدخول">مخالفة أمنية جسيمة ومنع الدخول</option>
                                <option value="عدم مطابقة الشاحنة والحمولة للمواصفات">عدم مطابقة الشاحنة والحمولة للمواصفات</option>
                                <option value="بيانات غير صحيحة أو مستندات ملغاة">بيانات غير صحيحة أو مستندات ملغاة</option>
                                <option value="أخرى">أخرى (موضحة بالملاحظات)</option>
                            </select>
                        </div>

                        <div>
                            <label class="block font-bold text-[#1d2d3e] mb-1">ملاحظات وقرار الإلغاء:</label>
                            <textarea id="revoke-notes-input" rows="3" placeholder="اكتب أسباب إلغاء وسحب التصريح نهائياً..." class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl p-3 text-xs text-[#1d2d3e] focus:border-rose-500 focus:outline-none"></textarea>
                        </div>

                        <div class="flex justify-end gap-2 pt-3 border-t border-[#d7e2ee]">
                            <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="px-4 py-2 sap-btn-secondary text-xs">إلغاء</button>
                            <button type="submit" class="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5">
                                <span>⛔</span>
                                <span>تأكيد سحب وإلغاء التصريح</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    handleHoldPermit(permitId, reason, notes = '') {
        const fullReason = reason + (notes ? ` - ${notes}` : '');
        window.DB.setPermitStatus(permitId, 'hold', fullReason);
        document.getElementById('modal-container').innerHTML = '';
        this.renderDashboard();
        if (window.App && typeof window.App.showToast === 'function') {
            window.App.showToast('⏸️ تعليق التصريح', 'تم تجميد صلاحية التصريح ومنع الدخول عند البوابات.', 'warning');
        }
    }

    handleRevokePermit(permitId, reason, notes = '') {
        const fullReason = reason + (notes ? ` - ${notes}` : '');
        window.DB.setPermitStatus(permitId, 'revoked', fullReason);
        document.getElementById('modal-container').innerHTML = '';
        this.renderDashboard();
        if (window.App && typeof window.App.showToast === 'function') {
            window.App.showToast('⛔ سحب وإلغاء التصريح', 'تم سحب وإلغاء التصريح نهائياً بنجاح.', 'danger');
        }
    }

    handleActivatePermit(permitId) {
        window.DB.setPermitStatus(permitId, 'active');
        document.getElementById('modal-container').innerHTML = '';
        this.renderDashboard();
        if (window.App && typeof window.App.showToast === 'function') {
            window.App.showToast('✅ تفعيل التصريح', 'تم إلغاء التعليق وإعادة تفعيل التصريح للبوابات بنجاح.', 'success');
        }
    }

    handleDeletePermit(permitId) {
        const lang = window.i18n.getLang();
        const permits = window.DB.getPermits();
        const permit = permits.find(p => String(p.id) === String(permitId));
        if (!permit) return;

        const confirmMsg = lang === 'ar'
            ? `⚠️ هل أنت متأكد من رغبتك في حذف وإلغاء التصريح (${permit.permit_code}) نهائياً من النظام؟\n(تم إنشاؤه بالخطأ قبل وصول ودخول المركبة للمصنع)`
            : `Are you sure you want to permanently delete pass (${permit.permit_code})?`;

        if (!confirm(confirmMsg)) return;

        const res = window.DB.deletePermit(permitId);
        if (res.success) {
            const modal = document.getElementById('modal-container');
            if (modal) modal.innerHTML = '';
            this.renderDashboard();
            if (window.App && typeof window.App.showToast === 'function') {
                window.App.showToast('🗑️ تم حذف التصريح', res.message, 'success');
            } else {
                alert(res.message);
            }
        } else {
            alert(res.message || 'تعذر حذف التصريح');
        }
    }

    showRequestReviewModal(requestId) {
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) return;
        const lang = window.i18n.getLang();
        const icon = (name, cls = 'w-4 h-4') => window.Icons ? window.Icons.get(name, cls) : '';
        const requests = window.DB.getInspectionRequests();
        const req = requests.find(r => String(r.id) === String(requestId));
        if (!req) return;

        const isPending = req.status === 'pending';

        modalContainer.innerHTML = `
            <div class="sap-modal-overlay fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onclick="if(event.target === this) document.getElementById('modal-container').innerHTML = ''">
                <div class="sap-modal-content bg-white rounded-2xl max-w-3xl w-full p-6 max-h-[92vh] overflow-y-auto shadow-2xl border border-[#d7e2ee]" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                    <div class="flex justify-between items-center pb-3 border-b border-[#d7e2ee]">
                        <div class="flex items-center gap-2">
                            <span class="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-black text-lg border border-amber-300">
                                🔍
                            </span>
                            <div>
                                <h3 class="text-base font-black text-[#002b66]">
                                    معاينة وفحص طلب استئذان المركبة (${req.plate_ar})
                                </h3>
                                <p class="text-xs text-[#556b82]">
                                    مرسل من: 👮 ${req.officer_name} عند 📍 ${req.gate_name}
                                </p>
                            </div>
                        </div>
                        <button type="button" onclick="Manager.openPendingRequestsModal()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm">✕</button>
                    </div>

                    <div class="py-4 space-y-4 text-xs">
                        
                        <!-- Egyptian Plate Preview -->
                        <div class="flex justify-center">
                            ${window.ArabicPlate ? window.ArabicPlate.renderEgyptianPlate(req.plate_ar, 'normal', req.vehicle_type) : `<div class="font-black text-xl text-[#002b66]">${req.plate_ar}</div>`}
                        </div>

                        <!-- Summary Details Table -->
                        <div class="bg-[#f8fafc] rounded-2xl p-4 border border-[#d7e2ee] space-y-2">
                            <div class="grid grid-cols-2 gap-2 border-b border-[#e7eff7] pb-1.5">
                                <div><span class="text-[#556b82] font-bold">اسم السائق:</span> <strong class="text-[#1d2d3e]">${req.driver_name}</strong></div>
                                <div><span class="text-[#556b82] font-bold">هاتف السائق:</span> <strong class="text-[#0070f2] font-mono">${req.driver_phone || 'غير مسجل'}</strong></div>
                            </div>
                            <div class="grid grid-cols-2 gap-2 border-b border-[#e7eff7] pb-1.5">
                                <div><span class="text-[#556b82] font-bold">الشركة / المورد:</span> <strong class="text-[#1d2d3e]">${req.company}</strong></div>
                                <div><span class="text-[#556b82] font-bold">الوجهة داخل المصنع:</span> <strong class="text-[#002b66]">${req.destination}</strong></div>
                            </div>
                            <div class="border-b border-[#e7eff7] pb-1.5">
                                <span class="text-[#556b82] font-bold">تفاصيل الحمولة:</span> <strong class="text-[#1d2d3e]">${req.cargo_details}</strong>
                            </div>
                            <div class="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-amber-900">
                                <span class="font-bold">📝 سبب الاستئذان من الحارس:</span> ${req.notes}
                            </div>
                        </div>

                        <!-- DUAL PHOTO HIGH-RES GALLERY (PLATE + CARRIAGE) -->
                        <div class="space-y-2">
                            <div class="font-black text-xs text-[#002b66]">
                                📸 الصور المرفقة من ضابط البوابة للمعاينة والتحقق:
                            </div>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                
                                <!-- PHOTO 1: CAR PLATE -->
                                <div class="bg-[#f8fafc] p-3 rounded-2xl border border-[#d7e2ee] text-center">
                                    <div class="font-bold text-[11px] text-[#002b66] mb-1.5">1️⃣ صورة لوحة السيارة (License Plate)</div>
                                    ${req.plate_photo_url ? `
                                        <a href="${req.plate_photo_url}" target="_blank" title="انقر لتكبير الصورة">
                                            <img src="${req.plate_photo_url}" alt="لوحة السيارة" class="w-full h-44 object-cover rounded-xl border border-[#b0cfee] shadow-sm hover:opacity-95 transition-all" />
                                        </a>
                                    ` : `
                                        <div class="h-44 rounded-xl border border-dashed border-[#d7e2ee] flex items-center justify-center text-[#8fa4b8] font-bold">
                                            لم يتم إرفاق صورة لوحة
                                        </div>
                                    `}
                                </div>

                                <!-- PHOTO 2: CARRIAGE / CARGO -->
                                <div class="bg-[#f8fafc] p-3 rounded-2xl border border-[#d7e2ee] text-center">
                                    <div class="font-bold text-[11px] text-[#002b66] mb-1.5">2️⃣ صورة صندوق / حمولة الشاحنة (Carriage)</div>
                                    ${req.carriage_photo_url ? `
                                        <a href="${req.carriage_photo_url}" target="_blank" title="انقر لتكبير الصورة">
                                            <img src="${req.carriage_photo_url}" alt="صندوق الشاحنة" class="w-full h-44 object-cover rounded-xl border border-[#b0cfee] shadow-sm hover:opacity-95 transition-all" />
                                        </a>
                                    ` : `
                                        <div class="h-44 rounded-xl border border-dashed border-[#d7e2ee] flex items-center justify-center text-[#8fa4b8] font-bold">
                                            لم يتم إرفاق صورة صندوق
                                        </div>
                                    `}
                                </div>

                            </div>
                        </div>

                        ${isPending ? `
                            <!-- Decision Actions -->
                            <div class="pt-3 border-t border-[#d7e2ee] flex flex-col sm:flex-row gap-2.5">
                                <button type="button" onclick="Manager.handleDecideRequest('${req.id}', 'reject')" class="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all">
                                    <span>⛔</span>
                                    <span>رفض ومنع دخول الشاحنة</span>
                                </button>
                                <button type="button" onclick="Manager.handleDecideRequest('${req.id}', 'approve')" class="flex-1 py-3 bg-[#107e3e] hover:bg-[#0c6b33] text-white font-black rounded-xl text-xs shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all">
                                    <span>✅</span>
                                    <span>اعتماد فوري وإصدار تصريح دخول</span>
                                </button>
                            </div>
                        ` : `
                            <div class="p-3 rounded-xl ${req.status === 'approved' ? 'bg-emerald-50 text-emerald-900 border border-emerald-300' : 'bg-rose-50 text-rose-900 border border-rose-300'} font-bold text-center">
                                ${req.status === 'approved' ? `✅ تم اعتماد الطلب وإصدار التصريح (${req.permit_code || ''})` : `⛔ تم رفض هذا الطلب: ${req.manager_decision_notes || ''}`}
                            </div>
                        `}

                    </div>
                </div>
            </div>
        `;
    }

    handleDecideRequest(requestId, decision) {
        const lang = window.i18n.getLang();
        const user = window.Auth ? window.Auth.getCurrentUser() : { id: 1 };
        let notes = '';

        if (decision === 'reject') {
            const promptMsg = lang === 'ar' ? 'سبب رفض الدخول (اختياري):' : 'Reason for rejection (optional):';
            notes = prompt(promptMsg, 'مرفوض من مدير العمليات') || 'مرفوض من مدير العمليات';
        }

        const res = window.DB.decideInspectionRequest(requestId, decision, notes, user ? user.id : 1);
        if (res.success) {
            this.renderDashboard();
            if (decision === 'approve' && res.permit) {
                this.showPassModal(res.permit.id);
                if (window.App && typeof window.App.showToast === 'function') {
                    window.App.showToast('✅ تم اعتماد الدخول', `تم إصدار التصريح (${res.permit.permit_code}) وإشعار ضابط البوابة فوراً.`, 'success');
                }
            } else {
                this.openPendingRequestsModal();
                if (window.App && typeof window.App.showToast === 'function') {
                    window.App.showToast('⛔ تم رفض الطلب', `تم تسجيل الرفض وإشعار ضابط البوابة فوراً.`, 'danger');
                }
            }
        } else {
            alert(res.message || 'حدث خطأ أثناء معالجة القرار');
        }
    }

    handleAddDestination(e) {
        e.preventDefault();
        const input = document.getElementById('new-destination-name');
        if (input && input.value.trim()) {
            window.DB.addDestination(input.value.trim());
            this.openSettingsModal('destinations');
        }
    }

    handleDeleteDestination(index) {
        if (confirm("هل أنت متأكد من رغبتك في حذف هذه الوجهة؟")) {
            window.DB.deleteDestination(index);
            this.openSettingsModal('destinations');
        }
    }

    async handleAddOfficer(e) {
        e.preventDefault();
        const name = document.getElementById('officer-name-input').value.trim();
        const badge = document.getElementById('officer-badge-input').value.trim();
        const pin = document.getElementById('officer-pin-input').value.trim();
        const gate = document.getElementById('officer-gate-select').value;

        await window.DB.addOfficer({
            name_ar: name,
            name_en: name,
            badge_id: badge,
            pin_code: pin,
            gate_assigned: gate
        });

        this.openSettingsModal('officers');
    }

    handleDeleteOfficer(id) {
        if (confirm("هل أنت متأكد من حذف فرد الأمن؟")) {
            window.DB.deleteOfficer(id);
            this.openSettingsModal('officers');
        }
    }

    restoreDemoData() {
        window.DB.loadDemoData();
        if (typeof document !== 'undefined' && document.getElementById('modal-container')) {
            document.getElementById('modal-container').innerHTML = '';
        }
        this.renderDashboard();
        alert(window.i18n.getLang() === 'ar' ? "تم استعادة وتعبئة البيانات والتصاريح النموذجية بنجاح!" : "Sample permits and vehicles restored successfully!");
    }

    resetAllData() {
        if (confirm(window.i18n.getLang() === 'ar'
            ? 'هل أنت متأكد؟ سيتم حذف كافة التصاريح والمركبات والسجلات من الذاكرة المحلية وقاعدة البيانات D1 السحابية!'
            : 'Are you sure? This will delete ALL permits, vehicles, and logs from both local storage and the cloud D1 database!')) {
            window.DB.clearAllData();
            if (typeof document !== 'undefined' && document.getElementById('modal-container')) {
                document.getElementById('modal-container').innerHTML = '';
            }
            this.renderDashboard();
            alert(window.i18n.getLang() === 'ar' ? 'تم مسح وتصفير كافة البيانات من الذاكرة المحلية وقاعدة D1 بنجاح!' : 'All data cleared from local storage and cloud D1 database!');
        }
    }

    resetPermitsOnly() {
        if (confirm(window.i18n.getLang() === 'ar'
            ? 'هل تريد مسح كافة التصاريح؟ سيتم حذفها من الذاكرة المحلية وقاعدة البيانات D1.'
            : 'Delete all permits from local storage and cloud D1 database?')) {
            window.DB.clearPermitsOnly();
            if (typeof document !== 'undefined' && document.getElementById('modal-container')) {
                document.getElementById('modal-container').innerHTML = '';
            }
            this.renderDashboard();
            alert(window.i18n.getLang() === 'ar' ? 'تم مسح كافة التصاريح من الذاكرة المحلية وقاعدة D1 بنجاح!' : 'All permits cleared from local storage and cloud D1!');
        }
    }

    resetLogsOnly() {
        if (confirm(window.i18n.getLang() === 'ar'
            ? 'هل تريد مسح كافة سجلات الدخول والخروج؟ سيتم حذفها من الذاكرة المحلية وقاعدة البيانات D1.'
            : 'Delete all entry/exit logs from local storage and cloud D1 database?')) {
            window.DB.clearLogsOnly();
            if (typeof document !== 'undefined' && document.getElementById('modal-container')) {
                document.getElementById('modal-container').innerHTML = '';
            }
            this.renderDashboard();
            alert(window.i18n.getLang() === 'ar' ? 'تم مسح كافة السجلات من الذاكرة المحلية وقاعدة D1 بنجاح!' : 'All logs cleared from local storage and cloud D1!');
        }
    }

    async handleTogglePush() {
        if (!window.PushService) return;
        const isEnabled = localStorage.getItem('gate_push_enabled') === 'true';
        const lang = window.i18n.getLang();
        const user = window.Auth ? window.Auth.getCurrentUser() : null;

        if (!isEnabled) {
            const res = await window.PushService.requestPermissionAndSubscribe('manager', user ? user.id : 1);
            if (res.success) {
                alert(lang === 'ar' ? '✅ تم تفعيل إشعارات الويب للمدير بنجاح!' : 'Push notifications enabled for manager!');
            } else {
                alert(lang === 'ar' ? `⚠️ تعذر تفعيل الإشعارات: ${res.message}` : `Could not enable push: ${res.message}`);
            }
        } else {
            await window.PushService.unsubscribe();
            alert(lang === 'ar' ? 'تم إيقاف إشعارات الويب' : 'Push notifications disabled');
        }
        this.openSettingsModal();
    }

    async handleTestPush() {
        if (!window.PushService) return;
        const lang = window.i18n.getLang();
        const res = await window.PushService.sendTestNotification();
        if (res) {
            if (window.App) {
                window.App.showToast(
                    lang === 'ar' ? '🔔 اختبار الإشعارات' : 'Test Alert',
                    lang === 'ar' ? 'تم إرسال إشعار تجريبي بنجاح!' : 'Test notification sent successfully!',
                    'success',
                    'shield'
                );
            }
        } else {
            alert(lang === 'ar' ? 'يرجى تفعيل الإشعارات أولاً بالضغط على زر "تفعيل الإشعارات"' : 'Please enable push notifications first.');
        }
    }

    isWatchingVehicle(vehicleId) {
        const watchlist = JSON.parse(localStorage.getItem('gate_vehicle_watchlist') || '[]');
        return watchlist.includes(vehicleId);
    }

    async toggleVehicleNotify(vehicleId) {
        const lang = window.i18n.getLang();
        const isEnabled = localStorage.getItem('gate_push_enabled') === 'true';
        if (!isEnabled) {
            alert(lang === 'ar' ? 'يرجى تفعيل الإشعارات أولاً من إعدادات النظام' : 'Enable notifications first in System Settings');
            return;
        }
        let watchlist = JSON.parse(localStorage.getItem('gate_vehicle_watchlist') || '[]');
        if (watchlist.includes(vehicleId)) {
            watchlist = watchlist.filter(id => id !== vehicleId);
        } else {
            watchlist.push(vehicleId);
        }
        localStorage.setItem('gate_vehicle_watchlist', JSON.stringify(watchlist));
        await window.DB.updateWatchlist(watchlist, false);
        this.renderDashboard();
    }

    async toggleWatchAll() {
        const lang = window.i18n.getLang();
        const isEnabled = localStorage.getItem('gate_push_enabled') === 'true';
        if (!isEnabled) {
            alert(lang === 'ar' ? 'يرجى تفعيل الإشعارات أولاً من إعدادات النظام' : 'Enable notifications first in System Settings');
            return;
        }
        localStorage.setItem('gate_vehicle_watchlist', JSON.stringify([]));
        await window.DB.updateWatchlist([], true);
        this.openSettingsModal('general');
    }


    saveSettings(e) {
        e.preventDefault();
        const whatsapp = document.getElementById('setting-default-whatsapp').value.trim();
        const company = document.getElementById('setting-company').value.trim();
        const overstay = parseInt(document.getElementById('setting-overstay').value) || 3;

        window.DB.updateSettings({
            default_whatsapp: whatsapp,
            company_name_ar: company,
            overstay_hours_threshold: overstay
        });

        document.getElementById('modal-container').innerHTML = '';
        alert(window.i18n.getLang() === 'ar' ? 'تم حفظ الإعدادات ورقم واتساب الافتراضي بنجاح' : 'Settings saved successfully');
        this.renderDashboard();
    }

    openQuickPermitModal(prefill = null) {
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) return;
        const lang = window.i18n.getLang();
        const settings = window.DB.getSettings();
        const destinations = window.DB.getDestinations();
        const icon = (name, cls = 'w-4 h-4') => window.Icons ? window.Icons.get(name, cls) : '';

        const plateVal = prefill?.plate || '';
        const phoneVal = prefill?.phone || '';
        const permitTypeVal = prefill?.permit_type || 'entry';
        const destVal = prefill?.destination || destinations[0] || 'المستودع الرئيسي';
        const invoiceVal = prefill?.invoice_no || '';
        const cargoVal = prefill?.cargo_details || 'بضائع ومواد مصرحة';
        const driverVal = prefill?.driver_name || '';
        const companyVal = prefill?.company || '';
        const vehicleTypeVal = prefill?.vehicle_type || 'truckHeavy';

        modalContainer.innerHTML = `
            <div class="sap-modal-overlay fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onclick="if(event.target === this) document.getElementById('modal-container').innerHTML = ''">
                <div class="sap-modal-content bg-white rounded-3xl w-full max-w-lg border border-[#b0cfee] shadow-2xl p-6 relative animate-scaleUp max-h-[92vh] overflow-y-auto ${lang === 'ar' ? 'text-right' : 'text-left'}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                    <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="absolute top-4 ${lang === 'ar' ? 'left-4' : 'right-4'} text-[#556b82] hover:text-[#1d2d3e] text-xl font-bold">
                        ✕
                    </button>

                    <div class="flex items-center gap-3 mb-4 border-b border-[#d7e2ee] pb-3">
                        <div class="w-12 h-12 rounded-2xl bg-[#ebf3fb] text-[#0070f2] flex items-center justify-center border border-[#b3d5fa] shadow-sm">
                            ${icon('bolt', 'w-6 h-6 text-[#0070f2]')}
                        </div>
                        <div>
                            <h3 class="text-lg font-black text-[#002b66]">${lang === 'ar' ? 'إصدار تصريح بوابة (دخول / خروج بضائع)' : 'Create Gate Access Pass'}</h3>
                            <p class="text-xs text-[#556b82] font-semibold">${lang === 'ar' ? 'حدد نوع التصريح وبيانات اللوحة والسائق ومراجعتها قبل التوليد' : 'Select Entry or Exit pass, verify plate & driver info'}</p>
                        </div>
                    </div>

                    <form id="quick-permit-form" onsubmit="Manager.handleReviewStep(event)">
                        
                        <!-- 1. Permit Type Selector (Entry vs Exit / Dispatch) -->
                        <div class="mb-4">
                            <label class="block text-xs font-bold text-[#1d2d3e] mb-1.5">
                                📌 نوع التصريح المطلوب:
                            </label>
                            <div class="grid grid-cols-3 gap-2 bg-[#f5f8fc] p-1.5 rounded-2xl border border-[#d7e2ee]">
                                <label class="cursor-pointer">
                                    <input type="radio" name="permit_type" value="entry" ${permitTypeVal === 'entry' ? 'checked' : ''} onchange="Manager.togglePermitTypeFields('entry')" class="hidden peer" />
                                    <div class="py-2.5 px-2 rounded-xl text-center font-bold text-xs transition-all peer-checked:bg-[#107e3e] peer-checked:text-white peer-checked:shadow-sm text-[#556b82] hover:text-[#1d2d3e]">
                                        📥 تصريح دخول
                                    </div>
                                </label>
                                <label class="cursor-pointer">
                                    <input type="radio" name="permit_type" value="exit" ${permitTypeVal === 'exit' ? 'checked' : ''} onchange="Manager.togglePermitTypeFields('exit')" class="hidden peer" />
                                    <div class="py-2.5 px-2 rounded-xl text-center font-bold text-xs transition-all peer-checked:bg-[#0070f2] peer-checked:text-white peer-checked:shadow-sm text-[#556b82] hover:text-[#1d2d3e]">
                                        📤 تصريح خروج
                                    </div>
                                </label>
                                <label class="cursor-pointer">
                                    <input type="radio" name="permit_type" value="both" ${permitTypeVal === 'both' ? 'checked' : ''} onchange="Manager.togglePermitTypeFields('both')" class="hidden peer" />
                                    <div class="py-2.5 px-2 rounded-xl text-center font-bold text-xs transition-all peer-checked:bg-[#b85500] peer-checked:text-white peer-checked:shadow-sm text-[#556b82] hover:text-[#1d2d3e]">
                                        🔄 دخول وخروج
                                    </div>
                                </label>
                            </div>
                        </div>

                        <!-- 2. Vehicle Plate -->
                        <div class="bg-[#f8fafc] p-4 rounded-2xl border-2 border-[#b0cfee] mb-3 shadow-sm">
                            <label class="block text-xs font-bold text-[#1d2d3e] mb-1.5 flex justify-between items-center">
                                <span>1️⃣ ${lang === 'ar' ? 'رقم لوحة المركبة (مثال: ط ر ق ٩ ٨ ٢ ١):' : 'Vehicle Plate Number:'}</span>
                                <button type="button" onclick="Manager.toggleKeypad('quick-keypad', 'quick-plate')" class="text-[#0070f2] hover:text-[#005cbd] text-xs font-bold flex items-center gap-1">
                                    ${icon('keyboard', 'w-3.5 h-3.5')}
                                    <span>${window.i18n.t('arabicKeyboard')}</span>
                                </button>
                            </label>
                            
                            <input type="text" id="quick-plate" required placeholder="ط ر ق ٩ ٨ ٢ ١" value="${plateVal}" class="w-full bg-white border-2 border-[#d7e2ee] rounded-xl px-4 py-2.5 text-[#1d2d3e] font-black text-lg focus:border-[#0070f2] focus:outline-none" oninput="Manager.updateQuickPlatePreview(this.value)" />

                            <div id="quick-keypad" class="hidden">
                                ${window.ArabicPlate.renderArabicKeypad('quick-plate')}
                            </div>

                            <!-- Duplicate Active Permit Alert Container -->
                            <div id="duplicate-permit-alert" class="hidden mt-2 p-2.5 bg-amber-50 rounded-xl border border-amber-300 text-xs text-amber-900 flex items-center justify-between">
                            </div>

                            <div class="mt-2.5 flex items-center justify-between bg-white p-2.5 rounded-xl border border-[#d7e2ee]">
                                <span class="text-xs text-[#556b82] font-bold">${lang === 'ar' ? 'معاينة اللوحة:' : 'Preview:'}</span>
                                <div id="quick-plate-preview">
                                    ${window.ArabicPlate.renderEgyptianPlate(plateVal || 'ط ر ق ٩ ٨ ٢ ١', 'compact')}
                                </div>
                            </div>
                        </div>

                        <!-- 3. Driver Phone Number -->
                        <div class="bg-[#f8fafc] p-4 rounded-2xl border-2 border-[#b0cfee] mb-3 shadow-sm">
                            <label class="block text-xs font-bold text-[#1d2d3e] mb-1.5">
                                2️⃣ ${lang === 'ar' ? 'رقم هاتف / واتساب السائق (لإرسال كارت التصريح له):' : 'Driver Phone / WhatsApp:'}
                            </label>
                            <div class="relative">
                                <span class="absolute ${lang === 'ar' ? 'right-3' : 'left-3'} top-3 text-[#0070f2] font-bold text-sm">
                                    ${icon('phone', 'w-4 h-4')}
                                </span>
                                <input type="tel" id="quick-phone" required placeholder="01012345678 أو +201012345678" value="${phoneVal}" class="w-full bg-white border-2 border-[#d7e2ee] rounded-xl ${lang === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 text-[#1d2d3e] font-mono font-bold text-base focus:border-[#0070f2] focus:outline-none" />
                            </div>
                        </div>

                        <!-- 4. Exit / Material Specific Fields -->
                        <div id="exit-permit-fields" class="${permitTypeVal === 'entry' ? 'hidden' : ''} bg-[#ebf3fb] p-4 rounded-2xl border-2 border-[#b3d5fa] mb-3 space-y-2.5">
                            <div class="text-xs font-black text-[#002b66] flex items-center gap-1.5">
                                <span>📦 بيانات إذن الصرف وخروج المواد:</span>
                            </div>
                            <div class="grid grid-cols-2 gap-2">
                                <div>
                                    <label class="block text-[11px] text-[#556b82] mb-1 font-bold">رقم إذن الصرف / الفاتورة</label>
                                    <input type="text" id="quick-invoice-no" placeholder="INV-2026-880" value="${invoiceVal}" class="w-full bg-white border border-[#b3d5fa] rounded-lg p-2 text-[#1d2d3e] text-xs font-mono font-bold" />
                                </div>
                                <div>
                                    <label class="block text-[11px] text-[#556b82] mb-1 font-bold">وصف الحمولة / البضاعة</label>
                                    <input type="text" id="quick-cargo" placeholder="أسمدة نتروجينية - 25 طن" value="${cargoVal}" class="w-full bg-white border border-[#b3d5fa] rounded-lg p-2 text-[#1d2d3e] text-xs font-semibold" />
                                </div>
                            </div>
                        </div>

                        <!-- 5. Destination & Extra Info -->
                        <div class="bg-[#f0f4f8] rounded-2xl p-3.5 border border-[#d7e2ee] mb-4 space-y-2.5 text-xs">
                            <div class="grid grid-cols-2 gap-2">
                                <div>
                                    <label class="block text-[11px] text-[#556b82] mb-1 font-bold">📍 الوجهة / المستودع</label>
                                    <select id="quick-destination" class="w-full bg-white border border-[#d7e2ee] rounded-lg p-2 text-[#1d2d3e] text-xs font-bold">
                                        ${destinations.map(d => `<option value="${d}" ${d === destVal ? 'selected' : ''}>${d}</option>`).join('')}
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-[11px] text-[#556b82] mb-1 font-bold">نوع المركبة</label>
                                    <select id="quick-type" class="w-full bg-white border border-[#d7e2ee] rounded-lg p-2 text-[#1d2d3e] text-xs font-bold">
                                        <option value="truckHeavy" ${vehicleTypeVal === 'truckHeavy' ? 'selected' : ''}>🔴 نقل ثقيل / تريلا</option>
                                        <option value="truckMedium" ${vehicleTypeVal === 'truckMedium' ? 'selected' : ''}>🔴 نقل متوسط / دينا</option>
                                        <option value="van" ${vehicleTypeVal === 'van' ? 'selected' : ''}>🟡 فان بضائع</option>
                                        <option value="tanker" ${vehicleTypeVal === 'tanker' ? 'selected' : ''}>🔴 صهريج وقود</option>
                                        <option value="car" ${vehicleTypeVal === 'car' ? 'selected' : ''}>🔵 سيارة ملاكي</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-[11px] text-[#556b82] mb-1 font-bold">اسم السائق (اختياري)</label>
                                    <input type="text" id="quick-driver-name" placeholder="سائق مصرح" value="${driverVal}" class="w-full bg-white border border-[#d7e2ee] rounded-lg p-2 text-[#1d2d3e] text-xs font-semibold" />
                                </div>
                                <div>
                                    <label class="block text-[11px] text-[#556b82] mb-1 font-bold">الشركة / المورد (اختياري)</label>
                                    <input type="text" id="quick-company" placeholder="توريدات عامة" value="${companyVal}" class="w-full bg-white border border-[#d7e2ee] rounded-lg p-2 text-[#1d2d3e] text-xs font-semibold" />
                                </div>
                            </div>
                        </div>

                        <div class="flex justify-end gap-3 pt-1">
                            <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="px-4 py-2.5 sap-btn-secondary text-xs">
                                ${lang === 'ar' ? 'إلغاء' : 'Cancel'}
                            </button>
                            <button type="submit" class="flex-1 py-3 sap-btn-primary text-sm flex items-center justify-center gap-2 font-bold shadow-md">
                                <span>🔍</span>
                                <span>${lang === 'ar' ? 'مراجعة وتأكيد التصريح قبل التوليد' : 'Review & Confirm Pass'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        if (plateVal) {
            this.updateQuickPlatePreview(plateVal);
        }
    }

    togglePermitTypeFields(type) {
        const exitFields = document.getElementById('exit-permit-fields');
        if (exitFields) {
            if (type === 'exit' || type === 'both') {
                exitFields.classList.remove('hidden');
            } else {
                exitFields.classList.add('hidden');
            }
        }
    }

    updateQuickPlatePreview(val) {
        const preview = document.getElementById('quick-plate-preview');
        if (preview) {
            preview.innerHTML = window.ArabicPlate.renderEgyptianPlate(val || 'ط ر ق ٩ ٨ ٢ ١', 'compact');
        }

        const alertBox = document.getElementById('duplicate-permit-alert');
        if (alertBox && val && val.trim().length > 3) {
            const activePermit = window.DB.findActivePermitByPlate(val);
            if (activePermit) {
                alertBox.classList.remove('hidden');
                alertBox.innerHTML = `
                    <div class="flex items-center gap-1.5">
                        <span>⚠️ يوجد تصريح نشط مسبقاً (${activePermit.permit_code})</span>
                    </div>
                    <button type="button" onclick="Manager.showPassModal(${activePermit.id})" class="px-2 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded font-bold text-[10px]">
                        عرض الكارت الحالي
                    </button>
                `;
            } else {
                alertBox.classList.add('hidden');
            }
        }
    }

    toggleKeypad(boxId, inputId) {
        const box = document.getElementById(boxId);
        if (box) box.classList.toggle('hidden');
    }

    /**
     * STEP 1: Review Before Execution Modal (مراجعة وتأكيد قبل الاعتماد)
     */
    handleReviewStep(e) {
        e.preventDefault();
        const plate = document.getElementById('quick-plate').value.trim();
        const phone = document.getElementById('quick-phone').value.trim();
        const permitType = document.querySelector('input[name="permit_type"]:checked')?.value || 'entry';
        const destination = document.getElementById('quick-destination')?.value || 'المستودع الرئيسي';
        const invoiceNo = document.getElementById('quick-invoice-no')?.value.trim() || '';
        const cargoDetails = document.getElementById('quick-cargo')?.value.trim() || 'بضائع ومواد مصرحة';
        const driverName = document.getElementById('quick-driver-name')?.value.trim() || 'سائق مصرح';
        const company = document.getElementById('quick-company')?.value.trim() || 'توريدات عامة';
        const vehicleType = document.getElementById('quick-type')?.value || 'truckHeavy';

        const payload = {
            plate, phone, permit_type: permitType, destination,
            invoice_no: invoiceNo, cargo_details: cargoDetails,
            driver_name: driverName, company, vehicle_type: vehicleType
        };

        this.renderReviewModal(payload);
    }

    renderReviewModal(data) {
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) return;
        const lang = window.i18n.getLang();
        const icon = (name, cls = 'w-4 h-4') => window.Icons ? window.Icons.get(name, cls) : '';

        this._quickPermitData = [data];
        const idx = 0;

        const typeLabels = {
            entry: { label: '📥 تصريح دخول معتمد (Entry Pass)', color: 'bg-[#e5f6eb] text-[#107e3e] border-[#b4e3c4]' },
            exit: { label: '📤 تصريح خروج بضائع معتمد (Exit Pass)', color: 'bg-[#ebf3fb] text-[#0070f2] border-[#b3d5fa]' },
            both: { label: '🔄 تصريح دخول وخروج (Roundtrip Pass)', color: 'bg-[#fff1e5] text-[#b85500] border-[#ffd8b3]' }
        };
        const typeBadge = typeLabels[data.permit_type] || typeLabels.entry;

        modalContainer.innerHTML = `
            <div class="sap-modal-overlay fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onclick="if(event.target === this) document.getElementById('modal-container').innerHTML = ''">
                <div class="sap-modal-content bg-white rounded-3xl w-full max-w-lg border-2 border-[#0070f2] shadow-2xl p-6 relative animate-scaleUp max-h-[92vh] overflow-y-auto ${lang === 'ar' ? 'text-right' : 'text-left'}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                    
                    <!-- Header -->
                    <div class="flex items-center gap-3 mb-4 border-b border-[#d7e2ee] pb-3">
                        <div class="w-12 h-12 rounded-2xl bg-[#ebf3fb] text-[#0070f2] flex items-center justify-center border border-[#b3d5fa] shadow-sm">
                            ${icon('shield', 'w-6 h-6')}
                        </div>
                        <div>
                            <h3 class="text-lg font-black text-[#002b66]">مراجعة وتأكيد بيانات التصريح</h3>
                            <p class="text-xs text-[#556b82] font-semibold">يرجى مراجعة كافة البيانات قبل الاعتماد النهائي والإرسال</p>
                        </div>
                    </div>

                    <!-- Permit Type Tag -->
                    <div class="p-2.5 rounded-xl border ${typeBadge.color} text-xs font-black text-center mb-4">
                        ${typeBadge.label}
                    </div>

                    <!-- Egyptian Plate Preview -->
                    <div class="flex justify-center mb-4">
                        ${window.ArabicPlate.renderEgyptianPlate(data.plate, 'normal', data.vehicle_type)}
                    </div>

                    <!-- Summary Verification Table -->
                    <div class="bg-[#f8fafc] rounded-2xl p-4 border border-[#d7e2ee] text-xs space-y-2.5 mb-5">
                        <div class="flex justify-between border-b border-[#e7eff7] pb-1.5">
                            <span class="text-[#556b82] font-bold">هاتف وواتساب السائق:</span>
                            <span class="font-mono font-black text-[#0070f2]">${data.phone}</span>
                        </div>
                        <div class="flex justify-between border-b border-[#e7eff7] pb-1.5">
                            <span class="text-[#556b82] font-bold">اسم السائق:</span>
                            <span class="font-bold text-[#1d2d3e]">${data.driver_name}</span>
                        </div>
                        <div class="flex justify-between border-b border-[#e7eff7] pb-1.5">
                            <span class="text-[#556b82] font-bold">الجهة / المورد:</span>
                            <span class="font-semibold text-[#1d2d3e]">${data.company}</span>
                        </div>
                        <div class="flex justify-between border-b border-[#e7eff7] pb-1.5">
                            <span class="text-[#556b82] font-bold">الوجهة داخل المصنع:</span>
                            <span class="font-bold text-[#002b66]">${data.destination}</span>
                        </div>
                        ${data.invoice_no ? `
                            <div class="flex justify-between border-b border-[#e7eff7] pb-1.5">
                                <span class="text-[#556b82] font-bold">رقم إذن الصرف / الفاتورة:</span>
                                <span class="font-mono font-black text-[#107e3e]">${data.invoice_no}</span>
                            </div>
                        ` : ''}
                        ${data.cargo_details ? `
                            <div class="flex justify-between">
                                <span class="text-[#556b82] font-bold">تفاصيل الحمولة:</span>
                                <span class="font-semibold text-[#1d2d3e]">${data.cargo_details}</span>
                            </div>
                        ` : ''}
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex gap-2">
                        <button type="button" onclick='Manager.handleQuickPermitEdit(${idx})' class="px-4 py-3 sap-btn-secondary text-xs font-bold flex items-center gap-1">
                            <span>✏️</span>
                            <span>تعديل البيانات</span>
                        </button>
                        <button type="button" onclick='Manager.handleQuickPermitConfirm(${idx})' class="flex-1 py-3 bg-[#107e3e] hover:bg-[#0c6b33] text-white font-black rounded-xl text-sm shadow-md flex items-center justify-center gap-2">
                            ${icon('check', 'w-5 h-5 text-white')}
                            <span>✅ تأكيد واعتماد وتوليد التصريح</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * STEP 2: Finalize Permit and Render QR Pass Modal
     */
    finalizeQuickPermit(data) {
        let vehicle = window.DB.findVehicleByPlate(data.plate);
        if (!vehicle) {
            vehicle = window.DB.addVehicle({
                plate_ar: data.plate,
                plate_en: data.plate,
                vehicle_type: data.vehicle_type || 'truckHeavy',
                driver_name_ar: data.driver_name || 'سائق مصرح',
                driver_name_en: data.driver_name || 'Authorized Driver',
                driver_phone: data.phone,
                company_ar: data.company || 'توريدات عامة',
                company_en: data.company || 'General Supplies',
                status: 'visitor'
            });
        } else {
            vehicle.driver_phone = data.phone;
        }

        // Expire any existing active permit to prevent duplicates
        window.DB.expireExistingPermitsForVehicle(vehicle.id);

        const permit = window.DB.addPermit({
            vehicle_id: vehicle.id,
            permit_type: data.permit_type || 'entry',
            destination_ar: data.destination,
            destination_en: data.destination,
            invoice_no: data.invoice_no || '',
            cargo_details: data.cargo_details || 'بضائع ومواد مصرحة',
            purpose_ar: data.permit_type === 'exit' ? 'تصريح خروج بضائع معتمد' : 'تصريح دخول سريع',
            purpose_en: data.permit_type === 'exit' ? 'Materials Exit Pass' : 'Fast Entry Pass',
            valid_from: new Date().toISOString(),
            valid_until: new Date(Date.now() + 8 * 3600000).toISOString()
        });

        document.getElementById('modal-container').innerHTML = '';
        this.renderDashboard();
        this.showPassModal(permit.id);
    }

    /**
     * Render Digital Pass Modal with Live Generated Image & Centered A4 Print
     */
    showPassModal(permitId) {
        const permits = window.DB.getPermits();
        const permit = permits.find(p => p.id === permitId);
        if (!permit) return;
        const vehicle = window.DB.getVehicles().find(v => v.id === permit.vehicle_id);
        if (!vehicle) return;

        const lang = window.i18n.getLang();
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) return;
        const settings = window.DB.getSettings();
        const icon = (name, cls = 'w-4 h-4') => window.Icons ? window.Icons.get(name, cls) : '';

        const isExit = permit.permit_type === 'exit';
        const isBoth = permit.permit_type === 'both';
        const typeLabel = isExit ? '📤 تصريح خروج بضائع معتمد (EXIT PASS)' : (isBoth ? '🔄 تصريح دخول وخروج معتمد' : '🟢 تصريح دخول معتمد (AUTHORIZED)');
        const typeColor = isExit ? 'bg-[#ebf3fb] text-[#0070f2] border-[#b3d5fa]' : 'bg-[#e5f6eb] text-[#107e3e] border-[#b4e3c4]';

        const logs = window.DB.getLogs();
        const insideLog = window.DB.isVehicleInside(permit.vehicle_id);
        const hasVehicleEntered = permit.status === 'used' || logs.some(l => l.permit_id === permit.id) || (!!insideLog && (insideLog.permit_id === permit.id || (permit.created_at && window.DB.parseTimestamp(insideLog.timestamp).getTime() >= window.DB.parseTimestamp(permit.created_at).getTime() - 60000)));

        const qrPayload = JSON.stringify({
            permit: permit.permit_code,
            pin: permit.pin_code || '',
            plate: vehicle.plate_ar,
            type: permit.permit_type || 'entry'
        });

        const validUntilText = new Date(permit.valid_until).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const validDateText = new Date(permit.valid_until).toLocaleDateString([], { year: 'numeric', month: '2-digit', day: '2-digit' });

        modalContainer.innerHTML = `
            <div class="sap-modal-overlay fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto modal-backdrop" onclick="if(event.target === this) document.getElementById('modal-container').innerHTML = ''">
                <div class="sap-modal-content bg-white rounded-3xl w-full max-w-lg border border-[#b0cfee] shadow-2xl p-6 relative animate-scaleUp max-h-[92vh] overflow-y-auto ${lang === 'ar' ? 'text-right' : 'text-left'}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                    
                    <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="no-print absolute top-4 ${lang === 'ar' ? 'left-4' : 'right-4'} text-[#556b82] hover:text-[#1d2d3e] text-xl font-bold">
                        ✕
                    </button>

                    <!-- Official Standard A4 Printable Document Container -->
                    <div id="printable-pass-card" class="bg-white p-5 rounded-2xl border-2 ${isExit ? 'border-[#0070f2]' : 'border-[#002b66]'} shadow-sm text-center mb-4">
                        
                        <!-- Official DOTRA Header (Print Optimized) -->
                        <div class="flex items-center justify-between border-b-2 border-[#002b66] pb-3 mb-4 text-right" dir="rtl">
                            <div class="flex items-center gap-3">
                                <img src="assets/logo.jpg" alt="DOTRA" class="h-12 w-auto object-contain" />
                                <div>
                                    <div class="font-black text-base text-[#002b66]">${settings.company_name_ar || 'مجموعة دوترا للصناعات'}</div>
                                    <div class="text-[11px] text-[#556b82] font-bold">إدارة الأمن والسلامة المهنية • ${isExit ? 'تصريح خروج بضائع ومواد رسمي' : 'تصريح دخول البوابة الرسمي'}</div>
                                </div>
                            </div>
                            <div class="text-left" dir="ltr">
                                <span class="inline-block px-3 py-1 ${typeColor} border rounded-full text-xs font-black">
                                    ${isExit ? '📤 EXIT PASS' : '🟢 ENTRY PASS'}
                                </span>
                                <div class="text-[10px] text-[#556b82] font-mono mt-1 font-bold">${permit.permit_code}</div>
                            </div>
                        </div>

                        <!-- Type Badge -->
                        <div class="mb-3">
                            <span class="inline-block px-4 py-1.5 rounded-full text-xs font-black border ${typeColor}">
                                ${typeLabel}
                            </span>
                        </div>

                        <!-- Egyptian License Plate Badge (Centered) -->
                        <div class="mb-4 flex justify-center">
                            ${window.ArabicPlate.renderEgyptianPlate(vehicle.plate_ar, 'normal', vehicle.vehicle_type)}
                        </div>

                        <!-- QR Code Container (Large & Centered) -->
                        <div class="bg-white p-3 rounded-2xl shadow-inner inline-flex items-center justify-center my-1 border-2 border-[#d7e2ee] min-w-[160px] min-h-[160px]" id="qrcode-canvas-box">
                        </div>

                        <!-- 5-Digit Offline Verification PIN Container -->
                        <div class="my-2 bg-[#f0fdf4] border-2 border-dashed border-[#107e3e] p-2.5 rounded-2xl flex items-center justify-between shadow-sm">
                            <div class="text-right">
                                <div class="text-[11px] text-[#107e3e] font-black">🔑 كود التحقق السريع (5 أرقام):</div>
                                <div class="text-[10px] text-[#556b82]">للتحقق الفوري عند انقطاع الشبكة أو الكاميرا</div>
                            </div>
                            <div class="font-mono text-xl font-black tracking-widest text-[#002b66] bg-white px-3.5 py-1 rounded-xl border border-[#b4e3c4] shadow-inner">
                                ${permit.pin_code || '84920'}
                            </div>
                        </div>

                        <!-- Tabular Permit Details (High Clarity Table for Print) -->
                        <div class="bg-[#f8fafc] rounded-xl p-4 border border-[#d7e2ee] text-xs text-right mt-2 space-y-2" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                            <div class="grid grid-cols-2 gap-2 border-b border-[#e7eff7] pb-1.5">
                                <div>
                                    <span class="text-[#556b82] font-bold">رقم التصريح: </span>
                                    <span class="font-mono font-black text-[#0070f2]">${permit.permit_code}</span>
                                </div>
                                <div>
                                    <span class="text-[#556b82] font-bold">رمز التحقق السريع: </span>
                                    <span class="font-mono font-black text-[#107e3e] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">${permit.pin_code || '84920'}</span>
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-2 border-b border-[#e7eff7] pb-1.5">
                                <div>
                                    <span class="text-[#556b82] font-bold">اسم السائق: </span>
                                    <span class="font-bold text-[#1d2d3e]">${vehicle.driver_name_ar || 'سائق مصرح'}</span>
                                </div>
                                <div>
                                    <span class="text-[#556b82] font-bold">هاتف السائق: </span>
                                    <span class="font-mono font-black text-[#107e3e]">${vehicle.driver_phone || 'غير مسجل'}</span>
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-2 ${permit.invoice_no ? 'border-b border-[#e7eff7] pb-1.5' : ''}">
                                <div>
                                    <span class="text-[#556b82] font-bold">الشركة / الجهة: </span>
                                    <span class="font-semibold text-[#1d2d3e]">${vehicle.company_ar || 'توريدات عامة'}</span>
                                </div>
                                <div>
                                    <span class="text-[#556b82] font-bold">الوجهة بالمصنع: </span>
                                    <span class="font-semibold text-[#002b66]">${permit.destination_ar || 'المستودع الرئيسي'}</span>
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-2 border-b border-[#e7eff7] pb-1.5">
                                <div>
                                    <span class="text-[#556b82] font-bold">منشئ التصريح: </span>
                                    <span class="font-bold text-[#1d2d3e]">${permit.created_by_name || 'إدارة العمليات'}</span>
                                </div>
                                <div>
                                    <span class="text-[#556b82] font-bold">معتمد التصريح: </span>
                                    <span class="font-black text-[#002b66]">${permit.approved_by_name || 'م. أحمد فؤاد (مدير العمليات)'}</span>
                                </div>
                            </div>

                            ${permit.invoice_no ? `
                                <div class="grid grid-cols-2 gap-2">
                                    <div>
                                        <span class="text-[#556b82] font-bold">رقم إذن الصرف: </span>
                                        <span class="font-mono font-black text-[#107e3e]">${permit.invoice_no}</span>
                                    </div>
                                    <div>
                                        <span class="text-[#556b82] font-bold">الحمولة المصرحة: </span>
                                        <span class="font-bold text-[#1d2d3e]">${permit.cargo_details || 'بضائع مصرحة'}</span>
                                    </div>
                                </div>
                            ` : ''}
                        </div>

                        <!-- Official Signature Boxes (Appears on Print) -->
                        <div class="print-signature-box hidden text-xs text-right" dir="rtl">
                            <div class="p-3 border border-[#cbd5e1] rounded-lg">
                                <div class="font-bold text-[#002b66] mb-8">توقيع واعتماد ضابط أمن البوابة:</div>
                                <div class="border-b border-dashed border-[#94a3b8]"></div>
                                <div class="text-[10px] text-[#64748b] mt-1">مطابقة اللوحة والحمولة والتوقيع الرسمي</div>
                            </div>
                            <div class="p-3 border border-[#cbd5e1] rounded-lg">
                                <div class="font-bold text-[#002b66] mb-8">توقيع واستلام سائق المركبة:</div>
                                <div class="border-b border-dashed border-[#94a3b8]"></div>
                                <div class="text-[10px] text-[#64748b] mt-1">استلام البضاعة وإقرار الخروج النظامي</div>
                            </div>
                        </div>
                    </div>

                    <!-- Screen Action Buttons (Hidden on Print) -->
                    <div class="no-print flex flex-col gap-2.5">
                        
                        <!-- Send to Driver WhatsApp -->
                        <button type="button" onclick="Manager.shareWhatsAppImage('${permit.permit_code}', '${vehicle.plate_ar}', '${vehicle.driver_phone || ''}', '${lang === 'ar' ? vehicle.driver_name_ar : vehicle.driver_name_en}', '${validUntilText}', '${permit.permit_type || 'entry'}')" class="w-full py-3.5 bg-[#107e3e] hover:bg-[#0c6b33] text-white font-black rounded-xl shadow-md text-sm flex items-center justify-center gap-2 transition-transform hover:-translate-y-0.5">
                            ${icon('whatsapp', 'w-5 h-5 text-white')}
                            <span>${lang === 'ar' ? `إرسال كصورة لواتساب السائق (${vehicle.driver_phone || 'غير مسجل'})` : 'Send Image to Driver WhatsApp'}</span>
                        </button>

                        <!-- Send to Default Dispatcher Number -->
                        <button type="button" onclick="Manager.shareWhatsAppImage('${permit.permit_code}', '${vehicle.plate_ar}', '${settings.default_whatsapp || ''}', '${lang === 'ar' ? vehicle.driver_name_ar : vehicle.driver_name_en}', '${validUntilText}', '${permit.permit_type || 'entry'}')" class="w-full py-2.5 bg-[#0070f2] hover:bg-[#005cbd] text-white font-bold rounded-xl shadow-sm text-xs flex items-center justify-center gap-2">
                            ${icon('building', 'w-4 h-4 text-white')}
                            <span>${lang === 'ar' ? `إرسال للرقم الافتراضي للبوابة / الإدارة (${settings.default_whatsapp})` : 'Send to Default Dispatcher'}</span>
                        </button>

                        <!-- Manager Authority Controls: Hold / Suspend vs Reactivate -->
                        <div class="p-3 rounded-2xl border ${permit.status === 'hold' ? 'bg-amber-50 border-amber-300' : 'bg-[#f8fafc] border-[#d7e2ee]'} text-xs">
                            <div class="flex items-center justify-between mb-2">
                                <span class="font-bold text-[#002b66] flex items-center gap-1.5">
                                    <span>🛡️</span>
                                    <span>صلاحيات وتصرفات مدير العمليات:</span>
                                </span>
                                <span class="text-[11px] font-bold ${permit.status === 'hold' ? 'text-amber-800' : 'text-emerald-700'}">
                                    الحالة: ${permit.status === 'hold' ? '⏸️ معلق بقرار الإدارة' : '🟢 تصريح ساري وصالح'}
                                </span>
                            </div>
                            ${permit.status === 'hold' ? `
                                <button type="button" onclick="Manager.togglePermitHold(${permit.id}, 'active')" class="w-full py-2.5 bg-[#107e3e] hover:bg-[#0c6b33] text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all">
                                    <span>▶️</span>
                                    <span>إلغاء التعليق وإعادة تفعيل التصريح للبوابة</span>
                                </button>
                            ` : `
                                <button type="button" onclick="Manager.togglePermitHold(${permit.id}, 'hold')" class="w-full py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all">
                                    <span>⏸️</span>
                                    <span>تعليق هذا التصريح وتجميد الصلاحية مؤقتاً (Hold)</span>
                                </button>
                            `}
                        </div>

                        <div class="grid grid-cols-2 gap-2">
                            <button type="button" onclick="Manager.printPass()" class="py-2.5 sap-btn-secondary text-xs flex items-center justify-center gap-1.5 font-bold">
                                ${icon('printer', 'w-4 h-4')}
                                <span>${lang === 'ar' ? 'طباعة تصريح A4 معتمد' : 'Print A4 Pass'}</span>
                            </button>
                            <button type="button" onclick="Manager.downloadPassImage('${permit.permit_code}', '${vehicle.plate_ar}', '${vehicle.driver_phone || ''}', '${permit.permit_type || 'entry'}')" class="py-2.5 sap-btn-secondary text-xs flex items-center justify-center gap-1.5 font-bold">
                                ${icon('download', 'w-4 h-4')}
                                <span>${lang === 'ar' ? 'تحميل كصورة (PNG)' : 'Download Image'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const qrBox = document.getElementById('qrcode-canvas-box');
        if (window.QREngine && qrBox && typeof qrBox.appendChild === 'function') {
            window.QREngine.render('qrcode-canvas-box', qrPayload, { size: 160 });
        }
    }

    toggleQuickActionsMenu(event) {
        if (event && event.stopPropagation) event.stopPropagation();
        const dropdown = document.getElementById('quick-actions-dropdown');
        const arrow = document.getElementById('quick-actions-arrow');
        if (!dropdown) return;
        const isHidden = dropdown.classList.contains('hidden');
        if (isHidden) {
            dropdown.classList.remove('hidden');
            if (arrow) arrow.style.transform = 'rotate(180deg)';
            const closeListener = (e) => {
                const btn = document.getElementById('btn-quick-actions-menu');
                if (dropdown && !dropdown.contains(e.target) && (!btn || !btn.contains(e.target))) {
                    dropdown.classList.add('hidden');
                    if (arrow) arrow.style.transform = 'rotate(0deg)';
                    document.removeEventListener('click', closeListener);
                }
            };
            setTimeout(() => document.addEventListener('click', closeListener), 10);
        } else {
            dropdown.classList.add('hidden');
            if (arrow) arrow.style.transform = 'rotate(0deg)';
        }
    }

    closeQuickActionsMenu() {
        const dropdown = document.getElementById('quick-actions-dropdown');
        const arrow = document.getElementById('quick-actions-arrow');
        if (dropdown) dropdown.classList.add('hidden');
        if (arrow) arrow.style.transform = 'rotate(0deg)';
    }

    async togglePermitHold(permitId, desiredStatus) {
        const lang = window.i18n.getLang();
        const permits = window.DB.getPermits();
        const permit = permits.find(p => p.id === permitId);
        if (!permit) return;

        let reason = '';
        if (desiredStatus === 'hold') {
            const promptMsg = lang === 'ar' ? 'يرجى كتابة سبب تعليق / تجميد التصريح (اختياري):' : 'Enter reason for suspending pass (optional):';
            reason = prompt(promptMsg, 'مراجعة إدارية / تعليق مؤقت') || 'مراجعة إدارية';
        }

        try {
            window.DB.setPermitStatus(permitId, desiredStatus, reason);
            const msg = desiredStatus === 'hold' 
                ? (lang === 'ar' ? '⏸️ تم تعليق التصريح وتجميد صلاحية الدخول عند البوابة بنجاح' : 'Permit put on hold')
                : (lang === 'ar' ? '✅ تم إلغاء التعليق وإعادة تفعيل التصريح بنجاح' : 'Permit reactivated');
            
            if (window.App && typeof window.App.showToast === 'function') {
                window.App.showToast(lang === 'ar' ? 'صلاحيات التصاريح' : 'Permit Authority', msg, desiredStatus === 'hold' ? 'warning' : 'success');
            }
            
            // Re-render
            this.renderDashboard();
            const modal = document.getElementById('printable-pass-card');
            if (modal) {
                this.showPassModal(permitId);
            }
        } catch (err) {
            alert(err.message);
        }
    }

    printPass() {
        const oldTitle = document.title;
        document.title = `DOTRA_Gate_Permit_${Date.now()}`;
        window.print();
        document.title = oldTitle;
    }

    createPassCanvasDataUrl(permitCode, plate, phone, driverName, validUntil, permitType = 'entry', invoiceNo = '', cargoDetails = '', pinCode = '') {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const width = 600;
        const height = 880;
        canvas.width = width;
        canvas.height = height;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);

        const isExit = permitType === 'exit';
        const isBoth = permitType === 'both';

        // Header Background
        const headerGradient = ctx.createLinearGradient(0, 0, width, 0);
        if (isExit) {
            headerGradient.addColorStop(0, "#002b66");
            headerGradient.addColorStop(1, "#005cbd");
        } else {
            headerGradient.addColorStop(0, "#002b66");
            headerGradient.addColorStop(1, "#004b99");
        }
        ctx.fillStyle = headerGradient;
        ctx.fillRect(0, 0, width, 120);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 24px 'Cairo', 'Tajawal', sans-serif";
        ctx.textAlign = "right";
        ctx.fillText(isExit ? "مجموعة دوترا - تصريح خروج بضائع رسمي" : "مجموعة دوترا - تصريح دخول البوابة", width - 30, 52);

        ctx.font = "bold 14px 'Cairo', sans-serif";
        ctx.fillStyle = isExit ? "#bae6fd" : "#a5f3fc";
        ctx.fillText(isExit ? "DOTRA Group - Official Materials & Goods Exit Pass" : "DOTRA Group - Vehicle Gate Access Permit", width - 30, 84);

        // Logo circle
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(65, 60, 42, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#002b66";
        ctx.font = "900 20px 'Cairo', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("DOTRA", 65, 62);
        ctx.fillStyle = "#107e3e";
        ctx.font = "bold 11px 'Cairo', sans-serif";
        ctx.fillText("دوترا", 65, 78);

        // Authorization Badge
        if (isExit) {
            ctx.fillStyle = "#ebf3fb";
            ctx.strokeStyle = "#0070f2";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(160, 135, 280, 40, 20);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = "#0070f2";
            ctx.font = "bold 17px 'Cairo', sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("📤 تصريح خروج بضائع معتمد (EXIT PASS)", 300, 161);
        } else if (isBoth) {
            ctx.fillStyle = "#fff1e5";
            ctx.strokeStyle = "#b85500";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(160, 135, 280, 40, 20);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = "#b85500";
            ctx.font = "bold 17px 'Cairo', sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("🔄 تصريح دخول وخروج (ROUNDTRIP)", 300, 161);
        } else {
            ctx.fillStyle = "#e5f6eb";
            ctx.strokeStyle = "#107e3e";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(160, 135, 280, 40, 20);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = "#107e3e";
            ctx.font = "bold 17px 'Cairo', sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("🟢 تصريح دخول معتمد (AUTHORIZED)", 300, 161);
        }

        // Egyptian License Plate
        const plateY = 190;
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#1e293b";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(110, plateY, 380, 110, 14);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#dc2626";
        ctx.fillRect(112, plateY + 2, 376, 30);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px 'Cairo', monospace";
        ctx.textAlign = "left";
        ctx.fillText("EGYPT", 130, plateY + 22);
        ctx.textAlign = "center";
        ctx.fillText("نقل", 300, plateY + 22);
        ctx.textAlign = "right";
        ctx.fillText("مصر", 470, plateY + 22);

        const parsed = window.ArabicPlate ? window.ArabicPlate.parsePlateParts(plate) : { numbers: '٩٨٢١', letters: 'ط ر ق' };
        const digits = window.ArabicPlate ? window.ArabicPlate.toEasternArabicDigits(parsed.numbers) : parsed.numbers;

        ctx.fillStyle = "#0f172a";
        ctx.font = "bold 34px 'Cairo', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(digits || '٩٨٢١', 200, plateY + 78);
        
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(300, plateY + 32);
        ctx.lineTo(300, plateY + 105);
        ctx.stroke();

        ctx.fillText(parsed.letters || 'ط ر ق', 400, plateY + 78);

        // QR Code
        const qrPayload = JSON.stringify({
            permit: permitCode,
            pin: pinCode,
            type: permitType,
            plate: plate,
            phone: phone
        });

        if (window.QREngine) {
            ctx.fillStyle = "#ffffff";
            ctx.strokeStyle = "#d7e2ee";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(205, 315, 190, 190, 16);
            ctx.fill();
            ctx.stroke();

            window.QREngine.drawToCanvas(ctx, qrPayload, 215, 325, 170, '#002b66', '#ffffff');
        }

        // 5-Digit Offline Verification PIN Badge
        if (pinCode) {
            ctx.fillStyle = "#f0fdf4";
            ctx.strokeStyle = "#16a34a";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(140, 520, 320, 42, 12);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = "#15803d";
            ctx.font = "bold 13px 'Cairo', sans-serif";
            ctx.textAlign = "right";
            ctx.fillText("رمز التحقق السريع (5 أرقام):", 445, 546);

            ctx.fillStyle = "#002b66";
            ctx.font = "900 22px monospace";
            ctx.textAlign = "left";
            ctx.fillText(pinCode, 160, 549);
        }

        // Details Panel
        const infoY = 575;
        ctx.fillStyle = "#f8fafc";
        ctx.strokeStyle = "#d7e2ee";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(40, infoY, 520, 225, 16);
        ctx.fill();
        ctx.stroke();

        ctx.font = "bold 16px 'Cairo', sans-serif";
        ctx.textAlign = "right";

        ctx.fillStyle = "#556b82";
        ctx.fillText("كود التصريح:", 530, infoY + 38);
        ctx.fillStyle = isExit ? "#0070f2" : "#002b66";
        ctx.fillText(permitCode, 380, infoY + 38);

        ctx.fillStyle = "#556b82";
        ctx.fillText("هاتف السائق:", 530, infoY + 75);
        ctx.fillStyle = "#107e3e";
        ctx.fillText(phone || "غير مسجل", 380, infoY + 75);

        ctx.fillStyle = "#556b82";
        ctx.fillText("اسم السائق:", 530, infoY + 112);
        ctx.fillStyle = "#1d2d3e";
        ctx.fillText(driverName || "سائق مصرح", 380, infoY + 112);

        if (invoiceNo) {
            ctx.fillStyle = "#556b82";
            ctx.fillText("رقم إذن الصرف:", 530, infoY + 148);
            ctx.fillStyle = "#b85500";
            ctx.fillText(invoiceNo, 380, infoY + 148);
        } else {
            ctx.fillStyle = "#556b82";
            ctx.fillText("نوع الإجراء:", 530, infoY + 148);
            ctx.fillStyle = isExit ? "#0070f2" : "#107e3e";
            ctx.fillText(isExit ? "خروج بضائع ومواد" : "دخول مصرح", 380, infoY + 148);
        }

        ctx.fillStyle = "#556b82";
        ctx.fillText("صالح حتى:", 530, infoY + 185);
        ctx.fillStyle = "#b85500";
        ctx.fillText(validUntil, 380, infoY + 185);

        ctx.fillStyle = "#556b82";
        ctx.font = "bold 13px 'Cairo', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("يرجى إبراز هذا الرمز أو الرقم الخماسي لضابط البوابة • نظام بوابات دوترا الذكي", 300, 845);

        return canvas.toDataURL('image/png');
    }

    dataURItoBlob(dataURI) {
        const byteString = atob(dataURI.split(',')[1]);
        const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([ab], { type: mimeString });
    }

    async shareWhatsAppImage(permitCode, plate, phone, driverName, validUntil, permitType = 'entry') {
        const permit = window.DB.getPermits().find(p => p.permit_code === permitCode) || {};
        const dataUrl = this.createPassCanvasDataUrl(
            permitCode, 
            plate, 
            phone, 
            driverName, 
            validUntil, 
            permitType, 
            permit.invoice_no || '', 
            permit.cargo_details || '', 
            permit.pin_code || ''
        );
        const blob = this.dataURItoBlob(dataUrl);
        const file = new File([blob], `DOTRA_${permitType === 'exit' ? 'ExitPass' : 'EntryPass'}_${permitCode}.png`, { type: 'image/png' });

        this.downloadPassImage(permitCode, plate, phone, permitType);

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: `تصريح ${permitType === 'exit' ? 'خروج بضائع' : 'دخول'} بوابة دوترا - ${permitCode}`,
                    text: `🛡️ تصريح ${permitType === 'exit' ? 'خروج بضائع ومواد' : 'دخول'} بوابة مصانع دوترا\nرقم التصريح: ${permitCode}\n🔑 رمز التحقق: ${permit.pin_code || ''}\n🚘 رقم لوحة المركبة: ${plate}\n📞 هاتف: ${phone}\nصالح حتى: ${validUntil}`
                });
                return;
            } catch (err) {
                console.log("Native share dismissed:", err);
            }
        }

        this.shareWhatsApp(permitCode, plate, phone, permitType, permit.pin_code);
    }

    downloadPassImage(permitCode, plate, phone, permitType = 'entry') {
        const vehicle = window.DB.findVehicleByPlate(plate) || {};
        const permit = window.DB.getPermits().find(p => p.permit_code === permitCode) || {};
        const dataUrl = this.createPassCanvasDataUrl(
            permitCode, 
            plate, 
            phone, 
            vehicle.driver_name_ar || 'سائق مصرح', 
            new Date(Date.now() + 8 * 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            permitType,
            permit.invoice_no || '',
            permit.cargo_details || '',
            permit.pin_code || ''
        );
        
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `DOTRA_${permitType === 'exit' ? 'ExitPass' : 'Pass'}_${permitCode}_${plate.replace(/\s+/g, '_')}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    shareWhatsApp(permitCode, plate, phone, permitType = 'entry', pinCode = '') {
        const typeText = permitType === 'exit' ? 'خروج بضائع ومواد' : 'دخول';
        const text = encodeURIComponent(`🛡️ تصريح ${typeText} بوابة مصانع دوترا\nرقم التصريح: ${permitCode}\n🔑 رمز التحقق السريع: ${pinCode || ''}\n🚘 رقم لوحة المركبة: ${plate}\nيرجى إبراز هذا الرمز لمسؤول البوابة.`);
        const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
        const url = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('0') ? '2' + cleanPhone : cleanPhone}?text=${text}` : `https://api.whatsapp.com/send?text=${text}`;
        window.open(url, '_blank');
    }

    toggleBlacklist(vehicleId) {
        const vehicle = window.DB.getVehicles().find(v => v.id === vehicleId);
        if (!vehicle) return;
        const lang = window.i18n.getLang();

        if (vehicle.status === 'blacklist') {
            window.DB.updateVehicleStatus(vehicleId, 'visitor', '');
            alert(lang === 'ar' ? 'تم إلغاء حظر المركبة والسماح لها بالدخول' : 'Vehicle unbanned');
        } else {
            const reason = prompt(window.i18n.t('denyReasonPrompt'), lang === 'ar' ? 'مخالفة تعليمات السلامة' : 'Safety violation');
            if (reason) {
                window.DB.updateVehicleStatus(vehicleId, 'blacklist', reason);
                alert(lang === 'ar' ? 'تم إدراج المركبة في القائمة السوداء والمحظورة' : 'Vehicle blacklisted');
            }
        }
        this.renderDashboard();
    }

    exportExcel() {
        const lang = window.i18n ? window.i18n.getLang() : 'ar';
        const permits = window.DB.getPermits();
        const vehicles = window.DB.getVehicles();
        const logs = window.DB.getLogs();
        const users = window.DB.getUsers();

        let headers = [];
        let rowsHtml = '';
        let fileName = '';

        if (this.activeFilter === 'permits' || permits.length > 0) {
            fileName = `DOTRA_Permits_${new Date().toISOString().split('T')[0]}`;
            headers = [
                'م',
                'كود التصريح',
                'رمز التحقق PIN',
                'رقم اللوحة',
                'نوع التصريح',
                'الوجهة داخل المصنع',
                'تفاصيل الحمولة',
                'رقم إذن الصرف / الفاتورة',
                'اسم السائق',
                'هاتف السائق',
                'الشركة الموردة',
                'الحالة',
                'تاريخ الإصدار',
                'منشئ التصريح',
                'معتمد التصريح',
                'بوابة الدخول',
                'ضابط أمن البوابة'
            ];

            rowsHtml = permits.map((p, idx) => {
                const vehicle = vehicles.find(v => v.id === p.vehicle_id) || {};
                const log = logs.find(l => l.permit_id === p.id || l.vehicle_id === p.vehicle_id);
                const officer = log ? users.find(u => u.id === log.officer_id) : null;
                const gateName = log ? log.gate_name : '--';
                const officerName = officer ? officer.name_ar : '--';

                const pCode = p.permit_code || '';
                const pin = p.pin_code || '';
                const plate = vehicle.plate_ar || p.plate || '';
                const type = p.permit_type === 'exit' ? 'خروج بضائع' : (p.permit_type === 'both' ? 'دخول وخروج' : 'دخول');
                const dest = p.destination_ar || 'المستودع الرئيسي';
                const invoice = p.invoice_no || '';
                const cargo = p.cargo_details || 'بضائع ومواد';
                const driver = vehicle.driver_name_ar || p.driver_name || 'سائق مصرح';
                const phone = vehicle.driver_phone || p.phone || '';
                const company = vehicle.company_ar || 'عام';
                const status = p.status === 'active' ? 'ساري' : (p.status === 'hold' ? 'معلق' : (p.status === 'used' ? 'تم الاستخدام' : 'ملغي'));
                const validFrom = p.valid_from ? new Date(p.valid_from).toLocaleString('ar-EG') : '';
                const createdBy = p.created_by_name || 'إدارة العمليات';
                const approvedBy = p.approved_by_name || 'مدير العمليات';

                return `
                    <tr>
                        <td style="text-align:center;">${idx + 1}</td>
                        <td style="font-family:monospace;font-weight:bold;color:#0070f2;mso-number-format:'\\@';">${pCode}</td>
                        <td style="font-family:monospace;font-weight:bold;color:#b85500;text-align:center;mso-number-format:'\\@';">${pin}</td>
                        <td style="font-weight:bold;color:#002b66;text-align:center;mso-number-format:'\\@';">${plate}</td>
                        <td style="text-align:center;">${type}</td>
                        <td style="font-weight:bold;color:#002b66;">${dest}</td>
                        <td>${cargo}</td>
                        <td style="mso-number-format:'\\@';">${invoice}</td>
                        <td style="font-weight:bold;">${driver}</td>
                        <td style="mso-number-format:'\\@';text-align:center;">${phone}</td>
                        <td>${company}</td>
                        <td style="text-align:center;font-weight:bold;">${status}</td>
                        <td style="mso-number-format:'\\@';text-align:center;">${validFrom}</td>
                        <td>${createdBy}</td>
                        <td>${approvedBy}</td>
                        <td>${gateName}</td>
                        <td>${officerName}</td>
                    </tr>
                `;
            }).join('');
        } else {
            fileName = `DOTRA_Gate_Logs_${new Date().toISOString().split('T')[0]}`;
            headers = [
                'م',
                'رقم الحركة',
                'رقم اللوحة',
                'هاتف السائق',
                'اسم السائق',
                'الشركة الموردة',
                'بوابة الدخول',
                'نوع الإجراء',
                'تاريخ ووقت الدخول',
                'تاريخ ووقت الخروج',
                'المدة بالدقائق',
                'ملاحظات'
            ];

            rowsHtml = logs.map((log, idx) => {
                const vehicle = vehicles.find(v => v.id === log.vehicle_id) || {};
                const entryDate = log.timestamp ? new Date(log.timestamp).toLocaleString('ar-EG') : '--';
                const exitDate = log.exit_timestamp ? new Date(log.exit_timestamp).toLocaleString('ar-EG') : '--';

                return `
                    <tr>
                        <td style="text-align:center;">${idx + 1}</td>
                        <td style="text-align:center;font-weight:bold;">${log.id}</td>
                        <td style="font-weight:bold;color:#002b66;text-align:center;mso-number-format:'\\@';">${vehicle.plate_ar || ''}</td>
                        <td style="mso-number-format:'\\@';text-align:center;">${vehicle.driver_phone || ''}</td>
                        <td style="font-weight:bold;">${vehicle.driver_name_ar || ''}</td>
                        <td>${vehicle.company_ar || ''}</td>
                        <td>${log.gate_name || ''}</td>
                        <td style="text-align:center;">${log.action_type || ''}</td>
                        <td style="mso-number-format:'\\@';text-align:center;">${entryDate}</td>
                        <td style="mso-number-format:'\\@';text-align:center;">${exitDate}</td>
                        <td style="text-align:center;font-weight:bold;">${log.duration_minutes || 0}</td>
                        <td>${log.remarks || ''}</td>
                    </tr>
                `;
            }).join('');
        }

        const excelHtml = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <!--[if gte mso 9]>
                <xml>
                    <x:ExcelWorkbook>
                        <x:ExcelWorksheets>
                            <x:ExcelWorksheet>
                                <x:Name>بيانات التصاريح والحركات</x:Name>
                                <x:WorksheetOptions>
                                    <x:DisplayRightToLeft/>
                                    <x:Selected/>
                                </x:WorksheetOptions>
                            </x:ExcelWorksheet>
                        </x:ExcelWorksheets>
                    </x:ExcelWorkbook>
                </xml>
                <![endif]-->
                <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
                <style>
                    table { border-collapse: collapse; width: 100%; direction: rtl; font-family: Segoe UI, Tahoma, Arial, sans-serif; font-size: 12px; }
                    th { background-color: #002b66; color: #ffffff; font-weight: bold; border: 1px solid #001940; padding: 10px 8px; text-align: center; font-size: 12px; }
                    td { border: 1px solid #d7e2ee; padding: 8px 10px; text-align: right; vertical-align: middle; }
                    tr:nth-child(even) { background-color: #f8fafc; }
                </style>
            </head>
            <body dir="rtl">
                <table>
                    <thead>
                        <tr>
                            ${headers.map(h => `<th>${h}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>
            </body>
            </html>
        `;

        if (typeof document !== 'undefined' && document.createElement && typeof Blob !== 'undefined' && typeof URL !== 'undefined') {
            try {
                const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${fileName}.xls`;
                if (document.body && typeof document.body.appendChild === 'function') {
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                } else {
                    a.click();
                }
                URL.revokeObjectURL(url);
            } catch(e) {
                console.error('Export Excel error:', e);
            }
        }
        return excelHtml;
    }

    exportCSV() {
        return this.exportExcel();
    }

    // --- Pre-Arrival Manifest (Excel / CSV Import & Export) ---
    downloadExcelTemplate() {
        const excelContent = window.DB.getExcelTemplate();
        if (typeof document !== 'undefined' && document.createElement && typeof Blob !== 'undefined' && typeof URL !== 'undefined') {
            try {
                const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `نموذج_كشف_الوصول_المسبق_دوترا.xls`;
                if (document.body && typeof document.body.appendChild === 'function') {
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                } else {
                    a.click();
                }
                URL.revokeObjectURL(url);
            } catch(e) {
                console.error('Download Excel error:', e);
            }
        }
    }

    downloadCsvTemplate() {
        const template = window.DB.getCsvTemplate();
        if (typeof document !== 'undefined' && document.createElement && typeof Blob !== 'undefined' && typeof URL !== 'undefined') {
            try {
                const blob = new Blob(["\ufeff" + template], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `نموذج_كشف_الوصول_المسبق_دوترا.csv`;
                if (document.body && typeof document.body.appendChild === 'function') {
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                } else {
                    a.click();
                }
                URL.revokeObjectURL(url);
            } catch(e) {}
        }
    }

    exportExpectedArrivalsExcel() {
        const excelContent = window.DB.exportExpectedArrivalsToExcel();
        if (typeof document !== 'undefined' && document.createElement && typeof Blob !== 'undefined' && typeof URL !== 'undefined') {
            try {
                const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `كشف_الشاحنات_المتوقع_وصولها_دوترا_${new Date().toISOString().split('T')[0]}.xls`;
                if (document.body && typeof document.body.appendChild === 'function') {
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                } else {
                    a.click();
                }
                URL.revokeObjectURL(url);
            } catch(e) {
                console.error('Export Expected Arrivals Excel error:', e);
            }
        }
    }

    openImportCsvModal() {
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) return;
        const lang = window.i18n.getLang();
        const icon = (name, cls = 'w-4 h-4') => window.Icons ? window.Icons.get(name, cls) : '';
        const expected = window.DB.getExpectedArrivals();

        modalContainer.innerHTML = `
            <div class="sap-modal-overlay fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onclick="if(event.target === this) document.getElementById('modal-container').innerHTML = ''">
                <div class="sap-modal-content bg-white rounded-2xl max-w-3xl w-full p-5 max-h-[92vh] overflow-y-auto shadow-2xl border border-[#d7e2ee]" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                    <div class="flex justify-between items-center pb-3 border-b border-[#d7e2ee]">
                        <h3 class="text-base font-black text-[#002b66] flex items-center gap-2">
                            ${icon('table', 'w-5 h-5 text-emerald-600')}
                            <span>${lang === 'ar' ? '📥 استيراد وإدارة كشف الشاحنات المتوقع وصولها (Excel Sheet / CSV)' : 'Import Expected Trucks Manifest (Excel / CSV)'}</span>
                        </h3>
                        <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm">✕</button>
                    </div>

                    <form onsubmit="Manager.submitImportCsv(event)" class="py-3 space-y-4">
                        <!-- Top Banner with Download & Export Actions -->
                        <div class="bg-[#ebf3fb] p-3.5 rounded-2xl border border-[#b3d5fa] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div>
                                <div class="text-xs font-black text-[#002b66]">
                                    ${lang === 'ar' ? '📊 كشف الوصول المسبق للشاحنات (Excel Sheet Manifest)' : 'Pre-Arrivals Daily Manifest'}
                                </div>
                                <div class="text-[11px] text-[#556b82] mt-0.5">
                                    ${lang === 'ar' ? 'قم برفع شيت Excel (.xls/.xlsx) أو ملف CSV، لتظهر الشاحنات للحارس على البوابات فوراً للاعتماد السريع.' : 'Upload expected trucks Excel sheet or CSV table.'}
                                </div>
                            </div>
                            <div class="flex items-center gap-2 flex-wrap">
                                <button type="button" onclick="Manager.downloadExcelTemplate()" class="px-3.5 py-2 bg-[#107e3e] hover:bg-[#0c6b33] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm flex-shrink-0 transition-all" title="تحميل شيت إكسيل معتمد جاهز للتعبئة">
                                    <span>📗</span>
                                    <span>${lang === 'ar' ? 'نموذج Excel (.xls)' : 'Excel Template'}</span>
                                </button>
                                <button type="button" onclick="Manager.downloadCsvTemplate()" class="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-[#002b66] rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm flex-shrink-0 transition-all" title="تحميل ملف CSV نصي">
                                    <span>📄</span>
                                    <span>CSV</span>
                                </button>
                                ${expected.length > 0 ? `
                                    <button type="button" onclick="Manager.exportExpectedArrivalsExcel()" class="px-3 py-2 bg-[#0070f2] hover:bg-[#005bb5] text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm flex-shrink-0 transition-all" title="تصدير الشاحنات المتوقعة حالياً إلى إكسيل">
                                        <span>📊</span>
                                        <span>تصدير الحالي</span>
                                    </button>
                                ` : ''}
                            </div>
                        </div>

                        <!-- File Picker Box -->
                        <div class="border-2 border-dashed border-[#b0cfee] hover:border-[#0070f2] rounded-2xl p-4 text-center bg-[#f8fafc] transition-all">
                            <label class="cursor-pointer flex flex-col items-center justify-center gap-2">
                                <span class="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shadow-sm">
                                    ${icon('table', 'w-5 h-5')}
                                </span>
                                <span class="text-xs font-bold text-[#002b66]">
                                    ${lang === 'ar' ? 'اختر ملف Excel (.xls / .xlsx) أو CSV من جهازك أو اسحبه هنا' : 'Choose Excel (.xls/.xlsx) or CSV file'}
                                </span>
                                <span class="text-[10px] text-[#8fa4b8]">يدعم .xls, .xlsx, .csv, .txt (التعرف التلقائي على الجداول والخلايا)</span>
                                <input type="file" accept=".xlsx, .xls, .csv, .txt" onchange="Manager.handleCsvFileUpload(event)" class="hidden" />
                            </label>
                        </div>

                        <!-- Textarea Input (Allows pasting directly from Excel Cells) -->
                        <div>
                            <div class="flex justify-between items-center mb-1.5">
                                <label class="text-xs font-bold text-[#1d2d3e]">
                                    ${lang === 'ar' ? 'أو الصق بيانات خلايا الإكسيل مباشرة أدناه (Copy/Paste):' : 'Or paste Excel cells / CSV data directly:'}
                                </label>
                                <button type="button" onclick="Manager.loadSampleDataIntoTextarea()" class="text-[11px] text-[#0070f2] hover:underline font-bold">
                                    ${lang === 'ar' ? '⚡ تجربة بيانات نموذجية' : 'Load Sample'}
                                </button>
                            </div>
                            <textarea id="csv-import-textarea" oninput="Manager.updateCsvPreview()" rows="4" placeholder="${window.DB.getCsvTemplate()}" class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl p-3 text-xs font-mono text-[#1d2d3e] focus:border-[#0070f2] focus:outline-none"></textarea>
                        </div>

                        <!-- Dynamic Interactive Table Preview -->
                        <div id="csv-preview-container" class="space-y-2">
                            <!-- Populated dynamically by updateCsvPreview() -->
                        </div>

                        ${expected.length > 0 ? `
                            <div class="bg-amber-50 rounded-xl p-3 border border-amber-200 flex items-center justify-between">
                                <span class="text-xs font-bold text-amber-900">
                                    ${lang === 'ar' ? `⚠️ يوجد حالياً ${expected.length} شاحنة معتمدة ومتبقية في كشف الوصول` : `${expected.length} active expected trucks already in manifest`}
                                </span>
                                <span class="text-[11px] text-amber-700 font-medium">
                                    ${lang === 'ar' ? 'سيتم دمج الشاحنات الجديدة مع القائمة' : 'New trucks will be appended'}
                                </span>
                            </div>
                        ` : ''}

                        <div class="flex justify-end gap-2 pt-3 border-t border-[#d7e2ee]">
                            <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="px-4 py-2 sap-btn-secondary text-xs">
                                ${lang === 'ar' ? 'إلغاء' : 'Cancel'}
                            </button>
                            <button type="submit" class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs flex items-center gap-1.5 shadow-md font-bold rounded-xl active:scale-95 transition-all">
                                ${icon('save', 'w-4 h-4')}
                                <span>${lang === 'ar' ? 'اعتماد واستيراد كشف الوصول' : 'Approve & Import Manifest'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        this.updateCsvPreview();
    }

    loadSampleDataIntoTextarea() {
        const textarea = document.getElementById('csv-import-textarea');
        if (textarea) {
            textarea.value = window.DB.getCsvTemplate();
            this.updateCsvPreview();
        }
    }

    updateCsvPreview() {
        const textarea = document.getElementById('csv-import-textarea');
        const container = document.getElementById('csv-preview-container');
        if (!textarea || !container) return;

        const content = textarea.value.trim();
        const lang = window.i18n.getLang();
        const icon = (name, cls = 'w-3.5 h-3.5') => window.Icons ? window.Icons.get(name, cls) : '';

        if (!content) {
            container.innerHTML = `
                <div class="p-3 bg-[#f8fafc] rounded-xl border border-[#e7eff7] text-center text-xs text-[#8fa4b8]">
                    ${lang === 'ar' ? 'سيظهر جدول المعاينة التفاعلي هنا فور رفع شيت Excel أو لصق البيانات.' : 'Table preview will appear here once Excel/CSV data is provided.'}
                </div>
            `;
            return;
        }

        let parsedRows = [];
        if (content.includes('<tr') || content.includes('<table')) {
            const trMatches = content.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
            trMatches.forEach(tr => {
                const cellMatches = tr.match(/<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi) || [];
                const rowData = cellMatches.map(cell => cell.replace(/<[^>]+>/g, '').trim());
                if (rowData.length > 0) parsedRows.push(rowData);
            });
        } else {
            const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
            lines.forEach(line => {
                let parts = [];
                if (line.includes('\t')) parts = line.split('\t');
                else if (line.includes(';')) parts = line.split(';');
                else parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(s => s.replace(/^"|"$/g, '').trim());
                if (parts.length > 0) parsedRows.push(parts);
            });
        }

        if (parsedRows.length < 2) {
            container.innerHTML = `
                <div class="p-3 bg-amber-50 rounded-xl border border-amber-200 text-center text-xs text-amber-800 font-bold">
                    ${lang === 'ar' ? '⚠️ يرجى التأكد من احتواء الشيت على سطر الرأس وبيانات شاحنة واحدة على الأقل.' : 'Ensure file contains a header and at least one vehicle row.'}
                </div>
            `;
            return;
        }

        const startIdx = (parsedRows[0][0] && (parsedRows[0][0].includes('لوحة') || parsedRows[0][0].toLowerCase().includes('plate'))) ? 1 : 0;
        const rows = [];
        for (let i = startIdx; i < parsedRows.length; i++) {
            const parts = parsedRows[i];
            if (parts.length > 0 && parts[0] && !parts[0].includes('رقم اللوحة')) {
                rows.push({
                    plate: parts[0] || '',
                    driver: parts[1] || 'سائق مصرح',
                    phone: parts[2] || '',
                    company: parts[3] || 'مورد عام',
                    dest: parts[4] || 'المستودع الرئيسي',
                    cargo: parts[5] || 'بضائع ومستلزمات عامة',
                    invoice: parts[6] || ''
                });
            }
        }

        container.innerHTML = `
            <div class="border border-[#d7e2ee] rounded-xl overflow-hidden shadow-sm bg-white">
                <div class="bg-[#f0f4f8] px-3.5 py-2 border-b border-[#d7e2ee] flex justify-between items-center">
                    <span class="text-xs font-black text-[#002b66] flex items-center gap-1.5">
                        ${icon('table', 'w-4 h-4 text-[#0070f2]')}
                        <span>${lang === 'ar' ? `معاينة الشيت (${rows.length} شاحنة جاهزة للاعتماد):` : `Sheet Preview (${rows.length} Trucks):`}</span>
                    </span>
                    <span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-bold">
                        ${lang === 'ar' ? 'جاهز للاستيراد' : 'Ready'}
                    </span>
                </div>
                <div class="max-h-52 overflow-y-auto overflow-x-auto">
                    <table class="w-full text-xs text-right border-collapse" dir="rtl">
                        <thead class="bg-[#f8fafc] text-[#556b82] font-bold border-b border-[#d7e2ee] sticky top-0">
                            <tr>
                                <th class="p-2 border-l border-[#e7eff7]">#</th>
                                <th class="p-2 border-l border-[#e7eff7]">رقم اللوحة</th>
                                <th class="p-2 border-l border-[#e7eff7]">اسم السائق</th>
                                <th class="p-2 border-l border-[#e7eff7]">الهاتف</th>
                                <th class="p-2 border-l border-[#e7eff7]">الشركة</th>
                                <th class="p-2 border-l border-[#e7eff7]">الوجهة</th>
                                <th class="p-2 border-l border-[#e7eff7]">الحمولة</th>
                                <th class="p-2">رقم الإذن/الفاتورة</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-[#e7eff7]">
                            ${rows.map((r, idx) => `
                                <tr class="hover:bg-slate-50 transition-colors">
                                    <td class="p-2 font-mono text-[#8fa4b8] border-l border-[#e7eff7]">${idx + 1}</td>
                                    <td class="p-2 font-black text-[#002b66] border-l border-[#e7eff7]">${r.plate}</td>
                                    <td class="p-2 font-bold text-[#1d2d3e] border-l border-[#e7eff7]">${r.driver}</td>
                                    <td class="p-2 font-mono text-emerald-700 border-l border-[#e7eff7]">${r.phone || '-'}</td>
                                    <td class="p-2 text-[#556b82] border-l border-[#e7eff7]">${r.company}</td>
                                    <td class="p-2 font-bold text-[#0070f2] border-l border-[#e7eff7]">${r.dest}</td>
                                    <td class="p-2 text-[#1d2d3e] border-l border-[#e7eff7]">${r.cargo}</td>
                                    <td class="p-2 font-mono text-[#556b82]">${r.invoice || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    handleCsvFileUpload(event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            const textarea = document.getElementById('csv-import-textarea');
            if (textarea) {
                textarea.value = content;
                this.updateCsvPreview();
            }
        };
        reader.readAsText(file, 'utf-8');
    }

    submitImportCsv(event) {
        if (event && event.preventDefault) event.preventDefault();
        const textarea = document.getElementById('csv-import-textarea');
        const csvContent = textarea ? textarea.value.trim() : '';

        if (!csvContent) {
            alert(window.i18n.getLang() === 'ar' ? 'يرجى إدخال أو رفع بيانات كشف الـ CSV أولاً' : 'Please provide CSV content first.');
            return;
        }

        const result = window.DB.importPreArrivalsFromCSV(csvContent);
        if (result.success) {
            if (document.getElementById('modal-container')) {
                document.getElementById('modal-container').innerHTML = '';
            }
            this.renderDashboard();
            const lang = window.i18n.getLang();
            const msg = lang === 'ar'
                ? `✅ تم استيراد واعتماد كشف الوصول بنجاح! (${result.count} شاحنة معتمدة جاهزة للحارس على البوابات)`
                : `✅ Successfully imported pre-arrival manifest! (${result.count} trucks ready for gate officers)`;
            
            if (window.App && typeof window.App.showToast === 'function') {
                window.App.showToast(lang === 'ar' ? '📥 استيراد الكشف' : 'Manifest Imported', msg, 'success', 'file');
            } else {
                alert(msg);
            }
        } else {
            alert(result.message || 'حدث خطأ أثناء معالجة ملف الـ CSV');
        }
    }
}

window.Manager = new ManagerController();
ManagerController.createPassCanvasDataUrl = (permitCode, plate, phone, driverName, validUntil, permitType, invoiceNo, cargoDetails, pinCode) => window.Manager.createPassCanvasDataUrl(permitCode, plate, phone, driverName, validUntil, permitType, invoiceNo, cargoDetails, pinCode);
ManagerController.dataURItoBlob = (dataURI) => window.Manager.dataURItoBlob(dataURI);
window.openPendingRequestsModal = (tab) => { if (window.Manager && typeof window.Manager.openPendingRequestsModal === 'function') window.Manager.openPendingRequestsModal(tab); };
window.showRequestReviewModal = (id) => { if (window.Manager && typeof window.Manager.showRequestReviewModal === 'function') window.Manager.showRequestReviewModal(id); };
window.handleDecideRequest = (id, dec) => { if (window.Manager && typeof window.Manager.handleDecideRequest === 'function') window.Manager.handleDecideRequest(id, dec); };
window.openHoldPermitModal = (id) => { if (window.Manager && typeof window.Manager.openHoldPermitModal === 'function') window.Manager.openHoldPermitModal(id); };
window.openRevokePermitModal = (id) => { if (window.Manager && typeof window.Manager.openRevokePermitModal === 'function') window.Manager.openRevokePermitModal(id); };
window.handleDeletePermit = (id) => { if (window.Manager && typeof window.Manager.handleDeletePermit === 'function') window.Manager.handleDeletePermit(id); };
window.toggleQuickActionsMenu = (e) => { if (window.Manager && typeof window.Manager.toggleQuickActionsMenu === 'function') window.Manager.toggleQuickActionsMenu(e); };
window.closeQuickActionsMenu = () => { if (window.Manager && typeof window.Manager.closeQuickActionsMenu === 'function') window.Manager.closeQuickActionsMenu(); };

