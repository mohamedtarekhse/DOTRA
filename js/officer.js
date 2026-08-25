// Gate Officer Mobile Terminal Controller (DOTRA Enterprise SVG & Touch Layout)
// وحدة تحكم حارس البوابة - مجموعة دوترا (واجهة موبايل سريعة مع أيقونات SVG حديثة)

class OfficerController {
    constructor() {
        this.html5QrCode = null;
        this.isScanning = false;
        this.selectedVehicle = null;
        this.selectedPermit = null;
    }

    renderTerminal() {
        const container = document.getElementById('main-content');
        if (!container) return;

        const lang = window.i18n.getLang();
        const user = window.Auth.getCurrentUser() || { name_ar: 'أمين الشرطة طارق', name_en: 'Duty Officer', gate_assigned: 'Gate 1' };
        const logs = window.DB.getLogs().slice().reverse().slice(0, 5);
        const icon = (name, cls = 'w-4 h-4') => window.Icons ? window.Icons.get(name, cls) : '';

        container.innerHTML = `
            <div class="max-w-xl mx-auto pb-12 animate-fadeIn" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                <!-- Officer & Gate Header Banner (SAP Style) -->
                <div class="sap-card p-4 mb-4 flex items-center justify-between border-l-4 border-l-[#0070f2]">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 rounded-2xl bg-[#ebf3fb] text-[#0070f2] flex items-center justify-center border border-[#b3d5fa] shadow-sm">
                            ${icon('user', 'w-6 h-6')}
                        </div>
                        <div class="${lang === 'ar' ? 'text-right' : 'text-left'}">
                            <div class="flex items-center gap-1.5">
                                <span class="w-2 h-2 rounded-full bg-[#107e3e] animate-pulse"></span>
                                <span class="text-xs font-bold text-[#107e3e] uppercase font-mono">${user.badge_id || 'GT-01'}</span>
                                <span class="text-xs text-[#d7e2ee]">•</span>
                                <span class="text-xs font-bold text-[#556b82]">${user.gate_assigned || 'Gate 1'}</span>
                            </div>
                            <h2 class="text-base font-black text-[#002b66]">${lang === 'ar' ? user.name_ar : user.name_en}</h2>
                        </div>
                    </div>
                    <button type="button" onclick="Officer.openQuickWalkinModal()" class="px-3 py-2 bg-[#e5f6eb] hover:bg-[#cdeed7] text-[#107e3e] rounded-xl border border-[#b4e3c4] text-xs font-bold flex items-center gap-1.5 shadow-sm">
                        ${icon('bolt', 'w-3.5 h-3.5')}
                        <span>${lang === 'ar' ? 'دخول فوري' : 'Walk-in'}</span>
                    </button>
                </div>

                <!-- Search Plate & Camera Scanner Box -->
                <div class="sap-panel p-5 shadow-md mb-4 bg-white">
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
                        <input type="text" id="officer-plate-input" autofocus placeholder="${lang === 'ar' ? 'مثال: ط ر ق ٩ ٨ ٢ ١ أو الكود: 84920' : 'e.g. TRQ 9821 or PIN: 84920'}" class="w-full bg-[#f8fafc] border-2 border-[#b0cfee] rounded-xl px-4 py-3 text-[#1d2d3e] font-black text-lg focus:border-[#0070f2] focus:bg-white focus:outline-none placeholder-[#94a3b8] shadow-inner" oninput="Officer.handlePlateSearch(this.value)" />
                        <button type="button" onclick="Officer.clearSearch()" class="absolute ${lang === 'ar' ? 'left-3' : 'right-3'} top-3 text-[#556b82] hover:text-[#1d2d3e] text-base font-bold">
                            ✕
                        </button>
                    </div>

                    <!-- On-screen Egyptian Plate Keypad -->
                    <div id="officer-arabic-keypad" class="hidden">
                        ${window.ArabicPlate.renderArabicKeypad('officer-plate-input')}
                    </div>

                    <!-- Scan QR Camera & Snap Photo Buttons -->
                    <div class="grid grid-cols-2 gap-2 mt-3">
                        <button type="button" id="scan-qr-btn" onclick="Officer.toggleCameraScanner()" class="py-3 sap-btn-primary text-xs flex items-center justify-center gap-1.5 shadow-sm font-bold">
                            ${icon('camera', 'w-4 h-4')}
                            <span id="scan-qr-text">${window.i18n.t('openScanner')}</span>
                        </button>
                        <label class="py-3 bg-[#f0f4f8] hover:bg-[#e2edf8] text-[#002b66] border border-[#b0cfee] rounded-xl text-xs flex items-center justify-center gap-1.5 font-bold cursor-pointer transition-all shadow-sm">
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
                <div class="sap-panel p-4 shadow-sm bg-white">
                    <div class="flex justify-between items-center mb-3">
                        <h3 class="text-xs font-bold text-[#556b82] uppercase tracking-wider flex items-center gap-1.5">
                            ${icon('clock', 'w-3.5 h-3.5 text-[#0070f2]')}
                            <span>${lang === 'ar' ? 'آخر حركات هذه البوابة' : 'Recent Activity on this Gate'}</span>
                        </h3>
                        <span class="text-[10px] text-[#107e3e] font-mono font-bold">SAP SYNC</span>
                    </div>
                    <div class="space-y-2">
                        ${this.renderRecentLogs(logs, lang)}
                    </div>
                </div>
            </div>
        `;
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
                            <div class="text-[10px] text-[#556b82]">سيتم إرفاقها مع سجل الدخول والخروج</div>
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
            <div class="sap-card p-8 text-center bg-white border-dashed border-2 border-[#d7e2ee]">
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
        if (!query || query.trim().length === 0) {
            this.clearSearch();
            return;
        }

        const lang = window.i18n.getLang();
        const resultContainer = document.getElementById('vehicle-verification-result');
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
            resultContainer.innerHTML = `
                <div class="sap-card p-5 bg-[#fff8eb] border-2 border-[#ffc966] animate-scaleUp">
                    <div class="flex items-center justify-between mb-3">
                        <span class="px-2.5 py-1 bg-[#fff1e5] text-[#b85500] rounded-full text-xs font-bold border border-[#ffd8b3]">
                            ⚠️ ${lang === 'ar' ? 'مركبة / كود غير مسجل' : 'Unregistered Vehicle / PIN'}
                        </span>
                        <div class="text-xs font-mono font-bold text-[#556b82]">${cleanQuery}</div>
                    </div>
                    <p class="text-xs text-[#556b82] mb-3">
                        ${lang === 'ar' ? 'لم يتم العثور على تصريح مسبق برقم اللوحة أو كود PIN هذا. يمكنك تسجيل دخول فوري كزائر الآن.' : 'No prior permit found for this plate or PIN. You can register an instant walk-in pass.'}
                    </p>
                    <button type="button" onclick="Officer.openWalkinWithPlate('${cleanQuery}')" class="w-full py-2.5 sap-btn-primary text-xs flex items-center justify-center gap-1.5 shadow-sm font-bold">
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
                <div class="p-3 bg-[#3b0d0c] text-white rounded-xl border border-red-900 mb-3 text-center">
                    <div class="text-base font-black flex items-center justify-center gap-1.5">
                        ${icon('ban', 'w-5 h-5 text-red-400')}
                        <span>⛔ ${window.i18n.t('statusBanned')}</span>
                    </div>
                    <div class="text-xs text-red-200 mt-1">${vehicle.blacklist_reason || 'مخالفة أمنية'}</div>
                </div>
            `;
            actionButtons = `
                <button type="button" onclick="Officer.recordAction('denied', 'مركبة محظورة')" class="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-md">
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
                        <span>🟢 المركبة داخل المصنع حالياً (إجراء تلقائي: خروج)</span>
                    </div>
                    <div class="text-xs text-[#556b82] font-semibold mt-1">
                        دخلت عبر: <b class="text-[#002b66]">${entryGate}</b> الساعة <b class="font-mono text-[#0070f2]">${entryTime}</b> (المدة بالداخل: ${durationMinutes} دقيقة)
                    </div>
                    ${permit && permit.pin_code ? `
                        <div class="mt-1.5 inline-block bg-white px-3 py-0.5 rounded-lg border border-[#b3d5fa] font-mono font-black text-xs text-[#002b66]">
                            🔑 كود التصريح: ${permit.pin_code}
                        </div>
                    ` : ''}
                </div>
            `;
            actionButtons = `
                <div class="grid grid-cols-3 gap-2">
                    <button type="button" onclick="Officer.recordAction('exit')" class="col-span-2 py-3.5 bg-[#0070f2] hover:bg-[#005cbd] text-white font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-md">
                        ${icon('logout', 'w-5 h-5')}
                        <span>${lang === 'ar' ? '📤 تأكيد تسجيل الخروج' : 'Record Exit'}</span>
                    </button>
                    <button type="button" onclick="Officer.promptDenial()" class="py-3.5 bg-[#ffebeb] hover:bg-[#ffd5d5] text-[#bb0000] font-bold rounded-xl text-xs border border-[#f6b3b3]">
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
                            <span class="text-[11px] bg-white px-2.5 py-0.5 rounded-lg border border-[#b3d5fa] font-mono font-black text-[#002b66]">🔑 كود PIN: ${permit.pin_code || '84920'}</span>
                        </div>
                        ${permit.invoice_no ? `<div class="text-xs text-[#1d2d3e] font-mono font-bold mt-1.5">رقم إذن الصرف: <b class="text-[#0070f2]">${permit.invoice_no}</b> • الحمولة: ${permit.cargo_details}</div>` : ''}
                    </div>
                `;
                actionButtons = `
                    <div class="grid grid-cols-2 gap-2">
                        <button type="button" onclick="Officer.recordAction('exit', 'خروج بضائع مصرحة')" class="py-3.5 bg-[#0070f2] hover:bg-[#005cbd] text-white font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-md">
                            ${icon('logout', 'w-4 h-4')}
                            <span>تسجيل خروج البضائع</span>
                        </button>
                        <button type="button" onclick="Officer.promptDenial()" class="py-3.5 bg-[#ffebeb] hover:bg-[#ffd5d5] text-[#bb0000] font-bold rounded-xl text-xs border border-[#f6b3b3]">
                            ${icon('ban', 'w-3.5 h-3.5')}
                            <span>منع الخروج والتفتيش</span>
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
                            <span class="text-[11px] bg-white px-2.5 py-0.5 rounded-lg border border-[#b4e3c4] font-mono font-black text-[#002b66]">🔑 كود PIN: ${permit.pin_code || '84920'}</span>
                        </div>
                    </div>
                `;
                actionButtons = `
                    <div class="grid grid-cols-3 gap-2">
                        <button type="button" onclick="Officer.recordAction('entry')" class="col-span-2 py-3.5 bg-[#107e3e] hover:bg-[#0c6b33] text-white font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-md">
                            ${icon('check', 'w-5 h-5')}
                            <span>${window.i18n.t('authorizeEntryBtn')}</span>
                        </button>
                        <button type="button" onclick="Officer.recordAction('exit', 'خروج مباشر')" class="py-3.5 bg-[#f0f4f8] hover:bg-[#e2edf8] text-[#002b66] border border-[#b0cfee] font-bold rounded-xl text-xs flex items-center justify-center gap-1">
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
                    <button type="button" onclick="Officer.openWalkinWithPlate('${vehicle.plate_ar}')" class="py-3.5 sap-btn-primary text-xs flex items-center justify-center gap-1.5 shadow-md font-bold">
                        ${icon('bolt', 'w-4 h-4')}
                        <span>${lang === 'ar' ? '📥 تسجيل دخول فوري' : 'Instant Entry'}</span>
                    </button>
                    <button type="button" onclick="Officer.recordAction('exit', 'خروج مباشر بدون تصريح')" class="py-3.5 bg-[#f0f4f8] hover:bg-[#e2edf8] text-[#002b66] border border-[#b0cfee] text-xs flex items-center justify-center gap-1.5 font-bold rounded-xl shadow-sm">
                        ${icon('logout', 'w-4 h-4')}
                        <span>${lang === 'ar' ? '📤 تسجيل خروج مباشر' : 'Direct Exit'}</span>
                    </button>
                </div>
            `;
        }

