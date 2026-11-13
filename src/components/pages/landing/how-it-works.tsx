import { VendorLogo } from "@/components/elements/vendor/vendor-logo";
import { Icon } from "@/components/ui/icon";
import type { BetDetail } from "@/lib/api/client";
import { bookName } from "@/lib/config/vendor-registry";
import { matchup, odds, percent, prob, sideName } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { SampleTag, Section, SectionHead } from "./landing-ui";

type Leg = { name: string; sharp: number; fair: number; picked: boolean };

type Diagram = {
  legs: Leg[];
  book: string;
  price: number;
  fair: number;
  ev: number;
  fixture: string;
  sample: boolean;
};

async function diagramOf(detail: BetDetail | undefined): Promise<Diagram> {
  const t = await getTranslations();
  const outcomes = detail?.market.outcomes.filter((o) => o.sharp && o.fair_odds);
  if (detail && outcomes && outcomes.length >= 2) {
    const b = detail.bet;
    return {
      legs: outcomes.map((o) => ({
        name: sideName(
          { market: b.market, side: o.side, line: b.line, home: b.home, away: b.away },
          t,
        ),
        sharp: Number(o.sharp?.odds),
        fair: Number(o.fair_odds),
        picked: o.side === b.side,
      })),
      book: b.book,
      price: Number(b.odds),
      fair: Number(b.fair_odds),
      ev: b.ev,
      fixture: matchup(b.home, b.away, t),
      sample: false,
    };
  }
  // Shown only when the engine has no priced market; labelled as a sample on the page.
  return {
    legs: [
      { name: "Arsenal", sharp: 2.25, fair: 2.32, picked: true },
      { name: t("FORMAT.SIDE.DRAW"), sharp: 3.55, fair: 3.65, picked: false },
      { name: "Liverpool", sharp: 3.3, fair: 3.4, picked: false },
    ],
    book: "paddypower",
    price: 2.45,
    fair: 2.32,
    ev: 2.45 / 2.32 - 1,
    fixture: "Arsenal v Liverpool",
    sample: true,
  };
}

function Step(props: { n: number; title: string; note: string; children: ReactNode }) {
  return (
    <div className="bg-card flex min-w-0 flex-1 flex-col rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <span className="bg-muted tabular grid size-5 place-items-center rounded text-[11px] font-medium">
          {props.n}
        </span>
        <span className="text-sm font-semibold">{props.title}</span>
      </div>
      <p className="text-muted-foreground mt-1 text-xs">{props.note}</p>
      <div className="mt-4 flex flex-1 flex-col justify-end">{props.children}</div>
    </div>
  );
}

function Legs(props: { legs: Leg[]; value: (l: Leg) => number; foot: string }) {
  return (
    <div>
      <ul className="flex flex-col gap-1.5">
        {props.legs.map((l) => (
          <li
            key={l.name}
            className={cn(
              "flex items-center justify-between gap-3 rounded px-2 py-1 text-sm",
              l.picked && "bg-muted",
            )}
          >
            <span className="truncate">{l.name}</span>
            <span className="tabular flex gap-3">
              <span className="text-muted-foreground w-14 text-right text-xs leading-5">
                {prob(1 / props.value(l))}
              </span>
              <span className="w-10 text-right font-medium">{odds(props.value(l))}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="tabular text-muted-foreground mt-2 border-t pt-2 text-right text-xs">
        {props.foot}
      </p>
    </div>
  );
}

function Arrow() {
  return (
    <div aria-hidden className="text-muted-foreground grid shrink-0 place-items-center">
      <Icon name="arrow-right" className="hidden size-4 lg:block" />
      <Icon name="arrow-down" className="size-4 lg:hidden" />
    </div>
  );
}

export async function HowItWorks(props: { detail?: BetDetail }) {
  const t = await getTranslations("LANDING.HOW");
  const d = await diagramOf(props.detail);
  const overround = d.legs.reduce((a, l) => a + 1 / l.sharp, 0);
  const picked = d.legs.find((l) => l.picked);

  return (
    <Section id="how">
      <SectionHead
        title={t("HEADING")}
        line={t("SUB", { fixture: d.fixture })}
        aside={d.sample ? <SampleTag>{t("SAMPLE")}</SampleTag> : undefined}
      />
      <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
        <Step n={1} title={t("STEP_1")} note={t("STEP_1_NOTE")}>
          <Legs
            legs={d.legs}
            value={(l) => l.sharp}
            foot={t("TOTAL", { total: prob(overround), margin: prob(overround - 1) })}
          />
        </Step>
        <Arrow />
        <Step n={2} title={t("STEP_2_NAME")} note={t("STEP_2_NOTE")}>
          <Legs legs={d.legs} value={(l) => l.fair} foot={t("TOTAL_FAIR")} />
        </Step>
        <Arrow />
        <Step n={3} title={t("STEP_4")} note={t("STEP_3_NOTE")}>
          <div className="flex items-center gap-2 text-sm">
            <VendorLogo vendorKey={d.book} size={20} className="rounded-sm" />
            <span className="truncate font-medium">{bookName(d.book)}</span>
            <span className="text-muted-foreground truncate">{picked?.name}</span>
          </div>
          <dl className="tabular mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="bg-muted rounded px-2 py-2">
              <dt className="text-muted-foreground font-sans text-[11px]">{t("PRICE")}</dt>
              <dd className="text-base font-semibold">{odds(d.price)}</dd>
            </div>
            <div className="bg-muted rounded px-2 py-2">
              <dt className="text-muted-foreground font-sans text-[11px]">{t("FAIR_ODDS")}</dt>
              <dd className="text-base">{odds(d.fair)}</dd>
            </div>
            <div className="bg-muted rounded px-2 py-2">
              <dt className="text-muted-foreground font-sans text-[11px]">{t("EV")}</dt>
              <dd className="text-success text-base font-semibold">{percent(d.ev)}</dd>
            </div>
          </dl>
          <p className="text-muted-foreground mt-2 border-t pt-2 text-right text-xs">
            {t("FORMULA")}
          </p>
        </Step>
      </div>
    </Section>
  );
}
