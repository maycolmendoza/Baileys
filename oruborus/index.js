const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const axios = require("axios");

async function iniciar() {
    // ✅ Esperamos el estado de sesión correctamente
    const { state, saveCreds } = await useMultiFileAuthState('./auth');

    // ✅ Iniciamos el socket con el auth correcto
    const sock = makeWASocket({ auth: state });

    // ✅ Guardamos credenciales si cambian
    sock.ev.on('creds.update', saveCreds);

    // ✅ Escuchamos mensajes entrantes
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message) return;

        const texto = m.message.conversation || "";
        const numero = m.key.remoteJid;

        try {
            const res = await axios.post("http://localhost:5000/responder", { texto });
            await sock.sendMessage(numero, { text: res.data.respuesta });
        } catch (e) {
            console.error("Error al conectar con el backend:", e.message);
        }
    });
}

iniciar();