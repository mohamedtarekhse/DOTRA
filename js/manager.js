// Office Manager Dashboard Controller (DOTRA Enterprise SVG & Micro-Interactions Edition)
// وحدة التحكم ببوابة مدير المكتب - مجموعة دوترا (واجهة مؤسسية فائقة مع أيقونات SVG ومحاذاة متطورة)

class ManagerController {
    constructor() {
        this.activeFilter = 'all';
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
                        <p class="text-xs font-bold text-[#556b82] uppercase tracking-wider">${window.i18n.t('metricToday')}</p>
                        <h3 class="text-3xl font-black text-[#1d2d3e] mt-1 font-mono">${todayEntries}</h3>
                        <p class="text-[11px] text-[#0070f2] mt-1 font-bold">
                            ${lang === 'ar' ? 'حركة دخول عبر كافة البوابات' : 'Recorded entries'}
                        </p>
                    </div>
                    <div class="w-12 h-12 rounded-2xl bg-[#ebf3fb] text-[#0070f2] flex items-center justify-center border border-[#b3d5fa] shadow-sm">
                        ${icon('activity', 'w-6 h-6')}
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

            <!-- SAP Live Vehicle Activity Table -->
            <div class="sap-panel overflow-hidden shadow-md">
                <div class="p-4 bg-[#f8fafc] border-b border-[#d7e2ee] flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div class="flex items-center gap-2">
                        <h2 class="text-base font-bold text-[#002b66] flex items-center gap-2">
                            ${icon('activity', 'w-5 h-5 text-[#0070f2]')}
                            <span>${lang === 'ar' ? 'سجل حركة المركبات المباشر' : 'Live Vehicle Stream'}</span>
                        </h2>
                        <span class="px-2.5 py-0.5 bg-[#e5f6eb] text-[#107e3e] text-[11px] rounded-full font-mono font-bold border border-[#b4e3c4]">
                            LIVE
                        </span>
                    </div>

                    <!-- Filter Tabs -->
                    <div class="flex items-center gap-1 bg-[#ffffff] p-1 rounded-xl border border-[#d7e2ee] text-xs">
                        <button type="button" onclick="Manager.setFilter('all')" class="px-3 py-1.5 rounded-lg font-bold transition-all ${this.activeFilter === 'all' ? 'bg-[#0070f2] text-white shadow-sm' : 'text-[#556b82] hover:text-[#1d2d3e]'}">
                            ${window.i18n.t('filterAll')}
                        </button>
                        <button type="button" onclick="Manager.setFilter('inside')" class="px-3 py-1.5 rounded-lg font-bold transition-all ${this.activeFilter === 'inside' ? 'bg-[#107e3e] text-white shadow-sm' : 'text-[#556b82] hover:text-[#1d2d3e]'}">
                            ${window.i18n.t('filterInside')} (${insideCount})
                        </button>
                        <button type="button" onclick="Manager.setFilter('overstay')" class="px-3 py-1.5 rounded-lg font-bold transition-all ${this.activeFilter === 'overstay' ? 'bg-[#bb0000] text-white shadow-sm' : 'text-[#556b82] hover:text-[#1d2d3e]'}">
                            ${window.i18n.t('filterOverstay')} (${overstayLogs.length})
                        </button>
                    </div>
                </div>

                <!-- Table Content -->
                <div class="overflow-x-auto bg-white">
                    <table class="w-full text-sm ${lang === 'ar' ? 'text-right' : 'text-left'}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                        <thead class="bg-[#f5f8fc] text-[#556b82] text-xs uppercase tracking-wider font-bold border-b border-[#d7e2ee]">
                            <tr>
                                <th class="py-3.5 px-4">${window.i18n.t('plateNumber')}</th>
                                <th class="py-3.5 px-4">${window.i18n.t('driverName')} / ${window.i18n.t('driverPhone')}</th>
                                <th class="py-3.5 px-4">${window.i18n.t('company')}</th>
                                <th class="py-3.5 px-4">${window.i18n.t('destination')}</th>
                                <th class="py-3.5 px-4">${window.i18n.t('timeEntered')}</th>
                                <th class="py-3.5 px-4">${window.i18n.t('durationInside')}</th>
                                <th class="py-3.5 px-4">${window.i18n.t('status')}</th>
                                <th class="py-3.5 px-4 text-center">${window.i18n.t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-[#e7eff7] font-medium">
                            ${this.renderTableRows(lang)}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    renderTableRows(lang) {
        const vehicles = window.DB.getVehicles();
        const permits = window.DB.getPermits();
        const settings = window.DB.getSettings();
        const icon = (name, cls = 'w-3.5 h-3.5') => window.Icons ? window.Icons.get(name, cls) : '';

        let filteredVehicles = vehicles.filter(v => {
            const insideLog = window.DB.isVehicleInside(v.id);
            if (this.activeFilter === 'inside') return insideLog !== null;
            if (this.activeFilter === 'overstay') {
                if (!insideLog) return false;
                const hrs = (Date.now() - new Date(insideLog.timestamp).getTime()) / 3600000;
                return hrs >= (settings.overstay_hours_threshold || 3);
            }
            return true;
        });

        if (filteredVehicles.length === 0) {
            return `
                <tr>
                    <td colspan="8" class="text-center py-12 text-[#556b82]">
                        <div class="w-12 h-12 rounded-2xl bg-[#ebf3fb] text-[#0070f2] flex items-center justify-center mx-auto mb-2.5">
                            ${icon('search', 'w-6 h-6')}
                        </div>
                        <p class="font-bold text-sm text-[#1d2d3e]">${lang === 'ar' ? 'لا توجد مركبات أو تصاريح حالياً (لوحة التحكم نظيفة)' : 'No vehicles or permits found'}</p>
                        <p class="text-xs text-[#556b82] mt-1">${lang === 'ar' ? 'اضغط على زر "إصدار تصريح سريع" للبدء' : 'Click "Quick Pass" to create your first gate entry pass'}</p>
                    </td>
                </tr>
            `;
        }

        return filteredVehicles.map(vehicle => {
            const insideLog = window.DB.isVehicleInside(vehicle.id);
            const permit = window.DB.findPermitByCodeOrVehicle(null, vehicle.id);
            
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
                statusBadge = `<span class="px-2.5 py-1 rounded-full text-xs badge-exited flex items-center gap-1 w-fit"><span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span> <span>${window.i18n.t('statusExited')}</span></span>`;
            }

            const driverName = (lang === 'ar' ? vehicle.driver_name_ar : vehicle.driver_name_en) || 'سائق مصرح';
            const companyName = (lang === 'ar' ? vehicle.company_ar : vehicle.company_en) || 'عام';
            const destination = permit ? (lang === 'ar' ? permit.destination_ar : permit.destination_en) : 'المصنع الرئيسي';

            return `
                <tr class="sap-table-row hover:bg-[#f5f8fc] transition-colors">
                    <td class="py-3.5 px-4">
                        ${window.ArabicPlate.renderEgyptianPlate(vehicle.plate_ar, 'compact', vehicle.vehicle_type)}
                    </td>
                    <td class="py-3.5 px-4">
                        <div class="font-bold text-[#1d2d3e]">${driverName}</div>
                        <div class="text-xs text-[#0070f2] font-mono font-bold flex items-center gap-1.5 mt-0.5">
                            ${icon('phone', 'w-3 h-3 text-[#0070f2]')}
                            <span>${vehicle.driver_phone || 'لا يوجد هاتف'}</span>
                        </div>
                    </td>
                    <td class="py-3.5 px-4 text-[#556b82] font-semibold">
                        ${companyName}
                    </td>
                    <td class="py-3.5 px-4">
                        <span class="px-2.5 py-1 bg-[#f0f4f8] rounded-lg text-xs font-mono font-bold text-[#002b66] border border-[#d7e2ee]">
                            ${destination}
                        </span>
                    </td>
                    <td class="py-3.5 px-4 text-[#556b82] font-mono text-xs">
                        ${entryTimeText}
                    </td>
                    <td class="py-3.5 px-4">
                        ${durationText}
                    </td>
                    <td class="py-3.5 px-4">
                        ${statusBadge}
                    </td>
                    <td class="py-3.5 px-4 text-center">
                        <div class="flex items-center justify-center gap-1.5">
                            ${permit ? `
                                <button type="button" title="عرض وطباعة التصريح" onclick="Manager.showPassModal(${permit.id})" class="px-2.5 py-1.5 bg-[#ebf3fb] hover:bg-[#d5e7fa] text-[#0070f2] rounded-lg border border-[#b3d5fa] text-xs font-bold flex items-center gap-1 shadow-sm">
                                    ${icon('qrcode', 'w-3.5 h-3.5')}
                                    <span>كارت التصريح</span>
                                </button>
                            ` : `
                                <button type="button" title="إصدار تصريح" onclick="Manager.openQuickPermitModal(${vehicle.id})" class="px-2.5 py-1.5 bg-[#e5f6eb] hover:bg-[#cdeed7] text-[#107e3e] rounded-lg border border-[#b4e3c4] text-xs font-bold flex items-center gap-1 shadow-sm">
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

    openSettingsModal() {
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) return;
        const lang = window.i18n.getLang();
        const settings = window.DB.getSettings();
        const icon = (name, cls = 'w-4 h-4') => window.Icons ? window.Icons.get(name, cls) : '';

        modalContainer.innerHTML = `
            <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
                <div class="sap-panel w-full max-w-lg rounded-3xl border border-[#b0cfee] shadow-2xl p-6 relative animate-scaleUp bg-white ${lang === 'ar' ? 'text-right' : 'text-left'}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                    <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="absolute top-4 ${lang === 'ar' ? 'left-4' : 'right-4'} text-[#556b82] hover:text-[#1d2d3e] text-xl font-bold">
                        ✕
                    </button>

                    <div class="flex items-center gap-3 mb-5 border-b border-[#d7e2ee] pb-3">
                        <div class="w-12 h-12 rounded-2xl bg-[#ebf3fb] text-[#0070f2] flex items-center justify-center border border-[#b3d5fa] shadow-sm">
                            ${icon('settings', 'w-6 h-6')}
                        </div>
                        <div>
                            <h3 class="text-lg font-black text-[#002b66]">${lang === 'ar' ? 'إعدادات النظام ورقم واتساب الافتراضي' : 'System & Dispatch WhatsApp Settings'}</h3>
                            <p class="text-xs text-[#556b82] font-semibold">${lang === 'ar' ? 'تحديد الرقم الافتراضي لإرسال كافة طلبات وتصاريح الدخول تلقائياً' : 'Configure default number for all automated permit notifications'}</p>
                        </div>
                    </div>

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
                                <label class="block text-xs font-bold text-[#556b82] mb-1">اسم البوابة الرئيسية</label>
                                <input type="text" id="setting-gate" value="${settings.gate_name_ar || 'بوابة مصانع دوترا الرئيسية'}" class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl px-3 py-2 text-xs font-bold text-[#1d2d3e]" />
                            </div>
                        </div>

                        <div>
                            <label class="block text-xs font-bold text-[#556b82] mb-1">تنبيه تجاوز المدة (بالساعات)</label>
                            <input type="number" id="setting-overstay" min="1" max="24" value="${settings.overstay_hours_threshold || 3}" class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl px-3 py-2 text-xs font-bold text-[#1d2d3e]" />
                        </div>

                        <!-- Danger Zone: Reset All Data -->
                        <div class="bg-red-50 p-3.5 rounded-2xl border border-red-200 flex items-center justify-between">
                            <div>
                                <div class="text-xs font-bold text-red-700">مسح وتصفير كافة البيانات</div>
                                <div class="text-[10px] text-red-500 font-medium">حذف كافة التصاريح القديمة لبدء صفحة نظيفة</div>
                            </div>
                            <button type="button" onclick="Manager.resetAllData()" class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1">
                                ${icon('trash', 'w-3.5 h-3.5')}
                                <span>تصفير الآن</span>
                            </button>
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
                </div>
            </div>
        `;
    }

    resetAllData() {
        if (confirm("هل أنت متأكد من رغبتك في تصفير ومسح كافة التصاريح والمركبات؟")) {
            window.DB.clearAllData();
            document.getElementById('modal-container').innerHTML = '';
            this.renderDashboard();
            alert("تم مسح وتصفير كافة البيانات بنجاح!");
        }
    }

    saveSettings(e) {
        e.preventDefault();
        const whatsapp = document.getElementById('setting-default-whatsapp').value.trim();
        const company = document.getElementById('setting-company').value.trim();
        const gate = document.getElementById('setting-gate').value.trim();
        const overstay = parseInt(document.getElementById('setting-overstay').value) || 3;

        window.DB.updateSettings({
            default_whatsapp: whatsapp,
            company_name_ar: company,
            gate_name_ar: gate,
            overstay_hours_threshold: overstay
        });

        document.getElementById('modal-container').innerHTML = '';
        alert(window.i18n.getLang() === 'ar' ? 'تم حفظ الإعدادات ورقم واتساب الافتراضي بنجاح' : 'Settings saved successfully');
        this.renderDashboard();
    }

    openQuickPermitModal(vehicleId = null) {
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) return;
        const lang = window.i18n.getLang();
        const settings = window.DB.getSettings();
        const icon = (name, cls = 'w-4 h-4') => window.Icons ? window.Icons.get(name, cls) : '';

        const vehicle = vehicleId ? window.DB.getVehicles().find(v => v.id === vehicleId) : null;

        modalContainer.innerHTML = `
            <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
                <div class="sap-panel w-full max-w-lg rounded-3xl border border-[#b0cfee] shadow-2xl p-6 relative animate-scaleUp bg-white ${lang === 'ar' ? 'text-right' : 'text-left'}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                    <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="absolute top-4 ${lang === 'ar' ? 'left-4' : 'right-4'} text-[#556b82] hover:text-[#1d2d3e] text-xl font-bold">
                        ✕
                    </button>

                    <div class="flex items-center gap-3 mb-5 border-b border-[#d7e2ee] pb-3">
                        <div class="w-12 h-12 rounded-2xl bg-[#ebf3fb] text-[#0070f2] flex items-center justify-center border border-[#b3d5fa] shadow-sm">
                            ${icon('bolt', 'w-6 h-6 text-[#0070f2]')}
                        </div>
                        <div>
                            <h3 class="text-lg font-black text-[#002b66]">${lang === 'ar' ? 'إصدار تصريح دخول سريع' : 'Fast Vehicle Gate Pass'}</h3>
                            <p class="text-xs text-[#0070f2] font-bold">${lang === 'ar' ? 'فقط أدخل رقم اللوحة ورقم هاتف السائق' : 'Requires Vehicle Plate & Driver Phone only'}</p>
                        </div>
                    </div>

                    <form id="quick-permit-form" onsubmit="Manager.submitQuickPermit(event)">
                        
                        <!-- 1. Vehicle Plate -->
                        <div class="bg-[#f8fafc] p-4 rounded-2xl border-2 border-[#b0cfee] mb-4 shadow-sm">
                            <label class="block text-xs font-bold text-[#1d2d3e] mb-1.5 flex justify-between items-center">
                                <span>1️⃣ ${lang === 'ar' ? 'رقم لوحة المركبة (مثال: ط ر ق ٩ ٨ ٢ ١):' : 'Vehicle Plate Number:'}</span>
                                <button type="button" onclick="Manager.toggleKeypad('quick-keypad', 'quick-plate')" class="text-[#0070f2] hover:text-[#005cbd] text-xs font-bold flex items-center gap-1">
                                    ${icon('keyboard', 'w-3.5 h-3.5')}
                                    <span>${window.i18n.t('arabicKeyboard')}</span>
                                </button>
                            </label>
                            
                            <input type="text" id="quick-plate" required placeholder="ط ر ق ٩ ٨ ٢ ١" value="${vehicle ? vehicle.plate_ar : ''}" class="w-full bg-white border-2 border-[#d7e2ee] rounded-xl px-4 py-3 text-[#1d2d3e] font-black text-lg focus:border-[#0070f2] focus:outline-none" oninput="Manager.updateQuickPlatePreview(this.value)" />

                            <div id="quick-keypad" class="hidden">
                                ${window.ArabicPlate.renderArabicKeypad('quick-plate')}
                            </div>

                            <div class="mt-3 flex items-center justify-between bg-white p-2.5 rounded-xl border border-[#d7e2ee]">
                                <span class="text-xs text-[#556b82] font-bold">${lang === 'ar' ? 'معاينة اللوحة:' : 'Preview:'}</span>
                                <div id="quick-plate-preview">
                                    ${window.ArabicPlate.renderEgyptianPlate(vehicle ? vehicle.plate_ar : 'ط ر ق ٩ ٨ ٢ ١', 'compact')}
                                </div>
                            </div>
                        </div>

                        <!-- 2. Driver Phone Number -->
                        <div class="bg-[#f8fafc] p-4 rounded-2xl border-2 border-[#b0cfee] mb-4 shadow-sm">
                            <label class="block text-xs font-bold text-[#1d2d3e] mb-1.5">
                                2️⃣ ${lang === 'ar' ? 'رقم هاتف / واتساب السائق (لإرسال كارت التصريح له):' : 'Driver Phone / WhatsApp:'}
                            </label>
                            <div class="relative">
                                <span class="absolute ${lang === 'ar' ? 'right-3' : 'left-3'} top-3 text-[#0070f2] font-bold text-sm">
                                    ${icon('phone', 'w-4 h-4')}
                                </span>
                                <input type="tel" id="quick-phone" required placeholder="01012345678 أو +201012345678" value="${vehicle ? vehicle.driver_phone : ''}" class="w-full bg-white border-2 border-[#d7e2ee] rounded-xl ${lang === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 text-[#1d2d3e] font-mono font-bold text-base focus:border-[#0070f2] focus:outline-none" />
                            </div>
                            <div class="mt-2 flex items-center justify-between text-[11px] text-[#556b82]">
                                <span>الرقم الافتراضي للإدارة: <b class="font-mono text-[#0070f2]">${settings.default_whatsapp}</b></span>
                                <button type="button" onclick="Manager.openSettingsModal()" class="text-[#0070f2] hover:underline font-bold">تغيير</button>
                            </div>
                        </div>

                        <!-- Optional Extra Details -->
                        <details class="bg-[#f0f4f8] rounded-xl p-3 border border-[#d7e2ee] mb-5 text-xs">
                            <summary class="font-bold text-[#002b66] cursor-pointer hover:text-[#0070f2] flex items-center justify-between">
                                <span>➕ ${lang === 'ar' ? 'تفاصيل إضافية اختيارية (اسم السائق، الشركة، الوجهة)' : 'Optional Extra Details'}</span>
                                <span class="text-[#556b82] text-[10px]">اضغط للتوسيع</span>
                            </summary>
                            <div class="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-[#d7e2ee]">
                                <div>
                                    <label class="block text-[11px] text-[#556b82] mb-1 font-bold">اسم السائق (اختياري)</label>
                                    <input type="text" id="quick-driver-name" placeholder="سائق مصرح" value="${vehicle ? vehicle.driver_name_ar : ''}" class="w-full bg-white border border-[#d7e2ee] rounded-lg p-2 text-[#1d2d3e] text-xs font-semibold" />
                                </div>
                                <div>
                                    <label class="block text-[11px] text-[#556b82] mb-1 font-bold">الشركة / المورد (اختياري)</label>
                                    <input type="text" id="quick-company" placeholder="توريدات عامة" value="${vehicle ? vehicle.company_ar : ''}" class="w-full bg-white border border-[#d7e2ee] rounded-lg p-2 text-[#1d2d3e] text-xs font-semibold" />
                                </div>
                                <div class="col-span-2">
                                    <label class="block text-[11px] text-[#556b82] mb-1 font-bold">نوع المركبة</label>
                                    <select id="quick-type" class="w-full bg-white border border-[#d7e2ee] rounded-lg p-2 text-[#1d2d3e] text-xs font-bold">
                                        <option value="truckHeavy">🔴 نقل ثقيل / تريلا</option>
                                        <option value="truckMedium">🔴 نقل متوسط / دينا</option>
                                        <option value="van">🟡 فان بضائع</option>
                                        <option value="tanker">🔴 صهريج وقود</option>
                                        <option value="car">🔵 سيارة ملاكي</option>
                                    </select>
                                </div>
                            </div>
                        </details>

                        <div class="flex justify-end gap-3 pt-2">
                            <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="px-4 py-2.5 sap-btn-secondary text-xs">
                                ${lang === 'ar' ? 'إلغاء' : 'Cancel'}
                            </button>
                            <button type="submit" class="flex-1 py-3 sap-btn-primary text-sm flex items-center justify-center gap-2 font-bold shadow-md">
                                ${icon('qrcode', 'w-4 h-4')}
                                <span>${lang === 'ar' ? 'توليد كارت التصريح والـ QR فوراً' : 'Generate Pass Card & QR'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    updateQuickPlatePreview(val) {
        const preview = document.getElementById('quick-plate-preview');
        if (preview) {
            preview.innerHTML = window.ArabicPlate.renderEgyptianPlate(val || 'ط ر ق ٩ ٨ ٢ ١', 'compact');
        }
    }

    toggleKeypad(boxId, inputId) {
        const box = document.getElementById(boxId);
        if (box) box.classList.toggle('hidden');
    }

    submitQuickPermit(e) {
        e.preventDefault();
        const plate = document.getElementById('quick-plate').value.trim();
        const phone = document.getElementById('quick-phone').value.trim();
        const driverName = document.getElementById('quick-driver-name')?.value.trim() || 'سائق مصرح';
        const company = document.getElementById('quick-company')?.value.trim() || 'توريدات عامة';
        const type = document.getElementById('quick-type')?.value || 'truckHeavy';

        let vehicle = window.DB.findVehicleByPlate(plate);
        if (!vehicle) {
            vehicle = window.DB.addVehicle({
                plate_ar: plate,
                plate_en: plate,
                vehicle_type: type,
                driver_name_ar: driverName,
                driver_name_en: driverName,
                driver_phone: phone,
                company_ar: company,
                company_en: company,
                status: 'visitor'
            });
        } else {
            vehicle.driver_phone = phone;
        }

        const permit = window.DB.addPermit({
            vehicle_id: vehicle.id,
            destination_ar: 'المستودع الرئيسي',
            destination_en: 'Main Plant',
            purpose_ar: 'تصريح دخول سريع',
            purpose_en: 'Fast Entry Pass',
            cargo_details: 'بضائع مصرحة',
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

        const qrPayload = JSON.stringify({
            permit: permit.permit_code,
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
                    <div id="printable-pass-card" class="bg-white p-5 rounded-2xl border-2 border-[#002b66] shadow-sm text-center mb-4">
                        
                        <!-- Official DOTRA Header (Print Optimized) -->
                        <div class="flex items-center justify-between border-b-2 border-[#002b66] pb-3 mb-4 text-right" dir="rtl">
                            <div class="flex items-center gap-3">
                                <img src="assets/logo.jpg" alt="DOTRA" class="h-12 w-auto object-contain" />
                                <div>
                                    <div class="font-black text-base text-[#002b66]">${settings.company_name_ar || 'مجموعة دوترا للصناعات'}</div>
                                    <div class="text-[11px] text-[#556b82] font-bold">إدارة الأمن والسلامة المهنية • تصريح دخول البوابة الرسمي</div>
                                </div>
                            </div>
                            <div class="text-left" dir="ltr">
                                <span class="inline-block px-3 py-1 bg-[#e5f6eb] text-[#107e3e] border border-[#b4e3c4] rounded-full text-xs font-black">
                                    🟢 AUTHORIZED
                                </span>
                                <div class="text-[10px] text-[#556b82] font-mono mt-1 font-bold">${permit.permit_code}</div>
                            </div>
                        </div>

                        <!-- Egyptian License Plate Badge (Centered) -->
                        <div class="mb-4 flex justify-center">
                            ${window.ArabicPlate.renderEgyptianPlate(vehicle.plate_ar, 'normal', vehicle.vehicle_type)}
                        </div>

                        <!-- QR Code Container (Large & Centered) -->
                        <div class="bg-white p-3 rounded-2xl shadow-inner inline-flex items-center justify-center my-1 border-2 border-[#d7e2ee] min-w-[160px] min-h-[160px]" id="qrcode-canvas-box">
                        </div>

                        <!-- Tabular Permit Details (High Clarity Table for Print) -->
                        <div class="bg-[#f8fafc] rounded-xl p-4 border border-[#d7e2ee] text-xs text-right mt-3 space-y-2" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                            <div class="grid grid-cols-2 gap-2 border-b border-[#e7eff7] pb-1.5">
                                <div>
                                    <span class="text-[#556b82] font-bold">رقم التصريح: </span>
                                    <span class="font-mono font-black text-[#0070f2]">${permit.permit_code}</span>
                                </div>
                                <div>
                                    <span class="text-[#556b82] font-bold">تاريخ وساعة الصلاحية: </span>
                                    <span class="font-bold text-[#b85500] font-mono">${validDateText} - ${validUntilText}</span>
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

                            <div class="grid grid-cols-2 gap-2">
                                <div>
                                    <span class="text-[#556b82] font-bold">الشركة / الجهة: </span>
                                    <span class="font-semibold text-[#1d2d3e]">${vehicle.company_ar || 'توريدات عامة'}</span>
                                </div>
                                <div>
                                    <span class="text-[#556b82] font-bold">الوجهة بالمصنع: </span>
                                    <span class="font-semibold text-[#002b66]">${permit.destination_ar || 'المستودع الرئيسي'}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Official Signature Boxes (Appears on Print) -->
                        <div class="print-signature-box hidden text-xs text-right" dir="rtl">
                            <div class="p-3 border border-[#cbd5e1] rounded-lg">
                                <div class="font-bold text-[#002b66] mb-8">توقيع واعتماد ضابط أمن البوابة:</div>
                                <div class="border-b border-dashed border-[#94a3b8]"></div>
                                <div class="text-[10px] text-[#64748b] mt-1">الاسم / الختم الرسمي</div>
                            </div>
                            <div class="p-3 border border-[#cbd5e1] rounded-lg">
                                <div class="font-bold text-[#002b66] mb-8">توقيع واستلام سائق المركبة:</div>
                                <div class="border-b border-dashed border-[#94a3b8]"></div>
                                <div class="text-[10px] text-[#64748b] mt-1">الالتزام بلائحة السلامة والسرعة المحددة</div>
                            </div>
                        </div>
                    </div>

                    <!-- Screen Action Buttons (Hidden on Print) -->
                    <div class="no-print flex flex-col gap-2.5">
                        
                        <!-- Send to Driver WhatsApp -->
                        <button type="button" onclick="Manager.shareWhatsAppImage('${permit.permit_code}', '${vehicle.plate_ar}', '${vehicle.driver_phone || ''}', '${lang === 'ar' ? vehicle.driver_name_ar : vehicle.driver_name_en}', '${validUntilText}')" class="w-full py-3.5 bg-[#107e3e] hover:bg-[#0c6b33] text-white font-black rounded-xl shadow-md text-sm flex items-center justify-center gap-2 transition-transform hover:-translate-y-0.5">
                            ${icon('whatsapp', 'w-5 h-5 text-white')}
                            <span>${lang === 'ar' ? `إرسال كصورة لواتساب السائق (${vehicle.driver_phone || 'غير مسجل'})` : 'Send Image to Driver WhatsApp'}</span>
                        </button>

                        <!-- Send to Default Dispatcher Number -->
                        <button type="button" onclick="Manager.shareWhatsAppImage('${permit.permit_code}', '${vehicle.plate_ar}', '${settings.default_whatsapp || ''}', '${lang === 'ar' ? vehicle.driver_name_ar : vehicle.driver_name_en}', '${validUntilText}')" class="w-full py-2.5 bg-[#0070f2] hover:bg-[#005cbd] text-white font-bold rounded-xl shadow-sm text-xs flex items-center justify-center gap-2">
                            ${icon('building', 'w-4 h-4 text-white')}
                            <span>${lang === 'ar' ? `إرسال للرقم الافتراضي للبوابة / الإدارة (${settings.default_whatsapp})` : 'Send to Default Dispatcher'}</span>
                        </button>

                        <div class="grid grid-cols-2 gap-2">
                            <button type="button" onclick="Manager.printPass()" class="py-2.5 sap-btn-secondary text-xs flex items-center justify-center gap-1.5 font-bold">
                                ${icon('printer', 'w-4 h-4')}
                                <span>${lang === 'ar' ? 'طباعة تصريح A4 معتمد' : 'Print A4 Pass'}</span>
                            </button>
                            <button type="button" onclick="Manager.downloadPassImage('${permit.permit_code}', '${vehicle.plate_ar}', '${vehicle.driver_phone || ''}')" class="py-2.5 sap-btn-secondary text-xs flex items-center justify-center gap-1.5 font-bold">
                                ${icon('download', 'w-4 h-4')}
                                <span>${lang === 'ar' ? 'تحميل كصورة (PNG)' : 'Download Image'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        if (window.QREngine) {
            window.QREngine.render('qrcode-canvas-box', qrPayload, { size: 160 });
        }
    }

    printPass() {
        const oldTitle = document.title;
        document.title = `DOTRA_Gate_Permit_${Date.now()}`;
        window.print();
        document.title = oldTitle;
    }

    static createPassCanvasDataUrl(permitCode, plate, phone, driverName, validUntil) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const width = 600;
        const height = 860;
        canvas.width = width;
        canvas.height = height;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);

        const headerGradient = ctx.createLinearGradient(0, 0, width, 0);
        headerGradient.addColorStop(0, "#002b66");
        headerGradient.addColorStop(1, "#004b99");
        ctx.fillStyle = headerGradient;
        ctx.fillRect(0, 0, width, 120);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 26px 'Cairo', 'Tajawal', sans-serif";
        ctx.textAlign = "right";
        ctx.fillText("مجموعة دوترا - تصريح دخول البوابة", width - 30, 52);

        ctx.font = "bold 15px 'Cairo', sans-serif";
        ctx.fillStyle = "#a5f3fc";
        ctx.fillText("DOTRA Group - Vehicle Gate Access Permit", width - 30, 84);

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

        ctx.fillStyle = "#e5f6eb";
        ctx.strokeStyle = "#107e3e";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(180, 140, 240, 42, 21);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#107e3e";
        ctx.font = "bold 18px 'Cairo', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("🟢 تصريح معتمد (AUTHORIZED)", 300, 167);

        const plateY = 205;
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#1e293b";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(110, plateY, 380, 115, 14);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#dc2626";
        ctx.fillRect(112, plateY + 2, 376, 32);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 15px 'Cairo', monospace";
        ctx.textAlign = "left";
        ctx.fillText("EGYPT", 130, plateY + 23);
        ctx.textAlign = "center";
        ctx.fillText("نقل", 300, plateY + 23);
        ctx.textAlign = "right";
        ctx.fillText("مصر", 470, plateY + 23);

        const parsed = window.ArabicPlate ? window.ArabicPlate.parsePlateParts(plate) : { numbers: '٩٨٢١', letters: 'ط ر ق' };
        const digits = window.ArabicPlate ? window.ArabicPlate.toEasternArabicDigits(parsed.numbers) : parsed.numbers;

        ctx.fillStyle = "#0f172a";
        ctx.font = "bold 36px 'Cairo', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(digits || '٩٨٢١', 200, plateY + 84);
        
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(300, plateY + 36);
        ctx.lineTo(300, plateY + 110);
        ctx.stroke();

        ctx.fillText(parsed.letters || 'ط ر ق', 400, plateY + 84);

        const qrPayload = JSON.stringify({
            permit: permitCode,
            plate: plate,
            phone: phone
        });

        if (window.QREngine) {
            ctx.fillStyle = "#ffffff";
            ctx.strokeStyle = "#d7e2ee";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(190, 340, 220, 220, 16);
            ctx.fill();
            ctx.stroke();

            window.QREngine.drawToCanvas(ctx, qrPayload, 205, 355, 190, '#002b66', '#ffffff');
        }

        const infoY = 580;
        ctx.fillStyle = "#f8fafc";
        ctx.strokeStyle = "#d7e2ee";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(50, infoY, 500, 200, 16);
        ctx.fill();
        ctx.stroke();

        ctx.font = "bold 17px 'Cairo', sans-serif";
        ctx.textAlign = "right";

        ctx.fillStyle = "#556b82";
        ctx.fillText("كود التصريح:", 520, infoY + 45);
        ctx.fillStyle = "#0070f2";
        ctx.fillText(permitCode, 380, infoY + 45);

        ctx.fillStyle = "#556b82";
        ctx.fillText("هاتف السائق:", 520, infoY + 90);
        ctx.fillStyle = "#107e3e";
        ctx.fillText(phone || "غير مسجل", 380, infoY + 90);

        ctx.fillStyle = "#556b82";
        ctx.fillText("اسم السائق:", 520, infoY + 135);
        ctx.fillStyle = "#1d2d3e";
        ctx.fillText(driverName || "سائق مصرح", 380, infoY + 135);

        ctx.fillStyle = "#556b82";
        ctx.fillText("صالح حتى:", 520, infoY + 175);
        ctx.fillStyle = "#b85500";
        ctx.fillText(validUntil, 380, infoY + 175);

        ctx.fillStyle = "#556b82";
        ctx.font = "bold 13px 'Cairo', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("يرجى إبراز هذا الرمز لمسؤول البوابة عند الوصول • نظام بوابات دوترا الذكي", 300, 825);

        return canvas.toDataURL('image/png');
    }

    static dataURItoBlob(dataURI) {
        const byteString = atob(dataURI.split(',')[1]);
        const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([ab], { type: mimeString });
    }

    async shareWhatsAppImage(permitCode, plate, phone, driverName, validUntil) {
        const dataUrl = Manager.createPassCanvasDataUrl(permitCode, plate, phone, driverName, validUntil);
        const blob = Manager.dataURItoBlob(dataUrl);
        const file = new File([blob], `DOTRA_Gate_Pass_${permitCode}.png`, { type: 'image/png' });

        Manager.downloadPassImage(permitCode, plate, phone);

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: `تصريح دخول بوابة دوترا - ${permitCode}`,
                    text: `🛡️ تصريح دخول بوابة مصانع دوترا\nرقم التصريح: ${permitCode}\n🚘 رقم لوحة المركبة: ${plate}\n📞 هاتف: ${phone}\nصالح حتى: ${validUntil}`
                });
                return;
            } catch (err) {
                console.log("Native share dismissed:", err);
            }
        }

        this.shareWhatsApp(permitCode, plate, phone);
    }

    downloadPassImage(permitCode, plate, phone) {
        const vehicle = window.DB.findVehicleByPlate(plate) || {};
        const dataUrl = Manager.createPassCanvasDataUrl(
            permitCode, 
            plate, 
            phone, 
            vehicle.driver_name_ar || 'سائق مصرح', 
            new Date(Date.now() + 8 * 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        );
        
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `DOTRA_Pass_${permitCode}_${plate.replace(/\s+/g, '_')}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    shareWhatsApp(permitCode, plate, phone) {
        const text = encodeURIComponent(`🛡️ تصريح دخول بوابة مصانع دوترا\nرقم التصريح: ${permitCode}\n🚘 رقم لوحة المركبة: ${plate}\nيرجى إبراز هذا الرمز لمسؤول البوابة عند الوصول.`);
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
