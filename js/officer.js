// Gate Officer Mobile Terminal Controller (SAP Blue & White Edition)
// وحدة تحكم حارس البوابة - نمط ساب أزرق وأبيض

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

        container.innerHTML = `
            <div class="max-w-xl mx-auto pb-12" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                <!-- Officer & Gate Header Banner (SAP Style) -->
                <div class="sap-card p-4 mb-4 flex items-center justify-between border-l-4 border-l-[#0070f2]">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 rounded-2xl bg-[#ebf3fb] text-[#0070f2] flex items-center justify-center text-2xl font-bold border border-[#b3d5fa] shadow-sm">
                            👮
                        </div>
                        <div>
                            <div class="flex items-center gap-1.5">
                                <span class="w-2.5 h-2.5 rounded-full bg-[#107e3e] animate-pulse"></span>
                                <span class="text-xs font-bold text-[#107e3e] uppercase font-mono">${user.badge_id || 'GT-01'}</span>
                                <span class="text-xs text-[#d7e2ee]">•</span>
                                <span class="text-xs font-bold text-[#556b82]">${user.gate_assigned || 'Gate 1'}</span>
                            </div>
                            <h2 class="text-base font-black text-[#002b66]">${lang === 'ar' ? user.name_ar : user.name_en}</h2>
                        </div>
                    </div>
                    <button type="button" onclick="Officer.openQuickWalkinModal()" class="px-3 py-2 bg-[#e5f6eb] hover:bg-[#cdeed7] text-[#107e3e] rounded-xl border border-[#b4e3c4] text-xs font-bold flex items-center gap-1 shadow-sm">
                        <span>⚡</span>
                        <span>${lang === 'ar' ? 'دخول فوري' : 'Walk-in'}</span>
                    </button>
                </div>

                <!-- Search Plate & Camera Scanner Box -->
                <div class="sap-panel p-5 shadow-md mb-4 bg-white">
                    <label class="block text-xs font-bold text-[#1d2d3e] mb-2 flex justify-between items-center">
                        <span>🔍 ${lang === 'ar' ? 'أدخل رقم اللوحة (حروف وأرقام):' : 'Enter License Plate:'}</span>
                        <button type="button" onclick="Officer.toggleKeypad()" class="text-[#0070f2] hover:text-[#005cbd] text-xs font-bold flex items-center gap-1">
                            <span>⌨️</span>
                            <span>${window.i18n.t('arabicKeyboard')}</span>
                        </button>
                    </label>

                    <div class="relative">
                        <input type="text" id="officer-plate-input" autofocus placeholder="ط ر ق ٩ ٨ ٢ ١ أو س ف ر 4520..." class="w-full bg-[#f8fafc] border-2 border-[#b0cfee] rounded-xl px-4 py-3 text-[#1d2d3e] font-black text-lg focus:border-[#0070f2] focus:bg-white focus:outline-none placeholder-[#94a3b8] shadow-inner" oninput="Officer.handlePlateSearch(this.value)" />
                        <button type="button" onclick="Officer.clearSearch()" class="absolute ${lang === 'ar' ? 'left-3' : 'right-3'} top-3 text-[#556b82] hover:text-[#1d2d3e] text-base font-bold">
                            ✕
                        </button>
                    </div>

                    <!-- On-screen Egyptian Plate Keypad -->
                    <div id="officer-arabic-keypad" class="hidden">
                        ${window.ArabicPlate.renderArabicKeypad('officer-plate-input')}
                    </div>

                    <!-- Scan QR Camera Button -->
                    <div class="mt-3">
                        <button type="button" id="scan-qr-btn" onclick="Officer.toggleCameraScanner()" class="w-full py-3 sap-btn-primary text-sm flex items-center justify-center gap-2 shadow-sm">
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
                <div class="sap-panel p-4 shadow-sm bg-white">
                    <div class="flex justify-between items-center mb-3">
                        <h3 class="text-xs font-bold text-[#556b82] uppercase tracking-wider flex items-center gap-1.5">
                            <span>🕒</span>
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

    renderDefaultPrompt(lang) {
        return `
            <div class="sap-card p-8 text-center bg-white border-dashed border-2 border-[#d7e2ee]">
                <div class="text-5xl mb-3 animate-bounce">🚘</div>
                <h3 class="text-base font-bold text-[#002b66] mb-1">
                    ${lang === 'ar' ? 'في انتظار فحص لوحة مركبة' : 'Waiting to Verify Vehicle'}
                </h3>
                <p class="text-xs text-[#556b82] max-w-xs mx-auto">
                    ${lang === 'ar' ? 'اكتب رقم اللوحة أو اضغط على مسح الكاميرا لقراءة الـ QR الخاص بالسائق فورياً' : 'Type license plate or scan QR code'}
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

        let headerStatusClass = 'bg-[#f5f8fc] border-[#d7e2ee]';
        let statusTitle = '';

        if (isBanned) {
            headerStatusClass = 'bg-[#ffebeb] border-[#f6b3b3] text-[#bb0000]';
            statusTitle = `⛔ ${window.i18n.t('statusBanned')}`;
        } else if (isInside) {
            headerStatusClass = 'bg-[#e5f6eb] border-[#b4e3c4] text-[#107e3e]';
            statusTitle = `🟢 ${window.i18n.t('statusInside')}`;
        } else if (isPermitActive || vehicle.status === 'whitelist') {
            headerStatusClass = 'bg-[#ebf3fb] border-[#b3d5fa] text-[#0070f2]';
            statusTitle = `✅ ${window.i18n.t('statusAuthorized')}`;
        } else {
            headerStatusClass = 'bg-[#fff1e5] border-[#f6d7b3] text-[#b85500]';
            statusTitle = `⏳ ${window.i18n.t('statusPending')}`;
        }

        container.innerHTML = `
            <div class="sap-panel rounded-2xl border-2 ${headerStatusClass} p-5 relative animate-fadeIn bg-white shadow-lg" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                
                <!-- Status Banner -->
                <div class="flex justify-between items-center border-b border-[#d7e2ee] pb-3 mb-4">
                    <span class="px-3 py-1 rounded-full text-xs font-bold border ${headerStatusClass}">
                        ${statusTitle}
                    </span>
                    <span class="text-xs font-mono text-[#556b82] font-bold">
                        ${permit ? permit.permit_code : (vehicle.status === 'whitelist' ? 'PERMANENT PASS' : 'NO PASS')}
                    </span>
                </div>

                <!-- Egyptian Plate View -->
                <div class="flex justify-center my-3">
                    ${window.ArabicPlate.renderEgyptianPlate(vehicle.plate_ar, 'large', vehicle.vehicle_type)}
                </div>

                <!-- Driver Phone & Key Details Card -->
                <div class="bg-[#f8fafc] rounded-2xl p-4 border border-[#d7e2ee] my-4 text-xs space-y-2">
                    <div class="flex justify-between items-center bg-white p-2.5 rounded-xl border border-[#e7eff7]">
                        <span class="text-[#556b82] font-bold">📞 هاتف السائق:</span>
                        <a href="tel:${vehicle.driver_phone || ''}" class="font-mono font-black text-[#0070f2] text-sm hover:underline">
                            ${vehicle.driver_phone || 'غير مسجل'}
                        </a>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-[#556b82] font-bold">${window.i18n.t('driverName')}:</span>
                        <span class="font-bold text-[#1d2d3e] text-sm">${lang === 'ar' ? vehicle.driver_name_ar : vehicle.driver_name_en}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-[#556b82] font-bold">${window.i18n.t('company')}:</span>
                        <span class="font-semibold text-[#1d2d3e]">${lang === 'ar' ? vehicle.company_ar : vehicle.company_en}</span>
                    </div>
                </div>

                <!-- Blacklist Alert Warning -->
                ${isBanned ? `
                    <div class="bg-[#ffebeb] border border-[#f6b3b3] p-3 rounded-xl mb-4 text-[#bb0000] text-xs font-bold flex items-start gap-2">
                        <span class="text-lg">⚠️</span>
                        <div>
                            <p>${window.i18n.t('blacklistedAlert')}</p>
                            <p class="text-[11px] font-normal text-[#8a1f1d] mt-0.5">${vehicle.blacklist_reason || 'مخالفة أمنية عامة'}</p>
                        </div>
                    </div>
                ` : ''}

                <!-- Large Tactile Action Buttons -->
                <div class="space-y-2.5">
                    ${!isBanned && !isInside ? `
                        <button type="button" onclick="Officer.executeEntry(${vehicle.id}, ${permit ? permit.id : 'null'})" class="w-full touch-btn bg-[#107e3e] hover:bg-[#0c6b33] text-white font-black text-base shadow-md flex items-center justify-center gap-2">
                            <span>✅</span>
                            <span>${window.i18n.t('allowEntry')}</span>
                        </button>
                    ` : ''}

                    ${!isBanned && isInside ? `
                        <button type="button" onclick="Officer.executeExit(${vehicle.id})" class="w-full touch-btn bg-[#0070f2] hover:bg-[#005cbd] text-white font-black text-base shadow-md flex items-center justify-center gap-2">
                            <span>🚪</span>
                            <span>${window.i18n.t('recordExit')}</span>
                        </button>
                    ` : ''}

                    <button type="button" onclick="Officer.executeDeny(${vehicle.id})" class="w-full touch-btn bg-[#ffebeb] hover:bg-[#ffd6d6] text-[#bb0000] border border-[#f6b3b3] font-bold text-xs flex items-center justify-center gap-2">
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
            <div class="sap-card p-5 text-center bg-white border border-[#f6d7b3] shadow-md animate-fadeIn" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                <div class="text-3xl mb-2">⚠️</div>
                <h4 class="text-sm font-bold text-[#b85500] mb-1">
                    ${window.i18n.t('plateNotFound')}
                </h4>
                <p class="text-xs text-[#556b82] mb-4 font-mono">${query}</p>
                
                <button type="button" onclick="Officer.openQuickWalkinModal('${query}')" class="w-full py-3 sap-btn-primary text-xs flex items-center justify-center gap-2 shadow">
                    <span>⚡</span>
                    <span>${lang === 'ar' ? 'تسجيل فوري (لوحة + هاتف السائق)' : 'Instant Walk-in Registration'}</span>
                </button>
            </div>
        `;
    }

    renderRecentLogs(logs, lang) {
        if (logs.length === 0) {
            return `<div class="text-center text-[#556b82] py-3 text-xs font-semibold">${lang === 'ar' ? 'لا توجد حركات مسجلة' : 'No logs'}</div>`;
        }

        const vehicles = window.DB.getVehicles();

        return logs.map(l => {
            const v = vehicles.find(item => item.id === l.vehicle_id) || {};
            const time = new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const isEntry = l.action_type === 'entry';
            const isDenied = l.action_type === 'denied';

            return `
                <div class="p-2.5 bg-[#f8fafc] rounded-xl border border-[#e7eff7] flex items-center justify-between text-xs">
                    <div class="flex items-center gap-2.5">
                        <span class="text-base">${isDenied ? '⛔' : isEntry ? '🟢' : '🚪'}</span>
                        <div>
                            <div class="font-bold text-[#1d2d3e] font-mono">${v.plate_ar || 'لوحة غير معروفة'}</div>
                            <div class="text-[11px] text-[#0070f2] font-mono font-bold">${v.driver_phone || ''}</div>
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="font-mono text-[#556b82] text-[11px]">${time}</span>
                        <div class="text-[10px] font-bold ${isDenied ? 'text-[#bb0000]' : isEntry ? 'text-[#107e3e]' : 'text-[#0070f2]'}">
                            ${isDenied ? 'ممنوع' : isEntry ? 'دخول' : 'خروج'}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    executeEntry(vehicleId, permitId) {
        const user = window.Auth.getCurrentUser();
        window.DB.recordEntry(vehicleId, permitId, user.id, user.gate_assigned || 'Gate 1', 'دخول مصرح');
        this.playBeep(true);
        alert(window.i18n.t('entrySuccess'));
        this.renderTerminal();
    }

    executeExit(vehicleId) {
        const user = window.Auth.getCurrentUser();
        const exitLog = window.DB.recordExit(vehicleId, user.id, user.gate_assigned || 'Gate 1', 'خروج نظامي');
        this.playBeep(true);
        alert(`${window.i18n.t('exitSuccess')} (المدة: ${exitLog.duration_minutes || 0} دقيقة)`);
        this.renderTerminal();
    }

    executeDeny(vehicleId) {
        const lang = window.i18n.getLang();
        const reason = prompt(window.i18n.t('denyReasonPrompt'), lang === 'ar' ? 'عدم وجود تصريح دخول' : 'No permit');
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
            () => {}
        ).then(() => {
            this.isScanning = true;
        }).catch(err => {
            console.error("Camera start failed", err);
            alert("تعذر فتح الكاميرا، يرجى منح الإذن للمتصفح.");
        });
    }

    onQrCodeScanned(decodedText) {
        try {
            this.toggleCameraScanner();
            this.playBeep(true);

            let parsed = {};
            try {
                parsed = JSON.parse(decodedText);
            } catch {
                parsed = { permit: decodedText, plate: decodedText };
            }

            const plateInput = document.getElementById('officer-plate-input');
            if (plateInput) plateInput.value = parsed.plate || parsed.permit;

            const permit = window.DB.findPermitByCodeOrVehicle(parsed.permit, null);
            if (permit) {
                const vehicle = window.DB.getVehicles().find(v => v.id === permit.vehicle_id);
                if (vehicle) {
                    this.showVehicleCard(vehicle, permit);
                    return;
                }
            }

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
        } catch (e) {}
    }

    /**
     * Ultra-fast walk-in visitor form (SAP Blue & White Style)
     */
    openQuickWalkinModal(prefillPlate = '') {
        const lang = window.i18n.getLang();
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) return;

        modalContainer.innerHTML = `
            <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                <div class="sap-panel w-full max-w-md rounded-3xl border border-[#b0cfee] shadow-2xl p-6 relative animate-fadeIn bg-white" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
                    <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="absolute top-4 ${lang === 'ar' ? 'left-4' : 'right-4'} text-[#556b82] hover:text-[#1d2d3e] text-xl font-bold">
                        ✕
                    </button>

                    <div class="flex items-center gap-2.5 mb-4 border-b border-[#d7e2ee] pb-3">
                        <div class="w-10 h-10 rounded-2xl bg-[#e5f6eb] text-[#107e3e] flex items-center justify-center text-lg font-bold border border-[#b4e3c4]">
                            ⚡
                        </div>
                        <div>
                            <h3 class="text-base font-black text-[#002b66]">${lang === 'ar' ? 'تسجيل وسماح دخول فوري' : 'Fast Walk-in Access'}</h3>
                            <p class="text-xs text-[#107e3e] font-bold">${lang === 'ar' ? 'رقم اللوحة + هاتف السائق فقط' : 'Plate + Phone only'}</p>
                        </div>
                    </div>

                    <form onsubmit="Officer.submitQuickWalkin(event)">
                        <div class="mb-3">
                            <label class="block text-xs font-bold text-[#1d2d3e] mb-1">1️⃣ رقم اللوحة:</label>
                            <input type="text" id="walkin-plate" required value="${prefillPlate}" placeholder="ط ر ق ٩ ٨ ٢ ١" class="w-full bg-[#f8fafc] border-2 border-[#b0cfee] rounded-xl px-3 py-2.5 text-[#1d2d3e] font-black text-base focus:border-[#0070f2] focus:bg-white focus:outline-none" />
                        </div>
                        <div class="mb-4">
                            <label class="block text-xs font-bold text-[#1d2d3e] mb-1">2️⃣ رقم هاتف السائق:</label>
                            <input type="tel" id="walkin-phone" required placeholder="01012345678" class="w-full bg-[#f8fafc] border-2 border-[#b0cfee] rounded-xl px-3 py-2.5 text-[#1d2d3e] font-mono font-bold text-base focus:border-[#0070f2] focus:bg-white focus:outline-none" />
                        </div>
                        <div class="flex justify-end gap-2 pt-2 border-t border-[#d7e2ee]">
                            <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="px-4 py-2 sap-btn-secondary text-xs">
                                ${lang === 'ar' ? 'إلغاء' : 'Cancel'}
                            </button>
                            <button type="submit" class="flex-1 py-2.5 bg-[#107e3e] hover:bg-[#0c6b33] text-white font-black rounded-xl text-xs shadow-md">
                                ✅ ${lang === 'ar' ? 'سماح بالدخول فوراً' : 'Authorize Entry'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    submitQuickWalkin(e) {
        e.preventDefault();
        const plate = document.getElementById('walkin-plate').value.trim();
        const phone = document.getElementById('walkin-phone').value.trim();

        let vehicle = window.DB.findVehicleByPlate(plate);
        if (!vehicle) {
            vehicle = window.DB.addVehicle({
                plate_ar: plate,
                plate_en: plate,
                vehicle_type: 'truckHeavy',
                driver_name_ar: 'سائق زائر',
                driver_name_en: 'Visiting Driver',
                driver_phone: phone,
                company_ar: 'زيارة فورية',
                company_en: 'Direct Visitor',
                status: 'visitor'
            });
        } else {
            vehicle.driver_phone = phone;
        }

        const permit = window.DB.addPermit({
            vehicle_id: vehicle.id,
            destination_ar: 'المستودع الرئيسي',
            destination_en: 'Main Warehouse',
            purpose_ar: 'دخول مباشر',
            purpose_en: 'Direct Entry',
            valid_from: new Date().toISOString(),
            valid_until: new Date(Date.now() + 4 * 3600000).toISOString()
        });

        const user = window.Auth.getCurrentUser();
        window.DB.recordEntry(vehicle.id, permit.id, user.id, user.gate_assigned || 'Gate 1', 'دخول فوري مسجل من البوابة');

        document.getElementById('modal-container').innerHTML = '';
        this.playBeep(true);
        alert(window.i18n.t('entrySuccess'));
        this.renderTerminal();
    }
}

window.Officer = new OfficerController();
