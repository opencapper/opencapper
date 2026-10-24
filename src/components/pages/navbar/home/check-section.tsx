import { SectionTitle } from "@/components/elements/page/page-heading";
import { Icon } from "@/components/ui/icon";
import { getPathname } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";

// A plain GET form: it works before hydration and lands on /check?q=, which prefetches the result.
export async function CheckSection() {
  const t = await getTranslations("LANDING.CHECK");
  const locale = await getLocale();

  return (
    <section className="mb-12">
      <SectionTitle>{t("TITLE")}</SectionTitle>
      <p className="text-foreground/65 mt-3 mb-5 text-sm leading-relaxed sm:text-[15px]">
        {t("BODY")}
      </p>
      <form
        action={getPathname({ locale, href: "/check" })}
        method="get"
        className="border-input/80 bg-card flex items-center gap-2 rounded-lg border p-1.5"
      >
        <Icon
          name="user-search"
          className="text-foreground/40 ml-2 size-4 shrink-0"
        />
        <input
          name="q"
          required
          maxLength={200}
          autoComplete="off"
          spellCheck={false}
          aria-label={t("LABEL")}
          placeholder={t("PLACEHOLDER")}
          className="placeholder:text-foreground/35 min-w-0 flex-1 bg-transparent px-1 py-2 text-sm outline-none"
        />
        <button
          type="submit"
          className="group label-mono bg-primary text-primary-foreground inline-flex shrink-0 items-center gap-1.5 rounded-md px-4 py-2.5 transition-opacity hover:opacity-90"
        >
          {t("SUBMIT")}
          <Icon
            name="arrow-right"
            className="size-3 opacity-70 transition-transform group-hover:translate-x-0.5"
          />
        </button>
      </form>
    </section>
  );
}
