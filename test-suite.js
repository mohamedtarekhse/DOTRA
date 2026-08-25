// Complete End-to-End Test Suite for DOTRA Gate Access System (Enterprise UI & SVG Icon Edition)
// التحقق الشامل من تكامل النظام ومكتبة الأيقونات والواجهة الأمامية والخلفية السحابية _worker.js

import fs from 'fs';
import path from 'path';

console.log("=================================================");
console.log("🛡️ FULL END-TO-END SYSTEM & INTEGRITY VERIFICATION");
console.log("=================================================");

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  ✅ PASS: ${message}`);
        testsPassed++;
    } else {
        console.error(`  ❌ FAIL: ${message}`);
        testsFailed++;
    }
}

// 1. Verify Core Files
console.log("\n[1] Verifying Core Files & Brand Assets:");
const requiredFiles = [
    'index.html',
    'manifest.json',
    'sw.js',
    'assets/logo.jpg',
    'css/styles.css',
    'js/icons.js',
    'js/qr-engine.js',
    'js/i18n.js',
    'js/arabic-plate.js',
    'js/db.js',
    'js/auth.js',
    'js/manager.js',
    'js/officer.js',
    'js/app.js',
    'schema.sql',
    '_worker.js',
    'wrangler.toml',
    'package.json',
    'README.md'
];

requiredFiles.forEach(file => {
    const exists = fs.existsSync(path.join('.', file));
    assert(exists, `File exists: ${file}`);
});

// Verify manifest.json schema
const manifestContent = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
assert(manifestContent.display === 'standalone' && manifestContent.name.includes('دوترا'), 'PWA manifest.json is valid and standalone enabled');

// 2. Mock Browser Environment
global.localStorage = {
    store: {},
    getItem(key) { return this.store[key] || null; },
    setItem(key, val) { this.store[key] = String(val); },
    removeItem(key) { delete this.store[key]; },
    clear() { this.store = {}; }
};

global.sessionStorage = {
    store: {},
    getItem(key) { return this.store[key] || null; },
    setItem(key, val) { this.store[key] = String(val); },
    removeItem(key) { delete this.store[key]; },
    clear() { this.store = {}; }
};

global.window = {
    localStorage: global.localStorage,
    sessionStorage: global.sessionStorage,
    location: { reload: () => {} }
};

global.document = {
    documentElement: { lang: 'ar', dir: 'rtl' },
    addEventListener: () => {},
    createElement: (tag) => ({
        width: 0,
        height: 0,
        style: {},
        toDataURL: () => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        getContext: () => ({
            fillStyle: '',
            strokeStyle: '',
            lineWidth: 1,
            fillRect: () => {},
            strokeRect: () => {},
            beginPath: () => {},
            roundRect: () => {},
            fill: () => {},
            stroke: () => {},
            arc: () => {},
            fillText: () => {},
            moveTo: () => {},
            lineTo: () => {},
            drawImage: () => {},
            createLinearGradient: () => ({ addColorStop: () => {} })
        })
    }),
    getElementById: (id) => ({
        innerHTML: '',
        classList: { add: () => {}, remove: () => {}, toggle: () => {} },
        focus: () => {},
        dispatchEvent: () => {}
    })
};

// 3. Test SVG Icon Library
console.log("\n[2] Testing SVG Icon Library (js/icons.js):");
const iconsCode = fs.readFileSync('js/icons.js', 'utf8');
eval(iconsCode);

assert(typeof window.Icons !== 'undefined', 'Icons library is defined');
const truckSvg = window.Icons.get('truck', 'w-5 h-5');
assert(truckSvg.includes('<svg') && truckSvg.includes('w-5 h-5'), 'Generated valid SVG for truck icon');

// 4. Test QR Engine with Arabic & Egyptian Characters
console.log("\n[3] Testing QREngine UTF-8 Arabic Compatibility:");
const qrCodeContent = fs.readFileSync('js/qr-engine.js', 'utf8');
eval(qrCodeContent);

assert(typeof window.QREngine !== 'undefined', 'QREngine is defined and available globally');

const testPayloadArabic = JSON.stringify({
    permit: "PER-2026-8801",
    plate: "ط ر ق ٩ ٨ ٢ ١",
    phone: "01012345678"
});

const mockContainer = {
    innerHTML: '',
    appendChild: (el) => { mockContainer.child = el; }
};

const renderedCanvas = window.QREngine.render(mockContainer, testPayloadArabic, { size: 160 });
assert(renderedCanvas !== null, 'QREngine successfully generates Canvas for Arabic JSON payload');

const mockCtx = document.createElement('canvas').getContext('2d');
const drawSuccess = window.QREngine.drawToCanvas(mockCtx, testPayloadArabic, 0, 0, 160);
assert(drawSuccess === true, 'QREngine.drawToCanvas renders directly to canvas context');

// 5. Test Egyptian Plate Engine
console.log("\n[4] Testing Egyptian License Plate Engine:");
const plateCode = fs.readFileSync('js/arabic-plate.js', 'utf8');
eval(plateCode);

assert(window.ArabicPlate.LETTERS.length === 17, 'All 17 Egyptian traffic letters loaded');
const parsedPlate = window.ArabicPlate.parsePlateParts('ط ر ق ٩ ٨ ٢ ١');
assert(parsedPlate.letters === 'ط ر ق', 'Parsed letters: ط ر ق');
assert(parsedPlate.numbers === '٩ ٨ ٢ ١', 'Parsed numbers: ٩ ٨ ٢ ١');

const renderedTruckPlate = window.ArabicPlate.renderEgyptianPlate('ط ر ق ٩ ٨ ٢ ١', 'normal', 'truckHeavy');
assert(renderedTruckPlate.includes('EGYPT') && renderedTruckPlate.includes('مصر'), 'Egyptian plate contains EGYPT & مصر');
assert(renderedTruckPlate.includes('bg-red-600') && renderedTruckPlate.includes('نقل'), 'Truck plate has Red header and "نقل" text');

// 6. Test Database Layer (Clean Slate)
console.log("\n[5] Testing Database Layer (Clean Slate):");
const dbCode = fs.readFileSync('js/db.js', 'utf8');
eval(dbCode);

const initialPermits = window.DB.getPermits();
assert(initialPermits.length === 0, `Initial hardcoded permits count is 0 (Clean Slate)`);

const initialLogs = window.DB.getLogs();
assert(initialLogs.length === 0, `Initial hardcoded logs count is 0 (Clean Slate)`);

// 7. Test Settings & Dispatch WhatsApp
console.log("\n[6] Testing Settings & Dispatch WhatsApp:");
const defaultSettings = window.DB.getSettings();
assert(defaultSettings.default_whatsapp !== undefined, `Default WhatsApp setting exists: ${defaultSettings.default_whatsapp}`);

const updatedSettings = window.DB.updateSettings({ default_whatsapp: '01011223344' });
assert(updatedSettings.default_whatsapp === '01011223344', 'Default WhatsApp setting updated successfully');

// 8. Test Dynamic Gates & Destinations Layer
console.log("\n[7] Testing Dynamic Gates & Destinations Layer:");
const initialGates = window.DB.getGates();
assert(initialGates.length >= 4, `Initial gates loaded: ${initialGates.length} gates`);
window.DB.addGate('بوابة 5 صوامع الحبوب');
assert(window.DB.getGates().includes('بوابة 5 صوامع الحبوب'), 'Custom gate added dynamically');

const initialDests = window.DB.getDestinations();
assert(initialDests.length >= 6, `Initial destinations loaded: ${initialDests.length} destinations`);
window.DB.addDestination('مستودع التصدير الخارجي');
assert(window.DB.getDestinations().includes('مستودع التصدير الخارجي'), 'Custom destination added dynamically');

// 9. Test Security Officers & Gate Assignment
console.log("\n[8] Testing Security Officers & Gate Assignments:");
const initialOfficers = window.DB.getOfficers();
assert(initialOfficers.length >= 2, `Officers count loaded: ${initialOfficers.length} officers`);

const newOfficer = window.DB.addOfficer({
    name_ar: 'رقيب أول / ياسر جلال',
    name_en: 'Officer Yasser Galal',
    badge_id: 'GT-09',
    pin_code: '4321',
    gate_assigned: 'بوابة 5 صوامع الحبوب'
});
assert(newOfficer.id !== undefined && newOfficer.badge_id === 'GT-09', 'New security officer added');

window.DB.assignOfficerToGate(newOfficer.id, 'بوابة 1 الرئيسية - دوترا');
const updatedOfficer = window.DB.getOfficers().find(o => o.id === newOfficer.id);
assert(updatedOfficer.gate_assigned === 'بوابة 1 الرئيسية - دوترا', 'Officer successfully reassigned to Gate 1');

// 10. Test Manager & Officer Lifecycle
console.log("\n[9] Testing Full Permit Lifecycle & Officer Gate Scanner:");
const authCode = fs.readFileSync('js/auth.js', 'utf8');
eval(authCode);
const i18nCode = fs.readFileSync('js/i18n.js', 'utf8');
eval(i18nCode);
const mgrCode = fs.readFileSync('js/manager.js', 'utf8');
eval(mgrCode);
const offCode = fs.readFileSync('js/officer.js', 'utf8');
eval(offCode);

// Manager creates permit
const freshTruck = window.DB.addVehicle({
    plate_ar: 'ط ر ق ٩ ٨ ٢ ١',
    plate_en: 'TRQ 9821',
    vehicle_type: 'truckHeavy',
    driver_name_ar: 'محمود عبدالفتاح',
    driver_phone: '01012345678',
    status: 'visitor'
});
const freshPermit = window.DB.addPermit({
    vehicle_id: freshTruck.id,
    destination_ar: 'المستودع الرئيسي',
    valid_from: new Date().toISOString(),
    valid_until: new Date(Date.now() + 8 * 3600000).toISOString()
});

assert(window.DB.getPermits().length === 1, 'Fresh permit issued');

// Duplicate Active Permit Check
const existingActive = window.DB.findActivePermitByPlate(freshTruck.plate_ar);
assert(existingActive !== null && existingActive.permit_code === freshPermit.permit_code, 'Duplicate active permit successfully detected by plate');

// Test Exit Permit (Material / Goods Release) & Expire duplicate
const exitPermitData = {
    plate: freshTruck.plate_ar,
    phone: freshTruck.driver_phone,
    permit_type: 'exit',
    destination: 'منطقة الشحن والتصدير',
    invoice_no: 'INV-2026-904',
    cargo_details: 'سماد نتروجين دوترا - 30 طن',
    driver_name: 'محمود عبدالفتاح',
    company: 'دوترا للصناعات',
    vehicle_type: 'truckHeavy'
};

// Simulate Manager.finalizeQuickPermit(exitPermitData)
window.Manager.finalizeQuickPermit(exitPermitData);
const allPermits = window.DB.getPermits();
const latestExitPermit = allPermits[allPermits.length - 1];
assert(latestExitPermit.permit_type === 'exit', 'Exit pass (تصريح خروج بضائع) created with type=exit');
assert(latestExitPermit.invoice_no === 'INV-2026-904', 'Exit pass contains invoice/dispatch note number');
const prevPermitInDb = allPermits.find(p => p.id === freshPermit.id);
assert(prevPermitInDb.status === 'superseded', 'Previous duplicate active permit marked as superseded');

assert(latestExitPermit.pin_code && latestExitPermit.pin_code.length === 5, `Permit generated with 5-digit verification PIN: ${latestExitPermit.pin_code}`);

// Search & Verify by 5-Digit PIN
const permitFoundByPin = window.DB.findPermitByPin(latestExitPermit.pin_code);
assert(permitFoundByPin !== null && permitFoundByPin.id === latestExitPermit.id, 'Permit successfully found and verified using 5-digit PIN');

// Officer searches by PIN
window.Officer.handlePlateSearch(latestExitPermit.pin_code);
assert(window.Officer.selectedPermit !== null && window.Officer.selectedPermit.pin_code === latestExitPermit.pin_code, 'Officer successfully verified car using 5-digit PIN code');

// Canvas Image Data URI Generation test for Exit Pass with PIN
const exitPassDataUri = window.Manager.createPassCanvasDataUrl(
    latestExitPermit.permit_code,
    freshTruck.plate_ar,
    freshTruck.driver_phone,
    freshTruck.driver_name_ar,
    '18:00',
    'exit',
    latestExitPermit.invoice_no,
    latestExitPermit.cargo_details,
    latestExitPermit.pin_code
);
assert(exitPassDataUri && exitPassDataUri.startsWith('data:image/png'), 'Exit Pass PNG DataURL with PIN generated safely');

// 1. Initial State: Vehicle outside -> Officer 1 at Gate 1 records Entry
assert(window.DB.isVehicleInside(freshTruck.id) === null, 'Initially vehicle is outside factory');
const samplePhoto = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBD';
const officer1Entry = window.DB.recordEntry(freshTruck.id, latestExitPermit.id, 2, 'بوابة 1 الرئيسية - دوترا', 'دخول معتمد شحنة أولى', samplePhoto);
assert(officer1Entry.action_type === 'entry' && officer1Entry.gate_name === 'بوابة 1 الرئيسية - دوترا', 'Officer 1 at Gate 1 recorded vehicle entry');

// 2. Shared Database Check: Officer 2 at Gate 4 sees vehicle is inside
const insideStateForOfficer2 = window.DB.isVehicleInside(freshTruck.id);
assert(insideStateForOfficer2 !== null && insideStateForOfficer2.gate_name === 'بوابة 1 الرئيسية - دوترا', 'Officer 2 at Gate 4 sees vehicle currently inside from Gate 1');

// 3. Second visit to any gate: Officer 2 at Gate 4 records Exit
const officer2Exit = window.DB.recordExit(freshTruck.id, 3, 'بوابة 4 خروج الإنتاج والشاحنات', 'خروج نظامي بضائع تامة');
assert(officer2Exit.exit_timestamp !== null && officer2Exit.remarks.includes('بوابة 4'), 'Officer 2 at Gate 4 recorded vehicle exit in unified database');
assert(window.DB.isVehicleInside(freshTruck.id) === null, 'Vehicle successfully marked as outside');

// 4. Third visit: Vehicle returns -> Automatically defaults back to Entry
assert(window.DB.isVehicleInside(freshTruck.id) === null, 'Third visit: Vehicle is outside, ready for next entry cycle');

// 5. Test Manager Universal Search & Location Tracking by Multi-Criteria
console.log("\n[8] Testing Manager Universal Multi-Criteria Search & Location Tracker:");
window.Manager.handleUniversalSearch('ط ر ق');
let tableHtml = window.Manager.renderTableRows('ar');
assert(tableHtml.includes('ط ر ق'), 'Universal search by License Plate letters succeeded');

window.Manager.handleUniversalSearch('بوابة 4');
tableHtml = window.Manager.renderTableRows('ar');
assert(tableHtml.includes('بوابة 4'), 'Universal search by Gate name succeeded');

window.Manager.handleUniversalSearch('خالد');
tableHtml = window.Manager.renderTableRows('ar');
assert(tableHtml.includes('خالد'), 'Universal search by Officer name succeeded');

window.Manager.clearUniversalSearch();
assert(window.Manager.searchQuery === '', 'Universal search cleared successfully');

// 6. Test Exited Filter Tab & Exit Timestamp Display
window.Manager.setFilter('exited');
const exitedRowsHtml = window.Manager.renderTableRows('ar');
assert(exitedRowsHtml.includes('خروج:') && exitedRowsHtml.includes('مدة التواجد:'), 'Exited filter successfully displayed departed vehicles with exit date, time and duration');
window.Manager.setFilter('all');

// 7. Test Mobile Responsive Cards Renderer
console.log("\n[9] Testing Mobile Responsive Card View (Manager Mobile Optimization):");
const mobileCardsHtml = window.Manager.renderMobileCards('ar');
assert(mobileCardsHtml.includes('السائق:') && mobileCardsHtml.includes('ط ر ق'), 'Mobile responsive cards generated properly for smartphone screens');
assert(typeof window.DB.syncFromCloud === 'function', 'DatabaseService.syncFromCloud is defined');

// 9. Test Backend Worker API Integrity
console.log("\n[8] Testing Cloudflare Worker Backend Routes (_worker.js):");
const workerModule = await import('./_worker.js');
const worker = workerModule.default;

const mockD1Results = [];
const mockD1 = {
    prepare: (sql) => ({
        bind: (...args) => ({
            run: async () => ({ meta: { last_row_id: 101 } }),
            all: async () => ({ results: mockD1Results })
        }),
        all: async () => ({ results: mockD1Results }),
        run: async () => ({ meta: { last_row_id: 101 } })
    })
};

const reqVehicles = new Request('https://dotra.pages.dev/api/vehicles', { method: 'GET' });
const resVehicles = await worker.fetch(reqVehicles, { DB: mockD1 });
assert(resVehicles.status === 200, 'Worker GET /api/vehicles responded with HTTP 200');

const reqNewPermit = new Request('https://dotra.pages.dev/api/permits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        vehicle_id: 1,
        destination_ar: 'المستودع الرئيسي',
        cargo_details: 'شحنة خامات'
    })
});
const resNewPermit = await worker.fetch(reqNewPermit, { DB: mockD1 });
const resNewPermitJson = await resNewPermit.json();
assert(resNewPermit.status === 200 && resNewPermitJson.success === true, 'Worker POST /api/permits created permit successfully');

const reqEntry = new Request('https://dotra.pages.dev/api/entry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vehicle_id: 1, permit_id: 101, officer_id: 2, gate_name: 'Gate 1' })
});
const resEntry = await worker.fetch(reqEntry, { DB: mockD1 });
const resEntryJson = await resEntry.json();
assert(resEntry.status === 200 && resEntryJson.success === true, 'Worker POST /api/entry recorded entry successfully');

const reqExit = new Request('https://dotra.pages.dev/api/exit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vehicle_id: 1 })
});
const resExit = await worker.fetch(reqExit, { DB: mockD1 });
const resExitJson = await resExit.json();
assert(resExit.status === 200 && resExitJson.success === true, 'Worker POST /api/exit recorded exit successfully');

// Summary
console.log("\n=================================================");
console.log(`🏁 FULL VERIFICATION RESULTS:`);
console.log(`   Passed: ${testsPassed}`);
console.log(`   Failed: ${testsFailed}`);
console.log("=================================================");

if (testsFailed === 0) {
    console.log("🎉 ALL TESTS PASSED! FULL STACK INTEGRITY VERIFIED (100%).");
    process.exit(0);
} else {
    console.error("❌ Some tests failed.");
    process.exit(1);
}
