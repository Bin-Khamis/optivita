import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Phone, Sparkles, KeyRound, ArrowLeft, ArrowRight, Loader2, ShieldCheck, ShieldAlert, Mail, Smartphone, Key, AlertTriangle, Copy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/portal/login")({
  component: CustomerLogin,
});

/* ==========================================
   WEB CRYPTO TOTP VALIDATION ENGINE
   ========================================== */

function base32ToHex(base32: string): string {
  const base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  let hex = "";
  for (let i = 0; i < base32.length; i++) {
    const val = base32chars.indexOf(base32.charAt(i).toUpperCase());
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, "0");
  }
  for (let j = 0; j + 4 <= bits.length; j += 4) {
    const chunk = bits.substring(j, j + 4);
    hex += parseInt(chunk, 2).toString(16);
  }
  return hex;
}

function hexToBytes(hex: string): number[] {
  const bytes = [];
  for (let c = 0; c < hex.length; c += 2) {
    bytes.push(parseInt(hex.substring(c, c + 2), 16));
  }
  return bytes;
}

async function generateTOTP(secretBase32: string, timeStep: number): Promise<string> {
  try {
    const keyHex = base32ToHex(secretBase32);
    const keyBytes = hexToBytes(keyHex);
    const timeHex = timeStep.toString(16).padStart(16, "0");
    const timeBytes = hexToBytes(timeHex);

    const key = await window.crypto.subtle.importKey(
      "raw",
      new Uint8Array(keyBytes),
      { name: "HMAC", hash: { name: "SHA-1" } },
      false,
      ["sign"]
    );
    
    const signature = await window.crypto.subtle.sign(
      "HMAC",
      key,
      new Uint8Array(timeBytes)
    );
    
    const hmac = new Uint8Array(signature);
    const offset = hmac[hmac.length - 1] & 0xf;
    const binary = ((hmac[offset] & 0x7f) << 24) |
                   ((hmac[offset + 1] & 0xff) << 16) |
                   ((hmac[offset + 2] & 0xff) << 8) |
                   (hmac[offset + 3] & 0xff);
    
    const otp = binary % 1000000;
    return otp.toString().padStart(6, "0");
  } catch (err) {
    console.error("TOTP Generation Error:", err);
    return "";
  }
}

async function verifyTOTP(secretBase32: string, code: string): Promise<boolean> {
  const epoch = Math.round(Date.now() / 1000.0);
  const currentStep = Math.floor(epoch / 30);
  
  // Drift window check
  for (let i = -1; i <= 1; i++) {
    const calculatedCode = await generateTOTP(secretBase32, currentStep + i);
    if (calculatedCode === code) return true;
  }
  return false;
}

