import { Icon } from "@/components/ui/icon";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

const TABS = [
  { href: "/tracker", key: "TAB_BETS", icon: "wallet" },
  { href: "/tracker/alerts", key: "TAB_ALERTS", icon: "bell" },
  { href: "/tracker/health", key: "TAB_HEALTH", icon: "shield-check" },
] as const;

export type TrackerTab = (typeof TABS)[number]["href"];

export function TrackerTabs(props: { active: TrackerTab }) {
  const t = useTranslations("TRACKER");
  return (
    <nav className="bg-muted inline-flex w-fit items-center rounded-lg p-[3px]">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-md border border-transparent px-3 text-sm font-medium whitespace-nowrap transition-all",
            props.active === tab.href
              ? "bg-background text-foreground dark:border-input dark:bg-input/30 shadow-sm"
              : "text-foreground/60 hover:text-foreground",
          )}
        >
          <Icon name={tab.icon} className="size-4" />
          {t(tab.key)}
        </Link>
      ))}
    </nav>
  );
}
