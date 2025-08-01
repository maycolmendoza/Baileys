const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const axios = require('axios');
const { Boom } = require('@hapi/boom');

async function iniciarBot() {
    const { version } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState('./auth');

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: true,  // 🔁 ESTO HACE QUE MUESTRE EL QR
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('📴 Conexión cerrada. Reintentando...', shouldReconnect);
            if (shouldReconnect) {
                iniciarBot();
            }
        } else if (connection === 'open') {
            console.log('✅ Conectado a WhatsApp');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;

        const texto = m.message.conversation || "";
        const numero = m.key.remoteJid;

        console.log(`📩 Mensaje recibido: "${texto}" de ${numero}`);

        try {
            const res = await axios.post("http://localhost:5000/responder", { texto });
            await sock.sendMessage(numero, { text: res.data.respuesta });
        } catch (error) {
            console.error("❌ Error en la respuesta del backend:", error.message);
        }
    });
}

iniciarBot();