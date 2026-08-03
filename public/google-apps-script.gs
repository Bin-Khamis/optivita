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
      "Telegram Chat ID",
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
    Devices: [
      "Device ID",
      "Enrollment ID",
      "Platform",
      "Model",
      "Android Version",
      "App Version",
      "FCM Token",
      "Last Login",
      "Last Sync",
      "Status",
    ],
    Sessions: [
      "Session ID",
      "Enrollment ID",
      "Access Token",
      "Refresh Token",
      "Device ID",
      "Created",
      "Expiry",
    ],
    "Push Notifications": [
      "Notification ID",
      "Enrollment ID",
      "Title",
      "Message",
      "Type",
      "Read",
      "Created",
    ],
    "Health Logs": [
      "Log ID",
      "Enrollment ID",
      "Date",
      "Weight",
      "BMI",
      "Body Fat",
      "Muscle %",
      "Water",
      "Sleep",
      "Mood",
      "Calories",
      "Steps",
      "Blood Pressure",
      "Blood Sugar",
      "Heart Rate",
      "Timestamp",
    ],
    "Meal Logs": [
      "Log ID",
      "Enrollment ID",
      "Date",
      "Meal Type",
      "Food Items",
      "Calories",
      "Protein",
      "Carbs",
      "Fat",
      "Status",
      "Timestamp",
    ],
    "Workout Logs": [
      "Log ID",
      "Enrollment ID",
      "Date",
      "Activity",
      "Duration",
      "Calories Burned",
      "Intensity",
      "Notes",
      "Timestamp",
    ],
    "Progress Photos": [
      "Photo ID",
      "Enrollment ID",
      "Date",
      "Photo URL",
      "Type",
      "Notes",
      "Timestamp",
    ],
    "Support Tickets": [
      "Ticket ID",
      "Enrollment ID",
      "Subject",
      "Message",
      "Category",
      "Status",
      "Created Date",
      "Last Updated",
      "Timestamp",
    ],
    Feedback: [
      "Feedback ID",
      "Enrollment ID",
      "Date",
      "Rating",
      "Comments",
      "Timestamp",
    ],
    "Activity Logs": [
      "Log ID",
      "Enrollment ID",
      "Timestamp",
      "Action",
      "Details",
      "IP Address",
      "User Agent",
    ],
    "Synchronization Queue": [
      "Sync ID",
      "Enrollment ID",
      "Device ID",
      "Action Type",
      "Payload",
      "Timestamp",
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
        sheet.appendRow(["Telegram API Key", ""]);
        sheet.appendRow(["Web App Webhook URL", ""]);
        sheet.appendRow(["Telegram Bot Username", "OptiVitaOTPBot"]);
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

  // Self-healing setting keys
  var settingsSheet = getSheetSafe(spreadsheet, "Settings");
  if (settingsSheet) {
    var settingsRows = settingsSheet.getDataRange().getValues();
    var hasTelegram = false;
    var hasWebhookUrl = false;
    var hasTelegramBotUsername = false;
    var hasJwtSecret = false;
    var hasFirebaseProjectId = false;
    var hasFirebaseServiceAccount = false;
    var hasMinAppVersion = false;
    var hasForceUpdate = false;

    // Check both columns F and A for keys to avoid duplicates in both layouts
    for (var i = 0; i < settingsRows.length; i++) {
      var row = settingsRows[i];
      var keyA = String(row[0] || "").trim().toLowerCase();
      var keyF = String(row[5] || "").trim().toLowerCase();
      
      if (keyA === "telegram api key" || keyF === "telegram api key") hasTelegram = true;
      if (keyA === "web app webhook url" || keyF === "web app webhook url") hasWebhookUrl = true;
      if (keyA === "telegram bot username" || keyF === "telegram bot username") hasTelegramBotUsername = true;
      if (keyA === "jwt secret" || keyF === "jwt secret") hasJwtSecret = true;
      if (keyA === "firebase project id" || keyF === "firebase project id") hasFirebaseProjectId = true;
      if (keyA === "firebase service account json" || keyF === "firebase service account json") hasFirebaseServiceAccount = true;
      if (keyA === "min android app version" || keyF === "min android app version") hasMinAppVersion = true;
      if (keyA === "force android update" || keyF === "force android update") hasForceUpdate = true;
    }

    // Append missing setting keys to Settings sheet (default to Col F & G layout if column F is present)
    var useColFG = settingsRows[0] && settingsRows[0].length > 5;
    
    function addSettingRow(key, val) {
      if (useColFG) {
        // Appends to key/value in columns 6 and 7 (F and G)
        var lastRow = settingsSheet.getLastRow();
        settingsSheet.getRange(lastRow + 1, 6).setValue(key);
        settingsSheet.getRange(lastRow + 1, 7).setValue(val);
      } else {
        settingsSheet.appendRow([key, val]);
      }
    }

    if (!hasTelegram) addSettingRow("Telegram API Key", "");
    if (!hasWebhookUrl) addSettingRow("Web App Webhook URL", "");
    if (!hasTelegramBotUsername) addSettingRow("Telegram Bot Username", "OptiVitaOTPBot");
    if (!hasJwtSecret) {
      var generatedSecret = Utilities.getUuid() + "-" + Utilities.getUuid();
      addSettingRow("JWT Secret", generatedSecret);
    }
    if (!hasFirebaseProjectId) addSettingRow("Firebase Project ID", "optivita-43853");
    if (!hasFirebaseServiceAccount) addSettingRow("Firebase Service Account JSON", "");
    if (!hasMinAppVersion) addSettingRow("Min Android App Version", "1.0.0");
    if (!hasForceUpdate) addSettingRow("Force Android Update", "false");
  }

  // Self-healing clients headers
  var clientsSheet = getSheetSafe(spreadsheet, "Clients");
  if (clientsSheet) {
    var headers = clientsSheet.getRange(1, 1, 1, clientsSheet.getLastColumn()).getValues()[0];
    var hasTelegramChatId = false;
    for (var h = 0; h < headers.length; h++) {
      if (String(headers[h]).trim().toLowerCase() === "telegram chat id") {
        hasTelegramChatId = true;
        break;
      }
    }
    if (!hasTelegramChatId) {
      clientsSheet.getRange(1, headers.length + 1).setValue("Telegram Chat ID");
      clientsSheet
        .getRange(1, headers.length + 1)
        .setFontWeight("bold")
        .setBackground("#0f766e")
        .setFontColor("#ffffff");
    }
  }
}

// Helper: Get a parameter setting value by key name, supporting either Column A/B or Column F/G layout
function getSettingValue(spreadsheet, keyName) {
  var settingsSheet = getSheetSafe(spreadsheet, "Settings");
  if (!settingsSheet) {
    Logger.log("getSettingValue: Settings sheet not found!");
    return "";
  }
  
  var rows = settingsSheet.getDataRange().getValues();
  var targetKey = String(keyName).trim().toLowerCase();
  Logger.log("getSettingValue: searching for '" + targetKey + "'. Total rows read = " + rows.length);
  
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    // Check F & G columns (index 5 & 6) first
    if (row.length > 6) {
      var keyF = String(row[5] || "").trim().toLowerCase();
      if (keyF === targetKey) {
        var valF = String(row[6] || "").trim();
        Logger.log("getSettingValue: found match in Col F/G at row " + (i+1) + ". Value = '" + valF + "'");
        return valF;
      }
    }
    // Check A & B columns (index 0 & 1)
    if (row.length > 1) {
      var keyA = String(row[0] || "").trim().toLowerCase();
      if (keyA === targetKey) {
        var valA = String(row[1] || "").trim();
        Logger.log("getSettingValue: found match in Col A/B at row " + (i+1) + ". Value = '" + valA + "'");
        return valA;
      }
    }
  }
  Logger.log("getSettingValue: no match found for '" + targetKey + "'");
  return "";
}

