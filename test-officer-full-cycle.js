/**
 * Comprehensive Automated Test Suite for Officer Webpage & Full Application Lifecycle
 * اختبار شامل ومتكامل لكافة وظائف وميزات شاشة حارس البوابة وتكامل دورة العمل الكاملة
 */

import assert from 'node:assert';
import fs from 'node:fs';

console.log("=================================================");
console.log("🛡️ STARTING OFFICER TERMINAL & FULL CYCLE TESTS");
console.log("=================================================\n");

// 1. Setup DOM & Window Environment
global.localStorage = {
    store: {},
    getItem(k) { return this.store[k] || null; },
    setItem(k, v) { this.store[k] = String(v); },
    removeItem(k) { delete this.store[k]; },
    clear() { this.store = {}; }
};

global.sessionStorage = {
    store: {},
    getItem(k) { return this.store[k] || null; },
    setItem(k, v) { this.store[k] = String(v); },
    removeItem(k) { delete this.store[k]; },
    clear() { this.store = {}; }
};

global.domStore = {};
global.document = {
    documentElement: { lang: 'ar', dir: 'rtl' },
    body: { innerHTML: '', appendChild: () => {} },
    getElementById(id) {
        if (!global.domStore[id]) {
            global.domStore[id] = {
                id,
                innerHTML: '',
                value: '',
                classList: {
                    _classes: new Set(),
                    add(c) { this._classes.add(c); },
                    remove(c) { this._classes.delete(c); },
                    contains(c) { return this._classes.has(c); },
                    toggle(c) { if (this._classes.has(c)) this._classes.delete(c); else this._classes.add(c); }
                },
                appendChild() {},
                remove() {},
                scrollIntoView() {},
                focus() {},
                querySelector() { return { id: 'qr-reader' }; }
            };
        }
        if (id === 'officer-recent-activity-list' && (!global.domStore['main-content'] || !global.domStore['main-content'].innerHTML.includes('officer-recent-activity-list'))) {
            return null;
        }
        return global.domStore[id];
    },
    createElement: (tag) => ({
        tag,
        classList: { add() {}, remove() {} },
        style: {},
        remove() {},
        appendChild() {},
        parentElement: { remove() {} }
    }),
    addEventListener: () => {}
};

global.window = {
    localStorage: global.localStorage,
    sessionStorage: global.sessionStorage,
    location: { reload: () => {} },
    document: global.document
};

global.fetch = async (url) => ({ ok: true, json: async () => ({}) });

// Load modules in order
eval(fs.readFileSync('js/icons.js', 'utf8'));
eval(fs.readFileSync('js/i18n.js', 'utf8'));
eval(fs.readFileSync('js/arabic-plate.js', 'utf8'));
eval(fs.readFileSync('js/db.js', 'utf8'));
eval(fs.readFileSync('js/auth.js', 'utf8'));
eval(fs.readFileSync('js/officer.js', 'utf8'));
eval(fs.readFileSync('js/manager.js', 'utf8'));
eval(fs.readFileSync('js/push.js', 'utf8'));
eval(fs.readFileSync('js/app.js', 'utf8'));

const workerModule = await import('./_worker.js');
const worker = workerModule.default;
const mockNeonEnv = {
    DATABASE_URL: 'postgresql://neondb_owner:npg_6wMLOJZr1jKG@ep-hidden-voice-b10afhgj-pooler.c-5.eu-central-1.aws.neon.tech/neondb?sslmode=require',
    VAPID_PUBLIC_KEY: 'BKwgzVplNP0DtEzEBV2MnQTtWIGLO8Cr7jdyAENM-b4zo2jodoLDY4d78M5LExz8UBYZU4DJKRcdTrSLGiAAsZ4'
};

let passedCount = 0;
let totalCount = 0;

function runTest(description, fn) {
    totalCount++;
    try {
        fn();
        console.log(`  ✅ PASS: ${description}`);
        passedCount++;
    } catch (err) {
        console.error(`  ❌ FAIL: ${description} -> ${err.message}`);
    }
}

async function runAsyncTest(description, fn) {
    totalCount++;
    try {
        await fn();
        console.log(`  ✅ PASS: ${description}`);
        passedCount++;
    } catch (err) {
        console.error(`  ❌ FAIL: ${description} -> ${err.message}`);
    }
}

// Reset Database for Clean Full Cycle Testing
window.DB.initStorage();

