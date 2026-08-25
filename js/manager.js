// Office Manager Dashboard Controller (DOTRA Enterprise SVG & Micro-Interactions Edition)
// وحدة التحكم ببوابة مدير المكتب - مجموعة دوترا (واجهة مؤسسية فائقة مع أيقونات SVG ومحاذاة متطورة)

class ManagerController {
    constructor() {
        this.activeFilter = 'all';
        this.searchQuery = '';
    }

    handleUniversalSearch(query) {
        this.searchQuery = query || '';
        if (typeof document !== 'undefined') {
            if (document.querySelector) {
                const tableBody = document.querySelector('tbody');
                if (tableBody) tableBody.innerHTML = this.renderTableRows(window.i18n.getLang());
            }
            if (document.getElementById) {
                const mobileList = document.getElementById('manager-mobile-cards-list');
                if (mobileList) mobileList.innerHTML = this.renderMobileCards(window.i18n.getLang());
            }
        }
    }

    clearUniversalSearch() {
        this.searchQuery = '';
        if (typeof document !== 'undefined') {
            if (document.getElementById) {
                const input = document.getElementById('manager-universal-search');
                if (input) input.value = '';
                const mobileList = document.getElementById('manager-mobile-cards-list');
                if (mobileList) mobileList.innerHTML = this.renderMobileCards(window.i18n.getLang());
            }
            if (document.querySelector) {
                const tableBody = document.querySelector('tbody');
                if (tableBody) tableBody.innerHTML = this.renderTableRows(window.i18n.getLang());
            }
        }
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
            const durationHrs = (Date.now() - new Date(l.timestamp).getTime()) / 3600000;
            return durationHrs >= (settings.overstay_hours_threshold || 3);
        });

        const activePermits = permits.filter(p => p.status === 'active').length;
        const icon = (name, cls = 'w-4 h-4') => window.Icons ? window.Icons.get(name, cls) : '';

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
                <div class="flex items-center gap-2.5">
                    <button type="button" onclick="Manager.openQuickPermitModal()" class="sap-btn-primary px-4 py-2.5 flex items-center gap-2 text-sm shadow-md">
                        ${icon('bolt', 'w-4 h-4 text-amber-300')}
                        <span>${lang === 'ar' ? 'إصدار تصريح سريع' : 'Quick Pass'}</span>
                    </button>
                    <button type="button" onclick="Manager.openSettingsModal()" class="sap-btn-secondary px-3.5 py-2.5 flex items-center gap-1.5 text-sm shadow-sm" title="إعدادات النظام ورقم واتساب الافتراضي">
                        ${icon('settings', 'w-4 h-4 text-[#0070f2]')}
                        <span>${lang === 'ar' ? 'الإعدادات' : 'Settings'}</span>
                    </button>
                    <button type="button" onclick="Manager.exportCSV()" class="sap-btn-secondary px-3.5 py-2.5 flex items-center gap-1.5 text-sm shadow-sm" title="تصدير إكسل">
                        ${icon('download', 'w-4 h-4 text-[#0070f2]')}
                        <span class="hidden sm:inline">${window.i18n.t('exportCsv')}</span>
                    </button>
                </div>
            </div>

            <!-- SAP Enterprise KPI Metric Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                <div class="sap-card p-5 border-t-4 border-t-[#107e3e] flex items-center justify-between">
                    <div class="${lang === 'ar' ? 'text-right' : 'text-left'}">
                        <p class="text-xs font-bold text-[#556b82] uppercase tracking-wider">${window.i18n.t('metricInside')}</p>
                        <h3 class="text-3xl font-black text-[#1d2d3e] mt-1 font-mono">${insideCount}</h3>
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
                        <h3 class="text-3xl font-black text-[#0070f2] mt-1 font-mono">${exitedToday}</h3>
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
                        <h3 class="text-3xl font-black text-[#bb0000] mt-1 font-mono">${overstayLogs.length}</h3>
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
                        <h3 class="text-3xl font-black text-[#1d2d3e] mt-1 font-mono">${activePermits}</h3>
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

                    <!-- Filter Tabs including Exited List -->
                    <div class="flex items-center gap-1 bg-[#ffffff] p-1 rounded-xl border border-[#d7e2ee] text-xs flex-shrink-0">
                        <button type="button" onclick="Manager.setFilter('all')" class="px-3 py-1.5 rounded-lg font-bold transition-all ${this.activeFilter === 'all' ? 'bg-[#0070f2] text-white shadow-sm' : 'text-[#556b82] hover:text-[#1d2d3e]'}">
                            ${window.i18n.t('filterAll')}
                        </button>
                        <button type="button" onclick="Manager.setFilter('inside')" class="px-3 py-1.5 rounded-lg font-bold transition-all ${this.activeFilter === 'inside' ? 'bg-[#107e3e] text-white shadow-sm' : 'text-[#556b82] hover:text-[#1d2d3e]'}">
                            ${window.i18n.t('filterInside')} (${insideCount})
                        </button>
                        <button type="button" onclick="Manager.setFilter('exited')" class="px-3 py-1.5 rounded-lg font-bold transition-all ${this.activeFilter === 'exited' ? 'bg-[#0070f2] text-white shadow-sm' : 'text-[#556b82] hover:text-[#1d2d3e]'}">
                            📤 ${lang === 'ar' ? 'سجل المغادرين' : 'Exited'} (${exitedLogs.length})
                        </button>
                        <button type="button" onclick="Manager.setFilter('overstay')" class="px-3 py-1.5 rounded-lg font-bold transition-all ${this.activeFilter === 'overstay' ? 'bg-[#bb0000] text-white shadow-sm' : 'text-[#556b82] hover:text-[#1d2d3e]'}">
                            ${window.i18n.t('filterOverstay')} (${overstayLogs.length})
                        </button>
                    </div>
                </div>

                <!-- Desktop Table View (Hidden on Small Phones) -->
                <div class="hidden md:block overflow-x-auto bg-white">
                    <table class="w-full text-sm ${lang === 'ar' ? 'text-right' : 'text-left'}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                        <thead class="bg-[#f5f8fc] text-[#556b82] text-xs uppercase tracking-wider font-bold border-b border-[#d7e2ee]">
                            <tr>
                                <th class="py-3.5 px-4">${window.i18n.t('plateNumber')}</th>
                                <th class="py-3.5 px-4">${lang === 'ar' ? 'آخر موقع وحالة المركبة' : 'Last Location & Status'}</th>
                                <th class="py-3.5 px-4">${lang === 'ar' ? 'آخر بوابة' : 'Last Gate'}</th>
                                <th class="py-3.5 px-4">${lang === 'ar' ? 'فرد الأمن المسجل' : 'Officer'}</th>
                                <th class="py-3.5 px-4">${lang === 'ar' ? 'تاريخ ووقت الحركة والمدة' : 'Date, Time & Duration'}</th>
                                <th class="py-3.5 px-4">${window.i18n.t('driverName')} / ${window.i18n.t('company')}</th>
                                <th class="py-3.5 px-4 text-center">${window.i18n.t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-[#e7eff7] font-medium">
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

        const q = (this.searchQuery || '').trim().toLowerCase();

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

            if (!q) return true;

            const permit = window.DB.findPermitByCodeOrVehicle(null, vehicle.id);
            const lastLog = vehicleLogs.length > 0 ? vehicleLogs[vehicleLogs.length - 1] : null;
            const lastOfficer = lastLog ? users.find(u => u.id === lastLog.officer_id) : null;
            const officerName = lastOfficer ? `${lastOfficer.name_ar} ${lastOfficer.name_en}`.toLowerCase() : '';
            const gateName = lastLog ? (lastLog.gate_name || '').toLowerCase() : '';
            const timestampText = lastLog ? new Date(lastLog.timestamp).toLocaleString().toLowerCase() : '';
            const destination = permit ? `${permit.destination_ar} ${permit.destination_en}`.toLowerCase() : '';
            const pinCode = permit && permit.pin_code ? permit.pin_code.toLowerCase() : '';
            const permitCode = permit && permit.permit_code ? permit.permit_code.toLowerCase() : '';
            const driverName = `${vehicle.driver_name_ar || ''} ${vehicle.driver_name_en || ''}`.toLowerCase();
            const plateAr = (vehicle.plate_ar || '').toLowerCase();
            const plateEn = (vehicle.plate_en || '').toLowerCase();
            const phone = (vehicle.driver_phone || '').toLowerCase();
            const company = `${vehicle.company_ar || ''} ${vehicle.company_en || ''}`.toLowerCase();

            return plateAr.includes(q) ||
                   plateEn.includes(q) ||
                   driverName.includes(q) ||
                   phone.includes(q) ||
                   company.includes(q) ||
                   destination.includes(q) ||
                   gateName.includes(q) ||
                   officerName.includes(q) ||
                   timestampText.includes(q) ||
                   pinCode.includes(q) ||
                   permitCode.includes(q);
        });

        if (filteredVehicles.length === 0) {
            return `
                <div class="sap-card p-6 text-center text-[#556b82] bg-white border border-[#d7e2ee]">
                    <div class="w-12 h-12 rounded-2xl bg-[#ebf3fb] text-[#0070f2] flex items-center justify-center mx-auto mb-2.5 shadow-sm">
                        ${icon('search', 'w-6 h-6')}
                    </div>
                    <p class="font-bold text-sm text-[#1d2d3e]">
                        ${this.searchQuery ? (lang === 'ar' ? `لم يتم العثور على نتائج تطابق: "${this.searchQuery}"` : `No matching results for "${this.searchQuery}"`) : (lang === 'ar' ? 'لا توجد حركات مسجلة حالياً' : 'No activity records found')}
                    </p>
                    <p class="text-xs text-[#556b82] mt-1">${lang === 'ar' ? 'اضغط على زر "إصدار تصريح سريع" بالأسفل أو بالأعلى للبدء' : 'Click Quick Pass to issue entry pass'}</p>
                </div>
            `;
        }

        return filteredVehicles.map(vehicle => {
            const insideLog = window.DB.isVehicleInside(vehicle.id);
            const permit = window.DB.findPermitByCodeOrVehicle(null, vehicle.id);
            const vehicleLogs = logs.filter(l => l.vehicle_id === vehicle.id);
            const lastLog = vehicleLogs.length > 0 ? vehicleLogs[vehicleLogs.length - 1] : null;
            const lastOfficer = lastLog ? users.find(u => u.id === lastLog.officer_id) : null;
            const officerDisplayName = lastOfficer ? (lang === 'ar' ? lastOfficer.name_ar : lastOfficer.name_en) : (lastLog ? `ضابط #${lastLog.officer_id}` : '--');
            const lastGateName = lastLog ? lastLog.gate_name : '--';
            
            let statusBadge = '';
            let timeInfoHtml = '';

            if (vehicle.status === 'blacklist') {
                statusBadge = `<span class="px-2 py-0.5 rounded-full text-xs badge-blacklisted flex items-center gap-1 font-bold">${icon('ban', 'w-3 h-3 text-red-300')} <span>${window.i18n.t('statusBanned')}</span></span>`;
            } else if (insideLog) {
                const entryTime = new Date(insideLog.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const diffMinutes = Math.round((Date.now() - new Date(insideLog.timestamp).getTime()) / 60000);
                statusBadge = `<span class="px-2.5 py-0.5 rounded-full text-xs badge-inside flex items-center gap-1 font-bold"><span class="w-1.5 h-1.5 rounded-full bg-[#107e3e] animate-pulse"></span> <span>${window.i18n.t('statusInside')}</span></span>`;
                timeInfoHtml = `<div class="text-xs text-[#107e3e] font-bold">📥 دخلت: ${entryTime} (${diffMinutes} دقيقة)</div>`;
            } else {
                statusBadge = `<span class="px-2.5 py-0.5 rounded-full text-xs badge-exited flex items-center gap-1 font-bold"><span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span> <span>${lang === 'ar' ? 'غادرت المصنع' : 'Exited'}</span></span>`;
                const exitLog = vehicleLogs.slice().reverse().find(l => l.action_type === 'exit' || l.exit_timestamp);
                if (exitLog) {
                    const exitTimeStr = new Date(exitLog.exit_timestamp || exitLog.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    timeInfoHtml = `<div class="text-xs text-[#0070f2] font-bold">📤 خرجت: ${exitTimeStr} (المدة: ${exitLog.duration_minutes || 0} د)</div>`;
                }
            }

            const driverName = (lang === 'ar' ? vehicle.driver_name_ar : vehicle.driver_name_en) || 'سائق مصرح';
            const companyName = (lang === 'ar' ? vehicle.company_ar : vehicle.company_en) || 'عام';
            const destination = permit ? (lang === 'ar' ? permit.destination_ar : permit.destination_en) : 'المستودع الرئيسي';

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
                                <a href="https://wa.me/${vehicle.driver_phone.replace(/[^0-9]/g, '')}" target="_blank" class="font-mono font-bold text-[#107e3e] flex items-center gap-1">
                                    ${icon('whatsapp', 'w-3 h-3 text-[#107e3e]')}
                                    <span>${vehicle.driver_phone}</span>
                                </a>
                            </div>
                        ` : ''}
                        <div class="flex justify-between items-center">
                            <span class="text-[#556b82] font-bold">الموقع والوجهة:</span>
                            <span class="font-bold text-[#002b66]">📍 ${destination}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-[#556b82] font-bold">آخر حركة:</span>
                            <span class="font-mono font-bold text-[#556b82]">🚪 ${lastGateName} (👮 ${officerDisplayName})</span>
                        </div>
                        ${timeInfoHtml ? `<div class="pt-1 border-t border-[#e7eff7]">${timeInfoHtml}</div>` : ''}
                    </div>
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

        const q = (this.searchQuery || '').trim().toLowerCase();

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

            if (!q) return true;

            const permit = window.DB.findPermitByCodeOrVehicle(null, vehicle.id);
            const lastLog = vehicleLogs.length > 0 ? vehicleLogs[vehicleLogs.length - 1] : null;
            const lastOfficer = lastLog ? users.find(u => u.id === lastLog.officer_id) : null;
            const officerName = lastOfficer ? `${lastOfficer.name_ar} ${lastOfficer.name_en}`.toLowerCase() : '';
            const gateName = lastLog ? (lastLog.gate_name || '').toLowerCase() : '';
            const timestampText = lastLog ? new Date(lastLog.timestamp).toLocaleString().toLowerCase() : '';
            const destination = permit ? `${permit.destination_ar} ${permit.destination_en}`.toLowerCase() : '';
            const pinCode = permit && permit.pin_code ? permit.pin_code.toLowerCase() : '';
            const permitCode = permit && permit.permit_code ? permit.permit_code.toLowerCase() : '';
            const driverName = `${vehicle.driver_name_ar || ''} ${vehicle.driver_name_en || ''}`.toLowerCase();
            const plateAr = (vehicle.plate_ar || '').toLowerCase();
            const plateEn = (vehicle.plate_en || '').toLowerCase();
            const phone = (vehicle.driver_phone || '').toLowerCase();
            const company = `${vehicle.company_ar || ''} ${vehicle.company_en || ''}`.toLowerCase();

            return plateAr.includes(q) ||
                   plateEn.includes(q) ||
                   driverName.includes(q) ||
                   phone.includes(q) ||
                   company.includes(q) ||
                   destination.includes(q) ||
                   gateName.includes(q) ||
                   officerName.includes(q) ||
                   timestampText.includes(q) ||
                   pinCode.includes(q) ||
                   permitCode.includes(q);
        });

        if (filteredVehicles.length === 0) {
            return `
                <tr>
                    <td colspan="7" class="text-center py-12 text-[#556b82]">
                        <div class="w-12 h-12 rounded-2xl bg-[#ebf3fb] text-[#0070f2] flex items-center justify-center mx-auto mb-2.5">
                            ${icon('search', 'w-6 h-6')}
                        </div>
                        <p class="font-bold text-sm text-[#1d2d3e]">
                            ${this.searchQuery ? (lang === 'ar' ? `لم يتم العثور على نتائج تطابق: "${this.searchQuery}"` : `No matching results for "${this.searchQuery}"`) : (lang === 'ar' ? 'لا توجد حركات مسجلة حالياً' : 'No activity records found')}
                        </p>
                        <p class="text-xs text-[#556b82] mt-1">${lang === 'ar' ? 'تأكد من كتابة رقم اللوحة، اسم الضابط، البوابة أو الوقت بشكل صحيح' : 'Try searching by plate, officer, gate, or time'}</p>
                    </td>
                </tr>
            `;
        }

        return filteredVehicles.map(vehicle => {
            const insideLog = window.DB.isVehicleInside(vehicle.id);
            const permit = window.DB.findPermitByCodeOrVehicle(null, vehicle.id);
            const vehicleLogs = logs.filter(l => l.vehicle_id === vehicle.id);
            const lastLog = vehicleLogs.length > 0 ? vehicleLogs[vehicleLogs.length - 1] : null;
            const lastOfficer = lastLog ? users.find(u => u.id === lastLog.officer_id) : null;
            const officerDisplayName = lastOfficer ? (lang === 'ar' ? lastOfficer.name_ar : lastOfficer.name_en) : (lastLog ? `ضابط #${lastLog.officer_id}` : '--');
            const lastGateName = lastLog ? lastLog.gate_name : '--';
            
            let statusBadge = '';
            let durationText = '--';
            let entryTimeText = '--';

            if (vehicle.status === 'blacklist') {
                statusBadge = `<span class="px-2.5 py-1 rounded-full text-xs badge-blacklisted flex items-center gap-1 w-fit">${icon('ban', 'w-3 h-3 text-red-300')} <span>${window.i18n.t('statusBanned')}</span></span>`;
            } else if (insideLog) {
                const entryTime = new Date(insideLog.timestamp);
                entryTimeText = entryTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const diffMinutes = Math.round((Date.now() - entryTime.getTime()) / 60000);
                const diffHours = (diffMinutes / 60).toFixed(1);
                
                if (diffMinutes >= ((settings.overstay_hours_threshold || 3) * 60)) {
                    statusBadge = `<span class="px-2.5 py-1 rounded-full text-xs badge-overstay flex items-center gap-1 w-fit">${icon('alert', 'w-3 h-3 text-red-600')} <span>${window.i18n.t('statusOverstay')}</span></span>`;
                    durationText = `<span class="text-[#bb0000] font-bold font-mono">${diffHours} ${lang === 'ar' ? 'ساعة' : 'hrs'}</span>`;
                } else {
                    statusBadge = `<span class="px-2.5 py-1 rounded-full text-xs badge-inside flex items-center gap-1 w-fit"><span class="w-1.5 h-1.5 rounded-full bg-[#107e3e] animate-pulse"></span> <span>${window.i18n.t('statusInside')}</span></span>`;
                    durationText = `<span class="text-[#107e3e] font-bold font-mono">${diffMinutes < 60 ? `${diffMinutes} ${lang === 'ar' ? 'دقيقة' : 'min'}` : `${diffHours} ${lang === 'ar' ? 'ساعة' : 'hrs'}`}</span>`;
                }
            } else if (permit && permit.status === 'active') {
                statusBadge = `<span class="px-2.5 py-1 rounded-full text-xs badge-active flex items-center gap-1 w-fit">${icon('shield', 'w-3 h-3 text-[#0070f2]')} <span>${window.i18n.t('statusAuthorized')}</span></span>`;
            } else {
                statusBadge = `<span class="px-2.5 py-1 rounded-full text-xs badge-exited flex items-center gap-1 w-fit"><span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span> <span>${lang === 'ar' ? 'غادرت المصنع' : window.i18n.t('statusExited')}</span></span>`;
            }

            const driverName = (lang === 'ar' ? vehicle.driver_name_ar : vehicle.driver_name_en) || 'سائق مصرح';
            const companyName = (lang === 'ar' ? vehicle.company_ar : vehicle.company_en) || 'عام';
            const destination = permit ? (lang === 'ar' ? permit.destination_ar : permit.destination_en) : 'المستودع الرئيسي';

            // Find last exit event
            const exitLog = vehicleLogs.slice().reverse().find(l => l.action_type === 'exit' || l.exit_timestamp);
            let timeCellHtml = '';

            if (insideLog) {
                const entryDateStr = new Date(insideLog.timestamp).toLocaleDateString();
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
            } else if (exitLog) {
                const exitTimeDate = new Date(exitLog.exit_timestamp || exitLog.timestamp);
                const exitDateStr = exitTimeDate.toLocaleDateString();
                const exitTimeStr = exitTimeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const durMin = exitLog.duration_minutes !== null && exitLog.duration_minutes !== undefined ? exitLog.duration_minutes : 0;
                
                timeCellHtml = `
                    <div class="font-bold text-[#0070f2] flex items-center gap-1">
                        <span>📤 خروج:</span>
                        <span>${exitDateStr} • ${exitTimeStr}</span>
                    </div>
                    <div class="text-[11px] text-[#556b82] mt-0.5">
                        <span>⏱️ مدة التواجد:</span>
                        <b class="text-[#107e3e]">${durMin} ${lang === 'ar' ? 'دقيقة' : 'min'}</b>
                    </div>
                `;
            } else {
                timeCellHtml = `<span class="text-[#556b82] font-mono">--</span>`;
            }

            return `
                <tr class="sap-table-row hover:bg-[#f5f8fc] transition-colors">
                    <td class="py-3.5 px-4">
                        ${window.ArabicPlate.renderEgyptianPlate(vehicle.plate_ar, 'compact', vehicle.vehicle_type)}
                    </td>
                    <td class="py-3.5 px-4">
                        <div class="flex flex-col gap-1">
                            ${statusBadge}
                            <span class="text-xs font-bold text-[#002b66]">
                                📍 ${destination}
                            </span>
                        </div>
                    </td>
                    <td class="py-3.5 px-4">
                        <span class="px-2.5 py-1 bg-[#f0f4f8] rounded-lg text-xs font-mono font-bold text-[#002b66] border border-[#d7e2ee]">
                            🚪 ${lastGateName}
                        </span>
                    </td>
                    <td class="py-3.5 px-4 text-xs font-bold text-[#1d2d3e]">
                        <div class="flex items-center gap-1.5">
                            <span>👮</span>
                            <span>${officerDisplayName}</span>
                        </div>
                    </td>
                    <td class="py-3.5 px-4 text-xs font-mono">
                        ${timeCellHtml}
                    </td>
                    <td class="py-3.5 px-4">
                        <div class="font-bold text-[#1d2d3e] text-xs">${driverName}</div>
                        <div class="text-[11px] text-[#556b82] font-semibold">${companyName}</div>
                    </td>
                    <td class="py-3.5 px-4 text-center">
                        <div class="flex items-center justify-center gap-1.5">
                            ${permit ? `
                                <button type="button" title="عرض وطباعة التصريح" onclick="Manager.showPassModal(${permit.id})" class="px-2 py-1.5 bg-[#ebf3fb] hover:bg-[#d5e7fa] text-[#0070f2] rounded-lg border border-[#b3d5fa] text-xs font-bold flex items-center gap-1 shadow-sm">
                                    ${icon('qrcode', 'w-3.5 h-3.5')}
                                    <span>كارت</span>
                                </button>
                            ` : `
                                <button type="button" title="إصدار تصريح" onclick="Manager.openQuickPermitModal(${vehicle.id})" class="px-2 py-1.5 bg-[#e5f6eb] hover:bg-[#cdeed7] text-[#107e3e] rounded-lg border border-[#b4e3c4] text-xs font-bold flex items-center gap-1 shadow-sm">
                                    ${icon('bolt', 'w-3.5 h-3.5')}
                                    <span>تصريح</span>
                                </button>
                            `}
                            <button type="button" title="${vehicle.status === 'blacklist' ? 'إلغاء الحظر' : 'حظر المركبة'}" onclick="Manager.toggleBlacklist(${vehicle.id})" class="p-1.5 ${vehicle.status === 'blacklist' ? 'bg-[#e5f6eb] text-[#107e3e] border-[#b4e3c4]' : 'bg-[#ffebeb] text-[#bb0000] border-[#f6b3b3]'} hover:opacity-80 rounded-lg border text-xs shadow-sm">
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
        const icon = (name, cls = 'w-4 h-4') => window.Icons ? window.Icons.get(name, cls) : '';

        modalContainer.innerHTML = `
            <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
                <div class="sap-panel w-full max-w-2xl rounded-3xl border border-[#b0cfee] shadow-2xl p-6 relative animate-scaleUp bg-white ${lang === 'ar' ? 'text-right' : 'text-left'}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                    <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="absolute top-4 ${lang === 'ar' ? 'left-4' : 'right-4'} text-[#556b82] hover:text-[#1d2d3e] text-xl font-bold">
                        ✕
                    </button>

                    <!-- Header -->
                    <div class="flex items-center gap-3 mb-4 border-b border-[#d7e2ee] pb-3">
                        <div class="w-12 h-12 rounded-2xl bg-[#ebf3fb] text-[#0070f2] flex items-center justify-center border border-[#b3d5fa] shadow-sm">
                            ${icon('settings', 'w-6 h-6')}
                        </div>
                        <div>
                            <h3 class="text-lg font-black text-[#002b66]">${lang === 'ar' ? 'إعدادات النظام وإدارة البوابات والوجهات' : 'System, Gates & Destinations Settings'}</h3>
                            <p class="text-xs text-[#556b82] font-semibold">${lang === 'ar' ? 'تخصيص البوابات، الوجهات الداخلية، وتعيين حراس وأمناء الأمن' : 'Manage factory gates, internal docks, and assign security personnel'}</p>
                        </div>
                    </div>

                    <!-- Navigation Tabs -->
                    <div class="grid grid-cols-4 gap-1.5 bg-[#f5f8fc] p-1.5 rounded-2xl border border-[#d7e2ee] mb-4 text-xs font-bold">
                        <button type="button" onclick="Manager.openSettingsModal('general')" class="py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${activeTab === 'general' ? 'bg-[#0070f2] text-white shadow-sm' : 'text-[#556b82] hover:text-[#1d2d3e]'}">
                            ${icon('settings', 'w-3.5 h-3.5')}
                            <span>عام والواتساب</span>
                        </button>
                        <button type="button" onclick="Manager.openSettingsModal('gates')" class="py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${activeTab === 'gates' ? 'bg-[#0070f2] text-white shadow-sm' : 'text-[#556b82] hover:text-[#1d2d3e]'}">
                            ${icon('shield', 'w-3.5 h-3.5')}
                            <span>البوابات (${gates.length})</span>
                        </button>
                        <button type="button" onclick="Manager.openSettingsModal('destinations')" class="py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${activeTab === 'destinations' ? 'bg-[#0070f2] text-white shadow-sm' : 'text-[#556b82] hover:text-[#1d2d3e]'}">
                            ${icon('building', 'w-3.5 h-3.5')}
                            <span>الوجهات (${destinations.length})</span>
                        </button>
                        <button type="button" onclick="Manager.openSettingsModal('officers')" class="py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${activeTab === 'officers' ? 'bg-[#0070f2] text-white shadow-sm' : 'text-[#556b82] hover:text-[#1d2d3e]'}">
                            ${icon('user', 'w-3.5 h-3.5')}
                            <span>فريق الأمن (${officers.length})</span>
                        </button>
                    </div>

                    <!-- TAB 1: General & WhatsApp Settings -->
                    ${activeTab === 'general' ? `
                        <form onsubmit="Manager.saveSettings(event)" class="space-y-4">
                            <div class="bg-[#f8fafc] p-4 rounded-2xl border-2 border-[#b0cfee]">
                                <label class="block text-xs font-bold text-[#1d2d3e] mb-1.5 flex items-center gap-1.5">
                                    ${icon('whatsapp', 'w-4 h-4 text-[#107e3e]')}
                                    <span>${lang === 'ar' ? 'رقم واتساب الإدارة / البوابة الافتراضي (لإرسال كافة التصاريح تلقائياً):' : 'Default Dispatcher WhatsApp Number:'}</span>
                                </label>
                                <input type="tel" id="setting-default-whatsapp" required value="${settings.default_whatsapp || '01012345678'}" placeholder="01012345678 أو +201012345678" class="w-full bg-white border-2 border-[#d7e2ee] rounded-xl px-4 py-2.5 text-[#1d2d3e] font-mono font-bold text-base focus:border-[#0070f2] focus:outline-none" />
                                <p class="text-[11px] text-[#0070f2] mt-1.5 font-semibold">
                                    ${lang === 'ar' ? '💡 سيتم إرسال نسخة من كل تصريح إلكتروني لهذا الرقم فور إصداره' : 'All created passes will be automatically routed to this number'}
                                </p>
                            </div>

                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label class="block text-xs font-bold text-[#556b82] mb-1">اسم المنشأة / الشركة</label>
                                    <input type="text" id="setting-company" value="${settings.company_name_ar || 'مجموعة دوترا'}" class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl px-3 py-2 text-xs font-bold text-[#1d2d3e]" />
                                </div>
                                <div>
                                    <label class="block text-xs font-bold text-[#556b82] mb-1">تنبيه تجاوز المدة (بالساعات)</label>
                                    <input type="number" id="setting-overstay" min="1" max="24" value="${settings.overstay_hours_threshold || 3}" class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl px-3 py-2 text-xs font-bold text-[#1d2d3e]" />
                                </div>
                            </div>

                            <!-- Database Management Tools: Demo Data & Reset -->
                            <div class="space-y-2">
                                <div class="bg-[#ebf3fb] p-3 rounded-2xl border border-[#b3d5fa] flex items-center justify-between">
                                    <div>
                                        <div class="text-xs font-bold text-[#0070f2]">استعادة البيانات النموذجية والتصاريح</div>
                                        <div class="text-[10px] text-[#556b82] font-medium">إعادة تحميل تصاريح وشاحنات وسجلات تجريبية نموذجية</div>
                                    </div>
                                    <button type="button" onclick="Manager.restoreDemoData()" class="px-3 py-1.5 sap-btn-primary font-bold text-xs rounded-lg shadow-sm flex items-center gap-1">
                                        ${icon('bolt', 'w-3.5 h-3.5')}
                                        <span>استعادة النموذج</span>
                                    </button>
                                </div>

                                <div class="bg-red-50 p-3 rounded-2xl border border-red-200 flex items-center justify-between">
                                    <div>
                                        <div class="text-xs font-bold text-red-700">مسح وتصفير كافة البيانات</div>
                                        <div class="text-[10px] text-red-500 font-medium">حذف كافة التصاريح القديمة لبدء صفحة نظيفة</div>
                                    </div>
                                    <button type="button" onclick="Manager.resetAllData()" class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1">
                                        ${icon('trash', 'w-3.5 h-3.5')}
                                        <span>تصفير الآن</span>
                                    </button>
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

                    <!-- TAB 2: Gates & Assign Personnel -->
                    ${activeTab === 'gates' ? `
                        <div class="space-y-4">
                            <!-- Add Gate Form -->
                            <form onsubmit="Manager.handleAddGate(event)" class="flex gap-2 bg-[#f8fafc] p-3 rounded-2xl border border-[#d7e2ee]">
                                <input type="text" id="new-gate-name" required placeholder="اسم البوابة الجديدة (مثال: بوابة 5 الشاحنات والجمارك)..." class="flex-1 bg-white border border-[#d7e2ee] rounded-xl px-3 py-2 text-xs font-bold text-[#1d2d3e] focus:border-[#0070f2] focus:outline-none" />
                                <button type="submit" class="px-4 py-2 sap-btn-primary text-xs font-bold flex items-center gap-1 shadow-sm">
                                    <span>➕</span>
                                    <span>إضافة بوابة</span>
                                </button>
                            </form>

                            <!-- Gates List with Assigned Officers -->
                            <div class="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                                ${gates.map((gate, idx) => {
                                    const assignedOfficers = officers.filter(o => o.gate_assigned === gate);
                                    return `
                                        <div class="p-3.5 rounded-2xl bg-white border-2 border-[#d7e2ee] hover:border-[#b0cfee] transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                            <div>
                                                <div class="flex items-center gap-2">
                                                    <span class="w-7 h-7 rounded-xl bg-[#ebf3fb] text-[#0070f2] flex items-center justify-center font-bold text-xs">
                                                        ${idx + 1}
                                                    </span>
                                                    <span class="font-black text-sm text-[#002b66]">${gate}</span>
                                                </div>
                                                <div class="text-[11px] text-[#556b82] mt-1 flex items-center gap-1.5">
                                                    <span>👮 الحارس المعين:</span>
                                                    <span class="font-bold text-[#107e3e]">
                                                        ${assignedOfficers.length > 0 ? assignedOfficers.map(o => o.name_ar).join(', ') : 'لا يوجد حارس معين حالياً'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
                                                <!-- Assign Officer Dropdown -->
                                                <select onchange="Manager.handleAssignOfficerToGate(this.value, '${gate}')" class="bg-[#f8fafc] border border-[#d7e2ee] rounded-xl p-1.5 text-xs font-bold text-[#1d2d3e]">
                                                    <option value="">➕ تعيين حارس...</option>
                                                    ${officers.map(o => `<option value="${o.id}">${o.name_ar} (${o.badge_id})</option>`).join('')}
                                                </select>
                                                ${gates.length > 1 ? `
                                                    <button type="button" onclick="Manager.handleDeleteGate(${idx})" title="حذف البوابة" class="p-2 text-red-500 hover:bg-red-50 rounded-xl">
                                                        ${icon('trash', 'w-4 h-4')}
                                                    </button>
                                                ` : ''}
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <!-- TAB 3: Internal Destinations Management -->
                    ${activeTab === 'destinations' ? `
                        <div class="space-y-4">
                            <!-- Add Destination Form -->
                            <form onsubmit="Manager.handleAddDestination(event)" class="flex gap-2 bg-[#f8fafc] p-3 rounded-2xl border border-[#d7e2ee]">
                                <input type="text" id="new-destination-name" required placeholder="اسم الوجهة الجديدة (مثال: مصنع التغليف والتعبئة)..." class="flex-1 bg-white border border-[#d7e2ee] rounded-xl px-3 py-2 text-xs font-bold text-[#1d2d3e] focus:border-[#0070f2] focus:outline-none" />
                                <button type="submit" class="px-4 py-2 sap-btn-primary text-xs font-bold flex items-center gap-1 shadow-sm">
                                    <span>➕</span>
                                    <span>إضافة وجهة</span>
                                </button>
                            </form>

                            <!-- Destinations Grid -->
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                                ${destinations.map((dest, idx) => `
                                    <div class="p-3 rounded-xl bg-white border border-[#d7e2ee] flex items-center justify-between gap-2 shadow-sm hover:border-[#b0cfee]">
                                        <div class="flex items-center gap-2">
                                            <span class="w-6 h-6 rounded-lg bg-[#f0f4f8] text-[#002b66] flex items-center justify-center font-bold text-xs">
                                                ${idx + 1}
                                            </span>
                                            <span class="font-bold text-xs text-[#1d2d3e]">${dest}</span>
                                        </div>
                                        ${destinations.length > 1 ? `
                                            <button type="button" onclick="Manager.handleDeleteDestination(${idx})" title="حذف" class="text-red-400 hover:text-red-600 p-1">
                                                ${icon('trash', 'w-3.5 h-3.5')}
                                            </button>
                                        ` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <!-- TAB 4: Security Officers / Personnel Management -->
                    ${activeTab === 'officers' ? `
                        <div class="space-y-4">
                            <!-- Add Officer Form -->
                            <form onsubmit="Manager.handleAddOfficer(event)" class="bg-[#f8fafc] p-3.5 rounded-2xl border border-[#d7e2ee] space-y-2.5">
                                <div class="font-bold text-xs text-[#002b66]">➕ إضافة فرد أمن / أمين شرطة جديد</div>
                                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <input type="text" id="officer-name-input" required placeholder="اسم فرد الأمن" class="bg-white border border-[#d7e2ee] rounded-xl px-3 py-2 text-xs font-bold text-[#1d2d3e] focus:border-[#0070f2] focus:outline-none" />
                                    <input type="text" id="officer-badge-input" required placeholder="كود الشارة (GT-03)" class="bg-white border border-[#d7e2ee] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#1d2d3e] focus:border-[#0070f2] focus:outline-none" />
                                    <input type="password" id="officer-pin-input" required maxlength="4" placeholder="الـ PIN (4 أرقام)" class="bg-white border border-[#d7e2ee] rounded-xl px-3 py-2 text-xs font-mono font-bold text-center text-[#1d2d3e] focus:border-[#0070f2] focus:outline-none" />
                                </div>
                                <div class="flex justify-between items-center gap-2">
                                    <select id="officer-gate-select" class="flex-1 bg-white border border-[#d7e2ee] rounded-xl px-3 py-2 text-xs font-bold text-[#1d2d3e]">
                                        ${gates.map(g => `<option value="${g}">تعيين على: ${g}</option>`).join('')}
                                    </select>
                                    <button type="submit" class="px-5 py-2 sap-btn-primary text-xs font-bold shadow-sm">
                                        إضافة للفريق
                                    </button>
                                </div>
                            </form>

                            <!-- Officers List -->
                            <div class="space-y-2 max-h-64 overflow-y-auto pr-1">
                                ${officers.map(off => `
                                    <div class="p-3 rounded-2xl bg-white border border-[#d7e2ee] flex items-center justify-between shadow-sm">
                                        <div class="flex items-center gap-2.5">
                                            <div class="w-10 h-10 rounded-xl bg-[#ebf3fb] text-[#0070f2] flex items-center justify-center font-black text-sm border border-[#b3d5fa]">
                                                👮
                                            </div>
                                            <div>
                                                <div class="font-bold text-xs text-[#1d2d3e]">${off.name_ar}</div>
                                                <div class="text-[11px] text-[#556b82] font-mono">
                                                    <span class="text-[#0070f2] font-bold">${off.badge_id}</span> • <span>${off.gate_assigned}</span> • <span>PIN: ${off.pin_code}</span>
                                                </div>
                                            </div>
                                        </div>
                                        ${officers.length > 1 ? `
                                            <button type="button" onclick="Manager.handleDeleteOfficer(${off.id})" title="حذف" class="text-red-500 hover:bg-red-50 p-2 rounded-xl">
                                                ${icon('trash', 'w-4 h-4')}
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

    handleAddOfficer(e) {
        e.preventDefault();
        const name = document.getElementById('officer-name-input').value.trim();
        const badge = document.getElementById('officer-badge-input').value.trim();
        const pin = document.getElementById('officer-pin-input').value.trim();
        const gate = document.getElementById('officer-gate-select').value;

        window.DB.addOfficer({
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
        if (confirm(window.i18n.getLang() === 'ar' ? "هل أنت متأكد من رغبتك في تصفير ومسح كافة التصاريح والمركبات؟" : "Are you sure you want to clear all permits?")) {
            window.DB.clearAllData();
            if (typeof document !== 'undefined' && document.getElementById('modal-container')) {
                document.getElementById('modal-container').innerHTML = '';
            }
            this.renderDashboard();
            alert(window.i18n.getLang() === 'ar' ? "تم مسح وتصفير كافة البيانات بنجاح!" : "All data cleared successfully!");
        }
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
            <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
                <div class="sap-panel w-full max-w-lg rounded-3xl border border-[#b0cfee] shadow-2xl p-6 relative animate-scaleUp bg-white ${lang === 'ar' ? 'text-right' : 'text-left'}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
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

        const typeLabels = {
            entry: { label: '📥 تصريح دخول معتمد (Entry Pass)', color: 'bg-[#e5f6eb] text-[#107e3e] border-[#b4e3c4]' },
            exit: { label: '📤 تصريح خروج بضائع معتمد (Exit Pass)', color: 'bg-[#ebf3fb] text-[#0070f2] border-[#b3d5fa]' },
            both: { label: '🔄 تصريح دخول وخروج (Roundtrip Pass)', color: 'bg-[#fff1e5] text-[#b85500] border-[#ffd8b3]' }
        };
        const typeBadge = typeLabels[data.permit_type] || typeLabels.entry;

        modalContainer.innerHTML = `
            <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
                <div class="sap-panel w-full max-w-lg rounded-3xl border-2 border-[#0070f2] shadow-2xl p-6 relative animate-scaleUp bg-white ${lang === 'ar' ? 'text-right' : 'text-left'}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                    
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
                        <button type="button" onclick='Manager.openQuickPermitModal(${JSON.stringify(data)})' class="px-4 py-3 sap-btn-secondary text-xs font-bold flex items-center gap-1">
                            <span>✏️</span>
                            <span>تعديل البيانات</span>
                        </button>
                        <button type="button" onclick='Manager.finalizeQuickPermit(${JSON.stringify(data)})' class="flex-1 py-3 bg-[#107e3e] hover:bg-[#0c6b33] text-white font-black rounded-xl text-sm shadow-md flex items-center justify-center gap-2">
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

        const qrPayload = JSON.stringify({
            permit: permit.permit_code,
            type: permit.permit_type || 'entry',
            plate: vehicle.plate_ar,
            phone: vehicle.driver_phone
        });

        const validUntilText = new Date(permit.valid_until).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const validDateText = new Date(permit.valid_until).toLocaleDateString([], { year: 'numeric', month: '2-digit', day: '2-digit' });

        modalContainer.innerHTML = `
            <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto modal-backdrop">
                <div class="sap-panel w-full max-w-lg rounded-3xl border border-[#b0cfee] shadow-2xl p-6 relative animate-scaleUp bg-white ${lang === 'ar' ? 'text-right' : 'text-left'}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                    
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

    exportCSV() {
        const logs = window.DB.getLogs();
        const vehicles = window.DB.getVehicles();

        let csv = 'Log_ID,Vehicle_Plate,Driver_Phone,Driver_Name,Company,Gate_Name,Action,Timestamp,Exit_Timestamp,Duration_Minutes,Remarks\n';

        logs.forEach(log => {
            const vehicle = vehicles.find(v => v.id === log.vehicle_id) || {};
            csv += `"${log.id}","${vehicle.plate_ar || ''}","${vehicle.driver_phone || ''}","${vehicle.driver_name_ar || ''}","${vehicle.company_ar || ''}","${log.gate_name}","${log.action_type}","${log.timestamp}","${log.exit_timestamp || ''}","${log.duration_minutes || ''}","${log.remarks || ''}"\n`;
        });

        const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dotra_gate_access_logs_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    }
}

window.Manager = new ManagerController();
ManagerController.createPassCanvasDataUrl = (permitCode, plate, phone, driverName, validUntil, permitType, invoiceNo, cargoDetails, pinCode) => window.Manager.createPassCanvasDataUrl(permitCode, plate, phone, driverName, validUntil, permitType, invoiceNo, cargoDetails, pinCode);
ManagerController.dataURItoBlob = (dataURI) => window.Manager.dataURItoBlob(dataURI);

