const makeWASocket = require('@whiskeysockets/baileys').default;
const {
    useSingleFileAuthState,
    DisconnectReason,
    makeInMemoryStore
} = require('@whiskeysockets/baileys');

const qrcode = require('qrcode-terminal');
const { Boom } = require('@hapi/boom');
const fs = require('fs');

// تحميل الحالة من ملف
const { state, saveState } = useSingleFileAuthState('./session.json');

// إنشاء اتصال
async function connectToWhatsApp() {
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        browser: ['TarzanBot', 'Safari', '1.0.0']
    });

    // حفظ الحالة عند أي تغيير
    sock.ev.on('creds.update', saveState);

    // عرض رمز QR
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('📴 Connection closed. Reconnecting...', shouldReconnect);
            if (shouldReconnect) connectToWhatsApp();
        } else if (connection === 'open') {
            console.log('✅ Connected to WhatsApp!');
        }
    });

    sock.ev.on('messages.upsert', ({ messages, type }) => {
        const msg = messages[0];
        if (!msg.message) return;
        const from = msg.key.remoteJid;

        if (msg.message.conversation === 'ping') {
            sock.sendMessage(from, { text: 'pong 🏓' });
        }
    });
}

connectToWhatsApp();
