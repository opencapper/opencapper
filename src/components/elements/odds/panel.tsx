import { CARD_LABEL } from "@/components/elements/page/page-heading";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

export function Panel(props: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <Card className={cn("gap-0 py-0", props.className)}>
      {props.title && (
        <CardHeader className="border-b py-3 [.border-b]:pb-3">
          <CardTitle className={CARD_LABEL}>{props.title}</CardTitle>
          {props.action && <CardAction>{props.action}</CardAction>}
        </CardHeader>
      )}
      <CardContent className={cn("px-0", props.contentClassName)}>
        {props.children}
      </CardContent>
    </Card>
  );
}

export function PanelLink(props: { href: string; children: ReactNode }) {
  return (
    <Link
      href={props.href}
      className="text-foreground/50 hover:text-foreground label-mono inline-flex items-center gap-1 text-[10px] transition-colors"
    >
      {props.children}
      <Icon name="arrow-right" className="size-3" />
    </Link>
  );
}

export function Empty(props: { children: ReactNode }) {
  return (
    <div className="text-muted-foreground px-4 py-12 text-center text-sm">
      {props.children}
    </div>
  );
}

export function Unreachable() {
  const t = useTranslations("COMMON");
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <Icon name="triangle-alert" className="text-muted-foreground size-8" />
        <p className="font-medium">{t("UNREACHABLE_TITLE")}</p>
        <p className="text-muted-foreground max-w-md text-sm">
          {t("UNREACHABLE_BODY")}
        </p>
      </CardContent>
    </Card>
  );
}