function CustomerLogin() {
  const navigate = useNavigate();
  
  // Auth navigation step
  const [step, setStep] = useState<"credentials" | "select-method" | "otp" | "totp-setup" | "totp-entry">("credentials");
  
  // Credentials States
  const [enrollmentId, setEnrollmentId] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState("+966");
  const [loading, setLoading] = useState(false);

  // Multi-Channel Selection States
  const [selectedMethod, setSelectedMethod] = useState<"email" | "whatsapp" | "totp">("email");
  const [totpConfigured, setTotpConfigured] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");

  // OTP Verification States
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(300); // 5 minutes resend timer
  
  // Authenticator App setup states
  const [tempSecret, setTempSecret] = useState("");
  const [totpCode, setTotpCode] = useState("");

  // Lockout States
  const [lockRemaining, setLockRemaining] = useState(0);

  // Monitor lockout clock
  useEffect(() => {
    const checkLock = () => {
      const lockUntil = parseInt(localStorage.getItem("optivita_portal_lock_until") || "0", 10);
      const remaining = lockUntil - Date.now();
      if (remaining > 0) {
        setLockRemaining(Math.ceil(remaining / 1000));
      } else {
        setLockRemaining(0);
      }
    };
    checkLock();
    const interval = setInterval(checkLock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Resend OTP countdown
  useEffect(() => {
    if (step !== "otp") return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [step]);

  const formatCountdown = () => {
    const mins = Math.floor(countdown / 60);
    const secs = countdown % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Device context audit logs
  const getClientMetadata = () => {
    const ua = navigator.userAgent;
    let browser = "Unknown Browser";
    let os = "Unknown OS";
    let device = "Desktop";

    if (ua.indexOf("Firefox") > -1) browser = "Firefox";
    else if (ua.indexOf("Chrome") > -1) browser = "Chrome";
    else if (ua.indexOf("Safari") > -1) browser = "Safari";
    else if (ua.indexOf("MSIE") > -1) browser = "IE";
    else if (ua.indexOf("Edge") > -1) browser = "Edge";

    if (ua.indexOf("Windows") > -1) os = "Windows";
    else if (ua.indexOf("Mac") > -1) os = "macOS";
    else if (ua.indexOf("Linux") > -1) os = "Linux";
    else if (ua.indexOf("Android") > -1) os = "Android";
    else if (ua.indexOf("iPhone") > -1) os = "iOS";

    if (/Mobi|Android|iPhone/i.test(ua)) device = "Mobile";
    else if (/Tablet|iPad/i.test(ua)) device = "Tablet";

    return { browser, os, device };
  };

  // Step 1: Verify Credentials
  const handleVerifyCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockRemaining > 0) {
      toast.error(`Locked out. Try again in ${Math.ceil(lockRemaining / 60)} minutes.`);
      return;
    }

    if (!enrollmentId.trim() || !phone.trim()) {
      toast.error("Please fill in both Enrollment ID and Mobile Number.");
      return;
    }

    const fullPhone = `${phoneCountryCode}${phone.replace(/[^0-9]/g, "")}`;
    setLoading(true);

    const webhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;
    const isOffline = !webhookUrl || 
                      webhookUrl.includes("placeholder") || 
                      webhookUrl === "undefined" || 
                      webhookUrl === "null" || 
                      webhookUrl.trim() === "";

    if (isOffline) {
      // Simulated Offline credentials lookup
      setTimeout(() => {
        const cached = localStorage.getItem("optivita_crm_cache");
        let clientData: any = null;
        if (cached) {
          try {
            const db = JSON.parse(cached);
            const enrollments = db["Program Enrollments"] || [];
            clientData = enrollments.find((e: any) => {
              const cleanDbPhone = (e.phone || "").replace(/[^0-9]/g, "");
              const cleanInputPhone = fullPhone.replace(/[^0-9]/g, "");
              return e["Enrollment ID"] === enrollmentId.trim() && cleanDbPhone === cleanInputPhone;
            });
          } catch (err) {
            console.error("Cache error:", err);
          }
        }

        if (!clientData) {
          setLoading(false);
          toast.error("Invalid Enrollment ID or Mobile Number.");
          return;
        }

        // Setup local selection parameters
        setMaskedEmail(maskEmail(clientData.email || "client@gmail.com"));
        setMaskedPhone(maskPhone(fullPhone));
        setTotpConfigured(!!clientData.totpSecret);
        
        // Retrieve preferred method if remembered
        const pref = localStorage.getItem(`optivita_pref_${enrollmentId}`) || clientData.preferredAuthMethod || "email";
        setSelectedMethod(pref as any);

        setLoading(false);
        setStep("select-method");
      }, 800);
    } else {
      // Live Credentials Verification
      try {
        const res = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({
            action: "verify-client",
            enrollmentId: enrollmentId.trim(),
            phone: fullPhone
          })
        });

        const result = await res.json();
        if (result.status === "success") {
          setMaskedEmail(result.emailMasked);
          setMaskedPhone(maskPhone(fullPhone));
          setTotpConfigured(result.totpConfigured);
          
          const pref = localStorage.getItem(`optivita_pref_${enrollmentId}`) || result.preferredMethod || "email";
          setSelectedMethod(pref as any);

          setStep("select-method");
        } else {
          toast.error(result.message || "Invalid Enrollment ID or Mobile Number.");
        }
      } catch (err) {
        toast.error("Database connection failure. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  // Step 2: Proceed from Verification Method Selection
  const handleProceedMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Save preference to local storage
    localStorage.setItem(`optivita_pref_${enrollmentId}`, selectedMethod);

    const webhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;
    const isOffline = !webhookUrl || 
                      webhookUrl.includes("placeholder") || 
                      webhookUrl === "undefined" || 
                      webhookUrl === "null" || 
                      webhookUrl.trim() === "";

    if (selectedMethod === "totp") {
      setLoading(false);
      if (!totpConfigured) {
        // Generate random Base32 secret for setup
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
        const secret = Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
        setTempSecret(secret);
        setTotpCode("");
        setStep("totp-setup");
      } else {
        setOtpDigits(["", "", "", "", "", ""]);
        setStep("totp-entry");
      }
      return;
    }

  const dispatchWhatsAppBridgeMessage = async (targetPhone: string, code: string) => {
    try {
      const fullPhone = `${phoneCountryCode}${targetPhone.replace(/[^0-9]/g, "")}`;
      const res = await fetch("http://localhost:3000/send-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: fullPhone,
          message: `Your Optivita Client Hub verification code is: ${code}\n\nValid for 5 minutes. Do not share this code with anyone.`
        })
      });
      const data = await res.json();
      if (data.status === "success") {
        toast.success(`WhatsApp message sent to ${fullPhone}!`);
      } else {
        toast.warning(data.message || "Could not deliver message via WhatsApp bridge.");
      }
    } catch (err) {
      console.warn("Local WhatsApp bridge connection error:", err);
    }
  };

    // Handle WhatsApp OTP with instant local bridge delivery
    if (selectedMethod === "whatsapp") {
      const otpCode = String(Math.floor(100000 + Math.random() * 900000));
      localStorage.setItem("optivita_portal_simulated_otp", otpCode);
      setCountdown(300);
      setOtpDigits(["", "", "", "", "", ""]);
      setLoading(false);
      setStep("otp");

      // Deliver message instantly to phone via local WhatsApp bridge
      dispatchWhatsAppBridgeMessage(phone, otpCode);

      // Sync with Google Sheets database in background
      if (!isOffline) {
        fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({
            action: "send-otp",
            enrollmentId: enrollmentId.trim(),
            method: "whatsapp"
          })
        }).catch(() => {});
      }
      return;
    }

    // Call send OTP for Email OTP
    if (isOffline) {
      setTimeout(() => {
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        localStorage.setItem("optivita_portal_simulated_otp", otp);
        setCountdown(300);
        setOtpDigits(["", "", "", "", "", ""]);
        setLoading(false);
        setStep("otp");
        toast.success(`Verification code dispatched! simulated EMAIL OTP: ${otp}`);
      }, 800);
    } else {
      try {
        const res = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({
            action: "send-otp",
            enrollmentId: enrollmentId.trim(),
            method: selectedMethod
          })
        });

        const result = await res.json();
        if (result.status === "success") {
          setCountdown(300);
          setOtpDigits(["", "", "", "", "", ""]);
          setStep("otp");
          toast.success("Verification code sent successfully.");
        } else {
          toast.error(result.message || "Failed to deliver OTP.");
        }
      } catch (err) {
        toast.error("Failed to connect to authentication server.");
      } finally {
        setLoading(false);
      }
    }
  };

  // Step 3 (Method A): Verify Email / WhatsApp OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredOtp = otpDigits.join("");
    if (enteredOtp.length < 6) {
      toast.error("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    const webhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;
    const isOffline = !webhookUrl || 
                      webhookUrl.includes("placeholder") || 
                      webhookUrl === "undefined" || 
                      webhookUrl === "null" || 
                      webhookUrl.trim() === "";
    const meta = getClientMetadata();

    // Fast check: verify against local active OTP first
    const storedOtp = localStorage.getItem("optivita_portal_simulated_otp");
    if (storedOtp && storedOtp === enteredOtp) {
      localStorage.removeItem("optivita_portal_simulated_otp");
      localStorage.removeItem("optivita_portal_failed_attempts");
      finalizeOfflineSession();
      return;
    }

    if (isOffline) {
      // Offline Simulated OTP Verification
      setTimeout(() => {
        const failedCount = parseInt(localStorage.getItem("optivita_portal_failed_attempts") || "0", 10);

        if (storedOtp !== enteredOtp) {
          const nextFailed = failedCount + 1;
          localStorage.setItem("optivita_portal_failed_attempts", String(nextFailed));
          setLoading(false);

          if (nextFailed >= 5) {
            localStorage.setItem("optivita_portal_lock_until", String(Date.now() + 15 * 60 * 1000));
            localStorage.removeItem("optivita_portal_failed_attempts");
            setStep("credentials");
            setLockRemaining(900);
            toast.error("Too many failed attempts. Login locked for 15 minutes.");
          } else {
            toast.error(`Invalid OTP. Attempts remaining: ${5 - nextFailed}`);
          }
          return;
        }

        // Correct OTP
        localStorage.removeItem("optivita_portal_simulated_otp");
        localStorage.removeItem("optivita_portal_failed_attempts");
        finalizeOfflineSession();
      }, 700);
    } else {
      // Live OTP Verification
      try {
        const res = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({
            action: "verify-otp",
            enrollmentId: enrollmentId.trim(),
            otp: enteredOtp,
            browser: meta.browser,
            device: `${meta.os} (${meta.device})`,
            ip: "Client Session"
          })
        });

        const result = await res.json();
        if (result.status === "success") {
          localStorage.setItem("optivita_customer_session", JSON.stringify(result.session));
          toast.success("Successfully authenticated!");
          navigate({ to: "/portal/dashboard" });
        } else {
          toast.error(result.message || "Invalid OTP.");
          if (result.message && result.message.includes("lock")) {
            setStep("credentials");
            localStorage.setItem("optivita_portal_lock_until", String(Date.now() + 15 * 60 * 1000));
          }
        }
      } catch (err) {
        toast.error("Authentication server communication failed.");
      } finally {
        setLoading(false);
      }
    }
  };

  // Step 3 (Method B): Bind TOTP app and log in
  const handleBindTOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totpCode.length < 6) {
      toast.error("Please enter the 6-digit code from your Authenticator App.");
      return;
    }

    setLoading(true);
    const webhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;
    const isOffline = !webhookUrl || 
                      webhookUrl.includes("placeholder") || 
                      webhookUrl === "undefined" || 
                      webhookUrl === "null" || 
                      webhookUrl.trim() === "";

    if (isOffline) {
      const valid = await verifyTOTP(tempSecret, totpCode);
      if (!valid) {
        toast.error("Incorrect authenticator code. Check your device clock.");
        setLoading(false);
        return;
      }

      // Update preference in local mock sheet
      setTimeout(() => {
        const cached = localStorage.getItem("optivita_crm_cache");
        if (cached) {
          try {
            const db = JSON.parse(cached);
            const index = db["Program Enrollments"].findIndex((x: any) => x["Enrollment ID"] === enrollmentId.trim());
            if (index !== -1) {
              db["Program Enrollments"][index].totpSecret = tempSecret;
              db["Program Enrollments"][index].preferredAuthMethod = "totp";
              localStorage.setItem("optivita_crm_cache", JSON.stringify(db));
            }
          } catch (err) {
            console.error(err);
          }
        }
        toast.success("Authenticator App successfully configured!");
        finalizeOfflineSession();
      }, 800);
    } else {
      // Live binding
      try {
        const res = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({
            action: "update-security-preference",
            enrollmentId: enrollmentId.trim(),
            preferredMethod: "totp",
            totpSecret: tempSecret,
            verificationCode: totpCode
          })
        });

        const result = await res.json();
        if (result.status === "success") {
          // Relogin with TOTP method
          const loginRes = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({
              action: "verify-otp",
              enrollmentId: enrollmentId.trim(),
              otp: totpCode,
              browser: "Verify Setup",
              device: "Desktop",
              ip: "Client Setup"
            })
          });
          const loginResult = await loginRes.json();
          if (loginResult.status === "success") {
            localStorage.setItem("optivita_customer_session", JSON.stringify(loginResult.session));
            toast.success("Successfully authenticated!");
            navigate({ to: "/portal/dashboard" });
          } else {
            toast.error("Configuration succeeded but initial login session failed.");
          }
        } else {
          toast.error(result.message || "Code verification failed.");
        }
      } catch (err) {
        toast.error("Failed to connect to authentication server.");
      } finally {
        setLoading(false);
      }
    }
  };

  // Step 3 (Method C): Verify Active TOTP code
  const handleVerifyTOTPCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpDigits.join("");
    if (code.length < 6) {
      toast.error("Please enter the complete 6-digit Authenticator code.");
      return;
    }

    setLoading(true);
    const webhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;
    const isOffline = !webhookUrl || 
                      webhookUrl.includes("placeholder") || 
                      webhookUrl === "undefined" || 
                      webhookUrl === "null" || 
                      webhookUrl.trim() === "";
    const meta = getClientMetadata();

    if (isOffline) {
      // Check cached client secret
      const cached = localStorage.getItem("optivita_crm_cache");
      let secret = "";
      if (cached) {
        try {
          const db = JSON.parse(cached);
          const match = db["Program Enrollments"].find((x: any) => x["Enrollment ID"] === enrollmentId.trim());
          secret = match?.totpSecret || "";
        } catch (e) {
          console.error(e);
        }
      }

      const valid = await verifyTOTP(secret, code);
      if (!valid) {
        const failedCount = parseInt(localStorage.getItem("optivita_portal_failed_attempts") || "0", 10) + 1;
        localStorage.setItem("optivita_portal_failed_attempts", String(failedCount));
        setLoading(false);

        if (failedCount >= 5) {
          localStorage.setItem("optivita_portal_lock_until", String(Date.now() + 15 * 60 * 1000));
          localStorage.removeItem("optivita_portal_failed_attempts");
          setStep("credentials");
          setLockRemaining(900);
          toast.error("Too many failed attempts. Account locked for 15 minutes.");
        } else {
          toast.error(`Invalid verification code. Attempts remaining: ${5 - failedCount}`);
        }
        return;
      }

      localStorage.removeItem("optivita_portal_failed_attempts");
      finalizeOfflineSession();
    } else {
      // Live TOTP verify
      try {
        const res = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({
            action: "verify-otp",
            enrollmentId: enrollmentId.trim(),
            otp: code,
            browser: meta.browser,
            device: `${meta.os} (${meta.device})`,
            ip: "Client Session"
          })
        });

        const result = await res.json();
        if (result.status === "success") {
          localStorage.setItem("optivita_customer_session", JSON.stringify(result.session));
          toast.success("Welcome back!");
          navigate({ to: "/portal/dashboard" });
        } else {
          toast.error(result.message || "Invalid Authenticator Code.");
          if (result.message && result.message.includes("lock")) {
            setStep("credentials");
            localStorage.setItem("optivita_portal_lock_until", String(Date.now() + 15 * 60 * 1000));
          }
        }
      } catch (err) {
        toast.error("Failed to connect to authentication server.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    setLoading(true);
    const webhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;
    const isOffline = !webhookUrl || 
                      webhookUrl.includes("placeholder") || 
                      webhookUrl === "undefined" || 
                      webhookUrl === "null" || 
                      webhookUrl.trim() === "";

    if (selectedMethod === "whatsapp") {
      const otpCode = String(Math.floor(100000 + Math.random() * 900000));
      localStorage.setItem("optivita_portal_simulated_otp", otpCode);
      setCountdown(300);
      setLoading(false);
      dispatchWhatsAppBridgeMessage(phone, otpCode);
      if (!isOffline) {
        fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({
            action: "send-otp",
            enrollmentId: enrollmentId.trim(),
            method: "whatsapp"
          })
        }).catch(() => {});
      }
      return;
    }

    if (isOffline) {
      setTimeout(() => {
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        localStorage.setItem("optivita_portal_simulated_otp", otp);
        setCountdown(300);
        setLoading(false);
        toast.success(`New simulated code: ${otp}`);
      }, 600);
    } else {
      try {
        const res = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({
            action: "send-otp",
            enrollmentId: enrollmentId.trim(),
            method: selectedMethod
          })
        });
        const result = await res.json();
        if (result.status === "success") {
          setCountdown(300);
          toast.success("New verification code sent successfully.");
        } else {
          toast.error(result.message || "Resend failed.");
        }
      } catch (err) {
        toast.error("Communication failure.");
      } finally {
        setLoading(false);
      }
    }
  };

  const finalizeOfflineSession = () => {
    const cached = localStorage.getItem("optivita_crm_cache");
    let clientProfile = {
      enrollmentId: enrollmentId,
      fullName: "Guest Client",
      phone: phone,
      email: "guest@gmail.com",
      programName: "30-Day Weight Loss Challenge"
    };

    if (cached) {
      try {
        const db = JSON.parse(cached);
        const match = db["Program Enrollments"].find((e: any) => e["Enrollment ID"] === enrollmentId.trim());
        if (match) {
          clientProfile = {
            enrollmentId: match["Enrollment ID"],
            fullName: match.fullName,
            phone: match.phone,
            email: match.email,
            programName: match.programName
          };
        }
      } catch (e) {
        console.error(e);
      }
    }

    localStorage.setItem("optivita_customer_session", JSON.stringify(clientProfile));
    toast.success("Successfully logged into customer portal!");
    setLoading(false);
    navigate({ to: "/portal/dashboard" });
  };

  // shifts focus across boxes
  const handleDigitChange = (val: string, index: number) => {
    const sanitized = val.replace(/[^0-9]/g, "");
    const newDigits = [...otpDigits];
    newDigits[index] = sanitized.slice(-1);
    setOtpDigits(newDigits);

    if (sanitized && index < 5) {
      const nextInput = document.getElementById(`otp-digit-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleDigitKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        const newDigits = [...otpDigits];
        newDigits[index - 1] = "";
        setOtpDigits(newDigits);
        const prevInput = document.getElementById(`otp-digit-${index - 1}`);
        prevInput?.focus();
      }
    }
  };

  const maskEmail = (emailStr: string) => {
    if (!emailStr || emailStr.indexOf("@") === -1) return "******";
    const parts = emailStr.split("@");
    const name = parts[0];
    const domain = parts[1];
    if (name.length <= 2) return `${name.charAt(0)}*****@${domain}`;
    return `${name.slice(0, 2)}*****${name.slice(-1)}@${domain}`;
  };

  const maskPhone = (phoneStr: string) => {
    if (!phoneStr) return "******";
    const clean = phoneStr.replace(/[^0-9+]/g, "");
    if (clean.length < 7) return "******";
    return `${clean.slice(0, 4)}*******${clean.slice(-3)}`;
  };

  // QR Code URL utilizing the free qrserver API
  const totpQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=otpauth://totp/Optivita:${enrollmentId}?secret=${tempSecret}%26issuer=Optivita`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-slate-900 px-4 relative transition-colors duration-200">
      
      {/* Background shape */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-12 right-12 h-96 w-96 rounded-full bg-emerald-300/10 blur-[120px]" />
        <div className="absolute bottom-12 left-12 h-96 w-96 rounded-full bg-[#173B63]/10 blur-[120px]" />
      </div>

      <div className="w-full max-w-md bg-white border border-slate-100/85 rounded-[32px] p-8 md:p-10 shadow-soft relative z-10 animate-scale-up">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="font-display font-extrabold text-2xl text-[#173B63] tracking-tight">
            Optivita Client Hub
          </h2>
          <p className="text-xs text-slate-400 mt-2 font-medium tracking-wide uppercase">
            {step === "credentials" ? "Secure Client Login" : "Two-Factor Authentication"}
          </p>
        </div>

        {/* Lockout Screen */}
        {lockRemaining > 0 ? (
          <div className="space-y-6 text-center py-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
              <ShieldAlert className="h-6 w-6 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-[#173B63] text-lg">Too Many Attempts</h3>
              <p className="text-slate-500 text-xs leading-relaxed max-w-xs mx-auto">
                For security reasons, your login has been temporarily locked due to repeated verification failures.
              </p>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-2xl py-3 text-red-600 font-bold text-sm">
              Please wait {Math.ceil(lockRemaining / 60)} minutes
            </div>
          </div>
        ) : (
          <>
            {step === "credentials" && (
              /* Step 1: Credentials Entry */
              <form onSubmit={handleVerifyCredentials} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enrollment ID</label>
                  <input
                    type="text"
                    value={enrollmentId}
                    onChange={(e) => setEnrollmentId(e.target.value)}
                    placeholder="e.g. OPT-2026-001001"
                    className="w-full px-4 py-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 font-semibold"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registered Mobile Number</label>
                  <div className="flex gap-2">
                    <select
                      value={phoneCountryCode}
                      onChange={(e) => setPhoneCountryCode(e.target.value)}
                      className="px-2 py-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-850 font-semibold"
                    >
                      <option value="+965">🇰🇼 +965</option>
                      <option value="+966">🇸🇦 +966</option>
                      <option value="+971">🇦🇪 +971</option>
                      <option value="+91">🇮🇳 +91</option>
                      <option value="+973">🇧🇭 +973</option>
                      <option value="+968">🇴🇲 +968</option>
                      <option value="+1">🇺🇸 +1</option>
                    </select>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="5xxxxxxx"
                      className="flex-1 px-4 py-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 font-semibold"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-gradient-to-r from-[#064e3b] to-[#0f766e] text-white font-bold py-3.5 shadow-md hover:opacity-95 transition-all text-xs mt-4 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4.5 w-4.5 animate-spin" /> Verifying Credentials...
                    </>
                  ) : (
                    <>
                      Continue <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {step === "select-method" && (
              /* Step 2: Select Verification Method */
              <form onSubmit={handleProceedMethod} className="space-y-6 animate-fade-in">
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-[#173B63]">Choose Verification Channel</h3>
                  <p className="text-xs text-slate-400 leading-normal">
                    Select how you would like to receive or generate your verification code.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Email option */}
                  <label className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    selectedMethod === "email" ? "border-emerald-500 bg-emerald-50/10" : "border-slate-100 hover:bg-slate-50"
                  }`}>
                    <input
                      type="radio"
                      name="method"
                      checked={selectedMethod === "email"}
                      onChange={() => setSelectedMethod("email")}
                      className="mt-1 accent-emerald-500"
                    />
                    <div className="space-y-0.5">
                      <span className="font-semibold text-xs flex items-center gap-1 text-slate-850">
                        <Mail className="h-3.5 w-3.5 text-[#173B63]" /> Email OTP (Recommended)
                      </span>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        Fast and secure. Verification code will be sent to registered email: <strong className="text-slate-600">{maskedEmail}</strong>
                      </p>
                    </div>
                  </label>

                  {/* WhatsApp option */}
                  <label className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    selectedMethod === "whatsapp" ? "border-emerald-500 bg-emerald-50/10" : "border-slate-100 hover:bg-slate-50"
                  }`}>
                    <input
                      type="radio"
                      name="method"
                      checked={selectedMethod === "whatsapp"}
                      onChange={() => setSelectedMethod("whatsapp")}
                      className="mt-1 accent-emerald-500"
                    />
                    <div className="space-y-0.5">
                      <span className="font-semibold text-xs flex items-center gap-1 text-slate-850">
                        <Smartphone className="h-3.5 w-3.5 text-[#173B63]" /> WhatsApp OTP
                      </span>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        Receive code via WhatsApp message at registered number: <strong className="text-slate-600">{maskedPhone}</strong>
                      </p>
                    </div>
                  </label>

                  {/* Authenticator App option */}
                  <label className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    selectedMethod === "totp" ? "border-emerald-500 bg-emerald-50/10" : "border-slate-100 hover:bg-slate-50"
                  }`}>
                    <input
                      type="radio"
                      name="method"
                      checked={selectedMethod === "totp"}
                      onChange={() => setSelectedMethod("totp")}
                      className="mt-1 accent-emerald-500"
                    />
                    <div className="space-y-0.5">
                      <span className="font-semibold text-xs flex items-center gap-1 text-slate-850">
                        <Key className="h-3.5 w-3.5 text-[#173B63]" /> Authenticator App
                      </span>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        Use Google Authenticator, Microsoft Authenticator, or Authy to generate a secure code offline instantly.
                      </p>
                    </div>
                  </label>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep("credentials")}
                    className="w-28 text-center bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-xl transition text-xs"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-xl bg-gradient-to-r from-[#064e3b] to-[#0f766e] text-white font-bold py-3 text-xs shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Proceed"}
                  </button>
                </div>
              </form>
            )}

            {step === "otp" && (
              /* Step 3 (Method A): OTP Verification Code Screen */
              <form onSubmit={handleVerifyOTP} className="space-y-6 animate-fade-in">
                <div className="text-center space-y-1.5">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verification Code</label>
                    <button 
                      type="button" 
                      onClick={() => setStep("select-method")}
                      className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-0.5"
                    >
                      <ArrowLeft className="h-3 w-3" /> Change Method
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Verification code has been dispatched via <strong className="text-slate-850 font-bold">{selectedMethod === "email" ? "email" : "WhatsApp"}</strong> to:<br/>
                    <strong className="text-slate-800 font-bold">{selectedMethod === "email" ? maskedEmail : maskedPhone}</strong>
                  </p>
                </div>

                {/* 6 digits input boxes */}
                <div className="flex justify-center gap-2.5 py-2">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-digit-${idx}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(e.target.value, idx)}
                      onKeyDown={(e) => handleDigitKeyDown(e, idx)}
                      className="w-11 h-12 text-center font-bold text-lg rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-[#173B63]"
                    />
                  ))}
                </div>

                {/* Timer and Resend Actions */}
                <div className="flex justify-between items-center text-xs border-t pt-3">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span>Code Expiry:</span>
                    <span className={`font-mono font-bold ${countdown < 60 ? "text-red-500 font-extrabold" : "text-slate-600"}`}>
                      {formatCountdown()}
                    </span>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={countdown > 0 || loading}
                    className={`font-bold hover:underline transition ${
                      countdown > 0 ? "text-slate-300 cursor-not-allowed" : "text-emerald-600"
                    }`}
                  >
                    Resend OTP
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-gradient-to-r from-[#064e3b] to-[#0f766e] text-white font-bold py-3.5 shadow-md hover:opacity-95 transition-all text-xs flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Access Hub"}
                </button>

                {/* WhatsApp self-hosted developer notice warnings */}
                {selectedMethod === "whatsapp" && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-2xl flex items-start gap-2.5 animate-fade-in text-left">
                    <AlertTriangle className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-[10px] text-amber-700 dark:text-amber-300 space-y-0.5 leading-normal">
                      <p className="font-bold text-amber-800">Developer warning (Self-Hosted WhatsApp integration):</p>
                      <p>• Dev mode connects via scan-in bridge. Message delivery stops if host logs out.</p>
                      <p>• Bridges (whatsapp-web.js, Baileys) might trigger ToS actions; use official API for production.</p>
                    </div>
                  </div>
                )}
              </form>
            )}

            {step === "totp-setup" && (
              /* Step 3 (Method B): Authenticator Setup Wizard */
              <form onSubmit={handleBindTOTP} className="space-y-5 animate-fade-in">
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-[#173B63]">Authenticator App Setup</h3>
                  <p className="text-xs text-slate-500 leading-normal">
                    Link your Optivita Client profile to your Authenticator app. Scan the QR code or enter the key.
                  </p>
                </div>

                <div className="flex flex-col items-center gap-2 p-3 bg-slate-50 rounded-2xl border">
                  <img src={totpQrCodeUrl} alt="Setup QR Code" className="h-40 w-40 object-contain rounded-lg border bg-white p-1" />
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Scan code in Google Authenticator</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Secret key key</span>
                  <div className="flex gap-2">
                    <code className="flex-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-100 text-slate-700 select-all border flex items-center justify-center font-mono">
                      {tempSecret}
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(tempSecret);
                        toast.success("Copied to clipboard!");
                      }}
                      className="px-2 border rounded-lg hover:bg-slate-50 text-slate-500 transition flex items-center justify-center"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Enter Verification Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="Enter 6-digit code to confirm"
                    className="w-full px-4 py-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 font-bold text-center"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full text-center bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition text-xs shadow-soft"
                  >
                    {loading ? "Binding..." : "Verify & Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep("select-method")}
                    className="w-full text-center bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-xl transition text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {step === "totp-entry" && (
              /* Step 3 (Method C): Authenticator Code Entry */
              <form onSubmit={handleVerifyTOTPCode} className="space-y-6 animate-fade-in">
                <div className="text-center space-y-1.5">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Authenticator Code</label>
                    <button 
                      type="button" 
                      onClick={() => setStep("select-method")}
                      className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-0.5"
                    >
                      <ArrowLeft className="h-3 w-3" /> Change Method
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Open your Google Authenticator, Microsoft Authenticator, or Authy application and enter the active 6-digit code.
                  </p>
                </div>

                {/* 6 digits inputs */}
                <div className="flex justify-center gap-2.5 py-2">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-digit-${idx}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(e.target.value, idx)}
                      onKeyDown={(e) => handleDigitKeyDown(e, idx)}
                      className="w-11 h-12 text-center font-bold text-lg rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-[#173B63]"
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-gradient-to-r from-[#064e3b] to-[#0f766e] text-white font-bold py-3.5 shadow-md hover:opacity-95 transition-all text-xs flex items-center justify-center gap-2 animate-pulse"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify Authenticator Code"}
                </button>
              </form>
            )}
          </>
        )}

        {/* Home link */}
        <div className="mt-8 text-center border-t border-slate-100 pt-4">
          <Link to="/" className="text-xs font-semibold text-slate-400 hover:text-emerald-600 flex items-center justify-center gap-1.5 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Website Home
          </Link>
        </div>

      </div>
    </div>
  );
}
