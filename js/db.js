// Database Layer - Unified Cloud Sync via /api/sync (gate_* tables only)
// طبقة إدارة البيانات - مزامنة موحدة عبر /api/sync

const SEED_GATES = [
    'بوابة 1 الرئيسية - دوترا',
    'بوابة 2 الشحن والجمارك - دوترا',
    'بوابة 3 المواد الخام والكيماويات',
    'بوابة 4 خروج الإنتاج والشاحنات'
];

const SEED_ROSTER = [
    {
        gate_name: 'بوابة 1 الرئيسية - دوترا',
        day_officer_id: 2,
        night_officer_id: 3,
        notes: 'بوابة الدخول الرئيسية للمركبات والشاحنات'
    },
    {
        gate_name: 'بوابة 2 الشحن والجمارك - دوترا',
        day_officer_id: 3,
        night_officer_id: 2,
        notes: 'بوابة شحن البضائع والجمارك'
    },
    {
        gate_name: 'بوابة 3 المواد الخام والكيماويات',
        day_officer_id: null,
        night_officer_id: null,
        notes: 'مستودعات المواد الخام'
    },
    {
        gate_name: 'بوابة 4 خروج الإنتاج والشاحنات',
        day_officer_id: null,
        night_officer_id: null,
        notes: 'بوابة الشحن والتفريغ السريع'
    }
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
        gate_assigned: 'بوابة 1 الرئيسية - دوترا',
        shift: 'day'
    },
    {
        id: 3,
        badge_id: 'GT-02',
        pin_code: '5678',
        name_ar: 'مساعد شرطة / حسام حسن',
        name_en: 'Officer Hossam Hassan',
        role: 'officer',
        gate_assigned: 'بوابة 1 الرئيسية - دوترا',
        shift: 'night'
    },
    {
        id: 4,
        badge_id: 'CEO-01',
        email: 'ceo@dotra.com',
        name_ar: 'الرئيس التنفيذي / الإدارة العليا',
        name_en: 'Chief Executive Officer (CEO)',
        role: 'ceo',
        gate_assigned: ''
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
        if (!localStorage.getItem('gate_roster')) {
            localStorage.setItem('gate_roster', JSON.stringify(SEED_ROSTER));
        }
        if (!localStorage.getItem('gate_requests')) {
            localStorage.setItem('gate_requests', JSON.stringify([]));
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

    async addUser(userData) {
        const users = this.getUsers();
        const role = userData.role || 'officer';
        const pin = userData.pin_code || (role === 'officer' ? String(Math.floor(1000 + Math.random() * 9000)) : '');
        const password = userData.password || pin || '123456';
        
        let hash = '';
        let pinHash = '';
        if (window.Auth && typeof window.Auth.createPasswordHash === 'function') {
            hash = await window.Auth.createPasswordHash(password);
            if (pin) pinHash = await window.Auth.createPasswordHash(pin);
        }

        const newUser = {
            id: this.generateId(),
            role: role,
            badge_id: userData.badge_id || (role === 'manager' ? `MGR-0${users.length + 1}` : `GT-0${users.length + 1}`),
            name_ar: userData.name_ar || 'مستخدم جديد',
            name_en: userData.name_en || userData.name_ar || 'New User',
            pin_code: '',
            pin_hash: pinHash,
            gate_assigned: userData.gate_assigned || (role === 'officer' ? 'بوابة 1 الرئيسية - دوترا' : ''),
            shift: userData.shift || 'day',
            email: userData.email || `${role}${Date.now()}@dotra.com`,
            password_hash: hash
        };

        users.push(newUser);
        localStorage.setItem('gate_users', JSON.stringify(users));
        this.syncUsersToCloud();
        return { ...newUser, pin_code: pin, password };
    }

    async addOfficer(officerData) {
        return this.addUser({ ...officerData, role: 'officer' });
    }

    async updateUser(id, data) {
        const users = this.getUsers();
        const user = users.find(u => u.id === id);
        if (!user) return null;

        // If password is updated, recalculate hash
        if (data.password && window.Auth && typeof window.Auth.createPasswordHash === 'function') {
            data.password_hash = await window.Auth.createPasswordHash(data.password);
            delete data.password;
        }

        // If pin_code is updated, recalculate pin_hash
        if (data.pin_code && window.Auth && typeof window.Auth.createPasswordHash === 'function') {
            data.pin_hash = await window.Auth.createPasswordHash(data.pin_code);
            delete data.pin_code;
        }

        Object.assign(user, data);
        localStorage.setItem('gate_users', JSON.stringify(users));
        this.syncUsersToCloud();
        return user;
    }

    updateOfficer(id, data) {
        return this.updateUser(id, data);
    }

    deleteUser(id) {
        const users = this.getUsers();
        const user = users.find(u => u.id === id);
        if (!user) return users;

        // CRITICAL SECURITY RULE: CEO account CANNOT be deleted
        if (user.role === 'ceo') {
            throw new Error('حساب الرئيس التنفيذي محمي برمجياً ولا يمكن حذفه نهائياً.');
        }

        const filtered = users.filter(u => u.id !== id);
        localStorage.setItem('gate_users', JSON.stringify(filtered));
        this.syncUsersToCloud();
        return filtered;
    }

    deleteOfficer(id) {
        return this.deleteUser(id);
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
        const norm = (str) => {
            if (!str) return '';
            return String(str)
                .toLowerCase()
                .replace(/[\u0660-\u0669]/g, d => String.fromCharCode(d.charCodeAt(0) - 0x0660 + 48))
                .replace(/[\u06F0-\u06F9]/g, d => String.fromCharCode(d.charCodeAt(0) - 0x06F0 + 48))
                .replace(/[أإآٱ]/g, 'ا')
                .replace(/[ىيئ]/g, 'ي')
                .replace(/[ةهـ]/g, 'ه')
                .replace(/[\s\-_/.,]+/g, '')
                .trim();
        };

        const term = norm(searchTerm);
        if (!term) return null;
        const vehicles = this.getVehicles();

        // 1. Exact normalized match first
        let match = vehicles.find(v => {
            const arClean = norm(v.plate_ar);
            const enClean = norm(v.plate_en);
            return arClean === term || enClean === term;
        });
        if (match) return match;

        // 2. Substring match
        return vehicles.find(v => {
            const arClean = norm(v.plate_ar);
            const enClean = norm(v.plate_en);
            return (arClean && (arClean.includes(term) || term.includes(arClean))) || (enClean && (enClean.includes(term) || term.includes(enClean)));
        });
    }

    findPermitByCodeOrVehicle(permitCodeOrPin, vehicleId) {
        const permits = this.getPermits();
        if (permitCodeOrPin) {
            const clean = permitCodeOrPin.toString().trim();
            return permits.find(p => p.permit_code === clean || p.pin_code === clean);
        }
        if (vehicleId) {
            return permits.slice().reverse().find(p => p.vehicle_id === vehicleId && (p.status === 'active' || p.status === 'hold')) || permits.slice().reverse().find(p => p.vehicle_id === vehicleId);
        }
        return null;
    }

    findPermitByPin(pin) {
        if (!pin) return null;
        const clean = pin.toString().trim();
        const permits = this.getPermits();
        return permits.find(p => p.pin_code === clean && (p.status === 'active' || p.status === 'hold')) || permits.find(p => p.pin_code === clean);
    }

    findActivePermitByPlate(plate) {
        const vehicle = this.findVehicleByPlate(plate);
        if (!vehicle) return null;
        const permits = this.getPermits();
        return permits.slice().reverse().find(p => p.vehicle_id === vehicle.id && (p.status === 'active' || p.status === 'hold'));
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

    setPermitStatus(permitId, newStatus, reason = '') {
        const user = window.Auth ? window.Auth.getCurrentUser() : null;
        if (user && user.role !== 'manager') {
            throw new Error('Unauthorized: Only managers can modify permit authorization status.');
        }

        const permits = this.getPermits();
        const permit = permits.find(p => p.id === permitId);
        if (!permit) return null;

        permit.status = newStatus;
        if (reason) permit.hold_reason = reason;
        if (newStatus === 'active') permit.hold_reason = '';

        localStorage.setItem('gate_permits', JSON.stringify(permits));

        const vehicle = this.getVehicles().find(v => v.id === permit.vehicle_id);
        const plate = vehicle ? vehicle.plate_ar : `مركبة #${permit.vehicle_id}`;

        this.announce('PERMIT_STATUS_CHANGED', {
            permit_id: permit.id,
            permit_code: permit.permit_code,
            plate: plate,
            status: newStatus,
            reason: reason
        });

        this.pushToCloud('/api/sync', { vehicles: this.getVehicles(), permits: this.getPermits(), logs: this.getLogs() });
        this.notifyVehicleEvent('permit_status', permit.vehicle_id, plate, newStatus === 'hold' ? 'تم تعليق التصريح بقرار الإدارة' : 'تم إعادة تفعيل التصريح');

        return permit;
    }

    deletePermit(permitId) {
        const user = window.Auth ? window.Auth.getCurrentUser() : null;
        if (user && user.role !== 'manager' && user.role !== 'admin') {
            throw new Error('Unauthorized: Only managers can delete permits.');
        }

        const permits = this.getPermits();
        const permitIdx = permits.findIndex(p => String(p.id) === String(permitId));
        if (permitIdx === -1) {
            return { success: false, message: 'التصريح غير موجود أو تم حذفه مسبقاً.' };
        }

        const permit = permits[permitIdx];
        const logs = this.getLogs();
        const hasEntryLog = logs.some(l => l.permit_id === permit.id || (l.vehicle_id === permit.vehicle_id && l.action_type === 'entry'));
        const isInside = !!this.isVehicleInside(permit.vehicle_id);

        if (hasEntryLog || isInside) {
            return {
                success: false,
                message: 'لا يمكن حذف هذا التصريح نظراً لتسجيل حركة دخول فعلية للشاحنة بالمصنع. يمكنك تعليق أو سحب التصريح بدلاً من الحذف.'
            };
        }

        const vehicle = this.getVehicles().find(v => v.id === permit.vehicle_id);
        const plate = vehicle ? vehicle.plate_ar : `مركبة #${permit.vehicle_id}`;

        // Remove from list
        permits.splice(permitIdx, 1);
        localStorage.setItem('gate_permits', JSON.stringify(permits));

        this.announce('PERMIT_DELETED', {
            permit_id: permit.id,
            permit_code: permit.permit_code,
            plate: plate
        });

        this.pushToCloud('/api/sync', { vehicles: this.getVehicles(), permits: this.getPermits(), logs: this.getLogs() });
        return { success: true, message: `تم حذف التصريح (${permit.permit_code}) نهائياً بنجاح.` };
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

    recordEntry(vehicleId, permitId, officerId, gateName, remarks = '', photoUrl = null, grossWeight = null, dockBay = null) {
        const logs = this.getLogs();
        const parsedGross = grossWeight !== null && !isNaN(parseFloat(grossWeight)) ? parseFloat(grossWeight) : null;

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
            photo_url: photoUrl || null,
            gross_weight: parsedGross,
            tare_weight: null,
            net_weight: null,
            dock_bay: dockBay || null
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
            officer: officer ? officer.name_ar : 'حارس البوابة',
            gross_weight: parsedGross,
            dock_bay: dockBay
        });

        this.pushToCloud('/api/sync', { vehicles: this.getVehicles(), permits: this.getPermits(), logs: this.getLogs() });
        this.notifyVehicleEvent('entry', vehicleId, vehicle ? vehicle.plate_ar : '', gateName);

        return newLog;
    }

    recordExit(vehicleId, officerId, gateName, remarks = '', photoUrl = null, tareWeight = null) {
        const logs = this.getLogs();
        const activeEntryIndex = logs.slice().reverse().findIndex(l => l.vehicle_id === vehicleId && l.action_type === 'entry' && !l.exit_timestamp);
        const vehicles = this.getVehicles();
        const vehicle = vehicles.find(v => v.id === vehicleId);
        const parsedTare = tareWeight !== null && !isNaN(parseFloat(tareWeight)) ? parseFloat(tareWeight) : null;

        // Update vehicle state to exited
        if (vehicle) {
            vehicle.cargo_state = 'exited';
            localStorage.setItem('gate_vehicles', JSON.stringify(vehicles));
        }

        // Expire or mark permit as used
        const permits = this.getPermits();
        let permitChanged = false;
        permits.forEach(p => {
            if (p.vehicle_id === vehicleId && (p.status === 'active' || p.permit_type === 'exit')) {
                p.status = 'used';
                p.used_at = new Date().toISOString();
                permitChanged = true;
            }
        });
        if (permitChanged) {
            localStorage.setItem('gate_permits', JSON.stringify(permits));
        }

        let targetLog = null;
        if (activeEntryIndex !== -1) {
            const actualIndex = logs.length - 1 - activeEntryIndex;
            const entryLog = logs[actualIndex];
            const exitTime = new Date();
            const entryTime = this.parseTimestamp(entryLog.timestamp);
            const durationMin = Math.max(0, Math.round((exitTime.getTime() - entryTime.getTime()) / 60000));

            entryLog.exit_timestamp = exitTime.toISOString();
            entryLog.exit_gate_name = gateName;
            entryLog.exit_officer_id = officerId;
            entryLog.duration_minutes = durationMin;
            entryLog.remarks = (entryLog.remarks ? entryLog.remarks + ' | ' : '') + `خروج عبر ${gateName}`;
            if (photoUrl) {
                entryLog.exit_photo_url = photoUrl;
            }

            if (parsedTare !== null) {
                entryLog.tare_weight = parsedTare;
                if (entryLog.gross_weight !== null && !isNaN(entryLog.gross_weight)) {
                    entryLog.net_weight = Math.max(0, parseFloat((entryLog.gross_weight - parsedTare).toFixed(2)));
                }
            }

            localStorage.setItem('gate_logs', JSON.stringify(logs));

            this.announce('VEHICLE_EXIT', {
                vehicle_id: vehicleId,
                plate: vehicle ? vehicle.plate_ar : `مركبة #${vehicleId}`,
                gate: gateName,
                duration: durationMin,
                timestamp: exitTime.toISOString(),
                tare_weight: parsedTare,
                net_weight: entryLog.net_weight
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
                photo_url: photoUrl || null,
                gross_weight: null,
                tare_weight: parsedTare,
                net_weight: null
            };
            logs.push(newExitLog);
            localStorage.setItem('gate_logs', JSON.stringify(logs));

            this.announce('VEHICLE_EXIT', {
                vehicle_id: vehicleId,
                plate: vehicle ? vehicle.plate_ar : `مركبة #${vehicleId}`,
                gate: gateName,
                duration: 0,
                timestamp: new Date().toISOString(),
                tare_weight: parsedTare
            });

            this.pushToCloud('/api/sync', { vehicles: this.getVehicles(), permits: this.getPermits(), logs: this.getLogs() });
            this.notifyVehicleEvent('exit', vehicleId, vehicle ? vehicle.plate_ar : '', gateName);
            return newExitLog;
        }
    }

    // =========================================================================
    // EMERGENCY LOCKDOWN & INDUSTRIAL SAFETY EVACUATION SYSTEM
    // =========================================================================

    triggerEmergencyLockdown(reason = 'حالة طوارئ عامة بالمصنع', initiatedBy = 1) {
        const lockdownState = {
            active: true,
            reason: reason,
            initiated_at: new Date().toISOString(),
            initiated_by: initiatedBy
        };
        localStorage.setItem('gate_emergency_lockdown', JSON.stringify(lockdownState));
        this.announce('EMERGENCY_LOCKDOWN_TRIGGERED', lockdownState);
        this.pushToCloud('/api/push/notify', {
            type: 'emergency_lockdown',
            reason: reason,
            roles: ['manager', 'officer', 'ceo']
        });
        return lockdownState;
    }

    liftEmergencyLockdown() {
        const lockdownState = {
            active: false,
            lifted_at: new Date().toISOString()
        };
        localStorage.setItem('gate_emergency_lockdown', JSON.stringify(lockdownState));
        this.announce('EMERGENCY_LOCKDOWN_LIFTED', lockdownState);
        return lockdownState;
    }

    getEmergencyLockdownStatus() {
        try {
            const raw = localStorage.getItem('gate_emergency_lockdown');
            return raw ? JSON.parse(raw) : { active: false };
        } catch (e) {
            return { active: false };
        }
    }

    getEmergencyEvacuationRoster() {
        const logs = this.getLogs();
        const vehicles = this.getVehicles();
        const permits = this.getPermits();
        const activeEntries = logs.filter(l => l.action_type === 'entry' && !l.exit_timestamp);

        return activeEntries.map(log => {
            const vehicle = vehicles.find(v => v.id === log.vehicle_id) || {};
            const permit = log.permit_id ? permits.find(p => p.id === log.permit_id) : null;
            const entryTime = this.parseTimestamp(log.timestamp);
            const minutesInside = Math.max(0, Math.round((Date.now() - entryTime.getTime()) / 60000));

            return {
                vehicle_id: vehicle.id,
                plate_ar: vehicle.plate_ar || 'غير محدد',
                plate_en: vehicle.plate_en || '',
                driver_name: vehicle.driver_name_ar || vehicle.driver_name_en || 'سائق مصرح',
                driver_phone: vehicle.driver_phone || '',
                driver_national_id: vehicle.driver_national_id || '',
                company: vehicle.company_ar || vehicle.company_en || 'توريدات',
                gate_name: log.gate_name || 'بوابة 1 الرئيسية',
                entry_time: entryTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                minutes_inside: minutesInside,
                cargo_state: vehicle.cargo_state || 'inside_processing',
                gross_weight: log.gross_weight || null,
                destination: permit ? permit.destination_ar : 'المصنع الرئيسي'
            };
        });
    }

    // =========================================================================
    // SHIFT HANDOVER DIGEST & PROTOCOL
    // =========================================================================

    getShiftHandoverData(officerId) {
        const user = this.getUsers().find(u => u.id === officerId) || { id: officerId, name_ar: 'ضابط البوابة' };
        const roster = this.getOfficerRoster(officerId);
        const logs = this.getLogs();
        const vehicles = this.getVehicles();

        // Find logs for today during this officer shift
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const shiftLogs = logs.filter(l => l.officer_id === officerId && l.timestamp && l.timestamp.startsWith(todayStr));

        const entriesCount = shiftLogs.filter(l => l.action_type === 'entry').length;
        const exitsCount = shiftLogs.filter(l => l.action_type === 'exit' || (l.exit_officer_id === officerId && l.exit_timestamp && l.exit_timestamp.startsWith(todayStr))).length;
        const deniedCount = shiftLogs.filter(l => l.action_type === 'denied').length;

        // In-factory accountability (currently inside)
        const insideRoster = this.getEmergencyEvacuationRoster();

        return {
            date: todayStr,
            time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            officer_id: officerId,
            officer_name: user.name_ar || user.name_en,
            badge_id: user.badge_id || 'GT-01',
            gate_name: roster.gate_name || user.gate_assigned || 'بوابة 1 الرئيسية',
            shift: roster.shift || 'day',
            shift_name: roster.shift === 'day' ? 'وردية النهار (الصباحية)' : 'وردية الليل (المسائية)',
            partner_name: roster.partner_name_ar || 'المناوب البديل',
            partner_badge: roster.partner_badge || '',
            entries_count: entriesCount,
            exits_count: exitsCount,
            denied_count: deniedCount,
            inside_count: insideRoster.length,
            inside_vehicles: insideRoster
        };
    }

    recordShiftHandover(handoverData) {
        let handovers = [];
        try {
            const raw = localStorage.getItem('gate_shift_handovers');
            handovers = raw ? JSON.parse(raw) : [];
        } catch (e) { handovers = []; }

        const newRecord = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            ...handoverData
        };
        handovers.push(newRecord);
        localStorage.setItem('gate_shift_handovers', JSON.stringify(handovers));
        this.announce('SHIFT_HANDOVER_RECORDED', newRecord);
        return newRecord;
    }

    getShiftHandovers() {
        try {
            const raw = localStorage.getItem('gate_shift_handovers');
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    // --- Operational Cargo & Lifecycle Management ---
    updateVehicleCargoState(vehicleId, cargoState, details = '', secondaryCargo = '') {
        const vehicles = this.getVehicles();
        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (!vehicle) return null;

        vehicle.cargo_state = cargoState; // 'loaded_incoming', 'unloaded_empty', 'reloading_secondary', 'loaded_outgoing', 'ready_exit'
        vehicle.cargo_notes = details;
        if (secondaryCargo) {
            vehicle.secondary_cargo = secondaryCargo;
        }
        localStorage.setItem('gate_vehicles', JSON.stringify(vehicles));

        // Update current inside log remarks if truck is inside
        const logs = this.getLogs();
        const activeEntryLog = logs.slice().reverse().find(l => l.vehicle_id === vehicleId && l.action_type === 'entry' && !l.exit_timestamp);
        if (activeEntryLog) {
            activeEntryLog.cargo_state = cargoState;
            activeEntryLog.remarks = (activeEntryLog.remarks || '') + ` [حالة الحمولة: ${cargoState}${details ? ' - ' + details : ''}]`;
            localStorage.setItem('gate_logs', JSON.stringify(logs));
        }

        this.announce('CARGO_STATE_UPDATED', {
            vehicle_id: vehicleId,
            plate: vehicle.plate_ar,
            cargo_state: cargoState,
            details: details,
            secondary_cargo: secondaryCargo
        });

        this.pushToCloud('/api/sync', { vehicles: this.getVehicles(), permits: this.getPermits(), logs: this.getLogs() });
        return vehicle;
    }

    getVehicleOperationalLifecycle(vehicleId, permitId = null) {
        const vehicles = this.getVehicles();
        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (!vehicle) return null;

        const permits = this.getPermits();
        const permit = permitId ? permits.find(p => p.id === permitId) : (this.findActivePermitByPlate(vehicle.plate_ar) || permits.filter(p => p.vehicle_id === vehicle.id).pop());
        const insideLog = this.isVehicleInside(vehicle.id);

        let stage = 'AWAITING_ENTRY'; // Default: outside factory
        let stageLabelAr = 'خارج المصنع - بانتظار فحص الدخول';
        let stageColor = 'amber';
        let isInside = !!insideLog;
        let minutesInside = 0;

        let isOverstay = false;
        let overstayMinutes = 0;
        let isExpired = false;

        if (insideLog) {
            const entryTime = this.parseTimestamp(insideLog.timestamp).getTime();
            minutesInside = Math.max(0, Math.round((Date.now() - entryTime) / 60000));
            
            // Check overstay: duration > 120 mins or permit valid_until exceeded
            if (minutesInside > 120 || (permit && permit.valid_until && new Date() > this.parseTimestamp(permit.valid_until))) {
                isOverstay = true;
                overstayMinutes = Math.max(0, minutesInside - 120);
            }

            const cargoState = vehicle.cargo_state || 'loaded_incoming';
            if (cargoState === 'reloading_secondary') {
                stage = 'INSIDE_RELOADING';
                stageLabelAr = isOverstay ? 'داخل المصنع (متجاوزة المدة) - جاري تحميل شحنة أخرى' : 'داخل المصنع - جاري تحميل شحنة أخرى';
                stageColor = isOverstay ? 'amber' : 'purple';
            } else if (cargoState === 'unloaded_empty') {
                stage = 'INSIDE_UNLOADED';
                stageLabelAr = isOverstay ? 'داخل المصنع (متجاوزة المدة) - تم تفريغ الحمولة بالكامل' : 'داخل المصنع - تم تفريغ الحمولة بالكامل';
                stageColor = isOverstay ? 'amber' : 'blue';
            } else if (cargoState === 'ready_exit' || (permit && permit.permit_type === 'exit')) {
                stage = 'READY_EXIT';
                stageLabelAr = isOverstay ? 'أنهت العمليات (متجاوزة المدة) - جاهزة للخروج النهائي' : 'أنهت العمليات داخل المصنع - جاهزة للخروج النهائي';
                stageColor = isOverstay ? 'amber' : 'emerald';
            } else {
                stage = isOverstay ? 'INSIDE_OVERSTAY' : 'INSIDE_PROCESSING';
                stageLabelAr = isOverstay ? 'داخل المنشأة (متجاوزة المدة المسموحة) - قيد العمليات' : 'داخل المنشأة - قيد العمليات والتفريغ';
                stageColor = isOverstay ? 'red' : 'blue';
            }
        } else {
            if (vehicle.status === 'blacklist') {
                stage = 'BLACKLISTED';
                stageLabelAr = 'محظورة أمنياً من الدخول';
                stageColor = 'red';
            } else if (permit && permit.status === 'revoked') {
                stage = 'PERMIT_REVOKED';
                stageLabelAr = 'تصريح ملغي ومسحوب';
                stageColor = 'red';
            } else if (permit && permit.status === 'hold') {
                stage = 'PERMIT_HOLD';
                stageLabelAr = 'تصريح معلق بقرار الإدارة';
                stageColor = 'amber';
            } else if (permit && permit.valid_until && new Date() > this.parseTimestamp(permit.valid_until)) {
                isExpired = true;
                stage = 'PERMIT_EXPIRED';
                stageLabelAr = 'خارج المنشأة - تصريح منتهي الصلاحية / وصول متأخر';
                stageColor = 'red';
            } else {
                stage = 'AWAITING_ENTRY';
                stageLabelAr = 'خارج المنشأة - تصريح معتمد وجاهز للدخول';
                stageColor = 'emerald';
            }
        }

        return {
            vehicle,
            permit,
            insideLog,
            isInside,
            minutesInside,
            isOverstay,
            overstayMinutes,
            isExpired,
            stage,
            stageLabelAr,
            stageColor,
            cargoState: vehicle.cargo_state || (insideLog ? 'inside_processing' : 'awaiting_entry'),
            secondaryCargo: vehicle.secondary_cargo || ''
        };
    }

    recordDenied(vehicleId, officerId, gateName, reason) {
        const logs = this.getLogs();
        const vehicle = this.getVehicles().find(v => v.id === vehicleId);
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

        // Sync denied records to cloud & push notification
        this.pushToCloud('/api/sync', { vehicles: this.getVehicles(), permits: this.getPermits(), logs: this.getLogs() });
        this.notifyVehicleEvent('denied', vehicleId, vehicle ? vehicle.plate_ar : `مركبة #${vehicleId}`, gateName);

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
        if (typeof navigator !== 'undefined' && !navigator.onLine) return [];
        if (typeof fetch === 'undefined') return [];
        const user = window.Auth ? window.Auth.getCurrentUser() : null;
        try {
            const url = user ? `/api/notifications?user_id=${user.id}` : '/api/notifications';
            const res = await fetch(url).catch(() => null);
            if (!res || !res.ok) return [];
            const data = await res.json().catch(() => ({}));
            return Array.isArray(data.notifications) ? data.notifications : [];
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
        const currentUser = window.Auth ? window.Auth.getCurrentUser() : null;
        const creatorName = permitData.created_by_name || (currentUser ? (currentUser.name_ar || currentUser.name_en) : 'إدارة العمليات');
        const approverName = permitData.approved_by_name || (currentUser && (currentUser.role === 'manager' || currentUser.role === 'ceo') ? (currentUser.name_ar || currentUser.name_en) : 'م. أحمد فؤاد (مدير العمليات)');
        const approverId = permitData.approved_by || (currentUser && (currentUser.role === 'manager' || currentUser.role === 'ceo') ? currentUser.id : 1);
        const creatorId = permitData.created_by || (currentUser ? currentUser.id : 1);

        const newPermit = {
            id: this.generateId(),
            permit_code: permitData.permit_code || `PER-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
            pin_code: pin,
            permit_type: permitData.permit_type || 'entry',
            status: permitData.status || 'active',
            invoice_no: permitData.invoice_no || '',
            cargo_details: permitData.cargo_details || 'بضائع ومواد مصرحة',
            vehicle_id: permitData.vehicle_id,
            destination_ar: permitData.destination_ar || '',
            destination_en: permitData.destination_en || '',
            purpose_ar: permitData.purpose_ar || '',
            purpose_en: permitData.purpose_en || '',
            valid_from: permitData.valid_from || new Date().toISOString(),
            valid_until: permitData.valid_until || new Date(Date.now() + 8 * 3600000).toISOString(),
            created_by: creatorId,
            created_by_name: creatorName,
            approved_by: approverId,
            approved_by_name: approverName,
            created_at: new Date().toISOString()
        };
        permits.push(newPermit);
        localStorage.setItem('gate_permits', JSON.stringify(permits));

        const vehicle = this.getVehicles().find(v => v.id === newPermit.vehicle_id);
        const plateStr = permitData.plate || (vehicle ? vehicle.plate_ar : 'مركبة جديدة');

        this.announce('PERMIT_CREATED', {
            plate: plateStr,
            pin: newPermit.pin_code,
            destination: newPermit.destination_ar || 'المستودع'
        });

        // Single sync call & push notification dispatch
        this.pushToCloud('/api/sync', { vehicles: this.getVehicles(), permits: this.getPermits(), logs: this.getLogs() });
        this.notifyVehicleEvent('permit', newPermit.vehicle_id, plateStr, newPermit.destination_ar || 'المصنع');
        return newPermit;
    }

    getExecutiveMovementLogs() {
        const logs = this.getLogs();
        const permits = this.getPermits();
        const vehicles = this.getVehicles();
        const users = this.getUsers();
        const settings = this.getSettings();

        // Sort all logs chronologically (newest first)
        const sortedLogs = logs.slice().sort((a, b) => {
            const timeA = this.parseTimestamp(a.timestamp).getTime();
            const timeB = this.parseTimestamp(b.timestamp).getTime();
            return timeB - timeA || (b.id || 0) - (a.id || 0);
        });

        return sortedLogs.map(log => {
            const vehicle = vehicles.find(v => v.id === log.vehicle_id) || {
                id: log.vehicle_id,
                plate_ar: 'مركبة غير مسجلة',
                plate_en: 'UNREGISTERED',
                vehicle_type: 'truckHeavy',
                driver_name_ar: 'سائق غير مسجل',
                company_ar: 'جهة غير محددة'
            };

            const permit = permits.find(p => p.id === log.permit_id || (p.vehicle_id === log.vehicle_id && p.status !== 'superseded')) || null;
            const entryOfficer = users.find(u => u.id === log.officer_id);
            const exitOfficer = users.find(u => u.id === log.exit_officer_id);
            const creatorUser = permit ? users.find(u => u.id === permit.created_by) : null;
            const approverUser = permit ? users.find(u => u.id === permit.approved_by) : null;

            const isInside = log.action_type === 'entry' && !log.exit_timestamp;
            const entryTime = this.parseTimestamp(log.timestamp);
            const exitTime = log.exit_timestamp ? this.parseTimestamp(log.exit_timestamp) : null;

            let durationMinutes = log.duration_minutes;
            if (isInside) {
                durationMinutes = Math.max(0, Math.round((Date.now() - entryTime.getTime()) / 60000));
            } else if (exitTime && (durationMinutes === null || durationMinutes === undefined)) {
                durationMinutes = Math.max(0, Math.round((exitTime.getTime() - entryTime.getTime()) / 60000));
            }

            const overstayHours = parseInt(settings.overstay_hours_threshold) || 3;
            const isOverstay = isInside && (durationMinutes >= (overstayHours * 60));

            let status = 'exited';
            if (log.action_type === 'denied') status = 'denied';
            else if (isOverstay) status = 'overstay';
            else if (isInside) status = 'inside';
            else if (permit && permit.status === 'hold') status = 'hold';

            return {
                id: log.id,
                log_id: log.id,
                vehicle_id: log.vehicle_id,
                vehicle,
                permit,
                destination_ar: permit?.destination_ar || log.remarks || 'المستودع الرئيسي',
                destination_en: permit?.destination_en || 'Main Warehouse',
                cargo_details: permit?.cargo_details || 'بضائع ومواد مصرحة',
                invoice_no: permit?.invoice_no || '',
                created_by_name: permit?.created_by_name || (creatorUser ? creatorUser.name_ar : 'إدارة العمليات'),
                approved_by_name: permit?.approved_by_name || (approverUser ? approverUser.name_ar : 'م. أحمد فؤاد (مدير العمليات)'),
                entry_gate: log.gate_name || 'بوابة 1 الرئيسية - دوترا',
                entry_timestamp: entryTime.toISOString(),
                entry_officer_name: entryOfficer ? entryOfficer.name_ar : (log.officer_id ? `ضابط #${log.officer_id}` : 'حارس البوابة'),
                exit_gate: log.exit_gate_name || (log.action_type === 'exit' ? log.gate_name : (log.exit_timestamp ? 'بوابة خروج المصنع' : '--')),
                exit_timestamp: exitTime ? exitTime.toISOString() : null,
                exit_officer_name: exitOfficer ? exitOfficer.name_ar : (log.exit_officer_id ? `ضابط #${log.exit_officer_id}` : (log.action_type === 'exit' && entryOfficer ? entryOfficer.name_ar : '--')),
                duration_minutes: durationMinutes || 0,
                duration_hours: ((durationMinutes || 0) / 60).toFixed(1),
                gross_weight: log.gross_weight || null,
                tare_weight: log.tare_weight || null,
                net_weight: log.net_weight || null,
                dock_bay: log.dock_bay || null,
                driver_national_id: vehicle.driver_national_id || '',
                status,
                action_type: log.action_type,
                remarks: log.remarks || '',
                photo_url: log.photo_url || vehicle.photo_url || null,
                exit_photo_url: log.exit_photo_url || null
            };
        });
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
        return "رقم اللوحة,اسم السائق,رقم الهاتف,الشركة,الوجهة داخل المصنع,تفاصيل الحمولة,رقم إذن الصرف أو الفاتورة\nط ر ق ٩ ٨ ٢ ١,محمود عبدالفتاح,01012345678,شركة النيل للتوريدات,المستودع الرئيسي,شحنة أسمدة زراعية 25 طن,INV-2026-101\nس ف ر ٤ ٥ ٢ ٠,كريم الباز,01123456789,دي إتش إل مصر,مصنع المبيدات والكيماويات,طرود مستلزمات معامل,INV-2026-102\nد و ت ٧ ٧ ٨ ٨,أحمد إبراهيم الشناوي,01234567890,السويس للمواد الخام,محطة الصهاريج والتفريغ,حمولة نترات سائلة 30 ألف لتر,INV-2026-103";
    }

    getExcelTemplate() {
        const headers = ['رقم اللوحة', 'اسم السائق', 'رقم الهاتف', 'الشركة / المورد', 'الوجهة داخل المصنع', 'تفاصيل الحمولة', 'رقم إذن الصرف أو الفاتورة'];
        const sampleRows = [
            ['ط ر ق ٩ ٨ ٢ ١', 'محمود عبدالفتاح', '01012345678', 'شركة النيل للتوريدات', 'المستودع الرئيسي', 'شحنة أسمدة زراعية 25 طن', 'INV-2026-101'],
            ['س ف ر ٤ ٥ ٢ ٠', 'كريم الباز', '01123456789', 'دي إتش إل مصر', 'مصنع المبيدات والكيماويات', 'طرود مستلزمات معامل', 'INV-2026-102'],
            ['د و ت ٧ ٧ ٨ ٨', 'أحمد إبراهيم الشناوي', '01234567890', 'السويس للمواد الخام', 'محطة الصهاريج والتفريغ', 'حمولة نترات سائلة 30 ألف لتر', 'INV-2026-103'],
            ['ب ط ل ١ ٢ ٣ ٤', 'سامح عبد المجيد', '01099887766', 'المتحدة للنقل الثقيل', 'مستودع المنتج التام والتعبئة', 'شحنة شكائر تعبئة وتغليف', 'INV-2026-104']
        ];

        let rowsHtml = sampleRows.map(row => `
            <tr>
                <td style="mso-number-format:'\\@';font-weight:bold;text-align:center;color:#002b66;">${row[0]}</td>
                <td style="font-weight:bold;">${row[1]}</td>
                <td style="mso-number-format:'\\@';text-align:center;color:#107e3e;">${row[2]}</td>
                <td>${row[3]}</td>
                <td style="font-weight:bold;color:#002b66;">${row[4]}</td>
                <td>${row[5]}</td>
                <td style="mso-number-format:'\\@';text-align:center;font-weight:bold;">${row[6]}</td>
            </tr>
        `).join('');

        return `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <!--[if gte mso 9]>
                <xml>
                    <x:ExcelWorkbook>
                        <x:ExcelWorksheets>
                            <x:ExcelWorksheet>
                                <x:Name>كشف الوصول المسبق</x:Name>
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
                        ${rowsHtml}
                    </tbody>
                </table>
            </body>
            </html>
        `;
    }

    exportExpectedArrivalsToExcel() {
        const expected = this.getExpectedArrivals();
        const headers = ['م', 'رقم اللوحة', 'اسم السائق', 'رقم الهاتف', 'الشركة / المورد', 'الوجهة داخل المصنع', 'تفاصيل الحمولة', 'رقم إذن الصرف / الفاتورة', 'رمز PIN المعتمد', 'صالح حتى'];
        
        let rowsHtml = expected.map((item, idx) => `
            <tr>
                <td style="text-align:center;">${idx + 1}</td>
                <td style="mso-number-format:'\\@';font-weight:bold;text-align:center;color:#002b66;">${item.plate_ar}</td>
                <td style="font-weight:bold;">${item.driver_name_ar}</td>
                <td style="mso-number-format:'\\@';text-align:center;color:#107e3e;">${item.driver_phone || '--'}</td>
                <td>${item.company_ar}</td>
                <td style="font-weight:bold;color:#002b66;">${item.destination_ar}</td>
                <td>${item.cargo_details || '--'}</td>
                <td style="mso-number-format:'\\@';text-align:center;">${item.invoice_no || '--'}</td>
                <td style="mso-number-format:'\\@';font-weight:bold;text-align:center;color:#b85500;">${item.pin_code || '--'}</td>
                <td style="mso-number-format:'\\@';text-align:center;">${item.valid_until ? new Date(item.valid_until).toLocaleTimeString('ar-EG') : '--'}</td>
            </tr>
        `).join('');

        return `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <!--[if gte mso 9]>
                <xml>
                    <x:ExcelWorkbook>
                        <x:ExcelWorksheets>
                            <x:ExcelWorksheet>
                                <x:Name>كشف الشاحنات المتوقعة</x:Name>
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
                        ${rowsHtml}
                    </tbody>
                </table>
            </body>
            </html>
        `;
    }

    importPreArrivalsFromCSV(text) {
        if (!text || !text.trim()) return { success: false, count: 0, message: 'الملف فارغ' };
        
        let rows = [];

        // Check if text is HTML / XML Excel table format
        if (text.includes('<tr') || text.includes('<table')) {
            const trMatches = text.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
            trMatches.forEach((tr) => {
                const cellMatches = tr.match(/<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi) || [];
                const rowData = cellMatches.map(cell => cell.replace(/<[^>]+>/g, '').trim());
                if (rowData.length > 0) {
                    rows.push(rowData);
                }
            });
        } else {
            // Text / CSV / TSV rows
            const lines = text.trim().split(/\r?\n/);
            lines.forEach(line => {
                line = line.trim();
                if (!line) return;
                let parts = [];
                if (line.includes('\t')) parts = line.split('\t');
                else if (line.includes(';')) parts = line.split(';');
                else {
                    parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(s => s.replace(/^"|"$/g, '').trim());
                }
                if (parts.length > 0) rows.push(parts.map(p => p.trim()));
            });
        }

        if (rows.length < 2) return { success: false, count: 0, message: 'الملف لا يحتوي على بيانات شاحنات' };

        // Skip header row if it contains header words
        const startIdx = (rows[0][0] && (rows[0][0].includes('لوحة') || rows[0][0].toLowerCase().includes('plate'))) ? 1 : 0;

        const imported = [];
        for (let i = startIdx; i < rows.length; i++) {
            const parts = rows[i];
            const plate = parts[0]?.trim();
            const driverName = parts[1]?.trim() || 'سائق مصرح';
            const phone = parts[2]?.trim() || '';
            const company = parts[3]?.trim() || 'مورد عام';
            const destination = parts[4]?.trim() || 'المستودع الرئيسي';
            const cargo = parts[5]?.trim() || 'بضائع ومستلزمات عامة';
            const invoice = parts[6]?.trim() || '';

            if (!plate || plate.includes('رقم اللوحة') || plate.toLowerCase() === 'plate') continue;

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

    // =========================================================================
    // GATE & SHIFT ROSTER MANAGEMENT (DAY & NIGHT SHIFTS / BACK-TO-BACK)
    // =========================================================================

    getGateRoster() {
        const raw = localStorage.getItem('gate_roster');
        let roster = [];
        try {
            roster = raw ? JSON.parse(raw) : [];
        } catch (e) {
            roster = [];
        }

        const gates = this.getGates();
        const users = this.getUsers().filter(u => u.role === 'officer');

        // Ensure all existing gates are represented in the roster
        gates.forEach(gate => {
            if (!roster.find(r => r.gate_name === gate)) {
                roster.push({
                    gate_name: gate,
                    day_officer_id: null,
                    night_officer_id: null,
                    notes: ''
                });
            }
        });

        // Enrich with officer details
        return roster.map(item => {
            const dayOfficer = users.find(u => u.id === item.day_officer_id) || null;
            const nightOfficer = users.find(u => u.id === item.night_officer_id) || null;
            return {
                ...item,
                day_officer: dayOfficer,
                night_officer: nightOfficer,
                day_officer_name: dayOfficer ? dayOfficer.name_ar : '',
                day_officer_badge: dayOfficer ? dayOfficer.badge_id : '',
                night_officer_name: nightOfficer ? nightOfficer.name_ar : '',
                night_officer_badge: nightOfficer ? nightOfficer.badge_id : ''
            };
        });
    }

    saveGateRoster(roster) {
        if (!Array.isArray(roster)) return false;
        localStorage.setItem('gate_roster', JSON.stringify(roster));

        // Sync officer users with their newly assigned gates & shifts
        const users = this.getUsers();
        roster.forEach(item => {
            if (item.day_officer_id) {
                const u = users.find(x => x.id === item.day_officer_id);
                if (u) {
                    u.gate_assigned = item.gate_name;
                    u.shift = 'day';
                    u.back_to_back_user_id = item.night_officer_id || null;
                }
            }
            if (item.night_officer_id) {
                const u = users.find(x => x.id === item.night_officer_id);
                if (u) {
                    u.gate_assigned = item.gate_name;
                    u.shift = 'night';
                    u.back_to_back_user_id = item.day_officer_id || null;
                }
            }
        });
        localStorage.setItem('gate_users', JSON.stringify(users));

        this.announce('ROSTER_UPDATED', { timestamp: Date.now() });
        this.pushToCloud('/api/sync', { vehicles: this.getVehicles(), permits: this.getPermits(), logs: this.getLogs() });
        return true;
    }

    assignGateOfficers(gateName, dayOfficerId, nightOfficerId, notes = '') {
        const roster = this.getGateRoster();
        let entry = roster.find(r => r.gate_name === gateName);
        if (!entry) {
            entry = { gate_name: gateName, day_officer_id: null, night_officer_id: null, notes: '' };
            roster.push(entry);
        }
        entry.day_officer_id = dayOfficerId ? parseInt(dayOfficerId) : null;
        entry.night_officer_id = nightOfficerId ? parseInt(nightOfficerId) : null;
        if (notes) entry.notes = notes;

        return this.saveGateRoster(roster);
    }

    getOfficerRoster(officerId) {
        const defaultRoster = {
            gate_name: 'بوابة 1 الرئيسية - دوترا',
            shift: 'day',
            shift_name_ar: 'وردية النهار (صباحية)',
            shift_name_en: 'Day Shift',
            partner_officer: null,
            partner_name_ar: 'غير محدد',
            partner_badge: '--'
        };
        if (!officerId) return defaultRoster;
        const roster = this.getGateRoster();
        const users = this.getUsers();
        const id = parseInt(officerId);

        for (const item of roster) {
            if (item.day_officer_id === id) {
                const partner = users.find(u => u.id === item.night_officer_id) || null;
                return {
                    gate_name: item.gate_name,
                    shift: 'day',
                    shift_name_ar: 'وردية النهار (صباحية)',
                    shift_name_en: 'Day Shift',
                    partner_officer: partner,
                    partner_name_ar: partner ? partner.name_ar : 'غير محدد',
                    partner_badge: partner ? partner.badge_id : '--'
                };
            }
            if (item.night_officer_id === id) {
                const partner = users.find(u => u.id === item.day_officer_id) || null;
                return {
                    gate_name: item.gate_name,
                    shift: 'night',
                    shift_name_ar: 'وردية الليل (مسائية)',
                    shift_name_en: 'Night Shift',
                    partner_officer: partner,
                    partner_name_ar: partner ? partner.name_ar : 'غير محدد',
                    partner_badge: partner ? partner.badge_id : '--'
                };
            }
        }

        // Fallback to user profile if not in roster
        const user = users.find(u => u.id === id);
        return {
            gate_name: user?.gate_assigned || 'بوابة 1 الرئيسية - دوترا',
            shift: user?.shift || 'day',
            shift_name_ar: user?.shift === 'night' ? 'وردية الليل (مسائية)' : 'وردية النهار (صباحية)',
            shift_name_en: user?.shift === 'night' ? 'Night Shift' : 'Day Shift',
            partner_officer: null,
            partner_name_ar: 'غير محدد',
            partner_badge: '--'
        };
    }

    getRosterCsvTemplate() {
        return "اسم البوابة,كود شارة ضابط وردية النهار,اسم ضابط النهار,كود شارة ضابط وردية الليل (المناوب البديل),اسم ضابط الليل,ملاحظات\nبوابة 1 الرئيسية - دوترا,GT-01,طارق محمود,GT-02,حسام حسن,البوابة الرئيسية للشاحنات\nبوابة 2 الشحن والجمارك - دوترا,GT-02,حسام حسن,GT-01,طارق محمود,بوابة الشحن والمستودعات\nبوابة 3 المواد الخام والكيماويات,,,,,\nبوابة 4 خروج الإنتاج والشاحنات,,,,,";
    }

    getRosterExcelTemplate() {
        const headers = ['اسم البوابة', 'كود شارة ضابط وردية النهار', 'اسم ضابط النهار', 'كود شارة ضابط وردية الليل', 'اسم ضابط الليل', 'ملاحظات وتفاصيل التعيين'];
        const sampleRows = [
            ['بوابة 1 الرئيسية - دوترا', 'GT-01', 'طارق محمود', 'GT-02', 'حسام حسن', 'البوابة الرئيسية للشاحنات والموردين'],
            ['بوابة 2 الشحن والجمارك - دوترا', 'GT-02', 'حسام حسن', 'GT-01', 'طارق محمود', 'بوابة الشحن والمستودعات المركزية'],
            ['بوابة 3 المواد الخام والكيماويات', '', '', '', '', 'وردية نهارية فقط'],
            ['بوابة 4 خروج الإنتاج والشاحنات', '', '', '', '', 'بوابة الخروج والميزان']
        ];

        let rowsHtml = sampleRows.map(row => `
            <tr>
                <td style="font-weight:bold;color:#002b66;">${row[0]}</td>
                <td style="mso-number-format:'\\@';font-weight:bold;text-align:center;color:#b85500;">${row[1]}</td>
                <td style="font-weight:bold;">${row[2]}</td>
                <td style="mso-number-format:'\\@';font-weight:bold;text-align:center;color:#107e3e;">${row[3]}</td>
                <td style="font-weight:bold;">${row[4]}</td>
                <td>${row[5]}</td>
            </tr>
        `).join('');

        return `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <!--[if gte mso 9]>
                <xml>
                    <x:ExcelWorkbook>
                        <x:ExcelWorksheets>
                            <x:ExcelWorksheet>
                                <x:Name>جدول ورديات البوابات</x:Name>
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
                        ${rowsHtml}
                    </tbody>
                </table>
            </body>
            </html>
        `;
    }

    exportRosterToExcel() {
        const roster = this.getGateRoster();
        const headers = ['م', 'اسم البوابة', 'كود شارة ضابط النهار', 'اسم ضابط وردية النهار', 'كود شارة ضابط الليل', 'اسم ضابط وردية الليل', 'ملاحظات'];
        
        let rowsHtml = roster.map((r, idx) => `
            <tr>
                <td style="text-align:center;">${idx + 1}</td>
                <td style="font-weight:bold;color:#002b66;">${r.gate_name || '--'}</td>
                <td style="mso-number-format:'\\@';font-weight:bold;text-align:center;color:#b85500;">${r.day_officer_badge || '--'}</td>
                <td style="font-weight:bold;">${r.day_officer_name || '--'}</td>
                <td style="mso-number-format:'\\@';font-weight:bold;text-align:center;color:#107e3e;">${r.night_officer_badge || '--'}</td>
                <td style="font-weight:bold;">${r.night_officer_name || '--'}</td>
                <td>${r.notes || '--'}</td>
            </tr>
        `).join('');

        return `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <!--[if gte mso 9]>
                <xml>
                    <x:ExcelWorkbook>
                        <x:ExcelWorksheets>
                            <x:ExcelWorksheet>
                                <x:Name>كشف مناوبات البوابات</x:Name>
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
                        ${rowsHtml}
                    </tbody>
                </table>
            </body>
            </html>
        `;
    }

    importRosterFromCSV(text) {
        if (!text || !text.trim()) return { success: false, count: 0, message: 'الملف فارغ' };

        let rows = [];
        if (text.includes('<tr') || text.includes('<table')) {
            const trMatches = text.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
            trMatches.forEach(tr => {
                const cellMatches = tr.match(/<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi) || [];
                const rowData = cellMatches.map(cell => cell.replace(/<[^>]+>/g, '').trim());
                if (rowData.length > 0) rows.push(rowData);
            });
        } else {
            const lines = text.trim().split(/\r?\n/);
            lines.forEach(line => {
                line = line.trim();
                if (!line) return;
                let parts = [];
                if (line.includes('\t')) parts = line.split('\t');
                else if (line.includes(';')) parts = line.split(';');
                else parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(s => s.replace(/^"|"$/g, '').trim());
                if (parts.length > 0) rows.push(parts.map(p => p.trim()));
            });
        }

        if (rows.length < 2) return { success: false, count: 0, message: 'الملف لا يحتوي على صفوف بيانات' };

        const users = this.getUsers();
        const currentGates = this.getGates();
        const roster = this.getGateRoster();
        let updatedCount = 0;

        const startIdx = (rows[0][0] && (rows[0][0].includes('بوابة') || rows[0][0].toLowerCase().includes('gate'))) ? 1 : 0;

        for (let i = startIdx; i < rows.length; i++) {
            const parts = rows[i];
            if (parts.length < 1 || !parts[0]) continue;

            const gateName = parts[0]?.trim();
            const dayBadge = parts[1]?.trim() || '';
            const dayName = parts[2]?.trim() || '';
            const nightBadge = parts[3]?.trim() || '';
            const nightName = parts[4]?.trim() || '';
            const notes = parts[5]?.trim() || '';

            if (!gateName || gateName.includes('اسم البوابة')) continue;

            // Ensure gate exists in gates list
            if (!currentGates.includes(gateName)) {
                this.addGate(gateName);
            }

            // Match day officer by badge ID or name
            let dayOfficer = null;
            if (dayBadge) dayOfficer = users.find(u => u.badge_id && u.badge_id.toLowerCase() === dayBadge.toLowerCase());
            if (!dayOfficer && dayName) dayOfficer = users.find(u => u.name_ar && u.name_ar.includes(dayName));

            // Match night officer by badge ID or name
            let nightOfficer = null;
            if (nightBadge) nightOfficer = users.find(u => u.badge_id && u.badge_id.toLowerCase() === nightBadge.toLowerCase());
            if (!nightOfficer && nightName) nightOfficer = users.find(u => u.name_ar && u.name_ar.includes(nightName));

            let entry = roster.find(r => r.gate_name === gateName);
            if (!entry) {
                entry = { gate_name: gateName, day_officer_id: null, night_officer_id: null, notes: '' };
                roster.push(entry);
            }

            entry.day_officer_id = dayOfficer ? dayOfficer.id : null;
            entry.night_officer_id = nightOfficer ? nightOfficer.id : null;
            if (notes) entry.notes = notes;
            updatedCount++;
        }

        this.saveGateRoster(roster);
        return { success: true, count: updatedCount, message: `تم تحديث وتعيين جدول المناوبات لعدد (${updatedCount}) بوابة بنجاح` };
    }

    exportRosterToCSV() {
        return this.exportRosterToExcel();
    }

    // =========================================================================
    // OFFICER INSPECTION & ENTRY APPROVAL REQUESTS (MULTI-PHOTO: PLATE & CARRIAGE)
    // =========================================================================

    getInspectionRequests() {
        const raw = localStorage.getItem('gate_requests');
        try {
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    getPendingInspectionRequests() {
        return this.getInspectionRequests().filter(r => r.status === 'pending');
    }

    createInspectionRequest({
        plate_ar,
        plate_en = '',
        driver_name = 'سائق زائر',
        driver_phone = '',
        company = 'مورد عام',
        destination = 'المستودع الرئيسي',
        cargo_details = 'بضائع ومواد',
        vehicle_type = 'truckHeavy',
        notes = '',
        plate_photo_url = null,
        carriage_photo_url = null,
        officer_id = 2,
        gate_name = 'بوابة 1 الرئيسية - دوترا'
    }) {
        const requests = this.getInspectionRequests();
        const users = this.getUsers();
        const officer = users.find(u => u.id === officer_id);

        const newRequest = {
            id: this.generateId(),
            plate_ar: plate_ar || '',
            plate_en: plate_en || plate_ar || '',
            driver_name: driver_name || 'سائق زائر',
            driver_phone: driver_phone || '',
            company: company || 'مورد عام',
            destination: destination || 'المستودع الرئيسي',
            cargo_details: cargo_details || 'بضائع ومواد',
            vehicle_type: vehicle_type || 'truckHeavy',
            notes: notes || '',
            plate_photo_url: plate_photo_url || null,
            carriage_photo_url: carriage_photo_url || null,
            officer_id: officer_id,
            officer_name: officer ? officer.name_ar : 'حارس البوابة',
            gate_name: gate_name,
            status: 'pending', // 'pending' | 'approved' | 'rejected'
            manager_decision_notes: '',
            created_at: new Date().toISOString(),
            decided_at: null,
            permit_id: null
        };

        requests.push(newRequest);
        localStorage.setItem('gate_requests', JSON.stringify(requests));

        // Announce live event across all manager tabs
        this.announce('INSPECTION_REQUEST_CREATED', {
            request_id: newRequest.id,
            plate: newRequest.plate_ar,
            driver: newRequest.driver_name,
            gate: newRequest.gate_name,
            officer: newRequest.officer_name
        });

        // Trigger push notification to managers
        if (typeof window !== 'undefined' && window.PushService && typeof window.PushService.sendCustomNotification === 'function') {
            window.PushService.sendCustomNotification({
                title: `🚨 طلب فحص واستئذان دخول: ${newRequest.plate_ar}`,
                body: `السائق: ${newRequest.driver_name} عند ${newRequest.gate_name}. يرجى مراجعة صور اللوحة والصندوق واتخاذ القرار.`,
                targetRole: 'manager',
                tag: `request-${newRequest.id}`
            }).catch(() => {});
        }

        return newRequest;
    }

    decideInspectionRequest(requestId, decision, managerNotes = '', managerUserId = 1) {
        const requests = this.getInspectionRequests();
        const req = requests.find(r => String(r.id) === String(requestId));
        if (!req) return { success: false, message: 'الطلب غير موجود' };

        const users = this.getUsers();
        const manager = users.find(u => u.id === managerUserId) || { name_ar: 'م. أحمد فؤاد (مدير العمليات)' };

        req.status = decision === 'approve' ? 'approved' : 'rejected';
        req.manager_decision_notes = managerNotes || (decision === 'approve' ? 'تمت الموافقة والاعتماد المباشر من المدير' : 'تم رفض الدخول');
        req.decided_at = new Date().toISOString();
        req.decided_by_name = manager.name_ar;

        let generatedPermit = null;

        if (decision === 'approve') {
            // Find or create vehicle
            let vehicle = this.findVehicleByPlate(req.plate_ar);
            if (!vehicle) {
                vehicle = this.addVehicle({
                    plate_ar: req.plate_ar,
                    plate_en: req.plate_en,
                    vehicle_type: req.vehicle_type,
                    driver_name_ar: req.driver_name,
                    driver_name_en: req.driver_name,
                    driver_phone: req.driver_phone,
                    company_ar: req.company,
                    company_en: req.company,
                    status: 'visitor',
                    photo_url: req.plate_photo_url
                });
            } else {
                if (req.plate_photo_url) vehicle.photo_url = req.plate_photo_url;
                if (req.driver_phone) vehicle.driver_phone = req.driver_phone;
            }

            // Expire previous active permits for this vehicle to prevent duplicates
            this.expireExistingPermitsForVehicle(vehicle.id);

            // Generate approved permit
            generatedPermit = this.addPermit({
                vehicle_id: vehicle.id,
                destination_ar: req.destination,
                destination_en: req.destination,
                cargo_details: req.cargo_details,
                purpose_ar: `طلب استئذان معتمد: ${req.notes || 'دخول استثنائي معتمد بالصور'}`,
                permit_type: 'entry',
                valid_from: new Date().toISOString(),
                valid_until: new Date(Date.now() + 8 * 3600000).toISOString(),
                created_by: managerUserId,
                created_by_name: manager.name_ar,
                approved_by: managerUserId,
                approved_by_name: manager.name_ar
            });

            req.permit_id = generatedPermit.id;
            req.permit_code = generatedPermit.permit_code;
            req.pin_code = generatedPermit.pin_code;
        }

        localStorage.setItem('gate_requests', JSON.stringify(requests));

        // Announce decision live to gate officer
        this.announce('INSPECTION_REQUEST_DECIDED', {
            request_id: req.id,
            status: req.status,
            plate: req.plate_ar,
            gate: req.gate_name,
            permit_id: req.permit_id,
            permit_code: req.permit_code,
            pin_code: req.pin_code,
            manager_notes: req.manager_decision_notes
        });

        this.pushToCloud('/api/sync', { vehicles: this.getVehicles(), permits: this.getPermits(), logs: this.getLogs() });
        return { success: true, request: req, permit: generatedPermit };
    }

    // =========================================================================
    // GATE OFFICER HOLD / REVOKE PERMIT REQUESTS
    // =========================================================================

    getPermitHoldRequests() {
        const raw = localStorage.getItem('gate_hold_requests');
        try {
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    getPendingPermitHoldRequests() {
        return this.getPermitHoldRequests().filter(r => r.status === 'pending');
    }

    createPermitHoldRequest({
        permit_id,
        vehicle_id,
        plate_ar,
        driver_name = 'سائق مصرح',
        officer_id = 2,
        gate_name = 'بوابة 1 الرئيسية - دوترا',
        request_type = 'hold', // 'hold' | 'revoke'
        reason = 'مراجعة أمنية',
        notes = ''
    }) {
        const requests = this.getPermitHoldRequests();
        const users = this.getUsers();
        const officer = users.find(u => u.id === officer_id);
        const permit = permit_id ? this.getPermits().find(p => String(p.id) === String(permit_id)) : null;

        const newRequest = {
            id: this.generateId(),
            permit_id: permit ? permit.id : null,
            permit_code: permit ? permit.permit_code : '',
            pin_code: permit ? permit.pin_code : '',
            vehicle_id: vehicle_id || (permit ? permit.vehicle_id : null),
            plate_ar: plate_ar || '',
            driver_name: driver_name || '',
            officer_id: officer_id,
            officer_name: officer ? officer.name_ar : 'ضابط البوابة',
            gate_name: gate_name,
            request_type: request_type, // 'hold' | 'revoke'
            reason: reason || 'مراجعة أمنية',
            notes: notes || '',
            status: 'pending', // 'pending' | 'approved' | 'rejected'
            manager_decision_notes: '',
            created_at: new Date().toISOString(),
            decided_at: null
        };

        requests.push(newRequest);
        localStorage.setItem('gate_hold_requests', JSON.stringify(requests));

        // Announce live event to manager
        this.announce('PERMIT_HOLD_REQUEST_CREATED', {
            request_id: newRequest.id,
            permit_id: newRequest.permit_id,
            permit_code: newRequest.permit_code,
            plate: newRequest.plate_ar,
            gate: newRequest.gate_name,
            officer: newRequest.officer_name,
            type: newRequest.request_type,
            reason: newRequest.reason
        });

        // Push notification to manager
        if (typeof window !== 'undefined' && window.PushService && typeof window.PushService.sendCustomNotification === 'function') {
            window.PushService.sendCustomNotification({
                title: `⚠️ طلب ${newRequest.request_type === 'revoke' ? 'سحب وإلغاء' : 'تعليق'} تصريح: ${newRequest.plate_ar}`,
                body: `الضابط: ${newRequest.officer_name} عند ${newRequest.gate_name}. السبب: ${newRequest.reason}`,
                targetRole: 'manager',
                tag: `hold-request-${newRequest.id}`
            }).catch(() => {});
        }

        return newRequest;
    }

    decidePermitHoldRequest(requestId, decision, managerNotes = '', managerUserId = 1) {
        const requests = this.getPermitHoldRequests();
        const req = requests.find(r => String(r.id) === String(requestId));
        if (!req) return { success: false, message: 'طلب التعليق غير موجود' };

        const users = this.getUsers();
        const manager = users.find(u => u.id === managerUserId) || { name_ar: 'م. أحمد فؤاد (مدير العمليات)' };

        req.status = decision === 'reject' ? 'rejected' : 'approved';
        req.manager_decision_notes = managerNotes || (decision === 'reject' ? 'تم رفض طلب التعليق والإبقاء على التصريح سارياً' : 'تم اعتماد الطلب وتطبيق الإجراء');
        req.decided_at = new Date().toISOString();
        req.decided_by_name = manager.name_ar;

        if (decision === 'approve_hold') {
            if (req.permit_id) {
                this.setPermitStatus(req.permit_id, 'hold', `${req.reason}${managerNotes ? ' - ' + managerNotes : ''}`);
            }
        } else if (decision === 'approve_revoke') {
            if (req.permit_id) {
                this.setPermitStatus(req.permit_id, 'revoked', `${req.reason}${managerNotes ? ' - ' + managerNotes : ''}`);
            }
        }

        localStorage.setItem('gate_hold_requests', JSON.stringify(requests));

        // Announce decision live
        this.announce('PERMIT_HOLD_REQUEST_DECIDED', {
            request_id: req.id,
            permit_id: req.permit_id,
            status: req.status,
            decision: decision,
            plate: req.plate_ar,
            gate: req.gate_name
        });

        this.pushToCloud('/api/sync', { vehicles: this.getVehicles(), permits: this.getPermits(), logs: this.getLogs() });
        return { success: true, request: req };
    }
}

window.DB = new DatabaseService();
