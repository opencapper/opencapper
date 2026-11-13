"use client";

import { useTheme } from "next-themes";
import type { CSSProperties } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { Icon } from "@/components/ui/icon";

const toasterTheme = (v: string | undefined): ToasterProps["theme"] =>
  v === "light" || v === "dark" ? v : "system";

const STYLE: CSSProperties & Record<`--${string}`, string> = {
  "--normal-bg": "var(--popover)",
  "--normal-text": "var(--popover-foreground)",
  "--normal-border": "var(--border)",
  "--border-radius": "var(--radius)",
};

export function Toaster(props: ToasterProps) {
  const theme = useTheme();

  return (
    <Sonner
      theme={toasterTheme(theme.theme)}
      className="toaster group"
      icons={{
        success: <Icon name="circle-check" className="size-4" />,
        info: <Icon name="info" className="size-4" />,
        warning: <Icon name="triangle-alert" className="size-4" />,
        error: <Icon name="octagon-x" className="size-4" />,
        loading: <Icon name="loader" className="size-4 animate-spin" />,
      }}
      style={STYLE}
      toastOptions={{ classNames: { toast: "cn-toast" } }}
      {...props}
    />
  );
}
