// Gate Officer Mobile Terminal Controller (DOTRA Enterprise SVG & Touch Layout)
// وحدة تحكم حارس البوابة - مجموعة دوترا (واجهة موبايل سريعة مع أيقونات SVG حديثة)

class OfficerController {
    constructor() {
        this.html5QrCode = null;
        this.isScanning = false;
        this.selectedVehicle = null;
        this.selectedPermit = null;
        this.currentCapturedPhoto = null;
        this.activeSearchQuery = '';
    }

    static escHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    }

    renderTerminal() {
        if (this.isScanning) return;
        const container = document.getElementById('main-content');
        if (!container) return;

        const lang = window.i18n.getLang();
        const user = window.Auth.getCurrentUser() || { id: 2, name_ar: 'أمين الشرطة طارق', name_en: 'Duty Officer', gate_assigned: 'بوابة 1 الرئيسية - دوترا', badge_id: 'GT-01' };
        const logs = window.DB.getLogs().slice().reverse().slice(0, 6);
        const gates = window.DB.getGates();
        const icon = (name, cls = 'w-4 h-4') => window.Icons ? window.Icons.get(name, cls) : '';

        // IN-PLACE SMART UPDATE: If officer terminal is already loaded in DOM, only refresh the recent logs list and return!
        const recentListContainer = document.getElementById('officer-recent-activity-list');
        if (recentListContainer) {
            recentListContainer.innerHTML = this.renderRecentLogs(logs, lang);
            return;
        }


        container.innerHTML = `
            <div class="max-w-xl mx-auto pb-12 animate-fadeIn" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                <!-- Officer & Gate Header Banner (SAP Style) -->
                <div class="sap-card p-4 mb-4 flex items-center justify-between border-l-4 border-l-[#0070f2] bg-white shadow-sm rounded-2xl">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 rounded-2xl bg-[#ebf3fb] text-[#0070f2] flex items-center justify-center border border-[#b3d5fa] shadow-sm">
                            ${icon('user', 'w-6 h-6')}
                        </div>
                        <div class="${lang === 'ar' ? 'text-right' : 'text-left'}">
                            <div class="flex items-center gap-1.5 flex-wrap">
                                <span class="w-2 h-2 rounded-full bg-[#107e3e] animate-pulse"></span>
                                <span class="text-xs font-bold text-[#107e3e] uppercase font-mono">${user.badge_id || 'GT-01'}</span>
                                <span class="text-xs text-[#d7e2ee]">•</span>
                                <!-- Quick Gate Selector for Multi-Gate Stationing -->
                                <select onchange="Officer.handleSwitchGate(this.value)" class="bg-[#f0f4f8] hover:bg-[#e2edf8] border border-[#b0cfee] text-[#002b66] text-[11px] font-bold rounded-lg px-2 py-0.5 focus:outline-none cursor-pointer">
                                    ${gates.map(g => `<option value="${g}" ${user.gate_assigned === g ? 'selected' : ''}>📍 ${g}</option>`).join('')}
                                </select>
                            </div>
                            <h2 class="text-base font-black text-[#002b66] mt-0.5">${lang === 'ar' ? user.name_ar : user.name_en}</h2>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button type="button" onclick="Officer.openExpectedArrivalsModal()" class="px-2.5 sm:px-3 py-2.5 bg-[#ebf3fb] hover:bg-[#d8e9f8] text-[#0070f2] rounded-xl border border-[#b3d5fa] text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all" title="${lang === 'ar' ? 'كشف الشاحنات المتوقع وصولها اليوم والمعتمدة مسبقاً من الإدارة' : 'Today Pre-Approved Arrival Manifest'}">
                            ${icon('file', 'w-4 h-4')}
                            <span class="hidden sm:inline">${lang === 'ar' ? 'المتوقع وصولهم' : 'Manifest'}</span>
                            <span class="px-1.5 py-0.5 bg-[#0070f2] text-white rounded-full text-[10px] font-mono font-bold">${window.DB.getExpectedArrivals().length}</span>
                        </button>
                        <button type="button" onclick="Officer.openQuickWalkinModal()" class="px-2.5 sm:px-3 py-2.5 bg-[#e5f6eb] hover:bg-[#cdeed7] text-[#107e3e] rounded-xl border border-[#b4e3c4] text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all">
                            ${icon('bolt', 'w-4 h-4')}
                            <span>${lang === 'ar' ? 'دخول فوري' : 'Walk-in'}</span>
                        </button>
                    </div>
                </div>

                <!-- Search Plate & Camera Scanner Box -->
                <div class="sap-panel p-5 shadow-md mb-4 bg-white rounded-2xl border border-[#d7e2ee]">
                    <label class="block text-xs font-bold text-[#1d2d3e] mb-2 flex justify-between items-center">
                        <span class="flex items-center gap-1.5">
                            ${icon('search', 'w-4 h-4 text-[#0070f2]')}
                            <span>${lang === 'ar' ? 'فحص لوحة المركبة أو كود التحقق السريع (5 أرقام):' : 'Enter License Plate or 5-Digit PIN:'}</span>
                        </span>
                        <button type="button" onclick="Officer.toggleKeypad()" class="text-[#0070f2] hover:text-[#005cbd] text-xs font-bold flex items-center gap-1">
                            ${icon('keyboard', 'w-3.5 h-3.5')}
                            <span>${window.i18n.t('arabicKeyboard')}</span>
                        </button>
                    </label>

                    <div class="relative">
                        <input type="text" id="officer-plate-input" autofocus value="${this.activeSearchQuery}" placeholder="${lang === 'ar' ? 'مثال: ط ر ق ٩ ٨ ٢ ١ أو الكود: 84920' : 'e.g. TRQ 9821 or PIN: 84920'}" class="w-full bg-[#f8fafc] border-2 border-[#b0cfee] rounded-xl px-4 py-3 text-[#1d2d3e] font-black text-lg focus:border-[#0070f2] focus:bg-white focus:outline-none placeholder-[#94a3b8] shadow-inner" oninput="Officer.handlePlateSearch(this.value)" />
                        <button type="button" onclick="Officer.clearSearch()" title="مسح" class="absolute ${lang === 'ar' ? 'left-3' : 'right-3'} top-3 text-[#556b82] hover:text-[#1d2d3e] text-base font-bold p-1">
                            ✕
                        </button>
                    </div>

                    <!-- On-screen Egyptian Plate Keypad -->
                    <div id="officer-arabic-keypad" class="hidden">
                        ${window.ArabicPlate ? window.ArabicPlate.renderArabicKeypad('officer-plate-input') : ''}
                    </div>

                    <!-- Scan QR Camera & Snap Photo Buttons -->
                    <div class="grid grid-cols-2 gap-2 mt-3">
                        <button type="button" id="scan-qr-btn" onclick="Officer.toggleCameraScanner()" class="py-3 sap-btn-primary text-xs flex items-center justify-center gap-1.5 shadow-sm font-bold active:scale-95 transition-all">
                            ${icon('camera', 'w-4 h-4')}
                            <span id="scan-qr-text">${window.i18n.t('openScanner')}</span>
                        </button>
                        <label class="py-3 bg-[#f0f4f8] hover:bg-[#e2edf8] text-[#002b66] border border-[#b0cfee] rounded-xl text-xs flex items-center justify-center gap-1.5 font-bold cursor-pointer transition-all shadow-sm active:scale-95">
                            <span>📸</span>
                            <span>${lang === 'ar' ? 'تصوير الشاحنة / اللوحة' : 'Snap Vehicle Photo'}</span>
                            <input type="file" id="officer-camera-file" accept="image/*" capture="environment" onchange="Officer.handlePhotoCapture(event)" class="hidden" />
                        </label>
                    </div>

                    <!-- Captured Photo Preview Container -->
                    <div id="captured-photo-preview" class="hidden mt-3 p-2.5 bg-[#f0fdf4] rounded-xl border border-[#b4e3c4] flex items-center justify-between">
                    </div>

                    <!-- Camera Viewport Container -->
                    <div id="scanner-container" class="hidden mt-3 p-2 bg-black rounded-xl border border-slate-700">
                        <div id="qr-reader"></div>
                    </div>
                </div>

                <!-- Verification Result Card (Dynamic) -->
                <div id="vehicle-verification-result" class="mb-4">
                    ${this.renderDefaultPrompt(lang)}
                </div>

                <!-- Recent Gate Activity Stream -->
                <div class="sap-panel p-4 shadow-sm bg-white rounded-2xl border border-[#d7e2ee]">
                    <div class="flex justify-between items-center mb-3">
                        <h3 class="text-xs font-bold text-[#556b82] uppercase tracking-wider flex items-center gap-1.5">
                            ${icon('clock', 'w-3.5 h-3.5 text-[#0070f2]')}
                            <span>${lang === 'ar' ? 'آخر حركات البوابات' : 'Recent Gate Activity'}</span>
                        </h3>
                        <span class="text-[10px] text-[#107e3e] font-mono font-bold">🟢 LIVE SYNC</span>
                    </div>
                    <div id="officer-recent-activity-list" class="space-y-2">
                        ${this.renderRecentLogs(logs, lang)}
                    </div>
                </div>
            </div>
        `;

        // If there was an active search query, re-evaluate it
        if (this.activeSearchQuery) {
            this.handlePlateSearch(this.activeSearchQuery);
        }
    }

    handleSwitchGate(newGateName) {
        const user = window.Auth ? window.Auth.getCurrentUser() : null;
        if (user && window.DB) {
            window.DB.assignOfficerToGate(user.id, newGateName);
            user.gate_assigned = newGateName;
            if (window.App) {
                window.App.showToast(
                    window.i18n.getLang() === 'ar' ? '📍 تم تغيير البوابة' : 'Gate Changed',
                    window.i18n.getLang() === 'ar' ? `أنت الآن على: ${newGateName}` : `Stationed at: ${newGateName}`,
                    'info',
                    'shield'
                );
            }
        }
    }

    async handlePhotoCapture(event) {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
            const photoDataUrl = await window.DB.compressImage(file, 800, 0.75);
            this.currentCapturedPhoto = photoDataUrl;
            
            const previewBox = document.getElementById('captured-photo-preview');
            if (previewBox) {
                previewBox.classList.remove('hidden');
                previewBox.innerHTML = `
                    <div class="flex items-center gap-2.5">
                        <img src="${photoDataUrl}" class="w-12 h-12 object-cover rounded-lg border-2 border-[#107e3e] shadow-sm" />
                        <div class="text-right">
                            <div class="text-xs font-bold text-[#002b66]">تم توثيق الصورة بنجاح 📸</div>
                            <div class="text-[10px] text-[#556b82]">سيتم حفظها مع سجل الدخول والخروج</div>
                        </div>
                    </div>
                    <button type="button" onclick="Officer.removeCapturedPhoto()" class="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1">
                        حذف ✕
                    </button>
                `;
            }
        } catch (err) {
            console.error('Photo capture error:', err);
        }
    }

    removeCapturedPhoto() {
        this.currentCapturedPhoto = null;
        const previewBox = document.getElementById('captured-photo-preview');
        if (previewBox) previewBox.classList.add('hidden');
        const input = document.getElementById('officer-camera-file');
        if (input) input.value = '';
    }

    renderDefaultPrompt(lang) {
        const icon = (name, cls = 'w-4 h-4') => window.Icons ? window.Icons.get(name, cls) : '';
        return `
            <div class="sap-card p-8 text-center bg-white border-dashed border-2 border-[#d7e2ee] rounded-2xl">
                <div class="w-14 h-14 rounded-2xl bg-[#ebf3fb] text-[#0070f2] flex items-center justify-center mx-auto mb-3 shadow-sm">
                    ${icon('truck', 'w-8 h-8')}
                </div>
                <h3 class="text-base font-bold text-[#002b66] mb-1">
                    ${lang === 'ar' ? 'في انتظار فحص لوحة مركبة أو كود PIN' : 'Waiting to Verify Vehicle or PIN'}
                </h3>
                <p class="text-xs text-[#556b82] max-w-xs mx-auto">
                    ${lang === 'ar' ? 'اكتب رقم اللوحة أو كود التصريح السريع (5 أرقام) أو امسح الـ QR أو التقط صورة بالكاميرا' : 'Type license plate, 5-digit PIN, scan QR code or snap photo'}
                </p>
            </div>
        `;
    }

    toggleKeypad() {
        const keypad = document.getElementById('officer-arabic-keypad');
        if (keypad) keypad.classList.toggle('hidden');
    }

    clearSearch() {
        this.activeSearchQuery = '';
        this.selectedVehicle = null;
        this.selectedPermit = null;
        this.removeCapturedPhoto();

        const input = document.getElementById('officer-plate-input');
        if (input) {
            input.value = '';
            input.focus();
        }
        const resultContainer = document.getElementById('vehicle-verification-result');
        if (resultContainer) {
            resultContainer.innerHTML = this.renderDefaultPrompt(window.i18n.getLang());
        }
    }

    handlePlateSearch(query) {
        this.activeSearchQuery = query || '';
        if (!query || query.trim().length === 0) {
            this.clearSearch();
            return;
        }

        const lang = window.i18n.getLang();
        const resultContainer = document.getElementById('vehicle-verification-result');
        if (!resultContainer) return;

        const cleanQuery = query.trim();

        // 1. Try search by 5-Digit PIN or Permit Code first
        let permit = window.DB.findPermitByPin(cleanQuery) || window.DB.findPermitByCodeOrVehicle(cleanQuery);
        let vehicle = null;

        if (permit) {
            vehicle = window.DB.getVehicles().find(v => v.id === permit.vehicle_id);
        } else {
            // 2. Search by License Plate
            vehicle = window.DB.findVehicleByPlate(cleanQuery);
            if (vehicle) {
                permit = window.DB.findPermitByCodeOrVehicle(null, vehicle.id);
            }
        }

        if (!vehicle) {
            this.selectedVehicle = null;
            this.selectedPermit = null;
            resultContainer.innerHTML = `
                <div class="sap-card p-5 bg-[#fff8eb] border-2 border-[#ffc966] rounded-2xl animate-scaleUp">
                    <div class="flex items-center justify-between mb-3">
                        <span class="px-2.5 py-1 bg-[#fff1e5] text-[#b85500] rounded-full text-xs font-bold border border-[#ffd8b3]">
                            ⚠️ ${lang === 'ar' ? 'مركبة / كود غير مسجل' : 'Unregistered Vehicle / PIN'}
                        </span>
                        <div class="text-xs font-mono font-bold text-[#556b82]">${cleanQuery}</div>
                    </div>
                    <p class="text-xs text-[#556b82] mb-3">
                        ${lang === 'ar' ? 'لم يتم العثور على تصريح مسبق برقم اللوحة أو كود PIN هذا. يمكنك تسجيل دخول فوري كزائر الآن.' : 'No prior permit found for this plate or PIN. You can register an instant walk-in pass.'}
                    </p>
                    <button type="button" onclick="Officer.openWalkinWithPlate('${OfficerController.escHtml(cleanQuery)}')" class="w-full py-3 sap-btn-primary text-xs flex items-center justify-center gap-1.5 shadow-sm font-bold active:scale-95 transition-all">
                        <span>⚡</span>
                        <span>${lang === 'ar' ? 'تسجيل دخول فوري لهذه المركبة' : 'Register Instant Entry'}</span>
                    </button>
                </div>
            `;
            return;
        }

        this.selectedVehicle = vehicle;
        this.selectedPermit = permit;
        this.renderVehicleDecisionCard(vehicle, permit, lang);
    }

    renderVehicleDecisionCard(vehicle, permit, lang) {
        const resultContainer = document.getElementById('vehicle-verification-result');
        if (!resultContainer) return;

        const insideLog = window.DB.isVehicleInside(vehicle.id);
        const isBlacklisted = vehicle.status === 'blacklist';
        const icon = (name, cls = 'w-4 h-4') => window.Icons ? window.Icons.get(name, cls) : '';

        let decisionBadge = '';
        let actionButtons = '';

        if (isBlacklisted) {
            decisionBadge = `
                <div class="p-3.5 bg-[#3b0d0c] text-white rounded-2xl border-2 border-red-800 mb-3 text-center shadow-md">
                    <div class="text-base font-black flex items-center justify-center gap-1.5 text-red-300">
                        ${icon('ban', 'w-5 h-5 text-red-400')}
                        <span>⛔ ${window.i18n.t('statusBanned')}</span>
                    </div>
                    <div class="text-xs text-red-200 mt-1 font-bold">${vehicle.blacklist_reason || 'مخالفة أمنية'}</div>
                </div>
            `;
            actionButtons = `
                <button type="button" onclick="Officer.recordAction('denied', 'مركبة محظورة')" class="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all">
                    ${icon('ban', 'w-4 h-4')}
                    <span>${window.i18n.t('denyEntryBtn')}</span>
                </button>
            `;
        } else if (insideLog) {
            const entryTime = new Date(insideLog.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const durationMinutes = Math.max(1, Math.round((new Date() - new Date(insideLog.timestamp)) / 60000));
            const entryGate = insideLog.gate_name || 'البوابة الرئيسية';

            decisionBadge = `
                <div class="p-3.5 bg-[#ebf3fb] text-[#002b66] rounded-2xl border-2 border-[#b3d5fa] mb-3 text-center">
                    <div class="text-sm font-black flex items-center justify-center gap-1.5 text-[#107e3e]">
                        <span class="w-2.5 h-2.5 rounded-full bg-[#107e3e] animate-pulse"></span>
                        <span>🟢 المركبة داخل المنشأة حالياً (إجراء تلقائي: خروج)</span>
                    </div>
                    <div class="text-xs text-[#556b82] font-semibold mt-1">
                        دخلت عبر: <b class="text-[#002b66]">${entryGate}</b> الساعة <b class="font-mono text-[#0070f2]">${entryTime}</b> (المدة: ${durationMinutes} دقيقة)
                    </div>
                    ${permit && permit.pin_code ? `
                        <div class="mt-1.5 inline-block bg-white px-3 py-0.5 rounded-lg border border-[#b3d5fa] font-mono font-black text-xs text-[#002b66]">
                            🔑 كود PIN: ${permit.pin_code}
                        </div>
                    ` : ''}
                </div>
            `;
            actionButtons = `
                <div class="grid grid-cols-3 gap-2">
                    <button type="button" onclick="Officer.recordAction('exit')" class="col-span-2 py-3.5 bg-[#0070f2] hover:bg-[#005cbd] text-white font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all">
                        ${icon('logout', 'w-5 h-5')}
                        <span>${lang === 'ar' ? '📤 تأكيد تسجيل الخروج' : 'Record Exit'}</span>
                    </button>
                    <button type="button" onclick="Officer.promptDenial()" class="py-3.5 bg-[#ffebeb] hover:bg-[#ffd5d5] text-[#bb0000] font-bold rounded-xl text-xs border border-[#f6b3b3] active:scale-95">
                        ${icon('ban', 'w-4 h-4')}
                        <span>منع / تفتيش</span>
                    </button>
                </div>
            `;
        } else if (permit && permit.status === 'active') {
            const isExit = permit.permit_type === 'exit';
            const isBoth = permit.permit_type === 'both';
            
            if (isExit) {
                decisionBadge = `
                    <div class="p-3 bg-[#ebf3fb] text-[#0070f2] rounded-xl border-2 border-[#b3d5fa] mb-3 text-center">
                        <div class="text-sm font-black flex items-center justify-center gap-1.5">
                            <span>📤 تصريح خروج بضائع معتمد (${permit.permit_code})</span>
                        </div>
                        <div class="mt-1 flex items-center justify-center gap-2">
                            <span class="text-[11px] bg-white px-2.5 py-0.5 rounded-lg border border-[#b3d5fa] font-mono font-black text-[#002b66]">🔑 كود PIN: ${permit.pin_code || '—'}</span>
                        </div>
                        ${permit.invoice_no ? `<div class="text-xs text-[#1d2d3e] font-mono font-bold mt-1.5">رقم إذن الصرف: <b class="text-[#0070f2]">${permit.invoice_no}</b> • الحمولة: ${permit.cargo_details}</div>` : ''}
                    </div>
                `;
                actionButtons = `
                    <div class="grid grid-cols-2 gap-2">
                        <button type="button" onclick="Officer.recordAction('exit', 'خروج بضائع مصرحة')" class="py-3.5 bg-[#0070f2] hover:bg-[#005cbd] text-white font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all">
                            ${icon('logout', 'w-4 h-4')}
                            <span>تسجيل خروج البضائع</span>
                        </button>
                        <button type="button" onclick="Officer.promptDenial()" class="py-3.5 bg-[#ffebeb] hover:bg-[#ffd5d5] text-[#bb0000] font-bold rounded-xl text-xs border border-[#f6b3b3] active:scale-95">
                            ${icon('ban', 'w-3.5 h-3.5')}
                            <span>منع وتفتيش</span>
                        </button>
                    </div>
                `;
            } else {
                decisionBadge = `
                    <div class="p-3 bg-[#e5f6eb] text-[#107e3e] rounded-xl border border-[#b4e3c4] mb-3 text-center">
                        <div class="text-sm font-black flex items-center justify-center gap-1.5">
                            ${icon('check', 'w-4 h-4 text-[#107e3e]')}
                            <span>🟢 ${isBoth ? 'تصريح دخول وخروج معتمد' : window.i18n.t('statusAuthorized')} (${permit.permit_code})</span>
                        </div>
                        <div class="mt-1 flex items-center justify-center gap-2">
                            <span class="text-[11px] bg-white px-2.5 py-0.5 rounded-lg border border-[#b4e3c4] font-mono font-black text-[#002b66]">🔑 كود PIN: ${permit.pin_code || '—'}</span>
                        </div>
                    </div>
                `;
                actionButtons = `
                    <div class="grid grid-cols-3 gap-2">
                        <button type="button" onclick="Officer.recordAction('entry')" class="col-span-2 py-3.5 bg-[#107e3e] hover:bg-[#0c6b33] text-white font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all">
                            ${icon('check', 'w-5 h-5')}
                            <span>${window.i18n.t('authorizeEntryBtn')}</span>
                        </button>
                        <button type="button" onclick="Officer.recordAction('exit', 'خروج مباشر')" class="py-3.5 bg-[#f0f4f8] hover:bg-[#e2edf8] text-[#002b66] border border-[#b0cfee] font-bold rounded-xl text-xs flex items-center justify-center gap-1 active:scale-95">
                            ${icon('logout', 'w-3.5 h-3.5')}
                            <span>تسجيل خروج</span>
                        </button>
                    </div>
                `;
            }
        } else {
            decisionBadge = `
                <div class="p-3 bg-[#fff1e5] text-[#b85500] rounded-xl border border-[#ffd8b3] mb-3 text-center">
                    <div class="text-sm font-black">
                        ⚪ ${lang === 'ar' ? 'مركبة مسجلة خارج المصنع (اختر الإجراء)' : 'Vehicle outside factory'}
                    </div>
                </div>
            `;
            actionButtons = `
                <div class="grid grid-cols-2 gap-2">
                    <button type="button" onclick="Officer.openWalkinWithPlate('${OfficerController.escHtml(vehicle.plate_ar)}')" class="py-3.5 sap-btn-primary text-xs flex items-center justify-center gap-1.5 shadow-md font-bold active:scale-95 transition-all">
                        ${icon('bolt', 'w-4 h-4')}
                        <span>${lang === 'ar' ? '📥 تسجيل دخول فوري' : 'Instant Entry'}</span>
                    </button>
                    <button type="button" onclick="Officer.recordAction('exit', 'خروج مباشر بدون تصريح')" class="py-3.5 bg-[#f0f4f8] hover:bg-[#e2edf8] text-[#002b66] border border-[#b0cfee] text-xs flex items-center justify-center gap-1.5 font-bold rounded-xl shadow-sm active:scale-95">
                        ${icon('logout', 'w-4 h-4')}
                        <span>${lang === 'ar' ? '📤 تسجيل خروج مباشر' : 'Direct Exit'}</span>
                    </button>
                </div>
            `;
        }

        const vehiclePhoto = this.currentCapturedPhoto || vehicle.photo_url;

        resultContainer.innerHTML = `
            <div class="sap-panel p-5 border-2 border-[#b0cfee] shadow-lg animate-scaleUp bg-white rounded-2xl">
                ${decisionBadge}

                <!-- Egyptian License Plate Badge -->
                <div class="flex justify-center mb-3">
                    ${window.ArabicPlate ? window.ArabicPlate.renderEgyptianPlate(vehicle.plate_ar, 'normal', vehicle.vehicle_type) : ''}
                </div>

                ${vehiclePhoto ? `
                    <div class="mb-3 p-2 bg-[#f0fdf4] rounded-xl border border-[#b4e3c4] flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <img src="${vehiclePhoto}" class="w-10 h-10 object-cover rounded-lg border border-[#107e3e]" />
                            <span class="text-xs text-[#107e3e] font-bold">📸 صورة المركبة موثقة</span>
                        </div>
                        <a href="${vehiclePhoto}" target="_blank" class="text-xs text-[#0070f2] hover:underline font-bold">عرض بالحجم الكامل ↗</a>
                    </div>
                ` : ''}

                <!-- Driver & Destination Details -->
                <div class="bg-[#f8fafc] rounded-xl p-3 border border-[#d7e2ee] text-xs space-y-1.5 mb-3 text-right" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                    <div class="flex justify-between border-b border-[#e7eff7] pb-1">
                        <span class="text-[#556b82] font-bold">${window.i18n.t('driverName')}:</span>
                        <span class="font-bold text-[#1d2d3e]">${lang === 'ar' ? vehicle.driver_name_ar : vehicle.driver_name_en}</span>
                    </div>
                    <div class="flex justify-between border-b border-[#e7eff7] pb-1">
                        <span class="text-[#556b82] font-bold">هاتف السائق:</span>
                        <span class="font-mono font-bold text-[#0070f2]">${vehicle.driver_phone || 'غير مسجل'}</span>
                    </div>
                    <div class="flex justify-between border-b border-[#e7eff7] pb-1">
                        <span class="text-[#556b82] font-bold">${window.i18n.t('company')}:</span>
                        <span class="font-semibold text-[#1d2d3e]">${lang === 'ar' ? vehicle.company_ar : vehicle.company_en}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-[#556b82] font-bold">${window.i18n.t('destination')}:</span>
                        <span class="font-bold text-[#002b66]">${permit ? (lang === 'ar' ? permit.destination_ar : permit.destination_en) : 'المصنع الرئيسي'}</span>
                    </div>
                </div>

                <!-- Quick WhatsApp Send -->
                ${vehicle.driver_phone ? `
                    <div class="mb-3">
                        <button type="button" onclick="Officer.shareWhatsAppStatus('${vehicle.plate_ar}', '${vehicle.driver_phone}', '${permit ? permit.permit_code : ''}', '${permit ? permit.pin_code : ''}')" class="w-full py-2.5 bg-[#e5f6eb] hover:bg-[#d0f0db] text-[#107e3e] border border-[#b4e3c4] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all">
                            ${icon('whatsapp', 'w-4 h-4 text-[#107e3e]')}
                            <span>إرسال تفاصيل التصريح لواتساب السائق</span>
                        </button>
                    </div>
                ` : ''}

                <!-- Action Button Group -->
                ${actionButtons}
            </div>
        `;
    }

    shareWhatsAppStatus(plate, phone, permitCode = '', pinCode = '') {
        const text = encodeURIComponent(`🛡️ مجموعة مصانع دوترا - بوابة الدخول\n🚘 رقم اللوحة: ${plate}\n${permitCode ? `🎫 رقم التصريح: ${permitCode}\n` : ''}${pinCode ? `🔑 كود التحقق: ${pinCode}\n` : ''}تم تسجيل وتوثيق الحركة بنجاح.`);
        const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
        const url = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('0') ? '2' + cleanPhone : cleanPhone}?text=${text}` : `https://api.whatsapp.com/send?text=${text}`;
        window.open(url, '_blank');
    }

    recordAction(action, reason = '') {
        if (!this.selectedVehicle) return;
        const user = window.Auth.getCurrentUser() || { id: 2, name_ar: 'حارس البوابة', gate_assigned: 'Gate 1' };
        const photoUrl = this.currentCapturedPhoto || null;
        const plate = this.selectedVehicle.plate_ar;
        const lang = window.i18n.getLang();

        if (action === 'entry') {
            window.DB.recordEntry(this.selectedVehicle.id, this.selectedPermit ? this.selectedPermit.id : null, user.id, user.gate_assigned, 'دخول مصرح', photoUrl);
            if (window.App) {
                window.App.showToast(
                    lang === 'ar' ? '📥 تم تسجيل الدخول بنجاح' : 'Entry Recorded',
                    lang === 'ar' ? `دخلت الشاحنة: ${plate} عبر ${user.gate_assigned}` : `Vehicle ${plate} entered via ${user.gate_assigned}`,
                    'success',
                    'check'
                );
            }
        } else if (action === 'exit') {
            window.DB.recordExit(this.selectedVehicle.id, user.id, user.gate_assigned, 'خروج نظامي', photoUrl);
            if (window.App) {
                window.App.showToast(
                    lang === 'ar' ? '📤 تم تسجيل الخروج بنجاح' : 'Exit Recorded',
                    lang === 'ar' ? `غادرت الشاحنة: ${plate} عبر ${user.gate_assigned}` : `Vehicle ${plate} exited via ${user.gate_assigned}`,
                    'warning',
                    'logout'
                );
            }
        } else if (action === 'denied') {
            window.DB.recordDenied(this.selectedVehicle.id, user.id, user.gate_assigned, reason);
            if (window.App) {
                window.App.showToast(
                    lang === 'ar' ? '⛔ تم تسجيل المنع' : 'Access Denied',
                    lang === 'ar' ? `تم منع الشاحنة: ${plate} - ${reason}` : `Access denied for ${plate}`,
                    'error',
                    'ban'
                );
            }
        }

        this.clearSearch();
        this.renderTerminal();
    }

    promptDenial() {
        const lang = window.i18n.getLang();
        const reason = prompt(window.i18n.t('denyReasonPrompt'), lang === 'ar' ? 'مخالفة تعليمات السلامة' : 'Safety violation');
        if (reason) {
            this.recordAction('denied', reason);
        }
    }

    renderRecentLogs(logs, lang) {
        if (!logs || logs.length === 0) {
            return `<div class="text-center py-4 text-xs text-[#556b82] font-semibold">${lang === 'ar' ? 'لا توجد حركات مسجلة بعد' : 'No recorded activity yet'}</div>`;
        }

        const vehicles = window.DB.getVehicles();

        return logs.map(log => {
            const vehicle = vehicles.find(v => v.id === log.vehicle_id) || {};
            const time = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const plate = vehicle.plate_ar || `مركبة #${log.vehicle_id}`;
            
            let badge = '';
            if (log.action_type === 'entry') {
                badge = `<span class="px-2 py-0.5 bg-[#e5f6eb] text-[#107e3e] text-[10px] font-bold rounded-md flex items-center gap-1">📥 دخول</span>`;
            } else if (log.action_type === 'exit') {
                badge = `<span class="px-2 py-0.5 bg-[#ebf3fb] text-[#0070f2] text-[10px] font-bold rounded-md flex items-center gap-1">📤 خروج</span>`;
            } else {
                badge = `<span class="px-2 py-0.5 bg-[#ffebeb] text-[#bb0000] text-[10px] font-bold rounded-md flex items-center gap-1">⛔ منع</span>`;
            }

            return `
                <div onclick="Officer.quickInspect('${OfficerController.escHtml(plate)}')" title="انقر للفحص السريع" class="flex items-center justify-between p-2.5 rounded-xl bg-[#f8fafc] hover:bg-[#eaf2fc] border border-[#e7eff7] text-xs cursor-pointer transition-all active:scale-[0.99]">
                    <div class="flex items-center gap-2">
                        ${badge}
                        <span class="font-black text-[#002b66]">${plate}</span>
                        <span class="text-[10px] text-[#556b82] hidden sm:inline font-medium">(${log.gate_name || 'البوابة'})</span>
                    </div>
                    <div class="flex items-center gap-2">
                        ${log.duration_minutes ? `<span class="text-[10px] bg-white px-1.5 py-0.5 rounded text-[#0070f2] font-mono font-bold">${log.duration_minutes} د</span>` : ''}
                        <span class="font-mono text-[#556b82] text-[11px] font-bold">${time}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    quickInspect(plate) {
        const input = document.getElementById('officer-plate-input');
        if (input) {
            input.value = plate;
            this.handlePlateSearch(plate);
            input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    openQuickWalkinModal() {
        this.openWalkinWithPlate('');
    }

    openWalkinWithPlate(plate) {
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) return;
        const lang = window.i18n.getLang();
        const destinations = window.DB.getDestinations();
        const icon = (name, cls = 'w-4 h-4') => window.Icons ? window.Icons.get(name, cls) : '';

        modalContainer.innerHTML = `
            <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
                <div class="sap-panel w-full max-w-md rounded-3xl border border-[#b0cfee] shadow-2xl p-6 relative animate-scaleUp bg-white ${lang === 'ar' ? 'text-right' : 'text-left'}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                    <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="absolute top-4 ${lang === 'ar' ? 'left-4' : 'right-4'} text-[#556b82] hover:text-[#1d2d3e] text-xl font-bold">
                        ✕
                    </button>

                    <div class="flex items-center gap-3 mb-4 border-b border-[#d7e2ee] pb-3">
                        <div class="w-10 h-10 rounded-xl bg-[#e5f6eb] text-[#107e3e] flex items-center justify-center border border-[#b4e3c4]">
                            ${icon('bolt', 'w-5 h-5')}
                        </div>
                        <div>
                            <h3 class="text-base font-black text-[#002b66]">${lang === 'ar' ? 'تسجيل دخول فوري (Walk-in)' : 'Instant Walk-in Entry'}</h3>
                            <p class="text-[11px] text-[#556b82] font-semibold">${lang === 'ar' ? 'إصدار تصريح مباشر وتسجيل الدخول بنقرة واحدة' : 'Issue permit and log entry in 1 click'}</p>
                        </div>
                    </div>

                    <form onsubmit="Officer.submitWalkin(event)" class="space-y-3">
                        <div>
                            <label class="block text-xs font-bold text-[#1d2d3e] mb-1">رقم لوحة المركبة</label>
                            <input type="text" id="walkin-plate" required value="${plate}" placeholder="ط ر ق ٩ ٨ ٢ ١" class="w-full bg-[#f8fafc] border-2 border-[#b0cfee] rounded-xl px-3 py-2.5 text-sm font-black text-[#1d2d3e] focus:border-[#0070f2] focus:bg-white focus:outline-none" />
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <div>
                                <label class="block text-xs font-bold text-[#1d2d3e] mb-1">هاتف السائق</label>
                                <input type="tel" id="walkin-phone" required placeholder="01012345678" class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#1d2d3e] focus:border-[#0070f2] focus:outline-none" />
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-[#1d2d3e] mb-1">الوجهة داخل المصنع</label>
                                <select id="walkin-dest" class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl px-2.5 py-2 text-xs font-bold text-[#002b66]">
                                    ${destinations.map(d => `<option value="${d}">${d}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <div>
                                <label class="block text-xs font-bold text-[#556b82] mb-1">اسم السائق (اختياري)</label>
                                <input type="text" id="walkin-driver" placeholder="سائق مصرح" class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl px-3 py-2 text-xs font-semibold text-[#1d2d3e]" />
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-[#556b82] mb-1">الجهة / الشركة (اختياري)</label>
                                <input type="text" id="walkin-company" placeholder="توريدات عامة" class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl px-3 py-2 text-xs font-semibold text-[#1d2d3e]" />
                            </div>
                        </div>

                        <div class="flex justify-end gap-2 pt-3 border-t border-[#d7e2ee]">
                            <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="px-4 py-2 sap-btn-secondary text-xs">
                                ${lang === 'ar' ? 'إلغاء' : 'Cancel'}
                            </button>
                            <button type="submit" class="flex-1 py-3 bg-[#107e3e] hover:bg-[#0c6b33] text-white font-black rounded-xl text-xs shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all">
                                ${icon('check', 'w-4 h-4')}
                                <span>${lang === 'ar' ? 'اعتماد وتسجيل الدخول فوراً' : 'Authorize & Enter Now'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    submitWalkin(e) {
        e.preventDefault();
        const plate = document.getElementById('walkin-plate').value.trim();
        const phone = document.getElementById('walkin-phone').value.trim();
        const dest = document.getElementById('walkin-dest')?.value || 'المستودع الرئيسي';
        const driverName = document.getElementById('walkin-driver')?.value.trim() || 'سائق مصرح';
        const company = document.getElementById('walkin-company')?.value.trim() || 'توريدات عامة';
        const photoUrl = this.currentCapturedPhoto || null;
        const lang = window.i18n.getLang();

        let vehicle = window.DB.findVehicleByPlate(plate);
        if (!vehicle) {
            vehicle = window.DB.addVehicle({
                plate_ar: plate,
                plate_en: plate,
                vehicle_type: 'truckHeavy',
                driver_name_ar: driverName,
                driver_name_en: driverName,
                driver_phone: phone,
                company_ar: company,
                company_en: company,
                status: 'visitor'
            });
        } else {
            // Update phone / driver if provided
            if (phone) vehicle.driver_phone = phone;
            if (driverName && driverName !== 'سائق مصرح') vehicle.driver_name_ar = driverName;
        }

        // Expire any existing active permit
        window.DB.expireExistingPermitsForVehicle(vehicle.id);

        const permit = window.DB.addPermit({
            vehicle_id: vehicle.id,
            destination_ar: dest,
            destination_en: dest,
            purpose_ar: 'دخول فوري معتمد من الحارس',
            valid_from: new Date().toISOString(),
            valid_until: new Date(Date.now() + 8 * 3600000).toISOString()
        });

        const user = window.Auth.getCurrentUser() || { id: 2, gate_assigned: 'Gate 1' };
        window.DB.recordEntry(vehicle.id, permit.id, user.id, user.gate_assigned, 'دخول فوري معتمد من الحارس', photoUrl);

        if (window.App) {
            window.App.showToast(
                lang === 'ar' ? '⚡ تم تسجيل الدخول الفوري' : 'Instant Entry Registered',
                lang === 'ar' ? `مركبة: ${plate} • كود التحقق: ${permit.pin_code}` : `Vehicle ${plate} entered (PIN: ${permit.pin_code})`,
                'success',
                'bolt'
            );
        }

        document.getElementById('modal-container').innerHTML = '';
        this.clearSearch();
        this.renderTerminal();
    }

    toggleCameraScanner() {
        const container = document.getElementById('scanner-container');
        const textSpan = document.getElementById('scan-qr-text');

        if (this.isScanning) {
            this.isScanning = false;
            if (this.html5QrCode) {
                try {
                    this.html5QrCode.stop().then(() => {
                        if (container) container.classList.add('hidden');
                        if (textSpan) textSpan.textContent = window.i18n.t('openScanner');
                    }).catch(() => {
                        if (container) container.classList.add('hidden');
                        if (textSpan) textSpan.textContent = window.i18n.t('openScanner');
                    });
                } catch (e) {
                    if (container) container.classList.add('hidden');
                    if (textSpan) textSpan.textContent = window.i18n.t('openScanner');
                }
                this.html5QrCode = null;
            }
        } else {
            if (container) container.classList.remove('hidden');
            if (textSpan) textSpan.textContent = window.i18n.t('closeScanner');
            this.startScanner();
        }
    }

    stopScanner() {
        this.isScanning = false;
        if (this.html5QrCode) {
            try { this.html5QrCode.stop().catch(() => {}); } catch (e) {}
            this.html5QrCode = null;
        }
        const container = document.getElementById('scanner-container');
        const textSpan = document.getElementById('scan-qr-text');
        if (container) container.classList.add('hidden');
        if (textSpan) textSpan.textContent = window.i18n.t('openScanner');
    }

    startScanner() {
        if (typeof Html5Qrcode === 'undefined') {
            const lang = window.i18n.getLang();
            alert(lang === 'ar' ? 'قارئ الكاميرا غير جاهز. أعد تحميل الصفحة.' : 'Camera reader not ready. Reload the page.');
            this.stopScanner();
            return;
        }

        const container = document.getElementById('scanner-container');
        const qrReaderEl = container ? container.querySelector('#qr-reader') : null;
        if (!qrReaderEl) {
            const lang = window.i18n.getLang();
            alert(lang === 'ar' ? 'عنصر الكاميرا غير موجود في الصفحة.' : 'Camera element not found in DOM.');
            this.stopScanner();
            return;
        }

        this.html5QrCode = new Html5Qrcode("qr-reader");

        this.html5QrCode.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText) => {
                this.handleScannedCode(decodedText);
                this.stopScanner();
            },
            () => {}
        ).then(() => {
            this.isScanning = true;
        }).catch(err => {
            console.error("Camera error:", err.name, err.message);
            this.stopScanner();
            const lang = window.i18n.getLang();
            const errStr = err.toString();
            if (errStr.includes('NotAllowedError') || errStr.includes('Permission denied')) {
                alert(lang === 'ar' ? 'تم رفض إذن الكاميرا. افتح إعدادات المتصفح واسمح بالوصول.' : 'Camera permission denied. Open browser settings and allow access.');
            } else if (errStr.includes('NotReadableError') || errStr.includes('Could not start video')) {
                alert(lang === 'ar' ? 'الكاميرا مستخدمة من تطبيق آخر أو غير متاحة. أغلق التطبيقات الأخرى وأعد المحاولة.' : 'Camera is in use by another app or unavailable. Close other apps and try again.');
            } else if (errStr.includes('NotFoundError')) {
                alert(lang === 'ar' ? 'لم يتم العثور على كاميرا على هذا الجهاز.' : 'No camera found on this device.');
            } else {
                alert(lang === 'ar' ? 'تعذر فتح الكاميرا. يمكنك إدخال رقم اللوحة يدوياً.' : 'Could not open camera. Enter the plate number manually.');
            }
        });
    }

    // Multi-format QR payload parsing (PIN, permit code, plate JSON, or raw string)
    handleScannedCode(decodedText) {
        if (!decodedText) return;
        let queryToSearch = decodedText.trim();

        try {
            const data = JSON.parse(decodedText);
            queryToSearch = data.pin || data.plate || data.permit || decodedText;
        } catch (e) {
            queryToSearch = decodedText.trim();
        }

        const input = document.getElementById('officer-plate-input');
        if (input) {
            input.value = queryToSearch;
        }
        this.handlePlateSearch(queryToSearch);
    }

    // Pre-Arrival Manifest & Expected Arrivals Modal
    openExpectedArrivalsModal() {
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) return;
        const lang = window.i18n.getLang();
        const icon = (name, cls = 'w-4 h-4') => window.Icons ? window.Icons.get(name, cls) : '';
        const expected = window.DB.getExpectedArrivals();

        modalContainer.innerHTML = `
            <div class="sap-modal-overlay" onclick="if(event.target === this) document.getElementById('modal-container').innerHTML = ''">
                <div class="sap-modal-content max-w-2xl w-full p-5" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                    <div class="flex justify-between items-center pb-3 border-b border-[#d7e2ee]">
                        <h3 class="text-base font-black text-[#002b66] flex items-center gap-2">
                            ${icon('file', 'w-5 h-5 text-[#0070f2]')}
                            <span>${lang === 'ar' ? '📋 كشف الشاحنات المتوقع وصولها (معتمدة مسبقاً)' : 'Pre-Approved Expected Arrivals'}</span>
                        </h3>
                        <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm">✕</button>
                    </div>

                    <div class="py-3">
                        <div class="flex justify-between items-center mb-3">
                            <span class="text-xs text-[#556b82] font-bold">
                                ${lang === 'ar' ? `إجمالي الشاحنات المتوقعة: ${expected.length}` : `Total Expected Trucks: ${expected.length}`}
                            </span>
                            <span class="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-bold flex items-center gap-1">
                                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>${lang === 'ar' ? 'معتمدة من مدير العمليات' : 'Approved by Operations'}</span>
                            </span>
                        </div>

                        ${expected.length === 0 ? `
                            <div class="text-center py-8 bg-[#f8fafc] rounded-2xl border border-dashed border-[#d7e2ee]">
                                <div class="text-3xl mb-2">🚚</div>
                                <div class="text-xs font-bold text-[#556b82]">
                                    ${lang === 'ar' ? 'لا توجد شاحنات متبقية في كشف الوصول المسبق اليوم' : 'No pending expected arrivals for today'}
                                </div>
                                <div class="text-[11px] text-[#8fa4b8] mt-1">
                                    ${lang === 'ar' ? 'تم تسجيل دخول جميع الشاحنات المصرحة أو لم يتم رفع كشف اليوم' : 'All scheduled trucks have entered or no manifest was uploaded'}
                                </div>
                            </div>
                        ` : `
                            <div class="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                                ${expected.map(item => `
                                    <div class="p-3.5 rounded-2xl bg-white border-2 border-[#d7e2ee] hover:border-[#0070f2] transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                        <div class="space-y-1">
                                            <div class="flex items-center gap-2">
                                                <span class="px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-mono font-black">
                                                    PIN: ${item.pin_code}
                                                </span>
                                                <span class="font-black text-sm text-[#002b66]">${item.plate_ar}</span>
                                            </div>
                                            <div class="text-xs text-[#1d2d3e] font-bold">
                                                <span>👤 ${item.driver_name_ar}</span>
                                                ${item.company_ar ? `<span class="text-[#556b82]"> • (${item.company_ar})</span>` : ''}
                                            </div>
                                            <div class="text-[11px] text-[#556b82] flex flex-wrap items-center gap-x-3 gap-y-1">
                                                <span>📍 الوجهة: <strong class="text-[#002b66]">${item.destination_ar || 'المستودع'}</strong></span>
                                                ${item.cargo_details ? `<span>📦 الحمولة: <strong>${item.cargo_details}</strong></span>` : ''}
                                                ${item.invoice_no ? `<span>📑 إذن/فاتورة: <strong>${item.invoice_no}</strong></span>` : ''}
                                            </div>
                                        </div>
                                        <button type="button" onclick="Officer.quickAdmitExpectedVehicle('${item.pin_code}')" class="px-4 py-2 sap-btn-primary font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 flex-shrink-0 w-full sm:w-auto justify-center">
                                            ${icon('shield', 'w-4 h-4')}
                                            <span>${lang === 'ar' ? 'اعتماد الدخول فوراً' : 'Admit Entry'}</span>
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        `}
                    </div>

                    <div class="flex justify-end pt-3 border-t border-[#d7e2ee]">
                        <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="px-4 py-2 sap-btn-secondary text-xs">
                            ${lang === 'ar' ? 'إغلاق' : 'Close'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    quickAdmitExpectedVehicle(pinCode) {
        if (document.getElementById('modal-container')) {
            document.getElementById('modal-container').innerHTML = '';
        }
        this.handlePlateSearch(pinCode);
    }
}

window.Officer = new OfficerController();

