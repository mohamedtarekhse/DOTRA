// ============================================================
// Automated Test Suite: Two-Category Login Screen Verification
// اختبار شاشة تسجيل الدخول بتصنيفين فقط (الإدارة والعمليات vs بوابات المصنع)
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
    getElementById: (id) => {
        if (!mockElements[id]) {
            mockElements[id] = { innerHTML: '', value: '', className: '', style: {} };
        }
        return mockElements[id];
    },
    querySelector: () => null,
    body: {
        classList: { add: () => {}, remove: () => {} }
    },
    addEventListener: () => {},
    title: ''
};

global.window = {
    DB: null,
    Auth: null,
    CEO: { renderDashboard: () => {} },
    Manager: { renderDashboard: () => {} },
    Officer: { renderTerminal: () => {} },
    PushService: { startPolling: () => {} },
    i18n: {
        getLang: () => 'ar',
        setLanguage: () => {},
        t: (k) => k
    },
    ArabicPlate: {
        renderEgyptianPlate: () => '<div>PLATE</div>',
        normalizeSearchText: (s) => String(s || '').toLowerCase().trim(),
        normalizePlateCompact: (s) => String(s || '').toLowerCase().trim()
    },
    Icons: {
        get: () => '<i></i>'
    },
    addEventListener: () => {}
};

global.alert = (msg) => console.log('ALERT:', msg);
global.confirm = () => true;

global.location = { origin: 'http://localhost' };
global.fetch = async () => ({ ok: true, json: async () => ({ success: true }) });
global.BroadcastChannel = class {
    constructor(name) { this.name = name; }
    postMessage(data) {}
    close() {}
};

// Load Modules
eval(fs.readFileSync(path.join(__dirname, 'js/db.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, 'js/auth.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, 'js/app.js'), 'utf8'));

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
    console.log("  TEST SUITE: 2-Category Login Screen Verification     ");
    console.log("=======================================================\n");

    const app = window.App;

    // Ensure seed passwords are ready for test
    const hash = await window.Auth.createPasswordHash('password123');
    const users = window.DB.getUsers();
    users.forEach(u => {
        if (!u.password_hash) u.password_hash = hash;
    });
    localStorage.setItem('gate_users', JSON.stringify(users));

    // --- TEST 1: Default State ---
    console.log("1. Testing Default Login State...");
    assert(app.loginRoleTab === 'management', "Default login role tab is 'management'");

    // --- TEST 2: Tab Switching ---
    console.log("\n2. Testing Tab Switching (Management vs. Gates)...");
    app.switchLoginTab('gates');
    assert(app.loginRoleTab === 'gates', "Switched to 'gates' tab");
    
    app.renderLoginScreen();
    const mainContent = mockElements['main-content'].innerHTML;
    assert(mainContent.includes("فتح محطة أمن البوابة") || mainContent.includes("login-badge"), "Gates tab renders officer badge/PIN form");

    app.switchLoginTab('management');
    assert(app.loginRoleTab === 'management', "Switched back to 'management' tab");
    
    app.renderLoginScreen();
    const mgmtContent = mockElements['main-content'].innerHTML;
    assert(mgmtContent.includes("login-email") && mgmtContent.includes("login-password"), "Management tab renders email/password form");
    assert(!mgmtContent.includes("switchLoginTab('ceo')"), "Obsolete individual CEO tab removed");

    // --- TEST 3: Management Login Seamless Redirection ---
    console.log("\n3. Testing Unified Management Login Routing...");
    // 3.1 CEO login via Management Form
    document.getElementById('login-email').value = 'ceo@dotra.com';
    document.getElementById('login-password').value = 'password123';
    await app.handleManagerLogin({ preventDefault: () => {} });
    assert(app.currentView === 'ceo', "Management login routed CEO credentials directly to CEO Dashboard view");

    // 3.2 Manager login via Management Form
    document.getElementById('login-email').value = 'manager@dotra.com';
    document.getElementById('login-password').value = 'password123';
    await app.handleManagerLogin({ preventDefault: () => {} });
    assert(app.currentView === 'manager', "Management login routed Manager credentials directly to Manager Dashboard view");

    // --- TEST 4: Gates Login Routing ---
    console.log("\n4. Testing Gates Officer Station Login Routing...");
    document.getElementById('login-badge').value = 'GT-01';
    document.getElementById('login-pin').value = '1234';
    await app.handleOfficerLogin({ preventDefault: () => {} });
    assert(app.currentView === 'officer', "Gates login routed Officer badge/PIN directly to Officer Terminal view");

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
