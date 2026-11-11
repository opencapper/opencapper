"use client";

import { useEffect, useState } from "react";

const FLASH_MS = 1_600;

type Mark = { kind: "in" | "up" | "out"; n: number; at: number };
type Ghost<T> = { key: string; row: T; index: number; at: number };

type Tracked<T> = {
  print: string;
  scope: string;
  rows: Map<string, { row: T; sig: string; index: number }>;
  marks: Map<string, Mark>;
  ghosts: Ghost<T>[];
};

function fingerprint<T>(
  rows: T[],
  keyOf: (r: T) => string,
  sigOf: (r: T) => string,
): string {
  return rows.map((r) => `${keyOf(r)}=${sigOf(r)}`).join("|");
}

function index<T>(rows: T[], keyOf: (r: T) => string, sigOf: (r: T) => string) {
  return new Map(
    rows.map((row, i) => [keyOf(row), { row, sig: sigOf(row), index: i }]),
  );
}

// Rows that appear, change or leave get a short highlight; a leaving row stays a moment, faded.
export function useRowFlash<T>(
  rows: T[],
  scope: string,
  keyOf: (r: T) => string,
  sigOf: (r: T) => string,
): { rows: T[]; flash: (key: string) => string | undefined } {
  const print = fingerprint(rows, keyOf, sigOf);
  const state = useState<Tracked<T>>(() => ({
    print,
    scope,
    rows: index(rows, keyOf, sigOf),
    marks: new Map(),
    ghosts: [],
  }));
  let tracked = state[0];
  const setTracked = state[1];

  if (tracked.print !== print) {
    const next = index(rows, keyOf, sigOf);
    const now = Date.now();
    if (tracked.scope !== scope) {
      tracked = { print, scope, rows: next, marks: new Map(), ghosts: [] };
    } else {
      const marks = new Map(tracked.marks);
      for (const entry of next) {
        const before = tracked.rows.get(entry[0]);
        const mark = marks.get(entry[0]);
        if (!before)
          marks.set(entry[0], { kind: "in", n: (mark?.n ?? 0) + 1, at: now });
        else if (before.sig !== entry[1].sig)
          marks.set(entry[0], { kind: "up", n: (mark?.n ?? 0) + 1, at: now });
      }
      const ghosts = tracked.ghosts.filter((g) => !next.has(g.key));
      for (const entry of tracked.rows) {
        if (next.has(entry[0]) || ghosts.some((g) => g.key === entry[0]))
          continue;
        ghosts.push({
          key: entry[0],
          row: entry[1].row,
          index: entry[1].index,
          at: now,
        });
        marks.set(entry[0], { kind: "out", n: 0, at: now });
      }
      tracked = { print, scope, rows: next, marks, ghosts };
    }
    setTracked(tracked);
  }

  const pending = tracked.marks.size > 0 || tracked.ghosts.length > 0;
  useEffect(() => {
    if (!pending) return;
    const id = setTimeout(() => {
      const cutoff = Date.now() - FLASH_MS;
      setTracked((t) => ({
        ...t,
        marks: new Map([...t.marks].filter((e) => e[1].at > cutoff)),
        ghosts: t.ghosts.filter((g) => g.at > cutoff),
      }));
    }, FLASH_MS);
    return () => clearTimeout(id);
  }, [pending, tracked.marks, setTracked]);

  const out = rows.slice();
  for (const g of tracked.ghosts)
    out.splice(Math.min(g.index, out.length), 0, g.row);
  const marks = tracked.marks;
  return {
    rows: out,
    flash: (key) => {
      const m = marks.get(key);
      if (!m) return undefined;
      return m.kind === "up" ? `live-up-${m.n % 2}` : `live-${m.kind}`;
    },
  };
}
