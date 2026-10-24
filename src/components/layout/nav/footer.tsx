"use client";

import { Icon } from "@/components/ui/icon";
import { Link } from "@/i18n/navigation";
import { APP_VALUES, msg } from "@/lib/config/constants";
import { env } from "@/lib/config/env";
import { dayjs } from "@/lib/utils/format/date";
import { useTranslations } from "next-intl";
import { Fragment } from "react";
import { navigation } from "./navigation";

const LINK =
  "text-foreground/50 hover:text-foreground/80 font-mono text-[11px] transition-colors";

const LEGAL_LINKS = [
  { href: "/impressum", key: msg("FOOTER.IMPRESSUM") },
  { href: "/privacy", key: msg("FOOTER.PRIVACY") },
  { href: "/terms", key: msg("FOOTER.TERMS") },
] as const;

function Separator() {
  return (
    <span className="text-foreground/15 mx-1 text-[10px] select-none">/</span>
  );
}

export function Footer() {
  const t = useTranslations();

  return (
    <footer className="border-foreground/6 relative border-t px-5 py-6 sm:px-6 lg:px-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-x-1 gap-y-1.5">
          {navigation.map((item) => (
            <Fragment key={item.name}>
              <Link href={item.href} className={LINK}>
                {t(item.name)}
              </Link>
              <Separator />
            </Fragment>
          ))}
          <a
            href={env.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={LINK}
          >
            {t("FOOTER.LICENSE_SHORT")}
          </a>
          <Separator />
          <a
            href={env.discordInviteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={LINK}
          >
            {t("NAV.DISCORD")}
          </a>
          {LEGAL_LINKS.map((item) => (
            <Fragment key={item.href}>
              <Separator />
              <Link href={item.href} className={LINK}>
                {t(item.key)}
              </Link>
            </Fragment>
          ))}
        </div>

        <div className="flex items-center justify-between gap-4">
          <span
            className="text-foreground/40 font-mono text-[10px]"
            suppressHydrationWarning
          >
            {t("FOOTER.COPYRIGHT", {
              year: String(dayjs().year()),
              ...APP_VALUES,
            })}
          </span>
          <a
            href={env.discordInviteUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("NAV.DISCORD")}
            className="text-foreground/50 hover:text-foreground/80 transition-colors"
          >
            <Icon name="brand-discord" className="size-3.5" />
          </a>
          <a
            href={env.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("NAV.GITHUB")}
            className="text-foreground/50 hover:text-foreground/80 transition-colors"
          >
            <Icon name="brand-github" className="size-3.5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
