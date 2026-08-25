// Database Layer - Egyptian Standard Vehicles, Settings & Cloudflare D1 Sync
// طبقة إدارة البيانات - قاعدة بيانات كلاود فلير D1 بدون أي تصاريح مسبقة (تصاريح جديدة ونظيفة 100%)

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
        gate_assigned: 'Office HQ (الإدارة الرئيسية)'
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

const SEED_SETTINGS = {
    default_whatsapp: '01012345678',
    company_name_ar: 'مجموعة دوترا',
    company_name_en: 'DOTRA Group',
    gate_name_ar: 'بوابة مصانع دوترا الرئيسية',
    gate_name_en: 'DOTRA Main Factory Gate',
    auto_send_default: true,
    overstay_hours_threshold: 3
};

const SEED_VEHICLES = [];

// No Hardcoded Permits - Clean Slate
const SEED_PERMITS = [];
const SEED_LOGS = [];

class DatabaseService {
    constructor() {
        this.initStorage();
    }

    initStorage() {
        if (!localStorage.getItem('gate_users')) {
            localStorage.setItem('gate_users', JSON.stringify(SEED_USERS));
        }
        if (!localStorage.getItem('gate_vehicles')) {
            localStorage.setItem('gate_vehicles', JSON.stringify(SEED_VEHICLES));
        }
        
        // Ensure permits start empty (Clean Slate)
        if (!localStorage.getItem('gate_permits_v2_clean')) {
            localStorage.setItem('gate_permits', JSON.stringify(SEED_PERMITS));
            localStorage.setItem('gate_logs', JSON.stringify(SEED_LOGS));
            localStorage.setItem('gate_permits_v2_clean', 'true');
        }

        if (!localStorage.getItem('gate_settings')) {
            localStorage.setItem('gate_settings', JSON.stringify(SEED_SETTINGS));
        }
    }

    getSettings() {
        return JSON.parse(localStorage.getItem('gate_settings') || JSON.stringify(SEED_SETTINGS));
    }

    updateSettings(newSettings) {
        const current = this.getSettings();
        const updated = { ...current, ...newSettings };
        localStorage.setItem('gate_settings', JSON.stringify(updated));
        return updated;
    }

    getUsers() {
        return JSON.parse(localStorage.getItem('gate_users') || '[]');
    }

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
            status: 'active',
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
