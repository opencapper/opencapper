"use client";

import { useLocale } from "next-intl";
import { useEffect, useEffectEvent, useRef } from "react";

declare global {
  interface Window {
    onTelegramAuth?: (user: unknown) => void;
  }
}

const WIDGET_SRC = "https://telegram.org/js/telegram-widget.js?22";

export function TelegramLoginWidget(props: {
  botUsername: string;
  onAuth: (user: unknown) => void;
}) {
  const locale = useLocale();
  const container = useRef<HTMLDivElement>(null);
  const handleAuth = useEffectEvent((user: unknown) => props.onAuth(user));

  useEffect(() => {
    const node = container.current;
    if (!node) return;
    window.onTelegramAuth = (user) => handleAuth(user);
    const script = document.createElement("script");
    script.src = WIDGET_SRC;
    script.async = true;
    script.dataset.telegramLogin = props.botUsername;
    script.dataset.size = "large";
    script.dataset.radius = "6";
    script.dataset.lang = locale.toLowerCase();
    script.dataset.onauth = "onTelegramAuth(user)";
    node.appendChild(script);
    return () => {
      node.replaceChildren();
      delete window.onTelegramAuth;
    };
  }, [props.botUsername, locale]);

  return <div ref={container} className="flex min-h-10 justify-center" />;
}
