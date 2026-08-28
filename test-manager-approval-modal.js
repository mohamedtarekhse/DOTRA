// ============================================================
// Automated Test Suite: Manager Inspection Requests Approval Modal
// اختبار شامل لنافذة مراجعة واعتماد طلبات الاستئذان لمدير العمليات
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
    querySelectorAll: () => [],
    body: {
        classList: { add: () => {}, remove: () => {} }
    },
    addEventListener: () => {},
    title: ''
};

global.window = {
    DB: null,
    Auth: {
        getCurrentUser: () => ({ id: 1, name_ar: 'م. أحمد فؤاد (مدير العمليات)', role: 'manager' })
    },
    Officer: null,
    Manager: null,
    App: {
        showToast: () => {}
    },
    i18n: {
        getLang: () => 'ar',
        setLanguage: () => {},
        t: (k) => k
    },
    ArabicPlate: {
        renderEgyptianPlate: (plate) => `<div class="plate-preview">${plate}</div>`,
        renderArabicKeypad: () => '<div>KEYPAD</div>',
        normalizeSearchText: (s) => String(s || '').toLowerCase().trim(),
        normalizePlateCompact: (s) => String(s || '').toLowerCase().trim()
    },
    Icons: {
        get: () => '<i></i>'
    }
};

global.alert = (msg) => console.log('ALERT:', msg);
global.confirm = () => true;
global.prompt = (msg, def) => def;

global.location = { origin: 'http://localhost' };
global.fetch = async () => ({ ok: true, json: async () => ({ success: true }) });
global.BroadcastChannel = class {
    constructor(name) { this.name = name; }
    postMessage(data) {}
    close() {}
};

// Load Modules
eval(fs.readFileSync(path.join(__dirname, 'js/db.js'), 'utf8'));
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
    console.log("  TEST SUITE: Manager Inspection Requests Approval Hub ");
    console.log("=======================================================\n");

    const manager = window.Manager;

    // --- Setup: Create a pending inspection request ---
    const newReq = window.DB.createInspectionRequest({
        plate_ar: 'ط ر ق ٩ ٨ ٢ ١',
        plate_en: 'TRQ 9821',
        driver_name: 'محمد عبد الرحمن',
        driver_phone: '01011223344',
        company: 'شركة النصر للأسمدة',
        destination: 'مصنع الأسمدة والمخصبات',
        cargo_details: 'شحنة مواد خام 15 طن',
        notes: 'استئذان عاجل لتسليم طلبيات الإنتاج',
        plate_photo_url: 'data:image/jpeg;base64,platePhotoBase64',
        carriage_photo_url: 'data:image/jpeg;base64,carriagePhotoBase64',
        officer_id: 2,
        gate_name: 'بوابة 1 الرئيسية - دوترا'
    });

    // --- TEST 1: Manager Dashboard Badge ---
    console.log("1. Testing Manager Dashboard Requests Counter Badge...");
    Object.keys(mockElements).forEach(k => delete mockElements[k]);
    mockElements['main-content'] = { innerHTML: '' };
    manager.renderDashboard();
    const dashHtml = mockElements['main-content'].innerHTML;
    assert(dashHtml.includes('طلبات الاستئذان') || dashHtml.includes('Requests'), "Dashboard contains Requests button");
    assert(dashHtml.includes('bg-slate-950 text-amber-300'), "Pending count badge (bg-slate-950 text-amber-300) rendered in header");
    assert(dashHtml.includes('Manager.openPendingRequestsModal()'), "Button onclick calls Manager.openPendingRequestsModal()");

    // --- TEST 2: Open Pending Requests Modal ---
    console.log("\n2. Testing openPendingRequestsModal()...");
    mockElements['modal-container'] = { innerHTML: '' };
    manager.openPendingRequestsModal();
    const modalHtml = mockElements['modal-container'].innerHTML;
    assert(modalHtml.includes('طلبات الاستئذان والفحص الواردة من ضباط البوابات'), "Requests list modal title rendered");
    assert(modalHtml.includes('ط ر ق ٩ ٨ ٢ ١'), "Pending vehicle plate listed");
    assert(modalHtml.includes('محمد عبد الرحمن'), "Driver name displayed in list");
    assert(modalHtml.includes('بانتظار القرار'), "Pending badge displayed");
    assert(modalHtml.includes(`Manager.showRequestReviewModal('${newReq.id}')`), "Action button links to review modal");

    // --- TEST 3: Open Single Request Review Modal (With Dual Photos) ---
    console.log("\n3. Testing showRequestReviewModal(requestId)...");
    mockElements['modal-container'] = { innerHTML: '' };
    manager.showRequestReviewModal(newReq.id);
    const reviewHtml = mockElements['modal-container'].innerHTML;
    assert(reviewHtml.includes('معاينة وفحص طلب استئذان المركبة'), "Review modal header rendered");
    assert(reviewHtml.includes('ط ر ق ٩ ٨ ٢ ١'), "Plate displayed in review modal");
    assert(reviewHtml.includes('01011223344'), "Driver phone displayed in review modal");
    assert(reviewHtml.includes('صورة لوحة السيارة'), "Plate photo section present");
    assert(reviewHtml.includes('صورة صندوق / حمولة الشاحنة'), "Carriage photo section present");
    assert(reviewHtml.includes('اعتماد فوري وإصدار تصريح دخول'), "Approve action button present");
    assert(reviewHtml.includes('رفض ومنع دخول الشاحنة'), "Reject action button present");

    // --- TEST 4: Direct Approval & Permit Generation Execution ---
    console.log("\n4. Testing Direct Approval Execution...");
    assert(modalHtml.includes(`Manager.handleDecideRequest('${newReq.id}', 'approve')`), "1-Click instant approve button present on request card");
    assert(modalHtml.includes(`Manager.handleDecideRequest('${newReq.id}', 'reject')`), "Reject button present on request card");
    manager.handleDecideRequest(newReq.id, 'approve');
    const updatedReq = window.DB.getInspectionRequests().find(r => r.id === newReq.id);
    assert(updatedReq.status === 'approved', "Request status updated to approved");
    assert(updatedReq.permit_id !== null, "Permit ID assigned to approved request");
    assert(typeof updatedReq.pin_code === 'string' && updatedReq.pin_code.length === 5, "5-Digit verification PIN assigned");

    // --- TEST 5: Global Bindings Check ---
    console.log("\n5. Testing Window Global Bindings...");
    assert(typeof window.openPendingRequestsModal === 'function', "window.openPendingRequestsModal is bound");
    assert(typeof window.showRequestReviewModal === 'function', "window.showRequestReviewModal is bound");
    assert(typeof window.handleDecideRequest === 'function', "window.handleDecideRequest is bound");

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
