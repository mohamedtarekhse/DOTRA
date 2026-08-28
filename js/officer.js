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
        this.currentZoom = 1.0;
        this.mediaStreamTrack = null;
        this.isTorchOn = false;
    }

    static escHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    }

    escHtml(str) {
        return OfficerController.escHtml(str);
    }

    renderTerminal() {
        if (this.isScanning) return;
        const container = document.getElementById('main-content');
        if (!container) return;

        const lang = window.i18n.getLang();
        const user = window.Auth.getCurrentUser() || { id: 2, name_ar: 'أمين الشرطة طارق', name_en: 'Duty Officer', gate_assigned: 'بوابة 1 الرئيسية - دوترا', badge_id: 'GT-01' };
        const rosterInfo = window.DB.getOfficerRoster(user.id);
        const logs = window.DB.getLogs().slice().reverse().slice(0, 6);
        const icon = (name, cls = 'w-4 h-4') => window.Icons ? window.Icons.get(name, cls) : '';

        // IN-PLACE SMART UPDATE: If officer terminal is already loaded in DOM, only refresh the recent logs list and return!
        const recentListContainer = document.getElementById('officer-recent-activity-list');
        if (recentListContainer) {
            recentListContainer.innerHTML = this.renderRecentLogs(logs, lang);
            return;
        }

        container.innerHTML = `
            <div class="max-w-xl mx-auto pb-12 animate-fadeIn" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                <!-- Officer & Gate Header Banner (Clean Unified SAP Theme) -->
                <div class="sap-panel p-4 mb-4 bg-white border border-[#d7e2ee] shadow-sm rounded-2xl">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                        
                        <!-- Officer Identity & Station Metadata -->
                        <div class="flex items-center gap-3">
                            <div class="w-11 h-11 rounded-2xl bg-[#f0f4f8] text-[#002b66] flex items-center justify-center border border-[#d7e2ee] shadow-xs flex-shrink-0">
                                ${icon('user', 'w-5 h-5')}
                            </div>
                            <div class="${lang === 'ar' ? 'text-right' : 'text-left'} min-w-0">
                                <div class="flex items-center gap-2 flex-wrap">
                                    <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#f0f4f8] border border-[#d7e2ee] text-[#002b66] text-[11px] font-mono font-bold shadow-xs">
                                        <span class="w-1.5 h-1.5 rounded-full bg-[#107e3e]"></span>
                                        <span>${user.badge_id || 'GT-01'}</span>
                                        <span class="text-[#8fa4b8]">•</span>
                                        <span class="font-sans font-bold">${rosterInfo.gate_name}</span>
                                        <span class="text-[#0070f2] font-sans">(${rosterInfo.shift === 'day' ? '☀️ نهار' : '🌙 ليل'})</span>
                                    </span>
                                </div>
                                <h2 class="text-base font-black text-[#002b66] mt-1 truncate">${lang === 'ar' ? user.name_ar : user.name_en}</h2>
                                ${rosterInfo.partner_name_ar && rosterInfo.partner_name_ar !== 'غير محدد' ? `
                                    <div class="text-[11px] text-[#556b82] font-medium mt-0.5 flex items-center gap-1.5 truncate">
                                        <span class="text-[#8fa4b8]">🔄 المناوب البديل:</span>
                                        <span class="text-[#1d2d3e] font-bold">${rosterInfo.partner_name_ar}</span>
                                        <span class="text-[10px] text-[#556b82] font-mono font-bold">(${rosterInfo.partner_badge})</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>

                        <!-- Unified Action Toolbar (Desktop & Mobile) -->
                        <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap pt-2 sm:pt-0 border-t sm:border-t-0 border-[#edf2f7]">
                            <button type="button" onclick="Officer.openInspectionRequestModal()" class="flex-1 sm:flex-initial px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl border border-amber-400 flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all" title="${lang === 'ar' ? 'إرسال طلب فحص واستئذان أمر مرور مع صور اللوحة وصندوق الحمولة للمدير' : 'Send Inspection & Pass Request to Manager'}">
                                <span>🚨</span>
                                <span>${lang === 'ar' ? 'طلب أمر مرور / استئذان' : 'Pass Request'}</span>
                            </button>
                            <button type="button" onclick="Officer.openExpectedArrivalsModal()" class="flex-1 sm:flex-initial px-3.5 py-2.5 bg-[#f0f4f8] hover:bg-[#e2edf8] text-[#002b66] rounded-xl border border-[#d7e2ee] text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all" title="${lang === 'ar' ? 'كشف الشاحنات المتوقع وصولها اليوم والمعتمدة مسبقاً من الإدارة' : 'Today Pre-Approved Arrival Manifest'}">
                                ${icon('file', 'w-3.5 h-3.5 text-[#0070f2]')}
                                <span>${lang === 'ar' ? 'كشف المتوقع' : 'Manifest'}</span>
                                <span class="px-1.5 py-0.5 bg-[#0070f2] text-white rounded-full text-[10px] font-mono font-bold leading-none">${window.DB.getExpectedArrivals().length}</span>
                            </button>
                        </div>

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

                    <!-- Primary Action Grid (Scan QR, Snap Photo, Pass Request, Walk-in) -->
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                        <button type="button" id="scan-qr-btn" onclick="Officer.toggleCameraScanner()" class="py-3 sap-btn-primary text-xs flex items-center justify-center gap-1.5 shadow-sm font-bold active:scale-95 transition-all">
                            ${icon('camera', 'w-4 h-4')}
                            <span id="scan-qr-text">${window.i18n.t('openScanner')}</span>
                        </button>
                        <label class="py-3 bg-[#f0f4f8] hover:bg-[#e2edf8] text-[#002b66] border border-[#b0cfee] rounded-xl text-xs flex items-center justify-center gap-1.5 font-bold cursor-pointer transition-all shadow-sm active:scale-95">
                            <span>📸</span>
                            <span>${lang === 'ar' ? 'تصوير الشاحنة' : 'Snap Photo'}</span>
                            <input type="file" id="officer-camera-file" accept="image/*" capture="environment" onchange="Officer.handlePhotoCapture(event)" class="hidden" />
                        </label>
                        <button type="button" onclick="Officer.openInspectionRequestModal()" class="col-span-2 sm:col-span-1 py-3 bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all" title="إرسال طلب أمر مرور واستئذان تفتيش للمدير">
                            <span>🚨</span>
                            <span>${lang === 'ar' ? 'طلب أمر مرور' : 'Pass Request'}</span>
                        </button>
                    </div>

                    <!-- Captured Photo Preview Container -->
                    <div id="captured-photo-preview" class="hidden mt-3 p-2.5 bg-[#f0fdf4] rounded-xl border border-[#b4e3c4] flex items-center justify-between">
                    </div>

                    <!-- Camera Viewport Container with Integrated Zoom Controls -->
                    <div id="scanner-container" class="hidden mt-3 bg-slate-900 rounded-2xl border-2 border-[#0070f2] overflow-hidden shadow-2xl p-3 text-white">
                        <div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-700">
                            <div class="flex items-center gap-2">
                                <span class="text-amber-300">📷</span>
                                <span class="text-xs font-bold">${lang === 'ar' ? 'قارئ الكاميرا المباشر (QR Scanner)' : 'Live QR Scanner'}</span>
                            </div>
                            <div class="flex items-center gap-1.5">
                                <span id="scanner-zoom-value" class="px-2 py-0.5 bg-black/60 rounded-lg text-[11px] font-mono text-amber-300 font-bold border border-white/10">1.0x</span>
                                <button type="button" onclick="Officer.stopScanner()" class="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded-lg font-bold">✕ ${lang === 'ar' ? 'إغلاق' : 'Close'}</button>
                            </div>
                        </div>
                        
                        <!-- Html5Qrcode Reader Target -->
                        <div id="qr-reader" class="w-full bg-black rounded-xl overflow-hidden min-h-[260px]"></div>

                        <!-- Integrated Zoom Controls -->
                        <div class="mt-2.5 pt-2 border-t border-slate-800 flex flex-col gap-2">
                            <div class="flex items-center justify-between text-[11px] text-slate-300 font-bold">
                                <span>🔍 ${lang === 'ar' ? 'التحكم في التكبير (Zoom):' : 'Camera Zoom:'}</span>
                                <div class="flex items-center gap-1">
                                    <button type="button" onclick="Officer.setZoom(1.0)" class="px-2 py-0.5 rounded bg-slate-800 hover:bg-[#0070f2] text-white text-[10px] font-mono font-bold">1x</button>
                                    <button type="button" onclick="Officer.setZoom(1.8)" class="px-2 py-0.5 rounded bg-slate-800 hover:bg-[#0070f2] text-white text-[10px] font-mono font-bold">1.8x</button>
                                    <button type="button" onclick="Officer.setZoom(2.5)" class="px-2 py-0.5 rounded bg-slate-800 hover:bg-[#0070f2] text-white text-[10px] font-mono font-bold">2.5x</button>
                                    <button type="button" onclick="Officer.setZoom(3.5)" class="px-2 py-0.5 rounded bg-slate-800 hover:bg-[#0070f2] text-white text-[10px] font-mono font-bold">3.5x</button>
                                </div>
                            </div>
                            <div class="flex items-center gap-2">
                                <button type="button" onclick="Officer.stepZoom(-0.3)" class="w-8 h-8 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white rounded-lg font-bold flex items-center justify-center">➖</button>
                                <input type="range" id="scanner-zoom-slider" min="1.0" max="4.0" step="0.1" value="1.0" oninput="Officer.setZoom(parseFloat(this.value))" class="flex-1 accent-[#0070f2] h-2 bg-slate-800 rounded-lg cursor-pointer" />
                                <button type="button" onclick="Officer.stepZoom(0.3)" class="w-8 h-8 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white rounded-lg font-bold flex items-center justify-center">➕</button>
                            </div>
                        </div>
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

                <!-- Floating Mobile Action Bar (Always Accessible on Phone Screens) -->
                <div class="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#d7e2ee] p-2.5 sm:hidden flex items-center justify-around gap-2 shadow-2xl">
                    <button type="button" onclick="Officer.openInspectionRequestModal()" class="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all">
                        <span>🚨</span>
                        <span>${lang === 'ar' ? 'أمر مرور' : 'Pass Req'}</span>
                    </button>
                    <button type="button" onclick="Officer.toggleCameraScanner()" class="flex-1 py-2.5 sap-btn-primary rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all">
                        ${icon('camera', 'w-4 h-4')}
                        <span>${lang === 'ar' ? 'مسح QR' : 'Scan QR'}</span>
                    </button>
                    <button type="button" onclick="Officer.openExpectedArrivalsModal()" class="flex-1 py-2.5 bg-[#f0f4f8] text-[#002b66] border border-[#d7e2ee] rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all">
                        ${icon('file', 'w-4 h-4 text-[#0070f2]')}
                        <span>${lang === 'ar' ? 'المتوقع' : 'Manifest'}</span>
                    </button>
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

    toggleKeypad(targetId = 'officer-arabic-keypad') {
        const id = (typeof targetId === 'string' && targetId.trim()) ? targetId.trim() : 'officer-arabic-keypad';
        const keypad = document.getElementById(id);
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
                            ⚠️ ${lang === 'ar' ? 'مركبة / كود غير مسجل مسبقاً' : 'Unregistered Vehicle / PIN'}
                        </span>
                        <div class="text-xs font-mono font-bold text-[#556b82]">${cleanQuery}</div>
                    </div>
                    <p class="text-xs text-[#556b82] mb-3">
                        ${lang === 'ar' ? 'لم يتم العثور على تصريح مسبق برقم اللوحة هذا. اختر الإجراء المناسب:' : 'No prior pass found for this plate. Choose the required action:'}
                    </p>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button type="button" onclick="Officer.openInspectionRequestModal('${OfficerController.escHtml(cleanQuery)}')" class="py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl border border-amber-400 flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all">
                            <span>🚨</span>
                            <span>${lang === 'ar' ? 'طلب أمر مرور واستئذان' : 'Pass & Inspection Request'}</span>
                        </button>
                        <button type="button" onclick="Officer.openWalkinWithPlate('${OfficerController.escHtml(cleanQuery)}')" class="py-3 sap-btn-primary text-xs flex items-center justify-center gap-1.5 shadow-sm font-bold active:scale-95 transition-all">
                            <span>⚡</span>
                            <span>${lang === 'ar' ? 'تسجيل دخول فوري كزائر' : 'Instant Walk-in Entry'}</span>
                        </button>
                    </div>
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

        const lifecycle = window.DB.getVehicleOperationalLifecycle(vehicle.id, permit ? permit.id : null);
        const insideLog = lifecycle ? lifecycle.insideLog : window.DB.isVehicleInside(vehicle.id);
        const isBlacklisted = vehicle.status === 'blacklist';
        const icon = (name, cls = 'w-4 h-4') => window.Icons ? window.Icons.get(name, cls) : '';

        let decisionBadge = '';
        let actionButtons = '';
        let pipelineHtml = '';

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
            const entryDate = window.DB ? window.DB.parseTimestamp(insideLog.timestamp) : new Date(insideLog.timestamp);
            const entryTime = entryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const durationMinutes = Math.max(0, Math.round((Date.now() - entryDate.getTime()) / 60000));
            const entryGate = insideLog.gate_name || 'البوابة الرئيسية';
            const cargoState = vehicle.cargo_state || 'loaded_incoming';

            let cargoStatusLabel = '📦 محملة - قيد التفريغ والعمليات';
            let cargoStatusBadgeColor = 'bg-blue-100 text-blue-900 border-blue-300';
            
            if (cargoState === 'unloaded_empty') {
                cargoStatusLabel = '📭 تم تفريغ الحمولة بالكامل (فارغة)';
                cargoStatusBadgeColor = 'bg-amber-100 text-amber-950 border-amber-300';
            } else if (cargoState === 'reloading_secondary') {
                cargoStatusLabel = `🔄 انتهى من التفريغ • جاري تحميل: ${vehicle.secondary_cargo || 'شحنة أخرى'}`;
                cargoStatusBadgeColor = 'bg-purple-100 text-purple-950 border-purple-300';
            } else if (cargoState === 'ready_exit') {
                cargoStatusLabel = '✅ أنهت كافة العمليات ومحملة • جاهزة للمغادرة والخروج';
                cargoStatusBadgeColor = 'bg-emerald-100 text-emerald-950 border-emerald-300';
            }

            // Visual Pipeline for in-factory journey
            pipelineHtml = `
                <div class="mb-3 p-3 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-sm text-xs">
                    <div class="text-[11px] font-bold text-slate-400 mb-2 flex justify-between items-center">
                        <span>🗺️ خط سير الشاحنة داخل المنشأة:</span>
                        <span class="text-amber-400 font-mono font-bold">⏱️ المدة: ${durationMinutes === 0 ? 'الآن' : `${durationMinutes} دقيقة`}</span>
                    </div>
                    <div class="grid grid-cols-3 gap-1.5 text-center font-bold text-[10px]">
                        <div class="p-1.5 rounded-lg ${cargoState === 'loaded_incoming' || cargoState === 'inside_processing' ? 'bg-[#0070f2] text-white shadow-xs' : 'bg-slate-800 text-slate-400'}">
                            1. تفريغ / شحن
                        </div>
                        <div class="p-1.5 rounded-lg ${cargoState === 'reloading_secondary' || cargoState === 'unloaded_empty' ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-800 text-slate-400'}">
                            2. تحميل شحنة ثانية
                        </div>
                        <div class="p-1.5 rounded-lg ${cargoState === 'ready_exit' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-800 text-slate-400'}">
                            3. جاهز للمغادرة
                        </div>
                    </div>
                </div>
            `;

            decisionBadge = `
                <div class="p-4 bg-[#ebf3fb] text-[#002b66] rounded-2xl border-2 border-[#b3d5fa] mb-3">
                    <div class="flex items-center justify-between border-b border-[#b3d5fa] pb-2 mb-2">
                        <div class="text-sm font-black flex items-center gap-1.5 text-[#107e3e]">
                            <span class="w-2.5 h-2.5 rounded-full bg-[#107e3e] animate-pulse"></span>
                            <span>🟢 الشاحنة متواجدة داخل المصنع حالياً</span>
                        </div>
                        <span class="px-2 py-0.5 rounded-lg text-[10px] font-bold border ${cargoStatusBadgeColor}">
                            ${cargoStatusLabel}
                        </span>
                    </div>

                    <div class="text-xs text-[#556b82] font-semibold space-y-1">
                        <div>📍 دخلت عبر: <b class="text-[#002b66]">${entryGate}</b> الساعة <b class="font-mono text-[#0070f2]">${entryTime}</b></div>
                        ${permit && permit.pin_code ? `<div>🔑 كود التحقق السريع: <b class="font-mono text-[#002b66] bg-white px-2 py-0.5 rounded border border-[#b3d5fa]">${permit.pin_code}</b></div>` : ''}
                    </div>
                </div>
            `;

            actionButtons = `
                <div class="space-y-2">
                    <!-- Primary Exit Action -->
                    <button type="button" onclick="Officer.recordAction('exit')" class="w-full py-3.5 bg-[#0070f2] hover:bg-[#005cbd] text-white font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all">
                        ${icon('logout', 'w-5 h-5')}
                        <span>${lang === 'ar' ? '📤 اعتماد الخروج النهائي وتأكيد المغادرة' : 'Authorize Final Exit'}</span>
                    </button>

                    <!-- Cargo Status & Reload Options -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button type="button" onclick="Officer.openReloadCargoModal('${vehicle.id}', '${permit ? permit.id : ''}')" class="py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-950 border border-purple-300 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all">
                            <span>🔄</span>
                            <span>${lang === 'ar' ? 'تم التفريغ وسيقوم بتحميل شحنة أخرى' : 'Finished & Reloading Cargo'}</span>
                        </button>
                        <button type="button" onclick="Officer.quickUpdateCargoState('${vehicle.id}', 'ready_exit', 'جاهزة للمغادرة')" class="py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-300 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all">
                            <span>✅</span>
                            <span>${lang === 'ar' ? 'تأكيد اكتمال التحميل والجاهزية للخروج' : 'Mark Ready for Exit'}</span>
                        </button>
                    </div>

                    <div class="grid grid-cols-2 gap-2">
                        <button type="button" onclick="Officer.quickUpdateCargoState('${vehicle.id}', 'unloaded_empty', 'شاحنة فارغة')" class="py-2 bg-[#f0f4f8] hover:bg-[#e2edf8] text-[#002b66] border border-[#b0cfee] rounded-xl text-xs font-bold flex items-center justify-center gap-1 active:scale-95">
                            <span>📭</span>
                            <span>تفريغ فقط (فارغة)</span>
                        </button>
                        <button type="button" onclick="Officer.promptDenial()" class="py-2 bg-[#ffebeb] hover:bg-[#ffd5d5] text-[#bb0000] font-bold rounded-xl text-xs border border-[#f6b3b3] active:scale-95">
                            ${icon('ban', 'w-3.5 h-3.5')}
                            <span>إيقاف للتفتيش / مراجعة</span>
                        </button>
                    </div>
                </div>
            `;
        } else if (permit && permit.status === 'revoked') {
            decisionBadge = `
                <div class="p-4 bg-[#3b0d0c] text-white rounded-2xl border-2 border-red-800 mb-3 text-center shadow-md">
                    <div class="text-sm font-black flex items-center justify-center gap-1.5 text-red-300">
                        ${icon('ban', 'w-5 h-5 text-red-400')}
                        <span>⛔ تصريح ملغي ومسحوب نهائياً (REVOKED)</span>
                    </div>
                    <div class="text-xs text-red-200 mt-1 font-bold">
                        كود التصريح: <b class="font-mono text-amber-300">${permit.permit_code}</b>
                    </div>
                    <p class="text-xs text-red-200 mt-1 font-semibold">
                        ${permit.hold_reason ? `سبب الإلغاء والسحب: ${permit.hold_reason}` : 'تم إلغاء وسحب هذا التصريح نهائياً بقرار من إدارة العمليات. غير مصرح بالدخول.'}
                    </p>
                </div>
            `;
            actionButtons = `
                <div class="grid grid-cols-2 gap-2">
                    <button type="button" onclick="Officer.promptDenial('تصريح ملغي ومسحوب نهائياً')" class="py-3.5 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-md active:scale-95">
                        ${icon('ban', 'w-4 h-4')}
                        <span>منع الدخول وتوثيق مخالفة</span>
                    </button>
                    <button type="button" onclick="Officer.handlePlateSearch('${OfficerController.escHtml(this.activeSearchQuery)}')" class="py-3.5 bg-[#f0f4f8] hover:bg-[#e2edf8] text-[#002b66] border border-[#b0cfee] font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95">
                        ${icon('refresh', 'w-4 h-4')}
                        <span>إعادة التحقق</span>
                    </button>
                </div>
            `;
        } else if (permit && permit.status === 'hold') {
            decisionBadge = `
                <div class="p-4 bg-[#fff1e5] text-amber-900 rounded-2xl border-2 border-amber-400 mb-3 text-center shadow-sm">
                    <div class="text-sm font-black flex items-center justify-center gap-1.5 text-amber-800">
                        <span>⏸️</span>
                        <span>⛔ تصريح معلق ومجمد بقرار الإدارة (ON HOLD)</span>
                    </div>
                    <div class="text-xs text-amber-900 font-bold mt-1">
                        كود التصريح: <b class="font-mono text-[#002b66]">${permit.permit_code}</b>
                    </div>
                    <p class="text-xs text-amber-800 mt-1 font-semibold">
                        ${permit.hold_reason ? `سبب الإيقاف المؤقت: ${permit.hold_reason}` : 'تم سحب وتجميد الصلاحية مؤقتاً من قبل مدير العمليات. غير مصرح بالدخول.'}
                    </p>
                </div>
            `;
            actionButtons = `
                <div class="grid grid-cols-2 gap-2">
                    <button type="button" onclick="Officer.promptDenial('تصريح معلق من الإدارة')" class="py-3.5 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-md active:scale-95">
                        ${icon('ban', 'w-4 h-4')}
                        <span>منع الدخول وتوثيق مخالفة</span>
                    </button>
                    <button type="button" onclick="Officer.handlePlateSearch('${OfficerController.escHtml(this.activeSearchQuery)}')" class="py-3.5 bg-[#f0f4f8] hover:bg-[#e2edf8] text-[#002b66] border border-[#b0cfee] font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95">
                        ${icon('refresh', 'w-4 h-4')}
                        <span>إعادة الفحص والتحقق</span>
                    </button>
                </div>
                <button type="button" onclick="Officer.openRequestHoldModal('${permit.id}')" class="w-full mt-2 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all">
                    <span>⚠️</span>
                    <span>طلب سحب أو إفادة بشأن التصريح من المدير</span>
                </button>
            `;
        } else if (permit && permit.status === 'active') {
            const isExit = permit.permit_type === 'exit';
            const isBoth = permit.permit_type === 'both';
            
            pipelineHtml = `
                <div class="mb-3 p-3 bg-emerald-950 text-white rounded-2xl border border-emerald-800 shadow-sm text-xs">
                    <div class="text-[11px] font-bold text-emerald-300 mb-1 flex justify-between items-center">
                        <span>🟢 الموقف التشغيلي: الشاحنة خارج المصنع وجاهزة للدخول</span>
                        <span class="font-mono font-bold bg-emerald-800 px-2 py-0.5 rounded text-white">تصريح معتمد</span>
                    </div>
                </div>
            `;

            decisionBadge = `
                <div class="p-4 ${isExit ? 'bg-[#ebf3fb] border-[#b3d5fa] text-[#0070f2]' : 'bg-[#e5f6eb] border-[#b4e3c4] text-[#107e3e]'} rounded-2xl border-2 mb-3">
                    <div class="flex items-center justify-between border-b ${isExit ? 'border-[#b3d5fa]' : 'border-[#b4e3c4]'} pb-2 mb-2">
                        <div class="text-sm font-black flex items-center gap-1.5">
                            ${icon('check', 'w-4 h-4')}
                            <span>${isExit ? '📤 تصريح خروج بضائع معتمد' : (isBoth ? '🔄 تصريح دخول وخروج معتمد' : '🟢 تصريح دخول معتمد')} (${permit.permit_code})</span>
                        </div>
                        <span class="px-2.5 py-0.5 bg-white rounded-lg border font-mono font-black text-xs text-[#002b66]">
                            🔑 PIN: ${permit.pin_code || '—'}
                        </span>
                    </div>
                    <div class="text-xs text-[#1d2d3e] font-semibold flex flex-wrap gap-x-4 gap-y-1">
                        <span>📍 الوجهة: <b class="text-[#002b66]">${permit.destination_ar || 'المستودع الرئيسي'}</b></span>
                        ${permit.cargo_details ? `<span>📦 الحمولة: <b class="text-[#0070f2]">${permit.cargo_details}</b></span>` : ''}
                        ${permit.invoice_no ? `<span>📑 إذن الصرف: <b class="font-mono text-[#002b66]">${permit.invoice_no}</b></span>` : ''}
                    </div>
                </div>
            `;

            actionButtons = `
                <div class="space-y-2">
                    <button type="button" onclick="Officer.recordAction('entry')" class="w-full py-3.5 bg-[#107e3e] hover:bg-[#0c6b33] text-white font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all">
                        ${icon('check', 'w-5 h-5')}
                        <span>${lang === 'ar' ? '📥 اعتماد الدخول وبدء التفريغ / التحميل' : 'Authorize Entry'}</span>
                    </button>
                    <div class="grid grid-cols-2 gap-2">
                        <button type="button" onclick="Officer.openInspectionRequestModal('${vehicle.plate_ar}')" class="py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95">
                            <span>🚨</span>
                            <span>طلب استئذان / فحص</span>
                        </button>
                        <button type="button" onclick="Officer.openRequestHoldModal('${permit.id}')" class="py-2.5 bg-red-50 hover:bg-red-100 text-red-900 border border-red-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95">
                            <span>⚠️</span>
                            <span>طلب تعليق التصريح</span>
                        </button>
                    </div>
                </div>
            `;
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
                
                ${pipelineHtml}
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

        if (action === 'entry' || action === 'admitted') {
            window.DB.recordEntry(this.selectedVehicle.id, this.selectedPermit ? this.selectedPermit.id : null, user.id, user.gate_assigned, reason || 'دخول مصرح', photoUrl);
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
            this.stopScanner();
        } else {
            if (container) {
                container.classList.remove('hidden');
                container.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            if (textSpan) textSpan.textContent = window.i18n.t('closeScanner');
            this.startScanner();
        }
    }

    stopScanner() {
        this.isScanning = false;
        if (this.html5QrCode) {
            try {
                this.html5QrCode.stop().then(() => {
                    this.html5QrCode = null;
                }).catch(() => {
                    this.html5QrCode = null;
                });
            } catch (e) {
                this.html5QrCode = null;
            }
        }
        this.mediaStreamTrack = null;
        this.isTorchOn = false;

        const container = document.getElementById('scanner-container');
        if (container) container.classList.add('hidden');
        const textSpan = document.getElementById('scan-qr-text');
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
            this.stopScanner();
            return;
        }

        if (this.html5QrCode) {
            try { this.html5QrCode.stop().catch(() => {}); } catch(e) {}
            this.html5QrCode = null;
        }

        this.html5QrCode = new Html5Qrcode("qr-reader");

        const qrConfig = {
            fps: 15,
            qrbox: { width: 250, height: 250 }
        };

        this.html5QrCode.start(
            { facingMode: "environment" },
            qrConfig,
            (decodedText) => {
                this.handleScannedCode(decodedText);
                this.stopScanner();
            },
            () => {}
        ).then(() => {
            this.isScanning = true;
            const videoEl = document.querySelector('#qr-reader video');
            if (videoEl && videoEl.srcObject) {
                const stream = videoEl.srcObject;
                const tracks = stream.getVideoTracks();
                if (tracks && tracks.length > 0) {
                    this.mediaStreamTrack = tracks[0];
                }
            }
            this.applyZoom(this.currentZoom || 1.0);
        }).catch(err => {
            console.warn("Camera start with facingMode: environment failed, trying fallback...", err);
            this.html5QrCode.start(
                { facingMode: "user" },
                qrConfig,
                (decodedText) => {
                    this.handleScannedCode(decodedText);
                    this.stopScanner();
                },
                () => {}
            ).then(() => {
                this.isScanning = true;
                const videoEl = document.querySelector('#qr-reader video');
                if (videoEl && videoEl.srcObject) {
                    const stream = videoEl.srcObject;
                    const tracks = stream.getVideoTracks();
                    if (tracks && tracks.length > 0) {
                        this.mediaStreamTrack = tracks[0];
                    }
                }
                this.applyZoom(this.currentZoom || 1.0);
            }).catch(fallbackErr => {
                console.error("Camera completely failed:", fallbackErr);
                this.stopScanner();
                const lang = window.i18n.getLang();
                const errStr = (err || fallbackErr || '').toString();
                if (errStr.includes('NotAllowedError') || errStr.includes('Permission denied')) {
                    alert(lang === 'ar' ? 'تم رفض إذن الكاميرا. افتح إعدادات المتصفح واسمح بالوصول.' : 'Camera permission denied. Open browser settings and allow access.');
                } else if (errStr.includes('NotReadableError') || errStr.includes('Could not start video')) {
                    alert(lang === 'ar' ? 'الكاميرا مستخدمة من تطبيق آخر أو غير متاحة. أغلق التطبيقات الأخرى وأعد المحاولة.' : 'Camera is in use by another app or unavailable. Close other apps and try again.');
                } else if (errStr.includes('NotFoundError')) {
                    alert(lang === 'ar' ? 'لم يتم العثور على كاميرا على هذا الجهاز.' : 'No camera found on this device.');
                } else {
                    alert(lang === 'ar' ? 'تعذر فتح الكاميرا. يمكنك إدخال رقم اللوحة أو PIN يدوياً.' : 'Could not open camera. Enter the plate number manually.');
                }
            });
        });
    }

    setZoom(zoomLevel) {
        const clamped = Math.max(1.0, Math.min(4.0, Math.round(zoomLevel * 10) / 10));
        this.currentZoom = clamped;
        this.applyZoom(clamped);
    }

    stepZoom(delta) {
        const nextZoom = (this.currentZoom || 1.0) + delta;
        this.setZoom(nextZoom);
    }

    applyZoom(zoomLevel) {
        const labelEl = document.getElementById('scanner-zoom-value');
        if (labelEl) labelEl.textContent = `${zoomLevel.toFixed(1)}x`;
        const sliderEl = document.getElementById('scanner-zoom-slider');
        if (sliderEl) sliderEl.value = zoomLevel;

        // 1. Hardware Zoom (if supported)
        if (this.mediaStreamTrack && typeof this.mediaStreamTrack.getCapabilities === 'function') {
            try {
                const capabilities = this.mediaStreamTrack.getCapabilities();
                if (capabilities && capabilities.zoom) {
                    const min = capabilities.zoom.min || 1;
                    const max = capabilities.zoom.max || 5;
                    const hZoom = Math.max(min, Math.min(max, zoomLevel));
                    this.mediaStreamTrack.applyConstraints({
                        advanced: [{ zoom: hZoom }]
                    }).catch(() => {});
                }
            } catch (e) {}
        }

        // 2. Video Element Scaling
        const videoEl = document.querySelector('#qr-reader video');
        if (videoEl) {
            videoEl.style.transform = `scale(${zoomLevel})`;
            videoEl.style.transformOrigin = 'center center';
            videoEl.style.transition = 'transform 0.15s ease-out';
        }
    }

    toggleTorch() {
        if (!this.mediaStreamTrack) return;
        this.isTorchOn = !this.isTorchOn;
        try {
            this.mediaStreamTrack.applyConstraints({
                advanced: [{ torch: this.isTorchOn }]
            }).catch(() => {});
        } catch(e) {}
    }

    setZoom(zoomLevel) {
        const clamped = Math.max(1.0, Math.min(4.0, Math.round(zoomLevel * 10) / 10));
        this.currentZoom = clamped;
        this.applyZoom(clamped);
    }

    stepZoom(delta) {
        const nextZoom = (this.currentZoom || 1.0) + delta;
        this.setZoom(nextZoom);
    }

    applyZoom(zoomLevel) {
        const labelEl = document.getElementById('scanner-zoom-value');
        if (labelEl) labelEl.textContent = `${zoomLevel.toFixed(1)}x`;
        const sliderEl = document.getElementById('scanner-zoom-slider');
        if (sliderEl) sliderEl.value = zoomLevel;

        // 1. Hardware MediaStreamTrack native zoom (if supported by device/browser)
        if (this.mediaStreamTrack && typeof this.mediaStreamTrack.getCapabilities === 'function') {
            try {
                const capabilities = this.mediaStreamTrack.getCapabilities();
                if (capabilities && capabilities.zoom) {
                    const min = capabilities.zoom.min || 1;
                    const max = capabilities.zoom.max || 5;
                    const hZoom = Math.max(min, Math.min(max, zoomLevel));
                    this.mediaStreamTrack.applyConstraints({
                        advanced: [{ zoom: hZoom }]
                    }).catch(() => {});
                }
            } catch (e) {}
        }

        // 2. Universal Video Transform Zoom (Works reliably on all mobile & desktop browsers)
        const videoEl = document.querySelector('#qr-reader video');
        if (videoEl) {
            videoEl.style.transform = `scale(${zoomLevel})`;
            videoEl.style.transformOrigin = 'center center';
            videoEl.style.transition = 'transform 0.15s ease-out';
        }
    }

    toggleTorch() {
        if (!this.mediaStreamTrack) {
            alert(window.i18n.getLang() === 'ar' ? 'الفلاش غير مدعوم على هذه الكاميرا' : 'Torch not supported');
            return;
        }
        this.isTorchOn = !this.isTorchOn;
        try {
            this.mediaStreamTrack.applyConstraints({
                advanced: [{ torch: this.isTorchOn }]
            }).catch(() => {});
        } catch(e) {}

        const textEl = document.getElementById('torch-btn-text');
        if (textEl) {
            textEl.textContent = this.isTorchOn ? (window.i18n.getLang() === 'ar' ? 'إطفاء' : 'Off') : (window.i18n.getLang() === 'ar' ? 'فلاش' : 'Torch');
        }
    }

    // Audio chime & vibration for successful QR scan
    playScanSuccessSound() {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                const ctx = new AudioCtx();
                const now = ctx.currentTime;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, now);
                osc.frequency.exponentialRampToValueAtTime(1320, now + 0.12);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.25);
            }
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate([60, 40, 60]);
            }
        } catch (e) {}
    }

    // Multi-format QR payload parsing (PIN, permit code, plate JSON, or raw string)
    handleScannedCode(decodedText) {
        if (!decodedText) return;
        this.playScanSuccessSound();
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

        this.stopScanner();
        this.handlePlateSearch(queryToSearch);

        // Smooth scroll so the officer immediately sees the decision and cargo lifecycle card
        setTimeout(() => {
            const resultContainer = document.getElementById('vehicle-verification-result');
            if (resultContainer) {
                resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }, 120);
    }

    quickUpdateCargoState(vehicleId, cargoState, notes = '') {
        const vehicle = window.DB.updateVehicleCargoState(parseInt(vehicleId), cargoState, notes);
        const lang = window.i18n.getLang();
        if (window.App) {
            window.App.showToast(
                lang === 'ar' ? '📦 تم تحديث حالة الحمولة' : 'Cargo State Updated',
                lang === 'ar' ? `المركبة: ${vehicle ? vehicle.plate_ar : ''} • الحالة: ${notes || cargoState}` : `Vehicle updated`,
                'success',
                'check'
            );
        }
        if (this.selectedVehicle) {
            this.renderVehicleDecisionCard(this.selectedVehicle, this.selectedPermit, lang);
        }
    }

    openReloadCargoModal(vehicleId, permitId = '') {
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) return;
        const lang = window.i18n.getLang();
        const vehicle = window.DB.getVehicles().find(v => v.id === parseInt(vehicleId));
        if (!vehicle) return;
        const destinations = window.DB.getDestinations() || ['مستودع المنتجات تامة الصنع', 'مصنع الأسمدة والمخصبات', 'المستودع الرئيسي'];

        modalContainer.innerHTML = `
            <div class="sap-modal-overlay fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onclick="if(event.target === this) document.getElementById('modal-container').innerHTML = ''">
                <div class="sap-modal-content bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-purple-200" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                    <div class="flex justify-between items-center pb-3 border-b border-[#d7e2ee] mb-4">
                        <div class="flex items-center gap-2.5">
                            <div class="w-10 h-10 rounded-2xl bg-purple-100 text-purple-900 flex items-center justify-center font-black text-lg border border-purple-300">
                                🔄
                            </div>
                            <div>
                                <h3 class="text-base font-black text-[#002b66]">
                                    ${lang === 'ar' ? 'توثيق انتهاء التفريغ وتحويل لتحميل بضائع أخرى' : 'Secondary Cargo Reload Authorization'}
                                </h3>
                                <p class="text-[11px] text-[#556b82] font-semibold">
                                    ${lang === 'ar' ? `مركبة: ${vehicle.plate_ar} • السائق: ${vehicle.driver_name_ar}` : `Vehicle: ${vehicle.plate_ar}`}
                                </p>
                            </div>
                        </div>
                        <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm">✕</button>
                    </div>

                    <form onsubmit="Officer.submitReloadCargo(event, '${vehicle.id}')" class="space-y-3.5 text-xs">
                        <div>
                            <label class="block font-bold text-[#1d2d3e] mb-1">📦 تفاصيل الشحنة الجديدة المراد تحميلها بالمصنع:</label>
                            <input type="text" id="reload-cargo-input" required placeholder="${lang === 'ar' ? 'مثال: أسمدة مركبة 25 طن - إذن صرف 8841' : 'e.g. Compound Fertilizer 25 Tons'}" class="w-full bg-[#f8fafc] border border-[#b0cfee] rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#1d2d3e] focus:border-purple-600 focus:bg-white focus:outline-none" />
                        </div>

                        <div>
                            <label class="block font-bold text-[#1d2d3e] mb-1">📍 المستودع / القسم الداخلي التالي:</label>
                            <select id="reload-destination-select" class="w-full bg-[#f8fafc] border border-[#b0cfee] rounded-xl px-3.5 py-2.5 font-bold text-[#1d2d3e] focus:border-purple-600 focus:bg-white focus:outline-none">
                                ${destinations.map(d => `<option value="${d}">${d}</option>`).join('')}
                            </select>
                        </div>

                        <div>
                            <label class="block font-bold text-[#1d2d3e] mb-1">📝 ملاحظات الحارس:</label>
                            <input type="text" id="reload-notes-input" placeholder="${lang === 'ar' ? 'تم إنزال وتفريغ الحمولة السابقة بالكامل بنجاح' : 'Unloaded successfully'}" class="w-full bg-[#f8fafc] border border-[#b0cfee] rounded-xl px-3.5 py-2 text-[#1d2d3e] focus:border-purple-600 focus:bg-white focus:outline-none" />
                        </div>

                        <div class="pt-2 flex gap-2">
                            <button type="submit" class="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl text-xs shadow-md active:scale-95 transition-all">
                                🔄 ${lang === 'ar' ? 'اعتماد التحويل للتحميل الداخلي' : 'Authorize Reload'}
                            </button>
                            <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs">
                                إلغاء
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    submitReloadCargo(event, vehicleId) {
        if (event) event.preventDefault();
        const cargo = document.getElementById('reload-cargo-input')?.value.trim() || 'شحنة بضائع جديدة';
        const dest = document.getElementById('reload-destination-select')?.value.trim() || 'المستودع';
        const notes = document.getElementById('reload-notes-input')?.value.trim() || 'تم إنزال الحمولة السابقة';

        window.DB.updateVehicleCargoState(parseInt(vehicleId), 'reloading_secondary', `تحويل إلى ${dest}: ${notes}`, cargo);

        document.getElementById('modal-container').innerHTML = '';
        const lang = window.i18n.getLang();
        if (window.App) {
            window.App.showToast(
                lang === 'ar' ? '🔄 تم اعتماد التحويل للتحميل' : 'Reload Authorized',
                lang === 'ar' ? `جاري تحميل: ${cargo}` : `Loading: ${cargo}`,
                'success',
                'sync'
            );
        }

        if (this.selectedVehicle) {
            this.renderVehicleDecisionCard(this.selectedVehicle, this.selectedPermit, lang);
        }
        this.renderTerminal();
    }

    // Pre-Arrival Manifest & Expected Arrivals Modal
    openExpectedArrivalsModal() {
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) return;
        const lang = window.i18n.getLang();
        const icon = (name, cls = 'w-4 h-4') => window.Icons ? window.Icons.get(name, cls) : '';
        const expected = window.DB.getExpectedArrivals();

        modalContainer.innerHTML = `
            <div class="sap-modal-overlay fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onclick="if(event.target === this) document.getElementById('modal-container').innerHTML = ''">
                <div class="sap-modal-content bg-white rounded-2xl max-w-2xl w-full p-5 max-h-[92vh] overflow-y-auto shadow-2xl border border-[#d7e2ee]" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
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

    // =========================================================================
    // MULTI-PHOTO INSPECTION & ENTRY APPROVAL REQUESTS (CAR PLATE + CARRIAGE)
    // =========================================================================

    openInspectionRequestModal(prefillPlate = '') {
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) return;
        const lang = window.i18n ? window.i18n.getLang() : 'ar';
        const icon = (name, cls = 'w-4 h-4') => window.Icons ? window.Icons.get(name, cls) : '';
        const user = (window.Auth && typeof window.Auth.getCurrentUser === 'function' ? window.Auth.getCurrentUser() : null) || { id: 2, name_ar: 'أمين الشرطة طارق', gate_assigned: 'بوابة 1 الرئيسية - دوترا' };
        const rosterInfo = (window.DB && typeof window.DB.getOfficerRoster === 'function' ? window.DB.getOfficerRoster(user.id) : null) || {
            gate_name: user.gate_assigned || 'بوابة 1 الرئيسية - دوترا',
            shift: 'day',
            shift_name_ar: 'وردية النهار (صباحية)'
        };
        const destinations = (window.DB && typeof window.DB.getDestinations === 'function' ? window.DB.getDestinations() : null) || ['المستودع الرئيسي', 'مصنع الأسمدة والمخصبات', 'مستودع الكيماويات والمواد الخام'];
        const currentPlateInput = (typeof prefillPlate === 'string' && prefillPlate.trim()) ? prefillPlate.trim() : (document.getElementById('officer-plate-input')?.value.trim() || '');

        this._inspectionPhotos = {
            plate: null,
            carriage: null
        };

        modalContainer.innerHTML = `
            <div class="sap-modal-overlay fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onclick="if(event.target === this) document.getElementById('modal-container').innerHTML = ''">
                <div class="sap-modal-content bg-white rounded-2xl max-w-2xl w-full p-5 max-h-[92vh] overflow-y-auto shadow-2xl border border-[#d7e2ee]" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                    <div class="flex justify-between items-center pb-3 border-b border-[#d7e2ee]">
                        <div class="flex items-center gap-2.5">
                            <div class="w-10 h-10 rounded-2xl bg-[#fff8eb] text-[#b85500] flex items-center justify-center font-black text-lg border border-[#ffc966] shadow-xs">
                                🚨
                            </div>
                            <div>
                                <h3 class="text-base font-black text-[#002b66]">
                                    ${lang === 'ar' ? 'طلب فحص واستئذان دخول شاحنة للمدير' : 'Send Vehicle Inspection & Pass Request'}
                                </h3>
                                <p class="text-[11px] text-[#556b82] font-semibold">
                                    ${lang === 'ar' ? 'إرسال صور لوحة السيارة وصندوق الحمولة لمدير العمليات للاعتماد الفوري' : 'Attach car plate & carriage photos for manager investigation and approval'}
                                </p>
                            </div>
                        </div>
                        <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="w-8 h-8 rounded-full bg-[#f0f4f8] hover:bg-[#e2edf8] text-[#556b82] flex items-center justify-center font-bold text-sm">✕</button>
                    </div>

                    <form onsubmit="Officer.submitInspectionRequest(event)" class="py-3 space-y-4 text-xs">
                        
                        <!-- Station & Officer Banner -->
                        <div class="p-3 bg-[#f0f4f8] rounded-2xl border border-[#d7e2ee] flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <span>🚪</span>
                                <span class="font-bold text-[#002b66]">${rosterInfo.gate_name}</span>
                                <span class="text-[10px] text-[#0070f2] font-mono font-black">(${rosterInfo.shift_name_ar})</span>
                            </div>
                            <div class="text-[11px] text-[#556b82] font-bold">
                                👮 ${user.name_ar}
                            </div>
                        </div>

                        <!-- Plate Input & Keypad -->
                        <div>
                            <div class="flex justify-between items-center mb-1">
                                <label class="font-bold text-[#1d2d3e]">رقم لوحة المركبة (مطلوب):</label>
                                <button type="button" onclick="Officer.toggleKeypad('req-arabic-keypad')" class="text-[#0070f2] font-bold text-[11px] flex items-center gap-1">
                                    ${icon('keyboard', 'w-3.5 h-3.5')}
                                    <span>لوحة المفاتيح المصرية</span>
                                </button>
                            </div>
                            <input type="text" id="req-plate-input" required value="${OfficerController.escHtml(currentPlateInput)}" placeholder="مثال: ط ر ق ٩ ٨ ٢ ١" class="w-full bg-[#f8fafc] border-2 border-[#b0cfee] rounded-xl px-3.5 py-2.5 text-base font-black text-[#1d2d3e] focus:border-[#0070f2] focus:bg-white focus:outline-none" />
                            <div id="req-arabic-keypad" class="hidden mt-2">
                                ${window.ArabicPlate ? window.ArabicPlate.renderArabicKeypad('req-plate-input') : ''}
                            </div>
                        </div>

                        <!-- Driver Info Grid -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label class="block font-bold text-[#1d2d3e] mb-1">اسم السائق:</label>
                                <input type="text" id="req-driver-name" placeholder="اسم السائق" class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl px-3 py-2 text-xs font-bold text-[#1d2d3e] focus:border-[#0070f2] focus:outline-none" />
                            </div>
                            <div>
                                <label class="block font-bold text-[#1d2d3e] mb-1">رقم هاتف / واتساب السائق:</label>
                                <input type="tel" id="req-driver-phone" placeholder="01012345678" class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#1d2d3e] focus:border-[#0070f2] focus:outline-none" />
                            </div>
                        </div>

                        <!-- Company & Destination Grid -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label class="block font-bold text-[#1d2d3e] mb-1">الشركة / الجهة الموردة:</label>
                                <input type="text" id="req-company" placeholder="اسم الشركة الموردة" class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl px-3 py-2 text-xs font-semibold text-[#1d2d3e] focus:border-[#0070f2] focus:outline-none" />
                            </div>
                            <div>
                                <label class="block font-bold text-[#1d2d3e] mb-1">الوجهة داخل المصنع:</label>
                                <select id="req-destination" class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl px-3 py-2 text-xs font-bold text-[#1d2d3e] focus:border-[#0070f2] focus:outline-none">
                                    ${destinations.map(d => `<option value="${d}">${d}</option>`).join('')}
                                </select>
                            </div>
                        </div>

                        <!-- Cargo & Inspection Notes -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label class="block font-bold text-[#1d2d3e] mb-1">بيانات وتفاصيل الحمولة:</label>
                                <input type="text" id="req-cargo" placeholder="مثال: شحنة براميل كيماويات 10 طن" class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl px-3 py-2 text-xs text-[#1d2d3e] focus:border-[#0070f2] focus:outline-none" />
                            </div>
                            <div>
                                <label class="block font-bold text-[#1d2d3e] mb-1">سبب الاستئذان / ملاحظات الحارس للمدير:</label>
                                <input type="text" id="req-notes" placeholder="مثال: شاحنة بدون تصريح مسبق تطلب تسليم عاجل" class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl px-3 py-2 text-xs text-[#1d2d3e] focus:border-[#0070f2] focus:outline-none" />
                            </div>
                        </div>

                        <!-- MULTI-PHOTO UPLOAD SECTION (PLATE PHOTO + CARRIAGE PHOTO) -->
                        <div class="pt-2 border-t border-[#d7e2ee]">
                            <div class="font-black text-xs text-[#002b66] mb-2 flex items-center gap-1.5">
                                <span>📸</span>
                                <span>إرفاق الصور الإلزامية للمدير (صورة لوحة السيارة + صورة صندوق الحمولة):</span>
                            </div>
                            
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                
                                <!-- PHOTO SLOT 1: CAR PLATE PHOTO -->
                                <div class="p-3 bg-[#f8fafc] rounded-2xl border-2 border-dashed border-[#b0cfee] hover:border-[#0070f2] transition-all">
                                    <div class="font-bold text-[11px] text-[#002b66] mb-1.5 flex items-center justify-between">
                                        <span>1️⃣ صورة لوحة السيارة (Car Plate)</span>
                                        <span id="plate-photo-status" class="text-[10px] text-[#8fa4b8]">لم يتم التقاط صورة</span>
                                    </div>
                                    <label class="cursor-pointer flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-[#d7e2ee] hover:bg-[#ebf3fb] transition-all">
                                        <span class="text-2xl mb-1">🚘</span>
                                        <span class="text-[11px] font-bold text-[#0070f2]">التقاط أو رفع صورة اللوحة</span>
                                        <span class="text-[9px] text-[#8fa4b8]">كاميرا الجوال / ملف</span>
                                        <input type="file" accept="image/*" capture="environment" onchange="Officer.handleInspectionPhoto(event, 'plate')" class="hidden" />
                                    </label>
                                    <div id="plate-photo-preview" class="hidden mt-2 text-center relative">
                                        <img src="" alt="لوحة السيارة" class="w-full h-28 object-cover rounded-xl border border-emerald-300 shadow-sm" />
                                        <span class="absolute top-1 right-1 px-2 py-0.5 bg-emerald-600 text-white rounded-md text-[9px] font-bold">✅ تم إرفاق اللوحة</span>
                                    </div>
                                </div>

                                <!-- PHOTO SLOT 2: CAR CARRIAGE / CARGO PHOTO -->
                                <div class="p-3 bg-[#f8fafc] rounded-2xl border-2 border-dashed border-[#b0cfee] hover:border-[#0070f2] transition-all">
                                    <div class="font-bold text-[11px] text-[#002b66] mb-1.5 flex items-center justify-between">
                                        <span>2️⃣ صورة صندوق / حمولة الشاحنة (Carriage)</span>
                                        <span id="carriage-photo-status" class="text-[10px] text-[#8fa4b8]">لم يتم التقاط صورة</span>
                                    </div>
                                    <label class="cursor-pointer flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-[#d7e2ee] hover:bg-[#ebf3fb] transition-all">
                                        <span class="text-2xl mb-1">📦</span>
                                        <span class="text-[11px] font-bold text-[#0070f2]">التقاط أو رفع صورة الصندوق</span>
                                        <span class="text-[9px] text-[#8fa4b8]">كاميرا الجوال / ملف</span>
                                        <input type="file" accept="image/*" capture="environment" onchange="Officer.handleInspectionPhoto(event, 'carriage')" class="hidden" />
                                    </label>
                                    <div id="carriage-photo-preview" class="hidden mt-2 text-center relative">
                                        <img src="" alt="صندوق الشاحنة" class="w-full h-28 object-cover rounded-xl border border-emerald-300 shadow-sm" />
                                        <span class="absolute top-1 right-1 px-2 py-0.5 bg-emerald-600 text-white rounded-md text-[9px] font-bold">✅ تم إرفاق الصندوق</span>
                                    </div>
                                </div>

                            </div>
                        </div>

                        <!-- Footer Actions -->
                        <div class="flex justify-end gap-2 pt-3 border-t border-[#d7e2ee]">
                            <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="px-4 py-2.5 sap-btn-secondary text-xs font-bold">
                                إلغاء
                            </button>
                            <button type="submit" class="px-6 py-2.5 sap-btn-primary text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 transition-all">
                                <span>🚀</span>
                                <span>إرسال الطلب والصور للمدير فورا</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    async handleInspectionPhoto(event, photoType) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        try {
            let dataUrl;
            if (window.DB && typeof window.DB.compressImage === 'function') {
                dataUrl = await window.DB.compressImage(file, 800, 0.75);
            } else {
                dataUrl = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.readAsDataURL(file);
                });
            }

            if (!this._inspectionPhotos) this._inspectionPhotos = {};
            this._inspectionPhotos[photoType] = dataUrl;

            const previewContainer = document.getElementById(`${photoType}-photo-preview`);
            const statusSpan = document.getElementById(`${photoType}-photo-status`);
            if (previewContainer) {
                const img = previewContainer.querySelector('img');
                if (img) img.src = dataUrl;
                previewContainer.classList.remove('hidden');
            }
            if (statusSpan) {
                statusSpan.innerHTML = '<span class="text-[#107e3e] font-bold">✅ تم الالتقاط</span>';
            }
        } catch (err) {
            console.error('Error handling inspection photo:', err);
        }
    }

    submitInspectionRequest(event) {
        if (event && event.preventDefault) event.preventDefault();

        const plate = document.getElementById('req-plate-input')?.value.trim();
        if (!plate) {
            alert(window.i18n ? (window.i18n.getLang() === 'ar' ? 'يرجى إدخال رقم لوحة المركبة' : 'Please enter plate number') : 'يرجى إدخال رقم لوحة المركبة');
            return;
        }

        const user = (window.Auth && typeof window.Auth.getCurrentUser === 'function' ? window.Auth.getCurrentUser() : null) || { id: 2, name_ar: 'أمين الشرطة طارق', gate_assigned: 'بوابة 1 الرئيسية - دوترا' };
        const rosterInfo = (window.DB && typeof window.DB.getOfficerRoster === 'function' ? window.DB.getOfficerRoster(user.id) : null) || {
            gate_name: user.gate_assigned || 'بوابة 1 الرئيسية - دوترا',
            shift: 'day',
            shift_name_ar: 'وردية النهار (صباحية)'
        };
        const driverName = document.getElementById('req-driver-name')?.value.trim() || 'سائق زائر';
        const driverPhone = document.getElementById('req-driver-phone')?.value.trim() || '';
        const company = document.getElementById('req-company')?.value.trim() || 'مورد عام';
        const destination = document.getElementById('req-destination')?.value || 'المستودع الرئيسي';
        const cargo = document.getElementById('req-cargo')?.value.trim() || 'بضائع ومستلزمات عامة';
        const notes = document.getElementById('req-notes')?.value.trim() || 'طلب استئذان فحص ودخول عاجل';

        const platePhoto = this._inspectionPhotos?.plate || null;
        const carriagePhoto = this._inspectionPhotos?.carriage || null;

        const req = window.DB.createInspectionRequest({
            plate_ar: plate,
            plate_en: plate,
            driver_name: driverName,
            driver_phone: driverPhone,
            company: company,
            destination: destination,
            cargo_details: cargo,
            notes: notes,
            plate_photo_url: platePhoto,
            carriage_photo_url: carriagePhoto,
            officer_id: user.id || 2,
            gate_name: rosterInfo.gate_name || user.gate_assigned || 'بوابة 1 الرئيسية - دوترا'
        });

        this.activePendingRequestId = req.id;

        // Show Officer Real-Time Pending Tracker Modal
        const modalContainer = document.getElementById('modal-container');
        if (modalContainer) {
            modalContainer.innerHTML = `
                <div class="sap-modal-overlay">
                    <div id="officer-inspection-tracker-card" class="sap-modal-content max-w-md w-full p-6 text-center animate-scaleUp" dir="rtl">
                        <div class="w-16 h-16 rounded-2xl bg-[#ebf3fb] text-[#0070f2] flex items-center justify-center mx-auto mb-3 text-3xl shadow-sm">
                            ⏳
                        </div>
                        <h3 class="text-base font-black text-[#002b66] mb-1">
                            تم إرسال طلب الاستئذان والصور للمدير بنجاح!
                        </h3>
                        <p class="text-xs text-[#556b82] mb-3">
                            المركبة: <b class="text-[#002b66] font-mono">${req.plate_ar}</b> • السائق: <b>${req.driver_name}</b>
                        </p>
                        <div class="bg-[#fff8eb] p-3 rounded-2xl border border-[#ffc966] text-xs text-[#b85500] mb-4 font-bold flex items-center justify-center gap-2">
                            <span class="w-2.5 h-2.5 rounded-full bg-[#b85500] animate-ping"></span>
                            <span>بانتظار مراجعة وقرار مدير العمليات الآن...</span>
                        </div>
                        <p class="text-[11px] text-[#556b82] mb-4">
                            ستتحدث هذه النافذة فوراً عند اتخاذ المدير لقرار الموافقة أو الرفض تلقائياً.
                        </p>
                        <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="px-5 py-2.5 sap-btn-secondary text-xs font-bold">
                            إغلاق ومتابعة العمل
                        </button>
                    </div>
                </div>
            `;
        }

        if (window.App && typeof window.App.showToast === 'function') {
            window.App.showToast('🚨 طلب استئذان مرسل', `تم إرسال طلب الشاحنة (${plate}) لمدير العمليات للمراجعة.`, 'warning');
        }
    }

    handleInspectionDecision(data) {
        if (!data) return;
        const modalContainer = document.getElementById('modal-container');
        const trackerCard = document.getElementById('officer-inspection-tracker-card');
        if ((trackerCard || modalContainer) && (!this.activePendingRequestId || this.activePendingRequestId === data.request_id)) {
            const isApproved = data.status === 'approved';
            const html = `
                <div class="sap-modal-overlay">
                    <div id="officer-inspection-tracker-card" class="sap-modal-content max-w-md w-full p-6 text-center animate-scaleUp" dir="rtl">
                        <div class="w-16 h-16 rounded-2xl ${isApproved ? 'bg-[#f0fdf4] text-[#107e3e]' : 'bg-[#fdf2f2] text-[#bb0000]'} flex items-center justify-center mx-auto mb-3 text-3xl shadow-sm">
                            ${isApproved ? '✅' : '⛔'}
                        </div>
                        <h3 class="text-base font-black ${isApproved ? 'text-[#107e3e]' : 'text-[#bb0000]'} mb-1">
                            ${isApproved ? 'تمت موافقة واعتماد دخول الشاحنة!' : 'تم رفض طلب الدخول من المدير'}
                        </h3>
                        <p class="text-xs text-[#556b82] mb-3">
                            المركبة: <b class="text-[#002b66] font-mono">${data.plate}</b>
                            ${isApproved && data.pin_code ? ` • كود التحقق: <b class="text-[#0070f2] font-mono">${data.pin_code}</b>` : ''}
                        </p>
                        <div class="${isApproved ? 'bg-[#f0fdf4] text-[#107e3e] border-[#b4e3c4]' : 'bg-[#fdf2f2] text-[#bb0000] border-[#f8b4b4]'} p-3 rounded-2xl border text-xs font-bold mb-4">
                            ${isApproved ? `🎫 رقم التصريح المعتمد: ${data.permit_code || ''}` : `ملاحظات الرفض: ${data.manager_notes || 'مرفوض'}`}
                        </div>
                        <div class="flex justify-center gap-2">
                            ${isApproved ? `
                                <button type="button" onclick="Officer.quickAdmitExpectedVehicle('${data.pin_code || data.plate}')" class="px-5 py-2.5 sap-btn-primary text-xs font-bold shadow-md">
                                    ⚡ فتح وفحص التصريح فوراً
                                </button>
                            ` : ''}
                            <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="px-5 py-2.5 sap-btn-secondary text-xs font-bold">
                                إغلاق
                            </button>
                        </div>
                    </div>
                </div>
            `;
            if (modalContainer) modalContainer.innerHTML = html;
            else if (trackerCard) trackerCard.innerHTML = html;
        }
    }

    openRequestHoldModal(permitId) {
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) return;
        const lang = window.i18n.getLang();
        const icon = (name, cls = 'w-4 h-4') => window.Icons ? window.Icons.get(name, cls) : '';
        const permit = permitId ? window.DB.getPermits().find(p => String(p.id) === String(permitId)) : this.selectedPermit;
        const vehicle = this.selectedVehicle || (permit ? window.DB.getVehicles().find(v => v.id === permit.vehicle_id) : null);

        modalContainer.innerHTML = `
            <div class="sap-modal-overlay fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onclick="if(event.target === this) document.getElementById('modal-container').innerHTML = ''">
                <div class="sap-modal-content bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-amber-300 animate-scaleUp max-h-[92vh] overflow-y-auto text-right" dir="rtl">
                    <div class="flex justify-between items-center pb-3 border-b border-[#d7e2ee]">
                        <div class="flex items-center gap-2.5">
                            <div class="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-lg border border-amber-300">
                                ⚠️
                            </div>
                            <div>
                                <h3 class="text-base font-black text-[#002b66]">
                                    ${lang === 'ar' ? 'طلب تعليق أو سحب تصريح للمدير' : 'Request Permit Hold / Revocation'}
                                </h3>
                                <p class="text-xs text-[#556b82]">
                                    ${lang === 'ar' ? 'إرسال إشعار فوري لمدير العمليات لتجميد أو سحب التصريح' : 'Send instant alert to manager to suspend pass'}
                                </p>
                            </div>
                        </div>
                        <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm">✕</button>
                    </div>

                    <form onsubmit="Officer.submitRequestHold(event, '${permit ? permit.id : ''}')" class="py-4 space-y-4 text-xs">
                        <div class="bg-[#f8fafc] p-3.5 rounded-2xl border border-[#d7e2ee] space-y-2">
                            <div class="flex justify-between items-center">
                                <span class="text-[#556b82] font-bold">رقم لوحة المركبة:</span>
                                <span class="font-black text-sm text-[#002b66]">${vehicle ? vehicle.plate_ar : 'مركبة غير محددة'}</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-[#556b82] font-bold">اسم السائق:</span>
                                <span class="font-bold text-[#1d2d3e]">${vehicle ? (vehicle.driver_name_ar || vehicle.driver_name_en) : 'سائق زائر'}</span>
                            </div>
                            ${permit ? `
                                <div class="flex justify-between items-center">
                                    <span class="text-[#556b82] font-bold">كود التصريح:</span>
                                    <span class="font-mono font-bold text-[#0070f2]">${permit.permit_code} (PIN: ${permit.pin_code})</span>
                                </div>
                            ` : ''}
                        </div>

                        <div>
                            <label class="block font-bold text-[#1d2d3e] mb-1.5">
                                ${lang === 'ar' ? 'نوع الإجراء المطلوب من المدير:' : 'Requested Action:'}
                            </label>
                            <div class="grid grid-cols-2 gap-2">
                                <label class="flex items-center gap-2 p-2.5 rounded-xl border border-amber-300 bg-amber-50 cursor-pointer">
                                    <input type="radio" name="hold_request_type" value="hold" checked class="text-amber-600" />
                                    <span class="font-bold text-amber-900">⏸️ تعليق مؤقت (Hold)</span>
                                </label>
                                <label class="flex items-center gap-2 p-2.5 rounded-xl border border-red-300 bg-red-50 cursor-pointer">
                                    <input type="radio" name="hold_request_type" value="revoke" class="text-red-600" />
                                    <span class="font-bold text-red-900">⛔ سحب وإلغاء نهائي</span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label class="block font-bold text-[#1d2d3e] mb-1">
                                ${lang === 'ar' ? 'سبب طلب التعليق / السحب:' : 'Reason for request:'}
                            </label>
                            <select id="hold-request-reason" required class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl p-2.5 text-xs font-bold text-[#1d2d3e]">
                                <option value="عدم تطابق بيانات السائق مع التصريح">عدم تطابق بيانات السائق مع التصريح</option>
                                <option value="تلف أو تسريب أو حمولة غير مطابقة">تلف أو تسريب أو حمولة غير مطابقة</option>
                                <option value="عدم وجود أو استكمال الفواتير وأذونات الصرف">عدم وجود أو استكمال الفواتير وأذونات الصرف</option>
                                <option value="اشتباه أمني أو سلوك غير لائق">اشتباه أمني أو سلوك غير لائق</option>
                                <option value="مخالفة معايير السلامة والأمان المهني">مخالفة معايير السلامة والأمان المهني</option>
                                <option value="أخرى">أخرى (موضحة بالملاحظات)</option>
                            </select>
                        </div>

                        <div>
                            <label class="block font-bold text-[#1d2d3e] mb-1">
                                ${lang === 'ar' ? 'تفاصيل وملاحظات الضابط للمدير:' : 'Officer Notes:'}
                            </label>
                            <textarea id="hold-request-notes" rows="3" placeholder="اكتب ملاحظاتك وتفاصيل الحالة لمدير العمليات..." class="w-full bg-[#f8fafc] border border-[#d7e2ee] rounded-xl p-3 text-xs text-[#1d2d3e] focus:border-[#0070f2] focus:outline-none"></textarea>
                        </div>

                        <div class="flex justify-end gap-2 pt-3 border-t border-[#d7e2ee]">
                            <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="px-4 py-2 sap-btn-secondary text-xs">
                                ${lang === 'ar' ? 'إلغاء' : 'Cancel'}
                            </button>
                            <button type="submit" class="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5">
                                <span>📤</span>
                                <span>${lang === 'ar' ? 'إرسال الطلب لمدير العمليات' : 'Send to Manager'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    submitRequestHold(event, permitId) {
        if (event && event.preventDefault) event.preventDefault();
        const user = window.Auth ? window.Auth.getCurrentUser() : { id: 2, name_ar: 'ضابط البوابة', gate_assigned: 'بوابة 1 الرئيسية - دوترا' };
        const permit = permitId ? window.DB.getPermits().find(p => String(p.id) === String(permitId)) : this.selectedPermit;
        const vehicle = this.selectedVehicle || (permit ? window.DB.getVehicles().find(v => v.id === permit.vehicle_id) : null);

        const requestType = document.querySelector('input[name="hold_request_type"]:checked')?.value || 'hold';
        const reason = document.getElementById('hold-request-reason')?.value || 'مراجعة أمنية';
        const notes = document.getElementById('hold-request-notes')?.value || '';

        const newReq = window.DB.createPermitHoldRequest({
            permit_id: permit ? permit.id : null,
            vehicle_id: vehicle ? vehicle.id : null,
            plate_ar: vehicle ? vehicle.plate_ar : '',
            driver_name: vehicle ? (vehicle.driver_name_ar || vehicle.driver_name_en) : 'سائق مصرح',
            officer_id: user.id,
            gate_name: user.gate_assigned || 'بوابة 1 الرئيسية - دوترا',
            request_type: requestType,
            reason: reason,
            notes: notes
        });

        document.getElementById('modal-container').innerHTML = '';

        if (window.App && typeof window.App.showToast === 'function') {
            window.App.showToast(
                '⚠️ تم إرسال طلب التعليق',
                `تم إرسال إشعار لمدير العمليات بطلب ${requestType === 'revoke' ? 'سحب' : 'تعليق'} التصريح (${newReq.plate_ar}).`,
                'warning'
            );
        }
    }
}

// Global Singleton
window.Officer = new OfficerController();

OfficerController.prototype.search = function(q) { return this.handlePlateSearch(q); };
OfficerController.prototype.keypadPress = function(k) { if (window.ArabicPlate && typeof window.ArabicPlate.insertKey === 'function') window.ArabicPlate.insertKey('officer-plate-input', k); };
OfficerController.prototype.keypadBackspace = function() { if (window.ArabicPlate && typeof window.ArabicPlate.backspaceKey === 'function') window.ArabicPlate.backspaceKey('officer-plate-input'); };
OfficerController.prototype.keypadClear = function() { if (window.ArabicPlate && typeof window.ArabicPlate.clearKey === 'function') window.ArabicPlate.clearKey('officer-plate-input'); };
OfficerController.prototype.handleAdmit = function(cargo) { return this.recordAction('admitted', cargo); };
OfficerController.prototype.handleExit = function() { return this.recordAction('exited'); };
OfficerController.prototype.handleDeny = function(reason) { return this.recordAction('denied', reason); };

window.openInspectionRequestModal = function(plate) {
    if (window.Officer && typeof window.Officer.openInspectionRequestModal === 'function') {
        window.Officer.openInspectionRequestModal(plate);
    }
};
window.openRequestHoldModal = function(permitId) {
    if (window.Officer && typeof window.Officer.openRequestHoldModal === 'function') {
        window.Officer.openRequestHoldModal(permitId);
    }
};
window.openReloadCargoModal = function(vehicleId, permitId) {
    if (window.Officer && typeof window.Officer.openReloadCargoModal === 'function') {
        window.Officer.openReloadCargoModal(vehicleId, permitId);
    }
};

