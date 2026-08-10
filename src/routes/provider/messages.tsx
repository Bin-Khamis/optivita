import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Send, User, ChevronRight, Check } from "lucide-react";

export const Route = createFileRoute("/provider/messages")({
  component: ProviderMessagesConsole,
});

function ProviderMessagesConsole() {
  const [activeClient, setActiveClient] = useState("cli-201");
  const [typedMessage, setTypedMessage] = useState("");
  
  const clients = [
    { id: "cli-201", name: "Fahad Khalid", avatar: "F" },
    { id: "cli-202", name: "Amal Al-Otaibi", avatar: "A" },
    { id: "cli-203", name: "Tariq Mansoor", avatar: "T" },
  ];

  // Chat message histories mapped by client ID
  const [messagesMap, setMessagesMap] = useState<Record<string, any[]>>({
    "cli-201": [
      { sender: "client", text: "Hello doctor, I completed my food diary for today.", time: "10:30 AM" },
      { sender: "provider", text: "Great! Let me review it. Make sure you log your water intake too.", time: "10:45 AM" },
    ],
    "cli-202": [
      { sender: "client", text: "Is the PCOS diet anti-inflammatory grocery list ready?", time: "Yesterday" },
      { sender: "provider", text: "Yes Amal, I uploaded the grocery list PDF file under your portal details.", time: "Yesterday" },
    ],
    "cli-203": [
      { sender: "client", text: "Captain, I completed my strength training routine today. Lifted 60kg!", time: "2 days ago" },
      { sender: "provider", text: "Perfect Tariq! Keep pushing. Tomorrow we will do legs.", time: "2 days ago" },
    ],
  });

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll chat to bottom
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [activeClient, messagesMap]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim()) return;

    const newMsg = {
      sender: "provider",
      text: typedMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessagesMap({
      ...messagesMap,
      [activeClient]: [...(messagesMap[activeClient] || []), newMsg],
    });

    setTypedMessage("");
    
    // Simulate auto client reply after 1.5 seconds
    setTimeout(() => {
      const replies = [
        "Thank you! I will follow your instructions.",
        "Got it, looking forward to our next session.",
        "Perfect, thanks for the quick update!",
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];
      
      const autoReply = {
        sender: "client",
        text: randomReply,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessagesMap((prev) => ({
        ...prev,
        [activeClient]: [...(prev[activeClient] || []), autoReply],
      }));
    }, 1500);
  };

  const activeClientName = clients.find((c) => c.id === activeClient)?.name || "Client";
  const activeChat = messagesMap[activeClient] || [];

  return (
    <div className="h-[75vh] border border-border/60 bg-card rounded-3xl overflow-hidden grid md:grid-cols-3 shadow-soft">
      {/* Sidebar: Clients List */}
      <div className="border-r border-border/40 flex flex-col">
        <div className="p-4 border-b border-border/30 bg-secondary/10">
          <span className="font-bold text-xs text-foreground">Active Chats</span>
        </div>
        <div className="flex-grow overflow-y-auto divide-y divide-border/30">
          {clients.map((c) => {
            const isActive = activeClient === c.id;
            const lastMsg = messagesMap[c.id]?.slice(-1)[0]?.text || "No messages";
            
            return (
              <button
                key={c.id}
                onClick={() => setActiveClient(c.id)}
                className={`w-full p-4 flex items-center gap-3 text-left transition-colors ${
                  isActive ? "bg-accent/10 dark:bg-accent/20" : "hover:bg-secondary/15"
                }`}
              >
                <div className="h-9 w-9 rounded-full bg-secondary/45 flex items-center justify-center font-bold shrink-0">
                  {c.avatar}
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground truncate">{c.name}</span>
                    <span className="text-[8px] text-muted-foreground font-mono">Chat</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">{lastMsg}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="md:col-span-2 flex flex-col justify-between h-full bg-secondary/5">
        {/* Chat Header */}
        <div className="p-4 border-b border-border/30 bg-card flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-accent/15 flex items-center justify-center text-accent font-bold">
            {activeClientName.charAt(0)}
          </div>
          <div>
            <span className="font-bold text-xs text-foreground block">{activeClientName}</span>
            <span className="text-[8px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Online
            </span>
          </div>
        </div>

        {/* Message Logs Feed */}
        <div
          ref={chatContainerRef}
          className="flex-grow p-5 overflow-y-auto space-y-4"
        >
          {activeChat.map((msg, idx) => {
            const isMe = msg.sender === "provider";
            return (
              <div
                key={idx}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl p-3.5 text-xs leading-normal shadow-sm ${
                    isMe
                      ? "bg-accent text-white rounded-tr-none"
                      : "bg-card text-foreground border rounded-tl-none"
                  }`}
                >
                  <p>{msg.text}</p>
                  <div className="flex items-center justify-end gap-1 mt-1 text-[8px] opacity-70">
                    <span>{msg.time}</span>
                    {isMe && <Check className="h-3 w-3" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Messaging input row */}
        <form onSubmit={handleSendMessage} className="p-4 bg-card border-t border-border/30 flex gap-3">
          <input
            type="text"
            value={typedMessage}
            onChange={(e) => setTypedMessage(e.target.value)}
            placeholder={`Message ${activeClientName}...`}
            className="flex-grow px-4 py-2.5 border rounded-full text-xs bg-secondary/15 border-border/60 focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            type="submit"
            className="p-2.5 bg-accent text-white rounded-full hover:opacity-90 shadow-soft"
          >
            <Send className="h-4.5 w-4.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
