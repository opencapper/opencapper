import { t } from "elysia";

export const ParticipantKind = t.Union([
  t.Literal("team"),
  t.Literal("fighter"),
]);
export type ParticipantKind = typeof ParticipantKind.static;

export const PARTICIPANT_KINDS = ParticipantKind.anyOf.map((l) => l.const);