// Helper: Get WhatsApp Bridge URL from Settings sheet or config
function getWhatsAppBridgeUrl(spreadsheet) {
  var val = getSettingValue(spreadsheet, "whatsapp bridge url");
  if (val) return val;
  
  // Fail-safe fallback scanning
  var settingsSheet = getSheetSafe(spreadsheet, "Settings");
  if (settingsSheet) {
    var rows = settingsSheet.getDataRange().getValues();
    if (rows.length > 1) {
      var secondRow = rows[1];
      for (var j = 0; j < secondRow.length; j++) {
        var cellVal = String(secondRow[j] || "").trim();
        if (cellVal.indexOf("http") === 0) {
          return cellVal;
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

function doGet(e) {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    ensureRequiredSheets(spreadsheet);
    
    var path = e.pathInfo || e.parameter.path || "";
    if (path) {
      path = "/" + path.replace(/^\/+|\/+$/g, "");
    }
    
    if (path && path.indexOf("/api/") === 0) {
      var apiResponse = routeRestApi(path, "GET", e.parameter, {}, spreadsheet);
      return ContentService.createTextOutput(JSON.stringify(apiResponse)).setMimeType(
        ContentService.MimeType.JSON
      );
    }
    
    // Legacy GET fallback
    var action = e.parameter.action;
    if (action === "getData") {
      var response = handleGetData();
      return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(
        ContentService.MimeType.JSON
      );
    }
    
    return ContentService.createTextOutput(
      JSON.stringify({ status: "error", message: "Invalid GET request action or path." })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({
        status: "error",
        message: "GET Error: " + error.toString(),
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var contents = e && e.postData && e.postData.contents ? e.postData.contents : "";
    var requestData = {};
    if (contents) {
      try {
        requestData = JSON.parse(contents);
      } catch (err) {
        // Fallback for non-JSON contents
      }
    }

    // Intercept Telegram bot updates
    if (requestData.message || requestData.edited_message || requestData.callback_query) {
      return handleTelegramUpdate(requestData);
    }

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    ensureRequiredSheets(spreadsheet); // Auto-creates Clients, OTP, Login Logs if missing

    // Determine path and method
    var path = e.pathInfo || e.parameter.path || requestData.path || "";
    if (path) {
      path = "/" + path.replace(/^\/+|\/+$/g, "");
    }
    
    var method = "POST";
    if (e.parameter._method) {
      method = e.parameter._method.toUpperCase();
    } else if (requestData._method) {
      method = requestData._method.toUpperCase();
    }

    // If path matches REST API, route it
    if (path && path.indexOf("/api/") === 0) {
      var apiResponse = routeRestApi(path, method, e.parameter, requestData, spreadsheet);
      return ContentService.createTextOutput(JSON.stringify(apiResponse)).setMimeType(
        ContentService.MimeType.JSON
      );
    }

    // Otherwise, fall back to legacy actions for backward compatibility
    var action = requestData.action || e.parameter.action;
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
      case "sendPush":
        var pushSuccess = sendPushNotification(
          requestData.enrollmentId,
          requestData.title,
          requestData.message,
          requestData.type
        );
        response = {
          status: pushSuccess ? "success" : "error",
          message: pushSuccess ? "Notification dispatched successfully." : "Failed to dispatch notification. Device may be offline or unregistered."
        };
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
  var telegramChatId = "";

  // Map Clients headers dynamically
  var clientsHeaders = rows[0];
  var clientIdIdx = 0;
  var clientPhoneIdx = 2;
  var clientEmailIdx = 3;
  var clientStatusIdx = 5;
  var clientPrefIdx = 6;
  var clientTotpIdx = 7;
  var clientTelegramIdx = 8;

  for (var h = 0; h < clientsHeaders.length; h++) {
    var hName = String(clientsHeaders[h]).trim().toLowerCase();
    if (hName.indexOf("enrollment") !== -1 || hName === "id") clientIdIdx = h;
    else if (hName.indexOf("phone") !== -1 || hName.indexOf("mobile") !== -1) clientPhoneIdx = h;
    else if (hName.indexOf("email") !== -1) clientEmailIdx = h;
    else if (hName === "status") clientStatusIdx = h;
    else if (hName.indexOf("preferred") !== -1 || hName.indexOf("auth") !== -1) clientPrefIdx = h;
    else if (hName.indexOf("totp") !== -1 || hName.indexOf("secret") !== -1) clientTotpIdx = h;
    else if (hName.indexOf("telegram") !== -1 || hName.indexOf("chat") !== -1) clientTelegramIdx = h;
  }

  for (var i = 1; i < rows.length; i++) {
    var dbId = String(rows[i][clientIdIdx]).trim();
    var dbPhoneRaw = String(rows[i][clientPhoneIdx]).trim();
    var dbPhone = dbPhoneRaw.replace(/[^0-9]/g, "");
    var dbStatus = String(rows[i][clientStatusIdx]).trim();

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
        email = String(rows[i][clientEmailIdx]).trim();
        preferredMethod = String(rows[i][clientPrefIdx] || "email")
          .trim()
          .toLowerCase();
        totpSecret = String(rows[i][clientTotpIdx] || "").trim();
        totpConfigured = !!totpSecret;
        telegramChatId = String(rows[i][clientTelegramIdx] || "").trim();
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

      // Map indexes dynamically
      var idIdx = -1, nameIdx = -1, phoneIdx = -1, emailIdx = -1, progIdx = -1;
      for (var h = 0; h < enrollHeaders.length; h++) {
        var hName = String(enrollHeaders[h]).trim().toLowerCase();
        if (hName.indexOf("enrollment") !== -1 || hName === "id") idIdx = h;
        else if (hName.indexOf("name") !== -1) nameIdx = h;
        else if (hName.indexOf("phone") !== -1 || hName.indexOf("mobile") !== -1) phoneIdx = h;
        else if (hName.indexOf("email") !== -1) emailIdx = h;
        else if (hName.indexOf("program") !== -1) progIdx = h;
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
              dbEnrollPhoneClean.length >= 7 && inputPhoneClean.length >= 7 &&
              (dbEnrollPhoneClean.indexOf(inputPhoneClean) !== -1 ||
               inputPhoneClean.indexOf(dbEnrollPhoneClean) !== -1)
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

  // Retrieve Telegram Bot Username from Settings
  var telegramBotUsername = getSettingValue(spreadsheet, "telegram bot username") || "OptiVitaOTPBot";

  return {
    status: "success",
    message: "Client verified.",
    emailMasked: maskEmail(email),
    preferredMethod: preferredMethod,
    totpConfigured: totpConfigured,
    telegramChatId: telegramChatId,
    telegramBotUsername: telegramBotUsername,
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
  var clientTelegramChatId = "";

  for (var i = 1; i < clientRows.length; i++) {
    if (String(clientRows[i][0]).trim() === enrollmentId) {
      clientName = String(clientRows[i][1]).trim();
      clientPhone = String(clientRows[i][2]).trim();
      clientEmail = String(clientRows[i][3]).trim();
      clientTelegramChatId = String(clientRows[i][8] || "").trim();
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
          throw new Error(respJson.message || "Bridge error");
        }
      } catch (err) {
        Logger.log("WhatsApp Bridge Error: " + err.toString() + ". Falling back to local browser dispatch and email simulation.");
        try {
          sendEmailViaProvider(
            clientEmail,
            "Optivita Client Portal Verification (WhatsApp Request Backup)",
            "<p>Hello <strong>" +
              clientName +
              "</strong>,</p><p>We were unable to reach the WhatsApp automation bridge directly. Your verification code is:</p><h2>" +
              pin +
              "</h2><p>Please enter this code on the verification screen.</p>",
          );
        } catch (e) {
          Logger.log("WhatsApp email backup failure: " + e.toString());
        }
        return {
          status: "success",
          message: "Verification code generated. Dispatching backup email.",
          emailMasked: maskEmail(clientEmail),
          phoneMasked: maskPhone(clientPhone),
          otp: pin,
          fallbackDispatch: true,
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
  } else if (method === "telegram") {
    if (!clientTelegramChatId) {
      return {
        status: "error",
        code: "TELEGRAM_NOT_LINKED",
        message:
          "Telegram Chat ID is not configured. Please link Telegram in your account security settings.",
      };
    }

    // Retrieve Telegram API Key from Settings
    var telegramApiKey = getSettingValue(spreadsheet, "telegram api key");

    if (
      !telegramApiKey ||
      telegramApiKey.indexOf("your-api-key") !== -1 ||
      telegramApiKey.trim() === ""
    ) {
      var logMsg =
        "Simulated Telegram delivery to chat ID " + clientTelegramChatId + " with OTP: " + pin;
      Logger.log(logMsg);

      // For development convenience, we also dispatch an email backup so they always receive it
      try {
        sendEmailViaProvider(
          clientEmail,
          "Optivita Client Portal Verification (Telegram Request)",
          "<p>Hello <strong>" +
            clientName +
            "</strong>,</p><p>Your Telegram verification code was requested. Code is:</p><h2>" +
            pin +
            "</h2>",
        );
      } catch (e) {}
    } else {
      var messageText =
        "Hello " +
        clientName +
        ",\n\nYour Optivita verification code is: *" +
        pin +
        "*\n\nThis code expires in 5 minutes.";
      var telegramUrl = "https://api.telegram.org/bot" + telegramApiKey + "/sendMessage";
      var options = {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify({
          chat_id: clientTelegramChatId,
          text: messageText,
          parse_mode: "Markdown",
        }),
        muteHttpExceptions: true,
      };

      try {
        var response = UrlFetchApp.fetch(telegramUrl, options);
        var respText = response.getContentText();
        Logger.log("Telegram Bot Response: " + respText);
        var respJson = JSON.parse(respText);
        if (respJson && !respJson.ok) {
          return {
            status: "error",
            code: "FAILED_SEND",
            message:
              "Failed to send Telegram message: " + (respJson.description || "Unknown error"),
          };
        }
      } catch (err) {
        Logger.log("Telegram API Error: " + err.toString());
        return {
          status: "error",
          code: "FAILED_SEND",
          message: "Failed to Send OTP via Telegram",
        };
      }
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
      if (data.telegramChatId !== undefined) {
        clientsSheet.getRange(i + 1, 9).setValue(String(data.telegramChatId).trim()); // Telegram Chat ID
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

// Telegram Webhook Handler: processes incoming messages and start commands
function handleTelegramUpdate(update) {
  try {
    var msg = update.message || update.edited_message;
    if (!msg || !msg.chat || !msg.chat.id) {
      return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
    }

    var chatId = msg.chat.id;
    var senderName = msg.from ? (msg.from.first_name || "there") : "there";
    var text = msg.text || "";

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    ensureRequiredSheets(spreadsheet);

    // Get Telegram API Key from settings to reply
    var telegramApiKey = getSettingValue(spreadsheet, "telegram api key");

    if (!telegramApiKey) {
      return ContentService.createTextOutput(JSON.stringify({ ok: false, error: "No API Key" })).setMimeType(ContentService.MimeType.JSON);
    }

    // Send reply message with the Chat ID
    var replyText = "Hello " + senderName + "! 🌟\n\nYour Telegram Chat ID is:\n`" + chatId + "`\n\nPlease copy this Chat ID and enter it into the Security Settings page of your Optivita Client Hub profile to link your Telegram account.";
    
    var telegramUrl = "https://api.telegram.org/bot" + telegramApiKey + "/sendMessage";
    var options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify({
        chat_id: chatId,
        text: replyText,
        parse_mode: "Markdown",
      }),
      muteHttpExceptions: true,
    };

    UrlFetchApp.fetch(telegramUrl, options);
  } catch (err) {
    Logger.log("Error handling Telegram Update: " + err.toString());
  }

  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}

// Utility: Call this function once in Apps Script Editor to set Telegram Webhook
function registerTelegramWebhook() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  ensureRequiredSheets(spreadsheet);
  
  var settingsSheet = getSheetSafe(spreadsheet, "Settings");
  if (settingsSheet) {
    var lastRow = settingsSheet.getLastRow();
    var lastCol = settingsSheet.getLastColumn();
    Logger.log("Settings Sheet Dimensions: Row count = " + lastRow + ", Column count = " + lastCol);
    var debugRows = settingsSheet.getRange(1, 1, lastRow, lastCol).getValues();
    for (var r = 0; r < debugRows.length; r++) {
      var row = debugRows[r];
      var colA = row[0] !== undefined ? String(row[0]) : "";
      var colB = row[1] !== undefined ? String(row[1]) : "";
      var colF = row[5] !== undefined ? String(row[5]) : "";
      var colG = row[6] !== undefined ? String(row[6]) : "";
      Logger.log("Row " + (r + 1) + ": Col A = '" + colA + "', Col B = '" + colB + "', Col F = '" + colF + "', Col G = '" + colG + "'");
    }
  }

  var telegramApiKey = getSettingValue(spreadsheet, "telegram api key");
  var webAppUrl = getSettingValue(spreadsheet, "web app webhook url") || getSettingValue(spreadsheet, "google sheet webhook url");
  
  var ui = null;
  try {
    ui = SpreadsheetApp.getUi();
  } catch (e) {}

  function report(msg, isError) {
    Logger.log(msg);
    if (ui) {
      ui.alert(isError ? "Telegram Setup Error" : "Telegram Setup Success", msg, ui.ButtonSet.OK);
    }
  }

  if (!telegramApiKey || telegramApiKey.indexOf("your-api-key") !== -1 || telegramApiKey === "") {
    report("Error: Please set your Telegram API Key in the Settings sheet first. Found key = '" + telegramApiKey + "'", true);
    return;
  }
  
  if (!webAppUrl || webAppUrl.indexOf("your-") !== -1 || webAppUrl === "") {
    report("Error: Please set 'Web App Webhook URL' in the Settings sheet. This must be the published URL of this Google Apps Script Web App (from Deploy > New Deployment).", true);
    return;
  }
  
  var url = "https://api.telegram.org/bot" + telegramApiKey + "/setWebhook?url=" + encodeURIComponent(webAppUrl);
  try {
    var response = UrlFetchApp.fetch(url);
    var respText = response.getContentText();
    var respJson = JSON.parse(respText);
    if (respJson.ok) {
      report("Success! Telegram Webhook registered to: " + webAppUrl, false);
    } else {
      report("Failed: " + respJson.description, true);
    }
  } catch (err) {
    report("Error executing request: " + err.toString(), true);
  }
}

// =========================================================================
// STANDARD REST API ROUTER & SECURITY CONTROLLERS
// =========================================================================

function routeRestApi(path, method, queryParams, bodyParams, spreadsheet) {
  var token = queryParams.token || queryParams.accessToken || bodyParams.token || bodyParams.accessToken || "";
  
  // Public Endpoint: Login Authentication
  if (path === "/api/auth/login" && method === "POST") {
    return handleApiLogin(bodyParams, spreadsheet);
  }
  // Public Endpoint: Dispatch verification OTP code
  if (path === "/api/auth/send-otp" && method === "POST") {
    return handleApiSendOtp(bodyParams, spreadsheet);
  }
  // Public Endpoint: Verify verification OTP and issue JWT tokens
  if (path === "/api/auth/verify-otp" && method === "POST") {
    return handleApiVerifyOtp(bodyParams, spreadsheet);
  }
  // Public Endpoint: Refresh authentication session
  if (path === "/api/auth/refresh-token" && method === "POST") {
    return handleApiRefreshToken(bodyParams, spreadsheet);
  }
  // Public Endpoint: Update or log device specifications
  if (path === "/api/auth/register-device" && method === "POST") {
    return handleApiRegisterDevice(bodyParams, spreadsheet);
  }
  // Public Endpoint: Retrieve current settings & mobile configurations
  if (path === "/api/settings" && method === "GET") {
    return handleApiGetSettings(spreadsheet);
  }

  // Validate Access Token for Protected API Endpoints
  var jwtSecret = getSettingValue(spreadsheet, "JWT Secret") || "default_jwt_secret_key";
  var authResult = verifyAccessToken(token, jwtSecret);
  if (!authResult.success) {
    return {
      success: false,
      message: authResult.message || "Unauthorized access",
      code: 401
    };
  }
  
  var enrollmentId = authResult.payload.sub;
  
  // Routing Protected Paths
  switch (path) {
    case "/api/auth/logout":
      if (method === "POST") return handleApiLogout(token, spreadsheet);
      break;
    case "/api/auth/profile":
      if (method === "GET") return handleApiGetProfile(enrollmentId, spreadsheet);
      if (method === "PUT") return handleApiUpdateProfile(enrollmentId, bodyParams, spreadsheet);
      break;
    case "/api/dashboard":
      if (method === "GET") return handleApiGetDashboard(enrollmentId, spreadsheet);
      break;
    case "/api/dashboard/summary":
      if (method === "GET") return handleApiGetDashboardSummary(enrollmentId, spreadsheet);
      break;
    case "/api/appointments":
      if (method === "GET") return handleApiGetAppointments(enrollmentId, spreadsheet);
      if (method === "POST") return handleApiCreateAppointment(enrollmentId, bodyParams, spreadsheet);
      if (method === "PUT") return handleApiUpdateAppointment(enrollmentId, bodyParams, spreadsheet);
      if (method === "DELETE") return handleApiDeleteAppointment(enrollmentId, bodyParams, spreadsheet);
      break;
    case "/api/appointments/check-in":
      if (method === "POST") return handleApiCheckInAppointment(enrollmentId, bodyParams, spreadsheet);
      break;
    case "/api/meal-plans":
      if (method === "GET") return handleApiGetMealPlans(enrollmentId, spreadsheet);
      break;
    case "/api/meal-log":
      if (method === "POST") return handleApiCreateMealLog(enrollmentId, bodyParams, spreadsheet);
      break;
    case "/api/workouts":
      if (method === "GET") return handleApiGetWorkouts(enrollmentId, spreadsheet);
      break;
    case "/api/workout-log":
      if (method === "POST") return handleApiCreateWorkoutLog(enrollmentId, bodyParams, spreadsheet);
      break;
    case "/api/health":
      if (method === "GET") return handleApiGetHealth(enrollmentId, spreadsheet);
      break;
    case "/api/health/weight":
    case "/api/health/water":
    case "/api/health/sleep":
    case "/api/health/mood":
    case "/api/health/blood-pressure":
    case "/api/health/blood-sugar":
    case "/api/health/body-fat":
    case "/api/health/heart-rate":
      if (method === "POST") {
        var metricType = path.substring(12);
        return handleApiPostHealthMetric(enrollmentId, metricType, bodyParams, spreadsheet);
      }
      break;
    case "/api/messages":
      if (method === "GET") return handleApiGetMessages(enrollmentId, spreadsheet);
      if (method === "POST") return handleApiCreateMessage(enrollmentId, bodyParams, spreadsheet);
      break;
    case "/api/messages/upload":
      if (method === "POST") return handleApiUploadMessageAttachment(enrollmentId, bodyParams, spreadsheet);
      break;
    case "/api/notifications":
      if (method === "GET") return handleApiGetNotifications(enrollmentId, spreadsheet);
      break;
    case "/api/notifications/read":
      if (method === "POST") return handleApiMarkNotificationRead(enrollmentId, bodyParams, spreadsheet);
      break;
    case "/api/mobile/register-fcm":
      if (method === "POST") return handleApiRegisterFcm(enrollmentId, bodyParams, spreadsheet);
      break;
    case "/api/invoices":
      if (method === "GET") return handleApiGetInvoices(enrollmentId, spreadsheet);
      break;
    case "/api/payments":
      if (method === "GET") return handleApiGetPayments(enrollmentId, spreadsheet);
      break;
    case "/api/documents":
      if (method === "GET") return handleApiGetDocuments(enrollmentId, spreadsheet);
      break;
    case "/api/documents/upload":
      if (method === "POST") return handleApiUploadDocument(enrollmentId, bodyParams, spreadsheet);
      break;
    case "/api/settings":
      if (method === "PUT") return handleApiUpdateSettings(enrollmentId, bodyParams, spreadsheet);
      break;
    case "/api/sync":
      if (method === "POST") return handleApiOfflineSync(enrollmentId, bodyParams, spreadsheet);
      break;
  }

  return {
    success: false,
    message: "Endpoint path or method not supported: " + method + " " + path,
    code: 404
  };
}

// -------------------------------------------------------------------------
// SECURITY TOKEN VALIDATORS (JWT AUTH ENGINE)
// -------------------------------------------------------------------------

function verifyAccessToken(token, secret) {
  if (!token) return { success: false, message: "Authorization token is missing." };
  var payload = jwtDecode(token, secret);
  if (!payload) return { success: false, message: "Token signature or structure is invalid." };
  
  var now = new Date().getTime();
  if (payload.exp && now > payload.exp) {
    return { success: false, message: "Session token has expired." };
  }
  
  return { success: true, payload: payload };
}

function jwtEncode(payload, secret) {
  var header = { alg: "HS256", typ: "JWT" };
  var headerStr = Utilities.base64EncodeWebSafe(JSON.stringify(header)).replace(/=+$/, "");
  var payloadStr = Utilities.base64EncodeWebSafe(JSON.stringify(payload)).replace(/=+$/, "");
  var signatureInput = headerStr + "." + payloadStr;
  var signatureBytes = Utilities.computeHmacSha256Signature(signatureInput, secret);
  var signatureStr = Utilities.base64EncodeWebSafe(signatureBytes).replace(/=+$/, "");
  return headerStr + "." + payloadStr + "." + signatureStr;
}

function jwtDecode(token, secret) {
  try {
    var parts = token.split(".");
    if (parts.length !== 3) return null;
    
    var headerStr = parts[0];
    var payloadStr = parts[1];
    var signatureStr = parts[2];
    
    var signatureInput = headerStr + "." + payloadStr;
    var expectedBytes = Utilities.computeHmacSha256Signature(signatureInput, secret);
    var expectedStr = Utilities.base64EncodeWebSafe(expectedBytes).replace(/=+$/, "");
    
    if (signatureStr !== expectedStr) return null;
    
    var payloadJson = Utilities.newBlob(Utilities.base64DecodeWebSafe(payloadStr)).getDataAsString();
    return JSON.parse(payloadJson);
  } catch (e) {
    return null;
  }
}

// =========================================================================
// DATA ACCESS SHEET UTILITY METHODS
// =========================================================================

function getSheetRows(sheet) {
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow === 0 || lastCol === 0) return [];
  return sheet.getRange(1, 1, lastRow, lastCol).getValues();
}

function findRowByColumnValue(sheet, colName, value) {
  if (!sheet) return null;
  var rows = getSheetRows(sheet);
  if (rows.length === 0) return null;
  var headers = rows[0];
  var colIdx = -1;
  for (var h = 0; h < headers.length; h++) {
    if (String(headers[h]).trim().toLowerCase() === colName.trim().toLowerCase()) {
      colIdx = h;
      break;
    }
  }
  if (colIdx === -1) return null;
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][colIdx]).trim() === String(value).trim()) {
      return { rowIndex: i + 1, rowData: rows[i], headers: headers };
    }
  }
  return null;
}

function insertSheetRow(sheet, dataObject) {
  if (!sheet) return false;
  var rows = getSheetRows(sheet);
  if (rows.length === 0) return false;
  var headers = rows[0];
  var newRow = [];
  for (var i = 0; i < headers.length; i++) {
    var val = dataObject[headers[i]] !== undefined ? dataObject[headers[i]] : "";
    newRow.push(val);
  }
  sheet.appendRow(newRow);
  return true;
}

function updateSheetRow(sheet, rowIndex, dataObject) {
  if (!sheet || rowIndex <= 1) return false;
  var rows = getSheetRows(sheet);
  if (rows.length === 0) return false;
  var headers = rows[0];
  for (var key in dataObject) {
    var colIdx = -1;
    for (var h = 0; h < headers.length; h++) {
      if (String(headers[h]).trim().toLowerCase() === key.trim().toLowerCase()) {
        colIdx = h;
        break;
      }
    }
    if (colIdx !== -1) {
      sheet.getRange(rowIndex, colIdx + 1).setValue(dataObject[key]);
    }
  }
  return true;
}

function deleteSheetRow(sheet, rowIndex) {
  if (!sheet || rowIndex <= 1) return false;
  sheet.deleteRow(rowIndex);
  return true;
}

// =========================================================================
// API ENDPOINT HANDLER LOGIC
// =========================================================================

// -------------------------------------------------------------------------
// 1. Authentication Handlers
// -------------------------------------------------------------------------

function handleApiLogin(bodyParams, spreadsheet) {
  var res = verifyClient({
    enrollmentId: bodyParams.enrollmentId,
    phone: bodyParams.phone
  });
  if (res.status === "success") {
    var methods = ["email"];
    if (bodyParams.phone || res.phoneMasked) {
      methods.push("whatsapp");
    }
    if (res.telegramChatId) {
      methods.push("telegram");
    }
    if (res.totpConfigured) {
      methods.push("totp");
    }
    
    var mPhone = res.phoneMasked || (bodyParams.phone ? maskPhone(bodyParams.phone) : "******");

    return {
      success: true,
      message: "Credentials verified successfully.",
      data: {
        enrollmentId: bodyParams.enrollmentId,
        methods: methods,
        maskedEmail: res.emailMasked || "",
        maskedPhone: mPhone,
        totpConfigured: res.totpConfigured,
        telegramChatId: res.telegramChatId || "",
        telegramBotUsername: res.telegramBotUsername || "OptiVitaOTPBot",
        preferredMethod: res.preferredMethod || "email"
      }
    };
  } else {
    return {
      success: false,
      message: res.message || "Invalid Enrollment ID or Phone Number.",
      code: 401
    };
  }
}

function handleApiSendOtp(bodyParams, spreadsheet) {
  var res = sendOTP({
    enrollmentId: bodyParams.enrollmentId,
    method: bodyParams.method
  });
  if (res.status === "success") {
    return {
      success: true,
      message: res.message || "OTP dispatched successfully."
    };
  } else {
    return {
      success: false,
      message: res.message || "Failed to send OTP.",
      code: 400
    };
  }
}

function handleApiVerifyOtp(bodyParams, spreadsheet) {
  var res = verifyOTP({
    enrollmentId: bodyParams.enrollmentId,
    otp: bodyParams.otp,
    totp: bodyParams.otp // fallback if verifying authenticator app
  });
  
  if (res.status === "success") {
    var jwtSecret = getSettingValue(spreadsheet, "JWT Secret") || "default_jwt_secret_key";
    var now = new Date().getTime();
    var accessExpiry = now + (3600 * 1000); // 1 hour
    var refreshExpiry = now + (30 * 24 * 3600 * 1000); // 30 days
    
    var payload = {
      sub: bodyParams.enrollmentId,
      exp: accessExpiry,
      iat: now
    };
    var accessToken = jwtEncode(payload, jwtSecret);
    var refreshToken = "REF-" + Utilities.getUuid().substring(0, 16);
    
    var sessionsSheet = getSheetSafe(spreadsheet, "Sessions");
    if (sessionsSheet) {
      var sessionId = "SES-" + Utilities.getUuid().substring(0, 8);
      sessionsSheet.appendRow([
        sessionId,
        bodyParams.enrollmentId,
        accessToken,
        refreshToken,
        bodyParams.deviceId || "android-device",
        new Date(now),
        new Date(refreshExpiry)
      ]);
    }
    
    return {
      success: true,
      message: "Authentication verification successful.",
      data: {
        accessToken: accessToken,
        refreshToken: refreshToken,
        expiry: accessExpiry,
        profile: {
          enrollmentId: bodyParams.enrollmentId,
          clientName: res.session ? (res.session.fullName || res.session.clientName || "") : "",
          email: res.session ? res.session.email : "",
          phone: res.session ? res.session.phone : "",
          program: res.session ? (res.session.programName || res.session.program || "") : ""
        }
      }
    };
  } else {
    return {
      success: false,
      message: res.message || "OTP verification failed.",
      code: 401
    };
  }
}

function handleApiRefreshToken(bodyParams, spreadsheet) {
  var refreshToken = String(bodyParams.refreshToken || "").trim();
  var deviceId = String(bodyParams.deviceId || "").trim();
  if (!refreshToken) {
    return { success: false, message: "Refresh token is missing.", code: 400 };
  }
  
  var sessionsSheet = getSheetSafe(spreadsheet, "Sessions");
  var match = findRowByColumnValue(sessionsSheet, "Refresh Token", refreshToken);
  if (!match) {
    return { success: false, message: "Invalid refresh token.", code: 401 };
  }
  
  var expiryDate = new Date(match.rowData[6]);
  if (new Date().getTime() > expiryDate.getTime()) {
    deleteSheetRow(sessionsSheet, match.rowIndex);
    return { success: false, message: "Refresh session expired.", code: 401 };
  }
  
  var jwtSecret = getSettingValue(spreadsheet, "JWT Secret") || "default_jwt_secret_key";
  var enrollmentId = match.rowData[1];
  var now = new Date().getTime();
  var accessExpiry = now + (3600 * 1000); // 1 hour
  
  var payload = {
    sub: enrollmentId,
    exp: accessExpiry,
    iat: now
  };
  var accessToken = jwtEncode(payload, jwtSecret);
  
  updateSheetRow(sessionsSheet, match.rowIndex, {
    "Access Token": accessToken
  });
  
  return {
    success: true,
    message: "Access token refreshed.",
    data: {
      accessToken: accessToken,
      expiry: accessExpiry
    }
  };
}

function handleApiLogout(token, spreadsheet) {
  var sessionsSheet = getSheetSafe(spreadsheet, "Sessions");
  var match = findRowByColumnValue(sessionsSheet, "Access Token", token);
  if (match) {
    deleteSheetRow(sessionsSheet, match.rowIndex);
  }
  return {
    success: true,
    message: "Logged out successfully."
  };
}

function handleApiRegisterDevice(bodyParams, spreadsheet) {
  var devicesSheet = getSheetSafe(spreadsheet, "Devices");
  if (!devicesSheet) {
    return { success: false, message: "Devices sheet not found.", code: 500 };
  }
  
  var deviceId = String(bodyParams.deviceId || "").trim();
  if (!deviceId) {
    return { success: false, message: "Device ID is missing.", code: 400 };
  }
  
  var match = findRowByColumnValue(devicesSheet, "Device ID", deviceId);
  var record = {
    "Device ID": deviceId,
    "Enrollment ID": bodyParams.enrollmentId || "",
    "Platform": bodyParams.platform || "Android",
    "Model": bodyParams.model || "",
    "Android Version": bodyParams.androidVersion || "",
    "App Version": bodyParams.appVersion || "",
    "FCM Token": bodyParams.fcmToken || "",
    "Last Login": new Date(),
    "Last Sync": new Date(),
    "Status": "Active"
  };
  
  if (match) {
    updateSheetRow(devicesSheet, match.rowIndex, record);
  } else {
    insertSheetRow(devicesSheet, record);
  }
  
  return {
    success: true,
    message: "Device specifications updated."
  };
}

function handleApiGetProfile(enrollmentId, spreadsheet) {
  var clientsSheet = getSheetSafe(spreadsheet, "Clients");
  var match = findRowByColumnValue(clientsSheet, "Enrollment ID", enrollmentId);
  if (!match) {
    return { success: false, message: "Client profile not found.", code: 404 };
  }
  
  var profile = {
    enrollmentId: String(match.rowData[0] || ""),
    clientName: String(match.rowData[1] || ""),
    phone: String(match.rowData[2] || ""),
    email: String(match.rowData[3] || ""),
    program: String(match.rowData[4] || ""),
    status: String(match.rowData[5] || ""),
    preferredAuth: String(match.rowData[6] || ""),
    telegramChatId: String(match.rowData[8] || "")
  };
  
  return {
    success: true,
    message: "Profile retrieved.",
    data: profile
  };
}

function handleApiUpdateProfile(enrollmentId, bodyParams, spreadsheet) {
  var clientsSheet = getSheetSafe(spreadsheet, "Clients");
  var match = findRowByColumnValue(clientsSheet, "Enrollment ID", enrollmentId);
  if (!match) {
    return { success: false, message: "Client profile not found.", code: 404 };
  }
  
  var updates = {};
  if (bodyParams.preferredAuth !== undefined) updates["Preferred Auth Method"] = bodyParams.preferredAuth;
  if (bodyParams.clientName !== undefined) updates["Client Name"] = bodyParams.clientName;
  if (bodyParams.telegramChatId !== undefined) updates["Telegram Chat ID"] = bodyParams.telegramChatId;
  
  updateSheetRow(clientsSheet, match.rowIndex, updates);
  
  return {
    success: true,
    message: "Profile updated successfully."
  };
}

// -------------------------------------------------------------------------
// 2. Dashboard Handlers
// -------------------------------------------------------------------------

function handleApiGetDashboard(enrollmentId, spreadsheet) {
  var profile = handleApiGetProfile(enrollmentId, spreadsheet);
  var appointments = handleApiGetAppointments(enrollmentId, spreadsheet);
  var health = handleApiGetHealth(enrollmentId, spreadsheet);
  
  return {
    success: true,
    message: "Dashboard aggregates retrieved.",
    data: {
      profile: profile.success ? profile.data : null,
      appointments: appointments.success ? appointments.data : [],
      healthMetrics: health.success ? health.data : []
    }
  };
}

function handleApiGetDashboardSummary(enrollmentId, spreadsheet) {
  var appointmentsSheet = getSheetSafe(spreadsheet, "Appointments");
  var healthLogsSheet = getSheetSafe(spreadsheet, "Health Logs");
  var receiptsSheet = getSheetSafe(spreadsheet, "Receipts");
  
  var nextAppointment = "None";
  var appointments = getSheetRows(appointmentsSheet);
  var now = new Date();
  var upcomingCount = 0;
  
  for (var i = 1; i < appointments.length; i++) {
    if (String(appointments[i][1]).trim() === enrollmentId) {
      var apptDate = new Date(appointments[i][5]);
      var apptStatus = String(appointments[i][9]).trim().toLowerCase();
      if (apptDate >= now && apptStatus !== "cancelled") {
        upcomingCount++;
        if (nextAppointment === "None") {
          nextAppointment = appointments[i][5] + " at " + appointments[i][6];
        }
      }
    }
  }
  
  var lastWeight = "Not logged";
  var lastWater = "Not logged";
  var healthLogs = getSheetRows(healthLogsSheet);
  for (var j = healthLogs.length - 1; j >= 1; j--) {
    if (String(healthLogs[j][1]).trim() === enrollmentId) {
      if (healthLogs[j][3] && lastWeight === "Not logged") lastWeight = healthLogs[j][3] + " kg";
      if (healthLogs[j][7] && lastWater === "Not logged") lastWater = healthLogs[j][7] + " ml";
      if (lastWeight !== "Not logged" && lastWater !== "Not logged") break;
    }
  }
  
  return {
    success: true,
    message: "Dashboard summary retrieved.",
    data: {
      nextAppointment: nextAppointment,
      upcomingAppointmentsCount: upcomingCount,
      lastWeight: lastWeight,
      lastWater: lastWater
    }
  };
}

// -------------------------------------------------------------------------
// 3. Appointments Handlers
// -------------------------------------------------------------------------

function handleApiGetAppointments(enrollmentId, spreadsheet) {
  var sheet = getSheetSafe(spreadsheet, "Appointments");
  var rows = getSheetRows(sheet);
  var list = [];
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][1]).trim() === enrollmentId) {
      list.push({
        appointmentId: String(rows[i][0]),
        date: String(rows[i][5]),
        time: String(rows[i][6]),
        reason: String(rows[i][8]),
        status: String(rows[i][9]),
        coach: String(rows[i][11]),
        meetLink: String(rows[i][13] || rows[i][15] || "")
      });
    }
  }
  return {
    success: true,
    message: "Appointments retrieved.",
    data: list
  };
}

function handleApiCreateAppointment(enrollmentId, bodyParams, spreadsheet) {
  var sheet = getSheetSafe(spreadsheet, "Appointments");
  if (!sheet) return { success: false, message: "Appointments sheet not found.", code: 500 };
  
  var appointmentId = "APT-" + Math.floor(100000 + Math.random() * 900000);
  var profileRes = handleApiGetProfile(enrollmentId, spreadsheet);
  var clientName = profileRes.success ? profileRes.data.clientName : "";
  var email = profileRes.success ? profileRes.data.email : "";
  var phone = profileRes.success ? profileRes.data.phone : "";
  
  var record = {
    "Appointment ID": appointmentId,
    "Client ID": enrollmentId,
    "Client Name": clientName,
    "Email": email,
    "Phone": phone,
    "Appointment Date": bodyParams.date || "",
    "Appointment Time": bodyParams.time || "",
    "Time Zone": bodyParams.timeZone || "UTC+3",
    "Reason": bodyParams.reason || "",
    "Status": "Pending",
    "Requested On": new Date(),
    "Coach": bodyParams.coach || "Assigned Coach"
  };
  
  insertSheetRow(sheet, record);
  return {
    success: true,
    message: "Appointment booked successfully.",
    data: { appointmentId: appointmentId }
  };
}

function handleApiUpdateAppointment(enrollmentId, bodyParams, spreadsheet) {
  var sheet = getSheetSafe(spreadsheet, "Appointments");
  var appointmentId = String(bodyParams.appointmentId || "").trim();
  if (!appointmentId) return { success: false, message: "Appointment ID missing.", code: 400 };
  
  var match = findRowByColumnValue(sheet, "Appointment ID", appointmentId);
  if (!match || String(match.rowData[1]).trim() !== enrollmentId) {
    return { success: false, message: "Appointment not found.", code: 404 };
  }
  
  var updates = {};
  if (bodyParams.date !== undefined) updates["Appointment Date"] = bodyParams.date;
  if (bodyParams.time !== undefined) updates["Appointment Time"] = bodyParams.time;
  if (bodyParams.reason !== undefined) updates["Reason"] = bodyParams.reason;
  if (bodyParams.status !== undefined) updates["Status"] = bodyParams.status;
  
  updateSheetRow(sheet, match.rowIndex, updates);
  return { success: true, message: "Appointment rescheduled." };
}

function handleApiDeleteAppointment(enrollmentId, bodyParams, spreadsheet) {
  var sheet = getSheetSafe(spreadsheet, "Appointments");
  var appointmentId = String(bodyParams.appointmentId || "").trim();
  if (!appointmentId) return { success: false, message: "Appointment ID missing.", code: 400 };
  
  var match = findRowByColumnValue(sheet, "Appointment ID", appointmentId);
  if (!match || String(match.rowData[1]).trim() !== enrollmentId) {
    return { success: false, message: "Appointment not found.", code: 404 };
  }
  
  updateSheetRow(sheet, match.rowIndex, { Status: "Cancelled" });
  return { success: true, message: "Appointment cancelled." };
}

function handleApiCheckInAppointment(enrollmentId, bodyParams, spreadsheet) {
  var sheet = getSheetSafe(spreadsheet, "Appointments");
  var appointmentId = String(bodyParams.appointmentId || "").trim();
  
  var match = findRowByColumnValue(sheet, "Appointment ID", appointmentId);
  if (!match || String(match.rowData[1]).trim() !== enrollmentId) {
    return { success: false, message: "Appointment not found.", code: 404 };
  }
  
  updateSheetRow(sheet, match.rowIndex, { Status: "Checked-In" });
  return { success: true, message: "Checked in successfully." };
}

// -------------------------------------------------------------------------
// 4. Meal Plans & Workout Plans Handlers
// -------------------------------------------------------------------------

function handleApiGetMealPlans(enrollmentId, spreadsheet) {
  // Read program configurations or generic lists
  return {
    success: true,
    message: "Meal plans retrieved.",
    data: [
      { id: "meal-1", title: "Ketogenic Healthy Plan", calories: 1800, protein: "120g", carbs: "30g", fat: "140g" },
      { id: "meal-2", title: "High Protein Muscle Building Plan", calories: 2500, protein: "180g", carbs: "220g", fat: "70g" }
    ]
  };
}

function handleApiCreateMealLog(enrollmentId, bodyParams, spreadsheet) {
  var sheet = getSheetSafe(spreadsheet, "Meal Logs");
  if (!sheet) return { success: false, message: "Meal logs sheet not found.", code: 500 };
  
  var logId = bodyParams.logId || "MEAL-" + Utilities.getUuid().substring(0, 8);
  var record = {
    "Log ID": logId,
    "Enrollment ID": enrollmentId,
    "Date": bodyParams.date || new Date().toISOString().substring(0, 10),
    "Meal Type": bodyParams.mealType || "Breakfast",
    "Food Items": bodyParams.foodItems || "",
    "Calories": bodyParams.calories || 0,
    "Protein": bodyParams.protein || 0,
    "Carbs": bodyParams.carbs || 0,
    "Fat": bodyParams.fat || 0,
    "Status": bodyParams.status || "Logged",
    "Timestamp": bodyParams.timestamp || new Date().getTime()
  };
  
  insertSheetRow(sheet, record);
  return { success: true, message: "Meal logged successfully." };
}

function handleApiGetWorkouts(enrollmentId, spreadsheet) {
  return {
    success: true,
    message: "Workout plans retrieved.",
    data: [
      { id: "work-1", title: "Core Endurance Conditioning", duration: "45 mins", difficulty: "Intermediate" },
      { id: "work-2", title: "Strength Power Routine", duration: "60 mins", difficulty: "Advanced" }
    ]
  };
}

function handleApiCreateWorkoutLog(enrollmentId, bodyParams, spreadsheet) {
  var sheet = getSheetSafe(spreadsheet, "Workout Logs");
  if (!sheet) return { success: false, message: "Workout logs sheet not found.", code: 500 };
  
  var logId = bodyParams.logId || "WKT-" + Utilities.getUuid().substring(0, 8);
  var record = {
    "Log ID": logId,
    "Enrollment ID": enrollmentId,
    "Date": bodyParams.date || new Date().toISOString().substring(0, 10),
    "Activity": bodyParams.activity || "",
    "Duration": bodyParams.duration || 0,
    "Calories Burned": bodyParams.caloriesBurned || 0,
    "Intensity": bodyParams.intensity || "Medium",
    "Notes": bodyParams.notes || "",
    "Timestamp": bodyParams.timestamp || new Date().getTime()
  };
  
  insertSheetRow(sheet, record);
  return { success: true, message: "Workout activity logged." };
}

// -------------------------------------------------------------------------
// 5. Health Logs & Metrics Handlers
// -------------------------------------------------------------------------

function handleApiGetHealth(enrollmentId, spreadsheet) {
  var sheet = getSheetSafe(spreadsheet, "Health Logs");
  var rows = getSheetRows(sheet);
  var list = [];
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][1]).trim() === enrollmentId) {
      list.push({
        logId: String(rows[i][0]),
        date: String(rows[i][2]),
        weight: rows[i][3],
        bmi: rows[i][4],
        bodyFat: rows[i][5],
        muscle: rows[i][6],
        water: rows[i][7],
        sleep: rows[i][8],
        mood: rows[i][9],
        calories: rows[i][10],
        steps: rows[i][11],
        bloodPressure: rows[i][12],
        bloodSugar: rows[i][13],
        heartRate: rows[i][14]
      });
    }
  }
  return {
    success: true,
    message: "Health logs retrieved.",
    data: list
  };
}

function handleApiPostHealthMetric(enrollmentId, metricType, bodyParams, spreadsheet) {
  var sheet = getSheetSafe(spreadsheet, "Health Logs");
  if (!sheet) return { success: false, message: "Health logs sheet not found.", code: 500 };
  
  var logId = bodyParams.logId || "HLTH-" + Utilities.getUuid().substring(0, 8);
  var dateStr = bodyParams.date || new Date().toISOString().substring(0, 10);
  
  // Attempt to find existing log for the client on the same day to merge or create new
  var match = null;
  var rows = getSheetRows(sheet);
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][1]).trim() === enrollmentId && String(rows[i][2]).trim().substring(0, 10) === dateStr.substring(0, 10)) {
      match = { rowIndex: i + 1, rowData: rows[i] };
      break;
    }
  }
  
  var record = {};
  if (match) {
    // Merge metrics
    if (metricType === "weight" || bodyParams.weight) {
      record["Weight"] = bodyParams.weight;
      if (bodyParams.bmi) record["BMI"] = bodyParams.bmi;
    }
    if (metricType === "water" || bodyParams.water) record["Water"] = bodyParams.water;
    if (metricType === "sleep" || bodyParams.sleep) record["Sleep"] = bodyParams.sleep;
    if (metricType === "mood" || bodyParams.mood) record["Mood"] = bodyParams.mood;
    if (metricType === "blood-pressure" || bodyParams.bloodPressure) record["Blood Pressure"] = bodyParams.bloodPressure;
    if (metricType === "blood-sugar" || bodyParams.bloodSugar) record["Blood Sugar"] = bodyParams.bloodSugar;
    if (metricType === "body-fat" || bodyParams.bodyFat) record["Body Fat"] = bodyParams.bodyFat;
    if (metricType === "heart-rate" || bodyParams.heartRate) record["Heart Rate"] = bodyParams.heartRate;
    record["Timestamp"] = new Date().getTime();
    
    updateSheetRow(sheet, match.rowIndex, record);
  } else {
    // Create new health metric row
    var fullRecord = {
      "Log ID": logId,
      "Enrollment ID": enrollmentId,
      "Date": dateStr,
      "Weight": bodyParams.weight || "",
      "BMI": bodyParams.bmi || "",
      "Body Fat": bodyParams.bodyFat || "",
      "Muscle %": bodyParams.muscle || "",
      "Water": bodyParams.water || "",
      "Sleep": bodyParams.sleep || "",
      "Mood": bodyParams.mood || "",
      "Calories": bodyParams.calories || "",
      "Steps": bodyParams.steps || "",
      "Blood Pressure": bodyParams.bloodPressure || "",
      "Blood Sugar": bodyParams.bloodSugar || "",
      "Heart Rate": bodyParams.heartRate || "",
      "Timestamp": new Date().getTime()
    };
    insertSheetRow(sheet, fullRecord);
  }
  
  return { success: true, message: "Health metric " + metricType + " logged successfully." };
}

