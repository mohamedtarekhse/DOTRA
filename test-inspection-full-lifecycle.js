// ============================================================
// Automated Test Suite: Inspection Request Full End-to-End Lifecycle
// فحص شامل لدورة حياة طلب الاستئذان: إنشاء الطلب، إرفاق الصور، الاعتماد، والتحديث الحي
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
            mockElements[id] = { innerHTML: '', value: '', className: '', style: {}, focus: () => {}, classList: { add: () => {}, remove: () => {}, toggle: () => {} } };
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
    Auth: {
        getCurrentUser: () => ({ id: 2, name_ar: 'أمين الشرطة طارق', name_en: 'Duty Officer Tariq', gate_assigned: 'بوابة 1 الرئيسية - دوترا', badge_id: 'GT-01', role: 'officer' })
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
        renderEgyptianPlate: () => '<div>PLATE</div>',
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
eval(fs.readFileSync(path.join(__dirname, 'js/officer.js'), 'utf8'));
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
    console.log("  TEST SUITE: Inspection Request Full End-to-End Flow  ");
    console.log("=======================================================\n");

    const officer = window.Officer;
    const manager = window.Manager;

    // --- TEST 1: Open Modal ---
    console.log("1. Testing Officer Opening Inspection Request Modal...");
    document.getElementById('modal-container').innerHTML = '';
    document.getElementById('officer-plate-input').value = 'ق س م ٧ ٤ ١ ٠';
    
    officer.openInspectionRequestModal();
    const modalHtml = document.getElementById('modal-container').innerHTML;
    assert(modalHtml.includes('req-plate-input'), "Modal rendered with plate input");
    assert(modalHtml.includes('ق س م ٧ ٤ ١ ٠'), "Prefilled plate value preserved from officer input");
    assert(modalHtml.includes('handleInspectionPhoto'), "Multi-photo upload trigger present");

    // --- TEST 2: Submit Inspection Request ---
    console.log("\n2. Testing Officer Submitting Inspection Request...");
    document.getElementById('req-plate-input').value = 'ق س م ٧ ٤ ١ ٠';
    document.getElementById('req-driver-name').value = 'إبراهيم توفيق السيد';
    document.getElementById('req-driver-phone').value = '01299887766';
    document.getElementById('req-company').value = 'شركة الدلتا للصناعات الكيماوية';
    document.getElementById('req-destination').value = 'المستودع الرئيسي';
    document.getElementById('req-cargo').value = 'أحماض ومخصبات زراعية - 20 طن';
    document.getElementById('req-notes').value = 'شاحنة عاجلة بدون تصريح مسبق تتطلب موافقة المدير';

    // Simulate captured photo attachments
    officer._inspectionPhotos = {
        plate: 'data:image/jpeg;base64,samplePlatePhotoData',
        carriage: 'data:image/jpeg;base64,sampleCarriagePhotoData'
    };

    officer.submitInspectionRequest({ preventDefault: () => {} });

    const requests = window.DB.getInspectionRequests();
    assert(requests.length >= 1, "Inspection request successfully created in storage");
    const latestReq = requests[requests.length - 1];
    assert(latestReq.plate_ar === 'ق س م ٧ ٤ ١ ٠', "Correct plate stored");
    assert(latestReq.driver_name === 'إبراهيم توفيق السيد', "Correct driver stored");
    assert(latestReq.plate_photo_url !== null, "Plate photo stored in request");
    assert(latestReq.carriage_photo_url !== null, "Carriage photo stored in request");
    assert(latestReq.status === 'pending', "Initial status is 'pending'");

    // Check pending tracker rendered on officer screen
    const trackerHtml = document.getElementById('modal-container').innerHTML;
    assert(trackerHtml.includes('officer-inspection-tracker-card'), "Officer tracker card rendered");
    assert(trackerHtml.includes('بانتظار مراجعة وقرار مدير العمليات'), "Pending animated state displayed");

    // --- TEST 3: Manager Decision (Approval) ---
    console.log("\n3. Testing Manager Review and Approval...");
    const approvalRes = window.DB.decideInspectionRequest(latestReq.id, 'approve', 'معتمد فورياً بعد فحص الصور', 1);
    assert(approvalRes.success === true, "Manager decided and approved request");
    assert(approvalRes.permit !== null, "New entry permit generated automatically");
    assert(approvalRes.permit.permit_code.startsWith('PER-'), "Generated permit has valid code");
    assert(approvalRes.permit.pin_code && approvalRes.permit.pin_code.length === 5, "5-Digit quick verification PIN created");

    // --- TEST 4: Officer Live Real-Time Update ---
    console.log("\n4. Testing Officer Real-Time Dynamic Screen Update upon Decision...");
    officer.handleInspectionDecision({
        request_id: latestReq.id,
        status: 'approved',
        plate: latestReq.plate_ar,
        permit_code: approvalRes.permit.permit_code,
        pin_code: approvalRes.permit.pin_code
    });

    const updatedCardHtml = document.getElementById('modal-container').innerHTML;
    assert(updatedCardHtml.includes('تمت موافقة واعتماد دخول الشاحنة'), "Officer tracker updated live with approval status");
    assert(updatedCardHtml.includes(approvalRes.permit.pin_code), "5-Digit PIN displayed on officer screen");
    assert(updatedCardHtml.includes('quickAdmitExpectedVehicle'), "1-Click instant permit search button provided for officer");

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
