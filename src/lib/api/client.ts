import createClient from "openapi-fetch";
import type { components, paths } from "@/lib/api/schema";

export type ValueBet = components["schemas"]["ValueBet"];
export type Stats = components["schemas"]["Stats"];

// Server side only: the API sits on the internal network next to this app.
export const api = createClient<paths>({
  baseUrl: process.env.OPENEV_API_URL ?? "http://127.0.0.1:8085",
});
