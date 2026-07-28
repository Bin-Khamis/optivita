/**
 * OPTIVITA CLIENT PORTAL SECURE MULTI-CHANNEL AUTHENTICATION ENDPOINTS
 *
 * Column Schema for the sheets:
 * 1. "Clients"
 *    - Col A: Enrollment ID
 *    - Col B: Client Name
 *    - Col C: Mobile Number
 *    - Col D: Email Address
 *    - Col E: Program
 *    - Col F: Status
 *    - Col G: Preferred Auth Method (email | whatsapp | totp)
 *    - Col H: TOTP Secret (Base32 encoded, e.g. JBSWY3DPEHPK3PXP)
 * 2. "OTP" (Columns: Enrollment ID, OTP, Created Time, Expiry Time, Verified, Attempts, Last Attempt Time)
 * 3. "Login Logs" (Columns: Enrollment ID, Login Time, Browser, Device, IP, Status)
 */

// CONFIGURATION: Set your self-hosted WhatsApp Bridge tunnel URL here (e.g. ngrok URL)
// Leave as "" to fallback to email simulations during local testing.
var WHATSAPP_BRIDGE_URL = "https://a1b2-34-56-78.ngrok-free.app/send-whatsapp";

// CONFIGURATION: Set your Resend API Key here to send emails through Resend
// Leave as "" to use Google's native MailApp under the deployer's account.
var RESEND_API_KEY = "";

// Helper: Get sheet case-insensitively and trimmed to prevent tab-name typo errors
function getSheetSafe(spreadsheet, name) {
  if (!name) return null;
  var sheets = spreadsheet.getSheets();
  var target = String(name).trim().toLowerCase();
  for (var i = 0; i < sheets.length; i++) {
    var sheetName = sheets[i].getName().trim().toLowerCase();
    if (sheetName === target) {
      return sheets[i];
    }
  }
  return spreadsheet.getSheetByName(name);
}

// Self-healing database: Automatically creates missing portal auth and ERP sheets and headers
function ensureRequiredSheets(spreadsheet) {
  var required = {
    Clients: [
      "Enrollment ID",
      "Client Name",
      "Mobile Number",
      "Email Address",
      "Program",
      "Status",
      "Preferred Auth Method",
      "TOTP Secret",
    ],
    OTP: [
      "Enrollment ID",
      "OTP",
      "Created Time",
      "Expiry Time",
      "Verified",
      "Attempts",
      "Last Attempt Time",
      "Resend Count",
    ],
    "Login Logs": ["Enrollment ID", "Login Time", "Browser", "Device", "IP", "Status"],
    Settings: ["Key", "Value"],
    Invoices: [
      "InvoiceId",
      "Enrollment ID",
      "Customer Name",
      "Program Name",
      "Amount",
      "Date",
      "Status",
      "Due Date",
    ],
    Receipts: [
      "ReceiptId",
      "Enrollment ID",
      "Customer Name",
      "Program Name",
      "Payment Method",
      "Amount",
      "Tax",
      "Discount",
      "Received By",
      "Date",
      "Branch",
      "Remarks",
      "Reference No",
    ],
    Expenses: [
      "ExpenseId",
      "Date",
      "Category",
      "Amount",
      "Remarks",
      "Status",
      "Approved By",
      "ReceiptUrl",
    ],
    Refunds: [
      "RefundId",
      "Date",
      "Customer Name",
      "Program",
      "Amount",
      "Payment Method",
      "Approved By",
      "Status",
      "Reason",
    ],
    "Cash Treasury": ["TxnId", "Date", "Type", "Amount", "Source", "Destination", "Remarks"],
    "Journal Ledger": [
      "JournalId",
      "Date",
      "Account Code",
      "Account Name",
      "Debit",
      "Credit",
      "Description",
      "Reference",
      "Party",
      "Created By",
      "Status",
      "Branch",
    ],
    "Payment Requests": [
      "PR No",
      "Client ID",
      "Client Name",
      "Invoice ID",
      "Amount",
      "Payment Method",
      "Submitted Date",
      "Status",
      "Proof Of Payment",
      "Notes",
    ],
    Notifications: [
      "Notification ID",
      "Title",
      "Message",
      "Sender",
      "Date",
      "Recipients Type",
      "Recipients List",
    ],
    "Notification Recipients": ["Notification ID", "Client ID", "Read Status", "Read Date"],
    Messages: ["Message ID", "Sender ID", "Sender Type", "Recipient ID", "Message", "Timestamp"],
    "Voucher Series": ["Series Key", "Prefix", "Next Number"],
    "Financial Periods": ["Period Code", "Start Date", "End Date", "Status"],
    Appointments: [
      "Appointment ID",
      "Client ID",
      "Client Name",
      "Email",
      "Phone",
      "Appointment Date",
      "Appointment Time",
      "Time Zone",
      "Reason",
      "Status",
      "Requested On",
      "Coach",
      "Internal Notes",
      "Google Meet Link",
    ],
    Staff: [
      "StaffId",
      "Name",
      "Role",
      "Branch",
      "Joining Date",
      "Salary",
      "Allowances",
      "Deductions",
      "Status",
    ],
  };

  for (var name in required) {
    var sheet = getSheetSafe(spreadsheet, name);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(name);
      sheet.appendRow(required[name]);
      // Format header row to bold, white text with teal background
      sheet
        .getRange(1, 1, 1, required[name].length)
        .setFontWeight("bold")
        .setBackground("#0f766e")
        .setFontColor("#ffffff");

      if (name === "Settings") {
        sheet.appendRow([
          "WhatsApp Bridge URL",
          "https://your-ngrok-url-here.ngrok-free.app/send-whatsapp",
        ]);
      } else if (name === "Voucher Series") {
        sheet.appendRow(["Invoice", "INV-", 1001]);
        sheet.appendRow(["Receipt", "RCPT-", 2001]);
        sheet.appendRow(["PaymentRequest", "PR-", 15]);
        sheet.appendRow(["Journal", "JV-", 3001]);
        sheet.appendRow(["Voucher", "VCH-", 4001]);
      } else if (name === "Financial Periods") {
        sheet.appendRow(["FY-2026", "2026-01-01", "2026-12-31", "Unlocked"]);
      }
    }
  }
}

// Helper: Get WhatsApp Bridge URL from Settings sheet or config
function getWhatsAppBridgeUrl(spreadsheet) {
  var settingsSheet = getSheetSafe(spreadsheet, "Settings");
  if (settingsSheet) {
    var rows = settingsSheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]).trim().toLowerCase() === "whatsapp bridge url") {
        var val = String(rows[i][1]).trim();
        if (val) return val;
      }
    }
    // Fail-safe: scan all cells in the second row (row index 1) for a URL starting with http
    if (rows.length > 1) {
      var secondRow = rows[1];
      for (var j = 0; j < secondRow.length; j++) {
        var val = String(secondRow[j] || "").trim();
        if (val.indexOf("http") === 0) {
          return val;
        }
      }
    }
  }
  return WHATSAPP_BRIDGE_URL;
}

