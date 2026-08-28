// =========================================================================
// Automated Test Suite: Permit Hold, Revoke & Gate Request System
// اختبار تعليق وإلغاء التصاريح من المدير وطلب التعليق من البوابات
// =========================================================================

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
    getElementById: (id) => mockElements[id] || { innerHTML: '', value: '', classList: { add: () => {}, remove: () => {}, toggle: () => {} } },
    createElement: (tag) => ({
        innerHTML: '', value: '', className: '', style: {},
        setAttribute: () => {}, getAttribute: () => null,
        appendChild: () => {}, removeChild: () => {}, click: () => {}
    }),
    querySelector: () => null,
    querySelectorAll: () => [],
    body: {
        classList: { add: () => {}, remove: () => {} },
        appendChild: () => {},
        removeChild: () => {}
    },
    addEventListener: () => {},
    title: ''
};

global.window = {
    DB: null,
    Auth: null,
    Officer: null,
    Manager: null,
    CEO: null,
    App: null,
    i18n: null,
    ArabicPlate: null,
    Icons: null,
    PushService: {
        sendCustomNotification: async () => true
    }
};

global.alert = (msg) => {};
global.confirm = () => true;
global.prompt = (msg, def) => def || '';
global.location = { origin: 'http://localhost', href: '' };
global.fetch = async () => ({ ok: true, json: async () => ({ success: true, notifications: [] }) });
global.BroadcastChannel = class {
    constructor(name) { this.name = name; }
    postMessage(data) {}
    close() {}
};