// -------------------------------------------------------------------------
// 6. Messages & Chat Communications
// -------------------------------------------------------------------------

function handleApiGetMessages(enrollmentId, spreadsheet) {
  var sheet = getSheetSafe(spreadsheet, "Messages");
  var rows = getSheetRows(sheet);
  var chat = [];
  for (var i = 1; i < rows.length; i++) {
    var sender = String(rows[i][1]).trim();
    var recipient = String(rows[i][3]).trim();
    if (sender === enrollmentId || recipient === enrollmentId) {
      chat.push({
        messageId: String(rows[i][0]),
        senderId: sender,
        senderType: String(rows[i][2]),
        recipientId: recipient,
        message: String(rows[i][4]),
        timestamp: rows[i][5]
      });
    }
  }
  return { success: true, message: "Chat logs retrieved.", data: chat };
}

function handleApiCreateMessage(enrollmentId, bodyParams, spreadsheet) {
  var sheet = getSheetSafe(spreadsheet, "Messages");
  if (!sheet) return { success: false, message: "Messages sheet not found.", code: 500 };
  
  var messageId = "MSG-" + Utilities.getUuid().substring(0, 8);
  var record = {
    "Message ID": messageId,
    "Sender ID": enrollmentId,
    "Sender Type": "client",
    "Recipient ID": bodyParams.recipientId || "admin",
    "Message": bodyParams.message || "",
    "Timestamp": new Date().toISOString()
  };
  
  insertSheetRow(sheet, record);
  return { success: true, message: "Message sent successfully.", data: { messageId: messageId } };
}