function doGet(e) {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    ensureRequiredSheets(spreadsheet);
    var action = e && e.parameter ? e.parameter.action : "getData";

    if (action === "getData" || !action) {
      var data = handleGetData();
      return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
        ContentService.MimeType.JSON,
      );
    }

    return ContentService.createTextOutput(
      JSON.stringify({ status: "error", message: "Invalid GET action." }),
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({
        status: "error",
        message: "Unexpected error in doGet: " + error.toString(),
      }),
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var requestData = JSON.parse(e.postData.contents);
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    ensureRequiredSheets(spreadsheet); // Auto-creates Clients, OTP, Login Logs if missing

    var action = requestData.action;
    var response;

    switch (action) {
      case "verify-client":
        response = verifyClient(requestData);
        break;
      case "send-otp":
        response = sendOTP(requestData);
        break;
      case "verify-otp":
        response = verifyOTP(requestData);
        break;
      case "update-security-preference":
        response = updateSecurityPreference(requestData);
        break;
      case "bookAppointment":
        requestData.sheetName = "Appointments";
        requestData.fullName = requestData.customerName;
        requestData["Customer Name"] = requestData.customerName;
        requestData.AppointmentId = "APT-" + Math.floor(100000 + Math.random() * 900000);
        requestData["Appointment ID"] = requestData.AppointmentId;
        response = handleWebhookSubmit(requestData);
        break;
      case "redeemReward":
        response = redeemReward(requestData);
        break;
      case "getData":
        response = handleGetData();
        break;
      case "updateRecord":
        response = handleUpdateRecord(requestData);
        break;
      case "webhookSubmit":
        response = handleWebhookSubmit(requestData);
        break;
      default:
        if (requestData.fullName || requestData.email || requestData.programName) {
          response = handleWebhookSubmit(requestData);
        } else {
          response = { status: "error", message: "Invalid action request." };
        }
    }

    return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(
      ContentService.MimeType.JSON,
    );
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({
        status: "error",
        message:
          "Unexpected error: " + error.toString() + (error.stack ? "\nStack: " + error.stack : ""),
      }),
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// 1. Verify Client Credentials Action
function verifyClient(data) {
  var enrollmentId = String(data.enrollmentId || "").trim();
  var phoneInput = String(data.phone || "")
    .trim()
    .replace(/[^0-9+]/g, "");

  if (!enrollmentId || !phoneInput) {
    return { status: "error", message: "Invalid Enrollment ID or Mobile Number." };
  }

  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getSheetSafe(spreadsheet, "Clients");
  if (!sheet) {
    var available = [];
    var sheets = spreadsheet.getSheets();
    for (var i = 0; i < sheets.length; i++) {
      available.push(sheets[i].getName());
    }
    return {
      status: "error",
      message:
        "Database connection failed. Clients sheet missing. Available sheets in your document: [" +
        available.join(", ") +
        "]",
    };
  }

  var rows = sheet.getDataRange().getValues();
  var found = false;
  var email = "";
  var preferredMethod = "email";
  var totpSecret = "";
  var totpConfigured = false;

  for (var i = 1; i < rows.length; i++) {
    var dbId = String(rows[i][0]).trim();
    var dbPhoneRaw = String(rows[i][2]).trim();
    var dbPhone = dbPhoneRaw.replace(/[^0-9]/g, "");
    var dbStatus = String(rows[i][5]).trim();

    if (dbId === enrollmentId) {
      var phoneInputDigits = phoneInput.replace(/[^0-9]/g, "");
      var isPhoneMatch = false;

      if (dbPhone === phoneInputDigits) {
        isPhoneMatch = true;
      } else if (dbPhone.length >= 7 && phoneInputDigits.length >= 7) {
        var minLen = Math.min(dbPhone.length, phoneInputDigits.length, 8);
        isPhoneMatch = dbPhone.slice(-minLen) === phoneInputDigits.slice(-minLen);
      }

      if (isPhoneMatch) {
        if (dbStatus.toLowerCase() === "suspended" || dbStatus.toLowerCase() === "inactive") {
          return { status: "error", message: "Account is inactive. Please contact support." };
        }
        email = String(rows[i][3]).trim();
        preferredMethod = String(rows[i][6] || "email")
          .trim()
          .toLowerCase();
        totpSecret = String(rows[i][7] || "").trim();
        totpConfigured = !!totpSecret;
        found = true;
        break;
      }
    }
  }

  // Self-healing check: if not found in Clients sheet, look in Program Enrollments and migrate them!
  if (!found) {
    var enrollSheet = getSheetSafe(spreadsheet, "Program Enrollments");
    if (enrollSheet) {
      var enrollRows = enrollSheet.getDataRange().getValues();
      var enrollHeaders = enrollRows[0];

      // Map indexes
      var idIdx = -1,
        nameIdx = -1,
        phoneIdx = -1,
        emailIdx = -1,
        progIdx = -1;
      for (var h = 0; h < enrollHeaders.length; h++) {
        var hName = String(enrollHeaders[h]).trim().toLowerCase();
        if (hName === "enrollment id" || hName === "enrollmentid") idIdx = h;
        else if (hName === "fullname") nameIdx = h;
        else if (hName === "phone") phoneIdx = h;
        else if (hName === "email") emailIdx = h;
        else if (hName === "programname") progIdx = h;
      }

      if (idIdx !== -1) {
        for (var r = 1; r < enrollRows.length; r++) {
          if (String(enrollRows[r][idIdx]).trim() === enrollmentId) {
            var inputPhoneClean = phoneInput.replace(/[^0-9]/g, "");
            var dbEnrollPhoneClean = String(enrollRows[r][phoneIdx] || "")
              .trim()
              .replace(/[^0-9]/g, "");

            // Allow sub-string matching for country code flexibility
            if (
              dbEnrollPhoneClean.indexOf(inputPhoneClean) !== -1 ||
              inputPhoneClean.indexOf(dbEnrollPhoneClean) !== -1
            ) {
              var clientName = nameIdx !== -1 ? String(enrollRows[r][nameIdx]).trim() : "";
              var clientPhone = phoneIdx !== -1 ? String(enrollRows[r][phoneIdx]).trim() : "";
              email = emailIdx !== -1 ? String(enrollRows[r][emailIdx]).trim() : "";
              var program = progIdx !== -1 ? String(enrollRows[r][progIdx]).trim() : "";

              // Add portal login profile row
              var clientHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
              var newClientRow = [];
              for (var cl = 0; cl < clientHeaders.length; cl++) {
                var ch = String(clientHeaders[cl]).trim();
                var chVal = "";
                if (ch === "Enrollment ID" || ch === "EnrollmentID") chVal = enrollmentId;
                else if (ch === "Client Name" || ch === "ClientName") chVal = clientName;
                else if (ch === "Mobile Number" || ch === "MobileNumber") chVal = clientPhone;
                else if (ch === "Email Address" || ch === "EmailAddress") chVal = email;
                else if (ch === "Program") chVal = program;
                else if (ch === "Status") chVal = "Active";
                else if (ch === "Preferred Auth Method" || ch === "PreferredAuthMethod")
                  chVal = "email";
                else if (ch === "TOTP Secret" || ch === "TOTPSecret") chVal = "";
                newClientRow.push(chVal);
              }

              sheet.appendRow(newClientRow);
              SpreadsheetApp.flush();

              preferredMethod = "email";
              totpSecret = "";
              totpConfigured = false;
              found = true;
              break;
            }
          }
        }
      }
    }
  }

  if (!found) {
    return { status: "error", message: "Invalid Enrollment ID or Mobile Number." };
  }

  return {
    status: "success",
    message: "Client verified.",
    emailMasked: maskEmail(email),
    preferredMethod: preferredMethod,
    totpConfigured: totpConfigured,
  };
}

// 2. Generate and Dispatch OTP
function sendOTP(data) {
  var enrollmentId = String(data.enrollmentId || "").trim();
  var method = String(data.method || "email")
    .trim()
    .toLowerCase(); // email | whatsapp

  if (!enrollmentId) {
    return { status: "error", message: "Invalid request. Missing ID." };
  }

  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var clientsSheet = getSheetSafe(spreadsheet, "Clients");
  var otpSheet = getSheetSafe(spreadsheet, "OTP");

  if (!clientsSheet || !otpSheet) {
    return { status: "error", message: "Database tables missing." };
  }

  // Find Client metadata
  var clientRows = clientsSheet.getDataRange().getValues();
  var clientEmail = "";
  var clientName = "";
  var clientPhone = "";

  for (var i = 1; i < clientRows.length; i++) {
    if (String(clientRows[i][0]).trim() === enrollmentId) {
      clientName = String(clientRows[i][1]).trim();
      clientPhone = String(clientRows[i][2]).trim();
      clientEmail = String(clientRows[i][3]).trim();
      break;
    }
  }

  // Fallback: If not in Clients sheet, check Program Enrollments sheet
  if (!clientEmail) {
    var enrollSheet = getSheetSafe(spreadsheet, "Program Enrollments");
    if (enrollSheet) {
      var enrollRows = enrollSheet.getDataRange().getValues();
      var enrollHeaders = enrollRows[0];
      var idIdx = -1,
        nameIdx = -1,
        phoneIdx = -1,
        emailIdx = -1;
      for (var h = 0; h < enrollHeaders.length; h++) {
        var hName = String(enrollHeaders[h]).trim().toLowerCase();
        if (hName === "enrollment id" || hName === "enrollmentid") idIdx = h;
        else if (hName === "fullname") nameIdx = h;
        else if (hName === "phone") phoneIdx = h;
        else if (hName === "email") emailIdx = h;
      }
      if (idIdx !== -1) {
        for (var r = 1; r < enrollRows.length; r++) {
          if (String(enrollRows[r][idIdx]).trim() === enrollmentId) {
            clientName = nameIdx !== -1 ? String(enrollRows[r][nameIdx]).trim() : "Client";
            clientPhone = phoneIdx !== -1 ? String(enrollRows[r][phoneIdx]).trim() : "";
            clientEmail = emailIdx !== -1 ? String(enrollRows[r][emailIdx]).trim() : "";
            break;
          }
        }
      }
    }
  }

  if (!clientEmail) {
    clientEmail = "client@optivita.com";
  }

  // Rate limit: Max 5 OTP requests per hour
  var nowTime = new Date().getTime();
  var otpRows = otpSheet.getDataRange().getValues();
  var requestCount = 0;
  var oneHourAgo = nowTime - 60 * 60 * 1000;

  for (var j = 1; j < otpRows.length; j++) {
    if (String(otpRows[j][0]).trim() === enrollmentId) {
      var created = new Date(otpRows[j][2]).getTime();
      if (created > oneHourAgo) {
        requestCount++;
      }
    }
  }

  if (requestCount >= 5) {
    return {
      status: "error",
      message: "Too many requests. Please wait an hour before requesting a new OTP.",
    };
  }

  // Generate 6-digit OTP
  var pin = String(Math.floor(100000 + Math.random() * 900000));
  var expiry = new Date(nowTime + 5 * 60 * 1000);

  // Save to OTP sheet & check resend count limit
  var exists = false;
  var resendCount = 0;
  var existingRowIndex = -1;
  for (var k = 1; k < otpRows.length; k++) {
    if (String(otpRows[k][0]).trim() === enrollmentId) {
      resendCount = parseInt(otpRows[k][7] || 0, 10);
      existingRowIndex = k;
      exists = true;
      break;
    }
  }

  if (exists && resendCount >= 3) {
    var createdTime = new Date(otpRows[existingRowIndex][2]).getTime();
    var resendLockRemaining = 15 * 60 * 1000 - (nowTime - createdTime);
    if (resendLockRemaining > 0) {
      var mins = Math.ceil(resendLockRemaining / (60 * 1000));
      return {
        status: "error",
        code: "RESEND_LIMIT_EXCEEDED",
        message: "Too many resend attempts. Please wait " + mins + " minutes.",
      };
    } else {
      resendCount = 0;
    }
  }

  // Generate 6-digit OTP
  var pin = String(Math.floor(100000 + Math.random() * 900000));
  var expiry = new Date(nowTime + 5 * 60 * 1000);

  if (exists) {
    otpSheet.getRange(existingRowIndex + 1, 2).setValue(pin);
    otpSheet.getRange(existingRowIndex + 1, 3).setValue(new Date());
    otpSheet.getRange(existingRowIndex + 1, 4).setValue(expiry);
    otpSheet.getRange(existingRowIndex + 1, 5).setValue("false");
    otpSheet.getRange(existingRowIndex + 1, 6).setValue(0);
    otpSheet.getRange(existingRowIndex + 1, 7).setValue("");
    otpSheet.getRange(existingRowIndex + 1, 8).setValue(resendCount + 1);
  } else {
    otpSheet.appendRow([enrollmentId, pin, new Date(), expiry, "false", 0, "", 0]);
  }

  // Handle Multi-Channel Dispatch
  if (method === "whatsapp") {
    var messageText =
      "Hello " +
      clientName +
      ",\n\nYour Optivita verification code is: " +
      pin +
      "\n\nThis code expires in 5 minutes.";
    var activeBridgeUrl = getWhatsAppBridgeUrl(spreadsheet);

    if (activeBridgeUrl && activeBridgeUrl.indexOf("your-ngrok-url-here") === -1) {
      var options = {
        method: "post",
        contentType: "application/json",
        headers: {
          "Bypass-Tunnel-Reminder": "true",
        },
        payload: JSON.stringify({
          phone: clientPhone,
          message: messageText,
        }),
        muteHttpExceptions: true,
      };

      try {
        var response = UrlFetchApp.fetch(activeBridgeUrl, options);
        var respText = response.getContentText();
        Logger.log("WhatsApp Bridge Response: " + respText);

        var respJson = JSON.parse(respText);
        if (respJson && respJson.status === "error") {
          return {
            status: "error",
            code: respJson.code || "FAILED_SEND",
            message: respJson.message || "Failed to Send OTP",
          };
        }
      } catch (err) {
        Logger.log("WhatsApp Bridge Error: " + err.toString());
        return {
          status: "error",
          code: "FAILED_SEND",
          message: "Failed to Send OTP",
        };
      }
    } else {
      var logMsg = "Simulated WhatsApp delivery to " + clientPhone + " with OTP: " + pin;
      Logger.log(logMsg);

      // For development convenience, we also dispatch an email backup so they always receive it
      try {
        sendEmailViaProvider(
          clientEmail,
          "Optivita Client Portal Verification (WhatsApp Request)",
          "<p>Hello <strong>" +
            clientName +
            "</strong>,</p><p>Your WhatsApp verification code was requested. Code is:</p><h2>" +
            pin +
            "</h2>",
        );
      } catch (e) {}
    }
  } else {
    // Email Delivery
    var subject = "Optivita Client Portal Verification Code";
    var htmlBody =
      "<div style='font-family:sans-serif; max-width:600px; padding:20px; border:1px solid #e2e8f0; border-radius:16px;'>" +
      "<h2 style='color:#0f766e;'>Optivita Precision Health</h2>" +
      "<p>Hello <strong>" +
      clientName +
      "</strong>,</p>" +
      "<p>Your verification code is:</p>" +
      "<div style='background-color:#f1f5f9; padding:15px; text-align:center; font-size:24px; font-weight:bold; letter-spacing:4px; margin:20px 0; color:#1e293b; border-radius:8px;'>" +
      pin +
      "</div>" +
      "<p style='color:#ef4444; font-size:12px;'>This verification code is valid for 5 minutes.</p>" +
      "<p>Do not share this code with anyone.</p><br/>" +
      "<p>Regards,<br/><strong>Optivita Team</strong></p>" +
      "</div>";

    try {
      sendEmailViaProvider(clientEmail, subject, htmlBody);
    } catch (err) {
      return {
        status: "error",
        message: "Failed to dispatch verification email: " + err.toString(),
      };
    }
  }

  return {
    status: "success",
    message: "Verification code sent successfully.",
    emailMasked: maskEmail(clientEmail),
    phoneMasked: maskPhone(clientPhone),
    otp: pin,
  };
}

// 3. Verify OTP / TOTP & Create Authenticated Session
function verifyOTP(data) {
  var enrollmentId = String(data.enrollmentId || "").trim();
  var otpCode = String(data.otp || "").trim();
  var clientBrowser = String(data.browser || "Unknown");
  var clientDevice = String(data.device || "Unknown");
  var clientIP = String(data.ip || "Unknown");

  if (!enrollmentId || !otpCode) {
    return { status: "error", message: "Invalid verification code." };
  }

  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var otpSheet = getSheetSafe(spreadsheet, "OTP");
  var clientsSheet = getSheetSafe(spreadsheet, "Clients");
  var logsSheet = getSheetSafe(spreadsheet, "Login Logs");

  if (!otpSheet || !clientsSheet || !logsSheet) {
    return { status: "error", message: "Database connection failed." };
  }

  // Load Client Data & preferredAuthMethod
  var clientRows = clientsSheet.getDataRange().getValues();
  var clientData = null;
  var preferredMethod = "email";
  var totpSecret = "";
  var clientRowIndex = -1;

  for (var j = 1; j < clientRows.length; j++) {
    if (String(clientRows[j][0]).trim() === enrollmentId) {
      clientRowIndex = j + 1;
      preferredMethod = String(clientRows[j][6] || "email")
        .trim()
        .toLowerCase();
      totpSecret = String(clientRows[j][7] || "").trim();
      var joinStatusVal = "Pending Confirmation";
      var enrollSheetForStatus = getSheetSafe(spreadsheet, "Program Enrollments");
      if (enrollSheetForStatus) {
        var enrollRowsForStatus = enrollSheetForStatus.getDataRange().getValues();
        var enrollHeadersForStatus = enrollRowsForStatus[0];
        var idIdxForStatus = -1,
          statusIdxForStatus = -1;
        for (var h = 0; h < enrollHeadersForStatus.length; h++) {
          var hName = String(enrollHeadersForStatus[h]).trim().toLowerCase();
          if (hName === "enrollment id" || hName === "enrollmentid") idIdxForStatus = h;
          if (
            hName === "joining status" ||
            hName === "joiningstatus" ||
            hName === "status" ||
            hName === "lead status"
          )
            statusIdxForStatus = h;
        }
        if (idIdxForStatus !== -1 && statusIdxForStatus !== -1) {
          for (var r = 1; r < enrollRowsForStatus.length; r++) {
            if (String(enrollRowsForStatus[r][idIdxForStatus]).trim() === enrollmentId) {
              joinStatusVal = String(enrollRowsForStatus[r][statusIdxForStatus]).trim();
              break;
            }
          }
        }
      }

      clientData = {
        enrollmentId: String(clientRows[j][0]).trim(),
        fullName: String(clientRows[j][1]).trim(),
        phone: String(clientRows[j][2]).trim(),
        email: String(clientRows[j][3]).trim(),
        programName: String(clientRows[j][4]).trim(),
        status: joinStatusVal,
      };
      break;
    }
  }

  if (!clientData) {
    var enrollSheet = getSheetSafe(spreadsheet, "Program Enrollments");
    if (enrollSheet) {
      var enrollRows = enrollSheet.getDataRange().getValues();
      var enrollHeaders = enrollRows[0];
      var idIdx = -1,
        nameIdx = -1,
        phoneIdx = -1,
        emailIdx = -1,
        progIdx = -1,
        statusIdx = -1;
      for (var h = 0; h < enrollHeaders.length; h++) {
        var hName = String(enrollHeaders[h]).trim().toLowerCase();
        if (hName === "enrollment id" || hName === "enrollmentid") idIdx = h;
        else if (hName === "fullname") nameIdx = h;
        else if (hName === "phone") phoneIdx = h;
        else if (hName === "email") emailIdx = h;
        else if (hName === "programname") progIdx = h;
        else if (
          hName === "joining status" ||
          hName === "joiningstatus" ||
          hName === "status" ||
          hName === "lead status"
        )
          statusIdx = h;
      }
      if (idIdx !== -1) {
        for (var r = 1; r < enrollRows.length; r++) {
          if (String(enrollRows[r][idIdx]).trim() === enrollmentId) {
            clientData = {
              enrollmentId: enrollmentId,
              fullName: nameIdx !== -1 ? String(enrollRows[r][nameIdx]).trim() : "Client",
              phone: phoneIdx !== -1 ? String(enrollRows[r][phoneIdx]).trim() : "",
              email:
                emailIdx !== -1 ? String(enrollRows[r][emailIdx]).trim() : "client@optivita.com",
              programName:
                progIdx !== -1 ? String(enrollRows[r][progIdx]).trim() : "Optivita Program",
              status:
                statusIdx !== -1 ? String(enrollRows[r][statusIdx]).trim() : "Pending Confirmation",
            };
            break;
          }
        }
      }
    }
  }

  if (!clientData) {
    clientData = {
      enrollmentId: enrollmentId,
      fullName: "Client",
      phone: "",
      email: "client@optivita.com",
      programName: "Optivita Program",
    };
  }

  // Load or initialize failed attempts in OTP Sheet for brute force tracking
  var otpRows = otpSheet.getDataRange().getValues();
  var otpRowIndex = -1;
  var dbOtp = "";
  var dbExpiry = 0;
  var dbAttempts = 0;
  var lastAttemptTime = 0;

  for (var k = 1; k < otpRows.length; k++) {
    if (String(otpRows[k][0]).trim() === enrollmentId) {
      otpRowIndex = k + 1;
      dbOtp = String(otpRows[k][1]).trim();
      dbExpiry = new Date(otpRows[k][3]).getTime();
      dbAttempts = parseInt(otpRows[k][5] || 0, 10);
      lastAttemptTime = otpRows[k][6] ? new Date(otpRows[k][6]).getTime() : 0;
      break;
    }
  }

  var nowTime = new Date().getTime();

  // Brute Force Lock check (15 mins lockout)
  if (dbAttempts >= 5) {
    var lockTimeRemaining = 15 * 60 * 1000 - (nowTime - lastAttemptTime);
    if (lockTimeRemaining > 0) {
      var minutesRemaining = Math.ceil(lockTimeRemaining / (60 * 1000));
      return {
        status: "error",
        message: "Too many attempts. Please wait " + minutesRemaining + " minutes.",
      };
    } else {
      dbAttempts = 0;
      if (otpRowIndex !== -1) {
        otpSheet.getRange(otpRowIndex, 6).setValue(0);
        otpSheet.getRange(otpRowIndex, 7).setValue("");
      }
    }
  }

  var success = false;
  var statusLabel = "Failed OTP";

  // Check standard OTP sheet match first
  var standardOtpMatched = false;
  if (otpRowIndex !== -1 && dbOtp === otpCode) {
    if (nowTime <= dbExpiry) {
      standardOtpMatched = true;
      success = true;
      statusLabel = "Success";
    }
  }

  if (standardOtpMatched) {
    // Verified via standard OTP
  } else if (preferredMethod === "totp" && totpSecret) {
    // Fallback to TOTP if standard OTP didn't match and preferred method is TOTP
    success = verifyTOTP(totpSecret, otpCode, 1);
    statusLabel = success ? "Success" : "Failed Authenticator";
  } else {
    // Verification failed
    if (otpRowIndex !== -1 && nowTime > dbExpiry) {
      logsSheet.appendRow([
        enrollmentId,
        new Date(),
        clientBrowser,
        clientDevice,
        clientIP,
        "Expired OTP",
      ]);
      return { status: "error", code: "OTP_EXPIRED", message: "OTP Expired" };
    }
    success = false;
    statusLabel = "Failed OTP";
  }

  if (success) {
    // If successful standard OTP and preferred method is whatsapp, hit verify-whatsapp-log endpoint
    if (standardOtpMatched && preferredMethod === "whatsapp") {
      var activeBridgeUrl = getWhatsAppBridgeUrl(spreadsheet);
      if (activeBridgeUrl && activeBridgeUrl.indexOf("your-ngrok-url-here") === -1) {
        var verifyLogUrl = activeBridgeUrl.replace("send-whatsapp", "verify-whatsapp-log");
        try {
          UrlFetchApp.fetch(verifyLogUrl, {
            method: "post",
            contentType: "application/json",
            payload: JSON.stringify({ phone: clientData.phone }),
            muteHttpExceptions: true,
          });
        } catch (err) {
          Logger.log("Failed to notify verify log: " + err.toString());
        }
      }
    }

    // Clear pending OTP row if exists
    if (otpRowIndex !== -1) {
      otpSheet.deleteRow(otpRowIndex);
    }
    logsSheet.appendRow([
      enrollmentId,
      new Date(),
      clientBrowser,
      clientDevice,
      clientIP,
      statusLabel,
    ]);
    return {
      status: "success",
      message: "Access Granted.",
      session: clientData,
    };
  } else {
    // Increment failed attempts
    var newAttempts = dbAttempts + 1;
    if (otpRowIndex === -1) {
      // Append a fresh OTP rate limit tracking row if none exists
      otpSheet.appendRow([
        enrollmentId,
        "",
        new Date(),
        new Date(nowTime + 5 * 60 * 1000),
        "false",
        newAttempts,
        new Date(),
        0,
      ]);
    } else {
      otpSheet.getRange(otpRowIndex, 6).setValue(newAttempts);
      otpSheet.getRange(otpRowIndex, 7).setValue(new Date());
    }

    logsSheet.appendRow([
      enrollmentId,
      new Date(),
      clientBrowser,
      clientDevice,
      clientIP,
      statusLabel,
    ]);

    if (newAttempts >= 5) {
      return {
        status: "error",
        code: "TOO_MANY_ATTEMPTS",
        message: "Too many attempts. Please wait 15 minutes.",
      };
    }
    return {
      status: "error",
      code: "INVALID_OTP",
      message: "Invalid OTP",
      attemptsRemaining: 5 - newAttempts,
    };
  }
}

// 4. Update Security Preference & Bind TOTP Secret
function updateSecurityPreference(data) {
  var enrollmentId = String(data.enrollmentId || "").trim();
  var preferredMethod = String(data.preferredMethod || "")
    .trim()
    .toLowerCase();
  var totpSecret = String(data.totpSecret || "").trim();
  var verificationCode = String(data.verificationCode || "").trim(); // used during binding check

  if (!enrollmentId || !preferredMethod) {
    return { status: "error", message: "Missing required parameters." };
  }

  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var clientsSheet = getSheetSafe(spreadsheet, "Clients");
  if (!clientsSheet) {
    return { status: "error", message: "Database connection failed." };
  }

  // If selecting TOTP, enforce code verification before saving secret key!
  if (preferredMethod === "totp" && totpSecret) {
    var valid = verifyTOTP(totpSecret, verificationCode, 1);
    if (!valid) {
      return {
        status: "error",
        message: "Verification code incorrect. Authenticator binding aborted.",
      };
    }
  }

  var rows = clientsSheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === enrollmentId) {
      clientsSheet.getRange(i + 1, 7).setValue(preferredMethod); // Preferred Auth Method
      if (preferredMethod === "totp" && totpSecret) {
        clientsSheet.getRange(i + 1, 8).setValue(totpSecret); // TOTP Secret
      }
      return {
        status: "success",
        message: "Security preferences updated successfully.",
      };
    }
  }

  return { status: "error", message: "Client not found." };
}

