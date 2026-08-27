// ============================================================
// CEO Executive Dashboard & Movement Audit Log Controller
// لوحة القيادة التنفيذية وسجل تدقيق حركات المركبات للمدير التنفيذي
// ============================================================

class CeoController {
    constructor() {
        this.searchQuery = '';
        this.dateFilter = 'all'; // 'today', '7days', '30days', 'all'
        this.gateFilter = 'all';
        this.statusFilter = 'all'; // 'all', 'inside', 'exited', 'overstay', 'denied', 'hold'
    }

    renderDashboard() {
        const container = document.getElementById('main-content');
        if (!container) return;

        const lang = window.i18n.getLang();
        const icon = (name, cls = 'w-4 h-4') => window.Icons ? window.Icons.get(name, cls) : '';
        const movements = window.DB.getExecutiveMovementLogs();
        const settings = window.DB.getSettings();
        const gates = window.DB.getGates();

        // 1. Calculate Executive KPIs
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        const todayMovements = movements.filter(m => m.entry_timestamp && m.entry_timestamp.startsWith(todayStr));
        const insideMovements = movements.filter(m => m.status === 'inside' || m.status === 'overstay');
        const overstayMovements = movements.filter(m => m.status === 'overstay');
        const deniedMovements = movements.filter(m => m.status === 'denied');

        // Completed trips for average turnaround calculation
        const completedTrips = movements.filter(m => m.exit_timestamp && m.duration_minutes > 0);
        const avgTurnaroundMin = completedTrips.length > 0
            ? Math.round(completedTrips.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0) / completedTrips.length)
            : 0;
        const avgHours = (avgTurnaroundMin / 60).toFixed(1);

