// ==========================================
// CONEXIÓN TELEGRAM (Para la Fase 4 - APK)
// ==========================================
// Nota: Spck Editor bloquea las conexiones WebSocket, 
// pero este código funcionará perfecto en la APK real.

const API_ID = 35765130; 
const API_HASH = '57f43fe98aa6c6e7a1ab4f198b439ac5'; 

import { TelegramClient } from 'https://esm.sh/telegram@2.22.2';
import { StringSession } from 'https://esm.sh/telegram/sessions?target=es2022';

let client = null;

window.iniciarTelegram = async function(telefono) {
    const session = new StringSession(""); 
    client = new TelegramClient(session, API_ID, API_HASH, { connectionRetries: 5 });

    try {
        await client.start({
            phoneNumber: async () => telefono,
            password: async () => prompt("Ingresa tu contraseña de verificación en dos pasos (si tienes):"),
            phoneCode: async () => prompt("Te llegó un código a tu Telegram. Ingrésalo aquí:"),
            onError: (err) => console.log(err),
        });

        console.log("✅ Conectado a Telegram");
        localStorage.setItem('tg_session', client.session.save());
        return true;
        
    } catch (error) {
        console.error("Error:", error);
        alert("Error de conexión. Revisa tu internet o tus credenciales.");
        return false;
    }
};

window.enviarMensajeTelegram = async function(destino, texto) {
    if (!client) {
        return false;
    }
    try {
        await client.sendMessage(destino, { message: texto });
        return true;
    } catch (e) {
        console.error("Error enviando:", e);
        return false;
    }
};