// 4b. Redeem Loyalty Points for Reward Action
function redeemReward(data) {
  var enrollmentId = String(data.enrollmentId || "").trim();
  var rewardName = String(data.rewardName || "").trim();
  var pointsRequired = parseInt(data.pointsRequired || 0, 10);

  if (!enrollmentId || !rewardName || !pointsRequired) {
    return { status: "error", message: "Missing required parameters for redemption." };
  }

  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var enrollSheet = getSheetSafe(spreadsheet, "Program Enrollments");
  var ledgerSheet = getSheetSafe(spreadsheet, "Loyalty Ledger");

  if (!enrollSheet || !ledgerSheet) {
    return { status: "error", message: "Database tables missing." };
  }

  // Find the client in Program Enrollments
  var enrollRows = enrollSheet.getDataRange().getValues();
  var enrollHeaders = enrollRows[0];
  var idColIdx = -1,
    pointsColIdx = -1,
    nameColIdx = -1;

  for (var c = 0; c < enrollHeaders.length; c++) {
    var h = String(enrollHeaders[c]).trim().toLowerCase();
    if (h === "enrollment id" || h === "enrollmentid") idColIdx = c;
    else if (h === "loyalty points" || h === "loyaltypoints") pointsColIdx = c;
    else if (h === "fullname") nameColIdx = c;
  }

  if (idColIdx === -1 || pointsColIdx === -1) {
    return { status: "error", message: "Enrollment ID or Loyalty Points column missing." };
  }

  var foundRowIdx = -1;
  var currentPoints = 0;
  var customerName = "Client";

  for (var r = 1; r < enrollRows.length; r++) {
    if (String(enrollRows[r][idColIdx]).trim() === enrollmentId) {
      foundRowIdx = r + 1;
      currentPoints = parseInt(enrollRows[r][pointsColIdx] || 0, 10);
      if (nameColIdx !== -1) {
        customerName = String(enrollRows[r][nameColIdx]).trim();
      }
      break;
    }
  }

  if (foundRowIdx === -1) {
    return { status: "error", message: "Client enrollment record not found." };
  }

  if (currentPoints < pointsRequired) {
    return { status: "error", message: "Insufficient loyalty points. Balance: " + currentPoints };
  }

  var newPoints = currentPoints - pointsRequired;

  // Deduct points in Program Enrollments sheet
  enrollSheet.getRange(foundRowIdx, pointsColIdx + 1).setValue(newPoints);

  // Also try to deduct in Clients sheet if exists there
  var clientsSheet = getSheetSafe(spreadsheet, "Clients");
  if (clientsSheet) {
    var clientRows = clientsSheet.getDataRange().getValues();
    for (var i = 1; i < clientRows.length; i++) {
      if (String(clientRows[i][0]).trim() === enrollmentId) {
        // Col H is index 7 (TOTP Secret), Col E is Program, Col G is preferred method
        break;
      }
    }
  }

  // Append entry to Loyalty Ledger
  var ledgerHeaders = ledgerSheet.getDataRange().getValues()[0];
  var ledgerRow = [];
  var timestampStr = formatTimestamp(new Date());

  for (var l = 0; l < ledgerHeaders.length; l++) {
    var lh = String(ledgerHeaders[l]).trim();
    var lVal = "";
    if (lh === "Timestamp") {
      lVal = timestampStr;
    } else if (lh === "Enrollment ID" || lh === "EnrollmentID") {
      lVal = enrollmentId;
    } else if (lh === "Customer Name" || lh === "CustomerName") {
      lVal = customerName;
    } else if (lh === "Activity") {
      lVal = "Redeemed Reward: " + rewardName;
    } else if (lh === "Points Earned" || lh === "PointsEarned") {
      lVal = 0;
    } else if (lh === "Points Redeemed" || lh === "PointsRedeemed") {
      lVal = pointsRequired;
    } else if (lh === "Current Balance" || lh === "CurrentBalance") {
      lVal = newPoints;
    }
    ledgerRow.push(lVal);
  }

  ledgerSheet.appendRow(ledgerRow);
  SpreadsheetApp.flush();

  return {
    status: "success",
    message: "Reward redeemed successfully.",
    newPoints: newPoints,
  };
}

