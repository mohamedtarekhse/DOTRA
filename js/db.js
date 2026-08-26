// Database Layer - Egyptian Standard Vehicles, Settings, Gates, Destinations & Personnel
// طبقة إدارة البيانات - دعم كامل للبوابات المخصصة، الوجهات الداخلية، وتعيين أفراد الأمن

const SEED_USERS = [
    {
        id: 1,
        badge_id: 'MGR-01',
        email: 'manager@factory.com',
        password: 'Manager@2026',
        pin_code: '9900',
        name_ar: 'م. أحمد المنصور',
        name_en: 'Eng. Ahmed Al-Mansoor',
        role: 'manager',
        gate_assigned: 'Office HQ (الإدارة العامة)'
    },
    {
        id: 2,
        badge_id: 'GT-01',
        email: 'officer1@factory.com',
        password: 'Officer@2026',
        pin_code: '1234',
        name_ar: 'أمين الشرطة / طارق مصطفى',
        name_en: 'Officer Tariq Mostafa',
        role: 'officer',
        gate_assigned: 'بوابة 1 الرئيسية - دوترا'
    },
    {
        id: 3,
        badge_id: 'GT-02',
        email: 'officer2@factory.com',
        password: 'Officer@2026',
        pin_code: '5678',
        name_ar: 'أمين الشرطة / خالد الشناوي',
        name_en: 'Officer Khalid El-Shenawy',
        role: 'officer',
        gate_assigned: 'بوابة 2 الشحن والجمارك - دوترا'
    }
];

const SEED_GATES = [
    'بوابة 1 الرئيسية - دوترا',
    'بوابة 2 الشحن والجمارك - دوترا',
    'بوابة 3 المواد الخام والكيماويات',
    'بوابة 4 خروج الإنتاج والشاحنات'
];

const SEED_DESTINATIONS = [
    'المستودع الرئيسي',
    'مصنع الأسمدة والمخصبات',
    'مصنع المبيدات والكيماويات',
    'منطقة التحميل والتفريغ',
    'ميزان البسكول',
    'مبنى الإدارة العامة'
];

const SEED_SETTINGS = {
    default_whatsapp: '01012345678',
    company_name_ar: 'مجموعة دوترا',
    company_name_en: 'DOTRA Group',
    gate_name_ar: 'بوابة مصانع دوترا الرئيسية',
    gate_name_en: 'DOTRA Main Factory Gate',
    auto_send_default: true,
    overstay_hours_threshold: 3
};

const SEED_VEHICLES = [
    {
        id: 1,
        plate_ar: 'ط ر ق ٩ ٨ ٢ ١',
        plate_en: 'TRQ 9821',
        vehicle_type: 'truckHeavy',
        driver_name_ar: 'محمود عبدالفتاح إبراهيم',
        driver_name_en: 'Mahmoud Abdelfattah',
        driver_phone: '01012345678',
        company_ar: 'شركة النيل للصناعات والتوريدات',
        company_en: 'Nile Industries & Supplies',
        status: 'whitelist'
    },
    {
        id: 2,
        plate_ar: 'س ف ر ٤ ٥ ٢ ٠',
        plate_en: 'SFR 4520',
        vehicle_type: 'van',
        driver_name_ar: 'كريم السيد الباز',
        driver_name_en: 'Karim El-Sayed El-Baz',
        driver_phone: '01123456789',
        company_ar: 'دي إتش إل إكسبريس مصر',
        company_en: 'DHL Express Egypt',
        status: 'visitor'
    },
    {
        id: 3,
        plate_ar: 'د ن ق ١ ١ ٠ ٢',
        plate_en: 'DNQ 1102',
        vehicle_type: 'tanker',
        driver_name_ar: 'حسين رمضان الشرقاوي',
        driver_name_en: 'Hussein El-Sharkawy',
        driver_phone: '01234567890',
        company_ar: 'شركة مصر للبترول والكيماويات',
        company_en: 'Misr Petroleum & Chemicals',
        status: 'visitor'
    },
    {
        id: 4,
        plate_ar: 'م ص ر ٣ ٣ ٠ ٤',
        plate_en: 'MSR 3304',
        vehicle_type: 'car',
        driver_name_ar: 'طارق صلاح النجار',
        driver_name_en: 'Tariq El-Naggar',
        driver_phone: '01567890123',
        company_ar: 'مجموعة السويدي إلكتريك',
        company_en: 'Elsewedy Electric',
        status: 'blacklist'
    }
];

