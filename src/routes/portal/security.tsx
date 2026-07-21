import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { usePortal } from "@/lib/portalContext";
import { Key, Shield, Smartphone, Mail, AlertTriangle, CheckCircle2, Copy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/portal/security")({
  component: SecuritySettings,
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
  
  // Accept window drift of +/- 30 seconds
  for (let i = -1; i <= 1; i++) {
    const calculatedCode = await generateTOTP(secretBase32, currentStep + i);
    if (calculatedCode === code) {
      return true;
    }
  }
  return false;
}

function SecuritySettings() {
  const { customer, refreshData } = usePortal();
  const navigate = useNavigate();

  // Load preferences from Cache or DB
  const [preferredMethod, setPreferredMethod] = useState<"email" | "whatsapp" | "totp">("email");
  const [totpConfigured, setTotpConfigured] = useState(false);
  const [loading, setLoading] = useState(false);

  // Authenticator App setup Wizard states
  const [showTotpWizard, setShowTotpWizard] = useState(false);
  const [tempSecret, setTempSecret] = useState("");
  const [verificationCode, setVerificationCode] = useState("");

  useEffect(() => {
    if (!customer) return;

    // Check offline simulation client preferences
    const webhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;
    const isOffline = !webhookUrl || webhookUrl.includes("placeholder");

    if (isOffline) {
      const cached = localStorage.getItem("optivita_crm_cache");
      if (cached) {
        try {
          const db = JSON.parse(cached);
          const enrollments = db["Program Enrollments"] || [];
          const match = enrollments.find((e: any) => e["Enrollment ID"] === customer.enrollmentId);
          if (match) {
            setPreferredMethod(match.preferredAuthMethod || "email");
            setTotpConfigured(!!match.totpSecret);
          }
        } catch (e) {
          console.error(e);
        }
      }
    } else {
      // In online mode, we can fetch active preferences from the profile check
      const fetchPreference = async () => {
        try {
          const res = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({
              action: "verify-client",
              enrollmentId: customer.enrollmentId,
              phone: customer.phone
            })
          });
          const result = await res.json();
          if (result.status === "success") {
            setPreferredMethod(result.preferredMethod || "email");
            setTotpConfigured(result.totpConfigured);
          }
        } catch (err) {
          console.error("Failed to load live preferences:", err);
        }
      };
      fetchPreference();
    }
  }, [customer]);

  // Generates a random Base32 string for Authenticator bindings
  const generateRandomSecret = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    const secret = Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    setTempSecret(secret);
    setVerificationCode("");
  };

  const handleStartTotpSetup = () => {
    generateRandomSecret();
    setShowTotpWizard(true);
  };

  // Submit security method updates
  const handleSavePreferences = async (method: "email" | "whatsapp" | "totp") => {
    if (method === "totp" && !totpConfigured) {
      handleStartTotpSetup();
      return;
    }

    setLoading(true);
    const webhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;
    const isOffline = !webhookUrl || webhookUrl.includes("placeholder");

    if (isOffline) {
      // Simulated Update
      setTimeout(() => {
        const cached = localStorage.getItem("optivita_crm_cache");
        if (cached) {
          try {
            const db = JSON.parse(cached);
            const index = db["Program Enrollments"].findIndex((e: any) => e["Enrollment ID"] === customer?.enrollmentId);
            if (index !== -1) {
              db["Program Enrollments"][index].preferredAuthMethod = method;
              localStorage.setItem("optivita_crm_cache", JSON.stringify(db));
            }
          } catch (e) {
            console.error(e);
          }
        }
        setPreferredMethod(method);
        toast.success("Security authentication preference updated successfully.");
        setLoading(false);
      }, 600);
    } else {
      // Live Update
      try {
        const res = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({
            action: "update-security-preference",
            enrollmentId: customer?.enrollmentId,
            preferredMethod: method
          })
        });
        const result = await res.json();
        if (result.status === "success") {
          setPreferredMethod(method);
          toast.success("Security preferences synced to account.");
        } else {
          toast.error(result.message || "Failed to update preference.");
        }
      } catch (err) {
        toast.error("Failed to connect to authentication server.");
      } finally {
        setLoading(false);
      }
    }
  };

  // Verify and Bind Authenticator setup
  const handleVerifyAndBindTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.length < 6) {
      toast.error("Please enter the 6-digit code from your Authenticator app.");
      return;
    }

    setLoading(true);
    const webhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;
    const isOffline = !webhookUrl || webhookUrl.includes("placeholder");

    if (isOffline) {
      // Client-side Web Crypto Validation
      const valid = await verifyTOTP(tempSecret, verificationCode);
      if (!valid) {
        toast.error("Incorrect verification code. Please check your Authenticator app clock.");
        setLoading(false);
        return;
      }

      setTimeout(() => {
        const cached = localStorage.getItem("optivita_crm_cache");
        if (cached) {
          try {
            const db = JSON.parse(cached);
            const index = db["Program Enrollments"].findIndex((e: any) => e["Enrollment ID"] === customer?.enrollmentId);
            if (index !== -1) {
              db["Program Enrollments"][index].totpSecret = tempSecret;
              db["Program Enrollments"][index].preferredAuthMethod = "totp";
              localStorage.setItem("optivita_crm_cache", JSON.stringify(db));
            }
          } catch (e) {
            console.error(e);
          }
        }
        setTotpConfigured(true);
        setPreferredMethod("totp");
        setShowTotpWizard(false);
        toast.success("Authenticator app bound and enabled successfully!");
        setLoading(false);
      }, 700);
    } else {
      // Live validation and binding on Sheets backend
      try {
        const res = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({
            action: "update-security-preference",
            enrollmentId: customer?.enrollmentId,
            preferredMethod: "totp",
            totpSecret: tempSecret,
            verificationCode: verificationCode
          })
        });
        const result = await res.json();
        if (result.status === "success") {
          setTotpConfigured(true);
          setPreferredMethod("totp");
          setShowTotpWizard(false);
          toast.success("Authenticator app successfully bound!");
        } else {
          toast.error(result.message || "Authenticator verification failed.");
        }
      } catch (err) {
        toast.error("Failed to connect to authentication server.");
      } finally {
        setLoading(false);
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Secret key copied to clipboard!");
  };

  // QR Code URL utilizing the free qrserver API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=otpauth://totp/Optivita:${customer?.enrollmentId || "Client"}?secret=${tempSecret}%26issuer=Optivita`;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      
      {/* Banner */}
      <div className="bg-[#173B63] rounded-[32px] p-8 text-white relative overflow-hidden shadow-soft">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_70%_120%,#fff,transparent)]" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-wider text-emerald-300">
            <Shield className="h-3.5 w-3.5" /> Security Center
          </div>
          <h1 className="font-display font-extrabold text-3xl leading-tight">Security Preferences</h1>
          <p className="text-sm text-slate-200/90 max-w-xl">
            Choose your preferred sign-in method and configure two-factor authenticator settings.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Verification Preferences Panel */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-soft space-y-6">
            <div>
              <h3 className="font-display font-bold text-lg text-[#173B63] dark:text-slate-50">Two-Factor Authentication</h3>
              <p className="text-xs text-slate-400 mt-1 leading-normal">
                Choose how you would like to receive your verification code for future portal logins.
              </p>
            </div>

            <div className="space-y-4">
              {/* Email Option */}
              <label className={`flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                preferredMethod === "email" ? "border-emerald-500 bg-emerald-50/10" : "border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850"
              }`}>
                <input 
                  type="radio" 
                  name="auth-pref" 
                  checked={preferredMethod === "email"} 
                  onChange={() => handleSavePreferences("email")}
                  className="mt-1 accent-emerald-500" 
                />
                <div className="space-y-1">
                  <span className="font-semibold text-sm flex items-center gap-1.5 text-slate-850 dark:text-slate-100">
                    <Mail className="h-4 w-4 text-[#173B63] dark:text-[#7ee0c8]" /> Email OTP (Recommended)
                  </span>
                  <p className="text-xs text-slate-400 leading-normal">
                    Fast and secure. A verification code will be sent to your registered email address.
                  </p>
                </div>
              </label>

              {/* WhatsApp Option */}
              <label className={`flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                preferredMethod === "whatsapp" ? "border-emerald-500 bg-emerald-50/10" : "border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850"
              }`}>
                <input 
                  type="radio" 
                  name="auth-pref" 
                  checked={preferredMethod === "whatsapp"} 
                  onChange={() => handleSavePreferences("whatsapp")}
                  className="mt-1 accent-emerald-500" 
                />
                <div className="space-y-1">
                  <span className="font-semibold text-sm flex items-center gap-1.5 text-slate-850 dark:text-slate-100">
                    <Smartphone className="h-4 w-4 text-[#173B63] dark:text-[#7ee0c8]" /> WhatsApp OTP (Optional)
                  </span>
                  <p className="text-xs text-slate-400 leading-normal">
                    Receive your 6-digit verification code directly on your registered WhatsApp phone number.
                  </p>
                </div>
              </label>

              {/* Authenticator Option */}
              <label className={`flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                preferredMethod === "totp" ? "border-emerald-500 bg-emerald-50/10" : "border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850"
              }`}>
                <input 
                  type="radio" 
                  name="auth-pref" 
                  checked={preferredMethod === "totp"} 
                  onChange={() => handleSavePreferences("totp")}
                  className="mt-1 accent-emerald-500" 
                />
                <div className="space-y-1">
                  <span className="font-semibold text-sm flex items-center gap-1.5 text-slate-850 dark:text-slate-100">
                    <Key className="h-4 w-4 text-[#173B63] dark:text-[#7ee0c8]" /> Authenticator App (Google/Microsoft/Authy)
                  </span>
                  <p className="text-xs text-slate-400 leading-normal">
                    Use Google Authenticator, Microsoft Authenticator, Authy, or FreeOTP to generate a verification code without requiring internet or message delivery.
                  </p>
                </div>
              </label>
            </div>

            {/* Developers / Warning Notices for WhatsApp */}
            {preferredMethod === "whatsapp" && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-2xl flex items-start gap-3 animate-fade-in">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                  <p className="font-bold text-amber-800 dark:text-amber-200">Developer Warning (WhatsApp OTP Mode)</p>
                  <p>• Development and testing mode only.</p>
                  <p>• Self-hosted bridges (whatsapp-web.js, Baileys) require active QR-code sessions.</p>
                  <p>• Message delivery stops if the host device disconnects or is blocked.</p>
                  <p>• Not recommended for high-volume production; use official WhatsApp Business APIs.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Authenticator App Configurations Wizard */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-soft space-y-4">
            <h3 className="font-display font-bold text-sm text-[#173B63] dark:text-slate-50 uppercase tracking-wider">Authenticator Hub</h3>
            
            {totpConfigured ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border border-emerald-100 rounded-2xl text-xs">
                  <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
                  <div>
                    <p className="font-bold">Active Configuration</p>
                    <p className="mt-0.5">Google/Authy app is linked.</p>
                  </div>
                </div>
                
                <button
                  onClick={handleStartTotpSetup}
                  className="w-full text-center py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition"
                >
                  Reconfigure Authenticator
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-center py-4">
                <Shield className="h-10 w-10 text-slate-300 mx-auto" />
                <div className="space-y-1">
                  <p className="font-bold text-xs">Not Configured</p>
                  <p className="text-[10px] text-slate-400 leading-normal max-w-[180px] mx-auto">Link Google or Microsoft Authenticator to enable offline 2FA.</p>
                </div>
                
                <button
                  onClick={handleStartTotpSetup}
                  className="w-full text-center py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-soft"
                >
                  Configure Now
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* TOTP BINDING WIZARD OVERLAY */}
      {showTotpWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowTotpWizard(false)} />
          
          <div className="relative bg-white border rounded-[32px] w-full max-w-md p-8 shadow-glow z-10 overflow-hidden text-slate-900 animate-scale-up">
            <h3 className="font-display font-extrabold text-xl text-[#173B63]">Setup Authenticator App</h3>
            <p className="text-xs text-slate-500 leading-normal mt-1">
              Add your Optivita Client profile to your Authenticator Application (Google Authenticator, Microsoft, Authy, or FreeOTP).
            </p>

            <form onSubmit={handleVerifyAndBindTotp} className="mt-6 space-y-6">
              
              {/* QR Code Container */}
              <div className="flex flex-col items-center gap-3 p-4 bg-slate-50 rounded-2xl border">
                <img 
                  src={qrCodeUrl} 
                  alt="Scan QR" 
                  className="h-44 w-44 object-contain rounded-lg border bg-white p-2"
                />
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Scan this QR Code</span>
              </div>

              {/* Manual Secret Key */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Or enter secret key manually</label>
                <div className="flex gap-2">
                  <code className="flex-1 px-3 py-2 text-xs font-bold rounded-lg bg-slate-100 text-slate-700 select-all border flex items-center justify-center font-mono">
                    {tempSecret}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(tempSecret)}
                    className="p-2 border rounded-lg hover:bg-slate-50 text-slate-500 transition"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Code Verification Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confirm 6-Digit App Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="Enter 6-digit code"
                  className="w-full px-4 py-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 font-bold text-center letter-spacing-2"
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
                  onClick={() => setShowTotpWizard(false)}
                  className="w-full text-center bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-xl transition text-xs"
                >
                  Cancel
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
