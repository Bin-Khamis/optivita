/**
 * WhatsApp Bridge Test Dispatcher
 * Run this script to test if your local WhatsApp bridges are working correctly.
 * 
 * Usage:
 * node test-whatsapp.cjs <port> <phone> <message>
 * 
 * Examples:
 * node test-whatsapp.cjs 3000 9665XXXXXXXX "Hello from Saudi Bridge!"
 * node test-whatsapp.cjs 3001 919XXXXXXXX "Hello from India Bridge!"
 */

const http = require("http");

const port = process.argv[2];
const phone = process.argv[3];
const message = process.argv[4] || "Test message from Optivita!";

if (!port || !phone) {
  console.log("Usage: node test-whatsapp.cjs <port> <phone_number> [message]");
  console.log("Example: node test-whatsapp.cjs 3000 966500000000 'Test!'");
  process.exit(1);
}

const payload = JSON.stringify({ phone, message });

const options = {
  hostname: "localhost",
  port: parseInt(port, 10),
  path: "/send-whatsapp",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload)
  }
};

const req = http.request(options, (res) => {
  let body = "";
  res.on("data", (chunk) => body += chunk);
  res.on("end", () => {
    console.log(`Response Status: ${res.statusCode}`);
    console.log(`Response Body: ${body}`);
  });
});

req.on("error", (e) => {
  console.error(`Error connecting to bridge on port ${port}: ${e.message}`);
});

req.write(payload);
req.end();
