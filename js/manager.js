// Office Manager Dashboard Controller
// وحدة التحكم ببوابة مدير المكتب والعمليات

class ManagerController {
    constructor() {
        this.activeFilter = 'all';
    }

    renderDashboard() {
        const container = document.getElementById('main-content');
        if (!container) return;

        const lang = window.i18n.getLang();
        const user = window.Auth.getCurrentUser();
        const vehicles = window.DB.getVehicles();
        const permits = window.DB.getPermits();
        const logs = window.DB.getLogs();

        // Calculate KPI Metrics
        const insideLogs = logs.filter(l => l.action_type === 'entry' && !l.exit_timestamp);
        const insideCount = insideLogs.length;

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEntries = logs.filter(l => l.action_type === 'entry' && new Date(l.timestamp) >= todayStart).length;

        // Overstay: vehicle inside > 3 hours
        const overstayLogs = insideLogs.filter(l => {
            const durationHrs = (Date.now() - new Date(l.timestamp).getTime()) / 3600000;
            return durationHrs >= 3;
        });

        const activePermits = permits.filter(p => p.status === 'active').length;

        container.innerHTML = `
            <!-- Top Dashboard Bar -->
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 class="text-2xl font-bold text-white flex items-center gap-2">
                        <span>🏢</span>
                        <span>${lang === 'ar' ? 'لوحة تحكم مدير العمليات والتصاريح' : 'Operations & Gate Permits Dashboard'}</span>
                    </h1>
                    <p class="text-xs text-slate-400 mt-1">
                        ${lang === 'ar' ? 'متابعة حركة الشاحنات، إصدار تصاريح الدخول، ومراقبة البوابات في الوقت الفعلي' : 'Real-time vehicle access tracking, digital permit issuance & gate security'}
                    </p>
                </div>
                <div class="flex items-center gap-3">
                    <button type="button" onclick="Manager.openNewPermitModal()" class="bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white font-bold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-sm transition-all transform hover:-translate-y-0.5">
                        <span class="text-lg font-mono leading-none">+</span>
                        <span>${window.i18n.t('issueNewPermit')}</span>
                    </button>
                    <button type="button" onclick="Manager.exportCSV()" class="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-3 py-2.5 rounded-xl flex items-center gap-2 text-sm transition-all">
                        <span>📥</span>
                        <span class="hidden sm:inline">${window.i18n.t('exportCsv')}</span>
                    </button>
                </div>
            </div>

            <!-- KPI Metric Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div class="glass-card p-5 rounded-2xl border-l-4 border-l-emerald-500 flex items-center justify-between">
                    <div>
                        <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">${window.i18n.t('metricInside')}</p>
                        <h3 class="text-3xl font-extrabold text-white mt-1 font-mono">${insideCount}</h3>
                        <p class="text-[11px] text-emerald-400 mt-1 font-medium flex items-center gap-1">
                            <span class="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            ${lang === 'ar' ? 'متواجدون داخل المصنع' : 'Active on premises'}
                        </p>
                    </div>
                    <div class="w-12 h-12 rounded-xl bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-2xl">
                        🚛
                    </div>
                </div>

                <div class="glass-card p-5 rounded-2xl border-l-4 border-l-sky-500 flex items-center justify-between">
                    <div>
                        <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">${window.i18n.t('metricToday')}</p>
                        <h3 class="text-3xl font-extrabold text-white mt-1 font-mono">${todayEntries}</h3>
                        <p class="text-[11px] text-sky-400 mt-1 font-medium">
                            ${lang === 'ar' ? 'حركة دخول عبر كافة البوابات' : 'Recorded entries across gates'}
                        </p>
                    </div>
                    <div class="w-12 h-12 rounded-xl bg-sky-950/60 border border-sky-800/60 flex items-center justify-center text-2xl">
                        📈
                    </div>
                </div>

                <div class="glass-card p-5 rounded-2xl border-l-4 border-l-rose-500 flex items-center justify-between ${overstayLogs.length > 0 ? 'ring-2 ring-rose-500/30' : ''}">
                    <div>
                        <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">${window.i18n.t('metricOverstay')}</p>
                        <h3 class="text-3xl font-extrabold text-rose-400 mt-1 font-mono">${overstayLogs.length}</h3>
                        <p class="text-[11px] text-rose-400 mt-1 font-medium">
                            ${overstayLogs.length > 0 ? (lang === 'ar' ? 'تجاوزوا مدة البقاء المسموحة (>3 س)' : 'Exceeded allowed time window') : (lang === 'ar' ? 'لا توجد تجاوزات' : 'Zero violations')}
                        </p>
                    </div>
                    <div class="w-12 h-12 rounded-xl bg-rose-950/60 border border-rose-800/60 flex items-center justify-center text-2xl">
                        ⚠️
                    </div>
                </div>

                <div class="glass-card p-5 rounded-2xl border-l-4 border-l-amber-500 flex items-center justify-between">
                    <div>
                        <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">${window.i18n.t('metricPending')}</p>
                        <h3 class="text-3xl font-extrabold text-white mt-1 font-mono">${activePermits}</h3>
                        <p class="text-[11px] text-amber-400 mt-1 font-medium">
                            ${lang === 'ar' ? 'تصاريح فعالة بانتظار الوصول' : 'Active valid permits'}
                        </p>
                    </div>
                    <div class="w-12 h-12 rounded-xl bg-amber-950/60 border border-amber-800/60 flex items-center justify-center text-2xl">
                        🎫
                    </div>
                </div>
            </div>

            <!-- Real-time Live Vehicle Activity Table -->
            <div class="glass-panel rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
                <div class="p-4 bg-slate-900/90 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div class="flex items-center gap-2">
                        <h2 class="text-base font-bold text-white flex items-center gap-2">
                            <span>🛰️</span>
                            <span>${lang === 'ar' ? 'مراقبة حركة المركبات والشاحنات المباشرة' : 'Live Vehicle Access Stream'}</span>
                        </h2>
                        <span class="px-2 py-0.5 bg-sky-950 text-sky-400 text-xs rounded-full font-mono font-bold border border-sky-800">
                            LIVE
                        </span>
                    </div>

                    <!-- Filter Tabs -->
                    <div class="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800 text-xs">
                        <button type="button" onclick="Manager.setFilter('all')" class="px-3 py-1.5 rounded-lg font-semibold transition-all ${this.activeFilter === 'all' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'}">
                            ${window.i18n.t('filterAll')}
                        </button>
                        <button type="button" onclick="Manager.setFilter('inside')" class="px-3 py-1.5 rounded-lg font-semibold transition-all ${this.activeFilter === 'inside' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}">
                            ${window.i18n.t('filterInside')} (${insideCount})
                        </button>
                        <button type="button" onclick="Manager.setFilter('overstay')" class="px-3 py-1.5 rounded-lg font-semibold transition-all ${this.activeFilter === 'overstay' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'}">
                            ${window.i18n.t('filterOverstay')} (${overstayLogs.length})
                        </button>
                    </div>
                </div>

                <!-- Table Content -->
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                        <thead class="bg-slate-950/70 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-800">
                            <tr>
                                <th class="py-3.5 px-4">${window.i18n.t('plateNumber')}</th>
                                <th class="py-3.5 px-4">${window.i18n.t('driverName')}</th>
                                <th class="py-3.5 px-4">${window.i18n.t('company')}</th>
                                <th class="py-3.5 px-4">${window.i18n.t('destination')}</th>
                                <th class="py-3.5 px-4">${window.i18n.t('timeEntered')}</th>
                                <th class="py-3.5 px-4">${window.i18n.t('durationInside')}</th>
                                <th class="py-3.5 px-4">${window.i18n.t('status')}</th>
                                <th class="py-3.5 px-4 text-center">${window.i18n.t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-800/60 font-medium">
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
        const logs = window.DB.getLogs();

        let filteredVehicles = vehicles.filter(v => {
            const insideLog = window.DB.isVehicleInside(v.id);
            if (this.activeFilter === 'inside') {
                return insideLog !== null;
            }
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
                    <td colspan="8" class="text-center py-10 text-slate-500">
                        <div class="text-3xl mb-2">🔍</div>
                        <p>${lang === 'ar' ? 'لا توجد مركبات تطابق التصفية المحددة' : 'No vehicles found matching current filter'}</p>
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
                statusBadge = `<span class="px-2.5 py-1 rounded-full text-xs font-bold badge-blacklisted">⛔ ${window.i18n.t('statusBanned')}</span>`;
            } else if (insideLog) {
                const entryTime = new Date(insideLog.timestamp);
                entryTimeText = entryTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const diffMinutes = Math.round((Date.now() - entryTime.getTime()) / 60000);
                const diffHours = (diffMinutes / 60).toFixed(1);
                
                if (diffMinutes >= 180) { // Overstay > 3h
                    statusBadge = `<span class="px-2.5 py-1 rounded-full text-xs font-bold badge-overstay">⚠️ ${window.i18n.t('statusOverstay')}</span>`;
                    durationText = `<span class="text-rose-400 font-bold font-mono">${diffHours} ${lang === 'ar' ? 'ساعة' : 'hrs'}</span>`;
                } else {
                    statusBadge = `<span class="px-2.5 py-1 rounded-full text-xs font-bold badge-inside">🟢 ${window.i18n.t('statusInside')}</span>`;
                    durationText = `<span class="text-emerald-400 font-bold font-mono">${diffMinutes < 60 ? `${diffMinutes} ${lang === 'ar' ? 'دقيقة' : 'min'}` : `${diffHours} ${lang === 'ar' ? 'ساعة' : 'hrs'}`}</span>`;
                }
            } else if (permit && permit.status === 'active') {
                statusBadge = `<span class="px-2.5 py-1 rounded-full text-xs font-bold badge-active">🎫 ${window.i18n.t('statusAuthorized')}</span>`;
            } else {
                statusBadge = `<span class="px-2.5 py-1 rounded-full text-xs font-bold badge-exited">⚪ ${window.i18n.t('statusExited')}</span>`;
            }

            const driverName = lang === 'ar' ? vehicle.driver_name_ar : vehicle.driver_name_en;
            const companyName = lang === 'ar' ? vehicle.company_ar : vehicle.company_en;
            const destination = permit ? (lang === 'ar' ? permit.destination_ar : permit.destination_en) : (lang === 'ar' ? 'غير محدد' : 'General');

            return `
                <tr class="hover:bg-slate-800/40 transition-colors">
                    <td class="py-3 px-4">
                        ${window.ArabicPlate.renderArabicPlate(vehicle.plate_ar, vehicle.plate_en, 'compact', vehicle.vehicle_type)}
                    </td>
                    <td class="py-3 px-4">
                        <div class="font-bold text-white">${driverName}</div>
                        <div class="text-xs text-slate-400 font-mono">${vehicle.driver_phone || ''}</div>
                    </td>
                    <td class="py-3 px-4 text-slate-300">
                        ${companyName}
                    </td>
                    <td class="py-3 px-4 text-slate-300">
                        <span class="px-2 py-0.5 bg-slate-800 rounded text-xs font-mono text-sky-400 border border-slate-700">
                            ${destination}
                        </span>
                    </td>
                    <td class="py-3 px-4 text-slate-400 font-mono text-xs">
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
                                <button type="button" title="${window.i18n.t('printPass')}" onclick="Manager.showPassModal(${permit.id})" class="p-1.5 bg-sky-950 hover:bg-sky-900 text-sky-400 rounded-lg border border-sky-800 text-xs">
                                    🎫 QR
                                </button>
                            ` : `
                                <button type="button" title="${window.i18n.t('issueNewPermit')}" onclick="Manager.openPermitForVehicle(${vehicle.id})" class="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 text-xs">
                                    + تصريح
                                </button>
                            `}
                            <button type="button" title="${vehicle.status === 'blacklist' ? 'إلغاء الحظر' : 'حظر المركبة'}" onclick="Manager.toggleBlacklist(${vehicle.id})" class="p-1.5 ${vehicle.status === 'blacklist' ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-rose-950/60 text-rose-400 border-rose-900/60'} hover:opacity-80 rounded-lg border text-xs">
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

    openNewPermitModal(prefillVehicle = null) {
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) return;
        const lang = window.i18n.getLang();

        modalContainer.innerHTML = `
            <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                <div class="glass-panel w-full max-w-2xl rounded-2xl border border-slate-700 shadow-2xl p-6 relative animate-fadeIn" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                    <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="absolute top-4 ${lang === 'ar' ? 'left-4' : 'right-4'} text-slate-400 hover:text-white text-xl font-bold">
                        ✕
                    </button>

                    <div class="flex items-center gap-3 mb-5 border-b border-slate-800 pb-3">
                        <div class="w-10 h-10 rounded-xl bg-sky-950 border border-sky-800 flex items-center justify-center text-xl">
                            🎫
                        </div>
                        <div>
                            <h3 class="text-lg font-bold text-white">${window.i18n.t('issueNewPermit')}</h3>
                            <p class="text-xs text-slate-400">${lang === 'ar' ? 'إصدار تصريح دخول إلكتروني مع رمز استجابة سريعة QR' : 'Create digital access permit with QR code'}</p>
                        </div>
                    </div>

                    <form id="new-permit-form" onsubmit="Manager.submitNewPermit(event)">
                        <!-- Plate Input with Live Arabic Preview -->
                        <div class="bg-slate-950/80 p-4 rounded-xl border border-slate-800 mb-4">
                            <label class="block text-xs font-bold text-slate-300 mb-1">${window.i18n.t('plateNumber')} (مثال: أ ب ج 9 8 2 1 أو ABC 1234)</label>
                            <div class="flex gap-2 items-center">
                                <input type="text" id="permit-plate-ar" required placeholder="أ ب ج 9 8 2 1" value="${prefillVehicle ? prefillVehicle.plate_ar : ''}" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-bold text-base focus:border-sky-500 focus:outline-none" oninput="Manager.updatePlatePreview(this.value)" />
                                <button type="button" onclick="Manager.toggleKeypad('permit-keypad-box', 'permit-plate-ar')" class="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-xl border border-slate-700 text-xs font-bold whitespace-nowrap">
                                    ⌨️ ${window.i18n.t('arabicKeyboard')}
                                </button>
                            </div>
                            
                            <!-- Keypad Box -->
                            <div id="permit-keypad-box" class="hidden">
                                ${window.ArabicPlate.renderArabicKeypad('permit-plate-ar')}
                            </div>

                            <!-- Live Plate Preview -->
                            <div class="mt-3 flex items-center justify-between bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/80">
                                <span class="text-xs text-slate-400">${lang === 'ar' ? 'معاينة اللوحة:' : 'Live Preview:'}</span>
                                <div id="permit-plate-preview">
                                    ${window.ArabicPlate.renderArabicPlate(prefillVehicle ? prefillVehicle.plate_ar : 'أ ب ج 1 2 3 4', prefillVehicle ? prefillVehicle.plate_en : 'ABJ 1234', 'compact')}
                                </div>
                            </div>
                        </div>

                        <!-- Vehicle & Driver Details -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 mb-1">${window.i18n.t('vehicleType')}</label>
                                <select id="permit-vehicle-type" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:border-sky-500 focus:outline-none">
                                    <option value="truckHeavy">🚛 ${window.i18n.t('truckHeavy')}</option>
                                    <option value="truckMedium">🚚 ${window.i18n.t('truckMedium')}</option>
                                    <option value="van">🚐 ${window.i18n.t('van')}</option>
                                    <option value="tanker">⛽ ${window.i18n.t('tanker')}</option>
                                    <option value="pickup">🛻 ${window.i18n.t('pickup')}</option>
                                    <option value="car">🚗 ${window.i18n.t('car')}</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 mb-1">${window.i18n.t('driverName')}</label>
                                <input type="text" id="permit-driver-name" required placeholder="${lang === 'ar' ? 'مثال: صالح عبدالله' : 'Driver name'}" value="${prefillVehicle ? prefillVehicle.driver_name_ar : ''}" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:border-sky-500 focus:outline-none" />
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 mb-1">${window.i18n.t('driverPhone')}</label>
                                <input type="tel" id="permit-driver-phone" placeholder="+966500000000" value="${prefillVehicle ? prefillVehicle.driver_phone : ''}" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm font-mono focus:border-sky-500 focus:outline-none" />
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 mb-1">${window.i18n.t('company')}</label>
                                <input type="text" id="permit-company" required placeholder="${lang === 'ar' ? 'مثال: شركة النقل السريع' : 'Company name'}" value="${prefillVehicle ? prefillVehicle.company_ar : ''}" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:border-sky-500 focus:outline-none" />
                            </div>
                        </div>

                        <!-- Destination & Purpose -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 mb-1">${window.i18n.t('destination')}</label>
                                <input type="text" id="permit-destination" required placeholder="${lang === 'ar' ? 'مثال: مستودع المواد الخام رصيف 2' : 'Warehouse Bay 2'}" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:border-sky-500 focus:outline-none" />
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 mb-1">${window.i18n.t('purpose')}</label>
                                <input type="text" id="permit-purpose" required placeholder="${lang === 'ar' ? 'مثال: تفريغ شحنة وتوريد' : 'Unload delivery'}" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:border-sky-500 focus:outline-none" />
                            </div>
                        </div>

                        <div class="mb-5">
                            <label class="block text-xs font-semibold text-slate-400 mb-1">${window.i18n.t('cargo')}</label>
                            <input type="text" id="permit-cargo" placeholder="${lang === 'ar' ? 'مثال: 25 طن حديد تسليح' : 'Cargo specs'}" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:border-sky-500 focus:outline-none" />
                        </div>

                        <div class="flex justify-end gap-3 pt-3 border-t border-slate-800">
                            <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-sm">
                                ${lang === 'ar' ? 'إلغاء' : 'Cancel'}
                            </button>
                            <button type="submit" class="px-6 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-lg text-sm flex items-center gap-2">
                                <span>🎫</span>
                                <span>${lang === 'ar' ? 'توليد التصريح ورمز QR' : 'Generate Permit & QR'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    updatePlatePreview(val) {
        const preview = document.getElementById('permit-plate-preview');
        if (preview) {
            preview.innerHTML = window.ArabicPlate.renderArabicPlate(val || 'أ ب ج 1 2 3 4', null, 'compact');
        }
    }

    toggleKeypad(boxId, inputId) {
        const box = document.getElementById(boxId);
        if (box) {
            box.classList.toggle('hidden');
        }
    }

    submitNewPermit(e) {
        e.preventDefault();
        const plateAr = document.getElementById('permit-plate-ar').value.trim();
        const vehicleType = document.getElementById('permit-vehicle-type').value;
        const driverName = document.getElementById('permit-driver-name').value.trim();
        const driverPhone = document.getElementById('permit-driver-phone').value.trim();
        const company = document.getElementById('permit-company').value.trim();
        const destination = document.getElementById('permit-destination').value.trim();
        const purpose = document.getElementById('permit-purpose').value.trim();
        const cargo = document.getElementById('permit-cargo').value.trim();

        // 1. Check or create vehicle
        let vehicle = window.DB.findVehicleByPlate(plateAr);
        if (!vehicle) {
            vehicle = window.DB.addVehicle({
                plate_ar: plateAr,
                plate_en: plateAr,
                vehicle_type: vehicleType,
                driver_name_ar: driverName,
                driver_name_en: driverName,
                driver_phone: driverPhone,
                company_ar: company,
                company_en: company,
                status: 'visitor'
            });
        }

        // 2. Create permit
        const permit = window.DB.addPermit({
            vehicle_id: vehicle.id,
            destination_ar: destination,
            destination_en: destination,
            purpose_ar: purpose,
            purpose_en: purpose,
            cargo_details: cargo,
            valid_from: new Date().toISOString(),
            valid_until: new Date(Date.now() + 8 * 3600000).toISOString()
        });

        // Close modal and show digital pass
        document.getElementById('modal-container').innerHTML = '';
        this.renderDashboard();
        this.showPassModal(permit.id);
    }

    showPassModal(permitId) {
        const permits = window.DB.getPermits();
        const permit = permits.find(p => p.id === permitId);
        if (!permit) return;
        const vehicle = window.DB.getVehicles().find(v => v.id === permit.vehicle_id);
        if (!vehicle) return;

        const lang = window.i18n.getLang();
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) return;

        modalContainer.innerHTML = `
            <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                <div class="glass-panel w-full max-w-md rounded-3xl border border-sky-600/40 shadow-2xl p-6 relative animate-fadeIn text-center" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                    <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="absolute top-4 ${lang === 'ar' ? 'left-4' : 'right-4'} text-slate-400 hover:text-white text-xl font-bold">
                        ✕
                    </button>

                    <div class="mb-4">
                        <span class="px-3 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full text-xs font-bold">
                            🟢 ${window.i18n.t('statusAuthorized')}
                        </span>
                        <h2 class="text-xl font-black text-white mt-2">${lang === 'ar' ? 'تصريح دخول بوابة المنشأة' : 'Gate Access Digital Pass'}</h2>
                        <p class="text-xs font-mono text-sky-400 font-bold">${permit.permit_code}</p>
                    </div>

                    <!-- Authentic Arabic Plate View -->
                    <div class="mb-4 flex justify-center">
                        ${window.ArabicPlate.renderArabicPlate(vehicle.plate_ar, vehicle.plate_en, 'normal', vehicle.vehicle_type)}
                    </div>

                    <!-- QR Code Pass Container -->
                    <div class="bg-white p-4 rounded-2xl shadow-inner inline-block my-2 border-4 border-slate-200" id="qrcode-canvas-box">
                        <!-- QR rendered here -->
                    </div>

                    <!-- Pass Details -->
                    <div class="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 text-xs text-left my-4 space-y-2" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                        <div class="flex justify-between border-b border-slate-800 pb-1.5">
                            <span class="text-slate-400">${window.i18n.t('driverName')}:</span>
                            <span class="font-bold text-white">${lang === 'ar' ? vehicle.driver_name_ar : vehicle.driver_name_en}</span>
                        </div>
                        <div class="flex justify-between border-b border-slate-800 pb-1.5">
                            <span class="text-slate-400">${window.i18n.t('company')}:</span>
                            <span class="font-bold text-white">${lang === 'ar' ? vehicle.company_ar : vehicle.company_en}</span>
                        </div>
                        <div class="flex justify-between border-b border-slate-800 pb-1.5">
                            <span class="text-slate-400">${window.i18n.t('destination')}:</span>
                            <span class="font-bold text-sky-400">${lang === 'ar' ? permit.destination_ar : permit.destination_en}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-slate-400">${window.i18n.t('validUntil')}:</span>
                            <span class="font-bold text-amber-400 font-mono">${new Date(permit.valid_until).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>

                    <!-- Share & Action Buttons -->
                    <div class="flex flex-col gap-2">
                        <button type="button" onclick="Manager.shareWhatsApp('${permit.permit_code}', '${vehicle.plate_ar}', '${vehicle.driver_phone || ''}')" class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg text-sm flex items-center justify-center gap-2">
                            <span>💬</span>
                            <span>${window.i18n.t('shareWhatsapp')}</span>
                        </button>
                        <button type="button" onclick="window.print()" class="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs flex items-center justify-center gap-2">
                            <span>🖨️</span>
                            <span>${window.i18n.t('printPass')}</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Render QR Code using QRCode library
        setTimeout(() => {
            const qrBox = document.getElementById('qrcode-canvas-box');
            if (qrBox && window.QRCode) {
                qrBox.innerHTML = '';
                new window.QRCode(qrBox, {
                    text: JSON.stringify({
                        permit: permit.permit_code,
                        plate: vehicle.plate_ar,
                        driver: vehicle.driver_name_ar
                    }),
                    width: 150,
                    height: 150,
                    colorDark: "#0f172a",
                    colorLight: "#ffffff",
                    correctLevel: window.QRCode.CorrectLevel.H
                });
            }
        }, 50);
    }

    shareWhatsApp(permitCode, plate, phone) {
        const text = encodeURIComponent(`🛡️ تصريح دخول بوابة المصنع رقم: ${permitCode}\n🚘 اللوحة: ${plate}\nيرجى إبراز هذا التصريح لمسؤول البوابة عند الوصول.`);
        const url = phone ? `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${text}` : `https://api.whatsapp.com/send?text=${text}`;
        window.open(url, '_blank');
    }

    toggleBlacklist(vehicleId) {
        const vehicle = window.DB.getVehicles().find(v => v.id === vehicleId);
        if (!vehicle) return;
        const lang = window.i18n.getLang();

        if (vehicle.status === 'blacklist') {
            window.DB.updateVehicleStatus(vehicleId, 'visitor', '');
            alert(lang === 'ar' ? 'تم إلغاء حظر المركبة والسماح لها بالدخول' : 'Vehicle unbanned successfully');
        } else {
            const reason = prompt(window.i18n.t('denyReasonPrompt'), lang === 'ar' ? 'مخالفة تعليمات السلامة' : 'Safety violation');
            if (reason) {
                window.DB.updateVehicleStatus(vehicleId, 'blacklist', reason);
                alert(lang === 'ar' ? 'تم إدراج المركبة في القائمة السوداء والمحظورة' : 'Vehicle blacklisted');
            }
        }
        this.renderDashboard();
    }

    openPermitForVehicle(vehicleId) {
        const vehicle = window.DB.getVehicles().find(v => v.id === vehicleId);
        this.openNewPermitModal(vehicle);
    }

    exportCSV() {
        const logs = window.DB.getLogs();
        const vehicles = window.DB.getVehicles();

        let csv = 'Log_ID,Vehicle_Plate_AR,Vehicle_Plate_EN,Driver_Name,Company,Gate_Name,Action,Timestamp,Exit_Timestamp,Duration_Minutes,Remarks\n';

        logs.forEach(log => {
            const vehicle = vehicles.find(v => v.id === log.vehicle_id) || {};
            csv += `"${log.id}","${vehicle.plate_ar || ''}","${vehicle.plate_en || ''}","${vehicle.driver_name_ar || ''}","${vehicle.company_ar || ''}","${log.gate_name}","${log.action_type}","${log.timestamp}","${log.exit_timestamp || ''}","${log.duration_minutes || ''}","${log.remarks || ''}"\n`;
        });

        const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gate_access_logs_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    }
}

window.Manager = new ManagerController();
