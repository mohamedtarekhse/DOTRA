// Automated Test Verification Suite for Vehicle Gate Access System
// اختبار شامل لكافة وظائف النظام والمحرك العربي وقاعدة البيانات

import fs from 'fs';
import path from 'path';

console.log("=================================================");
console.log("🛡️ STARTING AUTOMATED TEST VERIFICATION SUITE");
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

// 1. Verify HTML and File Existence
console.log("\n[1] Verifying Core Files Existence:");
const requiredFiles = [
    'index.html',
    'css/styles.css',
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
    'README.md'
];

requiredFiles.forEach(file => {
    const exists = fs.existsSync(path.join('.', file));
    assert(exists, `File exists: ${file}`);
});

// 2. Mock Browser Environment for JS Unit Tests
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

// 3. Test i18n Translations
console.log("\n[2] Testing i18n & Translation Completeness:");
const i18nCode = fs.readFileSync('js/i18n.js', 'utf8');
eval(i18nCode); // loads window.i18n

assert(window.i18n.t('appName') === 'نظام تصاريح بوابات المركبات', 'Arabic appName translation');
assert(window.i18n.t('allowEntry') === '✅ السماح بالدخول (تسجيل دخول)', 'Arabic allowEntry translation');

window.i18n.setLanguage('en');
assert(window.i18n.t('appName') === 'Vehicle Gate Access System', 'English appName translation');
assert(window.i18n.t('allowEntry') === '✅ Authorize Entry (Check-In)', 'English allowEntry translation');
window.i18n.setLanguage('ar');

// 4. Test Arabic Plate Engine & Letter Mapping
console.log("\n[3] Testing Arabic License Plate Engine:");
const arabicPlateCode = fs.readFileSync('js/arabic-plate.js', 'utf8');
eval(arabicPlateCode); // loads window.ArabicPlate

assert(window.ArabicPlate.toEasternArabicDigits('1234') === '١٢٣٤', 'Digit conversion 1234 -> ١٢٣٤');
assert(window.ArabicPlate.toEasternArabicDigits('9821') === '٩٨٢١', 'Digit conversion 9821 -> ٩٨٢١');

assert(window.ArabicPlate.getEnglishLetter('أ') === 'A', 'Arabic letter mapping أ -> A');
assert(window.ArabicPlate.getEnglishLetter('ب') === 'B', 'Arabic letter mapping ب -> B');
assert(window.ArabicPlate.getEnglishLetter('ح') === 'J', 'Arabic letter mapping ح -> J');
assert(window.ArabicPlate.getArabicLetter('S') === 'س', 'English letter mapping S -> س');

const renderedPlateHtml = window.ArabicPlate.renderArabicPlate('أ ب ج 9 8 2 1', 'ABJ 9821', 'normal', 'truckHeavy');
assert(renderedPlateHtml.includes('license-plate-arabic'), 'Rendered plate contains CSS class');
assert(renderedPlateHtml.includes('أ ب ج'), 'Rendered plate contains Arabic letters');
assert(renderedPlateHtml.includes('ABJ'), 'Rendered plate contains Latin letters');
assert(renderedPlateHtml.includes('plate-truck'), 'Rendered plate contains truck style class');

// 5. Test Database & Storage
console.log("\n[4] Testing Database Layer (DB operations):");
const dbCode = fs.readFileSync('js/db.js', 'utf8');
eval(dbCode); // loads window.DB

const users = window.DB.getUsers();
assert(users.length === 3, `Users seeded properly (count = ${users.length})`);
assert(users.find(u => u.role === 'manager').email === 'manager@factory.com', 'Manager account exists in DB');
assert(users.find(u => u.badge_id === 'GT-01').pin_code === '1234', 'Officer 1 account exists with PIN');

const vehicles = window.DB.getVehicles();
assert(vehicles.length >= 4, `Vehicles seeded properly (count = ${vehicles.length})`);

// Plate Search
const foundVehicle = window.DB.findVehicleByPlate('أ ب ج 9 8 2 1');
assert(foundVehicle && foundVehicle.id === 1, 'Plate search by Arabic letters ("أ ب ج 9 8 2 1")');

const foundVehicleEn = window.DB.findVehicleByPlate('DRS 4520');
assert(foundVehicleEn && foundVehicleEn.id === 2, 'Plate search by English ("DRS 4520")');

// Add Vehicle & Permit
const newVeh = window.DB.addVehicle({
    plate_ar: 'ع م ر 5 5 1 1',
    plate_en: 'EMR 5511',
    vehicle_type: 'van',
    driver_name_ar: 'عمر السعيد',
    driver_name_en: 'Omar Al-Saeed',
    company_ar: 'شركة النقل الحديث',
    company_en: 'Modern Transport',
    status: 'visitor'
});
assert(newVeh && newVeh.id, `New vehicle added with ID: ${newVeh.id}`);

const newPermit = window.DB.addPermit({
    vehicle_id: newVeh.id,
    destination_ar: 'المستودع الرئيسي',
    destination_en: 'Main Warehouse',
    purpose_ar: 'شحن بضائع',
    purpose_en: 'Cargo pickup',
    valid_from: new Date().toISOString(),
    valid_until: new Date(Date.now() + 3600000).toISOString()
});
assert(newPermit && newPermit.permit_code.startsWith('PER-'), `New permit generated code: ${newPermit.permit_code}`);

// Check Entry & Exit recording
const entryLog = window.DB.recordEntry(newVeh.id, newPermit.id, 2, 'Gate 1', 'Test entry');
assert(entryLog && entryLog.action_type === 'entry', 'Vehicle entry successfully recorded');
assert(window.DB.isVehicleInside(newVeh.id) !== null, 'isVehicleInside correctly returns active log');

const exitLog = window.DB.recordExit(newVeh.id, 2, 'Gate 1', 'Test exit');
assert(exitLog && exitLog.exit_timestamp !== null, 'Vehicle exit recorded and timestamp stamped');
assert(window.DB.isVehicleInside(newVeh.id) === null, 'isVehicleInside correctly returns null after exit');

// 6. Test Authentication Service
console.log("\n[5] Testing Authentication Layer:");
const authCode = fs.readFileSync('js/auth.js', 'utf8');
eval(authCode); // loads window.Auth

const mgrLoginFail = window.Auth.loginManager('manager@factory.com', 'WrongPass');
assert(!mgrLoginFail.success, 'Manager login fails with wrong password');

const mgrLoginSuccess = window.Auth.loginManager('manager@factory.com', 'Manager@2026');
assert(mgrLoginSuccess.success && mgrLoginSuccess.user.role === 'manager', 'Manager login succeeds with correct credentials');

const offLoginFail = window.Auth.loginOfficer('GT-01', '0000');
assert(!offLoginFail.success, 'Gate Officer login fails with wrong PIN');

const offLoginSuccess = window.Auth.loginOfficer('GT-01', '1234');
assert(offLoginSuccess.success && offLoginSuccess.user.badge_id === 'GT-01', 'Gate Officer login succeeds with correct PIN (1234)');

// Summary
console.log("\n=================================================");
console.log(`🏁 TEST VERIFICATION RESULTS:`);
console.log(`   Passed: ${testsPassed}`);
console.log(`   Failed: ${testsFailed}`);
console.log("=================================================");

if (testsFailed === 0) {
    console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! APPLICATION IS FULLY FUNCTIONAL.");
    process.exit(0);
} else {
    console.error("❌ Some tests failed.");
    process.exit(1);
}
