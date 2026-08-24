// Gate Officer Mobile Terminal Controller
// وحدة تحكم حارس البوابة وتفتيش وتصريح المركبات

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
        const user = window.Auth.getCurrentUser() || { name_ar: 'الضابط المناوب', name_en: 'Duty Officer', gate_assigned: 'Gate 1' };
        const logs = window.DB.getLogs().slice().reverse().slice(0, 5); // Recent 5

        container.innerHTML = `
            <div class="max-w-xl mx-auto pb-12" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                <!-- Officer & Gate Header Banner -->
                <div class="glass-panel p-4 rounded-2xl border border-sky-600/30 mb-4 flex items-center justify-between shadow-xl">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center text-2xl shadow-md">
                            👮
                        </div>
                        <div>
                            <div class="flex items-center gap-1.5">
                                <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                <span class="text-xs font-bold text-emerald-400 uppercase font-mono">${user.badge_id || 'GT-01'}</span>
                                <span class="text-xs text-slate-400">•</span>
                                <span class="text-xs font-bold text-slate-300">${user.gate_assigned || 'Gate 1'}</span>
                            </div>
                            <h2 class="text-base font-bold text-white">${lang === 'ar' ? user.name_ar : user.name_en}</h2>
                        </div>
                    </div>
                    <button type="button" onclick="Officer.openUnplannedModal()" class="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-xl border border-slate-700 text-xs font-bold flex items-center gap-1 shadow">
                        <span>➕</span>
                        <span>${lang === 'ar' ? 'زائر طارئ' : 'Walk-in'}</span>
                    </button>
                </div>

                <!-- Search Plate & Camera Scanner Box -->
                <div class="glass-card p-4 rounded-2xl border border-slate-700 shadow-2xl mb-4">
                    <label class="block text-xs font-bold text-slate-300 mb-2 flex justify-between items-center">
                        <span>${lang === 'ar' ? '🔍 أدخل رقم اللوحة أو امسح الباركود:' : '🔍 Enter License Plate or Scan QR:'}</span>
                        <button type="button" onclick="Officer.toggleKeypad()" class="text-sky-400 hover:text-sky-300 text-xs flex items-center gap-1">
                            <span>⌨️</span>
                            <span>${window.i18n.t('arabicKeyboard')}</span>
                        </button>
                    </label>

                    <div class="relative">
                        <input type="text" id="officer-plate-input" autofocus placeholder="${window.i18n.t('searchPlatePlaceholder')}" class="w-full bg-slate-950 border-2 border-sky-600/60 rounded-xl px-4 py-3 text-white font-bold text-lg focus:border-sky-400 focus:outline-none placeholder-slate-500 shadow-inner" oninput="Officer.handlePlateSearch(this.value)" />
                        <button type="button" onclick="Officer.clearSearch()" class="absolute ${lang === 'ar' ? 'left-3' : 'right-3'} top-3 text-slate-400 hover:text-white text-base">
                            ✕
                        </button>
                    </div>

                    <!-- On-screen Arabic Plate Keypad -->
                    <div id="officer-arabic-keypad" class="hidden">
                        ${window.ArabicPlate.renderArabicKeypad('officer-plate-input')}
                    </div>

                    <!-- Scan QR Camera Button -->
                    <div class="mt-3">
                        <button type="button" id="scan-qr-btn" onclick="Officer.toggleCameraScanner()" class="w-full py-3 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-sky-300 border border-sky-700/50 font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg transition-all">
                            <span>📷</span>
                            <span id="scan-qr-text">${window.i18n.t('openScanner')}</span>
                        </button>
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
                <div class="glass-panel p-4 rounded-2xl border border-slate-800 shadow-lg">
                    <div class="flex justify-between items-center mb-3">
                        <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <span>🕒</span>
                            <span>${lang === 'ar' ? 'آخر حركات هذه البوابة' : 'Recent Activity on this Gate'}</span>
                        </h3>
                        <span class="text-[10px] text-slate-500 font-mono">LIVE SYNC</span>
                    </div>
                    <div class="space-y-2">
                        ${this.renderRecentLogs(logs, lang)}
                    </div>
                </div>
            </div>
        `;
    }

    renderDefaultPrompt(lang) {
        return `
            <div class="glass-card p-8 rounded-2xl border border-slate-800/80 text-center shadow-inner">
                <div class="text-5xl mb-3 animate-bounce">🚘</div>
                <h3 class="text-base font-bold text-white mb-1">
                    ${lang === 'ar' ? 'في انتظار فحص مركبة' : 'Waiting to Verify Vehicle'}
                </h3>
                <p class="text-xs text-slate-400 max-w-xs mx-auto">
                    ${lang === 'ar' ? 'اكتب رقم لوحة المركبة أو اضغط على مسح الكاميرا لقراءة تصريح السائق فورياً' : 'Type license plate or scan QR code on the driver mobile to verify authorization'}
                </p>
            </div>
        `;
    }

    toggleKeypad() {
        const keypad = document.getElementById('officer-arabic-keypad');
        if (keypad) {
            keypad.classList.toggle('hidden');
        }
    }

    clearSearch() {
        const input = document.getElementById('officer-plate-input');
        if (input) {
            input.value = '';
            input.focus();
        }
        document.getElementById('vehicle-verification-result').innerHTML = this.renderDefaultPrompt(window.i18n.getLang());
    }

    handlePlateSearch(query) {
        if (!query || query.trim().length === 0) {
            document.getElementById('vehicle-verification-result').innerHTML = this.renderDefaultPrompt(window.i18n.getLang());
            return;
        }

        const vehicle = window.DB.findVehicleByPlate(query);
        if (vehicle) {
            const permit = window.DB.findPermitByCodeOrVehicle(null, vehicle.id);
            this.showVehicleCard(vehicle, permit);
        } else {
            this.showUnregisteredCard(query);
        }
    }

    showVehicleCard(vehicle, permit) {
        const lang = window.i18n.getLang();
        const container = document.getElementById('vehicle-verification-result');
        if (!container) return;

        const isInside = window.DB.isVehicleInside(vehicle.id);
        const isBanned = vehicle.status === 'blacklist';
        const isPermitActive = permit && permit.status === 'active';

        let headerStatusClass = 'bg-slate-900 border-slate-700';
        let statusTitle = '';

        if (isBanned) {
            headerStatusClass = 'bg-rose-950/70 border-rose-600/70 text-rose-300';
            statusTitle = `⛔ ${window.i18n.t('statusBanned')}`;
        } else if (isInside) {
            headerStatusClass = 'bg-emerald-950/60 border-emerald-600/60 text-emerald-300';
            statusTitle = `🟢 ${window.i18n.t('statusInside')}`;
        } else if (isPermitActive || vehicle.status === 'whitelist') {
            headerStatusClass = 'bg-sky-950/60 border-sky-600/60 text-sky-300';
            statusTitle = `✅ ${window.i18n.t('statusAuthorized')}`;
        } else {
            headerStatusClass = 'bg-amber-950/60 border-amber-600/60 text-amber-300';
            statusTitle = `⏳ ${window.i18n.t('statusPending')}`;
        }

        container.innerHTML = `
            <div class="glass-card rounded-2xl border-2 ${headerStatusClass} shadow-2xl p-5 relative animate-fadeIn" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                
                <!-- Status Banner -->
                <div class="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
                    <span class="px-3 py-1 rounded-full text-xs font-bold border ${headerStatusClass}">
                        ${statusTitle}
                    </span>
                    <span class="text-xs font-mono text-slate-400">
                        ${permit ? permit.permit_code : (vehicle.status === 'whitelist' ? 'PERMANENT PASS' : 'NO ACTIVE PASS')}
                    </span>
                </div>

                <!-- Authentic Arabic Plate View -->
                <div class="flex justify-center my-3">
                    ${window.ArabicPlate.renderArabicPlate(vehicle.plate_ar, vehicle.plate_en, 'large', vehicle.vehicle_type)}
                </div>

                <!-- Driver & Cargo Info Card -->
                <div class="bg-slate-950/90 rounded-xl p-3.5 border border-slate-800/80 my-4 text-xs space-y-2">
                    <div class="flex justify-between items-center">
                        <span class="text-slate-400">${window.i18n.t('driverName')}:</span>
                        <span class="font-bold text-white text-sm">${lang === 'ar' ? vehicle.driver_name_ar : vehicle.driver_name_en}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-slate-400">${window.i18n.t('company')}:</span>
                        <span class="font-semibold text-slate-200">${lang === 'ar' ? vehicle.company_ar : vehicle.company_en}</span>
                    </div>
                    ${permit ? `
                        <div class="flex justify-between items-center">
                            <span class="text-slate-400">${window.i18n.t('destination')}:</span>
                            <span class="font-bold text-sky-400">${lang === 'ar' ? permit.destination_ar : permit.destination_en}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-slate-400">${window.i18n.t('purpose')}:</span>
                            <span class="text-slate-300">${lang === 'ar' ? permit.purpose_ar : permit.purpose_en}</span>
                        </div>
                        ${permit.cargo_details ? `
                            <div class="flex justify-between items-center">
                                <span class="text-slate-400">${window.i18n.t('cargo')}:</span>
                                <span class="text-amber-300 font-medium">${permit.cargo_details}</span>
                            </div>
                        ` : ''}
                    ` : ''}
                </div>

                <!-- Blacklist Alert Warning -->
                ${isBanned ? `
                    <div class="bg-rose-950 border border-rose-700 p-3 rounded-xl mb-4 text-rose-200 text-xs font-bold flex items-start gap-2">
                        <span class="text-lg">⚠️</span>
                        <div>
                            <p>${window.i18n.t('blacklistedAlert')}</p>
                            <p class="text-[11px] font-normal text-rose-300 mt-0.5">${vehicle.blacklist_reason || 'مخالفة أمنية عامة'}</p>
                        </div>
                    </div>
                ` : ''}

                <!-- Large Tactile Mobile Action Buttons -->
                <div class="space-y-2.5">
                    ${!isBanned && !isInside ? `
                        <button type="button" onclick="Officer.executeEntry(${vehicle.id}, ${permit ? permit.id : 'null'})" class="w-full touch-btn bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black text-base shadow-xl flex items-center justify-center gap-2">
                            <span>✅</span>
                            <span>${window.i18n.t('allowEntry')}</span>
                        </button>
                    ` : ''}

                    ${!isBanned && isInside ? `
                        <button type="button" onclick="Officer.executeExit(${vehicle.id})" class="w-full touch-btn bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white font-black text-base shadow-xl flex items-center justify-center gap-2">
                            <span>🚪</span>
                            <span>${window.i18n.t('recordExit')}</span>
                        </button>
                    ` : ''}

                    <button type="button" onclick="Officer.executeDeny(${vehicle.id})" class="w-full touch-btn bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/80 font-bold text-xs flex items-center justify-center gap-2">
                        <span>⛔</span>
                        <span>${window.i18n.t('denyAccess')}</span>
                    </button>
                </div>
            </div>
        `;
    }

    showUnregisteredCard(query) {
        const lang = window.i18n.getLang();
        const container = document.getElementById('vehicle-verification-result');
        if (!container) return;

        container.innerHTML = `
            <div class="glass-card rounded-2xl border border-amber-600/40 p-5 text-center shadow-xl animate-fadeIn" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                <div class="text-3xl mb-2">⚠️</div>
                <h4 class="text-sm font-bold text-amber-400 mb-1">
                    ${window.i18n.t('plateNotFound')}
                </h4>
                <p class="text-xs text-slate-400 mb-4 font-mono">${query}</p>
                
                <button type="button" onclick="Officer.openUnplannedModal('${query}')" class="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow text-xs flex items-center justify-center gap-2">
                    <span>➕</span>
                    <span>${lang === 'ar' ? 'تسجيل زائر جديد ومطالبة موافقة فورية' : 'Register Unplanned Visitor'}</span>
                </button>
            </div>
        `;
    }

    renderRecentLogs(logs, lang) {
        if (logs.length === 0) {
            return `<div class="text-center text-slate-500 py-3 text-xs">${lang === 'ar' ? 'لا توجد حركات مسجلة مؤخراً' : 'No recent logs'}</div>`;
        }

        const vehicles = window.DB.getVehicles();

        return logs.map(l => {
            const v = vehicles.find(item => item.id === l.vehicle_id) || {};
            const time = new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const isEntry = l.action_type === 'entry';
            const isDenied = l.action_type === 'denied';

            return `
                <div class="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                    <div class="flex items-center gap-2.5">
                        <span class="text-base">${isDenied ? '⛔' : isEntry ? '🟢' : '🚪'}</span>
                        <div>
                            <div class="font-bold text-white font-mono">${v.plate_ar || 'لوحة غير معروفة'}</div>
                            <div class="text-[11px] text-slate-400">${lang === 'ar' ? v.driver_name_ar : v.driver_name_en}</div>
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="font-mono text-slate-400 text-[11px]">${time}</span>
                        <div class="text-[10px] font-bold ${isDenied ? 'text-rose-400' : isEntry ? 'text-emerald-400' : 'text-sky-400'}">
                            ${isDenied ? 'ممنوع' : isEntry ? 'دخول' : 'خروج'}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    executeEntry(vehicleId, permitId) {
        const user = window.Auth.getCurrentUser();
        window.DB.recordEntry(vehicleId, permitId, user.id, user.gate_assigned || 'Gate 1', 'دخول مصرح عبر تطبيق الجوال');
        this.playBeep(true);
        alert(window.i18n.t('entrySuccess'));
        this.renderTerminal();
    }

    executeExit(vehicleId) {
        const user = window.Auth.getCurrentUser();
        const exitLog = window.DB.recordExit(vehicleId, user.id, user.gate_assigned || 'Gate 1', 'خروج نظامي');
        this.playBeep(true);
        alert(`${window.i18n.t('exitSuccess')} (مدة البقاء: ${exitLog.duration_minutes || 0} دقيقة)`);
        this.renderTerminal();
    }

    executeDeny(vehicleId) {
        const lang = window.i18n.getLang();
        const reason = prompt(window.i18n.t('denyReasonPrompt'), lang === 'ar' ? 'عدم وجود تصريح دخول مسبق' : 'No valid permit');
        if (reason) {
            const user = window.Auth.getCurrentUser();
            window.DB.recordDenied(vehicleId, user.id, user.gate_assigned || 'Gate 1', reason);
            this.playBeep(false);
            alert(window.i18n.t('deniedSuccess'));
            this.renderTerminal();
        }
    }

    toggleCameraScanner() {
        const scannerContainer = document.getElementById('scanner-container');
        const scanText = document.getElementById('scan-qr-text');

        if (this.isScanning) {
            if (this.html5QrCode) {
                this.html5QrCode.stop().then(() => {
                    this.isScanning = false;
                    scannerContainer.classList.add('hidden');
                    scanText.innerText = window.i18n.t('openScanner');
                });
            }
        } else {
            scannerContainer.classList.remove('hidden');
            scanText.innerText = window.i18n.t('closeScanner');
            this.startCamera();
        }
    }

    startCamera() {
        if (!window.Html5Qrcode) {
            alert('Camera scanner library loading...');
            return;
        }

        this.html5QrCode = new window.Html5Qrcode("qr-reader");
        this.html5QrCode.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText) => {
                this.onQrCodeScanned(decodedText);
            },
            (errorMessage) => {
                // scanning errors ignored
            }
        ).then(() => {
            this.isScanning = true;
        }).catch(err => {
            console.error("Camera start failed", err);
            alert("تعذر فتح الكاميرا، يرجى التأكد من منح الإذن للمتصفح.");
        });
    }

    onQrCodeScanned(decodedText) {
        try {
            // Stop scanning once code detected
            this.toggleCameraScanner();
            this.playBeep(true);

            // Parse json QR if possible
            let parsed = {};
            try {
                parsed = JSON.parse(decodedText);
            } catch {
                parsed = { permit: decodedText, plate: decodedText };
            }

            const plateInput = document.getElementById('officer-plate-input');
            if (plateInput) {
                plateInput.value = parsed.plate || parsed.permit;
            }

            const permit = window.DB.findPermitByCodeOrVehicle(parsed.permit, null);
            if (permit) {
                const vehicle = window.DB.getVehicles().find(v => v.id === permit.vehicle_id);
                if (vehicle) {
                    this.showVehicleCard(vehicle, permit);
                    return;
                }
            }

            // Fallback search plate
            this.handlePlateSearch(parsed.plate || decodedText);
        } catch (e) {
            console.error(e);
        }
    }

    playBeep(success = true) {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            if (success) {
                osc.frequency.setValueAtTime(800, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
                gain.gain.setValueAtTime(0.3, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
                osc.start();
                osc.stop(ctx.currentTime + 0.15);
            } else {
                osc.frequency.setValueAtTime(300, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.3);
                gain.gain.setValueAtTime(0.5, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
                osc.start();
                osc.stop(ctx.currentTime + 0.3);
            }
        } catch (e) {
            // Audio context not allowed or supported
        }
    }

    openUnplannedModal(prefillPlate = '') {
        const lang = window.i18n.getLang();
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) return;

        modalContainer.innerHTML = `
            <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                <div class="glass-panel w-full max-w-lg rounded-2xl border border-sky-500/50 shadow-2xl p-5 relative animate-fadeIn" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                    <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="absolute top-4 ${lang === 'ar' ? 'left-4' : 'right-4'} text-slate-400 hover:text-white text-xl font-bold">
                        ✕
                    </button>

                    <div class="flex items-center gap-2.5 mb-4 border-b border-slate-800 pb-3">
                        <div class="w-9 h-9 rounded-xl bg-sky-950 border border-sky-800 flex items-center justify-center text-lg">
                            ➕
                        </div>
                        <div>
                            <h3 class="text-base font-bold text-white">${lang === 'ar' ? 'تسجيل زائر مفاجئ / دخول مباشر' : 'Quick Walk-in Visitor Pass'}</h3>
                            <p class="text-xs text-slate-400">${lang === 'ar' ? 'تسجيل فوري للمركبة من قبل الضابط عند البوابة' : 'Instant on-gate vehicle entry registration'}</p>
                        </div>
                    </div>

                    <form onsubmit="Officer.submitUnplannedVisitor(event)">
                        <div class="mb-3">
                            <label class="block text-xs font-semibold text-slate-300 mb-1">${window.i18n.t('plateNumber')}</label>
                            <input type="text" id="unplanned-plate" required value="${prefillPlate}" placeholder="أ ب ج 1 2 3 4" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm focus:border-sky-500 focus:outline-none" />
                        </div>
                        <div class="grid grid-cols-2 gap-3 mb-3">
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 mb-1">${window.i18n.t('driverName')}</label>
                                <input type="text" id="unplanned-driver" required placeholder="اسم السائق" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:border-sky-500 focus:outline-none" />
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 mb-1">${window.i18n.t('company')}</label>
                                <input type="text" id="unplanned-company" required placeholder="الشركة / الغرض" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:border-sky-500 focus:outline-none" />
                            </div>
                        </div>
                        <div class="mb-4">
                            <label class="block text-xs font-semibold text-slate-400 mb-1">${window.i18n.t('destination')}</label>
                            <input type="text" id="unplanned-destination" required placeholder="المستودع / القسم المطلوب" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:border-sky-500 focus:outline-none" />
                        </div>
                        <div class="flex justify-end gap-2 pt-2 border-t border-slate-800">
                            <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs">
                                ${lang === 'ar' ? 'إلغاء' : 'Cancel'}
                            </button>
                            <button type="submit" class="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg">
                                ✅ ${lang === 'ar' ? 'تسجيل وسماح بالدخول فوراً' : 'Register & Authorize Entry'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    submitUnplannedVisitor(e) {
        e.preventDefault();
        const plate = document.getElementById('unplanned-plate').value.trim();
        const driver = document.getElementById('unplanned-driver').value.trim();
        const company = document.getElementById('unplanned-company').value.trim();
        const destination = document.getElementById('unplanned-destination').value.trim();

        const vehicle = window.DB.addVehicle({
            plate_ar: plate,
            plate_en: plate,
            vehicle_type: 'truckMedium',
            driver_name_ar: driver,
            driver_name_en: driver,
            company_ar: company,
            company_en: company,
            status: 'visitor'
        });

        const permit = window.DB.addPermit({
            vehicle_id: vehicle.id,
            destination_ar: destination,
            destination_en: destination,
            purpose_ar: 'زيارة طارئة / دخول مباشر',
            purpose_en: 'Direct walk-in entry',
            valid_from: new Date().toISOString(),
            valid_until: new Date(Date.now() + 4 * 3600000).toISOString()
        });

        const user = window.Auth.getCurrentUser();
        window.DB.recordEntry(vehicle.id, permit.id, user.id, user.gate_assigned || 'Gate 1', 'دخول زائر مفاجئ موثق من الضابط');

        document.getElementById('modal-container').innerHTML = '';
        this.playBeep(true);
        alert(window.i18n.t('entrySuccess'));
        this.renderTerminal();
    }
}

window.Officer = new OfficerController();
