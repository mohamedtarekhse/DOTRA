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

class DatabaseService {
    constructor() {
        this.initStorage();
    }

    initStorage() {
        // Force-clean any old cached vehicle, permit or log entries from user browser
        if (localStorage.getItem('gate_storage_v4_clean') !== 'true') {
            localStorage.removeItem('gate_vehicles');
            localStorage.removeItem('gate_permits');
            localStorage.removeItem('gate_logs');
            localStorage.setItem('gate_storage_v4_clean', 'true');
        }

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

    findPermitByCodeOrVehicle(permitCode, vehicleId) {
        const permits = this.getPermits();
        if (permitCode) {
            return permits.find(p => p.permit_code === permitCode);
        }
        if (vehicleId) {
            return permits.find(p => p.vehicle_id === vehicleId && p.status === 'active');
        }
        return null;
    }

    findActivePermitByPlate(plate) {
        const vehicle = this.findVehicleByPlate(plate);
        if (!vehicle) return null;
        const permits = this.getPermits();
        return permits.find(p => p.vehicle_id === vehicle.id && p.status === 'active');
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

    recordEntry(vehicleId, permitId, officerId, gateName, remarks = '') {
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
            remarks: remarks
        };
        logs.push(newLog);
        localStorage.setItem('gate_logs', JSON.stringify(logs));
        return newLog;
    }

    recordExit(vehicleId, officerId, gateName, remarks = '') {
        const logs = this.getLogs();
        const activeEntryIndex = logs.slice().reverse().findIndex(l => l.vehicle_id === vehicleId && l.action_type === 'entry' && !l.exit_timestamp);
        
        if (activeEntryIndex !== -1) {
            const actualIndex = logs.length - 1 - activeEntryIndex;
            const entryLog = logs[actualIndex];
            const exitTime = new Date();
            const entryTime = new Date(entryLog.timestamp);
            const durationMin = Math.round((exitTime - entryTime) / 60000);
            
            entryLog.exit_timestamp = exitTime.toISOString();
            entryLog.duration_minutes = durationMin;
            entryLog.remarks = (entryLog.remarks ? entryLog.remarks + ' | ' : '') + `خروج عبر ${gateName}`;
            
            localStorage.setItem('gate_logs', JSON.stringify(logs));
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
                remarks: remarks || 'تسجيل خروج مباشر'
            };
            logs.push(newExitLog);
            localStorage.setItem('gate_logs', JSON.stringify(logs));
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

    addVehicle(vehicleData) {
        const vehicles = this.getVehicles();
        const newVehicle = {
            id: Date.now(),
            ...vehicleData
        };
        vehicles.push(newVehicle);
        localStorage.setItem('gate_vehicles', JSON.stringify(vehicles));
        return newVehicle;
    }

    addPermit(permitData) {
        const permits = this.getPermits();
        const newPermit = {
            id: Date.now(),
            permit_code: `PER-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
            permit_type: permitData.permit_type || 'entry', // 'entry' | 'exit' | 'both'
            status: 'active',
            invoice_no: permitData.invoice_no || '',
            cargo_details: permitData.cargo_details || 'بضائع مصرحة',
            ...permitData
        };
        permits.push(newPermit);
        localStorage.setItem('gate_permits', JSON.stringify(permits));
        return newPermit;
    }

    updateVehicleStatus(vehicleId, status, blacklistReason = '') {
        const vehicles = this.getVehicles();
        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (vehicle) {
            vehicle.status = status;
            vehicle.blacklist_reason = blacklistReason;
            localStorage.setItem('gate_vehicles', JSON.stringify(vehicles));
        }
        return vehicle;
    }
}

window.DB = new DatabaseService();
