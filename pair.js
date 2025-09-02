const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys")
const pino = require("pino")

async function startPairing() {
    const { state, saveCreds } = await useMultiFileAuthState("auth_info")

    const sock = makeWASocket({
        logger: pino({ level: "silent" }),
        auth: state,
        printQRInTerminal: false,
        browser: ["MyBot", "Chrome", "1.0.0"]
    })

    // Pairing code request
    if (!sock.authState.creds.registered) {
        const phoneNumber = "94XXXXXXXXX" // <-- මෙතනට තමන්ගේ WhatsApp number එක දාන්න
        const code = await sock.requestPairingCode(phoneNumber)
        console.log("📌 Your WhatsApp Pairing Code:", code)
    }

    // Save session
    sock.ev.on("creds.update", saveCreds)

    sock.ev.on("connection.update", (update) => {
        if(update.connection === "open") {
            console.log("✅ Bot connected successfully!")
        }
    })

    // Simple auto-reply
    sock.ev.on("messages.upsert", async (m) => {
        const msg = m.messages[0]
        if (!msg.message) return
        const from = msg.key.remoteJid
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text

        if (text) {
            console.log("📩 Message:", text)

            if (text.toLowerCase() === "hi") {
                await sock.sendMessage(from, { text: "Hello 👋, I am your WhatsApp Bot!" })
            }
        }
    })
}

startPairing()