// Set Manager Password Hash for '12345678'
const mgrUser = window.DB.getUsers().find(u => u.role === 'manager');
if (mgrUser) {
    mgrUser.password_hash = await window.Auth.createPasswordHash('12345678');
    const allUsers = window.DB.getUsers();
    const idx = allUsers.findIndex(u => u.id === mgrUser.id);
    if (idx !== -1) allUsers[idx] = mgrUser;
    localStorage.setItem('gate_users', JSON.stringify(allUsers));
}

// ============================================================
// SECTION 1: Officer Terminal Initialization & Stationing
// ============================================================
console.log("[1] Officer Terminal Initialization & Stationing:");

runTest("OfficerController instance is globally initialized as window.Officer", () => {
    assert(typeof window.Officer !== 'undefined', 'window.Officer exists');
    assert(typeof window.Officer.renderTerminal === 'function', 'renderTerminal is defined');
});

await runAsyncTest("Officer Login Authentication with Badge and PIN", async () => {
    const authResult = await window.Auth.loginOfficer('GT-01', '1234');
    assert(authResult.success === true, 'Officer GT-01 logged in successfully');
    const currentUser = window.Auth.getCurrentUser();
    assert(currentUser && currentUser.role === 'officer', 'Current user is officer');
    assert.equal(currentUser.badge_id, 'GT-01');
});

runTest("Officer Stationing & Gate Switching updates officer gate assignment", () => {
    const user = window.Auth.getCurrentUser();
    window.Officer.handleSwitchGate('بوابة 2 شحن وتفريغ');
    assert.equal(user.gate_assigned, 'بوابة 2 شحن وتفريغ', 'Officer assigned to Gate 2');
    const dbUsers = window.DB.getUsers();
    const updatedUser = dbUsers.find(u => u.id === user.id);
    assert.equal(updatedUser.gate_assigned, 'بوابة 2 شحن وتفريغ');
});

runTest("Officer Terminal renders header, search input, keypad toggle, and scanner buttons", () => {
    window.Officer.renderTerminal();
    const container = document.getElementById('main-content');
    assert(container.innerHTML.includes('officer-plate-input'), 'Contains plate search input');
    assert(container.innerHTML.includes('scan-qr-btn'), 'Contains QR scanner button');
    assert(container.innerHTML.includes('officer-camera-file'), 'Contains photo snapshot input');
    assert(container.innerHTML.includes('officer-recent-activity-list'), 'Contains live activity stream');
});

// ============================================================
// SECTION 2: Search Engine & Plate Verification Mechanisms
// ============================================================
console.log("\n[2] Search Engine & Verification Mechanisms:");

let testVehicle = null;
let testPermit = null;

runTest("Searching by 5-Digit PIN retrieves corresponding vehicle and permit", () => {
    // Setup test vehicle and permit
    testVehicle = window.DB.addVehicle({
        plate_ar: 'ق هـ د ٥ ٤ ٣ ٢',
        plate_en: 'QHD 5432',
        vehicle_type: 'truckHeavy',
        driver_name_ar: 'سالم النجار',
        driver_phone: '01055551234',
        company_ar: 'الرواد للمقاولات',
        status: 'visitor'
    });

    testPermit = window.DB.addPermit({
        vehicle_id: testVehicle.id,
        pin_code: '48291',
        destination_ar: 'المستودع الرئيسي',
        purpose_ar: 'توريد مواد خام',
        valid_from: new Date().toISOString(),
        valid_until: new Date(Date.now() + 8*3600000).toISOString()
    });

    window.Officer.handlePlateSearch('48291');
    assert(window.Officer.selectedVehicle !== null, 'Selected vehicle set by PIN');
    assert.equal(window.Officer.selectedVehicle.id, testVehicle.id);
    assert.equal(window.Officer.selectedPermit.pin_code, '48291');

    const resultBox = document.getElementById('vehicle-verification-result');
    assert(resultBox.innerHTML.includes('48291'), 'Result card displays PIN');
    assert(resultBox.innerHTML.includes('ق هـ د ٥ ٤ ٣ ٢'), 'Result card displays Arabic plate');
    assert(resultBox.innerHTML.includes('سالم النجار'), 'Result card displays driver name');
});

