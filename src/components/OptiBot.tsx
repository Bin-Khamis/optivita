import { useState, useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { 
  MessageSquare, X, Send, Sparkles, User, 
  Bot, Phone, Calendar, BookOpen, Calculator, 
  HelpCircle, MessageCircle 
} from "lucide-react";

interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: Date;
  buttons?: Array<{
    text: string;
    action: () => void;
    linkTo?: string;
  }>;
}

interface LeadData {
  name: string;
  phone: string;
  email: string;
  country: string;
  goal: string;
}

export default function OptiBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPulsingAlert, setShowPulsingAlert] = useState(true);
  
  // Lead Collection State
  const [leadStep, setLeadStep] = useState<number | null>(null); // null = not collecting, 1-5 = steps
  const [leadData, setLeadData] = useState<Partial<LeadData>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Initial welcome messages
  useEffect(() => {
    const welcomeMessages: Message[] = [
      {
        id: "w1",
        sender: "bot",
        text: "👋 Welcome to OPTIVITA!\n\nI'm OptiBot, your personal health assistant.\n\nI'm here to help you improve your health through personalized guidance.",
        timestamp: new Date(),
      },
      {
        id: "w2",
        sender: "bot",
        text: "Before choosing a program, I recommend taking our FREE Health Check. It only takes about 60 seconds and provides a personalized health assessment.\n\nWould you like to begin?",
        timestamp: new Date(),
        buttons: [
          {
            text: "🩺 Start Free Health Check",
            action: () => handleDirectNavigation("/calculator"),
            linkTo: "/calculator"
          },
          {
            text: "📚 Explore Our Programs",
            action: () => handleDirectNavigation("/#programs"),
            linkTo: "/#programs"
          }
        ]
      }
    ];
    setMessages(welcomeMessages);
    
    // Set unread count initially if chatbot is closed
    if (!isOpen) {
      setUnreadCount(2);
    }
  }, []);

  // Dismiss pulsing greeting helper after 10s
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPulsingAlert(false);
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  const handleOpenToggle = () => {
    setIsOpen(!isOpen);
    setUnreadCount(0);
    setShowPulsingAlert(false);
  };

  const handleDirectNavigation = (path: string) => {
    setIsOpen(false);
    // Smooth scroll for anchors
    if (path.startsWith("/#")) {
      const id = path.split("#")[1];
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      } else {
        window.location.href = path;
      }
    }
  };

  // Chatbot NLP Responses logic
  const getBotResponse = (input: string): { text: string; buttons?: Message["buttons"] } => {
    const query = input.toLowerCase().trim();

    // 1. Weight Loss
    if (
      query.includes("weight loss") || 
      query.includes("lose weight") || 
      query.includes("fat loss") || 
      query.includes("slim") || 
      query.includes("slimming")
    ) {
      return {
        text: "Our 30-Day Weight Loss Challenge and Fat Loss Premium Coaching are excellent options. To determine which is best for you, I recommend completing the FREE Health Check first.",
        buttons: [
          { text: "🩺 Start Health Check", action: () => handleDirectNavigation("/calculator"), linkTo: "/calculator" }
        ]
      };
    }

    // 2. BMI, Calories, Weight Range
    if (
      query.includes("bmi") || 
      query.includes("calorie") || 
      query.includes("calories") || 
      query.includes("weight range") || 
      query.includes("hydration") || 
      query.includes("water intake") || 
      query.includes("steps")
    ) {
      return {
        text: "You can calculate your BMI, healthy weight range, calorie needs, hydration target, and receive personalized recommendations using our FREE Health Calculator.",
        buttons: [
          { text: "🩺 Check My Health", action: () => handleDirectNavigation("/calculator"), linkTo: "/calculator" }
        ]
      };
    }

    // 3. Diabetes
    if (
      query.includes("diabetes") || 
      query.includes("prediabetes") || 
      query.includes("blood sugar") || 
      query.includes("glucose") || 
      query.includes("insulin")
    ) {
      return {
        text: "Our Diabetes Nutrition Program is tailored to manage blood sugar through evidence-based nutrition. To see how it aligns with your health data, let's complete the Health Check first.",
        buttons: [
          { text: "🩺 Start Health Check", action: () => handleDirectNavigation("/calculator"), linkTo: "/calculator" }
        ]
      };
    }

    // 4. PCOS
    if (
      query.includes("pcos") || 
      query.includes("hormone") || 
      query.includes("hormones") || 
      query.includes("pcod") || 
      query.includes("cycle")
    ) {
      return {
        text: "The PCOS Nutrition Program focuses on hormone-supportive nutrition, weight management, and symptom tracking. To get custom insights for your condition, starting with the Health Check is highly recommended.",
        buttons: [
          { text: "🩺 Start Health Check", action: () => handleDirectNavigation("/calculator"), linkTo: "/calculator" }
        ]
      };
    }

    // 5. Which program to choose / right for me
    if (
      query.includes("which program") || 
      query.includes("program is right") || 
      query.includes("best program") || 
      query.includes("choose program") || 
      query.includes("help me choose")
    ) {
      return {
        text: "I can help with that! The most accurate recommendation comes from your personalized Health Check. It takes less than one minute.",
        buttons: [
          { text: "🩺 Start Free Health Check", action: () => handleDirectNavigation("/calculator"), linkTo: "/calculator" },
          { text: "📚 View Programs", action: () => handleDirectNavigation("/#programs"), linkTo: "/#programs" }
        ]
      };
    }

    // 6. Healthy Lifestyle Reset
    if (
      query.includes("lifestyle") || 
      query.includes("reset") || 
      query.includes("healthy habit") || 
      query.includes("habits") || 
      query.includes("energy")
    ) {
      return {
        text: "Our 21-Day Healthy Lifestyle Reset is perfect for rebuilding core nutrition and wellness habits. To check if this program matches your profile, let's run the quick Health Check.",
        buttons: [
          { text: "🩺 Start Health Check", action: () => handleDirectNavigation("/calculator"), linkTo: "/calculator" }
        ]
      };
    }

    // 7. General contact or team / booking
    if (
      query.includes("consultation") || 
      query.includes("book") || 
      query.includes("coach") || 
      query.includes("talk to") || 
      query.includes("contact") || 
      query.includes("whatsapp") || 
      query.includes("enquiry") || 
      query.includes("join")
    ) {
      return {
        text: "I would be glad to help you connect with an OPTIVITA Health Coach. I can collect your details right here to register your interest, or you can speak with us directly.",
        buttons: [
          { text: "📅 Book Consultation Now", action: () => startLeadFlow() },
          { text: "💬 WhatsApp Support", action: () => openWhatsApp() }
        ]
      };
    }

    // Default Fallback
    return {
      text: "To recommend the most suitable OPTIVITA program and calculate your personalized metrics (like BMI, calorie targets, and hydration), I suggest completing our FREE Health Check first. It takes less than one minute.",
      buttons: [
        { text: "🩺 Start Free Health Check", action: () => handleDirectNavigation("/calculator"), linkTo: "/calculator" },
        { text: "❓ Ask Another Question", action: () => {} }
      ]
    };
  };

  const startLeadFlow = () => {
    setLeadStep(1);
    setLeadData({});
    setMessages(prev => [
      ...prev,
      {
        id: `bot_lead_${Date.now()}`,
        sender: "bot",
        text: "Great! Let's get you set up for a personal consultation. First, what is your Full Name?",
        timestamp: new Date()
      }
    ]);
  };

  const openWhatsApp = () => {
    window.open("https://wa.me/966500000000?text=Hello%20Optivita%20team,%20I'd%20like%20to%20learn%20more%20about%20your%20nutrition%20and%20health%20programs.", "_blank");
  };

  const handleLeadInput = (text: string) => {
    const step = leadStep;
    if (step === 1) {
      setLeadData(prev => ({ ...prev, name: text }));
      setLeadStep(2);
      setMessages(prev => [
        ...prev,
        {
          id: `bot_lead_q2_${Date.now()}`,
          sender: "bot",
          text: `Thanks, ${text}! What is your Mobile Number (including country code)?`,
          timestamp: new Date()
        }
      ]);
    } else if (step === 2) {
      setLeadData(prev => ({ ...prev, phone: text }));
      setLeadStep(3);
      setMessages(prev => [
        ...prev,
        {
          id: `bot_lead_q3_${Date.now()}`,
          sender: "bot",
          text: "Perfect. Next, what is your Email Address?",
          timestamp: new Date()
        }
      ]);
    } else if (step === 3) {
      setLeadData(prev => ({ ...prev, email: text }));
      setLeadStep(4);
      setMessages(prev => [
        ...prev,
        {
          id: `bot_lead_q4_${Date.now()}`,
          sender: "bot",
          text: "What Country are you currently living in?",
          timestamp: new Date()
        }
      ]);
    } else if (step === 4) {
      setLeadData(prev => ({ ...prev, country: text }));
      setLeadStep(5);
      setMessages(prev => [
        ...prev,
        {
          id: `bot_lead_q5_${Date.now()}`,
          sender: "bot",
          text: "What is your main Health Goal? (e.g. Weight Loss, Manage Diabetes, PCOS Support, Energy, Muscle Gain)",
          timestamp: new Date()
        }
      ]);
    } else if (step === 5) {
      const finalGoal = text;
      const completedData: LeadData = {
        name: leadData.name || "",
        phone: leadData.phone || "",
        email: leadData.email || "",
        country: leadData.country || "",
        goal: finalGoal
      };
      
      // Save enquiry locally for safety
      const enquiries = JSON.parse(localStorage.getItem("optivita_enquiries") || "[]");
      enquiries.push({ ...completedData, date: new Date().toISOString() });
      localStorage.setItem("optivita_enquiries", JSON.stringify(enquiries));

      setLeadStep(null);
      setLeadData({});

      setMessages(prev => [
        ...prev,
        {
          id: `bot_lead_done_${Date.now()}`,
          sender: "bot",
          text: "Thank you! Your enquiry has been received. An OPTIVITA Health Coach will contact you shortly.",
          timestamp: new Date(),
          buttons: [
            { text: "🩺 Back to Health Check", action: () => handleDirectNavigation("/calculator"), linkTo: "/calculator" },
            { text: "💬 WhatsApp Us Directly", action: () => openWhatsApp() }
          ]
        }
      ]);
    }
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend !== undefined ? textToSend : inputText).trim();
    if (!text) return;

    // Add user message
    const userMsgId = `user_${Date.now()}`;
    const newMsg: Message = {
      id: userMsgId,
      sender: "user",
      text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMsg]);
    if (textToSend === undefined) {
      setInputText("");
    }

    // Process either lead flow input or normal NLP query
    setTimeout(() => {
      if (leadStep !== null) {
        handleLeadInput(text);
      } else {
        const botResponse = getBotResponse(text);
        setMessages(prev => [
          ...prev,
          {
            id: `bot_${Date.now()}`,
            sender: "bot",
            text: botResponse.text,
            timestamp: new Date(),
            buttons: botResponse.buttons
          }
        ]);
      }
    }, 600);
  };

  const handleQuickAction = (actionType: string) => {
    let textMsg = "";
    if (actionType === "check_health") {
      handleDirectNavigation("/calculator");
      return;
    } else if (actionType === "find_program") {
      setMessages(prev => [
        ...prev,
        {
          id: `user_q_${Date.now()}`,
          sender: "user",
          text: "🏆 Find My Best Program",
          timestamp: new Date()
        },
        {
          id: `bot_recommend_${Date.now()}`,
          sender: "bot",
          text: "To recommend the absolute best program, tell me, what is your primary goal?",
          timestamp: new Date(),
          buttons: [
            { text: "Lose Weight", action: () => handleSendMessage("I want to lose weight") },
            { text: "Manage Diabetes", action: () => handleSendMessage("I want to manage diabetes") },
            { text: "PCOS Support", action: () => handleSendMessage("I need PCOS Support") },
            { text: "Healthy Lifestyle Reset", action: () => handleSendMessage("Healthy habits and lifestyle") }
          ]
        }
      ]);
      return;
    } else if (actionType === "explore_programs") {
      handleDirectNavigation("/#programs");
      return;
    } else if (actionType === "book_consultation") {
      textMsg = "📅 Book Consultation";
    } else if (actionType === "whatsapp") {
      openWhatsApp();
      return;
    } else if (actionType === "ask_question") {
      setMessages(prev => [
        ...prev,
        {
          id: `user_q_${Date.now()}`,
          sender: "user",
          text: "❓ Ask a Health Question",
          timestamp: new Date()
        },
        {
          id: `bot_q_${Date.now()}`,
          sender: "bot",
          text: "Please type in your question, and I will share evidence-based nutrition tips! (Note: I cannot prescribe meds or diagnose conditions.)",
          timestamp: new Date()
        }
      ]);
      return;
    }

    if (textMsg) {
      handleSendMessage(textMsg);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[999] flex flex-col items-end pointer-events-none">
      
      {/* Pulse alert badge above Closed Mascot bubble */}
      {!isOpen && showPulsingAlert && (
        <div className="bg-card text-foreground border border-border/80 rounded-2xl p-3.5 shadow-glow mb-3 mr-2 w-64 text-xs animate-bounce relative pointer-events-auto">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowPulsingAlert(false);
            }} 
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
          <p className="font-semibold text-vital flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            OptiBot active
          </p>
          <p className="mt-1 text-muted-foreground leading-relaxed">
            Need advice? Get your free personalized Health Check report now!
          </p>
        </div>
      )}

      {/* Main Chat Trigger Mascot Bubble */}
      {!isOpen && (
        <button
          onClick={handleOpenToggle}
          className="relative h-24 w-24 md:h-44 md:w-44 bg-transparent border-0 outline-none flex items-center justify-center overflow-visible hover:scale-105 transition-all duration-300 cursor-pointer pointer-events-auto"
          aria-label="Open OptiBot chatbot"
        >
          {/* Loop Mascot webm video file inside floating bubble */}
          <video 
            src="/mascot.webm" 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="h-full w-full object-contain bg-transparent" 
          />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 md:top-4 md:right-4 bg-vital text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center animate-pulse border-2 border-white shadow-md">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Main Chat Window */}
      {isOpen && (
        <div 
          ref={chatWindowRef}
          className="bg-card border border-border/80 rounded-3xl w-[calc(100vw-32px)] sm:w-[380px] md:w-[400px] h-[500px] md:h-[600px] shadow-glow flex flex-col overflow-hidden animate-scale-up text-foreground pointer-events-auto"
        >
          {/* Glassmorphic Header */}
          <div className="relative bg-secondary/80 backdrop-blur-md border-b border-border/50 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Mascot Video Header Circle */}
              <div className="h-12 w-12 rounded-full border border-vital/50 overflow-hidden bg-white shrink-0">
                <video 
                  src="/mascot.webm" 
                  autoPlay 
                  loop 
                  muted 
                  playsInline 
                  className="h-full w-full object-cover" 
                />
              </div>
              <div>
                <h4 className="font-display font-extrabold text-sm text-foreground">OptiBot</h4>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-vital animate-pulse" />
                  Your Personal Health Guide
                </p>
              </div>
            </div>
            
            <button
              onClick={handleOpenToggle}
              className="h-8 w-8 rounded-full border border-border hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
              aria-label="Close chatbot"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/30">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex gap-2.5 max-w-[85%] ${msg.sender === "user" ? "ml-auto flex-row-reverse" : ""}`}
              >
                {msg.sender === "bot" && (
                  <div className="h-8 w-8 rounded-full bg-vital/15 flex items-center justify-center text-vital shrink-0 text-xs font-semibold">
                    OB
                  </div>
                )}
                
                <div className="space-y-2">
                  <div 
                    className={`rounded-2xl px-3.5 py-2.5 text-xs md:text-sm leading-relaxed whitespace-pre-line ${
                      msg.sender === "user" 
                        ? "bg-vital text-white rounded-tr-none" 
                        : "bg-secondary/65 border border-border/30 rounded-tl-none"
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* Message Action Buttons */}
                  {msg.buttons && msg.buttons.length > 0 && (
                    <div className="flex flex-col gap-2 pt-1.5">
                      {msg.buttons.map((btn, index) => {
                        if (btn.linkTo) {
                          return (
                            <Link
                              key={index}
                              to={btn.linkTo as any}
                              onClick={btn.action}
                              className="text-left bg-vital text-white font-bold text-xs py-2 px-3 rounded-xl shadow-sm hover:opacity-90 transition-all flex items-center gap-1.5 w-fit"
                            >
                              {btn.text}
                            </Link>
                          );
                        }
                        return (
                          <button
                            key={index}
                            onClick={btn.action}
                            className="text-left bg-card border border-border text-foreground hover:bg-secondary/40 font-bold text-xs py-2 px-3 rounded-xl shadow-sm transition-all w-fit"
                          >
                            {btn.text}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Selection Bar */}
          <div className="px-3 py-2 border-t border-border/40 overflow-x-auto flex gap-2 scrollbar-none bg-secondary/15 shrink-0">
            <button 
              onClick={() => handleQuickAction("check_health")}
              className="flex items-center gap-1.5 shrink-0 text-[11px] font-semibold bg-white border border-border rounded-full py-1.5 px-3 hover:bg-secondary transition-all shadow-sm"
            >
              <Calculator className="h-3 w-3 text-vital" />
              🩺 Check My Health
            </button>
            <button 
              onClick={() => handleQuickAction("find_program")}
              className="flex items-center gap-1.5 shrink-0 text-[11px] font-semibold bg-white border border-border rounded-full py-1.5 px-3 hover:bg-secondary transition-all shadow-sm"
            >
              <Sparkles className="h-3 w-3 text-accent" />
              🏆 Find Best Program
            </button>
            <button 
              onClick={() => handleQuickAction("explore_programs")}
              className="flex items-center gap-1.5 shrink-0 text-[11px] font-semibold bg-white border border-border rounded-full py-1.5 px-3 hover:bg-secondary transition-all shadow-sm"
            >
              <BookOpen className="h-3 w-3 text-blue-500" />
              📚 Explore Programs
            </button>
            <button 
              onClick={() => handleQuickAction("book_consultation")}
              className="flex items-center gap-1.5 shrink-0 text-[11px] font-semibold bg-white border border-border rounded-full py-1.5 px-3 hover:bg-secondary transition-all shadow-sm"
            >
              <Calendar className="h-3 w-3 text-purple-500" />
              📅 Book Consultation
            </button>
            <button 
              onClick={() => handleQuickAction("whatsapp")}
              className="flex items-center gap-1.5 shrink-0 text-[11px] font-semibold bg-white border border-border rounded-full py-1.5 px-3 hover:bg-secondary transition-all shadow-sm"
            >
              <MessageCircle className="h-3 w-3 text-emerald-500" />
              💬 WhatsApp Support
            </button>
            <button 
              onClick={() => handleQuickAction("ask_question")}
              className="flex items-center gap-1.5 shrink-0 text-[11px] font-semibold bg-white border border-border rounded-full py-1.5 px-3 hover:bg-secondary transition-all shadow-sm"
            >
              <HelpCircle className="h-3 w-3 text-amber-500" />
              ❓ Ask Question
            </button>
          </div>

          {/* Text Input Footer Form */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 border-t border-border/50 flex gap-2 bg-card shrink-0"
          >
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={leadStep !== null ? "Enter your response..." : "Ask OptiBot something..."}
              className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-xs md:text-sm focus:outline-none focus:border-vital focus:ring-1 focus:ring-vital"
            />
            <button 
              type="submit"
              disabled={!inputText.trim()}
              className="h-9 w-9 rounded-full bg-vital text-white flex items-center justify-center hover:opacity-90 disabled:opacity-40 disabled:hover:opacity-40 transition-all shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
