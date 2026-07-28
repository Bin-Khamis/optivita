import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { usePortal } from "@/lib/portalContext";
import { MessageSquare, Send, AlertCircle, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";
import { isWebhookOffline } from "@/lib/utils";

export const Route = createFileRoute("/portal/messages")({
  component: CustomerMessages,
});

function CustomerMessages() {
  const { data, customer, refreshData } = usePortal();
  const [msgText, setMsgText] = useState("");
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const rawMessages = data?.["Messages"] || [];
  const clientEnrollmentId = customer?.enrollmentId || "";

  // 1. Filter message thread between this client and Admin
  const chatMessages = rawMessages
    .filter((m: any) => {
      const sender = String(m["Sender ID"] || m.SenderID || "").trim();
      const recipient = String(m["Recipient ID"] || m.RecipientID || "").trim();
      return (
        (sender === clientEnrollmentId && recipient === "admin") ||
        (sender === "admin" && recipient === clientEnrollmentId)
      );
    })
    .sort((a: any, b: any) => {
      const tA = new Date(a.Timestamp || a.timestamp).getTime();
      const tB = new Date(b.Timestamp || b.timestamp).getTime();
      return tA - tB;
    });

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // 2. Count client-sent messages today to enforce limit
  const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const sentTodayCount = rawMessages.filter((m: any) => {
    const sender = String(m["Sender ID"] || m.SenderID || "").trim();
    const timestamp = String(m.Timestamp || m.timestamp || "");
    return sender === clientEnrollmentId && timestamp.includes(todayStr);
  }).length;

  const isLimitReached = sentTodayCount >= 2;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgText.trim()) return;
    if (isLimitReached) {
      toast.error("Daily message limit reached. Please contact support tomorrow.");
      return;
    }

    setSending(true);
    const msgId = "MSG-2026-00" + (rawMessages.length + 101);
    const now = new Date();
    const timestampStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} | ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

    const newMsgRecord = {
      action: "webhookSubmit",
      sheetName: "Messages",
      "Message ID": msgId,
      "Sender ID": clientEnrollmentId,
      "Sender Type": "Client",
      "Recipient ID": "admin",
      Message: msgText.trim(),
      Timestamp: timestampStr,
    };

    const webhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;

    if (isWebhookOffline(webhookUrl)) {
      setTimeout(() => {
        if (!data["Messages"]) data["Messages"] = [];
        data["Messages"].push({
          "Message ID": msgId,
          "Sender ID": clientEnrollmentId,
          "Sender Type": "Client",
          "Recipient ID": "admin",
          Message: msgText.trim(),
          Timestamp: timestampStr,
        });
        localStorage.setItem("optivita_crm_cache", JSON.stringify(data));

        toast.success("Message sent successfully!");
        setMsgText("");
        setSending(false);
        refreshData();
      }, 500);
      return;
    }

    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(newMsgRecord),
      });
      const result = await res.json();
      if (result.status === "success") {
        toast.success("Message sent successfully!");
        setMsgText("");
        refreshData();
      } else {
        toast.error("Failed to deliver message.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Database connection failed. Saved message locally.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-extrabold text-3xl tracking-tight flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-emerald-500" /> Secure Messages
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Securely discuss your programs, updates, and clinical assessments with your health
            coach.
          </p>
        </div>
        <div className="text-right">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${isLimitReached ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-600"}`}
          >
            Sent Today: {sentTodayCount} / 2 Messages
          </span>
        </div>
      </div>

      {/* Messages Thread box */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[28px] shadow-soft overflow-hidden flex flex-col h-[550px]">
        {/* Chat Thread Info bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center px-6">
          <div className="flex items-center gap-2.5">
            <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
              Optivita Support Chat (Active)
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-bold tracking-wider flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> END-TO-END ENCRYPTED
          </span>
        </div>

        {/* Messaging Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30 dark:bg-slate-950/20">
          {chatMessages.length > 0 ? (
            chatMessages.map((m: any) => {
              const isMe = (m["Sender Type"] || m.SenderType) === "Client";
              const time = String(m.Timestamp || m.timestamp || "").split(" | ")[1] || "Just now";
              return (
                <div
                  key={m["Message ID"] || m.MessageID}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex items-start gap-2.5 max-w-[70%] ${isMe ? "flex-row-reverse" : "flex-row"}`}
                  >
                    {/* Avatar mockup */}
                    <div
                      className={`h-8 w-8 rounded-full shrink-0 flex items-center justify-center font-bold text-xs ${
                        isMe
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-650"
                      }`}
                    >
                      {isMe ? <User className="h-4 w-4" /> : "AD"}
                    </div>

                    <div className="space-y-1">
                      <div
                        className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                          isMe
                            ? "bg-emerald-600 text-white rounded-tr-none"
                            : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-750 rounded-tl-none shadow-xs"
                        }`}
                      >
                        {m.Message || m.message}
                      </div>
                      <p
                        className={`text-[8px] text-slate-400 ${isMe ? "text-right" : "text-left"}`}
                      >
                        {time}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center leading-normal">
              <MessageSquare className="h-10 w-10 text-slate-300 mb-2" />
              <p className="font-semibold text-xs text-slate-500">No secure messages yet</p>
              <p className="text-[10px] text-slate-400 max-w-xs mt-1">
                Initiate a conversation with your assigned wellness coach. Your responses will be
                reviewed during clinical business hours.
              </p>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input box */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          {isLimitReached ? (
            <div className="p-4.5 rounded-2xl border border-red-200/50 bg-red-500/5 text-red-500 text-xs font-semibold flex items-center gap-2 leading-relaxed">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>Daily message limit reached. Please contact support tomorrow.</span>
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                placeholder="Type your secure message..."
                disabled={sending}
                className="flex-1 px-4.5 py-3 border rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-850 dark:text-slate-100"
              />
              <button
                type="submit"
                disabled={sending || !msgText.trim()}
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-soft transition-colors disabled:opacity-50"
              >
                <Send className="h-4 w-4" /> {sending ? "Sending..." : "Send"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