runTest("Searching by Egyptian Arabic Plate with spaces or numbers", () => {
    window.Officer.handlePlateSearch('ق هـ د ٥ ٤ ٣ ٢');
    assert(window.Officer.selectedVehicle !== null, 'Selected vehicle found by Arabic plate');
    assert.equal(window.Officer.selectedVehicle.plate_ar, 'ق هـ د ٥ ٤ ٣ ٢');
});

runTest("Searching by English Plate transliteration", () => {
    window.Officer.handlePlateSearch('QHD 5432');
    assert(window.Officer.selectedVehicle !== null, 'Selected vehicle found by English plate');
});

runTest("Searching for unregistered plate prompts Walk-in registration option", () => {
    window.Officer.handlePlateSearch('ن و ر ٩ ٩ ٩ ٩');
    assert.equal(window.Officer.selectedVehicle, null);
    const resultBox = document.getElementById('vehicle-verification-result');
    assert(resultBox.innerHTML.includes('تسجيل دخول فوري'), 'Shows walk-in entry button');
});

runTest("Arabic Keypad Toggle and Clear Search", () => {
    window.Officer.toggleKeypad();
    const keypad = document.getElementById('officer-arabic-keypad');
    assert(keypad !== null);
    
    window.Officer.clearSearch();
    assert.equal(window.Officer.activeSearchQuery, '');
    assert.equal(window.Officer.selectedVehicle, null);
    assert.equal(window.Officer.selectedPermit, null);
});

runTest("Multi-Format QR Payload Handler (Raw PIN, JSON Plate, Permit Object)", () => {
    // 1. Raw PIN string
    window.Officer.handleScannedCode('48291');
    assert(window.Officer.selectedPermit !== null, 'PIN resolved');
    assert.equal(window.Officer.selectedPermit.pin_code, '48291');

    // 2. JSON Payload with pin
    window.Officer.handleScannedCode(JSON.stringify({ pin: '48291', plate: 'ق هـ د ٥ ٤ ٣ ٢' }));
    assert(window.Officer.selectedVehicle !== null, 'JSON plate resolved');
    assert.equal(window.Officer.selectedVehicle.plate_ar, 'ق هـ د ٥ ٤ ٣ ٢');

    // 3. JSON Payload with permit code
    const permit = window.Officer.selectedPermit;
    window.Officer.handleScannedCode(JSON.stringify({ permit: permit.permit_code }));
    assert(window.Officer.selectedPermit !== null, 'Permit code resolved');
});

// ============================================================
// SECTION 3: Decision Cards, Access Actions & Denial Rules
// ============================================================
console.log("\n[3] Decision Cards, Access Actions & Security Rules:");

runTest("Authorized Vehicle Entry action records log and updates vehicle status", () => {
    window.Officer.handlePlateSearch('48291');
    assert(window.Officer.selectedVehicle !== null);
    window.Officer.recordAction('entry');

    const logs = window.DB.getLogs();
    const latestLog = logs[logs.length - 1];
    assert.equal(latestLog.action_type, 'entry', 'Log action_type is entry');
    assert.equal(latestLog.vehicle_id, testVehicle.id);
    assert(window.DB.isVehicleInside(testVehicle.id) !== null, 'Vehicle is marked inside facility');
});

runTest("Auto-Exit Detection: When vehicle is inside, terminal automatically proposes Exit", () => {
    // Search the vehicle that just entered
    window.Officer.handlePlateSearch('ق هـ د ٥ ٤ ٣ ٢');
    const resultBox = document.getElementById('vehicle-verification-result');
    assert(resultBox.innerHTML.includes('المركبة داخل المنشأة حالياً'), 'Detects vehicle is inside');
    assert(resultBox.innerHTML.includes('تأكيد تسجيل الخروج'), 'Provides direct Record Exit button');
});

runTest("Vehicle Exit action records exit timestamp and calculates duration", () => {
    window.Officer.handlePlateSearch('ق هـ د ٥ ٤ ٣ ٢');
    const vehicleId = window.Officer.selectedVehicle.id;
    window.Officer.recordAction('exit');

    assert.equal(window.DB.isVehicleInside(vehicleId), null, 'Vehicle is no longer inside');
    const logs = window.DB.getLogs();
    const exitLog = logs.find(l => l.vehicle_id === vehicleId && l.exit_timestamp !== null);
    assert(exitLog !== undefined, 'Exit timestamp recorded');
    assert(typeof exitLog.duration_minutes === 'number', 'Duration calculated');
});