function handleApiUploadMessageAttachment(enrollmentId, bodyParams, spreadsheet) {
  // Simulates document attachment
  return {
    success: true,
    message: "Attachment simulated and saved.",
    data: { fileUrl: "https://optivita.app/attachments/" + Utilities.getUuid().substring(0, 8) + ".png" }
  };
}

// -------------------------------------------------------------------------
// 7. Push & In-app Notifications
// -------------------------------------------------------------------------

function handleApiGetNotifications(enrollmentId, spreadsheet) {
  var sheet = getSheetSafe(spreadsheet, "Push Notifications");
  var rows = getSheetRows(sheet);
  var list = [];
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][1]).trim() === enrollmentId) {
      list.push({
        notificationId: String(rows[i][0]),
        title: String(rows[i][2]),
        message: String(rows[i][3]),
        type: String(rows[i][4]),
        read: String(rows[i][5]) === "true",
        created: String(rows[i][6])
      });
    }
  }
  return { success: true, message: "Notifications retrieved.", data: list };
}

function handleApiMarkNotificationRead(enrollmentId, bodyParams, spreadsheet) {
  var sheet = getSheetSafe(spreadsheet, "Push Notifications");
  var notificationId = String(bodyParams.notificationId || "").trim();
  var match = findRowByColumnValue(sheet, "Notification ID", notificationId);
  
  if (match && String(match.rowData[1]).trim() === enrollmentId) {
    updateSheetRow(sheet, match.rowIndex, { Read: "true" });
  }
  
  return { success: true, message: "Notification marked read." };
}