/* ==========================================
   CRYPTOGRAPHIC TOTP IMPLEMENTATION UTILS 
   ========================================== */

function base32tohex(base32) {
  var base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  var bits = "";
  var hex = "";
  for (var i = 0; i < base32.length; i++) {
    var val = base32chars.indexOf(base32.charAt(i).toUpperCase());
    if (val === -1) continue;
    bits += leftpad(val.toString(2), 5, "0");
  }
  for (var j = 0; j + 4 <= bits.length; j += 4) {
    var chunk = bits.substr(j, 4);
    hex = hex + parseInt(chunk, 2).toString(16);
  }
  return hex;
}

function leftpad(str, len, pad) {
  if (len + 1 >= str.length) {
    str = Array(len + 1 - str.length).join(pad) + str;
  }
  return str;
}

function hexToBytes(hex) {
  var bytes = [];
  for (var c = 0; c < hex.length; c += 2) {
    var val = parseInt(hex.substr(c, 2), 16);
    bytes.push(val > 127 ? val - 256 : val);
  }
  return bytes;
}

function verifyTOTP(secretBase32, code, windowSize) {
  if (!windowSize) windowSize = 1;
  var keyHex = base32tohex(secretBase32);
  var epoch = Math.round(new Date().getTime() / 1000.0);

  for (var i = -windowSize; i <= windowSize; i++) {
    var stepVal = Math.floor(epoch / 30) + i;
    var t = leftpad(stepVal.toString(16), 16, "0");

    var msgBytes = hexToBytes(t);
    var keyBytes = hexToBytes(keyHex);

    var hmac = Utilities.computeHmacSignature(
      Utilities.MacAlgorithm.HMAC_SHA_1,
      msgBytes,
      keyBytes,
    );

    var offset = hmac[hmac.length - 1] & 0xf;
    var binary =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);
    var otp = binary % 1000000;
    var otpStr = leftpad(otp.toString(), 6, "0");

    if (otpStr === code) {
      return true;
    }
  }
  return false;
}