        container.innerHTML = `
            <div class="space-y-6 pb-12 animate-fadeIn" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                
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
                                    ${lang === 'ar' ? 'الرقابة الشاملة على تدفق الشاحنات، دورة اعتماد التصاريح، ومطابقة بوابات الدخول والخروج' : 'Executive governance for fleet flow, permit approval lifecycle, and gate transit audits'}
                                </p>
                            </div>
                        </div>

                        <!-- Top Action Buttons -->
                        <div class="flex items-center gap-2 flex-wrap w-full md:w-auto">
                            <button type="button" onclick="CEO.exportToCSV()" class="flex-1 md:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-transform hover:-translate-y-0.5 active:scale-95">
                                ${icon('download', 'w-4 h-4 text-white')}
                                <span>${lang === 'ar' ? 'تصدير كشف الحركة (Excel / CSV)' : 'Export to Excel'}</span>
                            </button>
                            <button type="button" onclick="CEO.printExecutiveReport()" class="flex-1 md:flex-none px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95">
                                ${icon('printer', 'w-4 h-4 text-white')}
                                <span>${lang === 'ar' ? 'طباعة تقرير الإدارة A4' : 'Print PDF Report'}</span>
                            </button>
                            <button type="button" onclick="CEO.renderDashboard()" class="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-all" title="تحديث حي">
                                ${icon('refresh', 'w-4 h-4 text-white')}
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Executive Top 5 KPIs -->
                <div class="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
                    
                    <!-- KPI 1: Inside Factory -->
                    <div class="sap-card p-4 bg-white rounded-2xl border border-[#b0cfee] shadow-sm relative overflow-hidden">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-bold text-[#556b82]">${lang === 'ar' ? 'مركبات داخل المصنع حالياً' : 'Currently Inside'}</span>
                            <div class="w-8 h-8 rounded-xl bg-emerald-50 text-[#107e3e] flex items-center justify-center font-bold">
                                🟢
                            </div>
                        </div>
                        <div class="mt-2 flex items-baseline gap-2">
                            <span class="text-3xl font-black text-[#1d2d3e] font-mono">${insideMovements.length}</span>
                            <span class="text-xs text-[#107e3e] font-bold">${lang === 'ar' ? 'شاحنة نشطة' : 'trucks'}</span>
                        </div>
                        <div class="mt-1 text-[11px] text-[#556b82] font-semibold">${lang === 'ar' ? 'تتواجد في مناطق التحميل والتفريغ' : 'In dispatch / warehouse'}</div>
                    </div>

                    <!-- KPI 2: Today Total Movements -->
                    <div class="sap-card p-4 bg-white rounded-2xl border border-[#b0cfee] shadow-sm">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-bold text-[#556b82]">${lang === 'ar' ? 'حركات اليوم (دخول / خروج)' : "Today's Movements"}</span>
                            <div class="w-8 h-8 rounded-xl bg-blue-50 text-[#0070f2] flex items-center justify-center font-bold">
                                📊
                            </div>
                        </div>
                        <div class="mt-2 flex items-baseline gap-2">
                            <span class="text-3xl font-black text-[#002b66] font-mono">${todayMovements.length}</span>
                            <span class="text-xs text-[#0070f2] font-bold">${lang === 'ar' ? 'حركة مسجلة' : 'records'}</span>
                        </div>
                        <div class="mt-1 text-[11px] text-[#556b82] font-semibold">${lang === 'ar' ? 'إجمالي الدخول والخروج اليوم' : 'Total 24h volume'}</div>
                    </div>

                    <!-- KPI 3: Average Turnaround Time -->
                    <div class="sap-card p-4 bg-white rounded-2xl border border-[#b0cfee] shadow-sm">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-bold text-[#556b82]">${lang === 'ar' ? 'متوسط زمن المكوث والتفريغ' : 'Avg Turnaround'}</span>
                            <div class="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                                ⏱️
                            </div>
                        </div>
                        <div class="mt-2 flex items-baseline gap-2">
                            <span class="text-3xl font-black text-[#1d2d3e] font-mono">${avgTurnaroundMin}</span>
                            <span class="text-xs text-purple-700 font-bold">${lang === 'ar' ? 'دقيقة' : 'min'} (${avgHours} س)</span>
                        </div>
                        <div class="mt-1 text-[11px] text-[#556b82] font-semibold">${lang === 'ar' ? 'معدل الدورة للشاحنة المكتملة' : 'Completed cycle average'}</div>
                    </div>

                    <!-- KPI 4: Overstay Alerts -->
                    <div class="sap-card p-4 bg-white rounded-2xl border border-[#b0cfee] shadow-sm">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-bold text-[#556b82]">${lang === 'ar' ? 'تجاوز زمن المكوث (>3 ساعات)' : 'Overstay Alerts'}</span>
                            <div class="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                                ⚠️
                            </div>
                        </div>
                        <div class="mt-2 flex items-baseline gap-2">
                            <span class="text-3xl font-black ${overstayMovements.length > 0 ? 'text-[#bb0000]' : 'text-emerald-700'} font-mono">${overstayMovements.length}</span>
                            <span class="text-xs font-bold ${overstayMovements.length > 0 ? 'text-red-600' : 'text-emerald-700'}">${lang === 'ar' ? 'تنبيه تأخير' : 'alerts'}</span>
                        </div>
                        <div class="mt-1 text-[11px] text-[#556b82] font-semibold">${lang === 'ar' ? 'تتطلب متابعة من المشرفين' : 'Requires dispatch check'}</div>
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
                            <input type="text" id="ceo-search-input" value="${this.searchQuery}" oninput="CEO.handleSearch(this.value)" placeholder="${lang === 'ar' ? 'بحث شامل (رقم اللوحة، كود التصريح، السائق، الشركة، البوابة، المنشئ، المعتمد)...' : 'Search by plate, permit, driver, company, gate, creator, approver...'}" class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl ${lang === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 text-xs text-[#1d2d3e] font-bold focus:border-[#0070f2] focus:bg-white focus:outline-none shadow-inner" />
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
                                    <th class="py-3.5 px-4">${lang === 'ar' ? 'لوحة الشاحنة ونوعها' : 'Plate & Type'}</th>
                                    <th class="py-3.5 px-4">${lang === 'ar' ? 'الوجهة والحمولة بالمصنع' : 'Destination & Cargo'}</th>
                                    <th class="py-3.5 px-4">${lang === 'ar' ? 'منشئ ومعتمد التصريح' : 'Created By & Approved By'}</th>
                                    <th class="py-3.5 px-4">${lang === 'ar' ? 'حركة الدخول (البوابة • التوقيت • الضابط)' : 'Entry Movement'}</th>
                                    <th class="py-3.5 px-4">${lang === 'ar' ? 'حركة الخروج (البوابة • التوقيت • الضابط)' : 'Exit Movement'}</th>
                                    <th class="py-3.5 px-4">${lang === 'ar' ? 'المدة والحالة' : 'Duration & Status'}</th>
                                    <th class="py-3.5 px-4 text-center">${lang === 'ar' ? 'التتبع والرحلة' : 'Timeline'}</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-[#e7eff7] bg-white">
                                ${this.renderAuditRows(lang)}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    renderAuditRows(lang) {
        const icon = (name, cls = 'w-3.5 h-3.5') => window.Icons ? window.Icons.get(name, cls) : '';
        let movements = window.DB.getExecutiveMovementLogs();
        const q = (this.searchQuery || '').trim().toLowerCase();

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
        if (q) {
            movements = movements.filter(m => {
                const matchPlate = (m.vehicle.plate_ar || '').includes(q) || (m.vehicle.plate_en || '').toLowerCase().includes(q);
                const matchDriver = (m.vehicle.driver_name_ar || '').includes(q) || (m.vehicle.company_ar || '').includes(q);
                const matchPermit = m.permit && ((m.permit.permit_code || '').toLowerCase().includes(q) || (m.permit.pin_code || '').includes(q));
                const matchCreator = (m.created_by_name || '').toLowerCase().includes(q);
                const matchApprover = (m.approved_by_name || '').toLowerCase().includes(q);
                const matchEntryOfficer = (m.entry_officer_name || '').toLowerCase().includes(q);
                const matchExitOfficer = (m.exit_officer_name || '').toLowerCase().includes(q);
                const matchGate = (m.entry_gate || '').includes(q) || (m.exit_gate || '').includes(q);
                const matchDest = (m.destination_ar || '').includes(q);

                return matchPlate || matchDriver || matchPermit || matchCreator || matchApprover || matchEntryOfficer || matchExitOfficer || matchGate || matchDest;
            });
        }

        if (movements.length === 0) {
            return `
                <tr>
                    <td colspan="7" class="text-center py-12 text-[#556b82]">
                        <div class="w-14 h-14 rounded-2xl bg-[#ebf3fb] text-[#0070f2] flex items-center justify-center mx-auto mb-3 border border-[#b3d5fa]">
                            ${icon('truck', 'w-7 h-7')}
                        </div>
                        <p class="font-black text-base text-[#1d2d3e]">
                            ${lang === 'ar' ? 'لا توجد سجلات تطابق شروط البحث والفلاتر المحددة' : 'No records match the selected audit criteria'}
                        </p>
                    </td>
                </tr>
            `;
        }

        return movements.map(m => {
            const entryDate = new Date(m.entry_timestamp).toLocaleDateString();
            const entryTime = new Date(m.entry_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            let exitHtml = '';
            if (m.exit_timestamp) {
                const exitDate = new Date(m.exit_timestamp).toLocaleDateString();
                const exitTime = new Date(m.exit_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                exitHtml = `
                    <div class="inline-flex items-center gap-1 font-bold text-xs text-[#002b66] bg-[#ebf3fb] px-2 py-0.5 rounded-lg border border-[#b3d5fa] mb-1">
                        <span>🚪</span>
                        <span>${m.exit_gate}</span>
                    </div>
                    <div class="text-[#0070f2] font-bold text-[11px]">📤 ${exitDate} • ${exitTime}</div>
                    <div class="text-[10px] text-[#556b82]">👮 ${m.exit_officer_name}</div>
                `;
            } else {
                exitHtml = `
                    <span class="px-2.5 py-1 rounded-full text-[11px] bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 inline-flex items-center gap-1">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>لم تغادر بعد (بالداخل)</span>
                    </span>
                `;
            }

            let statusTag = '';
            if (m.status === 'inside') {
                statusTag = `<span class="px-2.5 py-1 rounded-full text-xs bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 flex items-center gap-1 w-fit"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> <span>داخل المنشأة</span></span>`;
            } else if (m.status === 'overstay') {
                statusTag = `<span class="px-2.5 py-1 rounded-full text-xs bg-red-100 text-red-800 font-bold border border-red-300 flex items-center gap-1 w-fit">⚠️ <span>تجاوز مدة المكوث</span></span>`;
            } else if (m.status === 'denied') {
                statusTag = `<span class="px-2.5 py-1 rounded-full text-xs bg-red-600 text-white font-bold flex items-center gap-1 w-fit">⛔ <span>منع أمني</span></span>`;
            } else if (m.status === 'hold') {
                statusTag = `<span class="px-2.5 py-1 rounded-full text-xs bg-amber-100 text-amber-900 font-bold border border-amber-300 flex items-center gap-1 w-fit">⏸️ <span>معلق بقرار الإدارة</span></span>`;
            } else {
                statusTag = `<span class="px-2.5 py-1 rounded-full text-xs bg-slate-100 text-slate-700 font-bold border border-slate-300 flex items-center gap-1 w-fit"><span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span> <span>غادرت المصنع</span></span>`;
            }

            return `
                <tr class="sap-table-row hover:bg-[#f5f8fc] transition-colors ${m.status === 'overstay' ? 'bg-red-50/30' : ''}">
                    
