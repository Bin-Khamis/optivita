/**
 * OPTIVITA SELF-HOSTED WHATSAPP AUTOMATION BRIDGE
 * (Free, for Development and Testing)
 *
 * Dependencies to install:
 * npm install whatsapp-web.js qrcode-terminal express body-parser
 *
 * How to Run:
 * 1. Run "node whatsapp-bridge.cjs" in your terminal.
 * 2. Scan the QR code printed in the terminal using your WhatsApp app (Linked Devices).
 * 3. Once connected, your local server will listen on port 3000.
 */

const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(bodyParser.json());

// Enable CORS for local dev browser requests
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

const LOG_FILE = path.join(__dirname, "otp-logs.json");

// Country Dial Codes Metadata List
const COUNTRIES = [
  { name: "Saudi Arabia", dial_code: "+966" },
  { name: "Kuwait", dial_code: "+965" },
  { name: "United Arab Emirates", dial_code: "+971" },
  { name: "India", dial_code: "+91" },
  { name: "Bahrain", dial_code: "+973" },
  { name: "Oman", dial_code: "+968" },
  { name: "Qatar", dial_code: "+974" },
  { name: "Egypt", dial_code: "+20" },
  { name: "Jordan", dial_code: "+962" },
  { name: "Lebanon", dial_code: "+961" },
  { name: "United Kingdom", dial_code: "+44" },
  { name: "United States", dial_code: "+1" },
  { name: "Canada", dial_code: "+1" },
  { name: "Australia", dial_code: "+61" },
  { name: "New Zealand", dial_code: "+64" },
  { name: "Pakistan", dial_code: "+92" },
  { name: "Bangladesh", dial_code: "+880" },
  { name: "Philippines", dial_code: "+63" },
  { name: "Malaysia", dial_code: "+60" },
  { name: "Singapore", dial_code: "+65" },
  { name: "Indonesia", dial_code: "+62" },
  { name: "Turkey", dial_code: "+90" },
  { name: "Germany", dial_code: "+49" },
  { name: "France", dial_code: "+33" },
  { name: "Italy", dial_code: "+39" },
  { name: "Spain", dial_code: "+34" },
  { name: "Portugal", dial_code: "+351" },
  { name: "Netherlands", dial_code: "+31" },
  { name: "Switzerland", dial_code: "+41" },
  { name: "Sweden", dial_code: "+46" },
  { name: "Norway", dial_code: "+47" },
  { name: "Denmark", dial_code: "+45" },
  { name: "Finland", dial_code: "+358" },
  { name: "Austria", dial_code: "+43" },
  { name: "Belgium", dial_code: "+32" },
  { name: "Ireland", dial_code: "+353" },
  { name: "Greece", dial_code: "+30" },
  { name: "Russia", dial_code: "+7" },
  { name: "Brazil", dial_code: "+55" },
  { name: "Mexico", dial_code: "+52" },
  { name: "South Africa", dial_code: "+27" },
  { name: "Nigeria", dial_code: "+234" },
  { name: "Kenya", dial_code: "+254" },
];

// Helper: Normalize to E.164 phone format
function normalizeE164(phone, defaultDialCode = "+966") {
  let cleaned = phone.replace(/[\s\-\(\)]/g, "");
  if (cleaned.startsWith("00")) {
    cleaned = "+" + cleaned.slice(2);
  }
  if (!cleaned.startsWith("+")) {
    if (cleaned.startsWith("0")) {
      cleaned = cleaned.slice(1);
    }
    const dial = defaultDialCode.trim();
    const prefix = dial.startsWith("+") ? dial : dial ? "+" + dial : "+966";
    cleaned = prefix + cleaned;
  }
  const sorted = [...COUNTRIES].sort((a, b) => b.dial_code.length - a.dial_code.length);
  for (const c of sorted) {
    if (cleaned.startsWith(c.dial_code)) {
      let rest = cleaned.slice(c.dial_code.length);
      if (rest.startsWith("0")) {
        rest = rest.slice(1);
      }
      return c.dial_code + rest;
    }
  }
  return cleaned;
}

// Helper: Get Country Name from Phone Number
function getCountryByPhone(phone) {
  const digits = phone.replace(/[^0-9]/g, "");
  const sorted = [...COUNTRIES].sort((a, b) => b.dial_code.length - a.dial_code.length);
  for (const c of sorted) {
    const dialDigits = c.dial_code.replace(/[^0-9]/g, "");
    if (digits.startsWith(dialDigits)) {
      return c.name;
    }
  }
  return "Unknown";
}

