const { uploadToMega } = require('./mega') // top of file

// Inside your media message handler:
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

    fs.mkdirSync(path.join(__dirname, "downloads"), { recursive: true })
    fs.writeFileSync(filePath, buffer)
    console.log(`📁 Saved ${fileType} to: ${filePath}`)

    // 🟢 Upload to MEGA
    try {
        const megaUrl = await uploadToMega(filePath)
        console.log("🔗 MEGA URL:", megaUrl)

        await sock.sendMessage(sender, { text: `✅ File uploaded to MEGA:\n${megaUrl}` })
    } catch (err) {
        console.error("❌ MEGA upload error:", err)
        await sock.sendMessage(sender, { text: `❌ Upload failed.` })
    }
}
