const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const axios = require('axios');

async function iniciarBot() {
    // Obtiene la última versión de WhatsApp
    const { version } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState('./auth');

    // Crea el socket
    const sock = makeWASocket({
        version,
        auth: state
    });

    // Guarda credenciales automáticamente
    sock.ev.on('creds.update', saveCreds);

    // Mostrar QR en consola
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('📱 Escanea este código QR con tu WhatsApp:');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('📴 Conexión cerrada. ¿Reintentar?', shouldReconnect);
            if (shouldReconnect) iniciarBot();
        }

        if (connection === 'open') {
            console.log('✅ Conectado a WhatsApp correctamente');
        }
    });

    // Escucha los mensajes entrantes
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;

        const texto = m.message.conversation || '';
        const numero = m.key.remoteJid;

        console.log(`📩 Mensaje recibido de ${numero}: "${texto}"`);

        try {
            const res = await axios.post('http://localhost:5000/responder', { texto });
            await sock.sendMessage(numero, { text: res.data.respuesta });
        } catch (err) {
            console.error('❌ Error en la respuesta del backend:', err.message);
        }
    });
}

// Iniciar el bot
iniciarBot();