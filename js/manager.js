// Office Manager Dashboard Controller (DOTRA WhatsApp Pass Image Generator)
// وحدة التحكم ببوابة مدير المكتب - مجموعة دوترا (توليد QR متكامل وفوري 100%)

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

        const insideLogs = logs.filter(l => l.action_type === 'entry' && !l.exit_timestamp);
        const insideCount = insideLogs.length;

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEntries = logs.filter(l => l.action_type === 'entry' && new Date(l.timestamp) >= todayStart).length;

        const overstayLogs = insideLogs.filter(l => {
            const durationHrs = (Date.now() - new Date(l.timestamp).getTime()) / 3600000;
            return durationHrs >= 3;
        });

        const activePermits = permits.filter(p => p.status === 'active').length;

        container.innerHTML = `
            <!-- Top Dashboard Bar -->
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                <div>
                    <h1 class="text-2xl font-black text-[#002b66] flex items-center gap-2">
                        <span>🏢</span>
                        <span>${lang === 'ar' ? 'لوحة تحكم مدير العمليات وتصاريح البوابات' : 'Operations & Gate Permits Dashboard'}</span>
                    </h1>
                    <p class="text-xs text-[#556b82] mt-1 font-medium">
                        ${lang === 'ar' ? 'نظام تصاريح بوابات مصانع مجموعة دوترا - إرسال كروت التصاريح كصور عبر واتساب' : 'DOTRA Gate System - Send Pass Badges with QR & Plate to WhatsApp'}
                    </p>
                </div>
                <div class="flex items-center gap-3">
                    <button type="button" onclick="Manager.openQuickPermitModal()" class="sap-btn-primary px-5 py-2.5 flex items-center gap-2 text-sm shadow-md">
                        <span class="text-lg font-bold leading-none">⚡</span>
                        <span>${lang === 'ar' ? 'إصدار تصريح سريع (لوحة + هاتف)' : 'Quick Pass (Plate + Phone)'}</span>
                    </button>
                    <button type="button" onclick="Manager.exportCSV()" class="sap-btn-secondary px-3.5 py-2.5 flex items-center gap-2 text-sm shadow-sm">
                        <span>📥</span>
                        <span class="hidden sm:inline">${window.i18n.t('exportCsv')}</span>
                    </button>
                </div>
            </div>

            <!-- SAP KPI Metric Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                <div class="sap-card p-5 border-t-4 border-t-[#107e3e] flex items-center justify-between">
                    <div>
                        <p class="text-xs font-bold text-[#556b82] uppercase tracking-wider">${window.i18n.t('metricInside')}</p>
                        <h3 class="text-3xl font-black text-[#1d2d3e] mt-1 font-mono">${insideCount}</h3>
                        <p class="text-[11px] text-[#107e3e] mt-1 font-bold flex items-center gap-1">
                            <span class="inline-block w-2 h-2 rounded-full bg-[#107e3e] animate-pulse"></span>
                            ${lang === 'ar' ? 'متواجدون داخل المصنع' : 'Active on premises'}
                        </p>
                    </div>
                    <div class="w-12 h-12 rounded-xl bg-[#e5f6eb] text-[#107e3e] flex items-center justify-center text-2xl font-bold">
                        🚛
                    </div>
                </div>

                <div class="sap-card p-5 border-t-4 border-t-[#0070f2] flex items-center justify-between">
                    <div>
                        <p class="text-xs font-bold text-[#556b82] uppercase tracking-wider">${window.i18n.t('metricToday')}</p>
                        <h3 class="text-3xl font-black text-[#1d2d3e] mt-1 font-mono">${todayEntries}</h3>
                        <p class="text-[11px] text-[#0070f2] mt-1 font-bold">
                            ${lang === 'ar' ? 'حركة دخول عبر كافة البوابات' : 'Recorded entries'}
                        </p>
                    </div>
                    <div class="w-12 h-12 rounded-xl bg-[#ebf3fb] text-[#0070f2] flex items-center justify-center text-2xl font-bold">
                        📈
                    </div>
                </div>

                <div class="sap-card p-5 border-t-4 border-t-[#bb0000] flex items-center justify-between ${overstayLogs.length > 0 ? 'ring-2 ring-red-300' : ''}">
                    <div>
                        <p class="text-xs font-bold text-[#556b82] uppercase tracking-wider">${window.i18n.t('metricOverstay')}</p>
                        <h3 class="text-3xl font-black text-[#bb0000] mt-1 font-mono">${overstayLogs.length}</h3>
                        <p class="text-[11px] text-[#bb0000] mt-1 font-bold">
                            ${overstayLogs.length > 0 ? (lang === 'ar' ? 'تجاوزوا مدة البقاء (>3 س)' : 'Overstayed (>3 hrs)') : (lang === 'ar' ? 'لا توجد تجاوزات' : 'Zero violations')}
                        </p>
                    </div>
                    <div class="w-12 h-12 rounded-xl bg-[#ffebeb] text-[#bb0000] flex items-center justify-center text-2xl font-bold">
                        ⚠️
                    </div>
                </div>

                <div class="sap-card p-5 border-t-4 border-t-[#b85500] flex items-center justify-between">
                    <div>
                        <p class="text-xs font-bold text-[#556b82] uppercase tracking-wider">${window.i18n.t('metricPending')}</p>
                        <h3 class="text-3xl font-black text-[#1d2d3e] mt-1 font-mono">${activePermits}</h3>
                        <p class="text-[11px] text-[#b85500] mt-1 font-bold">
                            ${lang === 'ar' ? 'تصاريح فعالة بانتظار الوصول' : 'Active valid permits'}
                        </p>
                    </div>
                    <div class="w-12 h-12 rounded-xl bg-[#fff1e5] text-[#b85500] flex items-center justify-center text-2xl font-bold">
                        🎫
                    </div>
                </div>
            </div>

            <!-- SAP Live Vehicle Activity Table -->
            <div class="sap-panel overflow-hidden shadow-md">
                <div class="p-4 bg-[#f8fafc] border-b border-[#d7e2ee] flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div class="flex items-center gap-2">
                        <h2 class="text-base font-bold text-[#002b66] flex items-center gap-2">
                            <span>🛰️</span>
                            <span>${lang === 'ar' ? 'سجل حركة المركبات المباشر' : 'Live Vehicle Stream'}</span>
                        </h2>
                        <span class="px-2 py-0.5 bg-[#e5f6eb] text-[#107e3e] text-xs rounded-full font-mono font-bold border border-[#b4e3c4]">
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
                    <table class="w-full text-left text-sm" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
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

        let filteredVehicles = vehicles.filter(v => {
            const insideLog = window.DB.isVehicleInside(v.id);
            if (this.activeFilter === 'inside') return insideLog !== null;
            if (this.activeFilter === 'overstay') {
                if (!insideLog) return false;
                const hrs = (Date.now() - new Date(insideLog.timestamp).getTime()) / 3600000;
                return hrs >= 3;
            }
            return true;
        });

        if (filteredVehicles.length === 0) {
            return `
                <tr>
                    <td colspan="8" class="text-center py-10 text-[#556b82]">
                        <div class="text-3xl mb-2">🔍</div>
                        <p class="font-bold">${lang === 'ar' ? 'لا توجد مركبات مطابقة' : 'No vehicles found'}</p>
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
                statusBadge = `<span class="px-2.5 py-1 rounded-full text-xs badge-blacklisted">⛔ ${window.i18n.t('statusBanned')}</span>`;
            } else if (insideLog) {
                const entryTime = new Date(insideLog.timestamp);
                entryTimeText = entryTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const diffMinutes = Math.round((Date.now() - entryTime.getTime()) / 60000);
                const diffHours = (diffMinutes / 60).toFixed(1);
                
                if (diffMinutes >= 180) {
                    statusBadge = `<span class="px-2.5 py-1 rounded-full text-xs badge-overstay">⚠️ ${window.i18n.t('statusOverstay')}</span>`;
                    durationText = `<span class="text-[#bb0000] font-bold font-mono">${diffHours} ${lang === 'ar' ? 'ساعة' : 'hrs'}</span>`;
                } else {
                    statusBadge = `<span class="px-2.5 py-1 rounded-full text-xs badge-inside">🟢 ${window.i18n.t('statusInside')}</span>`;
                    durationText = `<span class="text-[#107e3e] font-bold font-mono">${diffMinutes < 60 ? `${diffMinutes} ${lang === 'ar' ? 'دقيقة' : 'min'}` : `${diffHours} ${lang === 'ar' ? 'ساعة' : 'hrs'}`}</span>`;
                }
            } else if (permit && permit.status === 'active') {
                statusBadge = `<span class="px-2.5 py-1 rounded-full text-xs badge-active">🎫 ${window.i18n.t('statusAuthorized')}</span>`;
            } else {
                statusBadge = `<span class="px-2.5 py-1 rounded-full text-xs badge-exited">⚪ ${window.i18n.t('statusExited')}</span>`;
            }

            const driverName = (lang === 'ar' ? vehicle.driver_name_ar : vehicle.driver_name_en) || 'سائق مصرح';
            const companyName = (lang === 'ar' ? vehicle.company_ar : vehicle.company_en) || 'عام';
            const destination = permit ? (lang === 'ar' ? permit.destination_ar : permit.destination_en) : 'المصنع الرئيسي';

            return `
                <tr class="hover:bg-[#f5f8fc] transition-colors">
                    <td class="py-3 px-4">
                        ${window.ArabicPlate.renderEgyptianPlate(vehicle.plate_ar, 'compact', vehicle.vehicle_type)}
                    </td>
                    <td class="py-3 px-4">
                        <div class="font-bold text-[#1d2d3e]">${driverName}</div>
                        <div class="text-xs text-[#0070f2] font-mono font-bold flex items-center gap-1">
                            <span>📞</span>
                            <span>${vehicle.driver_phone || 'لا يوجد هاتف'}</span>
                        </div>
                    </td>
                    <td class="py-3 px-4 text-[#556b82] font-semibold">
                        ${companyName}
                    </td>
                    <td class="py-3 px-4">
                        <span class="px-2.5 py-0.5 bg-[#f0f4f8] rounded-md text-xs font-mono font-bold text-[#002b66] border border-[#d7e2ee]">
                            ${destination}
                        </span>
                    </td>
                    <td class="py-3 px-4 text-[#556b82] font-mono text-xs">
                        ${entryTimeText}
                    </td>
                    <td class="py-3 px-4">
                        ${durationText}
                    </td>
                    <td class="py-3 px-4">
                        ${statusBadge}
                    </td>
                    <td class="py-3 px-4 text-center">
                        <div class="flex items-center justify-center gap-1.5">
                            ${permit ? `
                                <button type="button" title="${window.i18n.t('printPass')}" onclick="Manager.showPassModal(${permit.id})" class="p-1.5 bg-[#ebf3fb] hover:bg-[#d5e7fa] text-[#0070f2] rounded-lg border border-[#b3d5fa] text-xs font-bold flex items-center gap-1">
                                    <span>🎫</span>
                                    <span>كارت التصريح</span>
                                </button>
                            ` : `
                                <button type="button" title="${window.i18n.t('issueNewPermit')}" onclick="Manager.openQuickPermitModal(${vehicle.id})" class="p-1.5 bg-[#e5f6eb] hover:bg-[#cdeed7] text-[#107e3e] rounded-lg border border-[#b4e3c4] text-xs font-bold">
                                    ⚡ تصريح
                                </button>
                            `}
                            <button type="button" title="${vehicle.status === 'blacklist' ? 'إلغاء الحظر' : 'حظر المركبة'}" onclick="Manager.toggleBlacklist(${vehicle.id})" class="p-1.5 ${vehicle.status === 'blacklist' ? 'bg-[#e5f6eb] text-[#107e3e] border-[#b4e3c4]' : 'bg-[#ffebeb] text-[#bb0000] border-[#f6b3b3]'} hover:opacity-80 rounded-lg border text-xs">
                                ${vehicle.status === 'blacklist' ? '🔓' : '⛔'}
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

    openQuickPermitModal(vehicleId = null) {
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) return;
        const lang = window.i18n.getLang();

        const vehicle = vehicleId ? window.DB.getVehicles().find(v => v.id === vehicleId) : null;

        modalContainer.innerHTML = `
            <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                <div class="sap-panel w-full max-w-lg rounded-3xl border border-[#b0cfee] shadow-2xl p-6 relative animate-fadeIn bg-white" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                    <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="absolute top-4 ${lang === 'ar' ? 'left-4' : 'right-4'} text-[#556b82] hover:text-[#1d2d3e] text-xl font-bold">
                        ✕
                    </button>

                    <div class="flex items-center gap-3 mb-5 border-b border-[#d7e2ee] pb-3">
                        <div class="w-12 h-12 rounded-2xl bg-[#ebf3fb] text-[#0070f2] flex items-center justify-center text-2xl font-bold shadow-sm border border-[#b3d5fa]">
                            ⚡
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
                                    <span>⌨️</span>
                                    <span>${window.i18n.t('arabicKeyboard')}</span>
                                </button>
                            </label>
                            
                            <input type="text" id="quick-plate" required placeholder="ط ر ق ٩ ٨ ٢ ١" value="${vehicle ? vehicle.plate_ar : ''}" class="w-full bg-white border-2 border-[#d7e2ee] rounded-xl px-4 py-3 text-[#1d2d3e] font-black text-lg focus:border-[#0070f2] focus:outline-none" oninput="Manager.updateQuickPlatePreview(this.value)" />

                            <div id="quick-keypad" class="hidden">
                                ${window.ArabicPlate.renderArabicKeypad('quick-plate')}
                            </div>

                            <div class="mt-3 flex items-center justify-between bg-white p-2 rounded-xl border border-[#d7e2ee]">
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
                                <span class="absolute ${lang === 'ar' ? 'right-3' : 'left-3'} top-3 text-[#0070f2] font-bold text-sm">📞</span>
                                <input type="tel" id="quick-phone" required placeholder="01012345678 أو +201012345678" value="${vehicle ? vehicle.driver_phone : ''}" class="w-full bg-white border-2 border-[#d7e2ee] rounded-xl ${lang === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 text-[#1d2d3e] font-mono font-bold text-base focus:border-[#0070f2] focus:outline-none" />
                            </div>
                        </div>

                        <!-- Optional Extra Details (Collapsible) -->
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
                            <button type="submit" class="flex-1 py-3 sap-btn-primary text-sm flex items-center justify-center gap-2">
                                <span>🎫</span>
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
     * Render Digital Pass Modal with Guaranteed 100% Reliable QR Generator
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

        const qrPayload = JSON.stringify({
            permit: permit.permit_code,
            plate: vehicle.plate_ar,
            phone: vehicle.driver_phone
        });

        modalContainer.innerHTML = `
            <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                <div class="sap-panel w-full max-w-md rounded-3xl border border-[#b0cfee] shadow-2xl p-6 relative animate-fadeIn bg-white" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                    <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="absolute top-4 ${lang === 'ar' ? 'left-4' : 'right-4'} text-[#556b82] hover:text-[#1d2d3e] text-xl font-bold">
                        ✕
                    </button>

                    <!-- Printable & Exportable Badge Container -->
                    <div id="printable-pass-card" class="bg-white p-4 rounded-2xl border border-[#d7e2ee] shadow-sm text-center mb-4">
                        
                        <!-- Header with Logo -->
                        <div class="flex items-center justify-between border-b border-[#e7eff7] pb-2 mb-3">
                            <div class="flex items-center gap-2">
                                <img src="assets/logo.jpg" alt="DOTRA" class="h-9 w-auto object-contain" />
                                <div class="text-right" dir="rtl">
                                    <div class="font-black text-sm text-[#002b66]">مجموعة دوترا</div>
                                    <div class="text-[9px] text-[#556b82] font-semibold">تصريح دخول البوابة الإلكتروني</div>
                                </div>
                            </div>
                            <span class="px-2.5 py-0.5 bg-[#e5f6eb] text-[#107e3e] border border-[#b4e3c4] rounded-full text-[10px] font-black">
                                🟢 مصرح بالدخول
                            </span>
                        </div>

                        <!-- Egyptian Plate View -->
                        <div class="mb-3 flex justify-center">
                            ${window.ArabicPlate.renderEgyptianPlate(vehicle.plate_ar, 'normal', vehicle.vehicle_type)}
                        </div>

                        <!-- QR Code Pass Container -->
                        <div class="bg-white p-3 rounded-2xl shadow-inner inline-flex items-center justify-center my-1 border-2 border-[#d7e2ee] min-w-[150px] min-h-[150px]" id="qrcode-canvas-box">
                        </div>

                        <!-- Pass Summary Card -->
                        <div class="bg-[#f8fafc] rounded-xl p-3 border border-[#d7e2ee] text-xs text-right mt-2 space-y-1" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                            <div class="flex justify-between border-b border-[#e7eff7] pb-1">
                                <span class="text-[#556b82] font-bold">رقم التصريح:</span>
                                <span class="font-mono font-black text-[#0070f2]">${permit.permit_code}</span>
                            </div>
                            <div class="flex justify-between border-b border-[#e7eff7] pb-1">
                                <span class="text-[#556b82] font-bold">هاتف السائق:</span>
                                <span class="font-mono font-black text-[#107e3e]">${vehicle.driver_phone || 'غير مسجل'}</span>
                            </div>
                            <div class="flex justify-between border-b border-[#e7eff7] pb-1">
                                <span class="text-[#556b82] font-bold">${window.i18n.t('driverName')}:</span>
                                <span class="font-bold text-[#1d2d3e]">${lang === 'ar' ? vehicle.driver_name_ar : vehicle.driver_name_en}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-[#556b82] font-bold">صالح حتى:</span>
                                <span class="font-bold text-[#b85500] font-mono">${new Date(permit.valid_until).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>
                    </div>

                    <!-- WhatsApp & Image Action Buttons -->
                    <div class="flex flex-col gap-2">
                        <button type="button" onclick="Manager.shareWhatsAppImage('${permit.permit_code}', '${vehicle.plate_ar}', '${vehicle.driver_phone || ''}', '${lang === 'ar' ? vehicle.driver_name_ar : vehicle.driver_name_en}', '${new Date(permit.valid_until).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}')" class="w-full py-3.5 bg-[#107e3e] hover:bg-[#0c6b33] text-white font-black rounded-xl shadow-md text-sm flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5">
                            <span>📲</span>
                            <span>${lang === 'ar' ? 'مشاركة كارت التصريح كصورة عبر واتساب' : 'Share Pass Image to WhatsApp'}</span>
                        </button>

                        <div class="grid grid-cols-2 gap-2">
                            <button type="button" onclick="Manager.downloadPassImage('${permit.permit_code}', '${vehicle.plate_ar}', '${vehicle.driver_phone || ''}')" class="py-2.5 sap-btn-secondary text-xs flex items-center justify-center gap-1.5">
                                <span>📥</span>
                                <span>${lang === 'ar' ? 'تحميل كصورة (PNG)' : 'Download Image'}</span>
                            </button>
                            <button type="button" onclick="window.print()" class="py-2.5 sap-btn-secondary text-xs flex items-center justify-center gap-1.5">
                                <span>🖨️</span>
                                <span>${window.i18n.t('printPass')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Render QR Code immediately using QREngine
        if (window.QREngine) {
            window.QREngine.render('qrcode-canvas-box', qrPayload, { size: 150 });
        }
    }

    /**
     * Generate High-Quality Digital Pass Badge Canvas Image (with DOTRA Logo, Egyptian Plate, QR & Details)
     */
    static async createPassCanvasBlob(permitCode, plate, phone, driverName, validUntil) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const width = 600;
        const height = 820;
        canvas.width = width;
        canvas.height = height;

        // 1. Background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);

        // 2. Top Header Navy Banner (SAP Blue)
        const headerGradient = ctx.createLinearGradient(0, 0, width, 0);
        headerGradient.addColorStop(0, "#002b66");
        headerGradient.addColorStop(1, "#004b99");
        ctx.fillStyle = headerGradient;
        ctx.fillRect(0, 0, width, 120);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 26px 'Cairo', 'Tajawal', sans-serif";
        ctx.textAlign = "right";
        ctx.fillText("مجموعة دوترا - تصريح دخول البوابة", width - 30, 50);

        ctx.font = "bold 15px 'Cairo', sans-serif";
        ctx.fillStyle = "#a5f3fc";
        ctx.fillText("DOTRA Group - Vehicle Gate Access Permit", width - 30, 80);

        // Draw Logo on Left
        try {
            const logoImg = new Image();
            logoImg.src = 'assets/logo.jpg';
            await new Promise((resolve) => {
                logoImg.onload = resolve;
                logoImg.onerror = resolve;
            });
            if (logoImg.complete && logoImg.naturalWidth > 0) {
                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.arc(65, 60, 42, 0, Math.PI * 2);
                ctx.fill();
                ctx.drawImage(logoImg, 30, 25, 70, 70);
            }
        } catch (e) {}

        // 3. Status Badge
        ctx.fillStyle = "#e5f6eb";
        ctx.strokeStyle = "#107e3e";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(180, 140, 240, 40, 20);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#107e3e";
        ctx.font = "bold 18px 'Cairo', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("🟢 تصريح معتمد (AUTHORIZED)", 300, 166);

        // 4. Egyptian License Plate Box
        const plateY = 205;
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#1e293b";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(120, plateY, 360, 110, 12);
        ctx.fill();
        ctx.stroke();

        // Egyptian Plate Top Red Band
        ctx.fillStyle = "#dc2626";
        ctx.fillRect(122, plateY + 2, 356, 30);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px 'Cairo', monospace";
        ctx.textAlign = "left";
        ctx.fillText("EGYPT", 140, plateY + 22);
        ctx.textAlign = "center";
        ctx.fillText("نقل", 300, plateY + 22);
        ctx.textAlign = "right";
        ctx.fillText("مصر", 460, plateY + 22);

        // Plate Numbers and Letters
        const parsed = window.ArabicPlate.parsePlateParts(plate);
        const digits = window.ArabicPlate.toEasternArabicDigits(parsed.numbers);

        ctx.fillStyle = "#0f172a";
        ctx.font = "bold 34px 'Cairo', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(digits || '٩٨٢١', 210, plateY + 82);
        
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(300, plateY + 36);
        ctx.lineTo(300, plateY + 104);
        ctx.stroke();

        ctx.fillText(parsed.letters || 'ط ر ق', 390, plateY + 82);

        // 5. Draw QR Code directly to Canvas Context
        const qrPayload = JSON.stringify({
            permit: permitCode,
            plate: plate,
            phone: phone
        });

        if (window.QREngine) {
            window.QREngine.drawToCanvas(ctx, qrPayload, 205, 345, 190, '#002b66', '#ffffff');
            
            // Draw subtle border around QR
            ctx.strokeStyle = "#d7e2ee";
            ctx.lineWidth = 2;
            ctx.strokeRect(205, 345, 190, 190);
        }

        // 6. Summary Details Box
        const infoY = 575;
        ctx.fillStyle = "#f8fafc";
        ctx.strokeStyle = "#d7e2ee";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(50, infoY, 500, 180, 14);
        ctx.fill();
        ctx.stroke();

        ctx.font = "bold 17px 'Cairo', sans-serif";
        ctx.textAlign = "right";

        ctx.fillStyle = "#556b82";
        ctx.fillText("كود التصريح:", 520, infoY + 40);
        ctx.fillStyle = "#0070f2";
        ctx.fillText(permitCode, 380, infoY + 40);

        ctx.fillStyle = "#556b82";
        ctx.fillText("هاتف السائق:", 520, infoY + 80);
        ctx.fillStyle = "#107e3e";
        ctx.fillText(phone || "غير مسجل", 380, infoY + 80);

        ctx.fillStyle = "#556b82";
        ctx.fillText("اسم السائق:", 520, infoY + 120);
        ctx.fillStyle = "#1d2d3e";
        ctx.fillText(driverName || "سائق مصرح", 380, infoY + 120);

        ctx.fillStyle = "#556b82";
        ctx.fillText("صالح حتى:", 520, infoY + 160);
        ctx.fillStyle = "#b85500";
        ctx.fillText(validUntil, 380, infoY + 160);

        // 7. Footer
        ctx.fillStyle = "#556b82";
        ctx.font = "bold 13px 'Cairo', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("يرجى إبراز هذا الرمز لمسؤول البوابة عند الوصول • نظام بوابات دوترا الذكي", 300, 790);

        return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    }

    async shareWhatsAppImage(permitCode, plate, phone, driverName, validUntil) {
        try {
            const blob = await Manager.createPassCanvasBlob(permitCode, plate, phone, driverName, validUntil);
            const file = new File([blob], `DOTRA_Gate_Pass_${permitCode}.png`, { type: 'image/png' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: `تصريح دخول بوابة دوترا - ${permitCode}`,
                    text: `🛡️ تصريح دخول بوابة مصانع دوترا\n🚘 رقم اللوحة: ${plate}\n📞 هاتف السائق: ${phone}\nصالح حتى: ${validUntil}`
                });
                return;
            }
        } catch (e) {
            console.log("Web Share API fallback:", e);
        }

        Manager.downloadPassImage(permitCode, plate, phone);
        this.shareWhatsApp(permitCode, plate, phone);
    }

    async downloadPassImage(permitCode, plate, phone) {
        const vehicle = window.DB.findVehicleByPlate(plate) || {};
        const blob = await Manager.createPassCanvasBlob(
            permitCode, 
            plate, 
            phone, 
            vehicle.driver_name_ar || 'سائق مصرح', 
            new Date(Date.now() + 8 * 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        );
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `DOTRA_Pass_${permitCode}_${plate.replace(/\s+/g, '_')}.png`;
        a.click();
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
