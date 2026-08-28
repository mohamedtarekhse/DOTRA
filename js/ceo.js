// ============================================================
// CEO Executive Dashboard & Movement Audit Log Controller
// لوحة القيادة التنفيذية وسجل تدقيق حركات وتدفق المركبات للمدير التنفيذي
// ============================================================

class CeoController {
    constructor() {
        this.activeTab = 'movements'; // 'movements' | 'emergency' | 'handovers' | 'users'
        this.searchQuery = '';
        this.userSearchQuery = '';
        this.dateFilter = 'all'; // 'today', '7days', '30days', 'all'
        this.gateFilter = 'all';
        this.statusFilter = 'all'; // 'all', 'inside', 'exited', 'overstay', 'denied', 'hold'
    }

    switchTab(tab) {
        this.activeTab = tab;
        this.renderDashboard();
    }

    renderDashboard() {
        const container = document.getElementById('main-content');
        if (!container) return;

        const lang = window.i18n.getLang();
        const icon = (name, cls = 'w-4 h-4') => window.Icons ? window.Icons.get(name, cls) : '';
        const movements = window.DB.getExecutiveMovementLogs();
        const settings = window.DB.getSettings();
        const gates = window.DB.getGates();
        const users = window.DB.getUsers();
        const lockdown = window.DB.getEmergencyLockdownStatus();

        // 1. Calculate Executive KPIs
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        const todayMovements = movements.filter(m => m.entry_timestamp && m.entry_timestamp.startsWith(todayStr));
        const insideMovements = movements.filter(m => m.status === 'inside' || m.status === 'overstay');
        const overstayMovements = movements.filter(m => m.status === 'overstay');
        const deniedMovements = movements.filter(m => m.status === 'denied');
        const todayExits = movements.filter(m => m.exit_timestamp && m.exit_timestamp.startsWith(todayStr));

        // Calculate Plant Occupancy Percentage (Max 50 Trucks Capacity)
        const maxCapacity = 50;
        const occupancyPercent = Math.min(100, Math.round((insideMovements.length / maxCapacity) * 100));

        // Calculate Total Net Weight Processed Today (Metric Tonnes)
        const todayTonnage = todayMovements.reduce((acc, curr) => {
            const w = curr.net_weight || curr.gross_weight || 0;
            return acc + (typeof w === 'number' ? w : parseFloat(w) || 0);
        }, 0).toFixed(1);

        // Completed trips for average turnaround calculation
        const completedTrips = movements.filter(m => m.exit_timestamp && m.duration_minutes > 0);
        const avgTurnaroundMin = completedTrips.length > 0
            ? Math.round(completedTrips.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0) / completedTrips.length)
            : 0;
        const avgHours = (avgTurnaroundMin / 60).toFixed(1);