                    <!-- 1. Plate & Driver -->
                    <td class="py-3.5 px-4">
                        ${window.ArabicPlate.renderEgyptianPlate(m.vehicle.plate_ar, 'compact', m.vehicle.vehicle_type)}
                        <div class="font-bold text-[#1d2d3e] text-xs mt-1.5">${m.vehicle.driver_name_ar}</div>
                        <div class="text-[11px] text-[#556b82] font-semibold">${m.vehicle.company_ar}</div>
                        ${m.vehicle.driver_phone ? `
                            <a href="https://wa.me/2${m.vehicle.driver_phone.replace(/\D/g, '')}" target="_blank" class="inline-flex items-center gap-1 text-[11px] text-[#107e3e] font-mono font-bold hover:underline mt-0.5">
                                <span>📱 ${m.vehicle.driver_phone}</span>
                            </a>
                        ` : ''}
                    </td>

                    <!-- 2. Destination & Cargo -->
                    <td class="py-3.5 px-4">
                        <div class="flex flex-col gap-1">
                            <span class="text-xs font-black text-[#002b66] flex items-center gap-1">
                                <span>📍</span>
                                <span>${m.destination_ar}</span>
                            </span>
                            <span class="text-[11px] text-[#556b82] font-semibold">📦 ${m.cargo_details}</span>
                            ${m.invoice_no ? `<span class="text-[11px] text-[#107e3e] font-mono font-bold">📄 إذن: ${m.invoice_no}</span>` : ''}
                            ${m.permit ? `<div class="text-[10px] text-[#0070f2] font-mono font-bold mt-1">🎫 كود: ${m.permit.permit_code} (PIN: ${m.permit.pin_code})</div>` : ''}
                        </div>
                    </td>

