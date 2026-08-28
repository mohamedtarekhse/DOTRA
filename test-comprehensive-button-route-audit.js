// =========================================================================
// Comprehensive System Audit: Buttons, Modals, Event Handlers & Routes
// الفحص الشامل لكافة الأزرار، النوافذ المنبثقة، ومسارات النظام
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
    getElementById: (id) => mockElements[id] || null,
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
    Icons: null
};

global.alert = (msg) => {};
global.confirm = () => true;
global.prompt = (msg, def) => def || '';
global.location = { origin: 'http://localhost', href: '' };
global.fetch = async () => ({ ok: true, json: async () => ({ success: true }) });
global.BroadcastChannel = class {
    constructor(name) { this.name = name; }
    postMessage(data) {}
    close() {}
};
global.URL = {
    createObjectURL: () => 'blob://test',
    revokeObjectURL: () => {}
};
global.Blob = class {
    constructor(parts, opts) { this.parts = parts; this.opts = opts; }
};

// Load All Core Files
eval(fs.readFileSync(path.join(__dirname, 'js/i18n.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, 'js/arabic-plate.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, 'js/db.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, 'js/manager.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, 'js/officer.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, 'js/ceo.js'), 'utf8'));

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

// 1. EXTRACT ALL ONCLICK, ONSUBMIT, ONCHANGE HANDLERS FROM CODEBASE
function auditFileHandlers(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const regex = /(?:onclick|onsubmit|onchange|oninput)=["']([^"']+)["']/g;
    const matches = [];
    let m;
    while ((m = regex.exec(content)) !== null) {
        matches.push(m[1]);
    }
    return matches;
}

async function runSystemAudit() {
    console.log("\n=========================================================================");
    console.log("  COMPREHENSIVE BUTTON, ROUTE & MODAL HANDLER AUDIT (ALL CONTROLLERS)  ");
    console.log("=========================================================================\n");

    // --- AUDIT SECTION 1: Extraction & Static Resolution of All Inline Handlers ---
    console.log("1. Auditing all HTML inline event handlers across JS modules...");
    const filesToScan = [
        'js/manager.js',
        'js/officer.js',
        'js/ceo.js',
        'index.html',
        'ceo.html'
    ];

    let totalExtractedHandlers = 0;
    const handlerNames = new Set();

    filesToScan.forEach(f => {
        const fullPath = path.join(__dirname, f);
        if (fs.existsSync(fullPath)) {
            const handlers = auditFileHandlers(fullPath);
            handlers.forEach(h => {
                totalExtractedHandlers++;
                handlerNames.add(h);
            });
        }
    });

    console.log(`   Found ${totalExtractedHandlers} event attributes (${handlerNames.size} unique handlers).`);
    assert(totalExtractedHandlers > 50, `Found substantial interactive elements (Count: ${totalExtractedHandlers})`);

    // --- AUDIT SECTION 2: Manager Controller Actions & Modals ---
    console.log("\n2. Auditing Manager Controller Buttons & Modals...");
    const manager = window.Manager;

    assert(typeof manager.openPendingRequestsModal === 'function', "Manager.openPendingRequestsModal exists");
    assert(typeof manager.showRequestReviewModal === 'function', "Manager.showRequestReviewModal exists");
    assert(typeof manager.openQuickPermitModal === 'function', "Manager.openQuickPermitModal exists");
    assert(typeof manager.openSettingsModal === 'function', "Manager.openSettingsModal exists");
    assert(typeof manager.openImportCsvModal === 'function', "Manager.openImportCsvModal exists");
    assert(typeof manager.openImportRosterModal === 'function', "Manager.openImportRosterModal exists");
    assert(typeof manager.showPassModal === 'function', "Manager.showPassModal exists");
    assert(typeof manager.exportExcel === 'function', "Manager.exportExcel exists");
    assert(typeof manager.exportCSV === 'function', "Manager.exportCSV exists");
    assert(typeof manager.downloadCsvTemplate === 'function', "Manager.downloadCsvTemplate exists");
    assert(typeof manager.downloadRosterCsvTemplate === 'function', "Manager.downloadRosterCsvTemplate exists");
    assert(typeof manager.exportRosterCSV === 'function', "Manager.exportRosterCSV exists");

    // Modal executions check
    mockElements['modal-container'] = { innerHTML: '' };
    mockElements['main-content'] = { innerHTML: '' };

    // Test Open Pending Requests Modal
    manager.openPendingRequestsModal();
    assert(mockElements['modal-container'].innerHTML.includes('sap-modal-overlay'), "openPendingRequestsModal renders sap-modal-overlay");

    // Test Open Settings Modal (General Tab)
    manager.openSettingsModal('general');
    assert(mockElements['modal-container'].innerHTML.includes('setting-default-whatsapp'), "openSettingsModal('general') renders WhatsApp settings");

    // Test Open Settings Modal (Gates Tab)
    manager.openSettingsModal('gates');
    assert(mockElements['modal-container'].innerHTML.includes('new-gate-name'), "openSettingsModal('gates') renders gates management");

    // Test Open Settings Modal (Destinations Tab)
    manager.openSettingsModal('destinations');
    assert(mockElements['modal-container'].innerHTML.includes('new-destination-name'), "openSettingsModal('destinations') renders destinations management");

    // Test Open Quick Permit Modal
    manager.openQuickPermitModal();
    assert(mockElements['modal-container'].innerHTML.includes('quick-plate'), "openQuickPermitModal renders plate input");

    // Test Open Import CSV Manifest Modal
    manager.openImportCsvModal();
    assert(mockElements['modal-container'].innerHTML.includes('csv-import-textarea'), "openImportCsvModal renders CSV textarea");

    // Test Open Import Roster Modal
    manager.openImportRosterModal();
    assert(mockElements['modal-container'].innerHTML.includes('roster-import-textarea'), "openImportRosterModal renders roster textarea");

    // --- AUDIT SECTION 3: Officer Controller Actions & Modals ---
    console.log("\n3. Auditing Officer Controller Buttons & Modals...");
    const officer = window.Officer;

    assert(typeof officer.openExpectedArrivalsModal === 'function', "Officer.openExpectedArrivalsModal exists");
    assert(typeof officer.openInspectionRequestModal === 'function', "Officer.openInspectionRequestModal exists");
    assert(typeof officer.search === 'function', "Officer.search exists");
    assert(typeof officer.keypadPress === 'function', "Officer.keypadPress exists");
    assert(typeof officer.keypadBackspace === 'function', "Officer.keypadBackspace exists");
    assert(typeof officer.keypadClear === 'function', "Officer.keypadClear exists");
    assert(typeof officer.handleAdmit === 'function', "Officer.handleAdmit exists");
    assert(typeof officer.handleExit === 'function', "Officer.handleExit exists");
    assert(typeof officer.handleDeny === 'function', "Officer.handleDeny exists");

    // Test Officer Expected Arrivals Modal
    officer.openExpectedArrivalsModal();
    assert(mockElements['modal-container'].innerHTML.includes('sap-modal-overlay'), "Officer.openExpectedArrivalsModal renders overlay");

    // Test Officer Inspection Request Modal
    officer.openInspectionRequestModal();
    assert(mockElements['modal-container'].innerHTML.includes('req-plate'), "Officer.openInspectionRequestModal renders request form");

    // --- AUDIT SECTION 4: CEO Controller Actions & Modals ---
    console.log("\n4. Auditing CEO Controller Buttons & Modals...");
    const ceo = window.CEO;

    assert(typeof ceo.openAddUserModal === 'function', "CEO.openAddUserModal exists");
    assert(typeof ceo.openEditUserModal === 'function', "CEO.openEditUserModal exists");
    assert(typeof ceo.handleDeleteUser === 'function', "CEO.handleDeleteUser exists");
    assert(typeof ceo.showJourneyTimeline === 'function', "CEO.showJourneyTimeline exists");
    assert(typeof ceo.exportAuditExcel === 'function', "CEO.exportAuditExcel exists");
    assert(typeof ceo.setDateFilter === 'function', "CEO.setDateFilter exists");
    assert(typeof ceo.setGateFilter === 'function', "CEO.setGateFilter exists");
    assert(typeof ceo.setStatusFilter === 'function', "CEO.setStatusFilter exists");

    // Test CEO Add User Modal
    ceo.openAddUserModal();
    assert(mockElements['modal-container'].innerHTML.includes('new-user-role'), "CEO.openAddUserModal renders new user role selector");

    // Test CEO Edit User Modal
    const allUsers = window.DB.getUsers();
    if (allUsers.length > 0) {
        ceo.openEditUserModal(allUsers[0].id);
        assert(mockElements['modal-container'].innerHTML.includes('edit-user-name-ar'), "CEO.openEditUserModal renders edit user form");
    }

    // --- AUDIT SECTION 5: Global Window Fallback Bindings ---
    console.log("\n5. Auditing Global Window Bindings...");
    assert(typeof window.openPendingRequestsModal === 'function', "window.openPendingRequestsModal is bound globally");
    assert(typeof window.showRequestReviewModal === 'function', "window.showRequestReviewModal is bound globally");
    assert(typeof window.openInspectionRequestModal === 'function', "window.openInspectionRequestModal is bound globally");

    // --- Final Audit Summary ---
    console.log("\n=========================================================================");
    console.log(`  AUDIT RESULTS: ${passedTests}/${totalTests} CHECKS PASSED (${Math.round(passedTests/totalTests*100)}%)`);
    console.log("=========================================================================\n");

    if (passedTests === totalTests) {
        process.exit(0);
    } else {
        process.exit(1);
    }
}

runSystemAudit();
