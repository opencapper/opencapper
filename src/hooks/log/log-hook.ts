"use client";

import { useElysiaQuery } from "@/lib/react-query/hooks";
import { queryKeys } from "@/lib/react-query/keys";
import { rpc } from "@/lib/rpc";
import type { LogEntry } from "@/lib/types";
import { msg } from "@/lib/config/constants";
import { handleElysia, isRecord } from "@/lib/utils/base";
import { useQuery } from "@tanstack/react-query";

export type LogVerification = {
  entry: LogEntry;
  computedLeaf: string;
  computedRoot: string;
  idMatches: boolean;
  leafMatches: boolean;
  rootMatches: boolean;
};

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

function fromHex(hex: string): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++)
    out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export type VerifyTarget =
  | { kind: "pick"; pickId: number }
  | { kind: "user"; username: string; seq: number };

function canonicalField(canonical: string, field: string): unknown {
  const parsed: unknown = JSON.parse(canonical);
  return isRecord(parsed) ? parsed[field] : null;
}

async function verifyEntry(
  target: VerifyTarget,
  entry: LogEntry,
): Promise<LogVerification> {
  const leaf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(entry.canonical),
  );
  const chained = new Uint8Array(64);
  chained.set(fromHex(entry.prevRoot), 0);
  chained.set(new Uint8Array(leaf), 32);
  const root = await crypto.subtle.digest("SHA-256", chained);
  const computedLeaf = toHex(leaf);
  const computedRoot = toHex(root);
  const id = canonicalField(entry.canonical, "id");
  const idMatches =
    target.kind === "pick"
      ? id === target.pickId
      : String(id) === entry.pickId &&
        canonicalField(entry.canonical, "sequence") === target.seq;
  return {
    entry,
    computedLeaf,
    computedRoot,
    idMatches,
    leafMatches: computedLeaf === entry.leaf,
    rootMatches: computedRoot === entry.root,
  };
}

function fetchEntry(target: VerifyTarget) {
  if (target.kind === "pick")
    return rpc.api.log.picks({ id: String(target.pickId) }).get();
  return rpc.api.log
    .users({ username: target.username })({ seq: String(target.seq) })
    .get();
}

function verifyKey(target: VerifyTarget | null) {
  if (!target) return queryKeys.logVerifyPick(0);
  return target.kind === "pick"
    ? queryKeys.logVerifyPick(target.pickId)
    : queryKeys.logVerifyUserSeq(target.username.toLowerCase(), target.seq);
}

export function useLogHeadQuery() {
  return useElysiaQuery(queryKeys.logHead(), () => rpc.api.log.head.get());
}

export function useLogAnchorsQuery() {
  return useElysiaQuery(queryKeys.logAnchors(), () =>
    rpc.api.log.anchors.get(),
  );
}

export function useLogVerifyQuery(target: VerifyTarget | null) {
  return useQuery({
    queryKey: verifyKey(target),
    enabled: target !== null,
    retry: false,
    queryFn: async () => {
      if (!target) throw new Error(msg("ERRORS.NOTHING_TO_VERIFY"));
      return verifyEntry(target, handleElysia(await fetchEntry(target)));
    },
  });
}