                    <!-- 3. Creator & Approver (Who created & Who approved) -->
                    <td class="py-3.5 px-4">
                        <div class="space-y-1.5">
                            <div class="bg-[#f8fafc] p-2 rounded-xl border border-[#e7eff7]">
                                <div class="text-[10px] text-[#556b82] font-bold flex items-center gap-1">
                                    <span>📝</span>
                                    <span>منشئ التصريح:</span>
                                </div>
                                <div class="text-xs font-bold text-[#1d2d3e]">${m.created_by_name}</div>
                            </div>
                            <div class="bg-[#f0fdf4] p-2 rounded-xl border border-[#b4e3c4]">
                                <div class="text-[10px] text-[#107e3e] font-bold flex items-center gap-1">
                                    <span>🛡️</span>
                                    <span>معتمد التصريح:</span>
                                </div>
                                <div class="text-xs font-black text-[#002b66]">${m.approved_by_name}</div>
                            </div>
                        </div>
                    </td>

                    <!-- 4. Entry Movement -->
                    <td class="py-3.5 px-4 text-xs font-mono">
                        <div class="inline-flex items-center gap-1 font-bold text-xs text-[#002b66] bg-[#ebf3fb] px-2 py-0.5 rounded-lg border border-[#b3d5fa] mb-1">
                            <span>🚪</span>
                            <span>${m.entry_gate}</span>
                        </div>
                        <div class="text-[#107e3e] font-bold text-[11px]">📥 ${entryDate} • ${entryTime}</div>
                        <div class="text-[10px] text-[#556b82]">👮 ${m.entry_officer_name}</div>
                    </td>

                    <!-- 5. Exit Movement -->
                    <td class="py-3.5 px-4 text-xs font-mono">
                        ${exitHtml}
                    </td>

