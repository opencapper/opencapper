import { AdminPanel } from "@/components/pages/navbar/admin/admin-panel";
import {
  adminUsersQuery,
  loadAdminFilters,
} from "@/components/pages/navbar/admin/admin-params";
import getQueryClient from "@/lib/react-query/client";
import { queryKeys } from "@/lib/react-query/keys";
import {
  prefetchAuth,
  prefetchElysia,
  serverRpc,
} from "@/lib/react-query/prefetch";
import { isStaff } from "@/lib/config/permissions";
import { buildMetadata, ogImage } from "@/lib/seo/metadata";
import { serverLocale } from "@/lib/utils/server";
import {
  dehydrate,
  HydrationBoundary,
  type QueryClient,
} from "@tanstack/react-query";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
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
  const queryClient = getQueryClient();
  const user = await prefetchAuth(queryClient);
  if (!user || !isStaff(user.role)) notFound();
  await prefetchAdminTab(queryClient, props.searchParams);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense>
        <AdminPanel role={user.role} userId={user.id} />
      </Suspense>
    </HydrationBoundary>
  );
}

// Only the open tab queries on first render; each route still checks the permission itself.
async function prefetchAdminTab(
  queryClient: QueryClient,
  searchParams: Props["searchParams"],
) {
  const filters = await loadAdminFilters(searchParams);
  const admin = serverRpc.api.admin;
  if (filters.tab === "users") {
    const query = adminUsersQuery(filters);
    return prefetchElysia(queryClient, queryKeys.adminUsers(query), (headers) =>
      admin.users.get({ ...headers, query }),
    );
  }
  if (filters.tab === "imports")
    return prefetchElysia(queryClient, queryKeys.adminImports(), (headers) =>
      admin.imports.get(headers),
    );
  if (filters.tab === "picks")
    return prefetchElysia(queryClient, queryKeys.adminPicks(), (headers) =>
      admin.picks.get(headers),
    );
  return prefetchElysia(queryClient, queryKeys.adminSystem(), (headers) =>
    admin.system.get(headers),
  );
}
