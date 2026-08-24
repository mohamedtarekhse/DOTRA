// Automated Test Verification Suite for Vehicle Gate Access System (Egyptian Traffic Edition)
// اختبار شامل لكافة وظائف النظام ومحرك اللوحات المصرية وقاعدة البيانات

import fs from 'fs';
import path from 'path';

console.log("=================================================");
console.log("🇪🇬 STARTING EGYPTIAN PLATE SYSTEM VERIFICATION");
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

// 1. Mock Browser Environment for JS Unit Tests
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
    getElementById: (id) => ({
        innerHTML: '',
        classList: { add: () => {}, remove: () => {}, toggle: () => {} },
        focus: () => {},
        dispatchEvent: () => {}
    })
};

// 2. Test Egyptian Plate Engine
console.log("\n[1] Testing Egyptian License Plate Engine:");
const arabicPlateCode = fs.readFileSync('js/arabic-plate.js', 'utf8');
eval(arabicPlateCode); // loads window.ArabicPlate

assert(window.ArabicPlate.LETTERS.length === 17, 'Official 17 Egyptian traffic letters loaded');
assert(window.ArabicPlate.LETTERS.find(l => l.ar === 'ف') !== undefined, 'Letter ف exists in Egyptian set');
assert(window.ArabicPlate.LETTERS.find(l => l.ar === 'ي') !== undefined, 'Letter ي exists in Egyptian set');

const parsed = window.ArabicPlate.parsePlateParts('س ف ر ٤ ٥ ٢ ٠');
assert(parsed.letters === 'س ف ر', 'Parsed Egyptian letters "س ف ر"');
assert(parsed.numbers === '٤ ٥ ٢ ٠', 'Parsed Egyptian digits "٤ ٥ ٢ ٠"');

const renderedPlate = window.ArabicPlate.renderEgyptianPlate('ط ر ق ٩ ٨ ٢ ١', 'normal', 'truckHeavy');
assert(renderedPlate.includes('EGYPT'), 'Egyptian plate contains "EGYPT" banner');
assert(renderedPlate.includes('مصر'), 'Egyptian plate contains "مصر" banner');
assert(renderedPlate.includes('bg-red-600'), 'Egyptian truck plate has Red header');
assert(renderedPlate.includes('نقل'), 'Egyptian truck plate labeled "نقل"');

const renderedCarPlate = window.ArabicPlate.renderEgyptianPlate('م ص ر ٣ ٣ ٠ ٤', 'normal', 'car');
assert(renderedCarPlate.includes('bg-sky-500'), 'Egyptian private car plate has Light Blue header');
assert(renderedCarPlate.includes('ملاكي'), 'Egyptian car plate labeled "ملاكي"');

// 3. Test Database Layer with Egyptian Data
console.log("\n[2] Testing Database Layer with Egyptian Vehicles:");
const dbCode = fs.readFileSync('js/db.js', 'utf8');
eval(dbCode); // loads window.DB

const vehicles = window.DB.getVehicles();
assert(vehicles.length >= 4, `Vehicles loaded (${vehicles.length})`);

const foundTruck = window.DB.findVehicleByPlate('ط ر ق ٩ ٨ ٢ ١');
assert(foundTruck && foundTruck.company_ar.includes('حديد عز'), 'Found Egyptian truck plate "ط ر ق ٩ ٨ ٢ ١"');

const foundVan = window.DB.findVehicleByPlate('س ف ر ٤ ٥ ٢ ٠');
assert(foundVan && foundVan.driver_name_ar.includes('كريم'), 'Found Egyptian van plate "س ف ر ٤ ٥ ٢ ٠"');

console.log("\n=================================================");
console.log(`🏁 TEST VERIFICATION RESULTS:`);
console.log(`   Passed: ${testsPassed}`);
console.log(`   Failed: ${testsFailed}`);
console.log("=================================================");

if (testsFailed === 0) {
    console.log("🎉 ALL EGYPTIAN PLATE TESTS PASSED SUCCESSFULLY!");
    process.exit(0);
} else {
    process.exit(1);
}