// Load Core Files
eval(fs.readFileSync(path.join(__dirname, 'js/icons.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, 'js/i18n.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, 'js/arabic-plate.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, 'js/db.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, 'js/auth.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, 'js/manager.js'), 'utf8'));
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
    console.log("  TEST SUITE: Permit Hold, Revoke & Gate Request Flow  ");
    console.log("=======================================================\n");

    const db = window.DB;
    const manager = window.Manager;
    const officer = window.Officer;

    // Setup Mock Vehicle and Permit
    const vehicle = db.addVehicle({
        plate_ar: 'ط ر ق ٩ ٨ ٢ ١',
        plate_en: 'TRQ 9821',
        vehicle_type: 'truckHeavy',
        driver_name_ar: 'محمود السيد',
        driver_phone: '01012345678',
        company_ar: 'شركة السويس للأسمنت'
    });

    const permit = db.addPermit({
        vehicle_id: vehicle.id,
        destination_ar: 'المستودع الرئيسي',
        permit_type: 'entry',
        cargo_details: 'مواد خام',
        created_by: 1
    });

    assert(permit && permit.status === 'active', "1. New permit created with active status");

    // --- TEST 1: Manager Holds Permit Directly ---
    console.log("\n1. Testing Manager Putting Permit on Hold (Suspend)...");
    const heldPermit = db.setPermitStatus(permit.id, 'hold', 'فحص أمني إضافي للحمولة');
    assert(heldPermit.status === 'hold', "Permit status updated to 'hold'");
    assert(heldPermit.hold_reason === 'فحص أمني إضافي للحمولة', "Permit records hold reason");

    // Verify lookup by plate and pin recognizes hold
    const permitByPlate = db.findActivePermitByPlate('ط ر ق ٩ ٨ ٢ ١');
    assert(permitByPlate && permitByPlate.status === 'hold', "findActivePermitByPlate finds held permit");

    // --- TEST 2: Manager Reactivates Permit ---
    console.log("\n2. Testing Manager Reactivating Permit...");
    const activePermit = db.setPermitStatus(permit.id, 'active');
    assert(activePermit.status === 'active', "Permit status restored to 'active'");
    assert(activePermit.hold_reason === '', "Hold reason cleared on activation");

    // --- TEST 3: Manager Revokes / Cancels Permit Directly ---
    console.log("\n3. Testing Manager Revoking Permit...");
    const revokedPermit = db.setPermitStatus(permit.id, 'revoked', 'إلغاء أمر التوريد');
    assert(revokedPermit.status === 'revoked', "Permit status updated to 'revoked'");
    assert(revokedPermit.hold_reason === 'إلغاء أمر التوريد', "Revoke reason recorded");

    // Reactivate for gate request tests
    db.setPermitStatus(permit.id, 'active');

    // --- TEST 4: Gate Officer Requests Permit Hold ---
    console.log("\n4. Testing Gate Officer Sending Permit Hold Request...");
    const holdReq = db.createPermitHoldRequest({
        permit_id: permit.id,
        vehicle_id: vehicle.id,
        plate_ar: vehicle.plate_ar,
        driver_name: vehicle.driver_name_ar,
        officer_id: 2,
        gate_name: 'بوابة 1 الرئيسية - دوترا',
        request_type: 'hold',
        reason: 'تلف أو تسريب بالحمولة',
        notes: 'البراميل بها تسريب واضح عند البوابة'
    });

    assert(holdReq && holdReq.status === 'pending', "Hold request created with status 'pending'");
    assert(holdReq.request_type === 'hold', "Request type is 'hold'");

    const pendingRequests = db.getPendingPermitHoldRequests();
    assert(pendingRequests.length === 1, "Pending hold requests count is 1");
    assert(pendingRequests[0].id === holdReq.id, "Correct pending request retrieved");

    // --- TEST 5: Manager Approves Gate Hold Request ---
    console.log("\n5. Testing Manager Approving Gate Hold Request...");
    const decideRes = db.decidePermitHoldRequest(holdReq.id, 'approve_hold', 'معتمد للتعليق');
    assert(decideRes.success === true, "Decide request succeeded");
    assert(decideRes.request.status === 'approved', "Request marked approved");

    const checkedPermit = db.getPermits().find(p => p.id === permit.id);
    assert(checkedPermit.status === 'hold', "Target permit status set to 'hold' automatically");
    assert(checkedPermit.hold_reason.includes('تلف أو تسريب بالحمولة'), "Permit records reason from request");

    // --- TEST 6: Gate Officer Requests Permit Revocation ---
    console.log("\n6. Testing Gate Officer Sending Revoke Request...");
    const revokeReq = db.createPermitHoldRequest({
        permit_id: permit.id,
        vehicle_id: vehicle.id,
        plate_ar: vehicle.plate_ar,
        driver_name: vehicle.driver_name_ar,
        officer_id: 2,
        gate_name: 'بوابة 1 الرئيسية - دوترا',
        request_type: 'revoke',
        reason: 'اشتباه أمني أو سلوك غير لائق',
        notes: 'محاولة تزوير مستندات'
    });

    assert(revokeReq.request_type === 'revoke', "Revocation request created");

    // --- TEST 7: Manager Approves Revocation Request ---
    console.log("\n7. Testing Manager Approving Revocation Request...");
    const decideRevokeRes = db.decidePermitHoldRequest(revokeReq.id, 'approve_revoke', 'سحب فوري للتصريح');
    assert(decideRevokeRes.success === true, "Revocation approval succeeded");
    const revokedChecked = db.getPermits().find(p => p.id === permit.id);
    assert(revokedChecked.status === 'revoked', "Target permit is now 'revoked'");

    // --- TEST 8: Manager Controller UI & Modal Methods ---
    console.log("\n8. Testing Manager Modals and Controllers...");
    assert(typeof manager.openHoldPermitModal === 'function', "Manager.openHoldPermitModal exists");
    assert(typeof manager.openRevokePermitModal === 'function', "Manager.openRevokePermitModal exists");
    assert(typeof manager.handleActivatePermit === 'function', "Manager.handleActivatePermit exists");
    assert(typeof manager.handleDecideHoldRequest === 'function', "Manager.handleDecideHoldRequest exists");

    mockElements['modal-container'] = { innerHTML: '' };
    manager.openHoldPermitModal(permit.id);
    assert(mockElements['modal-container'].innerHTML.includes('تعليق وتجميد التصريح مؤقتاً'), "Hold permit modal rendered");

    mockElements['modal-container'] = { innerHTML: '' };
    manager.openRevokePermitModal(permit.id);
    assert(mockElements['modal-container'].innerHTML.includes('سحب وإلغاء التصريح نهائياً'), "Revoke permit modal rendered");

    mockElements['modal-container'] = { innerHTML: '' };
    manager.openPendingRequestsModal('hold');
    assert(mockElements['modal-container'].innerHTML.includes('طلبات تعليق وسحب التصاريح'), "Hold requests tab rendered in Hub");

    // --- TEST 9: Officer Controller UI & Modals ---
    console.log("\n9. Testing Officer Controller Modals...");
    assert(typeof officer.openRequestHoldModal === 'function', "Officer.openRequestHoldModal exists");
    assert(typeof officer.submitRequestHold === 'function', "Officer.submitRequestHold exists");

    mockElements['modal-container'] = { innerHTML: '' };
    officer.openRequestHoldModal(permit.id);
    assert(mockElements['modal-container'].innerHTML.includes('طلب تعليق أو سحب تصريح للمدير'), "Officer request hold modal rendered");

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