/* ==========================================
   INFORMATION MASKING UTILS 
   ========================================== */

function sendEmailViaProvider(to, subject, htmlBody) {
  if (RESEND_API_KEY) {
    try {
      var url = "https://api.resend.com/emails";
      var options = {
        method: "post",
        contentType: "application/json",
        headers: {
          Authorization: "Bearer " + RESEND_API_KEY,
        },
        payload: JSON.stringify({
          from: "Optivita Support <onboarding@resend.dev>", // Replace onboarding@resend.dev with your verified domain sender in production
          to: [to],
          subject: subject,
          html: htmlBody,
        }),
        muteHttpExceptions: true,
      };

      var response = UrlFetchApp.fetch(url, options);
      var responseCode = response.getResponseCode();
      if (responseCode === 200 || responseCode === 201) {
        return; // Success, exit function
      } else {
        Logger.log(
          "Resend API returned status code " + responseCode + ": " + response.getContentText(),
        );
      }
    } catch (err) {
      Logger.log("Resend API error: " + err.toString());
    }
  }

  // Fallback: Dispatch via Google's native MailApp if Resend fails or is unconfigured
  Logger.log("Dispatching via native Google MailApp to: " + to);
  MailApp.sendEmail({
    to: to,
    subject: subject,
    htmlBody: htmlBody,
  });
}

