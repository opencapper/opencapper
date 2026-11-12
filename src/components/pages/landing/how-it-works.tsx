import { VendorLogo } from "@/components/elements/vendor/vendor-logo";
import type { BetDetail } from "@/lib/api/client";
import { bookName } from "@/lib/config/vendor-registry";
import { matchup, odds, percent, prob, sideName } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getTranslations } from "next-intl/server";
import type { CSSProperties } from "react";
import { SampleTag, Section, SectionHead, WRAP } from "./landing-ui";

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

const RADIUS = 110;
const SHADES = ["#f7f3ea", "#f2c14e", "#7fb894", "#c9d8c0"];

type Vars = CSSProperties & Record<`--${string}`, string>;

async function diagramOf(detail: BetDetail | undefined): Promise<Diagram> {
  const t = await getTranslations();
  const outcomes = detail?.market.outcomes.filter(
    (o) => o.sharp && o.fair_odds,
  );
  if (detail && outcomes && outcomes.length >= 2) {
    const b = detail.bet;
    return {
      legs: outcomes.map((o) => ({
        name: sideName(
          {
            market: b.market,
            side: o.side,
            line: b.line,
            home: b.home,
            away: b.away,
          },
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

function Donut(props: { legs: Leg[]; marginLabel: string; center: string }) {
  const implied = props.legs.map((l) => 100 / l.sharp);
  const total = implied.reduce((a, b) => a + b, 0);
  const margin = Math.max(0, total - 100);
  // The ring is the whole overround: fair shares fill 100, the margin is the slice left over.
  const ring = 100 + margin;
  let offset = 0;
  const slices = implied.map((p, i) => {
    const length = (p / total) * 100;
    const start = offset;
    offset += length;
    return {
      start,
      length,
      leg: props.legs[i],
      shade: SHADES[i % SHADES.length],
    };
  });
  const angle = ((100 + margin / 2) / ring) * Math.PI * 2;
  const lift: Vars = {
    "--lift-x": `${(Math.sin(angle) * 38).toFixed(1)}px`,
    "--lift-y": `${(-Math.cos(angle) * 38).toFixed(1)}px`,
  };

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[400px]">
      <svg
        viewBox="-160 -160 320 320"
        className="block size-full overflow-visible"
      >
        <g transform="rotate(-90)" fill="none" strokeWidth="44">
          {slices.map((s) => (
            <circle
              key={s.leg.name}
              r={RADIUS}
              pathLength={ring}
              stroke={s.shade}
              strokeDasharray={`${Math.max(0, s.length - 0.6)} ${ring}`}
              strokeDashoffset={-s.start}
            />
          ))}
        </g>
        <g className="margin-lift" style={lift}>
          <g transform="rotate(-90)">
            <circle
              r={RADIUS}
              fill="none"
              pathLength={ring}
              stroke="var(--color-vermilion)"
              strokeWidth="44"
              strokeDasharray={`${margin} ${ring}`}
              strokeDashoffset={-100}
            />
          </g>
        </g>
        {slices.map((s) => {
          const a = ((s.start + s.length / 2) / ring) * Math.PI * 2;
          return (
            <text
              key={s.leg.name}
              x={Math.sin(a) * RADIUS}
              y={-Math.cos(a) * RADIUS + 5}
              textAnchor="middle"
              className="fill-ink font-display text-[14px] uppercase"
            >
              {s.leg.name.length > 9
                ? `${s.leg.name.slice(0, 8)}.`
                : s.leg.name}
            </text>
          );
        })}
      </svg>
      <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
        <div>
          <b className="num block text-[48px] leading-[0.9] sm:text-[60px]">
            100%
          </b>
          <span className="font-serif text-[18px] italic opacity-85 sm:text-[22px]">
            {props.center}
          </span>
          <span className="step-glow text-gold mt-1.5 block font-mono text-[11px] tracking-[0.12em] uppercase [--step-delay:1.4s]">
            {props.marginLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

function Column(props: {
  title: string;
  legs: Leg[];
  value: (l: Leg) => number;
  highlight?: boolean;
  delay: string;
}) {
  return (
    <div>
      <h3 className="mb-3 font-mono text-[12px] tracking-[0.14em] uppercase opacity-75">
        {props.title}
      </h3>
      {props.legs.map((l) => (
        <div
          key={l.name}
          className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3 border-t-[1.5px] border-[#f7f3ea]/35 py-3"
        >
          <span className="truncate text-[17px] font-semibold">{l.name}</span>
          <b
            className={cn(
              "num text-[44px] leading-none sm:text-[52px]",
              props.highlight && l.picked && "text-gold",
            )}
          >
            {odds(props.value(l))}
          </b>
        </div>
      ))}
    </div>
  );
}

export async function HowItWorks(props: { detail?: BetDetail }) {
  const t = await getTranslations("LANDING.HOW");
  const d = await diagramOf(props.detail);
  const total = d.legs.reduce((a, l) => a + 1 / l.sharp, 0);
  const steps = [t("STEP_1"), t("STEP_2"), t("STEP_3"), t("STEP_4")];

  return (
    <Section id="how" band="pitch">
      <svg
        aria-hidden
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 size-full opacity-10"
      >
        <g fill="none" stroke="#f7f3ea" strokeWidth="2">
          <path d="M720 0V900" />
          <circle cx="720" cy="450" r="160" />
          <rect x="-2" y="250" width="180" height="400" />
          <rect x="1262" y="250" width="180" height="400" />
        </g>
      </svg>
      <div className={`${WRAP} relative`}>
        <SectionHead
          index={2}
          band="pitch"
          title={t("TITLE")}
          line={t("LINE", { fixture: d.fixture })}
          aside={d.sample ? <SampleTag>{t("SAMPLE")}</SampleTag> : undefined}
        />
        <ol className="mb-10 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {steps.map((s, i) => (
            <li
              key={s}
              className="step-glow flex items-center gap-2.5 rounded-full border-[1.5px] border-[#f7f3ea]/50 px-3 py-2 font-mono text-[11px] tracking-[0.08em] uppercase sm:text-[12px]"
              style={{ animationDelay: `${i * 1.4}s` }}
            >
              <span className="bg-chalk text-pitch num grid size-6 shrink-0 place-items-center rounded-full text-[14px]">
                {i + 1}
              </span>
              <span className="truncate">{s}</span>
            </li>
          ))}
        </ol>
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 lg:grid-cols-[1fr_400px_1fr]">
          <Column
            title={t("SHARP")}
            legs={d.legs}
            value={(l) => l.sharp}
            delay="0s"
          />
          <div className="md:order-first md:col-span-2 lg:order-none lg:col-span-1">
            <Donut
              legs={d.legs}
              center={t("CENTER")}
              marginLabel={t("MARGIN", { margin: prob(total - 1) })}
            />
          </div>
          <Column
            title={t("FAIR")}
            legs={d.legs}
            value={(l) => l.fair}
            highlight
            delay="2.8s"
          />
        </div>
        <div className="bg-chalk text-ink mt-12 grid grid-cols-[auto_1fr] items-center gap-x-5 gap-y-2 rounded-[20px] px-5 py-5 sm:grid-cols-[auto_1fr_auto] sm:gap-x-7 sm:px-8">
          <VendorLogo vendorKey={d.book} size={56} className="rounded-xl" />
          <p className="font-serif text-[22px] leading-[1.1] italic sm:text-[30px]">
            {t.rich("VERDICT", {
              book: bookName(d.book),
              price: odds(d.price),
              fair: odds(d.fair),
              b: (chunks) => (
                <b className="num text-pitch not-italic">{chunks}</b>
              ),
            })}
          </p>
          <span className="num text-vermilion col-span-2 text-[64px] leading-[0.9] sm:col-span-1 sm:text-[84px]">
            {percent(d.ev)}
          </span>
        </div>
      </div>
    </Section>
  );
}
