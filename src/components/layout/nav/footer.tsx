import { CompanyName, LogoImage } from "@/components/elements/brand/brand";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/i18n/navigation";
import { APP_VALUES } from "@/lib/config/constants";
import { env } from "@/lib/config/env";
import { useTranslations } from "next-intl";
import { navigation } from "./navigation";

const LINK =
  "text-chalk/60 hover:text-chalk font-mono text-[11px] tracking-[0.08em] uppercase transition-colors";

const GAMBLE_AWARE = "https://www.begambleaware.org";

export function Footer() {
  const t = useTranslations();

  return (
    <footer className="bg-band text-chalk relative px-4 pt-12 pb-8 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-[1360px] flex-col gap-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <Link href="/" prefetch={false} className="flex items-center gap-2.5">
            <LogoImage className="text-chalk size-9" />
            <CompanyName className="text-[28px]" />
          </Link>
          <nav className="flex flex-wrap gap-x-5 gap-y-2">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href} className={LINK}>
                {t(item.name)}
              </Link>
            ))}
          </nav>
        </div>

        <p className="text-chalk/70 border-chalk/15 max-w-4xl border-t pt-6 text-[13px] leading-relaxed">
          {t.rich("FOOTER.HONEST", {
            aware: (chunks) => (
              <a
                href={GAMBLE_AWARE}
                target="_blank"
                rel="noopener noreferrer"
                className="text-chalk decoration-vermilion underline decoration-2 underline-offset-2"
              >
                {chunks}
              </a>
            ),
          })}
        </p>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <span
            className="text-chalk/45 font-mono text-[11px] tracking-[0.08em] uppercase"
            suppressHydrationWarning
          >
            {t("FOOTER.COPYRIGHT", {
              year: String(new Date().getUTCFullYear()),
              ...APP_VALUES,
            })}
          </span>
          <div className="flex items-center gap-5">
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
              className="text-chalk/60 hover:text-chalk transition-colors"
            >
              <Icon name="brand-discord" className="size-4" />
            </a>
            <a
              href={env.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("NAV.GITHUB")}
              className="text-chalk/60 hover:text-chalk transition-colors"
            >
              <Icon name="brand-github" className="size-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