const SEED_PERMITS = [
    {
        id: 1,
        permit_code: 'PER-2026-84920',
        pin_code: '84920',
        permit_type: 'entry',
        vehicle_id: 1,
        destination_ar: 'المستودع الرئيسي',
        destination_en: 'Main Warehouse',
        purpose_ar: 'توريد شحنة مواد خام ومخصبات',
        purpose_en: 'Raw Materials & Fertilizers Delivery',
        cargo_details: '٢٥ طن أسمدة نيتروجينية',
        valid_from: new Date(Date.now() - 2 * 3600000).toISOString(),
        valid_until: new Date(Date.now() + 8 * 3600000).toISOString(),
        status: 'active',
        created_by: 1,
        created_at: new Date(Date.now() - 2 * 3600000).toISOString()
    },
    {
        id: 2,
        permit_code: 'PER-2026-63152',
        pin_code: '63152',
        permit_type: 'entry',
        vehicle_id: 2,
        destination_ar: 'مصنع الأسمدة والمخصبات',
        destination_en: 'Fertilizers Plant',
        purpose_ar: 'تسليم طرود ومستلزمات معامل',
        purpose_en: 'Lab Supplies Delivery',
        cargo_details: 'طرد عينات كيميائية معتمدة',
        valid_from: new Date(Date.now() - 3 * 3600000).toISOString(),
        valid_until: new Date(Date.now() + 8 * 3600000).toISOString(),
        status: 'active',
        created_by: 1,
        created_at: new Date(Date.now() - 3 * 3600000).toISOString()
    }
];

const SEED_LOGS = [
    {
        id: 1,
        permit_id: 1,
        vehicle_id: 1,
        officer_id: 2,
        gate_name: 'بوابة 1 الرئيسية - دوترا',
        action_type: 'entry',
        timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
        exit_timestamp: null,
        duration_minutes: null,
        remarks: 'دخول نظامي بتصريح معتمد'
    },
    {
        id: 2,
        permit_id: 2,
        vehicle_id: 2,
        officer_id: 3,
        gate_name: 'بوابة 2 الشحن والجمارك - دوترا',
        action_type: 'entry',
        timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
        exit_timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
        duration_minutes: 90,
        remarks: 'خروج نظامي بعد تسليم العينات'
    }
];

class DatabaseService {
    constructor() {
        this.initStorage();
    }

    initStorage() {
        if (!localStorage.getItem('gate_users')) {
            localStorage.setItem('gate_users', JSON.stringify(SEED_USERS));
        }
        if (!localStorage.getItem('gate_gates')) {
            localStorage.setItem('gate_gates', JSON.stringify(SEED_GATES));
        }
        if (!localStorage.getItem('gate_destinations')) {
            localStorage.setItem('gate_destinations', JSON.stringify(SEED_DESTINATIONS));
        }
        if (!localStorage.getItem('gate_vehicles')) {
            localStorage.setItem('gate_vehicles', JSON.stringify([]));
        }
        if (!localStorage.getItem('gate_permits')) {
            localStorage.setItem('gate_permits', JSON.stringify([]));
        }
        if (!localStorage.getItem('gate_logs')) {
            localStorage.setItem('gate_logs', JSON.stringify([]));
        }
        if (!localStorage.getItem('gate_settings')) {
            localStorage.setItem('gate_settings', JSON.stringify(SEED_SETTINGS));
        }

        this.syncFromCloud();
    }

    loadDemoData() {
        localStorage.setItem('gate_vehicles', JSON.stringify(SEED_VEHICLES));
        localStorage.setItem('gate_permits', JSON.stringify(SEED_PERMITS));
        localStorage.setItem('gate_logs', JSON.stringify(SEED_LOGS));
        return true;
    }

