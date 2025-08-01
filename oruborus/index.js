const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys');
const axios = require('axios');

async function iniciarBot() {
    const { version } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState('./auth');

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: true, // ✅ Esto mostrará el código QR
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

            console.log('📴 Conexión cerrada. Reintentando...', shouldReconnect);
            if (shouldReconnect) {
                iniciarBot();
            } else {
                console.log('🔒 Sesión cerrada por el usuario.');
            }
        }

        if (connection === 'open') {
            console.log('✅ Conectado a WhatsApp');
        }

        if (update.qr) {
            console.log('📱 Escanea este código QR en WhatsApp:\n', update.qr);
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;

        const texto = m.message.conversation || "";
        const numero = m.key.remoteJid;

        console.log(`📩 "${texto}" desde ${numero}`);

        try {
            const res = await axios.post("http://localhost:5000/responder", { texto });
            await sock.sendMessage(numero, { text: res.data.respuesta });
        } catch (err) {
            console.error('❌ Error al responder:', err.message);
        }
    });
}

iniciarBot();