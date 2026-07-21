/**
 * OPTIVITA SELF-HOSTED WHATSAPP AUTOMATION BRIDGE
 * (Free, for Development and Testing)
 * 
 * Dependencies to install:
 * npm install whatsapp-web.js qrcode-terminal express body-parser
 * 
 * How to Run:
 * 1. Run "node whatsapp-bridge.js" in your terminal.
 * 2. Scan the QR code printed in the terminal using your WhatsApp app (Linked Devices).
 * 3. Once connected, your local server will listen on port 3000.
 */

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Initialize WhatsApp client with local session caching
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        handleSIGINT: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// Print QR code in terminal for scanning
client.on('qr', (qr) => {
    console.log('\n--- SCAN THIS QR CODE WITH WHATSAPP LINKED DEVICES ---');
    qrcode.generate(qr, { small: true });
    console.log('------------------------------------------------------\n');
});

client.on('ready', () => {
    console.log('WhatsApp client is ready and connected!');
});

client.on('auth_failure', (msg) => {
    console.error('WhatsApp Authentication failure:', msg);
});

// Endpoint to send verification codes
app.post('/send-whatsapp', async (req, res) => {
    const { phone, message } = req.body;

    if (!phone || !message) {
        return res.status(400).json({ status: 'error', message: 'Missing phone or message.' });
    }

    try {
        // Format phone number to WhatsApp JID format (e.g. 966538530413@c.us)
        let cleanPhone = phone.replace(/[^0-9]/g, "");
        
        // Append @c.us for standard mobile chats
        const jid = `${cleanPhone}@c.us`;

        // Check if number is registered on WhatsApp
        const isRegistered = await client.isRegisteredUser(jid);
        if (!isRegistered) {
            return res.status(400).json({ status: 'error', message: 'Phone number is not registered on WhatsApp.' });
        }

        // Deliver message
        await client.sendMessage(jid, message);
        console.log(`Successfully sent WhatsApp message to ${phone}`);
        res.json({ status: 'success', message: 'Message sent successfully.' });

    } catch (error) {
        console.error('Failed to send WhatsApp message:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`WhatsApp Bridge Server running on http://localhost:${PORT}`);
});
