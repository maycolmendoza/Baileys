const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const { state, saveState } = useMultiFileAuthState('./auth.json');
const axios = require("axios");

async function iniciar() {
    const sock = makeWASocket({ auth: state });
    
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message) return;

        const texto = m.message.conversation;
        const numero = m.key.remoteJid;

        const respuesta = await axios.post("http://localhost:5000/responder", { texto });
        await sock.sendMessage(numero, { text: respuesta.data.respuesta });
    });

    sock.ev.on('creds.update', saveState);
}
iniciar();