runTest("Security Blacklist Enforcement: Blacklisted vehicle triggers denial badge", () => {
    const bannedVehicle = window.DB.addVehicle({
        plate_ar: 'م ح ظ ٩ ٩ ٩ ٩',
        plate_en: 'MHZ 9999',
        driver_name_ar: 'سائق مخالف',
        status: 'blacklist',
        blacklist_reason: 'محاولة تهريب بدون تصريح'
    });

    window.Officer.handlePlateSearch('م ح ظ ٩ ٩ ٩ ٩');
    assert.equal(window.Officer.selectedVehicle.status, 'blacklist');
    
    const resultBox = document.getElementById('vehicle-verification-result');
    assert(resultBox.innerHTML.includes('محاولة تهريب بدون تصريح'), 'Shows blacklist reason');

    // Record Denial
    window.Officer.recordAction('denied', 'مركبة محظورة أمنياً');
    const logs = window.DB.getLogs();
    const denialLog = logs[logs.length - 1];
    assert.equal(denialLog.action_type, 'denied');
    assert(denialLog.remarks.includes('مركبة محظورة أمنياً'));
});

// ============================================================
// SECTION 4: Instant Walk-in Pass Modal Workflow
// ============================================================
console.log("\n[4] Instant Walk-in Pass Modal Workflow:");

runTest("Officer can open Walk-in modal and create instant entry pass", () => {
    window.Officer.openWalkinWithPlate('س ر ع ١ ١ ١ ١');
    const modalContainer = document.getElementById('modal-container');
    assert(modalContainer.innerHTML.includes('walkin-plate'), 'Modal renders plate input');
    assert(modalContainer.innerHTML.includes('walkin-phone'), 'Modal renders phone input');
    assert(modalContainer.innerHTML.includes('walkin-dest'), 'Modal renders destination select');

    // Simulate Form Submission
    document.getElementById('walkin-plate').value = 'س ر ع ١ ١ ١ ١';
    document.getElementById('walkin-phone').value = '01011112222';
    document.getElementById('walkin-dest').value = 'المستودع الرئيسي';
    document.getElementById('walkin-driver').value = 'سائق فوري';
    document.getElementById('walkin-company').value = 'شركة السرعة للتوريدات';

    window.Officer.submitWalkin({ preventDefault: () => {} });

    // Verify Vehicle, Permit and Entry Log were created in 1 atomic step
    const newVehicle = window.DB.findVehicleByPlate('س ر ع ١ ١ ١ ١');
    assert(newVehicle !== null, 'Walk-in vehicle created');
    assert.equal(newVehicle.driver_phone, '01011112222');

    const newPermit = window.DB.findPermitByCodeOrVehicle(null, newVehicle.id);
    assert(newPermit !== null, 'Walk-in permit created');
    assert.equal(newPermit.pin_code.length, 5, '5-digit PIN generated');

    const insideLog = window.DB.isVehicleInside(newVehicle.id);
    assert(insideLog !== null, 'Vehicle immediately logged as inside facility');
    assert.equal(insideLog.permit_id, newPermit.id);
});

// ============================================================
// SECTION 5: WhatsApp Sharing & Quick Activity Inspect
// ============================================================
console.log("\n[5] WhatsApp Dispatch & Quick Activity Stream:");

runTest("WhatsApp status link generation formats valid international URI", () => {
    let openedUrl = '';
    window.open = (url) => { openedUrl = url; };
    
    window.Officer.shareWhatsAppStatus('س ر ع ١ ١ ١ ١', '01011112222', 'PER-2026-001', '55443');
    assert(openedUrl.includes('https://wa.me/201011112222'), 'Formats Egypt country code');
    assert(openedUrl.includes('PER-2026-001'), 'Includes permit code');
    assert(openedUrl.includes('55443'), 'Includes PIN code');
});

runTest("Recent Gate Activity list renders correctly with duration and quick inspection", () => {
    const logs = window.DB.getLogs().slice().reverse().slice(0, 5);
    const html = window.Officer.renderRecentLogs(logs, 'ar');
    assert(html.includes('س ر ع ١ ١ ١ ١'), 'Contains recently entered walk-in plate');
    assert(html.includes('دخول'), 'Contains entry action badge');

    // Quick inspect on click
    window.Officer.quickInspect('س ر ع ١ ١ ١ ١');
    assert.equal(window.Officer.selectedVehicle.plate_ar, 'س ر ع ١ ١ ١ ١');
});

