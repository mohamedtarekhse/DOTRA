// ============================================================
// Automated Test Suite: CEO User Management & Account Protection
// اختبار إدارة المستخدمين الحصرية للرئيس التنفيذي وحماية حساب الـ CEO من الحذف
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

global.window = {
    DB: null,
    Auth: null,
    CEO: null,
    Manager: null,
    Officer: null,
    i18n: {
        getLang: () => 'ar',
        t: (k) => k
    },
    ArabicPlate: {
        renderEgyptianPlate: () => '<div>PLATE</div>',
        normalizeSearchText: (s) => String(s || '').toLowerCase().trim(),
        normalizePlateCompact: (s) => String(s || '').toLowerCase().trim()
    },
    Icons: {
        get: () => '<i></i>'
    }
};

global.document = {
    getElementById: (id) => ({
        innerHTML: '',
        value: '',
        style: {}
    }),
    querySelector: () => null,
    body: {
        classList: { add: () => {}, remove: () => {} }
    },
    title: ''
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
eval(fs.readFileSync(path.join(__dirname, 'js/auth.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, 'js/ceo.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, 'js/manager.js'), 'utf8'));

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
    console.log("  TEST SUITE: CEO User Management & Protection         ");
    console.log("=======================================================\n");

    // --- TEST 1: CEO Dashboard Tabs ---
    console.log("1. Testing CEO Dashboard Tabs...");
    assert(window.CEO.activeTab === 'movements', "Initial CEO active tab is 'movements'");
    window.CEO.switchTab('users');
    assert(window.CEO.activeTab === 'users', "CEO tab switched to 'users'");
    window.CEO.switchTab('movements');
    assert(window.CEO.activeTab === 'movements', "CEO tab switched back to 'movements'");

    // --- TEST 2: Listing & Filtering Users ---
    console.log("\n2. Testing Users Retrieval & Querying...");
    const users = window.DB.getUsers();
    assert(Array.isArray(users) && users.length >= 3, "Database initialized with users list");
    const ceoUser = users.find(u => u.role === 'ceo');
    assert(ceoUser !== undefined, "CEO user exists in database");
    assert(ceoUser.name_ar.includes('الرئيس التنفيذي') || ceoUser.role === 'ceo', "CEO user has role 'ceo'");

    // --- TEST 3: CEO Adds New User (Manager & Officer) ---
    console.log("\n3. Testing CEO Adding Users...");
    const newOfficer = await window.DB.addUser({
        role: 'officer',
        name_ar: 'أمين الشرطة / محمود سالم',
        name_en: 'Officer Mahmoud Salem',
        badge_id: 'GT-08',
        email: 'mahmoud.salem@dotra.com',
        pin_code: '4321',
        gate_assigned: 'بوابة 2 الشحن والجمارك - دوترا',
        shift: 'night'
    });
    assert(newOfficer && newOfficer.id !== undefined, "New officer created by CEO");
    assert(newOfficer.badge_id === 'GT-08', "Officer badge ID set to GT-08");

    const newManager = await window.DB.addUser({
        role: 'manager',
        name_ar: 'م. سامح الشناوي',
        name_en: 'Eng. Sameh El-Shenawy',
        badge_id: 'MGR-02',
        email: 'sameh.mgr@dotra.com',
        password: 'password123'
    });
    assert(newManager && newManager.role === 'manager', "New manager created by CEO");

    // --- TEST 4: CEO Updates User ---
    console.log("\n4. Testing CEO Updating User...");
    const updatedOfficer = await window.DB.updateUser(newOfficer.id, {
        name_ar: 'أمين الشرطة / محمود سالم المعدل',
        shift: 'day'
    });
    assert(updatedOfficer.name_ar === 'أمين الشرطة / محمود سالم المعدل', "Officer name updated");
    assert(updatedOfficer.shift === 'day', "Officer shift updated to 'day'");

    // --- TEST 5: Deleting Non-CEO Users ---
    console.log("\n5. Testing Deleting Regular Users...");
    const afterDelete = window.DB.deleteUser(newManager.id);
    assert(afterDelete.find(u => u.id === newManager.id) === undefined, "Manager user successfully deleted");

    // --- TEST 6: Strict CEO Account Deletion Protection ---
    console.log("\n6. Testing CRITICAL CEO Account Deletion Protection...");
    let ceoDeletionBlocked = false;
    try {
        window.DB.deleteUser(ceoUser.id);
    } catch (err) {
        ceoDeletionBlocked = true;
    }
    assert(ceoDeletionBlocked === true, "deleteUser threw security exception when attempting to delete CEO account");

    let ceoOfficerDeletionBlocked = false;
    try {
        window.DB.deleteOfficer(ceoUser.id);
    } catch (err) {
        ceoOfficerDeletionBlocked = true;
    }
    assert(ceoOfficerDeletionBlocked === true, "deleteOfficer also blocked when targeting CEO account");

    // Verify CEO account is still intact in storage
    const reloadedUsers = window.DB.getUsers();
    const verifiedCeo = reloadedUsers.find(u => u.id === ceoUser.id);
    assert(verifiedCeo !== undefined, "CEO account safely preserved in storage");

    // --- TEST 7: Manager Settings Verification (No User Management) ---
    console.log("\n7. Testing Manager Settings Modal Exclusivity...");
    assert(typeof window.Manager.openSettingsModal === 'function', "Manager settings modal exists");
    // Verify Manager settings modal does not render officers user management tab
    const mockContainer = { innerHTML: '' };
    global.document.getElementById = (id) => (id === 'modal-container' ? mockContainer : { value: '' });
    window.Manager.openSettingsModal('general');
    assert(!mockContainer.innerHTML.includes("openSettingsModal('officers')"), "Officers tab button excluded from Manager settings");

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