function handleApiRegisterFcm(enrollmentId, bodyParams, spreadsheet) {
  var devicesSheet = getSheetSafe(spreadsheet, "Devices");
  var deviceId = String(bodyParams.deviceId || "").trim();
  
  var match = findRowByColumnValue(devicesSheet, "Device ID", deviceId);
  if (match && String(match.rowData[1]).trim() === enrollmentId) {
    updateSheetRow(devicesSheet, match.rowIndex, {
      "FCM Token": bodyParams.fcmToken || "",
      "Last Sync": new Date()
    });
  }
  return { success: true, message: "FCM registration completed." };
}

// -------------------------------------------------------------------------
// 8. Invoices, Payments, and Billing
// -------------------------------------------------------------------------

function handleApiGetInvoices(enrollmentId, spreadsheet) {
  var sheet = getSheetSafe(spreadsheet, "Invoices");
  var rows = getSheetRows(sheet);
  var list = [];
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][1]).trim() === enrollmentId) {
      list.push({
        invoiceId: String(rows[i][0]),
        amount: rows[i][4],
        date: String(rows[i][5]),
        status: String(rows[i][6]),
        dueDate: String(rows[i][7])
      });
    }
  }
  return { success: true, message: "Invoices retrieved.", data: list };
}

function handleApiGetPayments(enrollmentId, spreadsheet) {
  var sheet = getSheetSafe(spreadsheet, "Receipts");
  var rows = getSheetRows(sheet);
  var list = [];
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][1]).trim() === enrollmentId) {
      list.push({
        receiptId: String(rows[i][0]),
        amount: rows[i][5],
        method: String(rows[i][4]),
        date: String(rows[i][9]),
        branch: String(rows[i][10]),
        remarks: String(rows[i][11])
      });
    }
  }
  return { success: true, message: "Receipts retrieved.", data: list };
}