        const vehiclePhoto = this.currentCapturedPhoto || vehicle.photo_url;

        resultContainer.innerHTML = `
            <div class="sap-panel p-5 border-2 border-[#b0cfee] shadow-lg animate-scaleUp bg-white">
                ${decisionBadge}

                <!-- Egyptian License Plate Badge -->
                <div class="flex justify-center mb-3">
                    ${window.ArabicPlate.renderEgyptianPlate(vehicle.plate_ar, 'normal', vehicle.vehicle_type)}
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

                <!-- Driver & Cargo Details -->
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

                <!-- Quick Manual WhatsApp Send with Mobile Data -->
                ${vehicle.driver_phone ? `
                    <div class="mb-3">
                        <button type="button" onclick="Officer.shareWhatsAppStatus('${vehicle.plate_ar}', '${vehicle.driver_phone}', '${permit ? permit.permit_code : ''}', '${permit ? permit.pin_code : ''}')" class="w-full py-2 bg-[#e5f6eb] hover:bg-[#d0f0db] text-[#107e3e] border border-[#b4e3c4] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm">
                            ${icon('whatsapp', 'w-4 h-4 text-[#107e3e]')}
                            <span>إرسال تفاصيل التصريح لواتساب السائق عبر باقة الموبايل</span>
                        </button>
                    </div>
                ` : ''}

                <!-- Action Button Group -->
                ${actionButtons}
            </div>
        `;
    }

    shareWhatsAppStatus(plate, phone, permitCode = '', pinCode = '') {
        const text = encodeURIComponent(`🛡️ بوابة مصانع دوترا\n🚘 رقم اللوحة: ${plate}\n${permitCode ? `رقم التصريح: ${permitCode}\n` : ''}${pinCode ? `🔑 كود التحقق السريع: ${pinCode}\n` : ''}تم تسجيل وتوثيق الإجراء على البوابة.`);
        const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
        const url = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('0') ? '2' + cleanPhone : cleanPhone}?text=${text}` : `https://api.whatsapp.com/send?text=${text}`;
        window.open(url, '_blank');
    }

    recordAction(action, reason = '') {
        if (!this.selectedVehicle) return;
        const user = window.Auth.getCurrentUser() || { id: 2, gate_assigned: 'Gate 1' };
        const photoUrl = this.currentCapturedPhoto || null;

        if (action === 'entry') {
            window.DB.recordEntry(this.selectedVehicle.id, this.selectedPermit ? this.selectedPermit.id : null, user.id, user.gate_assigned, 'دخول مصرح', photoUrl);
        } else if (action === 'exit') {
            window.DB.recordExit(this.selectedVehicle.id, user.id, user.gate_assigned, 'خروج نظامي', photoUrl);
        } else if (action === 'denied') {
            window.DB.recordDenied(this.selectedVehicle.id, user.id, user.gate_assigned, reason);
        }

        this.currentCapturedPhoto = null;
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
            
            let badge = '';
            if (log.action_type === 'entry') {
                badge = `<span class="px-2 py-0.5 bg-[#e5f6eb] text-[#107e3e] text-[10px] font-bold rounded-md">دخول</span>`;
            } else if (log.action_type === 'exit') {
                badge = `<span class="px-2 py-0.5 bg-[#ebf3fb] text-[#0070f2] text-[10px] font-bold rounded-md">خروج</span>`;
            } else {
                badge = `<span class="px-2 py-0.5 bg-[#ffebeb] text-[#bb0000] text-[10px] font-bold rounded-md">منع</span>`;
            }

            return `
                <div class="flex items-center justify-between p-2 rounded-lg bg-[#f8fafc] border border-[#e7eff7] text-xs">
                    <div class="flex items-center gap-2">
                        ${badge}
                        <span class="font-mono font-bold text-[#1d2d3e]">${vehicle.plate_ar || 'مركبة'}</span>
                    </div>
                    <span class="font-mono text-[#556b82] text-[11px]">${time}</span>
                </div>
            `;
        }).join('');
    }

    openQuickWalkinModal() {
        this.openWalkinWithPlate('');
    }

    openWalkinWithPlate(plate) {
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) return;
        const lang = window.i18n.getLang();
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
                            <label class="block text-xs font-bold text-[#1d2d3e] mb-1">رقم اللوحة</label>
                            <input type="text" id="walkin-plate" required value="${plate}" placeholder="ط ر ق ٩ ٨ ٢ ١" class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl px-3 py-2.5 text-sm font-bold text-[#1d2d3e] focus:border-[#0070f2] focus:outline-none" />
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-[#1d2d3e] mb-1">هاتف السائق</label>
                            <input type="tel" id="walkin-phone" required placeholder="01012345678" class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl px-3 py-2.5 text-sm font-mono font-bold text-[#1d2d3e] focus:border-[#0070f2] focus:outline-none" />
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
                            <button type="submit" class="flex-1 py-2.5 bg-[#107e3e] hover:bg-[#0c6b33] text-white font-bold rounded-xl text-xs shadow-md flex items-center justify-center gap-1.5">
                                ${icon('check', 'w-4 h-4')}
                                <span>${lang === 'ar' ? 'اعتماد والدخول فوراً' : 'Authorize & Enter Now'}</span>
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
        const driverName = document.getElementById('walkin-driver')?.value.trim() || 'سائق مصرح';
        const company = document.getElementById('walkin-company')?.value.trim() || 'توريدات عامة';

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
        }

        const permit = window.DB.addPermit({
            vehicle_id: vehicle.id,
            destination_ar: 'المستودع الرئيسي',
            purpose_ar: 'دخول فوري عبر البوابة',
            valid_from: new Date().toISOString(),
            valid_until: new Date(Date.now() + 8 * 3600000).toISOString()
        });

        const user = window.Auth.getCurrentUser() || { id: 2, gate_assigned: 'Gate 1' };
        window.DB.recordEntry(vehicle.id, permit.id, user.id, user.gate_assigned, 'دخول فوري معتمد من الحارس');

        document.getElementById('modal-container').innerHTML = '';
        this.renderTerminal();
    }

    toggleCameraScanner() {
        const container = document.getElementById('scanner-container');
        const textSpan = document.getElementById('scan-qr-text');

        if (this.isScanning) {
            if (this.html5QrCode) {
                this.html5QrCode.stop().then(() => {
                    this.isScanning = false;
                    container.classList.add('hidden');
                    textSpan.textContent = window.i18n.t('openScanner');
                });
            }
        } else {
            container.classList.remove('hidden');
            textSpan.textContent = window.i18n.t('closeScanner');
            this.startScanner();
        }
    }

    startScanner() {
        if (typeof Html5Qrcode === 'undefined') {
            alert('قارئ الكاميرا غير جاهز أو غير مدعوم في هذا المتصفح');
            return;
        }

        this.html5QrCode = new Html5Qrcode("qr-reader");
        this.isScanning = true;

        this.html5QrCode.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText) => {
                this.handleScannedCode(decodedText);
                this.toggleCameraScanner();
            },
            () => {}
        ).catch(err => {
            console.error("Camera access error:", err);
            alert("تعذر فتح الكاميرا، يرجى السماح بالإذن في المتصفح أو إدخال رقم اللوحة يدوياً");
            this.toggleCameraScanner();
        });
    }

    handleScannedCode(decodedText) {
        try {
            const data = JSON.parse(decodedText);
            if (data.plate) {
                const input = document.getElementById('officer-plate-input');
                if (input) input.value = data.plate;
                this.handlePlateSearch(data.plate);
            }
        } catch (e) {
            const input = document.getElementById('officer-plate-input');
            if (input) input.value = decodedText;
            this.handlePlateSearch(decodedText);
        }
    }
}

window.Officer = new OfficerController();