    async syncFromCloud() {
        try {
            if (typeof navigator !== 'undefined' && !navigator.onLine) return false;
            if (typeof fetch === 'undefined') return false;
            const res = await fetch('/api/sync');
            if (res && res.ok) {
                const data = await res.json();
                let changed = false;

                if (data.vehicles && Array.isArray(data.vehicles) && data.vehicles.length > 0) {
                    const localVehicles = this.getVehicles();
                    const mergedVehicles = [...localVehicles];
                    data.vehicles.forEach(cv => {
                        const existingIdx = mergedVehicles.findIndex(lv => lv.id === cv.id || lv.plate_ar === cv.plate_ar);
                        if (existingIdx === -1) {
                            mergedVehicles.push(cv);
                            changed = true;
                        } else if (mergedVehicles[existingIdx].status !== cv.status) {
                            mergedVehicles[existingIdx] = { ...mergedVehicles[existingIdx], ...cv };
                            changed = true;
                        }
                    });
                    if (changed) localStorage.setItem('gate_vehicles', JSON.stringify(mergedVehicles));
                }

                if (data.permits && Array.isArray(data.permits) && data.permits.length > 0) {
                    const localPermits = this.getPermits();
                    const mergedPermits = [...localPermits];
                    data.permits.forEach(cp => {
                        const existingIdx = mergedPermits.findIndex(lp => lp.id === cp.id || lp.permit_code === cp.permit_code);
                        if (existingIdx === -1) {
                            mergedPermits.push(cp);
                            changed = true;
                        } else if (mergedPermits[existingIdx].status !== cp.status) {
                            mergedPermits[existingIdx] = { ...mergedPermits[existingIdx], ...cp };
                            changed = true;
                        }
                    });
                    if (changed) localStorage.setItem('gate_permits', JSON.stringify(mergedPermits));
                }

                if (data.logs && Array.isArray(data.logs) && data.logs.length > 0) {
                    const localLogs = this.getLogs();
                    const mergedLogs = [...localLogs];
                    data.logs.forEach(cl => {
                        const existingIdx = mergedLogs.findIndex(ll => ll.id === cl.id);
                        if (existingIdx === -1) {
                            mergedLogs.push(cl);
                            changed = true;
                        } else if (mergedLogs[existingIdx].exit_timestamp !== cl.exit_timestamp) {
                            mergedLogs[existingIdx] = { ...mergedLogs[existingIdx], ...cl };
                            changed = true;
                        }
                    });
                    if (changed) localStorage.setItem('gate_logs', JSON.stringify(mergedLogs));
                }

                return changed;
            }
        } catch (err) {
            // Offline or fallback mode
        }
        return false;
    }

    clearAllData() {
        localStorage.setItem('gate_vehicles', JSON.stringify([]));
        localStorage.setItem('gate_permits', JSON.stringify([]));
        localStorage.setItem('gate_logs', JSON.stringify([]));
        return true;
    }

    // --- Settings ---
    getSettings() {
        return JSON.parse(localStorage.getItem('gate_settings') || JSON.stringify(SEED_SETTINGS));
    }

    updateSettings(newSettings) {
        const current = this.getSettings();
        const updated = { ...current, ...newSettings };
        localStorage.setItem('gate_settings', JSON.stringify(updated));
        return updated;
    }

    // --- Gates Management ---
    getGates() {
        return JSON.parse(localStorage.getItem('gate_gates') || JSON.stringify(SEED_GATES));
    }

    addGate(name) {
        if (!name || !name.trim()) return;
        const gates = this.getGates();
        if (!gates.includes(name.trim())) {
            gates.push(name.trim());
            localStorage.setItem('gate_gates', JSON.stringify(gates));
        }
        return gates;
    }

    deleteGate(index) {
        const gates = this.getGates();
        if (index >= 0 && index < gates.length) {
            gates.splice(index, 1);
            localStorage.setItem('gate_gates', JSON.stringify(gates));
        }
        return gates;
    }

    // --- Destinations Management ---
    getDestinations() {
        return JSON.parse(localStorage.getItem('gate_destinations') || JSON.stringify(SEED_DESTINATIONS));
    }

    addDestination(name) {
        if (!name || !name.trim()) return;
        const dests = this.getDestinations();
        if (!dests.includes(name.trim())) {
            dests.push(name.trim());
            localStorage.setItem('gate_destinations', JSON.stringify(dests));
        }
        return dests;
    }

    deleteDestination(index) {
        const dests = this.getDestinations();
        if (index >= 0 && index < dests.length) {
            dests.splice(index, 1);
            localStorage.setItem('gate_destinations', JSON.stringify(dests));
        }
        return dests;
    }

    // --- Users & Personnel Management ---
    getUsers() {
        return JSON.parse(localStorage.getItem('gate_users') || '[]');
    }

    getOfficers() {
        return this.getUsers().filter(u => u.role === 'officer');
    }

