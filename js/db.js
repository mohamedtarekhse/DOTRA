// Database Layer - Egyptian Standard Vehicles & Cloudflare D1 Sync
// طبقة إدارة البيانات - قاعدة بيانات كلاود فلير D1 مع دعم لوحات المرور المصرية

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
        gate_assigned: 'بوابة 1 الرئيسية (Gate 1 Main)'
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
        gate_assigned: 'بوابة 2 الشحن والجمارك (Gate 2 Cargo)'
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
        driver_phone: '+201012345678',
        company_ar: 'شركة حديد عز للصناعات المعدنية',
        company_en: 'Ezz Steel Industry',
        status: 'whitelist'
    },
    {
        id: 2,
        plate_ar: 'س ف ر ٤ ٥ ٢ ٠',
        plate_en: 'SFR 4520',
        vehicle_type: 'van',
        driver_name_ar: 'كريم السيد الباز',
        driver_name_en: 'Karim El-Sayed El-Baz',
        driver_phone: '+201123456789',
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
        driver_phone: '+201234567890',
        company_ar: 'شركة مصر للبترول',
        company_en: 'Misr Petroleum Co.',
        status: 'visitor'
    },
    {
        id: 4,
        plate_ar: 'م ص ر ٣ ٣ ٠ ٤',
        plate_en: 'MSR 3304',
        vehicle_type: 'car',
        driver_name_ar: 'طارق صلاح النجار',
        driver_name_en: 'Tariq El-Naggar',
        driver_phone: '+201567890123',
        company_ar: 'مجموعة السويدي إلكتريك',
        company_en: 'Elsewedy Electric',
        status: 'blacklist',
        blacklist_reason: 'تجاوز السرعة المقررة بموقع المصنع ومخالفة لوائح الأمان الصناعي'
    },
    {
        id: 5,
        plate_ar: 'ب س م ٧ ٧ ٨ ٩',
        plate_en: 'BSM 7789',
        vehicle_type: 'truckMedium',
        driver_name_ar: 'عصام فتحي الديب',
        driver_name_en: 'Essam El-Deeb',
        driver_phone: '+201099887766',
        company_ar: 'شركة أسمنت السويس',
        company_en: 'Suez Cement Group',
        status: 'visitor'
    }
];

const SEED_PERMITS = [
    {
        id: 1,
        permit_code: 'PER-2026-8801',
        vehicle_id: 1,
        destination_ar: 'مجمع الأفران ومستودع رصيف 3',
        destination_en: 'Furnace Complex & Bay 3',
        purpose_ar: 'تفريغ خام بليت وحديد تسليح',
        purpose_en: 'Unload raw iron billets',
        cargo_details: '40 طن بليت صلب',
        valid_from: new Date(Date.now() - 2 * 3600000).toISOString(),
        valid_until: new Date(Date.now() + 6 * 3600000).toISOString(),
        status: 'active'
    },
    {
        id: 2,
        permit_code: 'PER-2026-8802',
        vehicle_id: 2,
        destination_ar: 'مبنى الشؤون الإدارية والطرود',
        destination_en: 'Admin Building & Documents',
        purpose_ar: 'تسليم شحنة قطع غيار ألمانية ومستندات',
        purpose_en: 'Deliver German spare parts & docs',
        cargo_details: '12 طرد ومستندات جمركية',
        valid_from: new Date(Date.now() - 1 * 3600000).toISOString(),
        valid_until: new Date(Date.now() + 4 * 3600000).toISOString(),
        status: 'active'
    },
    {
        id: 3,
        permit_code: 'PER-2026-8803',
        vehicle_id: 3,
        destination_ar: 'محطة الصهاريج والمحروقات المركزية',
        destination_en: 'Central Fuel Tank Storage',
        purpose_ar: 'تزويد محطة الكهرباء بالسولار الصناعي',
        purpose_en: 'Industrial diesel refill',
        cargo_details: '30,000 لتر سولار صناعي',
        valid_from: new Date(Date.now() - 5 * 3600000).toISOString(),
        valid_until: new Date(Date.now() - 1 * 3600000).toISOString(), // Overstayed
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
        timestamp: new Date(Date.now() - 1.5 * 3600000).toISOString(),
        exit_timestamp: null,
        duration_minutes: null,
        remarks: 'دخول شاحنة حديد عز بتصريح معتمد'
    },
    {
        id: 2,
        vehicle_id: 3,
        permit_id: 3,
        officer_id: 3,
        gate_name: 'بوابة 2 الشحن (Gate 2)',
        action_type: 'entry',
        timestamp: new Date(Date.now() - 4.5 * 3600000).toISOString(),
        exit_timestamp: null,
        duration_minutes: null,
        remarks: 'دخول صهريج مصر للبترول (تجاوزت المدة المسموحة)'
    }
];

class DatabaseService {
    constructor() {
        this.initStorage();
    }

    initStorage() {
        // Force refresh seed data to Egyptian standard if previously stored
        const storedVehicles = localStorage.getItem('gate_vehicles');
        if (!storedVehicles || storedVehicles.includes('أ ب ج 9 8 2 1')) {
            localStorage.setItem('gate_users', JSON.stringify(SEED_USERS));
            localStorage.setItem('gate_vehicles', JSON.stringify(SEED_VEHICLES));
            localStorage.setItem('gate_permits', JSON.stringify(SEED_PERMITS));
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
