import fs from 'fs';

global.window = {};
global.document = {
    createElement: (tag) => ({
        setAttribute: () => {},
        appendChild: () => {},
        style: {},
        getContext: () => ({
            clearRect: () => {},
            fillRect: () => {},
            strokeRect: () => {},
            drawImage: () => {}
        })
    }),
    documentElement: { tagName: 'html' }
};

const qrcodeCode = fs.readFileSync('js/qrcode.min.js', 'utf8');
eval(qrcodeCode);

try {
    const el = { appendChild: () => {}, childNodes: [] };
    const arabicPayload = JSON.stringify({ permit: "PER-2026-5229", plate: "ط ر ق ٩ ٨ ٢ ١", phone: "1235464" });
    console.log("Testing with raw Arabic string...");
    const qr = new window.QRCode(el, { text: arabicPayload, width: 140, height: 140 });
    console.log("Success with raw Arabic string!");
} catch (e) {
    console.error("FAILED with raw Arabic string:", e.message);
}

try {
    const el = { appendChild: () => {}, childNodes: [] };
    const arabicPayload = JSON.stringify({ permit: "PER-2026-5229", plate: "ط ر ق ٩ ٨ ٢ ١", phone: "1235464" });
    // UTF-8 fix for qrcodejs:
    const utf8Payload = unescape(encodeURIComponent(arabicPayload));
    console.log("\nTesting with unescape(encodeURIComponent(...)) fix...");
    const qr2 = new window.QRCode(el, { text: utf8Payload, width: 140, height: 140 });
    console.log("SUCCESS with UTF-8 fix!");
} catch (e) {
    console.error("FAILED with fix:", e.message);
}