    addOfficer(officerData) {
        const users = this.getUsers();
        const newOfficer = {
            id: Date.now(),
            role: 'officer',
            badge_id: officerData.badge_id || `GT-0${users.length + 1}`,
            name_ar: officerData.name_ar || 'حارس بوابة',
            name_en: officerData.name_en || 'Gate Officer',
            pin_code: officerData.pin_code || '1234',
            gate_assigned: officerData.gate_assigned || 'بوابة 1 الرئيسية - دوترا',
            email: officerData.email || `officer${Date.now()}@factory.com`,
            password: 'Officer@2026'
        };
        users.push(newOfficer);
        localStorage.setItem('gate_users', JSON.stringify(users));
        return newOfficer;
    }

    updateOfficer(id, data) {
        const users = this.getUsers();
        const user = users.find(u => u.id === id);
        if (user) {
            Object.assign(user, data);
            localStorage.setItem('gate_users', JSON.stringify(users));
        }
        return user;
    }

    deleteOfficer(id) {
        let users = this.getUsers();
        users = users.filter(u => u.id !== id);
        localStorage.setItem('gate_users', JSON.stringify(users));
        return users;
    }

    assignOfficerToGate(officerId, gateName) {
        return this.updateOfficer(officerId, { gate_assigned: gateName });
    }

    // --- Vehicles & Permits ---
    getVehicles() {
        return JSON.parse(localStorage.getItem('gate_vehicles') || '[]');
    }

    getPermits() {
        return JSON.parse(localStorage.getItem('gate_permits') || '[]');
    }

    getLogs() {
        return JSON.parse(localStorage.getItem('gate_logs') || '[]');
    }

    findVehicleByPlate(searchTerm) {
        if (!searchTerm) return null;
        const term = searchTerm.trim().toLowerCase().replace(/\s+/g, '');
        const vehicles = this.getVehicles();
        
        return vehicles.find(v => {
            const arClean = (v.plate_ar || '').toLowerCase().replace(/\s+/g, '');
            const enClean = (v.plate_en || '').toLowerCase().replace(/\s+/g, '');
            return arClean.includes(term) || enClean.includes(term) || term.includes(arClean);
        });
    }

    findPermitByCodeOrVehicle(permitCodeOrPin, vehicleId) {
        const permits = this.getPermits();
        if (permitCodeOrPin) {
            const clean = permitCodeOrPin.toString().trim();
            return permits.find(p => p.permit_code === clean || p.pin_code === clean);
        }
        if (vehicleId) {
            return permits.find(p => p.vehicle_id === vehicleId && p.status === 'active');
        }
        return null;
    }

    findPermitByPin(pin) {
        if (!pin) return null;
        const clean = pin.toString().trim();
        const permits = this.getPermits();
        return permits.find(p => p.pin_code === clean && p.status === 'active') || permits.find(p => p.pin_code === clean);
    }

    findActivePermitByPlate(plate) {
        const vehicle = this.findVehicleByPlate(plate);
        if (!vehicle) return null;
        const permits = this.getPermits();
        return permits.find(p => p.vehicle_id === vehicle.id && p.status === 'active');
    }

    getEnrichedPermits() {
        const permits = this.getPermits();
        const vehicles = this.getVehicles();
        const logs = this.getLogs();
        const users = this.getUsers();

        return permits.map(permit => {
            const vehicle = vehicles.find(v => v.id === permit.vehicle_id) || {};
            const entryLog = logs.find(l => l.permit_id === permit.id || (l.vehicle_id === permit.vehicle_id && l.action_type === 'entry'));
            const exitLog = logs.find(l => l.vehicle_id === permit.vehicle_id && (l.action_type === 'exit' || l.exit_timestamp));
            const officer = entryLog ? users.find(u => u.id === entryLog.officer_id) : null;

            return {
                ...permit,
                vehicle,
                entryLog,
                exitLog,
                officer
            };
        });
    }

    expireExistingPermitsForVehicle(vehicleId) {
        const permits = this.getPermits();
        let updated = false;
        permits.forEach(p => {
            if (p.vehicle_id === vehicleId && p.status === 'active') {
                p.status = 'superseded';
                updated = true;
            }
        });
        if (updated) {
            localStorage.setItem('gate_permits', JSON.stringify(permits));
        }
        return updated;
    }

    isVehicleInside(vehicleId) {
        const logs = this.getLogs();
        const vehicleLogs = logs.filter(l => l.vehicle_id === vehicleId);
        if (vehicleLogs.length === 0) return null;
        const lastLog = vehicleLogs[vehicleLogs.length - 1];
        if (lastLog.action_type === 'entry' && !lastLog.exit_timestamp) {
            return lastLog;
        }
        return null;
    }