function maskEmail(email) {
  if (!email || email.indexOf("@") === -1) return "******";
  var parts = email.split("@");
  var name = parts[0];
  var domain = parts[1];
  if (name.length <= 2) return name.charAt(0) + "*****@" + domain;
  return name.slice(0, 2) + "*****" + name.slice(-1) + "@" + domain;
}

function maskPhone(phone) {
  if (!phone) return "******";
  var cleaned = phone.replace(/[^0-9+]/g, "");
  if (cleaned.length < 7) return "******";
  return cleaned.slice(0, 4) + "*******" + cleaned.slice(-3);
}

// 5. Handle WebhookSubmit & Server-side Enrollment ID generation
function handleWebhookSubmit(data) {
  // Obtain script lock to completely prevent duplicate IDs during concurrent writes
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); // Wait up to 30 seconds for locking resource
  } catch (err) {
    return { status: "error", message: "Server is busy. Please try again." };
  }

  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = data.sheetName || "Program Enrollments";
    var sheet = getSheetSafe(spreadsheet, sheetName);
    if (!sheet) {
      sheet =
        getSheetSafe(spreadsheet, "Clients") || getSheetSafe(spreadsheet, "Program Enrollments");
      if (!sheet) {
        return { status: "error", message: "Sheet not found: " + sheetName };
      }
    }

    // Generate unique sequential Enrollment ID server-side ONLY if not already provided by Firestore
    var enrollmentId = String(data["Enrollment ID"] || data["EnrollmentID"] || "").trim();
    var isEnrollment = sheet.getName() === "Program Enrollments" || sheet.getName() === "Clients";
    var allSheets = spreadsheet.getSheets();

    // Check if the received enrollmentId already exists in any sheet in the spreadsheet
    if (isEnrollment && enrollmentId) {
      var idAlreadyExists = false;
      for (var s = 0; s < allSheets.length; s++) {
        var scanSheet = allSheets[s];
        var values = scanSheet.getDataRange().getValues();
        for (var r = 1; r < values.length; r++) {
          for (var c = 0; c < values[r].length; c++) {
            if (String(values[r][c]).trim() === enrollmentId) {
              idAlreadyExists = true;
              break;
            }
          }
          if (idAlreadyExists) break;
        }
        if (idAlreadyExists) break;
      }
      if (idAlreadyExists) {
        Logger.log(
          "Duplicate enrollment ID detected: " +
            enrollmentId +
            ". Discarding and regenerating server-side.",
        );
        enrollmentId = ""; // Force regeneration
      }
    }

    if (isEnrollment && !enrollmentId) {
      var maxId = 1000;

      // Step A: Find the max ID number by scanning every single cell in all sheets
      for (var s = 0; s < allSheets.length; s++) {
        var scanSheet = allSheets[s];
        var values = scanSheet.getDataRange().getValues();
        for (var r = 1; r < values.length; r++) {
          for (var c = 0; c < values[r].length; c++) {
            var val = String(values[r][c]).trim();
            if (val.indexOf("OPT-2026-") === 0) {
              var num = parseInt(val.replace("OPT-2026-", ""), 10);
              if (!isNaN(num) && num > maxId) {
                maxId = num;
              }
            }
          }
        }
      }

      // Step B: Double-check candidate ID uniqueness against all cells in all sheets
      var idExists = true;
      var nextIdNumber = maxId + 1;
      while (idExists) {
        idExists = false;
        var candidateId = "OPT-2026-" + leftpad(nextIdNumber.toString(), 6, "0");
        for (var s = 0; s < allSheets.length; s++) {
          var scanSheet = allSheets[s];
          var values = scanSheet.getDataRange().getValues();
          for (var r = 1; r < values.length; r++) {
            for (var c = 0; c < values[r].length; c++) {
              if (String(values[r][c]).trim() === candidateId) {
                idExists = true;
                nextIdNumber++;
                break;
              }
            }
            if (idExists) break;
          }
          if (idExists) break;
        }
      }
      enrollmentId = "OPT-2026-" + leftpad(nextIdNumber.toString(), 6, "0");
    }

    var now = new Date();
    var timestampStr = formatTimestamp(now);
    var lastCol = sheet.getLastColumn();
    var headers = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];

    // Self-healing headers: dynamically append new fields submitted to the sheets headers row
    for (var key in data) {
      if (key === "action" || key === "sheetName") continue;
      var foundHeader = false;
      for (var hIdx = 0; hIdx < headers.length; hIdx++) {
        if (String(headers[hIdx]).trim().toLowerCase() === key.trim().toLowerCase()) {
          foundHeader = true;
          break;
        }
      }
      if (!foundHeader) {
        var nextColIdx = headers.length + 1;
        sheet
          .getRange(1, nextColIdx)
          .setValue(key)
          .setFontWeight("bold")
          .setBackground("#0f766e")
          .setFontColor("#ffffff");
        headers.push(key);
      }
    }

    var newRow = [];

    for (var c = 0; c < headers.length; c++) {
      var header = String(headers[c]).trim();
      var val = "";

      if (header === "Enrollment ID" || header === "EnrollmentID") {
        val = enrollmentId;
      } else if (header === "Timestamp") {
        val = timestampStr;
      } else if (header === "Lead Status" || header === "LeadStatus") {
        val = "New Lead";
      } else if (header === "Payment Status" || header === "PaymentStatus") {
        val = "Unpaid";
      } else if (header === "Loyalty Points" || header === "LoyaltyPoints") {
        val = 500;
      } else if (header === "Loyalty Tier" || header === "LoyaltyTier") {
        val = "Silver";
      } else if (header === "Referral Code" || header === "ReferralCode") {
        var namePart = String(data.fullName || "GUEST")
          .split(" ")[0]
          .toUpperCase();
        val = "OPT-" + namePart + "-" + Math.floor(1000 + Math.random() * 9000);
      } else if (data.hasOwnProperty(header)) {
        val = data[header];
      } else {
        for (var key in data) {
          if (key.toLowerCase() === header.toLowerCase()) {
            val = data[key];
            break;
          }
        }
      }
      newRow.push(val);
    }

    sheet.appendRow(newRow);

    // Sync with clients portal login sheet if needed
    if (isEnrollment && sheet.getName() !== "Clients") {
      var clientsSheet = getSheetSafe(spreadsheet, "Clients");
      if (clientsSheet) {
        var clientLastCol = clientsSheet.getLastColumn();
        var clientHeaders =
          clientLastCol > 0 ? clientsSheet.getRange(1, 1, 1, clientLastCol).getValues()[0] : [];
        var clientRow = [];
        for (var cl = 0; cl < clientHeaders.length; cl++) {
          var ch = String(clientHeaders[cl]).trim();
          var chVal = "";

          if (ch === "Enrollment ID" || ch === "EnrollmentID") {
            chVal = enrollmentId;
          } else if (ch === "Client Name" || ch === "ClientName" || ch === "fullName") {
            chVal = data.fullName || "";
          } else if (ch === "Mobile Number" || ch === "MobileNumber" || ch === "phone") {
            chVal = data.phone || "";
          } else if (ch === "Email Address" || ch === "EmailAddress" || ch === "email") {
            chVal = data.email || "";
          } else if (ch === "Program" || ch === "programName") {
            chVal = data.programName || "";
          } else if (ch === "Status") {
            chVal = "Active";
          } else if (ch === "Preferred Auth Method" || ch === "PreferredAuthMethod") {
            chVal = "email";
          } else if (ch === "TOTP Secret" || ch === "TOTPSecret") {
            chVal = "";
          }
          clientRow.push(chVal);
        }
        clientsSheet.appendRow(clientRow);
      }

      // Add welcome points to loyalty ledger
      var loyaltySheet = getSheetSafe(spreadsheet, "Loyalty Ledger");
      if (loyaltySheet) {
        var loyaltyLastCol = loyaltySheet.getLastColumn();
        var loyaltyHeaders =
          loyaltyLastCol > 0 && loyaltySheet.getLastRow() > 0
            ? loyaltySheet.getRange(1, 1, 1, loyaltyLastCol).getValues()[0]
            : [];
        var loyaltyRow = [];
        for (var l = 0; l < loyaltyHeaders.length; l++) {
          var lh = String(loyaltyHeaders[l]).trim();
          var lVal = "";
          if (lh === "Timestamp") {
            lVal = timestampStr;
          } else if (lh === "Enrollment ID" || lh === "EnrollmentID") {
            lVal = enrollmentId;
          } else if (lh === "Customer Name" || lh === "CustomerName") {
            lVal = data.fullName || "";
          } else if (lh === "Activity") {
            lVal = "Welcome & Program Enrollment Bonus";
          } else if (lh === "Points Earned" || lh === "PointsEarned") {
            lVal = 500;
          } else if (lh === "Points Redeemed" || lh === "PointsRedeemed") {
            lVal = 0;
          } else if (lh === "Current Balance" || lh === "CurrentBalance") {
            lVal = 500;
          }
          loyaltyRow.push(lVal);
        }
        loyaltySheet.appendRow(loyaltyRow);
      }

      // Add an unpaid invoice
      var invoicesSheet = getSheetSafe(spreadsheet, "Invoices");
      if (invoicesSheet) {
        var invoiceLastCol = invoicesSheet.getLastColumn();
        var invoiceHeaders =
          invoiceLastCol > 0 && invoicesSheet.getLastRow() > 0
            ? invoicesSheet.getRange(1, 1, 1, invoiceLastCol).getValues()[0]
            : [];
        var invoiceRow = [];
        var dateFormatted =
          leftpad(now.getDate().toString(), 2, "0") +
          "-" +
          leftpad((now.getMonth() + 1).toString(), 2, "0") +
          "-" +
          now.getFullYear();
        for (var iv = 0; iv < invoiceHeaders.length; iv++) {
          var ivh = String(invoiceHeaders[iv]).trim();
          var ivVal = "";
          if (ivh === "InvoiceId" || ivh === "Invoice ID") {
            ivVal = "INV-" + Math.floor(100000 + Math.random() * 900000);
          } else if (ivh === "Enrollment ID" || ivh === "EnrollmentID") {
            ivVal = enrollmentId;
          } else if (ivh === "Customer Name" || ivh === "CustomerName") {
            ivVal = data.fullName || "";
          } else if (ivh === "Program Name" || ivh === "ProgramName") {
            ivVal = data.programName || "";
          } else if (ivh === "Amount") {
            ivVal = 299;
          } else if (ivh === "Date") {
            ivVal = dateFormatted;
          } else if (ivh === "Status") {
            ivVal = "Unpaid";
          }
          invoiceRow.push(ivVal);
        }
        invoicesSheet.appendRow(invoiceRow);
      }
    }

    // Force flush writes to disk to persist spreadsheet changes instantly before lock release
    SpreadsheetApp.flush();

    return {
      status: "success",
      message: "Record appended successfully.",
      enrollmentId: enrollmentId,
    };
  } finally {
    // Release the script lock
    lock.releaseLock();
  }
}

