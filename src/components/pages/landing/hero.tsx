import { Icon } from "@/components/ui/icon";
import { getTranslations } from "next-intl/server";
import type { LandingData } from "./landing-data";
import { Cta, WRAP } from "./landing-ui";
import { LiveBoard } from "./live-board";

const FREE = ["FREE_BOARD", "FREE_RECORD", "FREE_ALERTS", "FREE_TRACKER"] as const;

export async function Hero(props: { data: LandingData; books: number }) {
  const t = await getTranslations("LANDING.HERO");
  const data = props.data;

  return (
    <header className="pt-10 pb-16 sm:pt-14 sm:pb-20">
      <div className={WRAP}>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end lg:gap-12">
          <div>
            <h1 className="text-[34px] leading-[1.1] font-semibold sm:text-5xl">
              {t("HEADLINE")}
            </h1>
            <p className="text-muted-foreground mt-3 max-w-xl text-base sm:text-lg">
              {t("SUB", { count: String(props.books) })}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Cta href="/value-bets" tone="primary">
                {t("CTA")}
                <Icon name="arrow-right" className="size-4" />
              </Cta>
              <Cta href="/proof">{t("SECONDARY")}</Cta>
            </div>
            <p className="text-muted-foreground mt-4 flex items-center gap-2 text-sm lg:hidden">
              <Icon name="check" className="text-primary size-4 shrink-0" />
              {t("FREE_LINE")}
            </p>
          </div>

          <div className="bg-card hidden rounded-xl border p-5 lg:block">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-semibold">{t("FREE_TITLE")}</span>
              <span className="tabular text-2xl font-semibold">
                {t("FREE_PRICE")}
              </span>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              {t("FREE_NOTE")}
            </p>
            <ul className="mt-4 flex flex-col gap-2 text-sm">
              {FREE.map((k) => (
                <li key={k} className="flex items-center gap-2">
                  <Icon name="check" className="text-primary size-4 shrink-0" />
                  {t(k)}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10">
          <LiveBoard
            list={data.list ?? null}
            edges={data.edges}
            keys={data.boardKeys}
            now={data.now}
          />
        </div>
      </div>
    </header>
  );
}
