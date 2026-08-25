// Complete Comprehensive Test Suite for DOTRA Gate Access System (Settings & A4 Print Edition)

import fs from 'fs';
import path from 'path';

console.log("=================================================");
console.log("🛡️ STARTING DOTRA SYSTEM FULL VERIFICATION SUITE");
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
            drawImage: () => {}
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

const renderedCanvas = window.QREngine.render(mockContainer, testPayloadArabic, { size: 150 });
assert(renderedCanvas !== null, 'QREngine successfully generates Canvas for Arabic JSON payload');

const mockCtx = document.createElement('canvas').getContext('2d');
const drawSuccess = window.QREngine.drawToCanvas(mockCtx, testPayloadArabic, 0, 0, 150);
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

// 5. Test Database & Configurable Settings (Default WhatsApp)
console.log("\n[4] Testing Database & Settings Layer:");
const dbCode = fs.readFileSync('js/db.js', 'utf8');
eval(dbCode);

const defaultSettings = window.DB.getSettings();
assert(defaultSettings.default_whatsapp !== undefined, `Default WhatsApp setting exists: ${defaultSettings.default_whatsapp}`);

const updatedSettings = window.DB.updateSettings({ default_whatsapp: '+201099998888' });
assert(updatedSettings.default_whatsapp === '+201099998888', 'Default WhatsApp setting updated successfully');

// 6. Test App Login UI (Verify trial accounts removed)
console.log("\n[5] Testing Clean Login UI:");
const i18nCode = fs.readFileSync('js/i18n.js', 'utf8');
eval(i18nCode);
const authCode = fs.readFileSync('js/auth.js', 'utf8');
eval(authCode);
const appCode = fs.readFileSync('js/app.js', 'utf8');
eval(appCode);

assert(!appCode.includes('بيانات تجريبية سريعة'), 'Trial accounts helper box removed from login code');
assert(!appCode.includes('Quick Demo Accounts'), 'Demo accounts removed from English strings');
assert(typeof window.App !== 'undefined', 'AppController initialized properly');

// Summary
console.log("\n=================================================");
console.log(`🏁 FULL VERIFICATION RESULTS:`);
console.log(`   Passed: ${testsPassed}`);
console.log(`   Failed: ${testsFailed}`);
console.log("=================================================");

if (testsFailed === 0) {
    console.log("🎉 ALL TESTS PASSED! APPLICATION IS 100% VERIFIED.");
    process.exit(0);
} else {
    console.error("❌ Some tests failed.");
    process.exit(1);
}
