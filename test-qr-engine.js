import fs from 'fs';

global.window = {};
global.document = {
    createElement: (tag) => ({
        width: 0,
        height: 0,
        style: {},
        getContext: () => ({
            fillStyle: '',
            fillRect: () => {}
        })
    })
};

const code = fs.readFileSync('js/qr-engine.js', 'utf8');
eval(code);

const arabicPayload = JSON.stringify({
    permit: "PER-2026-5229",
    plate: "ط ر ق ٩ ٨ ٢ ١",
    phone: "1235464"
});

console.log("Testing QREngine with Arabic Payload:", arabicPayload);
const container = { appendChild: (el) => { console.log("✅ Appended canvas element successfully!"); } };

const res = window.QREngine.render(container, arabicPayload, { size: 150 });
if (res) {
    console.log("🎉 SUCCESS: QR code generated flawlessly for Arabic characters!");
    process.exit(0);
} else {
    console.error("❌ FAILED to render QR");
    process.exit(1);
}
