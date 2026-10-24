import { dayjs } from "@/lib/utils/format/date";
import type { RecapResponse } from "@/lib/types";
import { getGuildStats } from "@/server/stats/stats.service";

export async function getRecap(input: {
  guildId: string;
  from?: string;
  to?: string;
}): Promise<RecapResponse> {
  const to = input.to ? dayjs(input.to) : dayjs();
  const from = input.from ? dayjs(input.from) : to.subtract(7, "day");
  const cappers = await getGuildStats({
    guildId: input.guildId,
    from: from.toDate(),
    to: to.toDate(),
  });
  return { from: from.toISOString(), to: to.toISOString(), cappers };
}
