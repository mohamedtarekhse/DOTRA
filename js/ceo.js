// ============================================================
// CEO Executive Dashboard & Movement Audit Log Controller
// لوحة القيادة التنفيذية وسجل تدقيق حركات المركبات للمدير التنفيذي
// ============================================================

class CeoController {
    constructor() {
        this.activeTab = 'movements'; // 'movements' | 'users'
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
                            <button type="button" onclick="CEO.exportToExcel()" class="flex-1 md:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-transform hover:-translate-y-0.5 active:scale-95">
                                ${icon('download', 'w-4 h-4 text-white')}
                                <span>${lang === 'ar' ? 'تصدير شيت إكسل (Excel .xls)' : 'Export to Excel (.xls)'}</span>
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

                <!-- CEO Navigation Tabs: Movement Audit vs. User Management -->
                <div class="grid grid-cols-2 gap-2 bg-[#f0f4f8] p-1.5 rounded-2xl border border-[#d7e2ee] text-xs font-bold shadow-sm">
                    <button type="button" onclick="CEO.switchTab('movements')" class="py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${this.activeTab === 'movements' ? 'bg-[#002b66] text-white shadow-md font-black' : 'text-[#556b82] hover:text-[#002b66]'}">
                        <span>📊</span>
                        <span>${lang === 'ar' ? 'سجل تدقيق حركات وتدفق المركبات (Movement Audit)' : 'Movement Audit & Fleet Analytics'}</span>
                    </button>
                    <button type="button" onclick="CEO.switchTab('users')" class="py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${this.activeTab === 'users' ? 'bg-[#002b66] text-white shadow-md font-black' : 'text-[#556b82] hover:text-[#002b66]'}">
                        <span>👥</span>
                        <span>${lang === 'ar' ? `إدارة المستخدمين والصلاحيات (${users.length})` : `User & Role Management (${users.length})`}</span>
                    </button>
                </div>

                ${this.activeTab === 'users' ? this.renderUsersTab(lang, icon) : `
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
                            <tbody id="ceo-audit-table-body" class="divide-y divide-[#e7eff7] bg-white">
                                ${this.renderAuditRows(lang)}
                            </tbody>
                        </table>
                    </div>
                </div>
                `}
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
                    <div class="text-[11px] text-amber-900 font-semibold">${lang === 'ar' ? 'محمية برمجياً من الحذف' : 'Protected by system security rule'}</div>
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
                            ${lang === 'ar' ? 'إضافة وتعديل حسابات مدراء العمليات وضباط البوابات مع الحماية الصارمة لحساب الرئيس التنفيذي' : 'Manage manager and officer credentials with strict CEO account protection'}
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
                                حفظ وإنشاء الحساب
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
        const pin_code = document.getElementById('new-user-pin') ? document.getElementById('new-user-pin').value.trim() : '';
        const gate_assigned = document.getElementById('new-user-gate') ? document.getElementById('new-user-gate').value : '';
        const shift = document.getElementById('new-user-shift') ? document.getElementById('new-user-shift').value : 'day';

        await window.DB.addUser({
            role,
            name_ar,
            name_en,
            badge_id,
            email,
            password,
            pin_code,
            gate_assigned,
            shift
        });

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
                const matchDriver = norm(m.vehicle?.driver_name_ar).includes(qNorm) || norm(m.vehicle?.driver_name_en).includes(qNorm) || norm(m.vehicle?.company_ar).includes(qNorm) || norm(m.vehicle?.driver_phone).includes(qNorm);
                const matchPermit = m.permit && (norm(m.permit.permit_code).includes(qNorm) || norm(m.permit.pin_code).includes(qNorm) || norm(m.permit.invoice_no).includes(qNorm) || norm(m.permit.cargo_details).includes(qNorm));
                const matchCreator = norm(m.created_by_name).includes(qNorm);
                const matchApprover = norm(m.approved_by_name).includes(qNorm);
                const matchEntryOfficer = norm(m.entry_officer_name).includes(qNorm);
                const matchExitOfficer = norm(m.exit_officer_name).includes(qNorm);
                const matchGate = norm(m.entry_gate).includes(qNorm) || norm(m.exit_gate).includes(qNorm);
                const matchDest = norm(m.destination_ar).includes(qNorm) || norm(m.destination_en).includes(qNorm);

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
        this.searchQuery = query || '';
        const tbody = document.getElementById('ceo-audit-table-body') || (document.querySelector ? document.querySelector('tbody') : null);
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
            <div class="sap-modal-overlay fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onclick="if(event.target === this) document.getElementById('modal-container').innerHTML = ''">
                <div class="sap-modal-content bg-white rounded-3xl w-full max-w-xl border-2 border-[#002b66] shadow-2xl p-6 relative animate-scaleUp max-h-[92vh] overflow-y-auto text-right" dir="rtl">
                    
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
     * Export Full Audit Movement Logs to Native Excel Spreadsheet (.xls in separate cells)
     */
    exportToExcel() {
        const movements = window.DB.getExecutiveMovementLogs();
        if (movements.length === 0) {
            alert('لا توجد سجلات لتصديرها');
            return;
        }

        const headers = [
            'م',
            'رقم الحركة',
            'رقم اللوحة (عربي)',
            'رقم اللوحة (EN)',
            'نوع الشاحنة',
            'اسم السائق',
            'هاتف السائق',
            'الشركة الموردة',
            'كود التصريح',
            'رمز PIN',
            'منشئ التصريح',
            'معتمد التصريح',
            'الوجهة داخل المصنع',
            'تفاصيل الحمولة',
            'رقم إذن الصرف / الفاتورة',
            'بوابة الدخول',
            'تاريخ ووقت الدخول',
            'ضابط أمن الدخول',
            'بوابة الخروج',
            'تاريخ ووقت الخروج',
            'ضابط أمن الخروج',
            'مدة التواجد (دقيقة)',
            'مدة التواجد (ساعة)',
            'حالة الحركة'
        ];

        let tableRowsHtml = movements.map((m, idx) => {
            const entryFormatted = m.entry_timestamp ? new Date(m.entry_timestamp).toLocaleString('ar-EG') : '--';
            const exitFormatted = m.exit_timestamp ? new Date(m.exit_timestamp).toLocaleString('ar-EG') : '--';
            
            let statusText = 'غادرت المصنع';
            let statusClass = 'status-exited';
            if (m.status === 'inside') { statusText = 'داخل المصنع'; statusClass = 'status-inside'; }
            else if (m.status === 'overstay') { statusText = 'متجاوز للمدة'; statusClass = 'status-overstay'; }
            else if (m.status === 'denied') { statusText = 'ممنوعة / مرفوضة'; statusClass = 'status-denied'; }
            else if (m.status === 'hold') { statusText = 'تصريح معلق'; statusClass = 'status-hold'; }

            return `
                <tr>
                    <td style="text-align:center;">${idx + 1}</td>
                    <td style="text-align:center;font-weight:bold;">${m.id}</td>
                    <td style="text-align:center;font-weight:bold;color:#002b66;mso-number-format:'\\@';">${m.vehicle.plate_ar || ''}</td>
                    <td style="text-align:center;font-family:monospace;mso-number-format:'\\@';">${m.vehicle.plate_en || ''}</td>
                    <td style="text-align:center;">${m.vehicle.vehicle_type || 'نقل'}</td>
                    <td style="font-weight:bold;">${m.vehicle.driver_name_ar || ''}</td>
                    <td style="mso-number-format:'\\@';text-align:center;">${m.vehicle.driver_phone || ''}</td>
                    <td>${m.vehicle.company_ar || ''}</td>
                    <td style="font-family:monospace;font-weight:bold;color:#0070f2;mso-number-format:'\\@';">${m.permit ? m.permit.permit_code : 'تصريح فوري'}</td>
                    <td style="font-family:monospace;font-weight:bold;color:#b85500;text-align:center;mso-number-format:'\\@';">${m.permit ? m.permit.pin_code : '--'}</td>
                    <td>${m.created_by_name || 'إدارة العمليات'}</td>
                    <td>${m.approved_by_name || 'مدير العمليات'}</td>
                    <td style="font-weight:bold;color:#002b66;">${m.destination_ar || ''}</td>
                    <td>${m.cargo_details || ''}</td>
                    <td style="mso-number-format:'\\@';">${m.invoice_no || ''}</td>
                    <td style="font-weight:bold;">${m.entry_gate || ''}</td>
                    <td style="mso-number-format:'\\@';text-align:center;">${entryFormatted}</td>
                    <td>${m.entry_officer_name || ''}</td>
                    <td style="font-weight:bold;">${m.exit_gate || '--'}</td>
                    <td style="mso-number-format:'\\@';text-align:center;">${exitFormatted}</td>
                    <td>${m.exit_officer_name || '--'}</td>
                    <td style="text-align:center;font-weight:bold;">${m.duration_minutes || 0}</td>
                    <td style="text-align:center;font-weight:bold;">${m.duration_hours || '0.0'}</td>
                    <td class="${statusClass}" style="text-align:center;font-weight:bold;">${statusText}</td>
                </tr>
            `;
        }).join('');

        const excelHtml = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <!--[if gte mso 9]>
                <xml>
                    <x:ExcelWorkbook>
                        <x:ExcelWorksheets>
                            <x:ExcelWorksheet>
                                <x:Name>سجل حركات الشاحنات</x:Name>
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
                    .status-inside { background-color: #e5f6eb; color: #107e3e; }
                    .status-exited { background-color: #ebf3fb; color: #0070f2; }
                    .status-overstay { background-color: #ffebeb; color: #bb0000; }
                    .status-denied { background-color: #ffebeb; color: #bb0000; }
                    .status-hold { background-color: #fff1e5; color: #b85500; }
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
                        ${tableRowsHtml}
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
                a.download = `DOTRA_Executive_Movement_Audit_${new Date().toISOString().split('T')[0]}.xls`;
                if (document.body && typeof document.body.appendChild === 'function') {
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                } else {
                    a.click();
                }
                URL.revokeObjectURL(url);
            } catch (err) {
                console.error('Excel download error:', err);
            }
        }
        return excelHtml;
    }

    exportToCSV() {
        return this.exportToExcel();
    }

    /**
     * Print Executive Clean Report (PDF & Hardcopy Output)
     */
    printExecutiveReport() {
        const movements = window.DB.getExecutiveMovementLogs();
        const lang = window.i18n ? window.i18n.getLang() : 'ar';
        const now = new Date();
        const printDateStr = now.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const printTimeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

        const insideCount = movements.filter(m => m.status === 'inside').length;
        const exitedCount = movements.filter(m => m.status === 'exited').length;
        const overstayCount = movements.filter(m => m.status === 'overstay').length;
        const totalCount = movements.length;

        let reportContainer = document.getElementById('printable-report-container');
        if (!reportContainer && typeof document !== 'undefined') {
            reportContainer = document.createElement('div');
            reportContainer.id = 'printable-report-container';
            if (document.body && typeof document.body.appendChild === 'function') {
                document.body.appendChild(reportContainer);
            }
        }

        if (reportContainer) {
            reportContainer.innerHTML = `
                <div class="p-6 bg-white text-[#1d2d3e] font-sans" dir="rtl">
                    <!-- Letterhead Header -->
                    <div class="flex items-center justify-between border-b-2 border-[#002b66] pb-4 mb-4">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 rounded-xl bg-[#002b66] text-amber-300 flex items-center justify-center font-black text-2xl border border-[#001940]">
                                🌿
                            </div>
                            <div>
                                <h1 class="text-lg font-black text-[#002b66]">شركة دوترا للتجارة والصناعة (DOTRA)</h1>
                                <h2 class="text-xs font-bold text-[#556b82]">تقرير الرقابة التنفيذية الشامل لحركة الشاحنات والتصاريح</h2>
                            </div>
                        </div>
                        <div class="text-left text-[11px] font-mono">
                            <div class="font-bold text-[#002b66]">نظام بوابات المصانع الذكي</div>
                            <div class="text-[#556b82] mt-0.5">${printDateStr}</div>
                            <div class="text-[#556b82]">${printTimeStr}</div>
                        </div>
                    </div>

                    <!-- Executive KPI Mini Strip -->
                    <div class="grid grid-cols-4 gap-3 mb-4 text-center">
                        <div class="p-2 rounded-xl bg-slate-50 border border-slate-200">
                            <div class="text-[10px] text-[#556b82] font-bold">إجمالي الحركات</div>
                            <div class="text-base font-black text-[#002b66] font-mono">${totalCount}</div>
                        </div>
                        <div class="p-2 rounded-xl bg-emerald-50 border border-emerald-200">
                            <div class="text-[10px] text-emerald-800 font-bold">متواجد داخل المصنع</div>
                            <div class="text-base font-black text-emerald-700 font-mono">${insideCount}</div>
                        </div>
                        <div class="p-2 rounded-xl bg-blue-50 border border-blue-200">
                            <div class="text-[10px] text-blue-800 font-bold">غادرت المنشأة</div>
                            <div class="text-base font-black text-blue-700 font-mono">${exitedCount}</div>
                        </div>
                        <div class="p-2 rounded-xl bg-red-50 border border-red-200">
                            <div class="text-[10px] text-red-800 font-bold">تجاوز مدة البقاء</div>
                            <div class="text-base font-black text-red-700 font-mono">${overstayCount}</div>
                        </div>
                    </div>

                    <!-- Table -->
                    <table class="w-full text-[10px] border-collapse border border-[#d7e2ee] mb-6">
                        <thead>
                            <tr class="bg-[#002b66] text-white">
                                <th class="border border-[#001940] py-2 px-1.5 text-center">م</th>
                                <th class="border border-[#001940] py-2 px-1.5 text-center">اللوحة</th>
                                <th class="border border-[#001940] py-2 px-2 text-right">السائق / الشركة</th>
                                <th class="border border-[#001940] py-2 px-2 text-right">الوجهة / الحمولة</th>
                                <th class="border border-[#001940] py-2 px-1.5 text-center">كود التصريح</th>
                                <th class="border border-[#001940] py-2 px-2 text-right">الدخول (البوابة / الضابط)</th>
                                <th class="border border-[#001940] py-2 px-2 text-right">الخروج (البوابة / الضابط)</th>
                                <th class="border border-[#001940] py-2 px-1.5 text-center">المدة</th>
                                <th class="border border-[#001940] py-2 px-1.5 text-center">الحالة</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${movements.map((m, idx) => {
                                const entryTime = m.entry_timestamp ? new Date(m.entry_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--';
                                const exitTime = m.exit_timestamp ? new Date(m.exit_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--';
                                let st = m.status === 'inside' ? 'بالداخل' : (m.status === 'overstay' ? 'متجاوز' : (m.status === 'denied' ? 'مرفوض' : 'غادرت'));
                                return `
                                    <tr class="${idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}">
                                        <td class="border border-[#d7e2ee] py-1 px-1.5 text-center font-bold">${idx + 1}</td>
                                        <td class="border border-[#d7e2ee] py-1 px-1.5 text-center font-black text-[#002b66]">${m.vehicle?.plate_ar || ''}</td>
                                        <td class="border border-[#d7e2ee] py-1 px-2">
                                            <div class="font-bold">${m.vehicle?.driver_name_ar || ''}</div>
                                            <div class="text-[9px] text-[#556b82]">${m.vehicle?.company_ar || ''}</div>
                                        </td>
                                        <td class="border border-[#d7e2ee] py-1 px-2">
                                            <div class="font-bold text-[#002b66]">${m.destination_ar || ''}</div>
                                            <div class="text-[9px] text-[#556b82]">${m.cargo_details || ''}</div>
                                        </td>
                                        <td class="border border-[#d7e2ee] py-1 px-1.5 text-center font-mono font-bold text-[#0070f2]">
                                            ${m.permit ? m.permit.permit_code : 'فوري'}
                                        </td>
                                        <td class="border border-[#d7e2ee] py-1 px-2">
                                            <div>🚪 ${m.entry_gate || ''}</div>
                                            <div class="text-[9px] text-[#556b82]">🕒 ${entryTime} • 👮 ${m.entry_officer_name || ''}</div>
                                        </td>
                                        <td class="border border-[#d7e2ee] py-1 px-2">
                                            <div>🚪 ${m.exit_gate || '--'}</div>
                                            <div class="text-[9px] text-[#556b82]">🕒 ${exitTime} • 👮 ${m.exit_officer_name || '--'}</div>
                                        </td>
                                        <td class="border border-[#d7e2ee] py-1 px-1.5 text-center font-mono font-bold">
                                            ${m.duration_minutes || 0} د
                                        </td>
                                        <td class="border border-[#d7e2ee] py-1 px-1.5 text-center font-bold text-[9px]">
                                            ${st}
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>

                    <!-- Official Signatures Box -->
                    <div class="grid grid-cols-3 gap-6 pt-4 border-t-2 border-slate-300 text-[11px] text-center">
                        <div>
                            <div class="font-bold text-[#556b82] mb-6">مسؤول أمن البوابات</div>
                            <div class="border-t border-dashed border-slate-400 pt-1 font-mono text-[9px] text-slate-500">التوقيع والختم</div>
                        </div>
                        <div>
                            <div class="font-bold text-[#556b82] mb-6">مدير العمليات واللوجستيات</div>
                            <div class="border-t border-dashed border-slate-400 pt-1 font-mono text-[9px] text-slate-500">التوقيع والختم</div>
                        </div>
                        <div>
                            <div class="font-bold text-[#002b66] mb-6">اعتماد الرئيس التنفيذي (CEO)</div>
                            <div class="border-t border-dashed border-slate-400 pt-1 font-mono text-[9px] text-[#002b66]">معتمد رسميّاً</div>
                        </div>
                    </div>
                </div>
            `;
        }

        if (typeof document !== 'undefined' && document.body) {
            document.body.classList.add('is-printing-report');
            const oldTitle = document.title;
            document.title = `DOTRA_Executive_Audit_Report_${now.toISOString().split('T')[0]}`;
            if (typeof window.print === 'function') {
                window.print();
            }
            document.title = oldTitle;
            document.body.classList.remove('is-printing-report');
            if (reportContainer) reportContainer.innerHTML = '';
        }
        return reportContainer ? reportContainer.innerHTML : '';
    }
}

// Global Singleton
window.CEO = new CeoController();

CeoController.prototype.exportAuditExcel = function() { return this.exportToExcel(); };
CeoController.prototype.exportCSV = function() { return this.exportToExcel(); };
CeoController.prototype.exportAuditCSV = function() { return this.exportToExcel(); };
