import { useTranslations } from "next-intl";

export function SoonMark() {
  const t = useTranslations("NAV");
  return (
    <span className="border-foreground/15 text-foreground/45 rounded-sm border px-1 font-mono text-[9px] tracking-wider uppercase">
      {t("SOON")}
    </span>
  );
}
