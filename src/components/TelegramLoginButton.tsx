import React, { useEffect, useRef } from "react";

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface Props {
  botName: string;
  onAuth: (user: TelegramUser) => void;
  buttonSize?: "large" | "medium" | "small";
  cornerRadius?: number;
  requestAccess?: "write" | "read";
  showUserPhoto?: boolean;
  className?: string;
}

export const TelegramLoginButton: React.FC<Props> = ({
  botName,
  onAuth,
  buttonSize = "large",
  cornerRadius,
  requestAccess = "write",
  showUserPhoto = true,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create a unique global callback name for this botName to prevent conflicts
    const cleanBotName = botName.replace(/[^a-zA-Z0-9]/g, "");
    const callbackName = `onTelegramAuth_${cleanBotName}`;
    
    (window as any)[callbackName] = (user: TelegramUser) => {
      onAuth(user);
    };

    // Clear previous widget iframe / script instances
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", botName);
    script.setAttribute("data-size", buttonSize);
    if (cornerRadius !== undefined) {
      script.setAttribute("data-radius", cornerRadius.toString());
    }
    script.setAttribute("data-request-access", requestAccess);
    script.setAttribute("data-userpic", showUserPhoto ? "true" : "false");
    script.setAttribute("data-onauth", `${callbackName}(user)`);
    script.async = true;

    containerRef.current.appendChild(script);

    return () => {
      // Clean up global function
      delete (window as any)[callbackName];
    };
  }, [botName, onAuth, buttonSize, cornerRadius, requestAccess, showUserPhoto]);

  return <div ref={containerRef} className={className} />;
};
