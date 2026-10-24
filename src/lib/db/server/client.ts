import { serverEnv } from "@/server/env";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/lib/db/schema/server";

export type Db = PostgresJsDatabase<typeof schema>;

let db: Db | null = null;

// Lazy so `next build` imports route modules without a DATABASE_URL.
export function getDb(): Db {
  if (db) return db;
  const url = serverEnv.databaseUrl;
  if (!url) throw new Error("DATABASE_URL is not set");
  db = drizzle(postgres(url, { onnotice: () => {} }), { schema });
  return db;
}