    compressImage(file, maxWidth = 800, quality = 0.7) {
        return new Promise((resolve, reject) => {
            if (!file) return resolve(null);
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = event => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const elem = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                    elem.width = width;
                    elem.height = height;
                    const ctx = elem.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(elem.toDataURL('image/jpeg', quality));
                };
                img.onerror = error => reject(error);
            };
            reader.onerror = error => reject(error);
        });
    }

    saveVehiclePhoto(vehicleId, photoUrl) {
        const vehicles = this.getVehicles();
        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (vehicle && photoUrl) {
            vehicle.photo_url = photoUrl;
            localStorage.setItem('gate_vehicles', JSON.stringify(vehicles));
        }
        return vehicle;
    }

    announce(type, data) {
        try {
            if (typeof BroadcastChannel !== 'undefined') {
                if (!this.broadcastChannel) {
                    this.broadcastChannel = new BroadcastChannel('dotra_gate_live_announcements');
                }
                this.broadcastChannel.postMessage({ type, timestamp: Date.now(), ...data });
            }
            if (typeof window !== 'undefined' && window.App && typeof window.App.handleLiveAnnouncement === 'function') {
                window.App.handleLiveAnnouncement({ type, timestamp: Date.now(), ...data });
            }
        } catch (e) {
            // broadcast fallback
        }
    }

    recordEntry(vehicleId, permitId, officerId, gateName, remarks = '', photoUrl = null) {
        const logs = this.getLogs();
        const newLog = {
            id: Date.now(),
            vehicle_id: vehicleId,
            permit_id: permitId || null,
            officer_id: officerId,
            gate_name: gateName,
            action_type: 'entry',
            timestamp: new Date().toISOString(),
            exit_timestamp: null,
            duration_minutes: null,
            remarks: remarks,
            photo_url: photoUrl || null
        };
        logs.push(newLog);
        localStorage.setItem('gate_logs', JSON.stringify(logs));

        if (photoUrl) {
            this.saveVehiclePhoto(vehicleId, photoUrl);
        }

        const vehicle = this.getVehicles().find(v => v.id === vehicleId);
        const officer = this.getUsers().find(u => u.id === officerId);

        this.announce('VEHICLE_ENTRY', {
            plate: vehicle ? vehicle.plate_ar : `مركبة #${vehicleId}`,
            gate: gateName,
            officer: officer ? officer.name_ar : 'حارس البوابة'
        });

        this.pushToCloud('/api/entry', {
            vehicle_id: vehicleId,
            permit_id: permitId || null,
            officer_id: officerId,
            gate_name: gateName,
            remarks: remarks
        });
        this.pushToCloud('/api/sync', { vehicles: this.getVehicles(), permits: this.getPermits(), logs: this.getLogs() });

        return newLog;
    }

    recordExit(vehicleId, officerId, gateName, remarks = '', photoUrl = null) {
        const logs = this.getLogs();
        const activeEntryIndex = logs.slice().reverse().findIndex(l => l.vehicle_id === vehicleId && l.action_type === 'entry' && !l.exit_timestamp);
        const vehicle = this.getVehicles().find(v => v.id === vehicleId);
        
        if (activeEntryIndex !== -1) {
            const actualIndex = logs.length - 1 - activeEntryIndex;
            const entryLog = logs[actualIndex];
            const exitTime = new Date();
            const entryTime = new Date(entryLog.timestamp);
            const durationMin = Math.round((exitTime - entryTime) / 60000);
            
            entryLog.exit_timestamp = exitTime.toISOString();
            entryLog.duration_minutes = durationMin;
            entryLog.remarks = (entryLog.remarks ? entryLog.remarks + ' | ' : '') + `خروج عبر ${gateName}`;
            if (photoUrl) {
                entryLog.exit_photo_url = photoUrl;
            }
            
            localStorage.setItem('gate_logs', JSON.stringify(logs));

            this.announce('VEHICLE_EXIT', {
                plate: vehicle ? vehicle.plate_ar : `مركبة #${vehicleId}`,
                gate: gateName,
                duration: durationMin
            });

            this.pushToCloud('/api/exit', { vehicle_id: vehicleId, officer_id: officerId, gate_name: gateName, remarks });
            this.pushToCloud('/api/sync', { vehicles: this.getVehicles(), permits: this.getPermits(), logs: this.getLogs() });
            return entryLog;
        } else {
            const newExitLog = {
                id: Date.now(),
                vehicle_id: vehicleId,
                permit_id: null,
                officer_id: officerId,
                gate_name: gateName,
                action_type: 'exit',
                timestamp: new Date().toISOString(),
                exit_timestamp: new Date().toISOString(),
                duration_minutes: 0,
                remarks: remarks || 'تسجيل خروج مباشر',
                photo_url: photoUrl || null
            };
            logs.push(newExitLog);
            localStorage.setItem('gate_logs', JSON.stringify(logs));

            this.announce('VEHICLE_EXIT', {
                plate: vehicle ? vehicle.plate_ar : `مركبة #${vehicleId}`,
                gate: gateName,
                duration: 0
            });

            this.pushToCloud('/api/exit', { vehicle_id: vehicleId, officer_id: officerId, gate_name: gateName, remarks });
            this.pushToCloud('/api/sync', { vehicles: this.getVehicles(), permits: this.getPermits(), logs: this.getLogs() });
            return newExitLog;
        }
    }

    recordDenied(vehicleId, officerId, gateName, reason) {
        const logs = this.getLogs();
        const newLog = {
            id: Date.now(),
            vehicle_id: vehicleId,
            permit_id: null,
            officer_id: officerId,
            gate_name: gateName,
            action_type: 'denied',
            timestamp: new Date().toISOString(),
            exit_timestamp: null,
            duration_minutes: null,
            remarks: `⛔ منع من الدخول: ${reason}`
        };
        logs.push(newLog);
        localStorage.setItem('gate_logs', JSON.stringify(logs));
        return newLog;
    }

    async pushToCloud(endpoint, data) {
        try {
            if (typeof navigator !== 'undefined' && !navigator.onLine) return;
            if (typeof fetch === 'undefined') return;
            await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } catch (e) {
            // Background sync resilience
        }
    }

    addVehicle(vehicleData) {
        const vehicles = this.getVehicles();
        const newVehicle = {
            id: Date.now(),
            ...vehicleData
        };
        vehicles.push(newVehicle);
        localStorage.setItem('gate_vehicles', JSON.stringify(vehicles));
        this.pushToCloud('/api/vehicles', newVehicle);
        this.pushToCloud('/api/sync', { vehicles: this.getVehicles(), permits: this.getPermits(), logs: this.getLogs() });
        return newVehicle;
    }

    addPermit(permitData) {
        const permits = this.getPermits();
        const pin = permitData.pin_code || Math.floor(10000 + Math.random() * 90000).toString();
        const newPermit = {
            id: Date.now(),
            permit_code: `PER-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
            pin_code: pin,
            permit_type: permitData.permit_type || 'entry', // 'entry' | 'exit' | 'both'
            status: 'active',
            invoice_no: permitData.invoice_no || '',
            cargo_details: permitData.cargo_details || 'بضائع ومواد مصرحة',
            ...permitData
        };
        permits.push(newPermit);
        localStorage.setItem('gate_permits', JSON.stringify(permits));

        const vehicle = this.getVehicles().find(v => v.id === newPermit.vehicle_id);

        this.announce('PERMIT_CREATED', {
            plate: permitData.plate || (vehicle ? vehicle.plate_ar : 'مركبة جديدة'),
            pin: newPermit.pin_code,
            destination: newPermit.destination_ar || 'المستودع'
        });

        this.pushToCloud('/api/permits', newPermit);
        this.pushToCloud('/api/sync', { vehicles: this.getVehicles(), permits: this.getPermits(), logs: this.getLogs() });
        return newPermit;
    }

    updateVehicleStatus(vehicleId, status, blacklistReason = '') {
        const vehicles = this.getVehicles();
        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (vehicle) {
            vehicle.status = status;
            vehicle.blacklist_reason = blacklistReason;
            localStorage.setItem('gate_vehicles', JSON.stringify(vehicles));
            this.announce('BLACKLIST_UPDATED', {
                plate: vehicle.plate_ar || 'المركبة',
                status: status
            });
            this.pushToCloud('/api/vehicles', vehicle);
            this.pushToCloud('/api/sync', { vehicles: this.getVehicles(), permits: this.getPermits(), logs: this.getLogs() });
        }
        return vehicle;
    }
}

window.DB = new DatabaseService();