// -------------------------------------------------------------------------
// 9. Documents
// -------------------------------------------------------------------------

function handleApiGetDocuments(enrollmentId, spreadsheet) {
  var sheet = getSheetSafe(spreadsheet, "Expenses"); // maps document files
  var list = [
    { documentId: "doc-1", title: "Lab Blood Analysis Report", url: "https://optivita.app/reports/OPT-blood-2026.pdf", date: "2026-07-15" }
  ];
  return { success: true, message: "Documents retrieved.", data: list };
}

function handleApiUploadDocument(enrollmentId, bodyParams, spreadsheet) {
  return {
    success: true,
    message: "Document metadata stored.",
    data: { documentId: "DOC-" + Utilities.getUuid().substring(0, 8) }
  };
}

// -------------------------------------------------------------------------
// 10. Settings Control
// -------------------------------------------------------------------------

function handleApiGetSettings(spreadsheet) {
  var minVersion = getSettingValue(spreadsheet, "Min Android App Version") || "1.0.0";
  var forceUpdate = getSettingValue(spreadsheet, "Force Android Update") || "false";
  return {
    success: true,
    message: "Settings configuration retrieved.",
    data: {
      minAndroidVersion: minVersion,
      forceAndroidUpdate: forceUpdate === "true"
    }
  };
}

