import { dayjs } from "@/lib/utils/format/date";
import type {
  Pick,
  PickDisqualification,
  PickSettlement,
  PickSource,
} from "@/lib/db/schema/server";
import type { ApiPick } from "@/lib/types";
import {
  participantFields,
  type ParticipantImages,
} from "@/server/participants/participants.service";

export function toAmericanOdds(decimal: number): number {
  return decimal >= 2
    ? Math.round((decimal - 1) * 100)
    : Math.round(-100 / (decimal - 1));
}

export function toApiPick(
  pick: Pick,
  username: string,
  images: ParticipantImages,
  settlement?: PickSettlement | null,
  logSeq: number | null = null,
  source: PickSource | null = null,
  disqualification: PickDisqualification | null = null,
): ApiPick {
  const closing = settlement?.closingOddsDecimal ?? null;
  const clv = settlement?.clv ?? null;
  return {
    id: String(pick.id),
    sequence: pick.sequence,
    username,
    sportKey: pick.sportKey,
    eventId: pick.eventId,
    home: pick.home,
    away: pick.away,
    commenceTime: dayjs(pick.commenceTime).toISOString(),
    market: pick.market,
    selection: pick.selection,
    point: pick.point,
    units: pick.units,
    odds: toAmericanOdds(pick.oddsDecimal),
    bookmaker: pick.bookmaker,
    result: pick.result,
    createdAt: dayjs(pick.createdAt).toISOString(),
    logSeq,
    ...participantFields(images, pick.sportKey, pick.home, pick.away),
    ...(closing === null ? {} : { closingOdds: toAmericanOdds(closing) }),
    ...(clv === null ? {} : { clv }),
    ...(source === null
      ? {}
      : {
          source: {
            platform: source.platform,
            url: source.url,
            postedAt: dayjs(source.postedAt).toISOString(),
          },
        }),
    ...(disqualification === null
      ? {}
      : {
          disqualified: {
            actualStart: dayjs(disqualification.actualStart).toISOString(),
          },
        }),
  };
}
