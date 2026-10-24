import { PageHeading } from "@/components/elements/page/page-heading";
import { LEGAL_UPDATED } from "@/lib/config/constants";
import { env } from "@/lib/config/env";
import { formatDate } from "@/lib/utils/format/date";
import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

export type LegalSection = {
  title: string;
  body: ReactNode[];
  items?: string[];
  after?: ReactNode[];
};

const LINK = "text-foreground/90 underline-offset-4 hover:underline";

export function MailLink(props: { email: string }) {
  return (
    <a href={`mailto:${props.email}`} className={LINK}>
      {props.email}
    </a>
  );
}

export function ExternalLink(props: { href: string; children: ReactNode }) {
  return (
    <a
      href={props.href}
      target="_blank"
      rel="noopener noreferrer"
      className={LINK}
    >
      {props.children}
    </a>
  );
}

const BOX =
  "border-foreground/8 bg-muted/20 border px-4 py-3 font-mono text-[13px] leading-relaxed";

export async function LegalContact(props: { boxed?: boolean }) {
  const t = await getTranslations("LEGAL");
  return (
    <div className={props.boxed ? BOX : undefined}>
      <p className="text-foreground/70">
        {t("EMAIL_LABEL")}: <MailLink email={env.legalEmail} />
      </p>
      <p className="text-foreground/70">
        {t("DISCORD_LABEL")}:{" "}
        <ExternalLink href={env.discordInviteUrl}>
          {env.discordInviteUrl}
        </ExternalLink>
      </p>
    </div>
  );
}

export function LegalIdentity(props: { contact?: boolean }) {
  return (
    <div className={BOX}>
      <p className="text-foreground/90">{env.legalName}</p>
      <p className="text-foreground/70 whitespace-pre-line">
        {env.legalAddress}
      </p>
      {props.contact && (
        <div className="mt-3">
          <LegalContact />
        </div>
      )}
    </div>
  );
}

export async function LegalDoc(props: {
  locale: Locale;
  title: string;
  intro: string;
  sections: LegalSection[];
}) {
  const t = await getTranslations("LEGAL");
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <PageHeading
        label={t("LABEL")}
        title={props.title}
        description={props.intro}
      >
        <p className="text-foreground/45 mt-3 font-mono text-xs">
          {t("LAST_UPDATED", {
            date: formatDate(LEGAL_UPDATED, props.locale),
          })}
        </p>
      </PageHeading>

      <div className="flex flex-col gap-10">
        {props.sections.map((section, index) => (
          <section key={section.title}>
            <h2 className="border-foreground/8 flex items-baseline gap-3 border-t pt-4">
              <span className="text-foreground/35 tabular font-mono text-[11px]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-foreground/90 text-base font-medium tracking-tight">
                {section.title}
              </span>
            </h2>
            <div className="text-foreground/65 mt-3 flex flex-col gap-3 text-sm leading-relaxed sm:text-[15px]">
              {section.body.map((paragraph, i) => (
                <div key={i}>{paragraph}</div>
              ))}
              {section.items && (
                <ul className="marker:text-foreground/30 list-disc space-y-1.5 pl-5">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
              {section.after?.map((paragraph, i) => (
                <div key={i}>{paragraph}</div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
