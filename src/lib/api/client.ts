import createClient from "openapi-fetch";
import type { components, paths } from "@/lib/api/schema";

type Schemas = components["schemas"];
export type ValueBet = Schemas["ValueBet"];
export type ValueBetList = Schemas["ValueBetList"];
export type BetDetail = Schemas["BetDetail"];
export type LedgerView = Schemas["LedgerView"];
export type Stats = Schemas["Stats"];
export type Game = Schemas["Game"];
export type GameSummary = Schemas["GameSummary"];
export type Market = Schemas["Market"];
export type Outcome = Schemas["Outcome"];
export type BookPrice = Schemas["BookPrice"];
export type Arb = Schemas["Arb"];
export type LedgerEntry = Schemas["LedgerEntry"];
export type LedgerStats = Schemas["LedgerStats"];
export type BookStatus = Schemas["BookStatus"];
export type PricePoint = Schemas["PricePoint"];
export type Confidence = ValueBet["confidence"];
export type User = Schemas["User"];
export type Settings = Schemas["Settings"];
export type Bet = Schemas["Bet"];
export type BetStatus = Schemas["BetStatus"];
export type BetPatch = Schemas["BetPatch"];
export type NewBet = Schemas["NewBet"];
export type BetStats = Schemas["BetStats"];
export type BetTotals = Schemas["BetTotals"];
export type BookHealth = Schemas["BookHealth"];
export type HealthRisk = Schemas["HealthRisk"];
export type HealthWarningCode = Schemas["HealthWarningCode"];
export type ServerMessage = Schemas["ServerMessage"];
export type ClientMessage = Schemas["ClientMessage"];
export type LivePrice = Schemas["LivePrice"];

// Server side only: the API sits on the internal network next to this app.
export const api = createClient<paths>({
  baseUrl: process.env.OPENEV_API_URL ?? "http://127.0.0.1:8085",
});

// A network failure throws instead of returning an error; callers render one fallback for both.
export async function load<T>(request: Promise<{ data?: T }>): Promise<T | undefined> {
  const res = await request.catch(() => undefined);
  return res?.data;
}
