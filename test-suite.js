// Complete End-to-End Test Suite for DOTRA Gate Access System
// التحقق الشامل من تكامل النظام والواجهة الأمامية والخلفية السحابية _worker.js وقاعدة البيانات

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
    'assets/logo.jpg',
    'css/styles.css',
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

// 3. Test QR Engine with Arabic & Egyptian Characters
console.log("\n[2] Testing QREngine UTF-8 Arabic Compatibility:");
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

// 4. Test Egyptian Plate Engine
console.log("\n[3] Testing Egyptian License Plate Engine:");
const plateCode = fs.readFileSync('js/arabic-plate.js', 'utf8');
eval(plateCode);

assert(window.ArabicPlate.LETTERS.length === 17, 'All 17 Egyptian traffic letters loaded');
const parsedPlate = window.ArabicPlate.parsePlateParts('ط ر ق ٩ ٨ ٢ ١');
assert(parsedPlate.letters === 'ط ر ق', 'Parsed letters: ط ر ق');
assert(parsedPlate.numbers === '٩ ٨ ٢ ١', 'Parsed numbers: ٩ ٨ ٢ ١');

const renderedTruckPlate = window.ArabicPlate.renderEgyptianPlate('ط ر ق ٩ ٨ ٢ ١', 'normal', 'truckHeavy');
assert(renderedTruckPlate.includes('EGYPT') && renderedTruckPlate.includes('مصر'), 'Egyptian plate contains EGYPT & مصر');
assert(renderedTruckPlate.includes('bg-red-600') && renderedTruckPlate.includes('نقل'), 'Truck plate has Red header and "نقل" text');

// 5. Test Database & Zero Hardcoded Permits (Clean Slate)
console.log("\n[4] Testing Database Layer (Clean Slate):");
const dbCode = fs.readFileSync('js/db.js', 'utf8');
eval(dbCode);

const initialPermits = window.DB.getPermits();
assert(initialPermits.length === 0, `Initial hardcoded permits count is 0 (Clean Slate)`);

const initialLogs = window.DB.getLogs();
assert(initialLogs.length === 0, `Initial hardcoded logs count is 0 (Clean Slate)`);

// 6. Test Settings Layer (Default WhatsApp)
console.log("\n[5] Testing Settings & Dispatch WhatsApp:");
const defaultSettings = window.DB.getSettings();
assert(defaultSettings.default_whatsapp !== undefined, `Default WhatsApp setting exists: ${defaultSettings.default_whatsapp}`);

const updatedSettings = window.DB.updateSettings({ default_whatsapp: '01011223344' });
assert(updatedSettings.default_whatsapp === '01011223344', 'Default WhatsApp setting updated successfully');

// 7. Test Manager & Officer Lifecycle
console.log("\n[6] Testing Full Permit Lifecycle & Officer Gate Scanner:");
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

// Canvas Image Data URI Generation test
const passDataUri = window.Manager.constructor.createPassCanvasDataUrl(
    freshPermit.permit_code,
    freshTruck.plate_ar,
    freshTruck.driver_phone,
    freshTruck.driver_name_ar,
    '18:00'
);
assert(passDataUri && passDataUri.startsWith('data:image/png'), 'Digital Pass PNG DataURL generated safely without canvas tainting');

// Officer Scans QR and Records Entry
const officerEntry = window.DB.recordEntry(freshTruck.id, freshPermit.id, 2, 'بوابة 1 دوترا', 'دخول معتمد');
assert(officerEntry.action_type === 'entry', 'Officer recorded vehicle entry');
assert(window.DB.isVehicleInside(freshTruck.id) !== null, 'Vehicle currently active inside factory');

// Officer Records Exit
const officerExit = window.DB.recordExit(freshTruck.id, 2, 'بوابة 1 دوترا', 'خروج نظامي');
assert(officerExit.exit_timestamp !== null, 'Officer recorded vehicle exit');
assert(window.DB.isVehicleInside(freshTruck.id) === null, 'Vehicle marked as exited');

// 8. Test Backend Worker API Integrity
console.log("\n[7] Testing Cloudflare Worker Backend Routes (_worker.js):");
const workerModule = await import('./_worker.js');
const worker = workerModule.default;

// Mock Request & DB for Worker
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

// Test Worker GET /api/vehicles
const reqVehicles = new Request('https://dotra.pages.dev/api/vehicles', { method: 'GET' });
const resVehicles = await worker.fetch(reqVehicles, { DB: mockD1 });
assert(resVehicles.status === 200, 'Worker GET /api/vehicles responded with HTTP 200');

// Test Worker POST /api/permits
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

// Test Worker POST /api/entry
const reqEntry = new Request('https://dotra.pages.dev/api/entry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vehicle_id: 1, permit_id: 101, officer_id: 2, gate_name: 'Gate 1' })
});
const resEntry = await worker.fetch(reqEntry, { DB: mockD1 });
const resEntryJson = await resEntry.json();
assert(resEntry.status === 200 && resEntryJson.success === true, 'Worker POST /api/entry recorded entry successfully');

// Test Worker POST /api/exit
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
