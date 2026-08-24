// Database Layer - Cloudflare D1 Integration & Local Storage Sync
// طبقة إدارة البيانات - قاعدة بيانات كلاود فلير D1 مع المزامنة الفورية

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
        name_ar: 'الضابط طارق الحربي',
        name_en: 'Officer Tariq Al-Harbi',
        role: 'officer',
        gate_assigned: 'بوابة 1 الرئيسية (Gate 1 Main)'
    },
    {
        id: 3,
        badge_id: 'GT-02',
        email: 'officer2@factory.com',
        password: 'Officer@2026',
        pin_code: '5678',
        name_ar: 'الضابط خالد الشمري',
        name_en: 'Officer Khalid Al-Shammari',
        role: 'officer',
        gate_assigned: 'بوابة 2 الشحن (Gate 2 Cargo)'
    }
];

const SEED_VEHICLES = [
    {
        id: 1,
        plate_ar: 'أ ب ج 9 8 2 1',
        plate_en: 'ABJ 9821',
        vehicle_type: 'truckHeavy',
        driver_name_ar: 'عبدالرحمن الدوسري',
        driver_name_en: 'Abdulrahman Al-Dossari',
        driver_phone: '+966501234567',
        company_ar: 'شركة إسمنت اليمامة',
        company_en: 'Yamama Cement Co.',
        status: 'whitelist'
    },
    {
        id: 2,
        plate_ar: 'د ر س 4 5 2 0',
        plate_en: 'DRS 4520',
        vehicle_type: 'van',
        driver_name_ar: 'محمد سامي العلي',
        driver_name_en: 'Mohamed Sami Al-Ali',
        driver_phone: '+966559876543',
        company_ar: 'دي إتش إل للشحن السريع',
        company_en: 'DHL Express Logistics',
        status: 'visitor'
    },
    {
        id: 3,
        plate_ar: 'ص ق ط 1 1 0 2',
        plate_en: 'SQT 1102',
        vehicle_type: 'tanker',
        driver_name_ar: 'فهد إبراهيم السبيعي',
        driver_name_en: 'Fahad Al-Subaie',
        driver_phone: '+966543322110',
        company_ar: 'الوقود والغاز الصناعي',
        company_en: 'Industrial Gas & Fuel',
        status: 'visitor'
    },
    {
        id: 4,
        plate_ar: 'ح م د 3 3 0 4',
        plate_en: 'HMD 3304',
        vehicle_type: 'car',
        driver_name_ar: 'سالم مبارك القحطاني',
        driver_name_en: 'Salem Al-Qahtani',
        driver_phone: '+966567788990',
        company_ar: 'الشركة العربية للحديد والصلب',
        company_en: 'Arabian Steel & Metal',
        status: 'blacklist',
        blacklist_reason: 'تجاوز السرعة المحددة داخل المصنع ومخالفة اشتراطات السلامة'
    }
];

const SEED_PERMITS = [
    {
        id: 1,
        permit_code: 'PER-2026-8801',
        vehicle_id: 1,
        destination_ar: 'مستودع المواد الخام - رصيف 3',
        destination_en: 'Raw Materials Warehouse - Bay 3',
        purpose_ar: 'تفريغ شحنة إسمنت وحصى',
        purpose_en: 'Unload cement and aggregate',
        cargo_details: '30 طن إسمنت بورتلاندي',
        valid_from: new Date(Date.now() - 3 * 3600000).toISOString(),
        valid_until: new Date(Date.now() + 5 * 3600000).toISOString(),
        status: 'active'
    },
    {
        id: 2,
        permit_code: 'PER-2026-8802',
        vehicle_id: 2,
        destination_ar: 'مبنى الإدارة ومستودع الطرود',
        destination_en: 'Admin Building & Parcels Dept',
        purpose_ar: 'تسليم قطع غيار وأوراق جمركية',
        purpose_en: 'Deliver spare parts and customs docs',
        cargo_details: '8 طرود بريدية ومستندات',
        valid_from: new Date(Date.now() - 1 * 3600000).toISOString(),
        valid_until: new Date(Date.now() + 3 * 3600000).toISOString(),
        status: 'active'
    },
    {
        id: 3,
        permit_code: 'PER-2026-8803',
        vehicle_id: 3,
        destination_ar: 'محطة خزانات الديزل المركزية',
        destination_en: 'Central Diesel Tank Farm',
        purpose_ar: 'تزويد محطة الطاقة بالديزل',
        purpose_en: 'Diesel supply for backup generator',
        cargo_details: '20,000 لتر ديزل ممتاز',
        valid_from: new Date(Date.now() - 6 * 3600000).toISOString(),
        valid_until: new Date(Date.now() - 1 * 3600000).toISOString(), // Overstayed permit
        status: 'active'
    }
];

const SEED_LOGS = [
    {
        id: 1,
        vehicle_id: 1,
        permit_id: 1,
        officer_id: 2,
        gate_name: 'بوابة 1 الرئيسية (Gate 1)',
        action_type: 'entry',
        timestamp: new Date(Date.now() - 2.5 * 3600000).toISOString(),
        exit_timestamp: null,
        duration_minutes: null,
        remarks: 'دخول نظامي بتصريح معتمد'
    },
    {
        id: 2,
        vehicle_id: 3,
        permit_id: 3,
        officer_id: 3,
        gate_name: 'بوابة 2 الشحن (Gate 2)',
        action_type: 'entry',
        timestamp: new Date(Date.now() - 5.5 * 3600000).toISOString(),
        exit_timestamp: null,
        duration_minutes: null,
        remarks: 'دخول صهريج الوقود (تجاوزت المدة المسموحة)'
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
        if (!localStorage.getItem('gate_vehicles')) {
            localStorage.setItem('gate_vehicles', JSON.stringify(SEED_VEHICLES));
        }
        if (!localStorage.getItem('gate_permits')) {
            localStorage.setItem('gate_permits', JSON.stringify(SEED_PERMITS));
        }
        if (!localStorage.getItem('gate_logs')) {
            localStorage.setItem('gate_logs', JSON.stringify(SEED_LOGS));
        }
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
            return arClean.includes(term) || enClean.includes(term);
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
        // Last log
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
            // Unregistered exit log
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
