const { default: makeWASocket, useSingleFileAuthState, downloadMediaMessage } = require("@whiskeysockets/baileys")
const { Boom } = require("@hapi/boom")
const fs = require("fs")
const path = require("path")

const { state, saveState } = useSingleFileAuthState('./auth_info.json')

async function startBot() {
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    })

    sock.ev.on('creds.update', saveState)

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        const msg = messages[0]
        if (!msg.message || msg.key.fromMe) return

        const sender = msg.key.remoteJid
        const messageType = Object.keys(msg.message)[0]

        // ✅ Text message handler
        if (messageType === 'conversation') {
            const text = msg.message.conversation
            console.log(`📩 Message from ${sender}: ${text}`)

            if (text.toLowerCase() === 'hi') {
                await sock.sendMessage(sender, { text: 'Hello! Send me a file and I will save it.' })
            }
        }

        // ✅ Media message handler
        if (["imageMessage", "videoMessage", "documentMessage", "audioMessage"].includes(messageType)) {
            const buffer = await downloadMediaMessage(
                msg,
                "buffer",
                {},
                { logger: console, reuploadRequest: sock.updateMediaMessage }
            )

            const fileType = messageType.replace("Message", "")
            const fileExt = msg.message[messageType].mimetype?.split('/')[1] || "bin"
            const fileName = `${Date.now()}.${fileExt}`
            const filePath = path.join(__dirname, "downloads", fileName)

            // Create folder if not exists
            fs.mkdirSync(path.join(__dirname, "downloads"), { recursive: true })

            fs.writeFileSync(filePath, buffer)
            console.log(`📁 Saved ${fileType} to: ${filePath}`)

            await sock.sendMessage(sender, { text: `✅ File received and saved as ${fileName}` })
        }
    })
}

startBot()