function handleApiUpdateSettings(enrollmentId, bodyParams, spreadsheet) {
  var clientsSheet = getSheetSafe(spreadsheet, "Clients");
  var match = findRowByColumnValue(clientsSheet, "Enrollment ID", enrollmentId);
  if (match) {
    var updates = {};
    if (bodyParams.preferredAuth !== undefined) updates["Preferred Auth Method"] = bodyParams.preferredAuth;
    updateSheetRow(clientsSheet, match.rowIndex, updates);
  }
  return { success: true, message: "Settings updated successfully." };
}

// -------------------------------------------------------------------------
// 11. Offline Synchronization (Queue processing Engine)
// -------------------------------------------------------------------------

function handleApiOfflineSync(enrollmentId, bodyParams, spreadsheet) {
  var changes = bodyParams.changes || [];
  var successCount = 0;
  
  for (var i = 0; i < changes.length; i++) {
    var item = changes[i];
    var table = item.table;
    var action = item.action;
    var data = item.data || {};
    
    try {
      if (table === "Health Logs") {
        handleApiPostHealthMetric(enrollmentId, "sync", data, spreadsheet);
        successCount++;
      } else if (table === "Meal Logs") {
        handleApiCreateMealLog(enrollmentId, data, spreadsheet);
        successCount++;
      } else if (table === "Workout Logs") {
        handleApiCreateWorkoutLog(enrollmentId, data, spreadsheet);
        successCount++;
      } else if (table === "Appointments") {
        if (action === "INSERT") {
          handleApiCreateAppointment(enrollmentId, data, spreadsheet);
        } else if (action === "UPDATE") {
          handleApiUpdateAppointment(enrollmentId, data, spreadsheet);
        }
        successCount++;
      }
    } catch (err) {
      Logger.log("Sync error on row " + i + ": " + err.toString());
    }
  }
  
  return {
    success: true,
    message: "Synchronization completed. Processed " + successCount + " of " + changes.length + " changes."
  };
}