        container.innerHTML = `
            <div class="space-y-6 pb-12 animate-fadeIn" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                
                <!-- Emergency Plant Lockdown Banner (if active) -->
                ${lockdown.active ? `
                    <div class="p-5 bg-red-950 border-2 border-red-500 rounded-3xl text-white shadow-2xl animate-pulse flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div class="flex items-center gap-3">
                            <span class="text-3xl">🚨</span>
                            <div>
                                <h3 class="text-base font-black text-red-200">حالة طوارئ قصوى معلنة للمنشأة (FACILITY LOCKDOWN ACTIVE)</h3>
                                <p class="text-xs text-red-100 font-semibold">${lockdown.reason || 'إغلاق احترازي للبوابات'}</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <button type="button" onclick="CEO.switchTab('emergency')" class="px-4 py-2 bg-white text-red-950 font-black rounded-xl text-xs shadow-md">
                                📋 كشف الإخلاء الفوري
                            </button>
                            <button type="button" onclick="CEO.liftEmergencyLockdown()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-md">
                                🟢 إنهاء الطوارئ وفتح البوابات
                            </button>
                        </div>
                    </div>
                ` : ''}

                <!-- Executive Header Banner -->
                <div class="bg-gradient-to-r from-[#001940] via-[#002b66] to-[#004080] rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-[#003880] relative overflow-hidden">
                    <div class="absolute -right-10 -bottom-10 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
                    
                    <div class="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div class="flex items-center gap-4">
                            <div class="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                                <span class="text-3xl">🏛️</span>
                            </div>
                            <div>
                                <div class="flex items-center gap-2">
                                    <h1 class="text-2xl sm:text-3xl font-black tracking-tight">${lang === 'ar' ? 'لوحة القيادة التنفيذية وسجل الحركات الشامل' : 'CEO Executive Dashboard & Audit Log'}</h1>
                                    <span class="px-3 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider">CEO Portal</span>
                                </div>
                                <p class="text-blue-100 text-xs sm:text-sm mt-1 font-semibold">
                                    ${lang === 'ar' ? 'الرقابة الشاملة على تدفق الشاحنات، أوزان البسكول، دورة التصاريح، ومطابقة بوابات الدخول والخروج' : 'Executive governance for fleet flow, weighbridge tonnage, permit approval lifecycle, and gate audits'}
                                </p>
                            </div>
                        </div>

                        <!-- Top Action Buttons -->
                        <div class="flex items-center gap-2 flex-wrap w-full md:w-auto">
                            ${!lockdown.active ? `
                                <button type="button" onclick="CEO.triggerEmergencyLockdownModal()" class="flex-1 md:flex-none px-3.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-xs shadow-md flex items-center justify-center gap-1.5 transition-transform hover:-translate-y-0.5 active:scale-95" title="إعلان حالة طوارئ وإغلاق البوابات">
                                    <span>🚨</span>
                                    <span>${lang === 'ar' ? 'طوارئ وإخلاء' : 'Lockdown'}</span>
                                </button>
                            ` : ''}
                            <button type="button" onclick="CEO.exportToExcel()" class="flex-1 md:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-transform hover:-translate-y-0.5 active:scale-95">
                                ${icon('download', 'w-4 h-4 text-white')}
                                <span>${lang === 'ar' ? 'تصدير إكسل (Excel .xls)' : 'Export Excel'}</span>
                            </button>
                            <button type="button" onclick="CEO.printExecutiveReport()" class="flex-1 md:flex-none px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95">
                                ${icon('printer', 'w-4 h-4 text-white')}
                                <span>${lang === 'ar' ? 'طباعة تقرير A4' : 'Print PDF'}</span>
                            </button>
                            <button type="button" onclick="CEO.renderDashboard()" class="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-all" title="تحديث حي">
                                ${icon('refresh', 'w-4 h-4 text-white')}
                            </button>
                        </div>
                    </div>
                </div>

                <!-- CEO Navigation Tabs: Movements | Emergency | Handovers | Users -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-2 bg-[#f0f4f8] p-1.5 rounded-2xl border border-[#d7e2ee] text-xs font-bold shadow-sm">
                    <button type="button" onclick="CEO.switchTab('movements')" class="py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${this.activeTab === 'movements' ? 'bg-[#002b66] text-white shadow-md font-black' : 'text-[#556b82] hover:text-[#002b66]'}">
                        <span>📊</span>
                        <span>${lang === 'ar' ? 'سجل حركات وتدفق الأسطول' : 'Movement Audit'}</span>
                    </button>
                    <button type="button" onclick="CEO.switchTab('emergency')" class="py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${this.activeTab === 'emergency' ? 'bg-red-700 text-white shadow-md font-black' : 'text-[#556b82] hover:text-red-700'}">
                        <span>🚨</span>
                        <span>${lang === 'ar' ? `مركز الطوارئ والإخلاء (${insideMovements.length})` : `Emergency Hub (${insideMovements.length})`}</span>
                    </button>
                    <button type="button" onclick="CEO.switchTab('handovers')" class="py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${this.activeTab === 'handovers' ? 'bg-purple-800 text-white shadow-md font-black' : 'text-[#556b82] hover:text-purple-800'}">
                        <span>📄</span>
                        <span>${lang === 'ar' ? 'محاضر تسليم الورديات' : 'Shift Handovers'}</span>
                    </button>
                    <button type="button" onclick="CEO.switchTab('users')" class="py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${this.activeTab === 'users' ? 'bg-[#002b66] text-white shadow-md font-black' : 'text-[#556b82] hover:text-[#002b66]'}">
                        <span>👥</span>
                        <span>${lang === 'ar' ? `المستخدمين والصلاحيات (${users.length})` : `Users (${users.length})`}</span>
                    </button>
                </div>

                ${this.activeTab === 'users' ? this.renderUsersTab(lang, icon) : 
                  (this.activeTab === 'emergency' ? this.renderEmergencyTab(lang, insideMovements) :
                  (this.activeTab === 'handovers' ? this.renderHandoversTab(lang) : this.renderMovementsTab(lang, icon, insideMovements, todayMovements, todayExits, avgTurnaroundMin, avgHours, overstayMovements, deniedMovements, occupancyPercent, todayTonnage, gates)))}
            </div>
        `;
    }

    renderMovementsTab(lang, icon, insideMovements, todayMovements, todayExits, avgTurnaroundMin, avgHours, overstayMovements, deniedMovements, occupancyPercent, todayTonnage, gates) {
        return `
            <!-- Executive Top 5 Enhanced KPIs -->
            <div class="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
                
                <!-- KPI 1: Inside Factory & Occupancy -->
                <div class="sap-card p-4 bg-white rounded-2xl border border-[#b0cfee] shadow-sm relative overflow-hidden">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-[#556b82]">${lang === 'ar' ? 'الشاحنات بالداخل والإشغال' : 'Inside & Occupancy'}</span>
                        <div class="w-8 h-8 rounded-xl bg-emerald-50 text-[#107e3e] flex items-center justify-center font-bold">
                            🟢
                        </div>
                    </div>
                    <div class="mt-2 flex items-baseline gap-2">
                        <span class="text-3xl font-black text-[#1d2d3e] font-mono">${insideMovements.length}</span>
                        <span class="text-xs text-[#107e3e] font-bold">/ 50 شاحنة (${occupancyPercent}%)</span>
                    </div>
                    <div class="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                        <div class="bg-[#107e3e] h-1.5 rounded-full" style="width: ${occupancyPercent}%"></div>
                    </div>
                </div>

                <!-- KPI 2: Today Flow (Entries vs Exits) -->
                <div class="sap-card p-4 bg-white rounded-2xl border border-[#b0cfee] shadow-sm">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-[#556b82]">${lang === 'ar' ? 'حركة اليوم (دخول / خروج)' : "Today's Flow"}</span>
                        <div class="w-8 h-8 rounded-xl bg-blue-50 text-[#0070f2] flex items-center justify-center font-bold">
                            📊
                        </div>
                    </div>
                    <div class="mt-2 flex items-baseline gap-2">
                        <span class="text-3xl font-black text-[#002b66] font-mono">${todayMovements.length}</span>
                        <span class="text-xs text-[#0070f2] font-bold">📥 ${todayMovements.length} • 📤 ${todayExits.length}</span>
                    </div>
                    <div class="mt-1 text-[11px] text-[#556b82] font-semibold">${lang === 'ar' ? 'إجمالي التدفق خلال 24 ساعة' : 'Total 24h volume'}</div>
                </div>

                <!-- KPI 3: Weighbridge Processed Tonnage -->
                <div class="sap-card p-4 bg-white rounded-2xl border border-[#b0cfee] shadow-sm">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-[#556b82]">${lang === 'ar' ? 'حجم بضائع البسكول اليوم' : 'Weighbridge Tonnage'}</span>
                        <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                            ⚖️
                        </div>
                    </div>
                    <div class="mt-2 flex items-baseline gap-2">
                        <span class="text-3xl font-black text-emerald-800 font-mono">${todayTonnage}</span>
                        <span class="text-xs text-emerald-700 font-bold">طن متري</span>
                    </div>
                    <div class="mt-1 text-[11px] text-[#556b82] font-semibold">${lang === 'ar' ? 'صافي أوزان المواد والشحنات' : 'Net tonnage weighed'}</div>
                </div>

                <!-- KPI 4: Average Dwell & Turnaround -->
                <div class="sap-card p-4 bg-white rounded-2xl border border-[#b0cfee] shadow-sm">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-[#556b82]">${lang === 'ar' ? 'متوسط المكوث والتجاوز' : 'Avg Dwell & Overstay'}</span>
                        <div class="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                            ⏱️
                        </div>
                    </div>
                    <div class="mt-2 flex items-baseline gap-2">
                        <span class="text-3xl font-black text-[#1d2d3e] font-mono">${avgTurnaroundMin}</span>
                        <span class="text-xs text-purple-700 font-bold">${lang === 'ar' ? 'دقيقة' : 'min'} (${avgHours} س)</span>
                    </div>
                    <div class="mt-1 text-[11px] ${overstayMovements.length > 0 ? 'text-red-600 font-bold' : 'text-[#556b82]'}">
                        ${overstayMovements.length > 0 ? `⚠️ ${overstayMovements.length} شاحنة تجاوزت ساعتين` : 'لا توجد تجاوزات زمنية'}
                    </div>
                </div>

                <!-- KPI 5: Security Denials & Bans -->
                <div class="sap-card p-4 bg-white rounded-2xl border border-[#b0cfee] shadow-sm">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-[#556b82]">${lang === 'ar' ? 'حالات المنع والتفتيش الأمني' : 'Security Denials'}</span>
                        <div class="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
                            ⛔
                        </div>
                    </div>
                    <div class="mt-2 flex items-baseline gap-2">
                        <span class="text-3xl font-black text-[#bb0000] font-mono">${deniedMovements.length}</span>
                        <span class="text-xs text-red-600 font-bold">${lang === 'ar' ? 'مخالفة مسجلة' : 'denials'}</span>
                    </div>
                    <div class="mt-1 text-[11px] text-[#556b82] font-semibold">${lang === 'ar' ? 'مرفوضة عند بوابات المصنع' : 'Blocked at entrance'}</div>
                </div>
            </div>

            <!-- Comprehensive Audit Table Section -->
            <div class="sap-panel p-5 bg-white rounded-3xl border border-[#b0cfee] shadow-md space-y-4">
                
                <!-- Search & Executive Filters Toolbar -->
                <div class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 border-b border-[#e7eff7] pb-4">
                    
                    <!-- Search Box -->
                    <div class="relative flex-1">
                        <span class="absolute ${lang === 'ar' ? 'right-3.5' : 'left-3.5'} top-3 text-[#556b82]">
                            ${icon('search', 'w-4 h-4')}
                        </span>
                        <input type="text" id="ceo-search-input" value="${this.searchQuery}" oninput="CEO.handleSearch(this.value)" placeholder="${lang === 'ar' ? 'بحث شامل (رقم اللوحة، كود التصريح، السائق، الرقم القومي، الشركة، البوابة، المعتمد)...' : 'Search by plate, permit, driver, national ID, company, gate, approver...'}" class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl ${lang === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 text-xs text-[#1d2d3e] font-bold focus:border-[#0070f2] focus:bg-white focus:outline-none shadow-inner" />
                    </div>

                    <!-- Date Range Filters -->
                    <div class="flex items-center gap-1.5 bg-[#f0f4f8] p-1 rounded-xl border border-[#d7e2ee] overflow-x-auto">
                        <button type="button" onclick="CEO.setDateFilter('all')" class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${this.dateFilter === 'all' ? 'bg-[#002b66] text-white shadow-sm' : 'text-[#556b82] hover:text-[#1d2d3e]'}">
                            ${lang === 'ar' ? 'كل السجلات' : 'All History'}
                        </button>
                        <button type="button" onclick="CEO.setDateFilter('today')" class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${this.dateFilter === 'today' ? 'bg-[#002b66] text-white shadow-sm' : 'text-[#556b82] hover:text-[#1d2d3e]'}">
                            ${lang === 'ar' ? 'اليوم' : 'Today'}
                        </button>
                        <button type="button" onclick="CEO.setDateFilter('7days')" class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${this.dateFilter === '7days' ? 'bg-[#002b66] text-white shadow-sm' : 'text-[#556b82] hover:text-[#1d2d3e]'}">
                            ${lang === 'ar' ? 'آخر 7 أيام' : '7 Days'}
                        </button>
                        <button type="button" onclick="CEO.setDateFilter('30days')" class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${this.dateFilter === '30days' ? 'bg-[#002b66] text-white shadow-sm' : 'text-[#556b82] hover:text-[#1d2d3e]'}">
                            ${lang === 'ar' ? 'هذا الشهر' : '30 Days'}
                        </button>
                    </div>

                    <!-- Gate Filter Dropdown -->
                    <div class="flex items-center gap-2">
                        <select onchange="CEO.setGateFilter(this.value)" class="bg-[#f8fafc] border border-[#d7e2ee] rounded-xl px-3 py-2 text-xs font-bold text-[#1d2d3e] focus:outline-none focus:border-[#0070f2]">
                            <option value="all" ${this.gateFilter === 'all' ? 'selected' : ''}>🚪 ${lang === 'ar' ? 'كل البوابات' : 'All Gates'}</option>
                            ${gates.map(g => `<option value="${g}" ${this.gateFilter === g ? 'selected' : ''}>🚪 ${g}</option>`).join('')}
                        </select>

                        <select onchange="CEO.setStatusFilter(this.value)" class="bg-[#f8fafc] border border-[#d7e2ee] rounded-xl px-3 py-2 text-xs font-bold text-[#1d2d3e] focus:outline-none focus:border-[#0070f2]">
                            <option value="all" ${this.statusFilter === 'all' ? 'selected' : ''}>📌 ${lang === 'ar' ? 'كل الحالات' : 'All Statuses'}</option>
                            <option value="inside" ${this.statusFilter === 'inside' ? 'selected' : ''}>🟢 داخل المصنع</option>
                            <option value="exited" ${this.statusFilter === 'exited' ? 'selected' : ''}>📤 غادرت المصنع</option>
                            <option value="overstay" ${this.statusFilter === 'overstay' ? 'selected' : ''}>⚠️ متجاوز للمدة</option>
                            <option value="denied" ${this.statusFilter === 'denied' ? 'selected' : ''}>⛔ ممنوعة / مرفوضة</option>
                            <option value="hold" ${this.statusFilter === 'hold' ? 'selected' : ''}>⏸️ تصريح معلق</option>
                        </select>
                    </div>
                </div>

                <!-- Audit Table -->
                <div class="overflow-x-auto rounded-2xl border border-[#d7e2ee]" id="ceo-printable-audit-area">
                    <table class="sap-table w-full text-xs text-right" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                        <thead class="bg-[#002b66] text-white">
                            <tr>
                                <th class="py-3.5 px-4">${lang === 'ar' ? 'لوحة الشاحنة والسائق' : 'Plate & Driver'}</th>
                                <th class="py-3.5 px-4">${lang === 'ar' ? 'الوجهة وأوزان البسكول' : 'Destination & Weights'}</th>
                                <th class="py-3.5 px-4">${lang === 'ar' ? 'منشئ ومعتمد التصريح' : 'Created By & Approved By'}</th>
                                <th class="py-3.5 px-4">${lang === 'ar' ? 'حركة الدخول (البوابة • التوقيت • الضابط)' : 'Entry Movement'}</th>
                                <th class="py-3.5 px-4">${lang === 'ar' ? 'حركة الخروج (البوابة • التوقيت • الضابط)' : 'Exit Movement'}</th>
                                <th class="py-3.5 px-4">${lang === 'ar' ? 'المدة والحالة' : 'Duration & Status'}</th>
                                <th class="py-3.5 px-4 text-center">${lang === 'ar' ? 'التتبع والرحلة' : 'Timeline'}</th>
                            </tr>
                        </thead>
                        <tbody id="ceo-audit-table-body" class="divide-y divide-[#e7eff7] bg-white">
                            ${this.renderAuditRows(lang)}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    renderEmergencyTab(lang, insideMovements) {
        const roster = window.DB.getEmergencyEvacuationRoster();
        const lockdown = window.DB.getEmergencyLockdownStatus();

        return `
            <div class="sap-panel p-6 bg-white rounded-3xl border-2 border-red-400 shadow-xl space-y-5" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-red-200">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center font-black text-2xl shadow-md">
                            🚨
                        </div>
                        <div>
                            <h2 class="text-xl font-black text-red-950">
                                ${lang === 'ar' ? 'مركز قيادة الطوارئ والإخلاء الشامل للمصنع' : 'Emergency Command & Evacuation Control'}
                            </h2>
                            <p class="text-xs text-red-800 font-semibold">
                                ${lang === 'ar' ? 'كشف حصر الأفراد والشاحنات المتواجدة داخل المنشأة لحظياً لفرق الحماية المدنية والإسعاف' : 'Real-time muster roll for emergency responders'}
                            </p>
                        </div>
                    </div>

                    <div class="flex items-center gap-2">
                        <button type="button" onclick="window.print()" class="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1.5">
                            <span>🖨️</span>
                            <span>${lang === 'ar' ? 'طباعة كشف الإخلاء الفوري' : 'Print Muster Roll'}</span>
                        </button>
                        ${!lockdown.active ? `
                            <button type="button" onclick="CEO.triggerEmergencyLockdownModal()" class="px-4 py-2.5 bg-red-950 hover:bg-black text-white font-black text-xs rounded-xl shadow-md border border-red-500">
                                🚨 إعلان إغلاق طوارئ (Lockdown)
                            </button>
                        ` : `
                            <button type="button" onclick="CEO.liftEmergencyLockdown()" class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md">
                                🟢 إنهاء حالة الطوارئ
                            </button>
                        `}
                    </div>
                </div>

                <!-- Live In-Factory Summary Banner -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
                    <div class="p-4 bg-red-50 rounded-2xl border border-red-200">
                        <div class="text-3xl font-black text-red-900 font-mono">${roster.length}</div>
                        <div class="text-xs font-bold text-red-800 mt-1">إجمالي الشاحنات داخل المنشأة حالياً</div>
                    </div>
                    <div class="p-4 bg-amber-50 rounded-2xl border border-amber-200">
                        <div class="text-3xl font-black text-amber-900 font-mono">${roster.filter(r => r.minutes_inside > 120).length}</div>
                        <div class="text-xs font-bold text-amber-800 mt-1">شاحنات متجاوزة لساعتين بالداخل</div>
                    </div>
                    <div class="p-4 bg-blue-50 rounded-2xl border border-blue-200">
                        <div class="text-3xl font-black text-blue-900 font-mono">${lockdown.active ? 'نشط 🚨' : 'طبيعي 🟢'}</div>
                        <div class="text-xs font-bold text-blue-800 mt-1">حالة الإنذار الأمني العام</div>
                    </div>
                </div>

                <!-- Real-time Evacuation Table -->
                <div class="overflow-x-auto rounded-2xl border border-red-200">
                    <table class="w-full text-xs text-right" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                        <thead class="bg-red-900 text-white font-black">
                            <tr>
                                <th class="p-3 text-center">#</th>
                                <th class="p-3">رقم اللوحة والشركة</th>
                                <th class="p-3">اسم السائق ورقم الهاتف</th>
                                <th class="p-3">الموقع الداخلي / المستودع</th>
                                <th class="p-3">بوابة الدخول والتوقيت</th>
                                <th class="p-3 text-center">مدة التواجد</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-red-100 bg-white">
                            ${roster.length === 0 ? `
                                <tr>
                                    <td colspan="6" class="p-8 text-center text-emerald-800 font-bold text-sm bg-emerald-50">
                                        🟢 المنشأة خالية تماماً - لا توجد أي شاحنات أو سائقين بالداخل.
                                    </td>
                                </tr>
                            ` : roster.map((item, idx) => `
                                <tr class="hover:bg-red-50/50 transition-colors">
                                    <td class="p-3 text-center font-mono font-bold text-red-900">${idx + 1}</td>
                                    <td class="p-3">
                                        <div class="font-black text-base text-[#002b66]">${item.plate_ar}</div>
                                        <div class="text-[10px] text-[#556b82] font-semibold">${item.company}</div>
                                    </td>
                                    <td class="p-3">
                                        <div class="font-bold text-[#1d2d3e]">${item.driver_name}</div>
                                        <div class="text-[11px] font-mono text-[#0070f2]">📞 ${item.driver_phone || 'غير مسجل'}</div>
                                    </td>
                                    <td class="p-3 font-bold text-[#1d2d3e]">📍 ${item.destination}</td>
                                    <td class="p-3">
                                        <div class="font-bold text-[#002b66]">🚪 ${item.gate_name}</div>
                                        <div class="text-[10px] text-[#556b82] font-mono">⏰ ${item.entry_time}</div>
                                    </td>
                                    <td class="p-3 text-center font-mono font-black text-red-700 text-sm">
                                        ⏱️ ${item.minutes_inside} دقيقة
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    renderHandoversTab(lang) {
        const handovers = window.DB.getShiftHandovers().slice().reverse();

        return `
            <div class="sap-panel p-6 bg-white rounded-3xl border border-purple-200 shadow-md space-y-4" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                <div class="flex justify-between items-center pb-3 border-b border-purple-200">
                    <div class="flex items-center gap-2.5">
                        <span class="text-2xl">📄</span>
                        <div>
                            <h3 class="text-base font-black text-purple-950">
                                ${lang === 'ar' ? 'سجل محاضر تسليم الورديات الإلكترونية' : 'Shift Handover Archive'}
                            </h3>
                            <p class="text-xs text-purple-700 font-semibold">
                                ${lang === 'ar' ? 'توثيق العهدة وتدفق الشاحنات بين الضباط عند تبديل الورديات الصباحية والمسائية' : 'Shift transition records and in-factory accountability'}
                            </p>
                        </div>
                    </div>
                </div>

                <div class="overflow-x-auto rounded-2xl border border-[#d7e2ee]">
                    <table class="w-full text-xs text-right" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                        <thead class="bg-purple-900 text-white font-black">
                            <tr>
                                <th class="p-3 text-center">#</th>
                                <th class="p-3">التاريخ والوقت</th>
                                <th class="p-3">الضابط المسلّم والمحطة</th>
                                <th class="p-3">الوردية والمناوب المستلم</th>
                                <th class="p-3 text-center">إحصائيات الوردية</th>
                                <th class="p-3">ملاحظات التسليم</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-[#e7eff7] bg-white">
                            ${handovers.length === 0 ? `
                                <tr>
                                    <td colspan="6" class="p-6 text-center text-slate-500 font-bold">
                                        لا توجد محاضر تسليم ورديات مسجلة حتى الآن.
                                    </td>
                                </tr>
                            ` : handovers.map((h, idx) => `
                                <tr class="hover:bg-purple-50/40 transition-colors">
                                    <td class="p-3 text-center font-mono font-bold text-purple-900">${idx + 1}</td>
                                    <td class="p-3">
                                        <div class="font-bold text-[#002b66]">${h.date}</div>
                                        <div class="text-[10px] text-[#556b82] font-mono">${h.time}</div>
                                    </td>
                                    <td class="p-3">
                                        <div class="font-black text-[#002b66]">${h.officer_name} <span class="text-[#0070f2] font-mono">(${h.badge_id})</span></div>
                                        <div class="text-[10px] text-[#556b82] font-bold">🚪 ${h.gate_name}</div>
                                    </td>
                                    <td class="p-3">
                                        <div class="font-bold text-purple-800">${h.shift_name}</div>
                                        <div class="text-[10px] text-[#107e3e] font-bold">🤝 المستلم: ${h.partner_name} (${h.partner_badge})</div>
                                    </td>
                                    <td class="p-3 text-center">
                                        <span class="inline-flex gap-1 text-[11px] font-mono font-bold">
                                            <span class="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded">📥 ${h.entries_count}</span>
                                            <span class="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">📤 ${h.exits_count}</span>
                                            <span class="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded">🚚 ${h.inside_count}</span>
                                        </span>
                                    </td>
                                    <td class="p-3 text-[#1d2d3e] font-semibold">${h.notes || '--'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    renderUsersTab(lang, icon) {
        const users = window.DB.getUsers();
        const ceoCount = users.filter(u => u.role === 'ceo').length;
        const managerCount = users.filter(u => u.role === 'manager' || u.role === 'admin').length;
        const officerCount = users.filter(u => u.role === 'officer').length;

        const norm = (str) => String(str || '').toLowerCase().trim();
        const q = norm(this.userSearchQuery);

        const filteredUsers = users.filter(u => {
            if (!q) return true;
            return norm(u.name_ar).includes(q) ||
                   norm(u.name_en).includes(q) ||
                   norm(u.badge_id).includes(q) ||
                   norm(u.email).includes(q) ||
                   norm(u.gate_assigned).includes(q);
        });

        return `
            <!-- Top Metrics Strip for Users -->
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div class="sap-card p-4 bg-white rounded-2xl border border-[#b0cfee] shadow-sm">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-[#556b82]">${lang === 'ar' ? 'إجمالي مستخدمي النظام' : 'Total Users'}</span>
                        <span class="text-xl">👥</span>
                    </div>
                    <div class="mt-2 text-2xl font-black text-[#002b66] font-mono">${users.length}</div>
                    <div class="text-[11px] text-[#556b82] font-semibold">${lang === 'ar' ? 'حسابات مسجلة ومفعلة' : 'Registered accounts'}</div>
                </div>

                <div class="sap-card p-4 bg-white rounded-2xl border border-[#b0cfee] shadow-sm">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-[#556b82]">${lang === 'ar' ? 'مدراء العمليات واللوجستيات' : 'Operations Managers'}</span>
                        <span class="text-xl">👔</span>
                    </div>
                    <div class="mt-2 text-2xl font-black text-[#0070f2] font-mono">${managerCount}</div>
                    <div class="text-[11px] text-[#556b82] font-semibold">${lang === 'ar' ? 'صلاحيات إصدار واعتماد التصاريح' : 'Permits & Approvals'}</div>
                </div>

                <div class="sap-card p-4 bg-white rounded-2xl border border-[#b0cfee] shadow-sm">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-[#556b82]">${lang === 'ar' ? 'ضباط وأمناء البوابات' : 'Gate Officers'}</span>
                        <span class="text-xl">👮</span>
                    </div>
                    <div class="mt-2 text-2xl font-black text-[#107e3e] font-mono">${officerCount}</div>
                    <div class="text-[11px] text-[#556b82] font-semibold">${lang === 'ar' ? 'تسجيل الدخول والخروج وفحص المركبات' : 'Entry / Exit Inspection'}</div>
                </div>

                <div class="sap-card p-4 bg-amber-50/60 rounded-2xl border-2 border-amber-300 shadow-sm">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-black text-amber-950">${lang === 'ar' ? 'حسابات الإدارة العليا المحمية' : 'Protected CEO Accounts'}</span>
                        <span class="text-xl">👑</span>
                    </div>
                    <div class="mt-2 flex items-baseline gap-2">
                        <span class="text-2xl font-black text-amber-950 font-mono">${ceoCount}</span>
                        <span class="text-xs text-amber-900 font-bold">🔒 غير قابلة للحذف</span>
                    </div>
                    <div class="text-[11px] text-amber-900 font-semibold">${lang === 'ar' ? 'محمية برمجياً من الحذف' : 'Protected by security rule'}</div>
                </div>
            </div>

            <!-- Users Toolbar & Table Card -->
            <div class="sap-card bg-white rounded-3xl border border-[#b0cfee] shadow-md p-6 space-y-4">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-[#d7e2ee]">
                    <div>
                        <h3 class="text-base font-black text-[#002b66] flex items-center gap-2">
                            <span>👥</span>
                            <span>${lang === 'ar' ? 'إدارة المستخدمين وحسابات الدخول' : 'User & Credential Management'}</span>
                            <span class="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-black border border-amber-300">CEO Exclusive</span>
                        </h3>
                        <p class="text-xs text-[#556b82]">
                            ${lang === 'ar' ? 'إضافة وتعديل حسابات مدراء العمليات وضباط البوابات مع الحماية الصارمة لحساب الرئيس التنفيذي' : 'Manage manager and officer credentials with strict CEO protection'}
                        </p>
                    </div>

                    <div class="flex items-center gap-2 w-full sm:w-auto">
                        <input type="text" value="${this.userSearchQuery}" oninput="CEO.handleUserSearch(this.value)" placeholder="${lang === 'ar' ? 'بحث بالاسم، الشارة، أو البريد...' : 'Search users...'}" class="bg-[#f8fafc] border border-[#d7e2ee] rounded-xl px-3 py-2 text-xs font-bold text-[#1d2d3e] focus:border-[#0070f2] focus:bg-white focus:outline-none flex-1 sm:w-60" />
                        <button type="button" onclick="CEO.openAddUserModal()" class="px-4 py-2.5 bg-[#0070f2] hover:bg-[#005bb5] text-white rounded-xl font-black text-xs shadow-md flex items-center gap-1.5 flex-shrink-0 active:scale-95 transition-all">
                            <span>➕</span>
                            <span>${lang === 'ar' ? 'إضافة مستخدم جديد' : 'Add New User'}</span>
                        </button>
                    </div>
                </div>

                <!-- Table -->
                <div class="overflow-x-auto rounded-2xl border border-[#d7e2ee]">
                    <table class="w-full text-xs text-right" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                        <thead class="bg-[#f0f4f8] text-[#002b66] font-black border-b border-[#d7e2ee]">
                            <tr>
                                <th class="p-3 text-center w-12">#</th>
                                <th class="p-3">الاسم الكامل</th>
                                <th class="p-3 text-center">كود الشارة</th>
                                <th class="p-3">البريد الإلكتروني / اسم الدخول</th>
                                <th class="p-3 text-center">الدور والصلاحية</th>
                                <th class="p-3">البوابة المعينة / الوردية</th>
                                <th class="p-3 text-center">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-[#e7eff7]">
                            ${filteredUsers.map((u, idx) => {
                                const isCEO = u.role === 'ceo';
                                const isManager = u.role === 'manager' || u.role === 'admin';
                                const roleBadge = isCEO
                                    ? '<span class="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full font-black text-xs inline-flex items-center gap-1">👑 رئيس تنفيذي (CEO)</span>'
                                    : (isManager
                                        ? '<span class="px-2.5 py-1 bg-blue-100 text-blue-900 border border-blue-300 rounded-full font-black text-xs inline-flex items-center gap-1">👔 مدير عمليات</span>'
                                        : '<span class="px-2.5 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-full font-black text-xs inline-flex items-center gap-1">👮 ضابط بوابة</span>');

                                return `
                                    <tr class="hover:bg-[#f8fafc] transition-colors ${isCEO ? 'bg-amber-50/30' : ''}">
                                        <td class="p-3 text-center font-mono font-bold text-[#556b82]">${idx + 1}</td>
                                        <td class="p-3">
                                            <div class="font-black text-[#002b66]">${u.name_ar || u.name_en}</div>
                                            <div class="text-[10px] text-[#556b82] font-sans">${u.name_en || ''}</div>
                                        </td>
                                        <td class="p-3 text-center">
                                            <span class="px-2 py-0.5 rounded-lg bg-[#ebf3fb] text-[#0070f2] font-mono font-black border border-[#b3d5fa] text-xs">
                                                ${u.badge_id || '--'}
                                            </span>
                                        </td>
                                        <td class="p-3 font-mono font-bold text-[#1d2d3e]">${u.email || '--'}</td>
                                        <td class="p-3 text-center">${roleBadge}</td>
                                        <td class="p-3">
                                            ${u.gate_assigned ? `
                                                <div class="font-bold text-[#1d2d3e]">🚪 ${u.gate_assigned}</div>
                                                <div class="text-[10px] text-[#556b82] font-semibold">${u.shift === 'night' ? '🌙 وردية الليل' : '☀️ وردية النهار'}</div>
                                            ` : '<span class="text-[#8fa4b8] font-bold">-- كافة المنشآت --</span>'}
                                        </td>
                                        <td class="p-3 text-center">
                                            <div class="flex items-center justify-center gap-1.5">
                                                <button type="button" onclick="CEO.openEditUserModal(${u.id})" class="px-2.5 py-1.5 bg-slate-100 hover:bg-[#0070f2] hover:text-white text-[#002b66] rounded-xl font-bold transition-all shadow-sm flex items-center gap-1">
                                                    <span>✏️</span>
                                                    <span>تعديل</span>
                                                </button>
                                                ${isCEO ? `
                                                    <span class="px-2.5 py-1.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-xl font-black text-[11px] shadow-sm flex items-center gap-1 cursor-not-allowed" title="حساب الرئيس التنفيذي محمي برمجياً ولا يمكن حذفه نهائياً">
                                                        <span>🔒</span>
                                                        <span>محمي</span>
                                                    </span>
                                                ` : `
                                                    <button type="button" onclick="CEO.handleDeleteUser(${u.id})" class="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 rounded-xl font-bold transition-all shadow-sm flex items-center gap-1">
                                                        <span>🗑️</span>
                                                        <span>حذف</span>
                                                    </button>
                                                `}
                                            </div>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    handleUserSearch(query) {
        this.userSearchQuery = query || '';
        this.renderDashboard();
    }

    renderAuditRows(lang) {
        const icon = (name, cls = 'w-3.5 h-3.5') => window.Icons ? window.Icons.get(name, cls) : '';
        let movements = window.DB.getExecutiveMovementLogs();
        
        const norm = (str) => window.ArabicPlate && window.ArabicPlate.normalizeSearchText ? window.ArabicPlate.normalizeSearchText(str) : String(str || '').toLowerCase().trim();
        const normPlate = (str) => window.ArabicPlate && window.ArabicPlate.normalizePlateCompact ? window.ArabicPlate.normalizePlateCompact(str) : norm(str).replace(/[\s\-_/.,]+/g, '');
        const qNorm = norm(this.searchQuery);
        const qPlate = normPlate(this.searchQuery);

        // 1. Apply Date Filter
        const now = new Date();
        if (this.dateFilter === 'today') {
            const todayStr = now.toISOString().split('T')[0];
            movements = movements.filter(m => m.entry_timestamp && m.entry_timestamp.startsWith(todayStr));
        } else if (this.dateFilter === '7days') {
            const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
            movements = movements.filter(m => new Date(m.entry_timestamp) >= sevenDaysAgo);
        } else if (this.dateFilter === '30days') {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
            movements = movements.filter(m => new Date(m.entry_timestamp) >= thirtyDaysAgo);
        }

        // 2. Apply Gate Filter
        if (this.gateFilter !== 'all') {
            movements = movements.filter(m => m.entry_gate === this.gateFilter || m.exit_gate === this.gateFilter);
        }

        // 3. Apply Status Filter
        if (this.statusFilter !== 'all') {
            movements = movements.filter(m => m.status === this.statusFilter);
        }

        // 4. Apply Free Search Query
        if (qNorm) {
            movements = movements.filter(m => {
                const pAr = norm(m.vehicle?.plate_ar);
                const pEn = norm(m.vehicle?.plate_en);
                const pArCompact = normPlate(m.vehicle?.plate_ar);
                const pEnCompact = normPlate(m.vehicle?.plate_en);

                const matchPlate = pAr.includes(qNorm) || pEn.includes(qNorm) || (qPlate && (pArCompact.includes(qPlate) || pEnCompact.includes(qPlate)));
                const matchDriver = norm(m.vehicle?.driver_name_ar).includes(qNorm) || norm(m.vehicle?.driver_name_en).includes(qNorm) || norm(m.vehicle?.company_ar).includes(qNorm) || norm(m.vehicle?.driver_phone).includes(qNorm) || norm(m.vehicle?.driver_national_id).includes(qNorm);
                const matchPermit = m.permit && (norm(m.permit.permit_code).includes(qNorm) || norm(m.permit.pin_code).includes(qNorm) || norm(m.permit.invoice_no).includes(qNorm) || norm(m.permit.cargo_details).includes(qNorm));
                const matchCreator = norm(m.created_by_name).includes(qNorm);
                const matchApprover = norm(m.approved_by_name).includes(qNorm);
                const matchEntryOfficer = norm(m.entry_officer_name).includes(qNorm);
                const matchExitOfficer = norm(m.exit_officer_name).includes(qNorm);

                return matchPlate || matchDriver || matchPermit || matchCreator || matchApprover || matchEntryOfficer || matchExitOfficer;
            });
        }

        if (movements.length === 0) {
            return `
                <tr>
                    <td colspan="7" class="py-12 text-center text-[#556b82]">
                        <div class="text-4xl mb-2">🔍</div>
                        <div class="font-bold text-sm text-[#1d2d3e]">${lang === 'ar' ? 'لم يتم العثور على أي حركات تطابق معايير البحث والفلترة' : 'No movements match the search criteria'}</div>
                        <div class="text-xs text-[#8fa4b8] mt-1">${lang === 'ar' ? 'يرجى تغيير نطاق التاريخ أو البوابة أو التحقق من رقم اللوحة' : 'Try adjusting date filters or query'}</div>
                    </td>
                </tr>
            `;
        }

        return movements.map(m => {
            const isInside = m.status === 'inside';
            const isOverstay = m.status === 'overstay';
            const isDenied = m.status === 'denied';
            const isHold = m.status === 'hold';

            let statusBadge = '';
            if (isDenied) {
                statusBadge = '<span class="px-2.5 py-1 bg-red-100 text-red-900 border border-red-300 rounded-full font-black text-xs inline-flex items-center gap-1">⛔ ممنوعة / مرفوضة</span>';
            } else if (isOverstay) {
                statusBadge = '<span class="px-2.5 py-1 bg-amber-100 text-amber-950 border border-amber-400 rounded-full font-black text-xs inline-flex items-center gap-1 animate-pulse">⚠️ متجاوز للمدة</span>';
            } else if (isInside) {
                statusBadge = '<span class="px-2.5 py-1 bg-emerald-100 text-emerald-950 border border-emerald-300 rounded-full font-black text-xs inline-flex items-center gap-1">🟢 متواجدة بالداخل</span>';
            } else if (isHold) {
                statusBadge = '<span class="px-2.5 py-1 bg-purple-100 text-purple-900 border border-purple-300 rounded-full font-black text-xs inline-flex items-center gap-1">⏸️ معلق</span>';
            } else {
                statusBadge = '<span class="px-2.5 py-1 bg-slate-100 text-slate-800 border border-slate-300 rounded-full font-bold text-xs inline-flex items-center gap-1">📤 غادرت المنشأة</span>';
            }

            const entryTime = new Date(m.entry_timestamp);
            const exitTime = m.exit_timestamp ? new Date(m.exit_timestamp) : null;

            return `
                <tr class="hover:bg-[#f8fafc] transition-colors border-b border-[#e7eff7]">
                    
                    <!-- 1. Plate & Driver -->
                    <td class="py-3.5 px-4">
                        <div class="flex items-start gap-2">
                            ${m.photo_url ? `
                                <img src="${m.photo_url}" class="w-10 h-10 rounded-xl object-cover border border-[#d7e2ee] shadow-xs flex-shrink-0" alt="Truck" />
                            ` : `
                                <div class="w-10 h-10 rounded-xl bg-[#f0f4f8] text-[#002b66] flex items-center justify-center font-bold text-lg flex-shrink-0">
                                    🚚
                                </div>
                            `}
                            <div>
                                <div class="font-black text-sm text-[#002b66]">${m.vehicle?.plate_ar || 'غير محدد'}</div>
                                <div class="text-[11px] text-[#1d2d3e] font-bold flex items-center gap-1">
                                    <span>👤 ${m.vehicle?.driver_name_ar || 'سائق مصرح'}</span>
                                    ${m.vehicle?.driver_phone ? `<a href="tel:${m.vehicle.driver_phone}" class="text-[#0070f2] font-mono font-bold text-[10px]">📞</a>` : ''}
                                </div>
                                <div class="text-[10px] text-[#556b82] font-semibold">${m.vehicle?.company_ar || 'جهة توريد'}</div>
                            </div>
                        </div>
                    </td>

                    <!-- 2. Destination, Cargo & Weighbridge -->
                    <td class="py-3.5 px-4">
                        <div class="font-bold text-[#1d2d3e]">📍 ${m.destination_ar}</div>
                        <div class="text-[11px] text-[#556b82] truncate max-w-[200px]" title="${m.cargo_details}">📦 ${m.cargo_details}</div>
                        ${(m.gross_weight || m.net_weight) ? `
                            <div class="mt-1 inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md font-mono text-[10px] font-bold">
                                ⚖️ ${m.net_weight ? `صافي: ${m.net_weight} طن` : `قائم: ${m.gross_weight} طن`}
                                ${m.dock_bay ? `• 🅿️ ${m.dock_bay}` : ''}
                            </div>
                        ` : ''}
                    </td>

                    <!-- 3. Created & Approved By -->
                    <td class="py-3.5 px-4">
                        <div class="text-[11px] text-[#1d2d3e]">
                            <span class="text-[#556b82]">الإنشاء:</span> <b class="text-[#002b66]">${m.created_by_name}</b>
                        </div>
                        <div class="text-[11px] text-[#1d2d3e] mt-0.5">
                            <span class="text-[#556b82]">الاعتماد:</span> <b class="text-[#107e3e]">${m.approved_by_name}</b>
                        </div>
                        ${m.permit ? `
                            <div class="text-[10px] text-[#0070f2] font-mono font-bold mt-0.5">
                                ${m.permit.permit_code}
                            </div>
                        ` : ''}
                    </td>

                    <!-- 4. Entry Movement -->
                    <td class="py-3.5 px-4">
                        <div class="font-bold text-[#002b66]">🚪 ${m.entry_gate}</div>
                        <div class="text-[11px] text-[#1d2d3e] font-mono">${entryTime.toLocaleDateString([], { month: '2-digit', day: '2-digit' })} • ${entryTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        <div class="text-[10px] text-[#556b82]">👮 الضابط: <b>${m.entry_officer_name}</b></div>
                    </td>

                    <!-- 5. Exit Movement -->
                    <td class="py-3.5 px-4">
                        ${exitTime ? `
                            <div class="font-bold text-[#0070f2]">🚪 ${m.exit_gate}</div>
                            <div class="text-[11px] text-[#1d2d3e] font-mono">${exitTime.toLocaleDateString([], { month: '2-digit', day: '2-digit' })} • ${exitTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            <div class="text-[10px] text-[#556b82]">👮 الضابط: <b>${m.exit_officer_name}</b></div>
                        ` : `
                            <span class="text-[#8fa4b8] font-bold text-xs italic">-- متواجدة بالداخل --</span>
                        `}
                    </td>

                    <!-- 6. Duration & Status -->
                    <td class="py-3.5 px-4">
                        <div class="mb-1">${statusBadge}</div>
                        <div class="text-[11px] font-mono font-bold text-[#1d2d3e]">
                            ⏱️ ${m.duration_minutes} دقيقة (${m.duration_hours} س)
                        </div>
                    </td>

                    <!-- 7. Timeline Action -->
                    <td class="py-3.5 px-4 text-center">
                        <button type="button" onclick="CEO.showJourneyTimeline(${m.log_id || m.id})" class="px-3 py-1.5 bg-[#f0f4f8] hover:bg-[#002b66] hover:text-white text-[#002b66] font-bold rounded-xl text-xs transition-all shadow-xs flex items-center justify-center gap-1 mx-auto" title="عرض المسار والرحلة">
                            <span>🗺️</span>
                            <span>الرحلة</span>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    showJourneyTimeline(logId) {
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) return;
        const lang = window.i18n.getLang();
        const movements = window.DB.getExecutiveMovementLogs();
        const movement = movements.find(m => m.id === logId || m.log_id === logId);
        if (!movement) return;

        const entryTime = new Date(movement.entry_timestamp);
        const exitTime = movement.exit_timestamp ? new Date(movement.exit_timestamp) : null;

        modalContainer.innerHTML = `
            <div class="sap-modal-overlay fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onclick="if(event.target === this) document.getElementById('modal-container').innerHTML = ''">
                <div class="sap-modal-content bg-white rounded-3xl max-w-xl w-full p-6 max-h-[92vh] overflow-y-auto shadow-2xl border border-[#d7e2ee] text-right" dir="rtl">
                    <div class="flex justify-between items-center pb-3 border-b border-[#d7e2ee] mb-4">
                        <div class="flex items-center gap-3">
                            <div class="w-11 h-11 rounded-2xl bg-[#f0f4f8] text-[#002b66] flex items-center justify-center font-black text-xl border border-[#d7e2ee]">
                                🗺️
                            </div>
                            <div>
                                <h3 class="text-base font-black text-[#002b66]">
                                    المخطط الزمني الشامل لرحلة الشاحنة
                                </h3>
                                <p class="text-xs text-[#556b82] font-mono font-bold">
                                    ${movement.vehicle?.plate_ar} • ${movement.permit?.permit_code || 'تصريح مباشر'}
                                </p>
                            </div>
                        </div>
                        <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm">✕</button>
                    </div>

                    <!-- Steps Timeline -->
                    <div class="relative pl-4 pr-6 space-y-6 before:absolute before:right-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#b0cfee] text-xs">
                        
                        <!-- Step 1: Permit Creation -->
                        <div class="relative flex items-start gap-3">
                            <span class="absolute -right-4 top-1 w-3 h-3 rounded-full bg-[#0070f2] ring-4 ring-white"></span>
                            <div class="bg-[#f8fafc] p-3 rounded-2xl border border-[#d7e2ee] flex-1">
                                <div class="font-black text-[#002b66]">1. إنشاء وتجهيز التصريح المسبق</div>
                                <div class="text-[11px] text-[#556b82] mt-0.5">منشئ التصريح: <b>${movement.created_by_name}</b></div>
                                <div class="text-[10px] text-[#556b82] font-mono">${movement.permit?.created_at ? new Date(movement.permit.created_at).toLocaleString('ar-EG') : 'مسجل مسبقاً'}</div>
                            </div>
                        </div>

                        <!-- Step 2: Management Approval -->
                        <div class="relative flex items-start gap-3">
                            <span class="absolute -right-4 top-1 w-3 h-3 rounded-full bg-[#107e3e] ring-4 ring-white"></span>
                            <div class="bg-[#f8fafc] p-3 rounded-2xl border border-[#d7e2ee] flex-1">
                                <div class="font-black text-[#107e3e]">2. الاعتماد الإداري والموافقة</div>
                                <div class="text-[11px] text-[#556b82] mt-0.5">المعتمد: <b>${movement.approved_by_name}</b></div>
                                <div class="text-[11px] text-[#1d2d3e]">الوجهة: <b>${movement.destination_ar}</b> • الحمولة: <b>${movement.cargo_details}</b></div>
                            </div>
                        </div>

                        <!-- Step 3: Gate Entry & Weighbridge Gross Weight -->
                        <div class="relative flex items-start gap-3">
                            <span class="absolute -right-4 top-1 w-3 h-3 rounded-full bg-emerald-600 ring-4 ring-white"></span>
                            <div class="bg-[#f0fdf4] p-3 rounded-2xl border border-emerald-200 flex-1">
                                <div class="font-black text-emerald-950">3. التحقق الأمني، وزن البسكول والدخول</div>
                                <div class="text-[11px] text-emerald-900 mt-0.5">البوابة: <b>${movement.entry_gate}</b> • الضابط: <b>${movement.entry_officer_name}</b></div>
                                ${movement.gross_weight ? `
                                    <div class="text-[11px] font-mono font-bold text-emerald-800 mt-1">
                                        ⚖️ الوزن القائم (Gross): ${movement.gross_weight} طن • 🅿️ الرصيف: ${movement.dock_bay || 'ساحة الانتظار'}
                                    </div>
                                ` : ''}
                                <div class="text-[10px] text-emerald-700 font-mono mt-0.5">التوقيت: ${entryTime.toLocaleString('ar-EG')}</div>
                            </div>
                        </div>

                        <!-- Step 4: Factory Exit & Net Weight -->
                        <div class="relative flex items-start gap-3">
                            <span class="absolute -right-4 top-1 w-3 h-3 rounded-full ${exitTime ? 'bg-blue-600' : 'bg-slate-400'} ring-4 ring-white"></span>
                            <div class="${exitTime ? 'bg-[#ebf3fb] border-[#b3d5fa]' : 'bg-slate-50 border-slate-200'} p-3 rounded-2xl border flex-1">
                                <div class="font-black ${exitTime ? 'text-[#002b66]' : 'text-slate-500'}">4. المغادرة النهائية وتسجيل وزن البسكول الفارغ</div>
                                ${exitTime ? `
                                    <div class="text-[11px] text-[#002b66] mt-0.5">البوابة: <b>${movement.exit_gate}</b> • الضابط: <b>${movement.exit_officer_name}</b></div>
                                    ${movement.net_weight ? `
                                        <div class="text-[11px] font-mono font-bold text-emerald-800 mt-1">
                                            ⚖️ الوزن الفارغ: ${movement.tare_weight || 0} طن • صافي الحمولة: ${movement.net_weight} طن
                                        </div>
                                    ` : ''}
                                    <div class="text-[10px] text-[#556b82] font-mono mt-0.5">التوقيت: ${exitTime.toLocaleString('ar-EG')}</div>
                                    <div class="text-[11px] font-mono font-bold text-[#0070f2] mt-1">⏱️ إجمالي مدة البقاء: ${movement.duration_minutes} دقيقة</div>
                                ` : `
                                    <div class="text-xs text-slate-500 mt-1 italic">الشاحنة لا تزال متواجدة داخل المصنع في مناطق التحميل والتفريغ.</div>
                                `}
                            </div>
                        </div>
                    </div>

                    <div class="pt-4 mt-4 border-t border-[#d7e2ee] flex justify-end">
                        <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="px-5 py-2.5 bg-[#002b66] text-white font-bold rounded-xl text-xs shadow-md">
                            إغلاق النافذة
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    triggerEmergencyLockdownModal() {
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) return;

        modalContainer.innerHTML = `
            <div class="sap-modal-overlay fixed inset-0 z-[9999] bg-red-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto" onclick="if(event.target === this) document.getElementById('modal-container').innerHTML = ''">
                <div class="sap-modal-content bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-4 border-red-600 text-right" dir="rtl">
                    <div class="flex items-center gap-3 pb-3 border-b border-red-200 mb-4">
                        <span class="text-3xl">🚨</span>
                        <div>
                            <h3 class="text-base font-black text-red-950">إعلان حالة طوارئ وإغلاق المنشأة</h3>
                            <p class="text-xs text-red-700">تجميد بوابات الدخول وفتح بوابات الإخلاء فوراً</p>
                        </div>
                    </div>

                    <form onsubmit="CEO.submitEmergencyLockdown(event)" class="space-y-4 text-xs">
                        <div>
                            <label class="block font-bold text-red-950 mb-1">سبب إعلان الطوارئ والإغلاق:</label>
                            <input type="text" id="lockdown-reason-input" required placeholder="مثال: تسريب مواد كيميائية / تدريب إخلاء شامل" class="w-full bg-red-50 border-2 border-red-400 rounded-xl px-3.5 py-2.5 text-xs font-bold text-red-950 focus:outline-none focus:border-red-600" />
                        </div>

                        <div class="p-3 bg-red-50 rounded-xl border border-red-200 text-[11px] text-red-900 font-semibold space-y-1">
                            <div>• سيتم إرسال إشعار صوتي واهتزاز فوري لجميع ضباط البوابات والمدراء.</div>
                            <div>• سيتم توليد كشف حصر المتواجدين الفوري للإسعاف والإطفاء.</div>
                        </div>

                        <div class="flex gap-2 pt-2">
                            <button type="submit" class="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-xs shadow-md">
                                🚨 تأكيد وإعلان الطوارئ فوراً
                            </button>
                            <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs">
                                إلغاء
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    submitEmergencyLockdown(event) {
        if (event) event.preventDefault();
        const reason = document.getElementById('lockdown-reason-input')?.value.trim() || 'حالة طوارئ عامة';
        const user = window.Auth ? window.Auth.getCurrentUser() : { id: 1 };
        window.DB.triggerEmergencyLockdown(reason, user.id);
        document.getElementById('modal-container').innerHTML = '';
        this.switchTab('emergency');
        if (window.App) {
            window.App.showToast('🚨 تم إعلان حالة الطوارئ', reason, 'error', 'bell');
        }
    }

    liftEmergencyLockdown() {
        if (confirm('هل أنت متأكد من زوال حالة الطوارئ وإعادة فتح البوابات للوضع الطبيعي؟')) {
            window.DB.liftEmergencyLockdown();
            this.switchTab('movements');
            if (window.App) {
                window.App.showToast('🟢 انتهت حالة الطوارئ', 'تمت استعادة العمليات الطبيعية في كافة البوابات بنجاح.', 'success', 'check');
            }
        }
    }

    handleSearch(query) {
        this.searchQuery = query || '';
        const tbody = document.getElementById('ceo-audit-table-body');
        if (tbody) {
            tbody.innerHTML = this.renderAuditRows(window.i18n.getLang());
        }
    }

    setDateFilter(filter) {
        this.dateFilter = filter;
        this.renderDashboard();
    }

    setGateFilter(filter) {
        this.gateFilter = filter;
        this.renderDashboard();
    }

    setStatusFilter(filter) {
        this.statusFilter = filter;
        this.renderDashboard();
    }

    exportToExcel() {
        this.exportAuditExcel();
    }

    exportAuditExcel() {
        const movements = window.DB.getExecutiveMovementLogs();
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];

        let xml = `<?xml version="1.0"?>
        <?mso-application progid="Excel.Sheet"?>
        <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
         xmlns:o="urn:schemas-microsoft-com:office:office"
         xmlns:x="urn:schemas-microsoft-com:office:excel"
         xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
         xmlns:html="http://www.w3.org/TR/REC-html40">
         <Worksheet ss:Name="Movement_Audit_Log" ss:RightToLeft="1">
          <Table>
           <Row>
            <Cell><Data ss:Type="String">لوحة الشاحنة</Data></Cell>
            <Cell><Data ss:Type="String">اسم السائق</Data></Cell>
            <Cell><Data ss:Type="String">هاتف السائق</Data></Cell>
            <Cell><Data ss:Type="String">الشركة</Data></Cell>
            <Cell><Data ss:Type="String">الوجهة</Data></Cell>
            <Cell><Data ss:Type="String">الحمولة</Data></Cell>
            <Cell><Data ss:Type="String">الوزن القائم (طن)</Data></Cell>
            <Cell><Data ss:Type="String">الوزن الفارغ (طن)</Data></Cell>
            <Cell><Data ss:Type="String">صافي الوزن (طن)</Data></Cell>
            <Cell><Data ss:Type="String">منشئ التصريح</Data></Cell>
            <Cell><Data ss:Type="String">معتمد التصريح</Data></Cell>
            <Cell><Data ss:Type="String">بوابة الدخول</Data></Cell>
            <Cell><Data ss:Type="String">توقيت الدخول</Data></Cell>
            <Cell><Data ss:Type="String">ضابط الدخول</Data></Cell>
            <Cell><Data ss:Type="String">بوابة الخروج</Data></Cell>
            <Cell><Data ss:Type="String">توقيت الخروج</Data></Cell>
            <Cell><Data ss:Type="String">ضابط الخروج</Data></Cell>
            <Cell><Data ss:Type="String">المدة بالدقائق</Data></Cell>
            <Cell><Data ss:Type="String">الحالة</Data></Cell>
           </Row>`;

        movements.forEach(m => {
            xml += `<Row>
                <Cell><Data ss:Type="String">${m.vehicle?.plate_ar || ''}</Data></Cell>
                <Cell><Data ss:Type="String">${m.vehicle?.driver_name_ar || ''}</Data></Cell>
                <Cell><Data ss:Type="String">${m.vehicle?.driver_phone || ''}</Data></Cell>
                <Cell><Data ss:Type="String">${m.vehicle?.company_ar || ''}</Data></Cell>
                <Cell><Data ss:Type="String">${m.destination_ar || ''}</Data></Cell>
                <Cell><Data ss:Type="String">${m.cargo_details || ''}</Data></Cell>
                <Cell><Data ss:Type="String">${m.gross_weight || ''}</Data></Cell>
                <Cell><Data ss:Type="String">${m.tare_weight || ''}</Data></Cell>
                <Cell><Data ss:Type="String">${m.net_weight || ''}</Data></Cell>
                <Cell><Data ss:Type="String">${m.created_by_name || ''}</Data></Cell>
                <Cell><Data ss:Type="String">${m.approved_by_name || ''}</Data></Cell>
                <Cell><Data ss:Type="String">${m.entry_gate || ''}</Data></Cell>
                <Cell><Data ss:Type="String">${m.entry_timestamp || ''}</Data></Cell>
                <Cell><Data ss:Type="String">${m.entry_officer_name || ''}</Data></Cell>
                <Cell><Data ss:Type="String">${m.exit_gate || ''}</Data></Cell>
                <Cell><Data ss:Type="String">${m.exit_timestamp || ''}</Data></Cell>
                <Cell><Data ss:Type="String">${m.exit_officer_name || ''}</Data></Cell>
                <Cell><Data ss:Type="Number">${m.duration_minutes || 0}</Data></Cell>
                <Cell><Data ss:Type="String">${m.status || ''}</Data></Cell>
            </Row>`;
        });

        xml += `</Table></Worksheet></Workbook>`;

        const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `DOTRA_Executive_Movement_Audit_${dateStr}.xls`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    printExecutiveReport() {
        window.print();
    }

    // --- User Management Methods ---
    openAddUserModal() {
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) return;
        const lang = window.i18n.getLang();
        const gates = window.DB.getGates();

        modalContainer.innerHTML = `
            <div class="sap-modal-overlay fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onclick="if(event.target === this) document.getElementById('modal-container').innerHTML = ''">
                <div class="sap-modal-content bg-white rounded-2xl max-w-lg w-full p-6 max-h-[92vh] overflow-y-auto shadow-2xl border border-[#d7e2ee]" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                    <div class="flex justify-between items-center pb-3 border-b border-[#d7e2ee]">
                        <div class="flex items-center gap-2">
                            <span class="w-10 h-10 rounded-2xl bg-blue-50 text-[#0070f2] flex items-center justify-center font-black text-lg border border-blue-200">
                                👤
                            </span>
                            <div>
                                <h3 class="text-base font-black text-[#002b66]">
                                    ${lang === 'ar' ? 'إضافة مستخدم جديد للنظام' : 'Add New User'}
                                </h3>
                                <p class="text-xs text-[#556b82]">
                                    ${lang === 'ar' ? 'إنشاء حساب لمدير عمليات أو ضابط بوابة جديد' : 'Create new manager or gate officer account'}
                                </p>
                            </div>
                        </div>
                        <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm">✕</button>
                    </div>

                    <form onsubmit="CEO.submitAddUser(event)" class="py-4 space-y-3.5 text-xs">
                        <div>
                            <label class="block font-bold text-[#1d2d3e] mb-1">الرتبة والصلاحية (Role) *</label>
                            <select id="new-user-role" required onchange="const isOff = this.value === 'officer'; document.getElementById('pin-field-group').style.display = isOff ? 'block' : 'none'; document.getElementById('gate-field-group').style.display = isOff ? 'grid' : 'none';" class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl px-3 py-2.5 font-bold text-[#002b66] focus:border-[#0070f2] focus:bg-white focus:outline-none">
                                <option value="officer">👮 ضابط بوابة (Gate Officer)</option>
                                <option value="manager">👔 مدير عمليات (Operations Manager)</option>
                                <option value="ceo">👑 رئيس تنفيذي (CEO)</option>
                            </select>
                        </div>

                        <div class="grid grid-cols-2 gap-2">
                            <div>
                                <label class="block font-bold text-[#1d2d3e] mb-1">الاسم بالعربية *</label>
                                <input type="text" id="new-user-name-ar" required placeholder="مثال: أمين / طارق مصطفى" class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl px-3 py-2 font-bold text-[#1d2d3e] focus:border-[#0070f2] focus:bg-white focus:outline-none" />
                            </div>
                            <div>
                                <label class="block font-bold text-[#1d2d3e] mb-1">الاسم بالإنجليزية</label>
                                <input type="text" id="new-user-name-en" placeholder="e.g. Officer Tariq" class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl px-3 py-2 font-bold text-[#1d2d3e] focus:border-[#0070f2] focus:bg-white focus:outline-none" />
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-2">
                            <div>
                                <label class="block font-bold text-[#1d2d3e] mb-1">كود الشارة (Badge ID) *</label>
                                <input type="text" id="new-user-badge" required placeholder="GT-04 أو MGR-02" class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl px-3 py-2 font-mono font-bold text-[#1d2d3e] focus:border-[#0070f2] focus:bg-white focus:outline-none" />
                            </div>
                            <div>
                                <label class="block font-bold text-[#1d2d3e] mb-1">البريد الإلكتروني / تسجيل الدخول *</label>
                                <input type="email" id="new-user-email" required placeholder="officer@dotra.com" class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl px-3 py-2 font-mono font-bold text-[#1d2d3e] focus:border-[#0070f2] focus:bg-white focus:outline-none" />
                            </div>
                        </div>

                        <div>
                            <label class="block font-bold text-[#1d2d3e] mb-1">كلمة المرور (Password) *</label>
                            <input type="password" id="new-user-password" required placeholder="••••••••" class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl px-3 py-2 font-mono text-[#1d2d3e] focus:border-[#0070f2] focus:bg-white focus:outline-none" />
                        </div>

                        <div id="pin-field-group">
                            <label class="block font-bold text-[#1d2d3e] mb-1">رمز التحقق السريع لضابط البوابة (4 أرقام PIN) *</label>
                            <input type="password" id="new-user-pin" maxlength="4" placeholder="1234" class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl px-3 py-2 font-mono font-bold text-center text-[#1d2d3e] focus:border-[#0070f2] focus:bg-white focus:outline-none" />
                        </div>

                        <div id="gate-field-group" class="grid grid-cols-2 gap-2">
                            <div>
                                <label class="block font-bold text-[#1d2d3e] mb-1">البوابة المعينة</label>
                                <select id="new-user-gate" class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl px-3 py-2 font-bold text-[#1d2d3e]">
                                    ${gates.map(g => `<option value="${g}">${g}</option>`).join('')}
                                </select>
                            </div>
                            <div>
                                <label class="block font-bold text-[#1d2d3e] mb-1">الوردية</label>
                                <select id="new-user-shift" class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl px-3 py-2 font-bold text-[#1d2d3e]">
                                    <option value="day">☀️ وردية النهار</option>
                                    <option value="night">🌙 وردية الليل</option>
                                </select>
                            </div>
                        </div>

                        <div class="flex justify-end gap-2 pt-3 border-t border-[#d7e2ee]">
                            <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="px-4 py-2 sap-btn-secondary text-xs">
                                إلغاء
                            </button>
                            <button type="submit" class="px-6 py-2.5 bg-[#0070f2] hover:bg-[#005bb5] text-white font-bold rounded-xl shadow-md active:scale-95 transition-all">
                                إنشاء المستخدم
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    async submitAddUser(event) {
        if (event && event.preventDefault) event.preventDefault();
        const role = document.getElementById('new-user-role').value;
        const name_ar = document.getElementById('new-user-name-ar').value.trim();
        const name_en = document.getElementById('new-user-name-en').value.trim() || name_ar;
        const badge_id = document.getElementById('new-user-badge').value.trim();
        const email = document.getElementById('new-user-email').value.trim();
        const password = document.getElementById('new-user-password').value;
        const pin_code = document.getElementById('new-user-pin') ? document.getElementById('new-user-pin').value.trim() : '1234';
        const gate_assigned = document.getElementById('new-user-gate') ? document.getElementById('new-user-gate').value : 'بوابة 1 الرئيسية';
        const shift = document.getElementById('new-user-shift') ? document.getElementById('new-user-shift').value : 'day';

        const newUser = {
            name_ar,
            name_en,
            badge_id,
            email,
            password,
            role,
            pin_code,
            gate_assigned: role === 'officer' ? gate_assigned : null,
            shift: role === 'officer' ? shift : null
        };

        await window.DB.addUser(newUser);
        document.getElementById('modal-container').innerHTML = '';
        this.renderDashboard();
        if (window.App && typeof window.App.showToast === 'function') {
            window.App.showToast('✅ إضافة مستخدم', `تم إنشاء حساب ${name_ar} بنجاح`, 'success');
        }
    }

    openEditUserModal(userId) {
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) return;
        const lang = window.i18n.getLang();
        const gates = window.DB.getGates();
        const user = window.DB.getUsers().find(u => u.id === userId);
        if (!user) return;

        const isCEO = user.role === 'ceo';

        modalContainer.innerHTML = `
            <div class="sap-modal-overlay fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onclick="if(event.target === this) document.getElementById('modal-container').innerHTML = ''">
                <div class="sap-modal-content bg-white rounded-2xl max-w-lg w-full p-6 max-h-[92vh] overflow-y-auto shadow-2xl border border-[#d7e2ee]" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                    <div class="flex justify-between items-center pb-3 border-b border-[#d7e2ee]">
                        <div class="flex items-center gap-2">
                            <span class="w-10 h-10 rounded-2xl bg-blue-50 text-[#0070f2] flex items-center justify-center font-black text-lg border border-blue-200">
                                ✏️
                            </span>
                            <div>
                                <h3 class="text-base font-black text-[#002b66]">
                                    تعديل بيانات المستخدم (${user.name_ar})
                                </h3>
                                <p class="text-xs text-[#556b82]">
                                    كود الشارة: <strong class="font-mono text-[#0070f2]">${user.badge_id}</strong>
                                </p>
                            </div>
                        </div>
                        <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm">✕</button>
                    </div>

                    <form onsubmit="CEO.submitEditUser(event, ${user.id})" class="py-4 space-y-3.5 text-xs">
                        <div>
                            <label class="block font-bold text-[#1d2d3e] mb-1">الرتبة والصلاحية</label>
                            ${isCEO ? `
                                <div class="p-2.5 bg-amber-50 border border-amber-300 rounded-xl font-black text-amber-950 flex items-center gap-2">
                                    <span>👑</span>
                                    <span>حساب رئيس تنفيذي محمي (لا يمكن تغيير رتبته)</span>
                                </div>
                            ` : `
                                <select id="edit-user-role" class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl px-3 py-2.5 font-bold text-[#002b66]">
                                    <option value="officer" ${user.role === 'officer' ? 'selected' : ''}>👮 ضابط بوابة (Gate Officer)</option>
                                    <option value="manager" ${user.role === 'manager' || user.role === 'admin' ? 'selected' : ''}>👔 مدير عمليات (Operations Manager)</option>
                                </select>
                            `}
                        </div>

                        <div class="grid grid-cols-2 gap-2">
                            <div>
                                <label class="block font-bold text-[#1d2d3e] mb-1">الاسم بالعربية *</label>
                                <input type="text" id="edit-user-name-ar" value="${user.name_ar || ''}" required class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl px-3 py-2 font-bold text-[#1d2d3e] focus:border-[#0070f2] focus:bg-white focus:outline-none" />
                            </div>
                            <div>
                                <label class="block font-bold text-[#1d2d3e] mb-1">الاسم بالإنجليزية</label>
                                <input type="text" id="edit-user-name-en" value="${user.name_en || ''}" class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl px-3 py-2 font-bold text-[#1d2d3e] focus:border-[#0070f2] focus:bg-white focus:outline-none" />
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-2">
                            <div>
                                <label class="block font-bold text-[#1d2d3e] mb-1">كود الشارة (Badge ID) *</label>
                                <input type="text" id="edit-user-badge" value="${user.badge_id || ''}" required class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl px-3 py-2 font-mono font-bold text-[#1d2d3e] focus:border-[#0070f2] focus:bg-white focus:outline-none" />
                            </div>
                            <div>
                                <label class="block font-bold text-[#1d2d3e] mb-1">البريد الإلكتروني *</label>
                                <input type="email" id="edit-user-email" value="${user.email || ''}" required class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl px-3 py-2 font-mono font-bold text-[#1d2d3e] focus:border-[#0070f2] focus:bg-white focus:outline-none" />
                            </div>
                        </div>

                        <div>
                            <label class="block font-bold text-[#1d2d3e] mb-1">تعيين كلمة مرور جديدة (اتركه فارغاً للإبقاء على الحالية)</label>
                            <input type="password" id="edit-user-password" placeholder="••••••••" class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl px-3 py-2 font-mono text-[#1d2d3e] focus:border-[#0070f2] focus:bg-white focus:outline-none" />
                        </div>

                        ${user.role === 'officer' ? `
                            <div>
                                <label class="block font-bold text-[#1d2d3e] mb-1">تعيين رمز PIN جديد (4 أرقام - اتركه فارغاً للحالي)</label>
                                <input type="password" id="edit-user-pin" maxlength="4" placeholder="••••" class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl px-3 py-2 font-mono font-bold text-center text-[#1d2d3e] focus:border-[#0070f2] focus:bg-white focus:outline-none" />
                            </div>
                            <div class="grid grid-cols-2 gap-2">
                                <div>
                                    <label class="block font-bold text-[#1d2d3e] mb-1">البوابة المعينة</label>
                                    <select id="edit-user-gate" class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl px-3 py-2 font-bold text-[#1d2d3e]">
                                        ${gates.map(g => `<option value="${g}" ${user.gate_assigned === g ? 'selected' : ''}>${g}</option>`).join('')}
                                    </select>
                                </div>
                                <div>
                                    <label class="block font-bold text-[#1d2d3e] mb-1">الوردية</label>
                                    <select id="edit-user-shift" class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl px-3 py-2 font-bold text-[#1d2d3e]">
                                        <option value="day" ${user.shift === 'day' ? 'selected' : ''}>☀️ وردية النهار</option>
                                        <option value="night" ${user.shift === 'night' ? 'selected' : ''}>🌙 وردية الليل</option>
                                    </select>
                                </div>
                            </div>
                        ` : ''}

                        <div class="flex justify-end gap-2 pt-3 border-t border-[#d7e2ee]">
                            <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="px-4 py-2 sap-btn-secondary text-xs">
                                إلغاء
                            </button>
                            <button type="submit" class="px-6 py-2.5 bg-[#0070f2] hover:bg-[#005bb5] text-white font-bold rounded-xl shadow-md active:scale-95 transition-all">
                                حفظ التعديلات
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    async submitEditUser(event, userId) {
        if (event && event.preventDefault) event.preventDefault();
        const roleSelect = document.getElementById('edit-user-role');
        const role = roleSelect ? roleSelect.value : undefined;
        const name_ar = document.getElementById('edit-user-name-ar').value.trim();
        const name_en = document.getElementById('edit-user-name-en').value.trim() || name_ar;
        const badge_id = document.getElementById('edit-user-badge').value.trim();
        const email = document.getElementById('edit-user-email').value.trim();
        const password = document.getElementById('edit-user-password').value;
        const pin_code = document.getElementById('edit-user-pin') ? document.getElementById('edit-user-pin').value.trim() : '';
        const gate_assigned = document.getElementById('edit-user-gate') ? document.getElementById('edit-user-gate').value : undefined;
        const shift = document.getElementById('edit-user-shift') ? document.getElementById('edit-user-shift').value : undefined;

        const updateData = { name_ar, name_en, badge_id, email };
        if (role) updateData.role = role;
        if (password) updateData.password = password;
        if (pin_code) updateData.pin_code = pin_code;
        if (gate_assigned !== undefined) updateData.gate_assigned = gate_assigned;
        if (shift !== undefined) updateData.shift = shift;

        await window.DB.updateUser(userId, updateData);
        document.getElementById('modal-container').innerHTML = '';
        this.renderDashboard();
        if (window.App && typeof window.App.showToast === 'function') {
            window.App.showToast('✅ تحديث مستخدم', `تم حفظ تعديلات ${name_ar} بنجاح`, 'success');
        }
    }

    handleDeleteUser(userId) {
        const user = window.DB.getUsers().find(u => u.id === userId);
        if (!user) return;

        // CRITICAL SECURITY RULE: CEO account CANNOT be deleted
        if (user.role === 'ceo') {
            alert('حساب الرئيس التنفيذي محمي برمجياً ولا يمكن حذفه نهائياً.');
            return;
        }

        if (confirm(`هل أنت متأكد من رغبتك في حذف حساب "${user.name_ar}" (${user.badge_id})؟`)) {
            try {
                window.DB.deleteUser(userId);
                this.renderDashboard();
                if (window.App && typeof window.App.showToast === 'function') {
                    window.App.showToast('🗑️ حذف مستخدم', `تم حذف حساب ${user.name_ar} بنجاح`, 'danger');
                }
            } catch (err) {
                alert(err.message || 'حدث خطأ أثناء الحذف');
            }
        }
    }
}

// Global Singleton
window.CEO = new CeoController();