// ============================================================
// SECTION 6: Full Application Lifecycle Integration (Officer <-> Manager <-> Cloud)
// ============================================================
console.log("\n[6] Full Cycle Integration (Manager Issue ➡️ Officer Scan ➡️ Entry ➡️ Cloud ➡️ Exit):");

let vipVehicle = null;
let vipPermit = null;

await runAsyncTest("Full Cycle Step 1: Manager creates pre-authorized Permit with PIN", async () => {
    // 1. Manager logs in
    const mgrLogin = await window.Auth.loginManager('manager@dotra.com', '12345678');
    assert(mgrLogin.success === true, 'Manager logged in');
    assert.equal(window.Auth.getCurrentUser().role, 'manager');

    // 2. Manager adds vehicle & permit
    vipVehicle = window.DB.addVehicle({
        plate_ar: 'د و ت ٧ ٧ ٧ ٧',
        plate_en: 'DOT 7777',
        driver_name_ar: 'محمود كمال',
        driver_phone: '01077778888',
        company_ar: 'دوترا الكيماويات',
        status: 'visitor'
    });

    vipPermit = window.DB.addPermit({
        vehicle_id: vipVehicle.id,
        pin_code: '77889',
        destination_ar: 'المستودع الرئيسي',
        purpose_ar: 'فحص شحنة كيماويات',
        cargo_details: 'براميل مواد خام 20 طن',
        invoice_no: 'INV-DOTRA-900',
        valid_from: new Date().toISOString(),
        valid_until: new Date(Date.now() + 12*3600000).toISOString()
    });

    assert.equal(vipPermit.pin_code, '77889');

    // 3. Sync to Cloud
    const reqSync = new Request('https://dotra.pages.dev/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            vehicles: [vipVehicle],
            permits: [vipPermit],
            logs: []
        })
    });
    const resSync = await worker.fetch(reqSync, mockNeonEnv);
    assert.equal(resSync.status, 200, 'Synced manager permit to Neon backend');
});

await runAsyncTest("Full Cycle Step 2: Officer at Gate verifies PIN, checks cargo, and records Entry", async () => {
    // 1. Officer logs in on mobile
    await window.Auth.loginOfficer('GT-01', '1234');
    
    // 2. Officer types Driver's 5-digit PIN
    window.Officer.handlePlateSearch('77889');
    assert(window.Officer.selectedVehicle !== null, 'Found vehicle by PIN');
    assert.equal(window.Officer.selectedVehicle.plate_ar, 'د و ت ٧ ٧ ٧ ٧');
    assert.equal(window.Officer.selectedPermit.destination_ar, 'المستودع الرئيسي');

    // 3. Officer authorizes Entry
    window.Officer.recordAction('entry');
    const insideVehicle = window.DB.isVehicleInside(vipVehicle.id);
    assert(insideVehicle !== null, 'Vehicle inside plant');

    // 4. Send entry notification to Cloud / Managers
    const reqEntry = new Request('https://dotra.pages.dev/api/push/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: 'entry',
            vehicle_id: vipVehicle.id,
            vehicle_plate: 'د و ت ٧ ٧ ٧ ٧',
            gate_name: 'بوابة 1 الرئيسية - دوترا'
        })
    });
    const resEntry = await worker.fetch(reqEntry, mockNeonEnv);
    assert.equal(resEntry.status, 200, 'Entry event notified to cloud');
});

await runAsyncTest("Full Cycle Step 3: Manager Dashboard reflects Live Inside Vehicle & Metrics", async () => {
    // Manager logs in to inspect dashboard
    await window.Auth.loginManager('manager@dotra.com', '12345678');
    const logs = window.DB.getLogs();
    const insideEntries = logs.filter(l => l.action_type === 'entry' && !l.exit_timestamp);
    const found = insideEntries.find(l => {
        const v = window.DB.getVehicles().find(veh => veh.id === l.vehicle_id);
        return v && v.plate_ar === 'د و ت ٧ ٧ ٧ ٧';
    });
    assert(found !== undefined, 'Manager dashboard shows vehicle inside facility in real-time');

    const totalInsideCount = insideEntries.length;
    assert(totalInsideCount >= 1, 'Currently inside metric is positive');
});

