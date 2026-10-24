import { getDb } from "@/lib/db/server/client";
import { users } from "@/lib/db/schema/server";
import { fetchProfileImage, pause } from "@/server/polymarket/polymarket.api";
import { eq } from "drizzle-orm";

export async function refreshPolymarketImages() {
  const rows = await getDb()
    .select({
      id: users.id,
      wallet: users.sourceHandle,
      imageUrl: users.imageUrl,
    })
    .from(users)
    .where(eq(users.sourcePlatform, "polymarket"));
  for (const row of rows) {
    if (!row.wallet) continue;
    const image = await fetchProfileImage(row.wallet).catch(() => undefined);
    if (image !== undefined && image !== row.imageUrl)
      await getDb()
        .update(users)
        .set({ imageUrl: image })
        .where(eq(users.id, row.id));
    await pause(1000);
  }
}
