const { default: makeWASocket, useSingleFileAuthState } = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const qrcode = require("qrcode-terminal");
const fs = require("fs");

// إعداد ملف الجلسة
const { useSingleFileAuthState } = require('@whiskeysockets/baileys');
const { state, saveState } = useSingleFileAuthState('./session.json');
// إنشاء الاتصال
async function startSock() {
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false, // تم إيقاف هذا الخيار
        browser: ["Ubuntu", "Chrome", "22.04.4"]
    });

    // حفظ الجلسة عند أي تغيير
    sock.ev.on("creds.update", saveState);

    // طباعة QR عند التحديث
    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log("📲 امسح كود QR التالي بسرعة لتسجيل الدخول:");
            qrcode.generate(qr, { small: true });
        }

        if (connection === "close") {
            const shouldReconnect = (lastDisconnect.error = Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log("تم فصل الاتصال، إعادة التشغيل:", shouldReconnect);
            if (shouldReconnect) startSock();
        } else if (connection === "open") {
            console.log("✅ تم الاتصال بواتساب بنجاح!");
        }
    });

    // رسائل جديدة
    sock.ev.on("messages.upsert", async (m) => {
        console.log("📥 رسالة جديدة", m);
    });
}

startSock();