await runAsyncTest("Full Cycle Step 4: Officer logs Exit, completes log lifecycle, and archives record", async () => {
    // Officer terminal handles exit
    await window.Auth.loginOfficer('GT-01', '1234');
    window.Officer.handlePlateSearch('د و ت ٧ ٧ ٧ ٧');
    window.Officer.recordAction('exit');

    assert.equal(window.DB.isVehicleInside(vipVehicle.id), null, 'Vehicle exited');

    const logs = window.DB.getLogs();
    const completedLog = logs.find(l => l.vehicle_id === vipVehicle.id && l.exit_timestamp !== null);
    assert(completedLog !== undefined, 'Log lifecycle complete with entry and exit timestamps');

    // Sync final state to Cloud
    const reqFinalSync = new Request('https://dotra.pages.dev/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            vehicles: window.DB.getVehicles(),
            permits: window.DB.getPermits(),
            logs: window.DB.getLogs()
        })
    });
    const resFinalSync = await worker.fetch(reqFinalSync, mockNeonEnv);
    assert.equal(resFinalSync.status, 200, 'Final cycle synced to Neon Postgres');
});

// ============================================================
// SECTION 7: Pre-Arrival CSV Manifest Ingestion & Officer Instant Admission
// ============================================================
console.log("\n[7] Pre-Arrival CSV Manifest & Expected Arrivals Workflow:");

runTest("Manager generates and downloads valid CSV Manifest Template", () => {
    const template = window.DB.getCsvTemplate();
    assert(template.includes('رقم اللوحة'), 'Contains Arabic plate header');
    assert(template.includes('اسم السائق'), 'Contains driver name header');
    assert(template.includes('تفاصيل الحمولة'), 'Contains cargo details header');
});

runTest("Manager imports Pre-Arrival CSV Manifest creating batch vehicles and permits", () => {
    const sampleCsv = `رقم اللوحة,اسم السائق,رقم الهاتف,الشركة,الوجهة داخل المصنع,تفاصيل الحمولة,رقم إذن الصرف أو الفاتورة
م ن ف ٨ ٨ ٩ ٩,حمدي الزيات,01099887766,شركة الدلتا للأسمدة,مصنع المبيدات والكيماويات,شحنة كبريت زراعي 15 طن,INV-DELTA-889
ص ر و ٤ ٤ ٢ ٢,عصام الشافعي,01233445566,الأهرام للكيماويات,المستودع الرئيسي,خامات تغليف وعبوات,INV-AHRAM-442`;

    const result = window.DB.importPreArrivalsFromCSV(sampleCsv);
    assert.equal(result.success, true, 'CSV import succeeded');
    assert.equal(result.count, 2, 'Imported 2 expected vehicles');

    const expected = window.DB.getExpectedArrivals();
    const truck1 = expected.find(e => e.plate_ar === 'م ن ف ٨ ٨ ٩ ٩');
    assert(truck1 !== undefined, 'Truck 1 is in expected arrivals list');
    assert.equal(truck1.driver_name_ar, 'حمدي الزيات');
    assert.equal(truck1.pin_code.length, 5, 'Auto-generated 5-digit PIN');
});

runTest("Officer opens Expected Arrivals Manifest modal and one-click admits pre-approved truck", () => {
    window.Auth.loginOfficer('GT-01', '1234');
    window.Officer.openExpectedArrivalsModal();
    const modal = document.getElementById('modal-container');
    assert(modal.innerHTML.includes('م ن ف ٨ ٨ ٩ ٩'), 'Modal renders expected truck plate');
    assert(modal.innerHTML.includes('حمدي الزيات'), 'Modal renders driver name');

    // Officer one-click admits truck
    const expected = window.DB.getExpectedArrivals();
    const truck1 = expected.find(e => e.plate_ar === 'م ن ف ٨ ٨ ٩ ٩');
    window.Officer.quickAdmitExpectedVehicle(truck1.pin_code);
    assert.equal(window.Officer.selectedVehicle.plate_ar, 'م ن ف ٨ ٨ ٩ ٩');

    // Authorize entry
    const truckId = window.Officer.selectedVehicle.id;
    window.Officer.recordAction('entry');
    assert(window.DB.isVehicleInside(truckId) !== null, 'Truck entered plant');

    // Truck is removed from expected arrivals
    const remainingExpected = window.DB.getExpectedArrivals();
    assert(remainingExpected.find(e => e.plate_ar === 'م ن ف ٨ ٨ ٩ ٩') === undefined, 'Admitted truck removed from expected manifest');
});

