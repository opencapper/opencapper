import { SectionTitle } from "@/components/elements/page/page-heading";
import { Icon } from "@/components/ui/icon";
import type { IconName } from "@/lib/config/icon-map";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { msg } from "@/lib/config/constants";
import { env } from "@/lib/config/env";
import { getTranslations } from "next-intl/server";

const EXAMPLE = {
  pickId: "1",
  canonical: JSON.stringify({
    id: 1,
    userId: 1,
    sequence: 1,
    sportKey: "mma_mixed_martial_arts",
    eventId: "example",
    market: "h2h",
    selection: "Example Fighter",
    point: null,
    oddsDecimal: 2,
    bookmaker: "pinnacle",
    units: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
  }),
};

const script = (
  pickId: string,
) => `const res = await fetch("${env.siteOrigin}/api/log/picks/${pickId}");
const entry = await res.json();

const sha256 = async (bytes: Uint8Array) =>
  Buffer.from(await crypto.subtle.digest("SHA-256", bytes)).toString("hex");

const leaf = await sha256(new TextEncoder().encode(entry.canonical));
const root = await sha256(Buffer.from(entry.prevRoot + leaf, "hex"));

console.log(leaf === entry.leaf, root === entry.root);`;

const STEPS = [
  msg("LANDING.VERIFY.STEP_1"),
  msg("LANDING.VERIFY.STEP_2"),
  msg("LANDING.VERIFY.STEP_3"),
  msg("LANDING.VERIFY.STEP_4"),
];

function Pane(props: {
  title: string;
  meta: string;
  code: string;
  wrap?: boolean;
}) {
  return (
    <div className="border-input/80 bg-card min-w-0 overflow-hidden rounded-lg border">
      <div className="bg-muted/50 border-border flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-1.5">
          <span className="bg-input size-2 rounded-full" />
          <span className="bg-input size-2 rounded-full" />
          <span className="bg-input size-2 rounded-full" />
          <span className="text-foreground/40 ml-2 font-mono text-[10px]">
            {props.title}
          </span>
        </div>
        <span className="label-mono text-foreground/30 text-[9px]">
          {props.meta}
        </span>
      </div>
      <pre
        className={cn(
          "thin-scrollbar overflow-x-auto px-4 py-3 font-mono text-[12px] leading-relaxed",
          props.wrap && "break-all whitespace-pre-wrap",
        )}
      >
        <code className="text-foreground/75">{props.code}</code>
      </pre>
    </div>
  );
}

const POINTS = [
  {
    icon: "shield-check",
    title: msg("LANDING.VERIFY.POINT_CHECK_TITLE"),
    body: msg("LANDING.VERIFY.POINT_CHECK_BODY"),
  },
  {
    icon: "clock",
    title: msg("LANDING.VERIFY.POINT_STAMP_TITLE"),
    body: msg("LANDING.VERIFY.POINT_STAMP_BODY"),
  },
  {
    icon: "brand-github",
    title: msg("LANDING.VERIFY.POINT_SOURCE_TITLE"),
    body: msg("LANDING.VERIFY.POINT_SOURCE_BODY"),
  },
] satisfies { icon: IconName; title: string; body: string }[];

export async function VerifySection(props: {
  latest: { pickId: string; canonical: string } | null;
}) {
  const t = await getTranslations();
  const entry = props.latest ?? EXAMPLE;

  return (
    <section className="mb-12">
      <SectionTitle>{t("LANDING.VERIFY.TITLE")}</SectionTitle>
      <p className="text-foreground/65 mt-3 mb-6 text-sm leading-relaxed sm:text-[15px]">
        {t("LANDING.VERIFY.BODY")}
      </p>
      <ul className="border-input/80 bg-card mb-4 grid overflow-hidden rounded-lg border md:grid-cols-3">
        {POINTS.map((point) => (
          <li
            key={point.title}
            className="border-input/80 flex flex-col gap-2 border-b p-4 last:border-b-0 md:border-r md:border-b-0 md:last:border-r-0"
          >
            <Icon name={point.icon} className="text-foreground/60 size-4" />
            <span className="text-foreground/90 text-[13px] font-medium">
              {t(point.title)}
            </span>
            <span className="text-foreground/55 text-[13px] leading-relaxed">
              {t(point.body)}
            </span>
          </li>
        ))}
      </ul>
      <Link
        href="/verify"
        className="group label-mono bg-primary text-primary-foreground mb-6 inline-flex items-center gap-1.5 rounded-md px-4 py-2.5 transition-opacity hover:opacity-90"
      >
        {t("LANDING.VERIFY.LINK")}
        <Icon
          name="arrow-right"
          className="size-3 opacity-70 transition-transform group-hover:translate-x-0.5"
        />
      </Link>
      <details className="group/details border-input/80 bg-card overflow-hidden rounded-lg border">
        <summary className="label-mono text-foreground/55 hover:text-foreground/85 bg-muted/50 flex cursor-pointer list-none items-center justify-between px-4 py-2.5 text-[10px] transition-colors [&::-webkit-details-marker]:hidden">
          {t("LANDING.VERIFY.DETAILS")}
          <Icon
            name="chevron-down"
            className="size-3.5 transition-transform group-open/details:rotate-180"
          />
        </summary>
        <div className="border-input/80 border-t p-4">
          <p className="text-foreground/65 mb-4 text-[13px] leading-relaxed">
            {t("LANDING.VERIFY.DETAILS_BODY")}
          </p>
          <ol className="border-input/80 mb-4 grid overflow-hidden rounded-md border sm:grid-cols-2">
            {STEPS.map((step, i) => (
              <li
                key={step}
                className="border-input/80 flex gap-3 border-b p-4 last:border-b-0 sm:odd:border-r sm:[&:nth-child(n+3)]:border-b-0"
              >
                <span className="text-foreground/35 font-mono text-[11px]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-foreground/70 text-[13px] leading-relaxed">
                  {t.rich(step, {
                    code: (chunks) => (
                      <code className="bg-accent text-foreground/90 rounded-sm px-1 font-mono text-[12px]">
                        {chunks}
                      </code>
                    ),
                  })}
                </span>
              </li>
            ))}
          </ol>
          <div className="grid gap-4">
            <Pane
              title="canonical.json"
              meta={t(
                props.latest
                  ? "LANDING.VERIFY.LATEST_META"
                  : "LANDING.VERIFY.EXAMPLE_META",
              )}
              code={entry.canonical}
              wrap
            />
            <Pane
              title="verify.ts"
              meta={t("LANDING.VERIFY.SCRIPT_META")}
              code={script(entry.pickId)}
            />
          </div>
        </div>
      </details>
    </section>
  );
}
