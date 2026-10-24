"use client";

import { PageHeading } from "@/components/elements/page/page-heading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { msg } from "@/lib/config/constants";
import type { AuthRole } from "@/lib/config/permissions";
import { useTranslations } from "next-intl";
import { useAdminFilters } from "./admin-filters";
import { ADMIN_TABS, type AdminTab } from "./admin-params";
import { AdminImports } from "./admin-imports";
import { AdminPicks } from "./admin-picks";
import { AdminSystem } from "./admin-system";
import { ROLE_LABELS } from "./admin-labels";
import { AdminUsers } from "./admin-users";

const TAB_LABELS = {
  users: msg("ADMIN.TABS.USERS"),
  imports: msg("ADMIN.TABS.IMPORTS"),
  picks: msg("ADMIN.TABS.PICKS"),
  system: msg("ADMIN.TABS.SYSTEM"),
} satisfies Record<AdminTab, string>;

export function AdminPanel(props: { role: AuthRole; userId: number }) {
  const t = useTranslations();
  const filterState = useAdminFilters();
  const filters = filterState[0];
  const setFilters = filterState[1];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <PageHeading
        label={t("ADMIN.LABEL")}
        title={t("ADMIN.HEADING")}
        description={t("ADMIN.SUBHEADING", {
          role: t(ROLE_LABELS[props.role]),
        })}
      />

      <Tabs
        value={filters.tab}
        onValueChange={(value) =>
          setFilters({
            tab: ADMIN_TABS.find((tab) => tab === value) ?? null,
          })
        }
        className="gap-6"
      >
        <TabsList>
          {ADMIN_TABS.map((tab) => (
            <TabsTrigger key={tab} value={tab}>
              {t(TAB_LABELS[tab])}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="users">
          <AdminUsers
            role={props.role}
            userId={props.userId}
            filters={filters}
            onChange={setFilters}
          />
        </TabsContent>
        <TabsContent value="imports">
          <AdminImports active={filters.tab === "imports"} role={props.role} />
        </TabsContent>
        <TabsContent value="picks">
          <AdminPicks active={filters.tab === "picks"} />
        </TabsContent>
        <TabsContent value="system">
          <AdminSystem active={filters.tab === "system"} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