// ============================================================
// SECTION 8: Manager Permit Hold / Suspend Authority vs Gate Enforcement
// ============================================================
console.log("\n[8] Manager Permit Hold / Suspend Authority & Gatekeeper Enforcement:");

let holdVehicle = null;
let holdPermit = null;

runTest("Manager creates an active permit for truck", () => {
    holdVehicle = window.DB.addVehicle({
        plate_ar: 'س ر ج ٩ ٩ ١ ١',
        plate_en: 'SRJ 9911',
        vehicle_type: 'truckHeavy',
        driver_name_ar: 'خالد مصطفى',
        driver_phone: '01055554444',
        company_ar: 'المنصورة للكيماويات',
        status: 'visitor'
    });
    holdPermit = window.DB.addPermit({
        vehicle_id: holdVehicle.id,
        permit_type: 'entry',
        destination_ar: 'المستودع المركزي',
        status: 'active'
    });
    assert.equal(holdPermit.status, 'active');
});

await runAsyncTest("Manager successfully places permit on HOLD (تعليق الصلاحية)", async () => {
    // Logged in as Manager
    const mgr = window.DB.getUsers().find(u => u.role === 'manager');
    const authRes = await window.Auth.loginManager(mgr.email, '12345678');
    assert.equal(authRes.success, true, 'Manager authenticated');
    const updatedPermit = window.DB.setPermitStatus(holdPermit.id, 'hold', 'مراجعة الفواتير من الإدارة المالية');
    assert.equal(updatedPermit.status, 'hold');
    assert.equal(updatedPermit.hold_reason, 'مراجعة الفواتير من الإدارة المالية');
});

await runAsyncTest("Non-manager (Officer) is BLOCKED from modifying permit authorization status", async () => {
    await window.Auth.loginOfficer('GT-01', '1234');
    let threw = false;
    try {
        window.DB.setPermitStatus(holdPermit.id, 'active');
    } catch (e) {
        threw = true;
        assert(e.message.includes('Unauthorized'), 'Threw unauthorized error for officer');
    }
    assert.equal(threw, true, 'Officer modification attempt was blocked');
});

await runAsyncTest("Officer scanning plate with HOLD permit is strictly PREVENTED from authorizing entry", async () => {
    await window.Auth.loginOfficer('GT-01', '1234');
    window.Officer.handlePlateSearch('س ر ج ٩ ٩ ١ ١');
    const resultBox = document.getElementById('vehicle-verification-result');
    assert(resultBox.innerHTML.includes('تصريح معلق'), 'Displays ON HOLD warning badge');
    assert(resultBox.innerHTML.includes('مراجعة الفواتير'), 'Displays manager hold reason');
    assert(!resultBox.innerHTML.includes('authorizeEntryBtn') && !resultBox.innerHTML.includes('تسجيل دخول'), 'Entry authorization button is completely hidden');
});

await runAsyncTest("Manager re-activates permit and Officer is now permitted to authorize entry", async () => {
    // 1. Manager re-activates
    const mgr = window.DB.getUsers().find(u => u.role === 'manager');
    await window.Auth.loginManager(mgr.email, '12345678');
    const reactivatedPermit = window.DB.setPermitStatus(holdPermit.id, 'active');
    assert.equal(reactivatedPermit.status, 'active');

    // 2. Officer checks and admits
    await window.Auth.loginOfficer('GT-01', '1234');
    window.Officer.handlePlateSearch('س ر ج ٩ ٩ ١ ١');
    const resultBox = document.getElementById('vehicle-verification-result');
    assert(resultBox.innerHTML.includes(window.i18n.t('statusAuthorized')) || resultBox.innerHTML.includes('مصرح بالدخول'), 'Shows Authorized badge');
    
    // Officer authorizes entry
    window.Officer.recordAction('entry');
    assert(window.DB.isVehicleInside(holdVehicle.id) !== null, 'Vehicle successfully admitted after reactivation');
});

console.log(`🏁 FULL OFFICER & FULL CYCLE TEST RESULTS:`);
console.log(`   Passed: ${passedCount}`);
console.log(`   Failed: ${totalCount - passedCount}`);
console.log(`   Total:  ${totalCount}`);
console.log("=================================================");

if (passedCount === totalCount) {
    console.log("🎉 ALL OFFICER FEATURES & FULL APPLICATION CYCLE PASSED (100%)!\n");
} else {
    console.error("❌ Some tests failed.\n");
    process.exit(1);
}
