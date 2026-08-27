// Database Layer - Unified Cloud Sync via /api/sync (gate_* tables only)
// طبقة إدارة البيانات - مزامنة موحدة عبر /api/sync

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
    auto_send_default: 'true',
    overstay_hours_threshold: '3'
};

const SEED_USERS = [
    {
        id: 1,
        badge_id: 'MGR-01',
        email: 'manager@dotra.com',
        name_ar: 'م. أحمد فؤاد (مدير العمليات)',
        name_en: 'Eng. Ahmed Fouad',
        role: 'manager',
        gate_assigned: ''
    },
    {
        id: 2,
        badge_id: 'GT-01',
        pin_code: '1234',
        name_ar: 'أمين الشرطة / طارق محمود',
        name_en: 'Officer Tariq Mahmoud',
        role: 'officer',
        gate_assigned: 'بوابة 1 الرئيسية - دوترا'
    },
    {
        id: 3,
        badge_id: 'GT-02',
        pin_code: '5678',
        name_ar: 'مساعد شرطة / حسام حسن',
        name_en: 'Officer Hossam Hassan',
        role: 'officer',
        gate_assigned: 'بوابة 2 الشحن والجمارك - دوترا'
    }
];


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
        status: 'blacklist',
        blacklist_reason: 'مخالفة أمنية سابقة'
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
        created_by: 1
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
        created_by: 1
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

        this.syncFromCloud().catch(() => {});
    }

    loadDemoData() {
        const currentVehicles = this.getVehicles();
        const mergedVehicles = [...currentVehicles];
        SEED_VEHICLES.forEach(sv => {
            if (!mergedVehicles.find(v => v.id === sv.id)) mergedVehicles.push(sv);
        });
        localStorage.setItem('gate_vehicles', JSON.stringify(mergedVehicles));

        const currentPermits = this.getPermits();
        const mergedPermits = [...currentPermits];
        SEED_PERMITS.forEach(sp => {
            if (!mergedPermits.find(p => p.id === sp.id)) mergedPermits.push(sp);
        });
        localStorage.setItem('gate_permits', JSON.stringify(mergedPermits));

        const currentLogs = this.getLogs();
        const mergedLogs = [...currentLogs];
        SEED_LOGS.forEach(sl => {
            if (!mergedLogs.find(l => l.id === sl.id)) mergedLogs.push(sl);
        });
        localStorage.setItem('gate_logs', JSON.stringify(mergedLogs));

        this.pushToCloud('/api/sync', { vehicles: this.getVehicles(), permits: this.getPermits(), logs: this.getLogs() });
        return true;
    }

    needsSetup() {
        const users = this.getUsers();
        return !users.some(u => u.role === 'manager');
    }

    async setupManager({ name_ar, name_en, email, password, pin_code }) {
        const hash = await window.Auth.createPasswordHash(password);
        const pinHash = await window.Auth.createPasswordHash(pin_code);
        const manager = {
            id: this.generateId(),
            badge_id: 'MGR-01',
            email,
            password_hash: hash,
            pin_code: '',
            pin_hash: pinHash,
            name_ar,
            name_en,
            role: 'manager',
            gate_assigned: ''
        };
        const users = this.getUsers();
        users.push(manager);
        localStorage.setItem('gate_users', JSON.stringify(users));
        this.syncUsersToCloud();
        return manager;
    }

    generateId() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return Math.abs([...crypto.randomUUID()].reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0));
        }
        return parseInt(`${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`.slice(0, 15));
    }

    async syncFromCloud() {
        try {
            if (typeof navigator !== 'undefined' && !navigator.onLine) return false;
            if (typeof fetch === 'undefined') return false;
            const res = await fetch('/api/sync');
            if (!res || !res.ok) return false;

            const data = await res.json();
            let changed = false;

            // --- Vehicles ---
            const cloudVehicles = Array.isArray(data.vehicles) ? data.vehicles : [];
            const localVehicles = this.getVehicles();
            if (cloudVehicles.length > 0 || localVehicles.length > 0) {
                const merged = [...localVehicles];
                cloudVehicles.forEach(cv => {
                    const idx = merged.findIndex(lv => lv.id === cv.id);
                    if (idx === -1) {
                        merged.push(cv);
                        changed = true;
                    } else {
                        const cur = merged[idx];
                        if (cur.status !== cv.status || cur.blacklist_reason !== cv.blacklist_reason || cur.plate_ar !== cv.plate_ar || cur.driver_name_ar !== cv.driver_name_ar || cur.driver_phone !== cv.driver_phone || cur.photo_url !== cv.photo_url) {
                            merged[idx] = { ...cur, ...cv };
                            changed = true;
                        }
                    }
                });
                if (localVehicles.length !== merged.length) changed = true;
                if (changed) localStorage.setItem('gate_vehicles', JSON.stringify(merged));
            }

            // --- Permits ---
            const cloudPermits = Array.isArray(data.permits) ? data.permits : [];
            const localPermits = this.getPermits();
            if (cloudPermits.length > 0 || localPermits.length > 0) {
                const merged = [...localPermits];
                cloudPermits.forEach(cp => {
                    const idx = merged.findIndex(lp => lp.id === cp.id);
                    if (idx === -1) {
                        merged.push(cp);
                        changed = true;
                    } else {
                        const cur = merged[idx];
                        if (cur.status !== cp.status || cur.pin_code !== cp.pin_code || cur.valid_until !== cp.valid_until) {
                            merged[idx] = { ...cur, ...cp };
                            changed = true;
                        }
                    }
                });
                if (localPermits.length !== merged.length) changed = true;
                if (changed) localStorage.setItem('gate_permits', JSON.stringify(merged));
            }

            // --- Logs ---
            const cloudLogs = Array.isArray(data.logs) ? data.logs : [];
            const localLogs = this.getLogs();
            if (cloudLogs.length > 0 || localLogs.length > 0) {
                const merged = [...localLogs];
                const newIncomingLogs = [];
                cloudLogs.forEach(cl => {
                    const idx = merged.findIndex(ll => ll.id === cl.id);
                    if (idx === -1) {
                        merged.push(cl);
                        newIncomingLogs.push(cl);
                        changed = true;
                    } else {
                        const cur = merged[idx];
                        if (cur.exit_timestamp !== cl.exit_timestamp || cur.action_type !== cl.action_type || cur.duration_minutes !== cl.duration_minutes || cur.remarks !== cl.remarks) {
                            merged[idx] = { ...cur, ...cl };
                            changed = true;
                        }
                    }
                });
                if (localLogs.length !== merged.length) changed = true;
                if (changed) localStorage.setItem('gate_logs', JSON.stringify(merged));

                // Cross-device live announcement for remote entries/exits
                if (newIncomingLogs.length > 0 && localLogs.length > 0) {
                    newIncomingLogs.forEach(newLog => {
                        const vehicle = this.getVehicles().find(v => v.id === newLog.vehicle_id);
                        const plate = vehicle ? vehicle.plate_ar : `مركبة #${newLog.vehicle_id}`;
                        if (newLog.action_type === 'entry') {
                            this.announce('VEHICLE_ENTRY', {
                                plate,
                                gate: newLog.gate_name || 'البوابة',
                                officer: 'حارس البوابة'
                            });
                        } else if (newLog.action_type === 'exit') {
                            this.announce('VEHICLE_EXIT', {
                                plate,
                                gate: newLog.gate_name || 'البوابة',
                                duration: newLog.duration_minutes || 0
                            });
                        }
                    });
                }
            }


            // --- Gates ---
            if (Array.isArray(data.gates)) {
                const localGates = this.getGates();
                if (JSON.stringify(localGates) !== JSON.stringify(data.gates)) {
                    localStorage.setItem('gate_gates', JSON.stringify(data.gates));
                    changed = true;
                }
            }

            // --- Destinations ---
            if (Array.isArray(data.destinations)) {
                const localDests = this.getDestinations();
                if (JSON.stringify(localDests) !== JSON.stringify(data.destinations)) {
                    localStorage.setItem('gate_destinations', JSON.stringify(data.destinations));
                    changed = true;
                }
            }

            // --- Settings ---
            if (data.settings && typeof data.settings === 'object') {
                const localSettings = this.getSettings();
                const merged = { ...localSettings };
                let settingsChanged = false;
                Object.entries(data.settings).forEach(([k, v]) => {
                    if (v !== undefined && v !== null && localSettings[k] !== v) {
                        merged[k] = v;
                        settingsChanged = true;
                    }
                });
                if (settingsChanged) {
                    localStorage.setItem('gate_settings', JSON.stringify(merged));
                    changed = true;
                }
            }

            // --- Users ---
            if (Array.isArray(data.users)) {
                const localUsers = this.getUsers();
                const mergedUsers = [...localUsers];
                let usersChanged = false;
                data.users.forEach(cu => {
                    const idx = mergedUsers.findIndex(lu => lu.id === cu.id);
                    if (idx === -1) {
                        mergedUsers.push({ ...cu });
                        usersChanged = true;
                    } else {
                        const cur = mergedUsers[idx];
                        if (cur.role !== cu.role || cur.name_ar !== cu.name_ar || cur.gate_assigned !== cu.gate_assigned || (cu.password_hash && cur.password_hash !== cu.password_hash)) {
                            mergedUsers[idx] = { ...cur, ...cu };
                            usersChanged = true;
                        }
                    }
                });
                if (usersChanged) {
                    localStorage.setItem('gate_users', JSON.stringify(mergedUsers));
                    changed = true;
                }
            }

            return changed;
        } catch (err) {
            // Offline or network error — silent fail, keep local data
        }
        return false;

    }

    clearAllData() {
        localStorage.setItem('gate_vehicles', JSON.stringify([]));
        localStorage.setItem('gate_permits', JSON.stringify([]));
        localStorage.setItem('gate_logs', JSON.stringify([]));
        this.pushToCloud('/api/clear', {});
        return true;
    }

    clearPermitsOnly() {
        localStorage.setItem('gate_permits', JSON.stringify([]));
        this.pushToCloud('/api/sync', { vehicles: this.getVehicles(), permits: [], logs: this.getLogs() });
        return true;
    }

    clearLogsOnly() {
        localStorage.setItem('gate_logs', JSON.stringify([]));
        this.pushToCloud('/api/sync', { vehicles: this.getVehicles(), permits: this.getPermits(), logs: [] });
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
        this.pushToCloud('/api/settings', updated);
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
            this.pushToCloud('/api/gates', { gates });
        }
        return gates;
    }

    deleteGate(index) {
        const gates = this.getGates();
        if (index >= 0 && index < gates.length) {
            gates.splice(index, 1);
            localStorage.setItem('gate_gates', JSON.stringify(gates));
            this.pushToCloud('/api/gates', { gates });
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
            this.pushToCloud('/api/destinations', { destinations: dests });
        }
        return dests;
    }

    deleteDestination(index) {
        const dests = this.getDestinations();
        if (index >= 0 && index < dests.length) {
            dests.splice(index, 1);
            localStorage.setItem('gate_destinations', JSON.stringify(dests));
            this.pushToCloud('/api/destinations', { destinations: dests });
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

    async addOfficer(officerData) {
        const users = this.getUsers();
        const pin = officerData.pin_code || String(Math.floor(1000 + Math.random() * 9000));
        const password = officerData.password || pin;
        const hash = await window.Auth.createPasswordHash(password);
        const pinHash = await window.Auth.createPasswordHash(pin);
        const newOfficer = {
            id: this.generateId(),
            role: 'officer',
            badge_id: officerData.badge_id || `GT-0${users.length + 1}`,
            name_ar: officerData.name_ar || 'حارس بوابة',
            name_en: officerData.name_en || 'Gate Officer',
            pin_code: '',
            pin_hash: pinHash,
            gate_assigned: officerData.gate_assigned || 'بوابة 1 الرئيسية - دوترا',
            email: officerData.email || `officer${Date.now()}@factory.com`,
            password_hash: hash
        };
        users.push(newOfficer);
        localStorage.setItem('gate_users', JSON.stringify(users));
        this.syncUsersToCloud();
        return { ...newOfficer, pin_code: pin, password };
    }

    updateOfficer(id, data) {
        const users = this.getUsers();
        const user = users.find(u => u.id === id);
        if (user) {
            Object.assign(user, data);
            localStorage.setItem('gate_users', JSON.stringify(users));
            this.syncUsersToCloud();
        }
        return user;
    }

    deleteOfficer(id) {
        let users = this.getUsers();
        users = users.filter(u => u.id !== id);
        localStorage.setItem('gate_users', JSON.stringify(users));
        this.syncUsersToCloud();
        return users;
    }

    assignOfficerToGate(officerId, gateName) {
        return this.updateOfficer(officerId, { gate_assigned: gateName });
    }

    syncUsersToCloud() {
        const users = this.getUsers().map(u => ({
            id: u.id,
            badge_id: u.badge_id,
            email: u.email,
            password_hash: u.password_hash || '',
            pin_code: u.pin_code || '',
            pin_hash: u.pin_hash || '',
            name_ar: u.name_ar,
            name_en: u.name_en,
            role: u.role,
            gate_assigned: u.gate_assigned
        }));
        this.pushToCloud('/api/users', { users });
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

    parseTimestamp(ts) {
        if (!ts) return new Date();
        if (ts instanceof Date) return ts;
        if (typeof ts === 'number') return new Date(ts);
        let str = String(ts).trim();
        // If string has date & time without timezone or with space instead of T, normalize to UTC ISO format
        if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(str)) {
            str = str.replace(' ', 'T') + (str.endsWith('Z') ? '' : 'Z');
        }
        const d = new Date(str);
        return isNaN(d.getTime()) ? new Date(ts) : d;
    }

    isVehicleInside(vehicleId) {
        const logs = this.getLogs();
        const vehicleLogs = logs.filter(l => l.vehicle_id === vehicleId);
        if (vehicleLogs.length === 0) return null;
        // Sort newest first by timestamp and ID
        vehicleLogs.sort((a, b) => {
            const timeA = this.parseTimestamp(a.timestamp).getTime();
            const timeB = this.parseTimestamp(b.timestamp).getTime();
            return timeB - timeA || (b.id || 0) - (a.id || 0);
        });
        const lastLog = vehicleLogs[0];
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
            id: this.generateId(),
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

        this.pushToCloud('/api/sync', { vehicles: this.getVehicles(), permits: this.getPermits(), logs: this.getLogs() });
        this.notifyVehicleEvent('entry', vehicleId, vehicle ? vehicle.plate_ar : '', gateName);

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
            const entryTime = this.parseTimestamp(entryLog.timestamp);
            const durationMin = Math.max(0, Math.round((exitTime.getTime() - entryTime.getTime()) / 60000));

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

            this.pushToCloud('/api/sync', { vehicles: this.getVehicles(), permits: this.getPermits(), logs: this.getLogs() });
            this.notifyVehicleEvent('exit', vehicleId, vehicle ? vehicle.plate_ar : '', gateName);
            return entryLog;
        } else {
            const newExitLog = {
                id: this.generateId(),
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

            this.pushToCloud('/api/sync', { vehicles: this.getVehicles(), permits: this.getPermits(), logs: this.getLogs() });
            this.notifyVehicleEvent('exit', vehicleId, vehicle ? vehicle.plate_ar : '', gateName);
            return newExitLog;
        }
    }

    recordDenied(vehicleId, officerId, gateName, reason) {
        const logs = this.getLogs();
        const newLog = {
            id: this.generateId(),
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

        // FIX: Sync denied records to cloud (was missing before)
        this.pushToCloud('/api/sync', { vehicles: this.getVehicles(), permits: this.getPermits(), logs: this.getLogs() });

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

    notifyVehicleEvent(type, vehicleId, plate, gateName) {
        const user = window.Auth ? window.Auth.getCurrentUser() : null;
        this.pushToCloud('/api/push/notify', {
            type,
            vehicle_id: vehicleId,
            vehicle_plate: plate,
            gate_name: gateName,
            roles: ['manager', 'officer']
        });
    }

    async getNotifications() {
        const user = window.Auth ? window.Auth.getCurrentUser() : null;
        try {
            const url = user ? `/api/notifications?user_id=${user.id}` : '/api/notifications';
            const res = await fetch(url);
            if (!res || !res.ok) return [];
            const data = await res.json();
            return data.notifications || [];
        } catch (e) {
            return [];
        }
    }

    async markNotificationRead(notifId) {
        this.pushToCloud('/api/notifications/read', { id: notifId });
    }

    async markAllNotificationsRead() {
        const user = window.Auth ? window.Auth.getCurrentUser() : null;
        if (user) this.pushToCloud('/api/notifications/read', { user_id: user.id });
    }

    async updateWatchlist(vehicleIds, watchAll) {
        if (typeof navigator !== 'undefined' && !navigator.onLine) return;
        if (typeof fetch === 'undefined') return;
        try {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.getSubscription();
            if (sub) {
                await fetch('/api/push/watchlist', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ endpoint: sub.endpoint, vehicle_ids: vehicleIds, watch_all: watchAll })
                });
            }
        } catch (e) { /* background */ }
    }

    addVehicle(vehicleData) {
        const vehicles = this.getVehicles();
        const newVehicle = {
            id: this.generateId(),
            ...vehicleData
        };
        vehicles.push(newVehicle);
        localStorage.setItem('gate_vehicles', JSON.stringify(vehicles));
        // Single sync call — no more dual-write to /api/vehicles
        this.pushToCloud('/api/sync', { vehicles: this.getVehicles(), permits: this.getPermits(), logs: this.getLogs() });
        return newVehicle;
    }

    addPermit(permitData) {
        const permits = this.getPermits();
        const pin = permitData.pin_code || Math.floor(10000 + Math.random() * 90000).toString();
        const newPermit = {
            id: this.generateId(),
            permit_code: `PER-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
            pin_code: pin,
            permit_type: permitData.permit_type || 'entry',
            status: 'active',
            invoice_no: permitData.invoice_no || '',
            cargo_details: permitData.cargo_details || 'بضائع ومواد مصرحة',
            vehicle_id: permitData.vehicle_id,
            destination_ar: permitData.destination_ar || '',
            destination_en: permitData.destination_en || '',
            purpose_ar: permitData.purpose_ar || '',
            purpose_en: permitData.purpose_en || '',
            valid_from: permitData.valid_from || '',
            valid_until: permitData.valid_until || '',
            created_by: permitData.created_by || 1
        };
        permits.push(newPermit);
        localStorage.setItem('gate_permits', JSON.stringify(permits));

        const vehicle = this.getVehicles().find(v => v.id === newPermit.vehicle_id);

        this.announce('PERMIT_CREATED', {
            plate: permitData.plate || (vehicle ? vehicle.plate_ar : 'مركبة جديدة'),
            pin: newPermit.pin_code,
            destination: newPermit.destination_ar || 'المستودع'
        });

        // Single sync call — no more dual-write to /api/permits
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
            // Single sync call — no more dual-write to /api/vehicles
            this.pushToCloud('/api/sync', { vehicles: this.getVehicles(), permits: this.getPermits(), logs: this.getLogs() });
        }
        return vehicle;
    }

    // --- Pre-Arrival Manifest & CSV Ingestion ---
    getExpectedArrivals() {
        const permits = this.getPermits().filter(p => p.status === 'active');
        const vehicles = this.getVehicles();
        const expected = [];

        for (const permit of permits) {
            if (!this.isVehicleInside(permit.vehicle_id)) {
                const vehicle = vehicles.find(v => v.id === permit.vehicle_id);
                if (vehicle) {
                    expected.push({
                        permit,
                        vehicle,
                        pin_code: permit.pin_code,
                        plate_ar: vehicle.plate_ar,
                        driver_name_ar: vehicle.driver_name_ar,
                        driver_phone: vehicle.driver_phone,
                        company_ar: vehicle.company_ar,
                        destination_ar: permit.destination_ar,
                        cargo_details: permit.cargo_details,
                        invoice_no: permit.invoice_no,
                        valid_until: permit.valid_until
                    });
                }
            }
        }
        return expected;
    }

    getCsvTemplate() {
        return "رقم اللوحة,اسم السائق,رقم الهاتف,الشركة,الوجهة داخل المصنع,تفاصيل الحمولة,رقم إذن الصرف أو الفاتورة\nط ر ق ٩ ٨ ٢ ١,محمود عبدالفتاح,01012345678,شركة النيل للتوريدات,المستودع الرئيسي,شحنة أسمدة زراعية 25 طن,INV-2026-101\nس ف ر ٤ ٥ ٢ ٠,كريم الباز,01123456789,دي إتش إل مصر,مصنع المبيدات والكيماويات,طرود مستلزمات معامل,INV-2026-102";
    }

    importPreArrivalsFromCSV(csvText) {
        if (!csvText || !csvText.trim()) return { success: false, count: 0, message: 'ملف الـ CSV فارغ' };
        
        const lines = csvText.trim().split(/\r?\n/);
        if (lines.length < 2) return { success: false, count: 0, message: 'الملف لا يحتوي على بيانات شاحنات' };

        const imported = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            let parts = [];
            if (line.includes('\t')) parts = line.split('\t');
            else if (line.includes(';')) parts = line.split(';');
            else {
                parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(s => s.replace(/^"|"$/g, '').trim());
            }

            if (parts.length < 1 || !parts[0]) continue;

            const plate = parts[0]?.trim();
            const driverName = parts[1]?.trim() || 'سائق مصرح';
            const phone = parts[2]?.trim() || '';
            const company = parts[3]?.trim() || 'مورد عام';
            const destination = parts[4]?.trim() || 'المستودع الرئيسي';
            const cargo = parts[5]?.trim() || 'بضائع ومستلزمات عامة';
            const invoice = parts[6]?.trim() || '';

            if (!plate) continue;

            let vehicle = this.findVehicleByPlate(plate);
            if (!vehicle) {
                vehicle = this.addVehicle({
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
                if (driverName && driverName !== 'سائق مصرح') vehicle.driver_name_ar = driverName;
                if (phone) vehicle.driver_phone = phone;
                if (company && company !== 'مورد عام') vehicle.company_ar = company;
            }

            this.expireExistingPermitsForVehicle(vehicle.id);
            const permit = this.addPermit({
                vehicle_id: vehicle.id,
                destination_ar: destination,
                destination_en: destination,
                purpose_ar: 'كشف وصول مسبق معتمد من الإدارة',
                cargo_details: cargo,
                invoice_no: invoice,
                valid_from: new Date().toISOString(),
                valid_until: new Date(Date.now() + 24 * 3600000).toISOString(),
                created_by: 1
            });

            imported.push({ vehicle, permit });
        }

        this.pushToCloud('/api/sync', { vehicles: this.getVehicles(), permits: this.getPermits(), logs: this.getLogs() });
        return { success: true, count: imported.length, items: imported };
    }
}

window.DB = new DatabaseService();
