import { Icon } from "@/components/ui/icon";
import { Link } from "@/i18n/navigation";
import type { LinkHref } from "@/i18n/routing";
import type { IconName } from "@/lib/config/icon-map";
import { getTranslations } from "next-intl/server";

type Tool = { href: LinkHref; icon: IconName; title: string; line: string };

export async function ToolsGrid(props: { edges: number; books: number }) {
  const t = await getTranslations("LANDING.TOOLS");
  const tools: Tool[] = [
    {
      href: "/value-bets",
      icon: "trending-up",
      title: t("VALUE"),
      line: t("VALUE_NOTE", { count: String(props.edges) }),
    },
    { href: "/arbs", icon: "scale", title: t("ARBS"), line: t("ARBS_NOTE") },
    {
      href: "/games",
      icon: "table",
      title: t("ODDS"),
      line: t("ODDS_NOTE", { count: String(props.books) }),
    },
    { href: "/tracker", icon: "wallet", title: t("TRACKER"), line: t("TRACKER_LINE") },
    {
      href: "/tracker/health",
      icon: "shield-check",
      title: t("HEALTH"),
      line: t("HEALTH_NOTE"),
    },
    { href: "/tools", icon: "calculator", title: t("CALC"), line: t("CALC_NOTE") },
  ];
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {tools.map((tool) => (
        <li key={tool.title}>
          <Link
            href={tool.href}
            className="bg-card hover:bg-muted/40 group flex h-full items-start gap-3 rounded-lg border p-4 transition-colors"
          >
            <span className="bg-muted grid size-8 shrink-0 place-items-center rounded-md">
              <Icon name={tool.icon} className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{tool.title}</span>
              <span className="text-muted-foreground mt-0.5 block text-sm">
                {tool.line}
              </span>
            </span>
            <Icon
              name="arrow-right"
              className="text-muted-foreground group-hover:text-foreground mt-1 size-4 shrink-0 transition-colors"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