// Helper: Format Timestamp to "DD-MM-YYYY | HH:MM:SS"
function formatTimestamp(date) {
  var day = leftpad(date.getDate().toString(), 2, "0");
  var month = leftpad((date.getMonth() + 1).toString(), 2, "0");
  var year = date.getFullYear();
  var hours = leftpad(date.getHours().toString(), 2, "0");
  var minutes = leftpad(date.getMinutes().toString(), 2, "0");
  var seconds = leftpad(date.getSeconds().toString(), 2, "0");
  return day + "-" + month + "-" + year + " | " + hours + ":" + minutes + ":" + seconds;
}

// Built-in test function to verify WhatsApp OTP directly inside Apps Script Editor
function testWhatsAppOTP() {
  var testResult = sendOTP({
    enrollmentId: "OPT-2026-001006",
    method: "whatsapp",
  });
  Logger.log("=== TEST WHATSAPP OTP RESULT ===");
  Logger.log(JSON.stringify(testResult, null, 2));
}

// Handler: Retrieve all sheet tab data as a clean JSON object for CRM / Admin
function handleGetData() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = spreadsheet.getSheets();
  var result = {};

  for (var i = 0; i < sheets.length; i++) {
    var sheet = sheets[i];
    var sheetName = sheet.getName();
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();

    if (lastRow > 1 && lastCol > 0) {
      var data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
      var headers = data[0];
      var rows = [];

      for (var r = 1; r < data.length; r++) {
        var rowObj = {};
        var isEmpty = true;
        for (var c = 0; c < headers.length; c++) {
          var header = String(headers[c]).trim();
          var val = data[r][c];
          if (val !== "" && val !== null && val !== undefined) {
            isEmpty = false;
          }
          if (header) {
            rowObj[header] = val;
          }
        }
        if (!isEmpty) {
          rows.push(rowObj);
        }
      }
      result[sheetName] = rows;
    } else {
      result[sheetName] = [];
    }
  }

  return { status: "success", data: result };
}

