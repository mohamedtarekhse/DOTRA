// =========================================================================
// Automated Test Suite: Pre-Arrival Manifest Excel Sheet Import & Export
// اختبار كشف الوصول المسبق كشيت إكسيل (استيراد وتصدير ونماذج جاهزة)
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
    createObjectURL: () => 'blob://excel-test',
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
    console.log("  TEST SUITE: Pre-Arrival Manifest Excel Sheet System  ");
    console.log("=======================================================\n");

    const db = window.DB;
    const manager = window.Manager;

    // --- TEST 1: Excel Template Generation ---
    console.log("1. Testing Excel Template Generation (.xls HTML workbook)...");
    const excelTemplate = db.getExcelTemplate();
    assert(excelTemplate.includes('xmlns:x="urn:schemas-microsoft-com:office:excel"'), "Template contains Excel workbook XML metadata");
    assert(excelTemplate.includes('<x:Name>كشف الوصول المسبق</x:Name>'), "Worksheet name is specified");
    assert(excelTemplate.includes('<x:DisplayRightToLeft/>'), "Right-to-Left sheet orientation enabled");
    assert(excelTemplate.includes('رقم اللوحة'), "Plate column present");
    assert(excelTemplate.includes('اسم السائق'), "Driver column present");
    assert(excelTemplate.includes('ط ر ق ٩ ٨ ٢ ١'), "Sample plate present in template");

    // --- TEST 2: Import from HTML Table (Excel Copy/Paste or .xls Upload) ---
    console.log("\n2. Testing HTML Table Manifest Ingestion...");
    const sampleHtmlTable = `
        <table>
            <tr><th>رقم اللوحة</th><th>اسم السائق</th><th>الهاتف</th><th>الشركة</th><th>الوجهة</th><th>الحمولة</th><th>رقم الفاتورة</th></tr>
            <tr><td>أ ب ج ١ ٢ ٣ ٤</td><td>عمرو دياب السائق</td><td>01099887766</td><td>مصر للأسمنت</td><td>مصنع الكيماويات</td><td>أسمنت مقاوم 30 طن</td><td>INV-2026-901</td></tr>
            <tr><td>س ص ع ٧ ٨ ٩ ٠</td><td>إسماعيل ياسين</td><td>01122334455</td><td>الأهرام للتوزيع</td><td>المستودع الرئيسي</td><td>كراتين تغليف وتعبئة</td><td>INV-2026-902</td></tr>
        </table>
    `;
    const resHtml = db.importPreArrivalsFromCSV(sampleHtmlTable);
    assert(resHtml.success === true, "HTML table import succeeded");
    assert(resHtml.count === 2, "Imported 2 trucks from HTML table");
    const expectedTrucks = db.getExpectedArrivals();
    const truck1 = expectedTrucks.find(t => t.plate_ar.includes('أ ب ج ١ ٢ ٣ ٤'));
    assert(truck1 !== undefined, "First truck created from Excel HTML table");
    assert(truck1.driver_name_ar === 'عمرو دياب السائق', "Driver name imported correctly");
    assert(truck1.invoice_no === 'INV-2026-901', "Invoice number imported correctly");

    // --- TEST 3: Import from Tab-Delimited TSV (Copied directly from Excel cells) ---
    console.log("\n3. Testing Tab-Delimited TSV (Direct Excel Cells Paste)...");
    const sampleTsv = "رقم اللوحة\tاسم السائق\tالهاتف\tالشركة\tالوجهة\tالحمولة\tرقم الفاتورة\nق هـ و ٥ ٥ ٦ ٦\tطارق لطفي\t01234567890\tالسويس للأسمدة\tمحطة الصهاريج\tنترات سائلة\tINV-2026-903";
    const resTsv = db.importPreArrivalsFromCSV(sampleTsv);
    assert(resTsv.success === true, "TSV import succeeded");
    assert(resTsv.count === 1, "Imported 1 truck from TSV");

    // --- TEST 4: Export Expected Arrivals to Excel ---
    console.log("\n4. Testing Export Expected Arrivals to Excel...");
    const exportedExcel = db.exportExpectedArrivalsToExcel();
    assert(exportedExcel.includes('xmlns:x="urn:schemas-microsoft-com:office:excel"'), "Export contains Excel workbook headers");
    assert(exportedExcel.includes('أ ب ج ١ ٢ ٣ ٤'), "Export contains imported truck plate");
    assert(exportedExcel.includes('عمرو دياب السائق'), "Export contains imported driver");

    // --- TEST 5: Manager Controller Excel Methods & Modal UI ---
    console.log("\n5. Testing Manager Controller UI & Methods...");
    assert(typeof manager.downloadExcelTemplate === 'function', "Manager.downloadExcelTemplate is defined");
    assert(typeof manager.exportExpectedArrivalsExcel === 'function', "Manager.exportExpectedArrivalsExcel is defined");

    mockElements['modal-container'] = { innerHTML: '' };
    manager.openImportCsvModal();
    const modalHtml = mockElements['modal-container'].innerHTML;
    assert(modalHtml.includes('Manager.downloadExcelTemplate()'), "Modal contains Download Excel Template button");
    assert(modalHtml.includes('Manager.exportExpectedArrivalsExcel()'), "Modal contains Export Expected Arrivals to Excel button");
    assert(modalHtml.includes('accept=".xlsx, .xls, .csv, .txt"'), "File picker accepts .xlsx, .xls, .csv, .txt");

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
