import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useCRM } from "@/lib/crmContext";
import { db, updateFirestoreRecord } from "@/lib/firebase";
import { collection, addDoc, query, onSnapshot, orderBy, serverTimestamp } from "firebase/firestore";
import {
  MessageSquare,
  Bell,
  FileText,
  History,
  Send,
  Search,
  User,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ChevronRight,
  CornerDownLeft,
  CheckCheck,
  Phone,
  Video,
  MoreVertical,
  Smile,
  Paperclip,
  Plus,
  Info,
  X,
  Activity,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";
import { isWebhookOffline } from "@/lib/utils";

export const Route = createFileRoute("/admin/communication")({
  component: AdminCommunication,
});

function AdminCommunication() {
  const { data, user, refreshData } = useCRM();
  const [activeTab, setActiveTab] = useState<"broadcast" | "chats" | "templates" | "history">(
    "broadcast",
  );

  // Reset scroll position on active tab change to prevent browser scroll locking
  useEffect(() => {
    const mainEl = document.querySelector("main");
    if (mainEl) {
      mainEl.scrollTop = 0;
    }
  }, [activeTab]);

  const enrollments = data?.["Program Enrollments"] || [];
  const notifications = data?.["Notifications"] || [];
  const notificationRecipients = data?.["Notification Recipients"] || [];
  const staffList = data?.["Staff"] || [];

  // --- Real-time Firestore Messages Listener ---
  const [firestoreMessages, setFirestoreMessages] = useState<any[]>([]);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "private_messages"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: any[] = [];
      snapshot.forEach((doc) => {
        const item = doc.data();
        msgs.push({
          "Message ID": doc.id,
          "Sender ID": item.senderId,
          "Sender Type": item.senderType,
          "Recipient ID": item.recipientId,
          Message: item.message,
          Timestamp: item.timestamp,
          createdAt: item.createdAt,
        });
      });
      setFirestoreMessages(msgs);
    }, (err) => {
      console.error("Firestore chat listener error:", err);
    });
    return () => unsubscribe();
  }, []);

  const rawMessagesMap = new Map<string, any>();
  (data?.["Messages"] || []).forEach((m: any) => {
    const id = m["Message ID"] || m.MessageID || m.id;
    if (id) rawMessagesMap.set(id, m);
  });
  firestoreMessages.forEach((m) => {
    const id = m["Message ID"];
    rawMessagesMap.set(id, m);
  });
  const rawMessages = Array.from(rawMessagesMap.values());

  // --- Broadcast Form States ---
  const [bcTitle, setBcTitle] = useState("");
  const [bcMessage, setBcMessage] = useState("");
  const [bcAudience, setBcAudience] = useState<"All" | "Active" | "Expired" | "Selected">("All");
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  // --- Chats Panel States (WhatsApp Business Refactor) ---
  const [selectedClientChat, setSelectedClientChat] = useState<any | null>(null);
  const [chatSearch, setChatSearch] = useState("");
  const [chatFilter, setChatFilter] = useState<
    "All" | "Unread" | "Favorites" | "Online" | "Archived"
  >("All");
  const [chatInputText, setChatInputText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // WhatsApp Business Sidebar lists divider
  const [chatListType, setChatListType] = useState<"clients" | "employees">("clients");
  const [favoriteClientIds, setFavoriteClientIds] = useState<string[]>(() => {
    const saved = localStorage.getItem("optivita_favorite_clients");
    return saved ? JSON.parse(saved) : [];
  });
  const [archivedClientIds, setArchivedClientIds] = useState<string[]>(() => {
    const saved = localStorage.getItem("optivita_archived_clients");
    return saved ? JSON.parse(saved) : [];
  });

  // UI Interactive simulations
  const [showClientDetailsDrawer, setShowClientDetailsDrawer] = useState(false);
  const [isClientTyping, setIsClientTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

  // --- Message Templates CRUD States ---
  const defaultTemplates = [
    {
      id: "T-1",
      name: "Welcome Onboarding Plan",
      category: "Welcome",
      subject: "Welcome to Optivita — Your precision wellness plan is ready!",
      body: "Hello {{ClientName}},\n\nWelcome to Optivita! We are thrilled to partner with you on your health journey. Your nutritionist, {{Nutritionist}}, is currently reviewing your intakes. Please check your Coaching Hub to get started.\n\nBest regards,\nThe Optivita Team",
      channels: ["Email", "In-App"],
    },
    {
      id: "T-2",
      name: "Appointment Confirmation Link",
      category: "Appointment Confirmation",
      subject: "Confirmed: Wellness Consultation Session",
      body: "Hello {{ClientName}},\n\nYour coaching consultation has been confirmed for {{AppointmentDate}} with {{Nutritionist}}. Please log in to join your session using the portal link.\n\nWarmly,\nOptivita Wellness",
      channels: ["Email", "In-App", "WhatsApp"],
    },
    {
      id: "T-3",
      name: "Invoice Payment Reminder Alert",
      category: "Payment Reminder",
      subject: "Action Required: Invoice Payment Request",
      body: "Dear {{ClientName}},\n\nYour invoice {{InvoiceNo}} for the amount of {{Amount}} is now available. Please complete payment using this link: {{PaymentLink}}.\n\nThank you,\nFinance Department",
      channels: ["Email", "WhatsApp"],
    },
    {
      id: "T-4",
      name: "Nutrition Plan Ready Notice",
      category: "Nutrition Plan Ready",
      subject: "New Nutrition Plan Available",
      body: "Hello {{ClientName}}, your new customized precision nutrition and detox meal plan has been uploaded to your portal Coaching Hub by {{Nutritionist}}. Please check and log your weekly targets!",
      channels: ["Email", "In-App", "WhatsApp"],
    },
  ];

  const [msgTemplates, setMsgTemplates] = useState<any[]>(() => {
    const saved = localStorage.getItem("optivita_message_templates");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return defaultTemplates;
  });

  // CRUD modal controls
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateCategory, setTemplateCategory] = useState("Welcome");
  const [templateSubject, setTemplateSubject] = useState("");
  const [templateBody, setTemplateBody] = useState("");
  const [templateChannels, setTemplateChannels] = useState<string[]>(["Email"]);

  // Preview / Test Send modals
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewingTemplate, setPreviewingTemplate] = useState<any | null>(null);
  const [testSendRecipient, setTestSendRecipient] = useState("");
  const [testSendChannel, setTestSendChannel] = useState<"Email" | "In-App" | "WhatsApp">("Email");

  const saveTemplates = (newTemplates: any[]) => {
    setMsgTemplates(newTemplates);
    localStorage.setItem("optivita_message_templates", JSON.stringify(newTemplates));
  };

  const handleToggleFavorite = (clientId: string) => {
    let nextList;
    if (favoriteClientIds.includes(clientId)) {
      nextList = favoriteClientIds.filter((id) => id !== clientId);
    } else {
      nextList = [...favoriteClientIds, clientId];
    }
    setFavoriteClientIds(nextList);
    localStorage.setItem("optivita_favorite_clients", JSON.stringify(nextList));
    toast.success("Favorites list updated!");
  };

  const handleToggleArchive = (clientId: string) => {
    let nextList;
    if (archivedClientIds.includes(clientId)) {
      nextList = archivedClientIds.filter((id) => id !== clientId);
    } else {
      nextList = [...archivedClientIds, clientId];
    }
    setArchivedClientIds(nextList);
    localStorage.setItem("optivita_archived_clients", JSON.stringify(nextList));
    toast.success("Archive status updated!");
  };

  // Simulates client response & typing indicators
  useEffect(() => {
    if (selectedClientChat) {
      setIsClientTyping(false);
    }
  }, [selectedClientChat]);

  // Auto scroll chat thread to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedClientChat, rawMessages, isClientTyping]);

  // Canned Templates list
  const templates = [
    {
      id: "T-1",
      title: "New Nutrition Plan Available",
      body: "Hello {Name}, your new customized precision nutrition and detox meal plan has been uploaded to your portal Coaching Hub. Please check and log your weekly checklist targets!",
    },
    {
      id: "T-2",
      title: "Invoice Payment Approved",
      body: "Dear {Name}, your payment request for Invoice {InvoiceID} has been successfully verified and approved. Your program ledger status is now updated to Paid. Thank you!",
    },
    {
      id: "T-3",
      title: "Appointment Reminder",
      body: "Hello {Name}, this is a gentle reminder that you have a video-call consultation scheduled tomorrow. Please log in to your portal and join using the link provided.",
    },
  ];

  // Helper functions
  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatTime = (date: Date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${day}-${month}-${year} | ${hours}:${minutes}:${seconds}`;
  };

  // 1. Submit Broadcast Announcement
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bcTitle || !bcMessage) {
      toast.error("Please enter notification title and message.");
      return;
    }

    setSendingBroadcast(true);
    const bcId = "NOTIF-2026-00" + (notifications.length + 101);
    const nowStr = formatDate(new Date());

    // Determine target recipient enrollment IDs
    let targets: string[] = [];
    if (bcAudience === "All") {
      targets = enrollments.map((en: any) => en["Enrollment ID"]).filter(Boolean);
    } else if (bcAudience === "Active") {
      targets = enrollments
        .filter((en: any) => {
          const js = String(en["Joining Status"] || "").toLowerCase();
          return js === "confirmed" || js === "enrolled" || js === "active";
        })
        .map((en: any) => en["Enrollment ID"])
        .filter(Boolean);
    } else if (bcAudience === "Expired") {
      targets = enrollments
        .filter((en: any) => {
          const js = String(en["Joining Status"] || "").toLowerCase();
          return js === "expired" || js === "suspended" || js === "inactive";
        })
        .map((en: any) => en["Enrollment ID"])
        .filter(Boolean);
    } else if (bcAudience === "Selected") {
      targets = selectedClientIds;
    }

    if (targets.length === 0) {
      toast.error("No recipient clients found matching the selected audience.");
      setSendingBroadcast(false);
      return;
    }

    const webhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;
    const isOffline = isWebhookOffline(webhookUrl);

    // Prepare Notification Submit
    const notificationPayload = {
      action: "webhookSubmit",
      sheetName: "Notifications",
      "Notification ID": bcId,
      Title: bcTitle,
      Message: bcMessage,
      Sender: user?.username || "admin",
      Date: nowStr,
      "Recipients Type": bcAudience,
      "Recipients List": targets.join(","),
    };

    if (isOffline) {
      setTimeout(() => {
        // 1. Add notification
        if (!data["Notifications"]) data["Notifications"] = [];
        data["Notifications"].unshift({
          "Notification ID": bcId,
          Title: bcTitle,
          Message: bcMessage,
          Sender: user?.username || "admin",
          Date: nowStr,
          "Recipients Type": bcAudience,
          "Recipients List": targets.join(","),
        });

        // 2. Deliver to recipients
        if (!data["Notification Recipients"]) data["Notification Recipients"] = [];
        targets.forEach((id: string) => {
          data["Notification Recipients"].unshift({
            "Notification ID": bcId,
            "Client ID": id,
            "Read Status": "Unread",
            "Read Date": "",
          });
        });

        localStorage.setItem("optivita_crm_cache", JSON.stringify(data));
        toast.success(`Broadcast delivered successfully to ${targets.length} clients!`);
        setBcTitle("");
        setBcMessage("");
        setBcAudience("All");
        setSelectedClientIds([]);
        setSendingBroadcast(false);
        refreshData();
      }, 800);
      return;
    }

    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(notificationPayload),
      });
      const result = await res.json();

      if (result.status === "success") {
        // Deliver recipients (simulate or batch webhook submits)
        for (const targetId of targets) {
          await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({
              action: "webhookSubmit",
              sheetName: "Notification Recipients",
              "Notification ID": bcId,
              "Client ID": targetId,
              "Read Status": "Unread",
              "Read Date": "",
            }),
          });
        }
        toast.success(`Broadcast synced and delivered to ${targets.length} clients!`);
        setBcTitle("");
        setBcMessage("");
        setBcAudience("All");
        setSelectedClientIds([]);
        refreshData();
      } else {
        toast.error("Failed to submit broadcast.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Network error. Unable to dispatch broadcast.");
    } finally {
      setSendingBroadcast(false);
    }
  };

  // 2. Send Secure Chat Message
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInputText.trim() || !selectedClientChat) return;

    setSendingMessage(true);
    const msgId = "MSG-2026-00" + (rawMessages.length + 101);
    const now = new Date();
    const timestampStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} | ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

    const targetRecipientId = String(
      selectedClientChat.id || selectedClientChat["Enrollment ID"] || selectedClientChat.StaffId
    ).trim().toUpperCase();

    const messageText = chatInputText.trim();
    setChatInputText("");

    try {
      if (db) {
        // Send instantly via Firestore
        await addDoc(collection(db, "private_messages"), {
          senderId: "admin",
          senderType: "Admin",
          recipientId: targetRecipientId,
          message: messageText,
          timestamp: timestampStr,
          createdAt: serverTimestamp(),
        });
      }

      // Sync with Sheets background API
      const webhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;
      if (webhookUrl && !isWebhookOffline(webhookUrl)) {
        fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({
            action: "webhookSubmit",
            sheetName: "Messages",
            "Message ID": msgId,
            "Sender ID": "admin",
            "Sender Type": "Admin",
            "Recipient ID": targetRecipientId,
            Message: messageText,
            Timestamp: timestampStr,
          }),
        }).catch((err) => console.warn("Google Sheets background sync failed:", err));
      }
    } catch (error: any) {
      console.error("Firestore message send error:", error);
      toast.error("Failed to send message via Firestore: " + error.message);
    } finally {
      setSendingMessage(false);
    }
  };

  // Filter active lists based on type (Clients vs Employees)
  const baseChatSource =
    chatListType === "clients"
      ? enrollments.map((en: any) => ({ ...en, id: en["Enrollment ID"], isClient: true }))
      : staffList.map((st: any) => ({ ...st, id: st.StaffId, fullName: st.Name, isClient: false }));

  const filteredChatItems = baseChatSource.filter((item: any) => {
    const search = chatSearch.toLowerCase();
    const itemId = String(item.id || "").trim();
    const itemName = String(item.fullName || "")
      .trim()
      .toLowerCase();
    const itemRole = String(item.Role || "").toLowerCase();
    const matchesSearch =
      itemName.includes(search) ||
      itemId.toLowerCase().includes(search) ||
      itemRole.includes(search);

    if (!matchesSearch) return false;

    // Filter by Archived status
    const isArchived = archivedClientIds.includes(itemId);
    if (chatFilter === "Archived") {
      return isArchived;
    } else if (isArchived) {
      return false; // Hide archived by default
    }

    if (chatFilter === "Favorites") {
      return favoriteClientIds.includes(itemId);
    }

    if (chatFilter === "Unread") {
      const thread = rawMessages.filter((m: any) => {
        const sender = String(m["Sender ID"] || m.SenderID || "").trim();
        const recipient = String(m["Recipient ID"] || m.RecipientID || "").trim();
        return sender === itemId || recipient === itemId;
      });
      const lastMsg = thread[thread.length - 1];
      return lastMsg && (lastMsg["Sender Type"] || lastMsg.SenderType) !== "Admin";
    }

    if (chatFilter === "Online") {
      // Simulate online status based on char sum
      const sum = itemId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
      return sum % 2 === 1;
    }

    return true;
  });

  // Sort by last message date
  const sortedChatClients = [...filteredChatItems].sort((a: any, b: any) => {
    const idA = String(a.id || "").trim();
    const idB = String(b.id || "").trim();

    const threadA = rawMessages.filter((m: any) => {
      const sender = String(m["Sender ID"] || m.SenderID || "").trim();
      const recipient = String(m["Recipient ID"] || m.RecipientID || "").trim();
      return sender === idA || recipient === idA;
    });

    const threadB = rawMessages.filter((m: any) => {
      const sender = String(m["Sender ID"] || m.SenderID || "").trim();
      const recipient = String(m["Recipient ID"] || m.RecipientID || "").trim();
      return sender === idB || recipient === idB;
    });

    const lastA = threadA[threadA.length - 1];
    const lastB = threadB[threadB.length - 1];

    if (!lastA && !lastB) return 0;
    if (!lastA) return 1;
    if (!lastB) return -1;

    const timeA = String(lastA.Timestamp || lastA.timestamp || "");
    const timeB = String(lastB.Timestamp || lastB.timestamp || "");
    return timeB.localeCompare(timeA);
  });

  // Get active chat thread messages
  const activeChatMessages = rawMessages
    .filter((m: any) => {
      if (!selectedClientChat) return false;
      const sender = String(m["Sender ID"] || m.SenderID || "").trim();
      const recipient = String(m["Recipient ID"] || m.RecipientID || "").trim();
      const targetId =
        selectedClientChat.id || selectedClientChat["Enrollment ID"] || selectedClientChat.StaffId;
      return (
        (sender === "admin" && recipient === targetId) ||
        (sender === targetId && recipient === "admin")
      );
    })
    .sort((a: any, b: any) => {
      const tA =
        new Date(String(a.Timestamp || a.timestamp || "").replace(" | ", " ")).getTime() || 0;
      const tB =
        new Date(String(b.Timestamp || b.timestamp || "").replace(" | ", " ")).getTime() || 0;
      return tA - tB;
    });

  const loadTemplateToBroadcast = (temp: any) => {
    setBcTitle(temp.name || temp.title || "");
    setBcMessage(temp.body || "");
  };

  const handleOpenAddTemplate = () => {
    setEditingTemplate(null);
    setTemplateName("");
    setTemplateCategory("Welcome");
    setTemplateSubject("");
    setTemplateBody("");
    setTemplateChannels(["Email"]);
    setShowTemplateModal(true);
  };

  const handleOpenEditTemplate = (temp: any) => {
    setEditingTemplate(temp);
    setTemplateName(temp.name);
    setTemplateCategory(temp.category);
    setTemplateSubject(temp.subject || "");
    setTemplateBody(temp.body);
    setTemplateChannels(temp.channels || ["Email"]);
    setShowTemplateModal(true);
  };

  const handleSaveTemplateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim() || !templateBody.trim()) {
      toast.error("Template name and message body are required.");
      return;
    }

    if (editingTemplate) {
      const updated = msgTemplates.map((t) =>
        t.id === editingTemplate.id
          ? {
              ...t,
              name: templateName,
              category: templateCategory,
              subject: templateSubject,
              body: templateBody,
              channels: templateChannels,
            }
          : t,
      );
      saveTemplates(updated);
      toast.success("Message template updated successfully!");
    } else {
      const newTemp = {
        id: "T-" + (msgTemplates.length + 1) + "-" + Math.floor(100 + Math.random() * 900),
        name: templateName,
        category: templateCategory,
        subject: templateSubject,
        body: templateBody,
        channels: templateChannels,
      };
      saveTemplates([...msgTemplates, newTemp]);
      toast.success("New message template created!");
    }
    setShowTemplateModal(false);
  };

  const handleDeleteTemplate = (id: string) => {
    if (window.confirm("Are you sure you want to delete this template?")) {
      const filtered = msgTemplates.filter((t) => t.id !== id);
      saveTemplates(filtered);
      toast.success("Template deleted.");
    }
  };

  const handleDuplicateTemplate = (temp: any) => {
    const duplicated = {
      ...temp,
      id: "T-" + (msgTemplates.length + 1) + "-" + Math.floor(100 + Math.random() * 900),
      name: temp.name + " (Copy)",
    };
    saveTemplates([...msgTemplates, duplicated]);
    toast.success("Template duplicated successfully!");
  };

  const handlePreviewTemplate = (temp: any) => {
    setPreviewingTemplate(temp);
    setShowPreviewModal(true);
  };

  const triggerMockDeliveryTest = () => {
    toast.success(
      `Success! Mock test template delivered to [${testSendRecipient}] via ${testSendChannel}!`,
    );
    setShowPreviewModal(false);
  };

  const loadTemplateToChat = (temp: any) => {
    if (!selectedClientChat) {
      toast.error("Please pick a client chat thread first.");
      return;
    }
    const resolvedBody = temp.body
      .replace(/{Name}/g, selectedClientChat.fullName)
      .replace(/{InvoiceID}/g, `INV-${selectedClientChat["Enrollment ID"].split("-").pop()}`);
    setChatInputText(resolvedBody);
    toast.success(`Canned template loaded for ${selectedClientChat.fullName}!`);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-3xl tracking-tight">
            Communication Center
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Broadcast portal announcements, schedule templates, and secure chat with registered
            clients.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200/40 dark:border-slate-800/60">
          <button
            onClick={() => setActiveTab("broadcast")}
            className={`flex items-center gap-2 px-4.5 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
              activeTab === "broadcast"
                ? "bg-white dark:bg-slate-800 shadow-soft text-emerald-600 dark:text-emerald-400"
                : "text-slate-500"
            }`}
          >
            <Bell className="h-4 w-4" /> Broadcast Notification
          </button>
          <button
            onClick={() => setActiveTab("chats")}
            className={`flex items-center gap-2 px-4.5 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
              activeTab === "chats"
                ? "bg-white dark:bg-slate-800 shadow-soft text-emerald-600 dark:text-emerald-400"
                : "text-slate-500"
            }`}
          >
            <MessageSquare className="h-4 w-4" /> Private Messaging
          </button>
          <button
            onClick={() => setActiveTab("templates")}
            className={`flex items-center gap-2 px-4.5 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
              activeTab === "templates"
                ? "bg-white dark:bg-slate-800 shadow-soft text-emerald-600 dark:text-emerald-400"
                : "text-slate-500"
            }`}
          >
            <FileText className="h-4 w-4" /> Templates
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-4.5 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
              activeTab === "history"
                ? "bg-white dark:bg-slate-800 shadow-soft text-emerald-600 dark:text-emerald-400"
                : "text-slate-500"
            }`}
          >
            <History className="h-4 w-4" /> History
          </button>
        </div>
      </div>

      {/* --- BROADCAST NOTIFICATION CREATOR --- */}
      {activeTab === "broadcast" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[28px] p-6 shadow-soft text-left space-y-4">
            <h3 className="font-display font-extrabold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-500" /> New Portal Announcement Broadcast
            </h3>
            <p className="text-xs text-slate-400">
              Send notifications that populate directly in the client portal notification bell
              dropdown menu.
            </p>

            <form onSubmit={handleSendBroadcast} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">
                    Recipient Audience
                  </label>
                  <select
                    value={bcAudience}
                    onChange={(e: any) => setBcAudience(e.target.value)}
                    className="w-full p-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-800 dark:text-slate-200"
                  >
                    <option value="All">All Clients (Broadcast)</option>
                    <option value="Active">Active / Confirmed Clients Only</option>
                    <option value="Expired">Expired / Suspended Clients Only</option>
                    <option value="Selected">Selected Specific Clients</option>
                  </select>
                </div>

                {bcAudience === "Selected" && (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">
                      Choose Specific Clients
                    </label>
                    <div className="border rounded-xl p-2 max-h-[120px] overflow-y-auto bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 space-y-1">
                      {enrollments.map((en: any) => {
                        const cid = en["Enrollment ID"];
                        const checked = selectedClientIds.includes(cid);
                        return (
                          <label
                            key={cid}
                            className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-350 cursor-pointer hover:bg-slate-100/50 p-1 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                if (checked) {
                                  setSelectedClientIds((prev) => prev.filter((x) => x !== cid));
                                } else {
                                  setSelectedClientIds((prev) => [...prev, cid]);
                                }
                              }}
                              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            {en.fullName} ({cid})
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">
                  Notification Title
                </label>
                <input
                  type="text"
                  value={bcTitle}
                  onChange={(e) => setBcTitle(e.target.value)}
                  placeholder="e.g. New Customized Meal Plan Uploaded"
                  className="w-full p-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">
                  Broadcast Message
                </label>
                <textarea
                  rows={5}
                  value={bcMessage}
                  onChange={(e) => setBcMessage(e.target.value)}
                  placeholder="Type announcement body details here..."
                  className="w-full p-3 text-xs border rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={sendingBroadcast}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-soft transition-colors disabled:opacity-50"
              >
                <Send className="h-4.5 w-4.5" />{" "}
                {sendingBroadcast ? "Sending Broadcast..." : "Dispatch Broadcast Notification"}
              </button>
            </form>
          </div>

          {/* Quick template load side-card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[28px] p-6 shadow-soft text-left space-y-4 h-fit">
            <h4 className="font-bold text-xs uppercase text-slate-400 tracking-wider">
              Quick Launch Templates
            </h4>
            <div className="space-y-3.5">
              {templates.map((temp) => (
                <div
                  key={temp.id}
                  onClick={() => loadTemplateToBroadcast(temp)}
                  className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-emerald-500/30 hover:bg-slate-50/50 dark:hover:bg-slate-950/40 cursor-pointer transition-all duration-200"
                >
                  <p className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                    {temp.title}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{temp.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- PRIVATE SECURE MESSAGES VIEW (WHATSAPP INTERFACE) --- */}
      {activeTab === "chats" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 bg-white dark:bg-[#111b21] border border-slate-200/80 dark:border-[#222d34] rounded-[24px] shadow-soft overflow-hidden h-[calc(100vh-280px)] min-h-[420px] max-h-[580px] text-left">
          {/* Custom CSS Style injected for WhatsApp-style chat bubble background grid and scrollbar overrides */}
          <style
            dangerouslySetInnerHTML={{
              __html: `
            .whatsapp-chat-container {
              background-color: #efeae2;
              background-image: radial-gradient(#dfdcd6 1.2px, transparent 0), radial-gradient(#dfdcd6 1.2px, #efeae2 1.2px);
              background-size: 12px 12px;
              background-position: 0 0, 6px 6px;
            }
            .dark .whatsapp-chat-container {
              background-color: #0b141a;
              background-image: radial-gradient(#182229 1.2px, transparent 0), radial-gradient(#182229 1.2px, #0b141a 1.2px);
              background-size: 12px 12px;
              background-position: 0 0, 6px 6px;
            }
            /* Premium scrollbars for conversation rows and message log */
            .overflow-y-auto::-webkit-scrollbar {
              width: 6px !important;
              height: 6px !important;
            }
            .overflow-y-auto::-webkit-scrollbar-track {
              background: transparent !important;
            }
            .overflow-y-auto::-webkit-scrollbar-thumb {
              background: #cbd5e1 !important;
              border-radius: 4px !important;
            }
            .dark .overflow-y-auto::-webkit-scrollbar-thumb {
              background: #334155 !important;
            }
          `,
            }}
          />

          {/* Left panel: Clients List (WhatsApp style) */}
          <div
            className={`lg:col-span-1 border-r border-[#e9edef] dark:border-[#222d34] flex flex-col h-full overflow-hidden bg-white dark:bg-[#111b21] ${selectedClientChat ? "hidden lg:flex" : "flex"}`}
          >
            {/* Left Panel Header */}
            <div className="h-[60px] bg-[#f0f2f5] dark:bg-[#202c33] flex items-center justify-between px-4 py-2 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                  {user?.username.slice(0, 2).toUpperCase() || "AD"}
                </div>
                <span className="font-extrabold text-sm text-[#111b21] dark:text-[#e9edef] tracking-tight">
                  Chats
                </span>
              </div>
              <div className="flex items-center gap-3.5 text-[#54656f] dark:text-[#aebac1]">
                <button
                  title="New Chat"
                  className="p-1 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-750 transition-colors"
                >
                  <Plus className="h-5 w-5" />
                </button>
                <button
                  title="Menu"
                  className="p-1 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-750 transition-colors"
                >
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Sub-navigation inside Chat list for Clients vs Employees */}
            <div className="flex border-b border-[#e9edef] dark:border-[#222d34] shrink-0 text-center font-bold text-[10px] uppercase tracking-wide bg-slate-50/50 dark:bg-[#182229]">
              <button
                onClick={() => {
                  setChatListType("clients");
                  setSelectedClientChat(null);
                }}
                className={`flex-1 py-3 transition-all ${
                  chatListType === "clients"
                    ? "text-[#008069] dark:text-[#00a884] border-b-2 border-[#008069] dark:border-[#00a884] font-black bg-white dark:bg-[#111b21]"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/30 dark:hover:bg-slate-900/10"
                }`}
              >
                Clients ({enrollments.length})
              </button>
              <button
                onClick={() => {
                  setChatListType("employees");
                  setSelectedClientChat(null);
                }}
                className={`flex-1 py-3 transition-all ${
                  chatListType === "employees"
                    ? "text-[#008069] dark:text-[#00a884] border-b-2 border-[#008069] dark:border-[#00a884] font-black bg-white dark:bg-[#111b21]"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/30 dark:hover:bg-slate-900/10"
                }`}
              >
                Employees ({staffList.length})
              </button>
            </div>

            {/* Search Input Box */}
            <div className="p-2 bg-white dark:bg-[#111b21] border-b border-[#e9edef] dark:border-[#222d34] shrink-0">
              <div className="relative flex items-center bg-[#f0f2f5] dark:bg-[#202c33] rounded-lg px-3 py-1.5">
                <Search className="h-4 w-4 text-slate-400 dark:text-[#8696a0] mr-2 shrink-0" />
                <input
                  type="text"
                  value={chatSearch}
                  onChange={(e) => setChatSearch(e.target.value)}
                  placeholder={`Search ${chatListType}...`}
                  className="w-full text-xs bg-transparent border-none focus:outline-none text-[#111b21] dark:text-[#e9edef] placeholder-slate-450 dark:placeholder-[#8696a0]"
                />
              </div>
            </div>

            {/* Filter Pills / Segments */}
            <div className="px-3 py-2 flex gap-1.5 overflow-x-auto bg-white dark:bg-[#111b21] border-b border-[#e9edef] dark:border-[#222d34] shrink-0 scrollbar-none">
              {(["All", "Unread", "Favorites", "Online", "Archived"] as const).map((pill) => {
                const active = chatFilter === pill;
                return (
                  <button
                    key={pill}
                    onClick={() => setChatFilter(pill)}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold shrink-0 transition-all ${
                      active
                        ? "bg-[#e7f5f4] text-[#008069] dark:bg-[#00a884]/15 dark:text-[#00a884] border border-[#008069]/20"
                        : "bg-[#f0f2f5] hover:bg-[#e9edef] dark:bg-[#202c33] dark:hover:bg-[#2a3942] text-[#54656f] dark:text-[#8696a0]"
                    }`}
                  >
                    {pill}
                  </button>
                );
              })}
            </div>

            {/* Chat list (Independent scrolling) */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#f0f2f5]/80 dark:divide-[#222d34]/60 bg-white dark:bg-[#111b21]">
              {sortedChatClients.length > 0 ? (
                sortedChatClients.map((client: any) => {
                  const isSelected = selectedClientChat?.id === client.id;

                  // Get last message in thread
                  const thread = rawMessages.filter((m: any) => {
                    const sender = String(m["Sender ID"] || m.SenderID || "").trim();
                    const recipient = String(m["Recipient ID"] || m.RecipientID || "").trim();
                    return sender === client.id || recipient === client.id;
                  });
                  const lastMsg = thread[thread.length - 1];
                  const isUnread =
                    lastMsg && (lastMsg["Sender Type"] || lastMsg.SenderType) !== "Admin";

                  // Extract date/time from last message
                  let timeStr = "";
                  if (lastMsg) {
                    const ts = String(lastMsg.Timestamp || lastMsg.timestamp || "");
                    const parts = ts.split(" | ");
                    if (parts.length === 2) {
                      const dateObj = parts[0];
                      const timeObj = parts[1].slice(0, 5); // HH:MM
                      const today = new Date().toISOString().split("T")[0];
                      timeStr = dateObj === today ? timeObj : dateObj.slice(5);
                    } else {
                      timeStr = ts.slice(0, 10);
                    }
                  }

                  // Pick unique color based on name for avatar
                  const colors = [
                    "bg-[#00a884]",
                    "bg-[#3498db]",
                    "bg-[#9b59b6]",
                    "bg-[#e67e22]",
                    "bg-[#e74c3c]",
                  ];
                  const charCodeSum = String(client.fullName)
                    .split("")
                    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
                  const avatarColor = colors[charCodeSum % colors.length];

                  const isFav = favoriteClientIds.includes(client.id);

                  return (
                    <div
                      key={client.id}
                      className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-all relative ${
                        isSelected
                          ? "bg-[#f0f2f5] dark:bg-[#2a3942]"
                          : "hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]/40"
                      }`}
                    >
                      <div
                        onClick={() => {
                          setSelectedClientChat(client);
                          setChatInputText("");
                        }}
                        className="flex items-center gap-3.5 min-w-0 flex-1"
                      >
                        <div
                          className={`h-11 w-11 rounded-full ${avatarColor} text-white flex items-center justify-center font-bold text-sm shrink-0 relative shadow-sm`}
                        >
                          {client.fullName.slice(0, 2).toUpperCase()}
                          {(chatFilter === "Online" || client.id.charCodeAt(0) % 2 === 1) && (
                            <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 bg-[#00a884] rounded-full border-2 border-white dark:border-[#111b21]" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1 leading-tight space-y-1">
                          <div className="flex justify-between items-baseline gap-2">
                            <span className="font-semibold text-xs text-[#111b21] dark:text-[#e9edef] truncate flex items-center gap-1">
                              {client.fullName}
                              {isFav && (
                                <span className="text-yellow-500 text-[10px]" title="Favorite">
                                  ★
                                </span>
                              )}
                            </span>
                            <span
                              className={`text-[10px] shrink-0 font-medium ${isUnread ? "text-[#00a884] font-bold" : "text-slate-400"}`}
                            >
                              {timeStr}
                            </span>
                          </div>
                          <div className="flex justify-between items-center gap-2">
                            <p className="text-[11px] text-[#667781] dark:text-[#8696a0] truncate flex items-center gap-1 flex-1">
                              {lastMsg &&
                                (lastMsg.SenderType === "Admin" ? (
                                  <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb] shrink-0" />
                                ) : null)}
                              {lastMsg ? lastMsg.Message : "No conversation history"}
                            </p>
                            {isUnread && (
                              <span className="h-4.5 min-w-4.5 px-1 bg-[#00a884] text-white text-[9px] font-black rounded-full flex items-center justify-center shrink-0">
                                1
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Hover actions: Star or Archive */}
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 bg-inherit px-2 py-1 rounded shadow">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(client.id);
                          }}
                          className="p-1 hover:text-yellow-500 text-slate-400"
                          title="Toggle Favorite"
                        >
                          ★
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleArchive(client.id);
                          }}
                          className="p-1 hover:text-blue-500 text-slate-400"
                          title="Archive Chat"
                        >
                          📥
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                  No {chatListType} found under this filter.
                </div>
              )}
            </div>
          </div>

          {/* Right panel: Active Chat Thread Window (WhatsApp style) */}
          <div
            className={`lg:col-span-3 flex h-full bg-[#efeae2] dark:bg-[#0b141a] relative overflow-hidden ${selectedClientChat ? "flex" : "hidden lg:flex"}`}
          >
            {selectedClientChat ? (
              <div className="flex-1 flex flex-col h-full relative min-w-0">
                {/* Chat window Header */}
                <div className="h-[60px] bg-[#f0f2f5] dark:bg-[#202c33] border-b border-[#e9edef] dark:border-[#222d34] flex items-center justify-between px-6 shrink-0 z-10 shadow-xs">
                  <div
                    onClick={() => setShowClientDetailsDrawer(!showClientDetailsDrawer)}
                    className="flex items-center gap-3.5 min-w-0 cursor-pointer hover:opacity-85 flex-1"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClientChat(null);
                      }}
                      className="lg:hidden p-1 mr-1.5 rounded-full hover:bg-slate-250 dark:hover:bg-slate-700 text-slate-500 shrink-0"
                      title="Back to List"
                    >
                      <ChevronLeft className="h-4.5 w-4.5" />
                    </button>
                    <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-650 dark:text-slate-350 text-sm">
                      {selectedClientChat.fullName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 leading-tight">
                      <h4 className="font-semibold text-xs text-[#111b21] dark:text-[#e9edef] truncate">
                        {selectedClientChat.fullName}
                      </h4>
                      <p className="text-[10px] text-emerald-600 dark:text-[#00a884] font-bold mt-0.5 tracking-wide flex items-center gap-1">
                        <span className="h-1.5 w-1.5 bg-[#00a884] rounded-full inline-block animate-ping" />
                        online
                      </p>
                    </div>
                  </div>

                  {/* WhatsApp right icons + templates selector */}
                  <div className="flex items-center gap-5 text-[#54656f] dark:text-[#aebac1]">
                    <button
                      title="Video Call"
                      className="p-1 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Video className="h-4.5 w-4.5" />
                    </button>
                    <button
                      title="Phone Call"
                      className="p-1 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Phone className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setShowClientDetailsDrawer(!showClientDetailsDrawer)}
                      title="View Details Info"
                      className={`p-1 rounded-full transition-all ${showClientDetailsDrawer ? "bg-slate-200 text-[#00a884]" : "hover:bg-slate-200/50 dark:hover:bg-slate-700"}`}
                    >
                      <Info className="h-4.5 w-4.5" />
                    </button>

                    <select
                      onChange={(e) => {
                        const temp = msgTemplates.find((t) => t.id === e.target.value);
                        if (temp) loadTemplateToChat(temp);
                        e.target.value = "";
                      }}
                      className="p-1.5 border rounded-lg text-[9px] font-bold bg-white dark:bg-[#202c33] border-[#e9edef] dark:border-[#2a3942] text-slate-600 dark:text-slate-350 cursor-pointer focus:outline-none"
                    >
                      <option value="">Insert Custom Template...</option>
                      {msgTemplates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Conversation area (WhatsApp background, Independent scroll) */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 whatsapp-chat-container">
                  {activeChatMessages.length > 0 ? (
                    activeChatMessages.map((m: any, idx: number) => {
                      const isMe = (m["Sender Type"] || m.SenderType) === "Admin";
                      const time =
                        String(m.Timestamp || m.timestamp || "").split(" | ")[1] || "Just now";

                      const prevMsg = activeChatMessages[idx - 1];
                      const currentDate =
                        String(m.Timestamp || m.timestamp || "").split(" | ")[0] || "Unknown";
                      const prevDate = prevMsg
                        ? String(prevMsg.Timestamp || prevMsg.timestamp || "").split(" | ")[0] ||
                          "Unknown"
                        : "";
                      const showDateSeparator = currentDate !== prevDate;

                      const getFriendlyDate = (dateStr: string) => {
                        try {
                          const today = new Date().toISOString().split("T")[0];
                          const yesterdayObj = new Date();
                          yesterdayObj.setDate(yesterdayObj.getDate() - 1);
                          const yesterday = yesterdayObj.toISOString().split("T")[0];

                          if (dateStr === today) return "Today";
                          if (dateStr === yesterday) return "Yesterday";

                          const parts = dateStr.split("-");
                          if (parts.length === 3) {
                            const months = [
                              "Jan",
                              "Feb",
                              "Mar",
                              "Apr",
                              "May",
                              "Jun",
                              "Jul",
                              "Aug",
                              "Sep",
                              "Oct",
                              "Nov",
                              "Dec",
                            ];
                            return `${parts[2]} ${months[parseInt(parts[1], 10) - 1]} ${parts[0]}`;
                          }
                          return dateStr;
                        } catch (e) {
                          return dateStr;
                        }
                      };

                      return (
                        <div key={m["Message ID"] || m.MessageID} className="space-y-3">
                          {/* Date badge */}
                          {showDateSeparator && (
                            <div className="flex justify-center my-3">
                              <span className="px-3 py-1 bg-white dark:bg-[#182229] border border-slate-100 dark:border-none rounded-lg text-[10px] font-bold text-slate-500 dark:text-[#8696a0] shadow-xs select-none uppercase tracking-wide">
                                {getFriendlyDate(currentDate)}
                              </span>
                            </div>
                          )}

                          {/* Message Bubble */}
                          <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                            <div
                              className={`max-w-[65%] rounded-xl px-3 py-1.5 text-xs shadow-xs relative leading-normal ${
                                isMe
                                  ? "bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] rounded-tr-none"
                                  : "bg-white dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] rounded-tl-none border border-white dark:border-none"
                              }`}
                            >
                              <p className="pr-12 break-words whitespace-pre-wrap">
                                {m.Message || m.message}
                              </p>

                              <span className="absolute bottom-1 right-2 text-[9px] text-[#667781] dark:text-[#8696a0] flex items-center gap-0.5 select-none">
                                {time.slice(0, 5)}
                                {isMe && (
                                  <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb] ml-0.5 inline shrink-0" />
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-8 select-none leading-normal">
                      <MessageSquare className="h-10 w-10 text-slate-350 dark:text-slate-650 mb-2" />
                      <p className="font-semibold text-xs text-slate-600 dark:text-slate-400">
                        No message history
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 max-w-xs mt-1">
                        Send a message to initiate private messaging with{" "}
                        {selectedClientChat.fullName}.
                      </p>
                    </div>
                  )}

                  {/* Typing Indicator simulation */}
                  {isClientTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white dark:bg-[#202c33] text-slate-500 rounded-xl rounded-tl-none px-3.5 py-2 text-xs shadow-xs flex items-center gap-1.5">
                        <span className="font-bold">{selectedClientChat.fullName} is typing</span>
                        <span className="flex gap-0.5 items-center">
                          <span
                            className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          />
                          <span
                            className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          />
                          <span
                            className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          />
                        </span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input bar (WhatsApp style) */}
                <div className="p-3.5 bg-[#f0f2f5] dark:bg-[#202c33] border-t border-[#e9edef] dark:border-[#222d34] flex items-center gap-3.5 shrink-0 z-10 relative">
                  {/* Emoji Picker Popover */}
                  {showEmojiPicker && (
                    <div className="absolute bottom-[60px] left-4 bg-white dark:bg-[#233138] border border-[#e9edef] dark:border-[#2f3b43] rounded-2xl p-3 shadow-glow z-30 grid grid-cols-6 gap-2 w-52 animate-scale-up select-none text-center">
                      {["😀", "😂", "😍", "👍", "🔥", "🙏", "🎉", "🚀", "💪", "🥗", "🥑", "💧"].map(
                        (emoji) => (
                          <span
                            key={emoji}
                            onClick={() => {
                              setChatInputText((prev) => prev + emoji);
                              setShowEmojiPicker(false);
                            }}
                            className="text-lg hover:scale-125 cursor-pointer transition-transform inline-block"
                          >
                            {emoji}
                          </span>
                        ),
                      )}
                    </div>
                  )}

                  {/* Attachments Menu Popover */}
                  {showAttachmentMenu && (
                    <div className="absolute bottom-[60px] left-12 bg-white dark:bg-[#233138] border border-[#e9edef] dark:border-[#2f3b43] rounded-2xl p-2.5 shadow-glow z-30 flex flex-col gap-1.5 text-xs text-left w-36 select-none animate-scale-up">
                      <button
                        type="button"
                        onClick={() => {
                          setChatInputText(
                            (prev) => prev + " [📎 Attached Image: client_weight_chart.jpg] ",
                          );
                          setShowAttachmentMenu(false);
                          toast.success("Image file attached successfully!");
                        }}
                        className="px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-[#182229] rounded-lg font-bold flex items-center gap-1.5 text-slate-700 dark:text-slate-200"
                      >
                        📷 Document / Image
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setChatInputText(
                            (prev) => prev + " [📎 Attached Document: blood_lab_report.pdf] ",
                          );
                          setShowAttachmentMenu(false);
                          toast.success("Lab PDF report attached successfully!");
                        }}
                        className="px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-[#182229] rounded-lg font-bold flex items-center gap-1.5 text-slate-700 dark:text-slate-200"
                      >
                        📄 Health Report
                      </button>
                    </div>
                  )}

                  <Smile
                    onClick={() => {
                      setShowEmojiPicker(!showEmojiPicker);
                      setShowAttachmentMenu(false);
                    }}
                    className={`h-6 w-6 text-[#54656f] dark:text-[#aebac1] hover:text-[#111b21] dark:hover:text-[#e9edef] cursor-pointer transition-colors ${showEmojiPicker ? "text-emerald-600" : ""}`}
                  />
                  <Paperclip
                    onClick={() => {
                      setShowAttachmentMenu(!showAttachmentMenu);
                      setShowEmojiPicker(false);
                    }}
                    className={`h-5 w-5 text-[#54656f] dark:text-[#aebac1] hover:text-[#111b21] dark:hover:text-[#e9edef] cursor-pointer transition-colors ${showAttachmentMenu ? "text-emerald-600" : ""}`}
                  />

                  <form onSubmit={handleSendChatMessage} className="flex-1 flex gap-3">
                    <input
                      type="text"
                      value={chatInputText}
                      onChange={(e) => setChatInputText(e.target.value)}
                      placeholder="Type a message"
                      disabled={sendingMessage}
                      className="flex-1 px-4 py-2.5 bg-white dark:bg-[#2a3942] border-none rounded-lg text-xs focus:outline-none text-[#111b21] dark:text-[#e9edef] placeholder-[#667781] dark:placeholder-[#8696a0]"
                    />
                    <button
                      type="submit"
                      disabled={sendingMessage || !chatInputText.trim()}
                      className="h-9 w-9 bg-[#00a884] hover:bg-[#008069] text-white flex items-center justify-center rounded-full transition-all shadow-md shrink-0"
                    >
                      <Send className="h-4.5 w-4.5" />
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="flex-1 h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-8 text-center select-none leading-normal">
                <MessageSquare className="h-12 w-12 text-[#00a884] mb-2 animate-bounce" />
                <p className="font-semibold text-xs text-slate-600 dark:text-slate-400">
                  WhatsApp Web Interface
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 max-w-xs mt-1">
                  Select a client or employee thread from the list on the left to review secure
                  communications, assess weekly updates, and dispatch replies.
                </p>
              </div>
            )}

            {/* Right Details Drawer Side Panel (Sliding contact info) */}
            {showClientDetailsDrawer && selectedClientChat && (
              <div className="w-80 border-l border-[#e9edef] dark:border-[#222d34] bg-white dark:bg-[#111b21] p-5 shrink-0 overflow-y-auto hidden md:flex flex-col justify-between h-full animate-fade-in relative z-20">
                <div className="space-y-6">
                  <div className="flex justify-between items-center pb-2 border-b border-[#e9edef] dark:border-[#222d34]">
                    <h4 className="font-extrabold text-xs text-slate-800 dark:text-[#e9edef] uppercase tracking-wider">
                      Contact Info
                    </h4>
                    <button
                      onClick={() => setShowClientDetailsDrawer(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Profile Card */}
                  <div className="text-center space-y-2">
                    <div className="h-20 w-20 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-2xl mx-auto shadow-sm">
                      {selectedClientChat.fullName.slice(0, 2).toUpperCase()}
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-[#e9edef]">
                      {selectedClientChat.fullName}
                    </h4>
                    <p className="text-[10px] text-slate-450 dark:text-slate-400">
                      ID: {selectedClientChat.id}
                    </p>
                  </div>

                  {/* Info Table */}
                  <div className="space-y-3.5 text-xs text-left">
                    <div className="border-b pb-2 border-slate-100 dark:border-slate-850">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Status</p>
                      <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {selectedClientChat.isClient
                          ? selectedClientChat["Joining Status"] || "Active"
                          : selectedClientChat.Status || "Active"}
                      </p>
                    </div>
                    {selectedClientChat.isClient && (
                      <>
                        <div className="border-b pb-2 border-slate-100 dark:border-slate-850">
                          <p className="text-[9px] font-bold text-slate-400 uppercase">
                            Assigned Program
                          </p>
                          <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                            {selectedClientChat.programName || "Precision Package"}
                          </p>
                        </div>
                        <div className="border-b pb-2 border-slate-100 dark:border-slate-850">
                          <p className="text-[9px] font-bold text-slate-400 uppercase">
                            Phone Number
                          </p>
                          <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                            {selectedClientChat.phone || "+965 1234 5678"}
                          </p>
                        </div>
                        <div className="border-b pb-2 border-slate-100 dark:border-slate-850">
                          <p className="text-[9px] font-bold text-slate-400 uppercase">
                            Email Address
                          </p>
                          <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                            {selectedClientChat.email || "support@optivita.com"}
                          </p>
                        </div>
                      </>
                    )}
                    {!selectedClientChat.isClient && (
                      <>
                        <div className="border-b pb-2 border-slate-100 dark:border-slate-850">
                          <p className="text-[9px] font-bold text-slate-400 uppercase">
                            Role / Specialty
                          </p>
                          <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                            {selectedClientChat.Role}
                          </p>
                        </div>
                        <div className="border-b pb-2 border-slate-100 dark:border-slate-850">
                          <p className="text-[9px] font-bold text-slate-400 uppercase">
                            Office Branch
                          </p>
                          <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                            {selectedClientChat.Branch}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 border-t pt-4 border-[#e9edef] dark:border-[#222d34]">
                  <button
                    onClick={() => handleToggleFavorite(selectedClientChat.id)}
                    className={`w-full py-2 border rounded-xl text-[10px] font-bold tracking-wide transition-all uppercase ${
                      favoriteClientIds.includes(selectedClientChat.id)
                        ? "bg-yellow-500/10 border-yellow-300 text-yellow-600"
                        : "bg-white dark:bg-slate-900 border-slate-200 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-605"
                    }`}
                  >
                    {favoriteClientIds.includes(selectedClientChat.id)
                      ? "★ Unstar Chat"
                      : "☆ Star Favorite"}
                  </button>
                  <button
                    onClick={() => handleToggleArchive(selectedClientChat.id)}
                    className={`w-full py-2 border rounded-xl text-[10px] font-bold tracking-wide transition-all uppercase ${
                      archivedClientIds.includes(selectedClientChat.id)
                        ? "bg-slate-500/10 border-slate-350 text-slate-600"
                        : "bg-white dark:bg-slate-900 border-slate-200 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-605"
                    }`}
                  >
                    {archivedClientIds.includes(selectedClientChat.id)
                      ? "📥 Unarchive Chat"
                      : "📥 Archive Chat"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- CANNED TEMPLATES DEFINITION TAB --- */}
      {activeTab === "templates" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[28px] p-6 shadow-soft text-left space-y-5">
          <div className="flex justify-between items-center flex-wrap gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="font-display font-extrabold text-lg text-slate-800 dark:text-slate-100">
                Message Templates
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Pre-approved communications for Emails, In-App Notifications, and WhatsApp
                integrations.
              </p>
            </div>
            <button
              onClick={handleOpenAddTemplate}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-full shadow-soft flex items-center gap-1"
            >
              <Plus className="h-4 w-4" /> Add Template
            </button>
          </div>

          {/* Variables Reference Panel */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950 border rounded-2xl text-[11px] text-slate-500 dark:text-slate-400 leading-normal space-y-2 border-slate-200 dark:border-slate-850">
            <p className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
              Supported Auto-Interpolation Variables
            </p>
            <p className="mt-1">
              Insert these keys exactly in your subject or body fields. The system will dynamically
              resolve them from the recipient's record when dispatched:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2 pt-1">
              <span className="bg-white dark:bg-slate-900 border px-2 py-1 rounded text-center font-bold">
                {"{{ClientName}}"}
              </span>
              <span className="bg-white dark:bg-slate-900 border px-2 py-1 rounded text-center font-bold">
                {"{{Nutritionist}}"}
              </span>
              <span className="bg-white dark:bg-slate-900 border px-2 py-1 rounded text-center font-bold">
                {"{{AppointmentDate}}"}
              </span>
              <span className="bg-white dark:bg-slate-900 border px-2 py-1 rounded text-center font-bold">
                {"{{InvoiceNo}}"}
              </span>
              <span className="bg-white dark:bg-slate-900 border px-2 py-1 rounded text-center font-bold">
                {"{{Amount}}"}
              </span>
              <span className="bg-white dark:bg-slate-900 border px-2 py-1 rounded text-center font-bold">
                {"{{PaymentLink}}"}
              </span>
            </div>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {msgTemplates.map((temp) => {
              const channels = temp.channels || ["Email"];
              return (
                <div
                  key={temp.id}
                  className="p-5 border rounded-2xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 hover:shadow-soft transition-all duration-200 flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-[8px] bg-slate-200 dark:bg-slate-850 px-2 py-0.5 rounded-full text-slate-500 font-bold uppercase tracking-wider">
                        {temp.id}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 uppercase">
                        {temp.category}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 mt-3">
                      {temp.name}
                    </h4>

                    {temp.subject && (
                      <p className="text-[10px] text-slate-450 dark:text-slate-400 mt-2 truncate">
                        <span className="font-bold">Subject:</span> {temp.subject}
                      </p>
                    )}

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed whitespace-pre-wrap italic">
                      "{temp.body.length > 120 ? temp.body.slice(0, 120) + "..." : temp.body}"
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-200/40 dark:border-slate-850 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider pb-1">
                      <span>Channels:</span>
                      <span className="text-[9px] text-[#0D4E8A] dark:text-emerald-400">
                        {channels.join(" • ")}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <button
                        onClick={() => {
                          setActiveTab("broadcast");
                          loadTemplateToBroadcast(temp);
                          toast.success("Broadcast composer populated!");
                        }}
                        className="py-2 bg-white dark:bg-slate-900 border text-slate-700 dark:text-slate-300 font-bold text-[9px] rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        Use Broadcast
                      </button>
                      <button
                        onClick={() => handlePreviewTemplate(temp)}
                        className="py-2 bg-[#e7f5f4] text-[#008069] font-bold text-[9px] rounded-lg hover:bg-[#d5eeec] transition-colors"
                      >
                        Preview & Test
                      </button>
                      <button
                        onClick={() => handleOpenEditTemplate(temp)}
                        className="py-2 bg-slate-200/50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[9px] rounded-lg hover:bg-slate-200 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDuplicateTemplate(temp)}
                        className="py-2 bg-slate-200/50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[9px] rounded-lg hover:bg-slate-200 transition-colors"
                      >
                        Duplicate
                      </button>
                    </div>

                    <button
                      onClick={() => handleDeleteTemplate(temp.id)}
                      className="w-full py-1 text-[9px] font-bold text-red-550 dark:text-red-400 hover:underline text-center"
                    >
                      Delete Template
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- ANNOUNCEMENT HISTORY TAB --- */}
      {activeTab === "history" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] shadow-soft overflow-hidden text-left">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-display font-extrabold text-lg text-slate-800 dark:text-slate-100">
              Broadcast Announcements History
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Audit log records of all push notifications sent to client portals.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold bg-slate-50/50 dark:bg-slate-900/40">
                  <th className="py-4 px-5">Notification ID</th>
                  <th className="py-4 px-5">Title</th>
                  <th className="py-4 px-5">Message Content</th>
                  <th className="py-4 px-5">Audience Filter</th>
                  <th className="py-4 px-5">Sender</th>
                  <th className="py-4 px-5">Submitted Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                {notifications.length > 0 ? (
                  notifications.map((n: any) => (
                    <tr
                      key={n["Notification ID"] || n.NotificationID}
                      className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors"
                    >
                      <td className="py-4 px-5 font-bold text-slate-400 dark:text-slate-500">
                        {n["Notification ID"] || n.NotificationID}
                      </td>
                      <td className="py-4 px-5 font-bold text-slate-800 dark:text-slate-105">
                        {n.Title || n.title}
                      </td>
                      <td
                        className="py-4 px-5 text-slate-500 max-w-xs truncate leading-normal"
                        title={n.Message || n.message}
                      >
                        {n.Message || n.message}
                      </td>
                      <td className="py-4 px-5">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full font-semibold text-[10px] text-slate-550">
                          {n["Recipients Type"] || n.RecipientsType || "All"}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-slate-400">{n.Sender || n.sender}</td>
                      <td className="py-4 px-5 text-slate-400">{n.Date || n.date}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-450 leading-normal">
                      <History className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      No broadcast push notification records in database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- MESSAGE TEMPLATES CRUD MODAL --- */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs text-left animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] max-w-lg w-full p-6 shadow-glow space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="font-display font-extrabold text-base text-slate-850 dark:text-slate-100">
                {editingTemplate ? "Edit Message Template" : "Add Message Template"}
              </h3>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="text-slate-400 hover:text-slate-650"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplateSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-400 uppercase tracking-wider">
                  Template Name
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g. Onboarding Welcome Alert"
                  className="w-full p-3 border rounded-xl bg-slate-50/50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-400 uppercase tracking-wider">
                    Category
                  </label>
                  <select
                    value={templateCategory}
                    onChange={(e) => setTemplateCategory(e.target.value)}
                    className="w-full p-3 border rounded-xl bg-slate-50/50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs focus:outline-none"
                  >
                    {[
                      "Welcome",
                      "Appointment Confirmation",
                      "Appointment Reminder",
                      "Payment Reminder",
                      "Invoice Generated",
                      "Invoice Paid",
                      "Nutrition Plan Ready",
                      "Follow-up Reminder",
                      "Weekly Motivation",
                      "Birthday Wishes",
                      "Custom Templates",
                    ].map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-400 uppercase tracking-wider">
                    Active Channels
                  </label>
                  <div className="flex gap-4 pt-3.5">
                    {["Email", "In-App", "WhatsApp"].map((ch) => {
                      const active = templateChannels.includes(ch);
                      return (
                        <label
                          key={ch}
                          className="flex items-center gap-1.5 font-semibold text-slate-650 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() => {
                              if (active) {
                                setTemplateChannels(templateChannels.filter((c) => c !== ch));
                              } else {
                                setTemplateChannels([...templateChannels, ch]);
                              }
                            }}
                            className="rounded text-emerald-600 focus:ring-emerald-500"
                          />
                          {ch}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {templateChannels.includes("Email") && (
                <div className="space-y-1">
                  <label className="font-bold text-slate-400 uppercase tracking-wider">
                    Email Subject Line
                  </label>
                  <input
                    type="text"
                    value={templateSubject}
                    onChange={(e) => setTemplateSubject(e.target.value)}
                    placeholder="e.g. Welcome to Optivita — Let's start your health plan!"
                    className="w-full p-3 border rounded-xl bg-slate-50/50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs focus:outline-none"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-slate-400 uppercase tracking-wider">
                  Message Content Body
                </label>
                <textarea
                  rows={6}
                  value={templateBody}
                  onChange={(e) => setTemplateBody(e.target.value)}
                  placeholder="Type your message details here. You can use standard template interpolation tags such as {{ClientName}}, {{Nutritionist}}, etc."
                  className="w-full p-3 border rounded-xl bg-slate-50/50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs focus:outline-none leading-relaxed"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3.5">
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-soft transition-all"
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- INTERACTIVE VISUAL DEVICE PREVIEW & SIMULATOR --- */}
      {showPreviewModal && previewingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs text-left animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] max-w-4xl w-full p-6 shadow-glow space-y-6 max-h-[95vh] overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Left Column: Visual Mock rendering */}
            <div className="space-y-4">
              <h3 className="font-display font-extrabold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                Live Channel Preview
              </h3>

              {/* Interpolation mapping */}
              {(() => {
                let interpolatedText = previewingTemplate.body || "";
                let interpolatedSubject = previewingTemplate.subject || "";

                const mockVals: any = {
                  "{{ClientName}}": "Jane Doe",
                  "{{Nutritionist}}": "Dr. Sarah Al-Sabah",
                  "{{AppointmentDate}}": "28-07-2026 | 10:30 AM",
                  "{{InvoiceNo}}": "INV-1005",
                  "{{Amount}}": "$500.00",
                  "{{PaymentLink}}": "https://optivita.com/portal/pay/INV-1005",
                };

                Object.keys(mockVals).forEach((key) => {
                  const val = mockVals[key];
                  interpolatedText = interpolatedText.replace(new RegExp(key, "g"), val);
                  interpolatedSubject = interpolatedSubject.replace(new RegExp(key, "g"), val);
                });

                return (
                  <div className="space-y-4">
                    {/* Simulated tabs for preview based on selected target channel */}
                    <div className="flex gap-2 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200/40 dark:border-slate-800">
                      {["Email", "WhatsApp", "In-App"].map((ch) => {
                        const hasChannel = (previewingTemplate.channels || ["Email"]).includes(ch);
                        const selected = testSendChannel === ch;
                        return (
                          <button
                            key={ch}
                            type="button"
                            onClick={() => hasChannel && setTestSendChannel(ch as any)}
                            disabled={!hasChannel}
                            className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                              selected
                                ? "bg-white dark:bg-slate-900 text-emerald-600 shadow-soft"
                                : "text-slate-400 opacity-60 cursor-not-allowed"
                            }`}
                          >
                            {ch}
                          </button>
                        );
                      })}
                    </div>

                    {/* Email Mock Box */}
                    {testSendChannel === "Email" && (
                      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white text-slate-800 overflow-hidden text-xs">
                        <div className="bg-slate-100 dark:bg-slate-850 p-3 border-b space-y-1 text-slate-500 font-medium">
                          <p>
                            <span className="font-bold text-slate-800">From:</span>{" "}
                            notifications@optivita.com
                          </p>
                          <p>
                            <span className="font-bold text-slate-800">To:</span>{" "}
                            jane.doe@example.com
                          </p>
                          <p>
                            <span className="font-bold text-slate-800">Subject:</span>{" "}
                            {interpolatedSubject || "Information Alert"}
                          </p>
                        </div>
                        <div className="p-5 min-h-[160px] bg-slate-50/30 whitespace-pre-wrap leading-relaxed">
                          {interpolatedText}
                        </div>
                      </div>
                    )}

                    {/* WhatsApp Mock Box */}
                    {testSendChannel === "WhatsApp" && (
                      <div className="border border-[#222d34] rounded-3xl bg-[#0b141a] overflow-hidden text-xs max-w-[340px] mx-auto shadow-md">
                        {/* Status bar */}
                        <div className="bg-[#202c33] px-4 py-2.5 flex items-center justify-between text-[#e9edef] border-b border-[#2a3942]">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px]">
                              OP
                            </div>
                            <div>
                              <p className="font-bold text-[10px]">Optivita Health</p>
                              <p className="text-[8px] text-emerald-400 font-semibold">online</p>
                            </div>
                          </div>
                        </div>
                        {/* Conversation bubble */}
                        <div className="whatsapp-chat-container p-4 min-h-[180px] flex flex-col justify-end">
                          <div className="bg-[#202c33] text-[#e9edef] p-3 rounded-xl rounded-tl-none max-w-[85%] text-left self-start relative leading-normal shadow">
                            <p className="whitespace-pre-wrap">{interpolatedText}</p>
                            <span className="text-[7px] text-slate-400 absolute bottom-1 right-2">
                              {new Date().toLocaleTimeString().slice(0, 5)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* In-App Mock Box */}
                    {testSendChannel === "In-App" && (
                      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50 dark:bg-slate-950 flex items-start gap-3 text-xs leading-normal">
                        <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                          <Bell className="h-4.5 w-4.5" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-bold text-slate-800 dark:text-slate-100">
                            Optivita Portal System Notification
                          </p>
                          <p className="text-slate-500 dark:text-slate-450 whitespace-pre-wrap leading-relaxed italic">
                            "{interpolatedText}"
                          </p>
                          <p className="text-[9px] text-slate-400 pt-1">
                            Just now • Portal push notification
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Right Column: Simulator Form */}
            <div className="space-y-5">
              <div>
                <h3 className="font-display font-extrabold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                  Test Delivery Simulator
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Configure active contact details and trigger a simulator packet delivery audit.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-400 uppercase tracking-wider">
                    Test Recipient Address / Phone
                  </label>
                  <input
                    type="text"
                    value={testSendRecipient}
                    onChange={(e) => setTestSendRecipient(e.target.value)}
                    placeholder={
                      testSendChannel === "Email" ? "jane.doe@gmail.com" : "+965 9999 8888"
                    }
                    className="w-full p-3 border rounded-xl bg-slate-50/50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs focus:outline-none"
                  />
                </div>

                <div className="p-4 bg-yellow-500/[0.03] dark:bg-yellow-500/[0.01] border border-yellow-200/50 dark:border-yellow-900/35 rounded-2xl leading-relaxed text-slate-500 text-[11px]">
                  <span className="font-bold text-yellow-600 flex items-center gap-1.5 mb-1">
                    <Activity className="h-4 w-4" /> Simulator Sandbox Mode
                  </span>
                  Test delivery acts as a mock pipeline trace. The frontend logs a complete network
                  stack audit payload without consuming live SMTP credits.
                </div>

                <div className="pt-2 flex justify-end gap-3.5">
                  <button
                    type="button"
                    onClick={() => setShowPreviewModal(false)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
                  >
                    Close Simulator
                  </button>
                  <button
                    type="button"
                    onClick={triggerMockDeliveryTest}
                    className="px-5 py-2.5 bg-[#008069] hover:bg-[#005c4b] text-white font-bold rounded-xl shadow-soft transition-all"
                  >
                    Dispatch Simulator Test
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