// Handler: Update a single record row in Google Sheets permanently by ID
function handleUpdateRecord(data) {
  var sheetName = data.sheetName || "Program Enrollments";
  var id = data.id;
  var fields = data.fields || {};

  if (!id) {
    return { status: "error", message: "Missing record ID for update." };
  }

  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getSheetSafe(spreadsheet, sheetName);
  if (!sheet) {
    return { status: "error", message: "Sheet not found: " + sheetName };
  }

  var values = sheet.getDataRange().getValues();
  if (values.length < 2) {
    return { status: "error", message: "Sheet is empty" };
  }

  var headers = values[0];

  // Find Enrollment ID column dynamically across all headers
  var idColIdx = -1;
  for (var c = 0; c < headers.length; c++) {
    var h = String(headers[c]).trim().toLowerCase();
    if (h === "enrollment id" || h === "enrollmentid" || h === "id") {
      idColIdx = c;
      break;
    }
  }

  // Fallback: If header is not named Enrollment ID, scan row 2 to find which column holds OPT-2026-
  if (idColIdx === -1 && values.length > 1) {
    for (var c = 0; c < values[1].length; c++) {
      if (String(values[1][c]).indexOf("OPT-2026-") !== -1) {
        idColIdx = c;
        break;
      }
    }
  }
  if (idColIdx === -1) idColIdx = 0; // Default fallback

  // Find target row
  var targetRowIdx = -1;
  for (var r = 1; r < values.length; r++) {
    if (String(values[r][idColIdx]).trim() === String(id).trim()) {
      targetRowIdx = r;
      break;
    } else {
      for (var col = 0; col < values[r].length; col++) {
        if (String(values[r][col]).trim() === String(id).trim()) {
          targetRowIdx = r;
          break;
        }
      }
      if (targetRowIdx !== -1) break;
    }
  }

  if (targetRowIdx === -1) {
    return { status: "error", message: "Record ID not found: " + id };
  }

  // Ensure missing header columns exist (e.g. "Joining Status")
  for (var fieldKey in fields) {
    var colIdx = -1;
    for (var c = 0; c < headers.length; c++) {
      if (String(headers[c]).trim().toLowerCase() === fieldKey.trim().toLowerCase()) {
        colIdx = c;
        break;
      }
    }

    // If column doesn't exist in row 1, add it as a new header column!
    if (colIdx === -1) {
      colIdx = headers.length;
      sheet
        .getRange(1, colIdx + 1)
        .setValue(fieldKey)
        .setFontWeight("bold");
      headers.push(fieldKey);
    }

    sheet.getRange(targetRowIdx + 1, colIdx + 1).setValue(fields[fieldKey]);
  }

  // Trigger Referral rewards routine if confirming joining on Program Enrollments sheet
  if (
    sheetName === "Program Enrollments" &&
    (fields["Joining Status"] === "Confirmed" || fields["Lead Status"] === "Enrolled")
  ) {
    try {
      // Reload values to get latest updates
      var latestValues = sheet.getDataRange().getValues();
      var latestHeaders = latestValues[0];

      // Map column indexes case-insensitively
      var colMap = {};
      for (var col = 0; col < latestHeaders.length; col++) {
        colMap[String(latestHeaders[col]).trim().toLowerCase()] = col;
      }

      var refByCodeIdx = colMap["referredbycode"];
      var refProcessedIdx = colMap["referral processed"] || colMap["referralprocessed"];
      var refCodeIdx = colMap["referral code"] || colMap["referralcode"];
      var ptsIdx = colMap["loyalty points"] || colMap["loyaltypoints"];
      var tierIdx = colMap["loyalty tier"] || colMap["loyaltytier"];
      var nameIdx = colMap["fullname"] || colMap["client name"] || colMap["customer name"];
      var idIdxVal = colMap["enrollment id"] || colMap["enrollmentid"] || 0;

      // Ensure Referral Processed column exists in headers, if not, create it
      if (refProcessedIdx === undefined) {
        refProcessedIdx = latestHeaders.length;
        sheet
          .getRange(1, refProcessedIdx + 1)
          .setValue("Referral Processed")
          .setFontWeight("bold")
          .setBackground("#0f766e")
          .setFontColor("#ffffff");
        latestHeaders.push("Referral Processed");
      }

      var clientRow = latestValues[targetRowIdx];
      var refereeId = String(clientRow[idIdxVal]).trim();
      var refereeName =
        nameIdx !== undefined ? String(clientRow[nameIdx]).trim() : "Referee Client";
      var refereeReferredBy =
        refByCodeIdx !== undefined ? String(clientRow[refByCodeIdx]).trim() : "";
      var isProcessed =
        refProcessedIdx !== undefined ? String(clientRow[refProcessedIdx]).trim() : "";

      if (refereeReferredBy && isProcessed !== "true" && isProcessed !== "Confirmed") {
        // Find Referrer row
        var referrerRowIdx = -1;
        if (refCodeIdx !== undefined) {
          for (var rIdx = 1; rIdx < latestValues.length; rIdx++) {
            var dbRefCode = String(latestValues[rIdx][refCodeIdx]).trim();
            if (dbRefCode.toLowerCase() === refereeReferredBy.toLowerCase()) {
              referrerRowIdx = rIdx;
              break;
            }
          }
        }

        if (referrerRowIdx !== -1) {
          var referrerRow = latestValues[referrerRowIdx];
          var referrerId = String(referrerRow[idIdxVal]).trim();
          var referrerName =
            nameIdx !== undefined ? String(referrerRow[nameIdx]).trim() : "Referrer Client";

          var nowTimeStr = formatTimestamp(new Date());

          // Function to determine Tier
          var getPointsTierVal = function (ptsVal) {
            if (ptsVal >= 5000) return "Diamond";
            if (ptsVal >= 2000) return "Platinum";
            if (ptsVal >= 1000) return "Gold";
            if (ptsVal >= 500) return "Silver";
            return "Bronze";
          };

          // 1. Award Referrer +300 points
          if (ptsIdx !== undefined) {
            var refOldPts = parseInt(referrerRow[ptsIdx] || 0, 10);
            var refNewPts = refOldPts + 300;
            sheet.getRange(referrerRowIdx + 1, ptsIdx + 1).setValue(refNewPts);
            if (tierIdx !== undefined) {
              sheet.getRange(referrerRowIdx + 1, tierIdx + 1).setValue(getPointsTierVal(refNewPts));
            }

            // Add Referrer Ledger row
            var ledgerSht = getSheetSafe(spreadsheet, "Loyalty Ledger");
            if (ledgerSht) {
              var ledgerHeaders = ledgerSht.getDataRange().getValues()[0];
              var ledgerRow = [];
              for (var l = 0; l < ledgerHeaders.length; l++) {
                var lh = String(ledgerHeaders[l]).trim();
                var lVal = "";
                if (lh === "Timestamp") {
                  lVal = nowTimeStr;
                } else if (lh === "Enrollment ID" || lh === "EnrollmentID") {
                  lVal = referrerId;
                } else if (lh === "Customer Name" || lh === "CustomerName") {
                  lVal = referrerName;
                } else if (lh === "Activity") {
                  lVal = "Referral Reward: referred " + refereeName;
                } else if (lh === "Points Earned" || lh === "PointsEarned") {
                  lVal = 300;
                } else if (lh === "Points Redeemed" || lh === "PointsRedeemed") {
                  lVal = 0;
                } else if (lh === "Current Balance" || lh === "CurrentBalance") {
                  lVal = refNewPts;
                }
                ledgerRow.push(lVal);
              }
              ledgerSht.appendRow(ledgerRow);
            }
          }

          // 2. Award Referee +100 points
          if (ptsIdx !== undefined) {
            var currentRefereePts = parseInt(
              sheet.getRange(targetRowIdx + 1, ptsIdx + 1).getValue() || 500,
              10,
            );
            var refereeNewPts = currentRefereePts + 100;
            sheet.getRange(targetRowIdx + 1, ptsIdx + 1).setValue(refereeNewPts);
            if (tierIdx !== undefined) {
              sheet
                .getRange(targetRowIdx + 1, tierIdx + 1)
                .setValue(getPointsTierVal(refereeNewPts));
            }

            // Add Referee Ledger row
            var ledgerSht2 = getSheetSafe(spreadsheet, "Loyalty Ledger");
            if (ledgerSht2) {
              var ledgerHeaders2 = ledgerSht2.getDataRange().getValues()[0];
              var ledgerRow2 = [];
              for (var l = 0; l < ledgerHeaders2.length; l++) {
                var lh = String(ledgerHeaders2[l]).trim();
                var lVal = "";
                if (lh === "Timestamp") {
                  lVal = nowTimeStr;
                } else if (lh === "Enrollment ID" || lh === "EnrollmentID") {
                  lVal = refereeId;
                } else if (lh === "Customer Name" || lh === "CustomerName") {
                  lVal = refereeName;
                } else if (lh === "Activity") {
                  lVal = "Referral Welcome Bonus";
                } else if (lh === "Points Earned" || lh === "PointsEarned") {
                  lVal = 100;
                } else if (lh === "Points Redeemed" || lh === "PointsRedeemed") {
                  lVal = 0;
                } else if (lh === "Current Balance" || lh === "CurrentBalance") {
                  lVal = refereeNewPts;
                }
                ledgerRow2.push(lVal);
              }
              ledgerSht2.appendRow(ledgerRow2);
            }
          }

          // 3. Mark Referral Processed as true
          sheet.getRange(targetRowIdx + 1, refProcessedIdx + 1).setValue("true");
        }
      }
    } catch (err) {
      Logger.log("Error in referral reward processing: " + err.toString());
    }
  }

  SpreadsheetApp.flush();
  return { status: "success", message: "Record updated in Google Sheets", id: id };
}