// Helper: Log OTP events to local json file
function logOTP(phone, country, status, failedReason = "") {
  try {
    let logs = [];
    if (fs.existsSync(LOG_FILE)) {
      const data = fs.readFileSync(LOG_FILE, "utf8");
      logs = JSON.parse(data || "[]");
    }
    const newLog = {
      phone: phone,
      country: country || "Unknown",
      status: status, // "Sent", "Failed", "Verified"
      sentTime: new Date().toISOString(),
      verified: status === "Verified",
      failedReason: failedReason,
    };
    logs.push(newLog);
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2), "utf8");
    console.log(`[OTP LOG] Phone: ${phone}, Status: ${status}, Reason: ${failedReason}`);
  } catch (e) {
    console.error("Failed to write to local OTP log file:", e);
  }
}

// Initialize WhatsApp client with local session caching
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    handleSIGINT: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-features=IsolateOrigins,site-per-process",
      "--disable-site-isolation-trials",
    ],
  },
});

// Prevent process from crashing due to unhandled exceptions or library rejections
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

// Print QR code in terminal for scanning
client.on("qr", (qr) => {
  console.log("\n--- SCAN THIS QR CODE WITH WHATSAPP LINKED DEVICES ---");
  console.log("RAW_QR_DATA:", qr);
  qrcode.generate(qr, { small: true });
  console.log("------------------------------------------------------\n");
});

client.on("ready", () => {
  console.log("WhatsApp client is ready and connected!");
});

client.on("auth_failure", (msg) => {
  console.error("WhatsApp Authentication failure:", msg);
});

client.on("disconnected", (reason) => {
  console.log("WhatsApp client was disconnected:", reason);
  try {
    client.destroy();
  } catch (e) {
    console.error("Error destroying client after disconnect:", e);
  }
  console.log("Re-initializing client...");
  client.initialize();
});

// Endpoint to send verification codes
app.post("/send-whatsapp", async (req, res) => {
  const { phone, message } = req.body;

  if (!phone || !message) {
    return res
      .status(400)
      .json({ status: "error", code: "INVALID_NUMBER", message: "Missing phone or message." });
  }

  const countryName = getCountryByPhone(phone);

  try {
    // Enforce strict E.164 normalization
    const formattedE164 = normalizeE164(phone);
    const digits = formattedE164.replace(/[^0-9]/g, "");

    // E.164 phone numbers must be between 7 and 15 digits
    if (digits.length < 7 || digits.length > 15) {
      logOTP(phone, countryName, "Failed", "Invalid Number");
      return res
        .status(400)
        .json({ status: "error", code: "INVALID_NUMBER", message: "Invalid Number" });
    }

    const jid = `${digits}@c.us`;

    // Check if number is registered on WhatsApp
    const isRegistered = await client.isRegisteredUser(jid);
    if (!isRegistered) {
      logOTP(formattedE164, countryName, "Failed", "WhatsApp Not Registered");
      return res.status(400).json({
        status: "error",
        code: "WHATSAPP_NOT_REGISTERED",
        message: "This number is not registered on WhatsApp.",
      });
    }

    // Deliver message
    await client.sendMessage(jid, message);
    console.log(`Successfully sent WhatsApp message to ${formattedE164}`);

    logOTP(formattedE164, countryName, "Sent");
    res.json({ status: "success", message: "Message sent successfully." });
  } catch (error) {
    console.error("Failed to send WhatsApp message:", error);
    logOTP(phone, countryName, "Failed", "Failed to Send OTP");

    res.status(500).json({
      status: "error",
      code: "FAILED_SEND",
      message: "Failed to Send OTP",
      details: error.message,
    });

    // If it's a Puppeteer frame issue or protocol error, attempt client re-initialization
    if (
      error.message &&
      (error.message.includes("detached Frame") ||
        error.message.includes("Protocol error") ||
        error.message.includes("Session closed"))
    ) {
      console.log("Puppeteer crash detected. Attempting to re-initialize WhatsApp client...");
      try {
        await client.destroy();
      } catch (e) {
        console.error("Error destroying client during recovery:", e);
      }
      client.initialize();
    }
  }
});

// Endpoint to mark OTP as verified in local logs
app.post("/verify-whatsapp-log", (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ status: "error", message: "Missing phone." });
  }
  const formattedE164 = normalizeE164(phone);
  const countryName = getCountryByPhone(formattedE164);
  logOTP(formattedE164, countryName, "Verified");
  res.json({ status: "success" });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`WhatsApp Bridge Server running on http://localhost:${PORT}`);
});

client.initialize();
