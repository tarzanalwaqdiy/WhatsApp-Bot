const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth');
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

    if (text.toLowerCase() === '!وقت') {
      const time = new Date().toLocaleString('ar-YE', { timeZone: 'Asia/Riyadh' });
      await sock.sendMessage(msg.key.remoteJid, { text: `🕒 الوقت الآن: ${time}` });
    }

    if (text.toLowerCase().includes('من أنا')) {
      await sock.sendMessage(msg.key.remoteJid, { text: `👤 أنت: ${msg.pushName || 'مستخدم مجهول'}` });
    }
  });
}

startBot();