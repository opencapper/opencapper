import { getDb } from "@/lib/db/server/client";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { resolve } from "node:path";

export async function runMigrations() {
  await migrate(getDb(), { migrationsFolder: resolve("drizzle") });
}
