import { CompanyName, LogoImage } from "@/components/elements/brand/brand";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/i18n/navigation";
import { APP_VALUES } from "@/lib/config/constants";
import { env } from "@/lib/config/env";
import { useTranslations } from "next-intl";
import { navigation } from "./navigation";

const LINK =
  "text-muted-foreground hover:text-foreground text-[13px] transition-colors";

const GAMBLE_AWARE = "https://www.begambleaware.org";

export function Footer() {
  const t = useTranslations();

  return (
    <footer className="bg-subtle border-t">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <Link href="/" prefetch={false} className="flex items-center gap-2">
            <LogoImage />
            <CompanyName />
          </Link>
          <nav className="flex flex-wrap gap-x-5 gap-y-2">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href} className={LINK}>
                {t(item.name)}
              </Link>
            ))}
          </nav>
        </div>

        <p className="text-muted-foreground max-w-3xl border-t pt-6 text-[13px] leading-relaxed">
          {t.rich("FOOTER.HONEST", {
            aware: (chunks) => (
              <a
                href={GAMBLE_AWARE}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-2"
              >
                {chunks}
              </a>
            ),
          })}
        </p>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <span
            className="text-muted-foreground text-xs"
            suppressHydrationWarning
          >
            {t("FOOTER.COPYRIGHT", {
              year: String(new Date().getUTCFullYear()),
              ...APP_VALUES,
            })}
          </span>
          <div className="flex items-center gap-4">
            <a
              href={env.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={LINK}
            >
              {t("FOOTER.LICENSE_SHORT")}
            </a>
            <a
              href={env.discordInviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("NAV.DISCORD")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Icon name="brand-discord" className="size-4" />
            </a>
            <a
              href={env.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("NAV.GITHUB")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Icon name="brand-github" className="size-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