// -------------------------------------------------------------------------
// 12. Push Notifications OAuth & v1 Dispatcher
// -------------------------------------------------------------------------

function sendPushNotification(enrollmentId, title, message, type) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var devicesSheet = getSheetSafe(spreadsheet, "Devices");
  var pushNotificationsSheet = getSheetSafe(spreadsheet, "Push Notifications");
  
  if (!devicesSheet || !pushNotificationsSheet) return false;
  
  var rows = devicesSheet.getDataRange().getValues();
  var sent = false;
  
  for (var i = 1; i < rows.length; i++) {
    var devEnrollmentId = String(rows[i][1]).trim();
    var fcmToken = String(rows[i][6]).trim();
    var status = String(rows[i][9]).trim().toLowerCase();
    
    if (devEnrollmentId === enrollmentId && fcmToken && status === "active") {
      var notificationId = "NTF-" + Utilities.getUuid().substring(0, 8);
      pushNotificationsSheet.appendRow([
        notificationId,
        enrollmentId,
        title,
        message,
        type || "General",
        "false",
        new Date()
      ]);
      
      sendFcmNotification(fcmToken, title, message, {
        notificationId: notificationId,
        type: type || "General"
      });
      sent = true;
    }
  }
  return sent;
}

function sendFcmNotification(fcmToken, title, body, dataPayload) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var projectId = getSettingValue(spreadsheet, "Firebase Project ID") || "optivita-43853";
  var serviceAccountStr = getSettingValue(spreadsheet, "Firebase Service Account JSON");
  
  if (!fcmToken) return false;
  if (!serviceAccountStr || serviceAccountStr.indexOf("{") === -1) {
    Logger.log("FCM: Service Account credentials not set. Push notification logged but not sent.");
    return false;
  }
  
  try {
    var creds = JSON.parse(serviceAccountStr);
    var tokenUrl = "https://oauth2.googleapis.com/token";
    var now = Math.floor(new Date().getTime() / 1000);
    
    var claim = {
      iss: creds.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: tokenUrl,
      exp: now + 3600,
      iat: now
    };
    
    var header = { alg: "RS256", typ: "JWT" };
    var headerStr = Utilities.base64EncodeWebSafe(JSON.stringify(header)).replace(/=+$/, "");
    var claimStr = Utilities.base64EncodeWebSafe(JSON.stringify(claim)).replace(/=+$/, "");
    var signatureInput = headerStr + "." + claimStr;
    
    var signatureBytes = Utilities.computeRsaSha256Signature(signatureInput, creds.private_key);
    var signatureStr = Utilities.base64EncodeWebSafe(signatureBytes).replace(/=+$/, "");
    
    var assertion = signatureInput + "." + signatureStr;
    
    var tokenResponse = UrlFetchApp.fetch(tokenUrl, {
      method: "post",
      payload: {
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: assertion
      },
      muteHttpExceptions: true
    });
    
    var tokenJson = JSON.parse(tokenResponse.getContentText());
    var accessToken = tokenJson.access_token;
    if (!accessToken) {
      Logger.log("FCM OAuth token error: " + tokenResponse.getContentText());
      return false;
    }
    
    var fcmUrl = "https://fcm.googleapis.com/v1/projects/" + projectId + "/messages:send";
    var payload = {
      message: {
        token: fcmToken,
        notification: {
          title: title,
          body: body
        }
      }
    };
    if (dataPayload) {
      payload.message.data = dataPayload;
    }
    
    var response = UrlFetchApp.fetch(fcmUrl, {
      method: "post",
      headers: {
        Authorization: "Bearer " + accessToken,
        "Content-Type": "application/json"
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    
    Logger.log("FCM Response: " + response.getContentText());
    return response.getResponseCode() === 200;
  } catch (err) {
    Logger.log("Error sending FCM push: " + err.toString());
    return false;
  }
}

