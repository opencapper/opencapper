import { AdminPanel } from "@/components/pages/navbar/admin/admin-panel";
import { isStaff } from "@/lib/config/permissions";
import { buildMetadata, ogImage } from "@/lib/seo/metadata";
import { serverLocale } from "@/lib/utils/server";
import { getAuthUser } from "@/server/auth/auth";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const locale = await serverLocale(props);
  const t = await getTranslations({ locale, namespace: "ADMIN" });
  return buildMetadata({
    locale,
    href: "/admin",
    title: t("TITLE"),
    description: t("DESCRIPTION"),
    image: ogImage("home", locale),
    index: false,
  });
}

// A 404, not a login prompt: the panel's existence is not advertised.
export default async function AdminPage(props: Props) {
  setRequestLocale(await serverLocale(props));
  const user = await getAuthUser(await headers()).catch(() => null);
  if (!user || !isStaff(user.role)) notFound();
  return (
    <Suspense>
      <AdminPanel role={user.role} userId={user.id} />
    </Suspense>
  );
}
