// =========================================================================
// Automated Test Suite: Shifts & Gates Roster Excel System
// اختبار منظومة مناوبات وورديات البوابات كشيت إكسيل (نماذج واستيراد وتصدير)
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
    createObjectURL: () => 'blob://excel-roster-test',
    revokeObjectURL: () => {}
};
global.Blob = class {
    constructor(parts, opts) { this.parts = parts; this.opts = opts; }
};

// Load Core Files
eval(fs.readFileSync(path.join(__dirname, 'js/i18n.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, 'js/arabic-plate.js'), 'utf8'));
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
    console.log("  TEST SUITE: Gates & Shift Roster Excel System        ");
    console.log("=======================================================\n");

    const db = window.DB;
    const manager = window.Manager;

    // --- TEST 1: Roster Excel Template Generation ---
    console.log("1. Testing Roster Excel Template Generation (.xls)...");
    const template = db.getRosterExcelTemplate();
    assert(template.includes('xmlns:x="urn:schemas-microsoft-com:office:excel"'), "Template contains Excel workbook metadata");
    assert(template.includes('<x:Name>جدول ورديات البوابات</x:Name>'), "Worksheet name is specified");
    assert(template.includes('اسم البوابة'), "Gate column present");
    assert(template.includes('كود شارة ضابط وردية النهار'), "Day badge column present");
    assert(template.includes('GT-01'), "Sample badge present");

    // --- TEST 2: Ingesting HTML Table Roster (Uploaded or Pasted from Excel) ---
    console.log("\n2. Testing HTML Table Roster Ingestion...");
    const sampleHtmlRoster = `
        <table>
            <tr><th>اسم البوابة</th><th>شارة النهار</th><th>ضابط النهار</th><th>شارة الليل</th><th>ضابط الليل</th><th>ملاحظات</th></tr>
            <tr><td>بوابة 1 الرئيسية - دوترا</td><td>GT-01</td><td>طارق محمود</td><td>GT-02</td><td>حسام حسن</td><td>بوابة الشاحنات</td></tr>
            <tr><td>بوابة 5 الشحن اللوجستي</td><td>GT-02</td><td>حسام حسن</td><td>GT-01</td><td>طارق محمود</td><td>بوابة جديدة</td></tr>
        </table>
    `;
    const resHtml = db.importRosterFromCSV(sampleHtmlRoster);
    assert(resHtml.success === true, "HTML table roster imported successfully");
    assert(resHtml.count === 2, "2 gates updated in roster");
    const roster = db.getGateRoster();
    const gate5 = roster.find(r => r.gate_name === 'بوابة 5 الشحن اللوجستي');
    assert(gate5 !== undefined, "New gate 5 was automatically added to system");
    assert(gate5.day_officer_id !== null, "Day officer assigned to gate 5");
    assert(gate5.night_officer_id !== null, "Night officer assigned to gate 5");

    // --- TEST 3: Ingesting Tab-Delimited TSV (Pasted Excel Cells) ---
    console.log("\n3. Testing Tab-Delimited TSV Roster Ingestion...");
    const sampleTsv = "اسم البوابة\tشارة النهار\tضابط النهار\tشارة الليل\tضابط الليل\tملاحظات\nبوابة 2 الشحن والجمارك - دوترا\tGT-01\tطارق محمود\tGT-02\tحسام حسن\tتحديث عبر إكسيل";
    const resTsv = db.importRosterFromCSV(sampleTsv);
    assert(resTsv.success === true, "TSV roster imported successfully");

    // --- TEST 4: Exporting Live Roster to Excel ---
    console.log("\n4. Testing Export Live Roster to Excel (.xls)...");
    const exportedRoster = db.exportRosterToExcel();
    assert(exportedRoster.includes('xmlns:x="urn:schemas-microsoft-com:office:excel"'), "Export contains Excel workbook metadata");
    assert(exportedRoster.includes('بوابة 5 الشحن اللوجستي'), "Export includes updated gate 5");

    // --- TEST 5: Manager Controller UI & Methods ---
    console.log("\n5. Testing Manager Controller UI & Methods...");
    assert(typeof manager.downloadRosterExcelTemplate === 'function', "Manager.downloadRosterExcelTemplate exists");
    assert(typeof manager.exportRosterExcel === 'function', "Manager.exportRosterExcel exists");

    mockElements['modal-container'] = { innerHTML: '' };
    manager.openSettingsModal('gates');
    const settingsHtml = mockElements['modal-container'].innerHTML;
    assert(settingsHtml.includes('Manager.downloadRosterExcelTemplate()'), "Settings gates tab has Download Excel Template button");
    assert(settingsHtml.includes('Manager.exportRosterExcel()'), "Settings gates tab has Export Roster Excel button");
    assert(settingsHtml.includes('Manager.openImportRosterModal()'), "Settings gates tab has Import Roster button");

    mockElements['modal-container'] = { innerHTML: '' };
    manager.openImportRosterModal();
    const importModalHtml = mockElements['modal-container'].innerHTML;
    assert(importModalHtml.includes('Manager.downloadRosterExcelTemplate()'), "Import modal has Download Excel Template button");
    assert(importModalHtml.includes('accept=".xlsx, .xls, .csv, .txt"'), "Import modal accepts Excel extensions");

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