                    <!-- 6. Total Duration & Status -->
                    <td class="py-3.5 px-4">
                        <div class="flex flex-col gap-1.5">
                            ${statusTag}
                            <div class="text-xs font-mono font-black ${m.status === 'overstay' ? 'text-red-700' : 'text-[#107e3e]'} flex items-center gap-1">
                                <span>⏱️</span>
                                <span>${m.duration_minutes} دقيقة (${m.duration_hours} س)</span>
                            </div>
                        </div>
                    </td>

                    <!-- 7. Actions: Timeline Modal -->
                    <td class="py-3.5 px-4 text-center">
                        <div class="flex items-center justify-center gap-1.5">
                            <button type="button" onclick="CEO.showJourneyTimeline(${m.id})" title="عرض المسار الزمني التفصيلي للرحلة" class="px-3 py-1.5 bg-[#002b66] hover:bg-[#001940] text-white rounded-xl text-xs font-bold inline-flex items-center gap-1 shadow-sm active:scale-95 transition-all">
                                <span>🕒</span>
                                <span>الرحلة</span>
                            </button>
                            ${m.permit ? `
                                <button type="button" onclick="Manager.showPassModal(${m.permit.id})" title="عرض كارت التصريح المعتمد" class="p-1.5 bg-[#ebf3fb] hover:bg-[#d5e7fa] text-[#0070f2] rounded-xl border border-[#b3d5fa] text-xs font-bold shadow-sm">
                                    ${icon('qrcode', 'w-3.5 h-3.5')}
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    handleSearch(query) {
        this.searchQuery = query;
        const tbody = document.querySelector('tbody');
        if (tbody) tbody.innerHTML = this.renderAuditRows(window.i18n.getLang());
    }

    setDateFilter(filter) {
        this.dateFilter = filter;
        this.renderDashboard();
    }

    setGateFilter(gate) {
        this.gateFilter = gate;
        this.renderDashboard();
    }

    setStatusFilter(status) {
        this.statusFilter = status;
        this.renderDashboard();
    }

    /**
     * Complete Vehicle Journey Timeline Modal
     */
    showJourneyTimeline(logId) {
        const movements = window.DB.getExecutiveMovementLogs();
        const m = movements.find(item => item.id === logId);
        if (!m) return;

        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) return;
        const lang = window.i18n.getLang();
        const icon = (name, cls = 'w-4 h-4') => window.Icons ? window.Icons.get(name, cls) : '';

        const entryDate = new Date(m.entry_timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
        const exitDate = m.exit_timestamp ? new Date(m.exit_timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : null;

        modalContainer.innerHTML = `
            <div class="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
                <div class="sap-panel w-full max-w-xl rounded-3xl border-2 border-[#002b66] shadow-2xl p-6 relative animate-scaleUp bg-white text-right" dir="rtl">
                    
                    <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="absolute top-4 left-4 text-[#556b82] hover:text-[#1d2d3e] text-xl font-bold">
                        ✕
                    </button>

                    <!-- Header -->
                    <div class="flex items-center gap-3 border-b border-[#d7e2ee] pb-4 mb-4">
                        <div class="w-12 h-12 rounded-2xl bg-[#002b66] text-amber-300 flex items-center justify-center font-bold text-xl shadow-md">
                            🕒
                        </div>
                        <div>
                            <h3 class="text-lg font-black text-[#002b66]">المسار الزمني الكامل لرحلة الشاحنة</h3>
                            <p class="text-xs text-[#556b82] font-semibold">توثيق تسلسل الموافقات وحركات الدخول والخروج والضباط المسؤولين</p>
                        </div>
                    </div>

                    <!-- Plate & Vehicle Summary -->
                    <div class="flex justify-center mb-5">
                        ${window.ArabicPlate.renderEgyptianPlate(m.vehicle.plate_ar, 'normal', m.vehicle.vehicle_type)}
                    </div>

                    <!-- Step-by-Step Chronological Timeline -->
                    <div class="relative border-r-2 border-[#0070f2] pr-6 mr-3 space-y-6 text-xs">
                        
                        <!-- Step 1: Permit Creation -->
                        <div class="relative">
                            <div class="absolute -right-[31px] top-0 w-6 h-6 rounded-full bg-[#ebf3fb] border-2 border-[#0070f2] text-[#0070f2] flex items-center justify-center font-black text-xs">
                                1
                            </div>
                            <div class="bg-[#f8fafc] p-3 rounded-2xl border border-[#d7e2ee]">
                                <div class="flex items-center justify-between mb-1">
                                    <span class="font-black text-[#002b66] text-sm">📝 إصدار طلب التصريح</span>
                                    <span class="text-xs font-mono font-bold text-[#0070f2]">${m.permit ? m.permit.permit_code : 'تصريح فوري'}</span>
                                </div>
                                <div class="text-[#556b82]">
                                    قام بإنشاء الطلب: <b class="text-[#1d2d3e]">${m.created_by_name}</b>
                                </div>
                                <div class="text-[11px] text-[#556b82] mt-0.5">
                                    الوجهة المحددة: <b class="text-[#002b66]">📍 ${m.destination_ar}</b> • الحمولة: ${m.cargo_details}
                                </div>
                            </div>
                        </div>

                        <!-- Step 2: Permit Approval -->
                        <div class="relative">
                            <div class="absolute -right-[31px] top-0 w-6 h-6 rounded-full bg-emerald-100 border-2 border-[#107e3e] text-[#107e3e] flex items-center justify-center font-black text-xs">
                                2
                            </div>
                            <div class="bg-[#f0fdf4] p-3 rounded-2xl border border-[#b4e3c4]">
                                <div class="flex items-center justify-between mb-1">
                                    <span class="font-black text-[#107e3e] text-sm">🛡️ اعتماد التصريح والرمز السري</span>
                                    <span class="bg-white px-2 py-0.5 rounded font-mono font-black text-emerald-900 border border-emerald-200">PIN: ${m.permit?.pin_code || '—'}</span>
                                </div>
                                <div class="text-[#556b82]">
                                    تم الاعتماد والموافقة بواسطة: <b class="text-[#002b66]">${m.approved_by_name}</b>
                                </div>
                                <div class="text-[11px] text-[#107e3e] font-bold mt-0.5">
                                    الحالة: تصريح سارٍ وصالح للدخول
                                </div>
                            </div>
                        </div>

                        <!-- Step 3: Gate Entry -->
                        <div class="relative">
                            <div class="absolute -right-[31px] top-0 w-6 h-6 rounded-full bg-blue-100 border-2 border-[#0070f2] text-[#0070f2] flex items-center justify-center font-black text-xs">
                                3
                            </div>
                            <div class="bg-[#ebf3fb] p-3 rounded-2xl border border-[#b3d5fa]">
                                <div class="flex items-center justify-between mb-1">
                                    <span class="font-black text-[#0070f2] text-sm">📥 تسجيل الدخول للبوابة</span>
                                    <span class="font-mono font-bold text-[#002b66]">⏰ ${entryDate}</span>
                                </div>
                                <div class="text-[#556b82]">
                                    عبر بوابة: <b class="text-[#002b66]">🚪 ${m.entry_gate}</b>
                                </div>
                                <div class="text-[#556b82] mt-0.5">
                                    ضابط أمن الدخول: <b class="text-[#1d2d3e]">👮 ${m.entry_officer_name}</b>
                                </div>
                            </div>
                        </div>

                        <!-- Step 4: Factory Destination & Unloading -->
                        <div class="relative">
                            <div class="absolute -right-[31px] top-0 w-6 h-6 rounded-full bg-amber-100 border-2 border-amber-500 text-amber-900 flex items-center justify-center font-black text-xs">
                                4
                            </div>
                            <div class="bg-amber-50/60 p-3 rounded-2xl border border-amber-200">
                                <span class="font-black text-amber-900 text-sm">🏭 التواجد والتفريغ / الشحن بالمصنع</span>
                                <div class="text-amber-900 mt-1">
                                    الموقع: <b class="text-[#002b66]">📍 ${m.destination_ar}</b>
                                </div>
                                ${m.invoice_no ? `<div class="text-emerald-800 font-mono font-bold mt-0.5">📄 إذن الصرف / الفاتورة: ${m.invoice_no}</div>` : ''}
                            </div>
                        </div>

                        <!-- Step 5: Gate Exit -->
                        <div class="relative">
                            <div class="absolute -right-[31px] top-0 w-6 h-6 rounded-full ${m.exit_timestamp ? 'bg-purple-100 border-2 border-purple-600 text-purple-700' : 'bg-slate-100 border-2 border-slate-400 text-slate-600'} flex items-center justify-center font-black text-xs">
                                5
                            </div>
                            <div class="${m.exit_timestamp ? 'bg-purple-50/60 border-purple-200' : 'bg-slate-50 border-slate-200'} p-3 rounded-2xl border">
                                <div class="flex items-center justify-between mb-1">
                                    <span class="font-black ${m.exit_timestamp ? 'text-purple-900' : 'text-slate-700'} text-sm">📤 تسجيل الخروج النهائي</span>
                                    <span class="font-mono font-bold text-purple-900">${exitDate || 'قيد التواجد حالياً'}</span>
                                </div>
                                ${m.exit_timestamp ? `
                                    <div class="text-[#556b82]">
                                        عبر بوابة: <b class="text-[#002b66]">🚪 ${m.exit_gate}</b>
                                    </div>
                                    <div class="text-[#556b82] mt-0.5">
                                        ضابط أمن الخروج: <b class="text-[#1d2d3e]">👮 ${m.exit_officer_name}</b>
                                    </div>
                                    <div class="mt-1 font-mono font-black text-[#107e3e]">
                                        ⏱️ إجمالي مدة التواجد بالمصنع: ${m.duration_minutes} دقيقة (${m.duration_hours} ساعة)
                                    </div>
                                ` : `
                                    <div class="text-emerald-700 font-bold mt-1">
                                        ⏱️ المركبة لا تزال متواجدة داخل المصنع منذ (${m.duration_minutes} دقيقة)
                                    </div>
                                `}
                            </div>
                        </div>
                    </div>

                    <!-- Footer Action -->
                    <div class="mt-6 pt-3 border-t border-[#d7e2ee] flex justify-end">
                        <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="px-6 py-2.5 sap-btn-primary text-xs font-bold">
                            إغلاق النافذة
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Export Full Audit Movement Logs to Excel CSV
     */
    exportToCSV() {
        const movements = window.DB.getExecutiveMovementLogs();
        if (movements.length === 0) {
            alert('لا توجد سجلات لتصديرها');
            return;
        }

        const headers = [
            'رقم الحركة',
            'رقم اللوحة عربي',
            'رقم اللوحة إنجليزي',
            'نوع المركبة',
            'اسم السائق',
            'هاتف السائق',
            'الشركة الموردة',
            'كود التصريح',
            'رمز PIN',
            'منشئ التصريح',
            'معتمد التصريح',
            'الوجهة داخل المصنع',
            'تفاصيل الحمولة',
            'رقم إذن الصرف أو الفاتورة',
            'بوابة الدخول',
            'تاريخ ووقت الدخول',
            'ضابط أمن الدخول',
            'بوابة الخروج',
            'تاريخ ووقت الخروج',
            'ضابط أمن الخروج',
            'مدة التواجد بالدقائق',
            'حالة الحركة'
        ];

        const rows = movements.map(m => [
            m.id,
            `"${m.vehicle.plate_ar || ''}"`,
            `"${m.vehicle.plate_en || ''}"`,
            `"${m.vehicle.vehicle_type || ''}"`,
            `"${m.vehicle.driver_name_ar || ''}"`,
            `"${m.vehicle.driver_phone || ''}"`,
            `"${m.vehicle.company_ar || ''}"`,
            `"${m.permit ? m.permit.permit_code : ''}"`,
            `"${m.permit ? m.permit.pin_code : ''}"`,
            `"${m.created_by_name || ''}"`,
            `"${m.approved_by_name || ''}"`,
            `"${m.destination_ar || ''}"`,
            `"${m.cargo_details || ''}"`,
            `"${m.invoice_no || ''}"`,
            `"${m.entry_gate || ''}"`,
            `"${m.entry_timestamp || ''}"`,
            `"${m.entry_officer_name || ''}"`,
            `"${m.exit_gate || ''}"`,
            `"${m.exit_timestamp || ''}"`,
            `"${m.exit_officer_name || ''}"`,
            m.duration_minutes || 0,
            `"${m.status || ''}"`
        ]);

        const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `DOTRA_Executive_Movement_Audit_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Print Executive Clean Report
     */
    printExecutiveReport() {
        const oldTitle = document.title;
        document.title = `DOTRA_Executive_Audit_Report_${new Date().toISOString().split('T')[0]}`;
        window.print();
        document.title = oldTitle;
    }
}

// Global Singleton
window.CEO = new CeoController();
