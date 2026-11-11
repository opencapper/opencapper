import { AutoRefresh } from "@/components/elements/odds/auto-refresh";
import { Unreachable } from "@/components/elements/odds/panel";
import { PageHeading } from "@/components/elements/page/page-heading";
import { PageShell } from "@/components/elements/page/page-shell";
import type { BookStatus } from "@/lib/api/client";
import { useTranslations } from "next-intl";
import { BooksTable } from "./books-table";

export function Books(props: { data?: BookStatus[]; now: number }) {
  const t = useTranslations("BOOKS");
  return (
    <PageShell>
      <AutoRefresh seconds={30} />
      <PageHeading className="mb-0" label={t("LABEL")} title={t("HEADING")} description={t("SUBHEADING")} />
      {props.data ? <BooksTable books={props.data} now={props.now} /> : <Unreachable />}
    </PageShell>
  );
}
