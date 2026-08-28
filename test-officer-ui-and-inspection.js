// ============================================================
// Automated Test Suite: Officer Web Page SAP Theme & Inspection Modal
// اختبار الواجهة الموحدة لضابط البوابة وفتح نافذة طلب الاستئذان بدون أخطاء
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock Browser Environment
const localStorageData = {};
global.localStorage = {
    getItem: (k) => localStorageData[k] || null,
    setItem: (k, v) => { localStorageData[k] = String(v); },
    removeItem: (k) => { delete localStorageData[k]; },
    clear: () => { Object.keys(localStorageData).forEach(k => delete localStorageData[k]); }
};

global.sessionStorage = {
    getItem: (k) => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {}
};

const mockElements = {};
global.document = {
    getElementById: (id) => mockElements[id] || null,
    querySelector: () => null,
    body: {
        classList: { add: () => {}, remove: () => {} }
    },
    addEventListener: () => {},
    title: ''
};

global.window = {
    DB: null,
    Auth: {
        getCurrentUser: () => ({ id: 2, name_ar: 'أمين الشرطة طارق', name_en: 'Duty Officer Tariq', gate_assigned: 'بوابة 1 الرئيسية - دوترا', badge_id: 'GT-01', role: 'officer' })
    },
    Officer: null,
    App: {
        showToast: () => {}
    },
    i18n: {
        getLang: () => 'ar',
        setLanguage: () => {},
        t: (k) => k
    },
    ArabicPlate: {
        renderEgyptianPlate: () => '<div>PLATE</div>',
        renderArabicKeypad: () => '<div>KEYPAD</div>',
        normalizeSearchText: (s) => String(s || '').toLowerCase().trim(),
        normalizePlateCompact: (s) => String(s || '').toLowerCase().trim()
    },
    Icons: {
        get: () => '<i></i>'
    }
};

global.location = { origin: 'http://localhost' };
global.fetch = async () => ({ ok: true, json: async () => ({ success: true }) });
global.BroadcastChannel = class {
    constructor(name) { this.name = name; }
    postMessage(data) {}
    close() {}
};

// Load Modules
eval(fs.readFileSync(path.join(__dirname, 'js/db.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, 'js/officer.js'), 'utf8'));

let totalTests = 0;
let passedTests = 0;

function assert(condition, testName) {
    totalTests++;
    if (condition) {
        console.log(`  ✅ PASS: ${testName}`);
        passedTests++;
    } else {
        console.error(`  ❌ FAIL: ${testName}`);
    }
}

async function runTests() {
    console.log("\n=======================================================");
    console.log("  TEST SUITE: Officer Web Page & Inspection Modal      ");
    console.log("=======================================================\n");

    const officer = window.Officer;

    // --- TEST 1: escHtml existence and sanitization ---
    console.log("1. Testing escHtml Sanitization & Methods...");
    assert(typeof officer.constructor.escHtml === 'function', "OfficerController.escHtml is a function");
    assert(typeof officer.escHtml === 'function', "officer.escHtml (instance method) is a function");
    const sanitized = officer.constructor.escHtml('<script>alert("xss")</script>&\'');
    assert(sanitized === '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;&amp;&#39;', "escHtml sanitizes all dangerous HTML characters correctly");

    // --- TEST 2: Open Inspection Request Modal without errors ---
    console.log("\n2. Testing openInspectionRequestModal()...");
    mockElements['modal-container'] = { innerHTML: '' };
    let openModalError = null;
    try {
        officer.openInspectionRequestModal();
    } catch (err) {
        openModalError = err;
    }
    assert(openModalError === null, "openInspectionRequestModal() executed without throwing any TypeError");
    const modalHtml = mockElements['modal-container'].innerHTML;
    assert(modalHtml.includes('req-plate-input'), "Modal contains plate number input element");
    assert(modalHtml.includes('req-driver-phone'), "Modal contains driver phone input element");
    assert(modalHtml.includes('handleInspectionPhoto(event, \'plate\')'), "Modal contains photo upload for plate");
    assert(modalHtml.includes('handleInspectionPhoto(event, \'carriage\')'), "Modal contains photo upload for carriage / cargo");
    assert(modalHtml.includes('sap-btn-primary'), "Modal uses SAP Fiori Primary button theme");

    // --- TEST 3: Officer Terminal Rendering & SAP Theme Palette ---
    console.log("\n3. Testing Officer Terminal Rendering & Theme Palette...");
    mockElements['main-content'] = { innerHTML: '' };
    officer.renderTerminal();
    const terminalHtml = mockElements['main-content'].innerHTML;
    assert(terminalHtml.includes('sap-card') || terminalHtml.includes('sap-panel'), "Terminal uses SAP card and panel tokens");
    assert(terminalHtml.includes('officer-plate-input'), "Terminal contains vehicle search input");
    assert(terminalHtml.includes('openInspectionRequestModal'), "Terminal contains pass request button");
    assert(terminalHtml.includes('openExpectedArrivalsModal'), "Terminal contains expected arrivals manifest button");
    assert(!terminalHtml.includes('openQuickWalkinModal'), "Terminal successfully removed quick walk-in button (Strict Security Protocol)");

    // --- TEST 4: Open Expected Arrivals Modal ---
    console.log("\n4. Testing openExpectedArrivalsModal()...");
    mockElements['modal-container'] = { innerHTML: '' };
    officer.openExpectedArrivalsModal();
    const arrivalsHtml = mockElements['modal-container'].innerHTML;
    assert(arrivalsHtml.includes('كشف الشاحنات المتوقع وصولها') || arrivalsHtml.includes('Expected Arrivals'), "Expected arrivals modal rendered properly");

    // --- TEST 5: Open Walk-in Modal ---
    console.log("\n5. Testing openQuickWalkinModal()...");
    mockElements['modal-container'] = { innerHTML: '' };
    officer.openQuickWalkinModal();
    const walkinHtml = mockElements['modal-container'].innerHTML;
    assert(walkinHtml.includes('walkin-plate') && walkinHtml.includes('walkin-phone'), "Walk-in modal rendered properly with form fields");

    // Final Summary
    console.log("\n=======================================================");
    console.log(`  TEST RESULTS: ${passedTests}/${totalTests} TESTS PASSED (${Math.round(passedTests/totalTests*100)}%)`);
    console.log("=======================================================\n");

    if (passedTests === totalTests) {
        process.exit(0);
    } else {
        process.exit(1);
    }
}

runTests();
