import type { ClientMessage, ServerMessage } from "@/lib/api/client";

export type LiveStatus = "connecting" | "live" | "reconnecting" | "offline";

export type LiveFilters = {
  min_ev?: number;
  book?: string;
  include_check?: boolean;
  min_profit?: number;
};

export type LiveHandler = (frames: ServerMessage[]) => void;

type Sub = {
  topic: string;
  filters: LiveFilters;
  handlers: Set<LiveHandler>;
  // Diffs that arrive before the answer to the latest subscribe belong to an older state.
  ready: boolean;
};

const URL_DEFAULT = "wss://openev.coding-global.com/v1/ws";
const PING_MS = 20_000;
// Two missed pongs; the server's own pings are invisible to the page.
const DEAD_MS = 45_000;
const HIDDEN_PAUSE_MS = 60_000;
const RETRY_BASE_MS = 1_000;
const RETRY_MAX_MS = 30_000;
const OFFLINE_AFTER = 4;
const MAX_QUEUE = 5_000;
const WARMUP_MS = 3_000;

const SNAPSHOTS = new Set<ServerMessage["type"]>([
  "value_bets_snapshot",
  "arbs_snapshot",
  "ledger_snapshot",
  "game_snapshot",
  "bet_snapshot",
]);

function isServerMessage(value: unknown): value is ServerMessage {
  if (typeof value !== "object" || value === null) return false;
  return (
    "v" in value &&
    value.v === 1 &&
    "seq" in value &&
    typeof value.seq === "number" &&
    "type" in value &&
    typeof value.type === "string"
  );
}

class LiveSocket {
  status: LiveStatus = "connecting";
  private url: string;
  private ws?: WebSocket;
  private welcomed = false;
  private subs = new Map<string, Sub>();
  private listeners = new Set<() => void>();
  private seq = 0;
  private attempts = 0;
  private lastFrame = 0;
  private paused = false;
  private queue: ServerMessage[] = [];
  private frame?: number;
  private retryTimer?: ReturnType<typeof setTimeout>;
  private pingTimer?: ReturnType<typeof setInterval>;
  private hiddenTimer?: ReturnType<typeof setTimeout>;
  private warmTimer?: ReturnType<typeof setTimeout>;

  constructor(url: string) {
    this.url = url;
    document.addEventListener("visibilitychange", () => this.onVisibility());
    window.addEventListener("focus", () => this.resume());
    window.addEventListener("online", () => this.resume());
    window.addEventListener("offline", () => this.ws?.close());
  }

  onStatus(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  subscribe(
    topic: string,
    filters: LiveFilters,
    handler: LiveHandler,
  ): () => void {
    let sub = this.subs.get(topic);
    if (!sub) {
      sub = { topic, filters, handlers: new Set(), ready: false };
      this.subs.set(topic, sub);
    }
    const current = sub;
    current.filters = filters;
    current.handlers.add(handler);
    // A fresh snapshot for every new listener, so none starts from diffs alone.
    this.request(current);
    this.open();
    return () => {
      current.handlers.delete(handler);
      if (current.handlers.size > 0 || this.subs.get(topic) !== current) return;
      this.subs.delete(topic);
      this.send({ type: "unsubscribe", topic });
    };
  }

  private setStatus(status: LiveStatus) {
    if (this.status === status) return;
    this.status = status;
    for (const l of this.listeners) l();
  }

  private send(msg: ClientMessage) {
    if (this.ws?.readyState === WebSocket.OPEN && this.welcomed)
      this.ws.send(JSON.stringify(msg));
  }

  private request(sub: Sub) {
    sub.ready = false;
    this.send({ type: "subscribe", topic: sub.topic, ...sub.filters });
  }

  private resync() {
    this.queue = [];
    for (const sub of this.subs.values()) this.request(sub);
  }

  private warmup() {
    if (this.warmTimer) return;
    this.warmTimer = setTimeout(() => {
      this.warmTimer = undefined;
      this.resync();
    }, WARMUP_MS);
  }

  private open() {
    if (this.ws || this.paused || this.retryTimer || this.subs.size === 0)
      return;
    this.setStatus(
      this.attempts === 0
        ? "connecting"
        : this.status === "offline"
          ? "offline"
          : "reconnecting",
    );
    const ws = new WebSocket(this.url);
    this.ws = ws;
    this.welcomed = false;
    ws.onopen = () => {
      this.seq = 0;
      this.lastFrame = Date.now();
      clearInterval(this.pingTimer);
      this.pingTimer = setInterval(() => this.heartbeat(), PING_MS);
    };
    ws.onmessage = (e) => this.onMessage(ws, e);
    ws.onclose = () => this.onClose(ws);
  }

  private heartbeat() {
    if (Date.now() - this.lastFrame > DEAD_MS) {
      this.ws?.close();
      return;
    }
    this.send({ type: "ping" });
  }

  private onMessage(ws: WebSocket, e: MessageEvent) {
    if (ws !== this.ws || typeof e.data !== "string") return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(e.data);
    } catch {
      return;
    }
    if (!isServerMessage(parsed)) return;
    const msg = parsed;
    this.lastFrame = Date.now();
    const gap = this.seq !== 0 && msg.seq !== this.seq + 1;
    this.seq = msg.seq;
    if (msg.type === "welcome") {
      this.welcomed = true;
      this.attempts = 0;
      this.setStatus("live");
      this.resync();
      return;
    }
    if (gap) {
      this.resync();
      return;
    }
    if (msg.type === "pong" || msg.type === "unsubscribed") return;
    if (msg.type === "error") {
      console.warn("live:", msg.code, msg.message);
      return;
    }
    this.queue.push(msg);
    if (this.queue.length > MAX_QUEUE) {
      this.resync();
      return;
    }
    if (this.frame === undefined)
      this.frame = requestAnimationFrame(() => this.flush());
  }

  // One cache write per topic per animation frame, however many frames arrived.
  private flush() {
    this.frame = undefined;
    const frames = this.queue;
    this.queue = [];
    const byTopic = new Map<Sub, ServerMessage[]>();
    for (const f of frames) {
      const sub = f.topic ? this.subs.get(f.topic) : undefined;
      if (!sub) continue;
      // A freshly started API answers with an empty board and sends no diff for its first one.
      if (f.type === "value_bets_snapshot" && !f.stats.updated_at) {
        this.warmup();
        continue;
      }
      if (SNAPSHOTS.has(f.type)) sub.ready = true;
      else if (!sub.ready) continue;
      const list = byTopic.get(sub);
      if (list) list.push(f);
      else byTopic.set(sub, [f]);
    }
    for (const entry of byTopic) {
      for (const h of entry[0].handlers) h(entry[1]);
    }
  }

  private onClose(ws: WebSocket) {
    if (ws !== this.ws) return;
    this.ws = undefined;
    this.welcomed = false;
    clearInterval(this.pingTimer);
    this.queue = [];
    for (const sub of this.subs.values()) sub.ready = false;
    if (this.paused) {
      this.setStatus("offline");
      return;
    }
    if (this.subs.size === 0) {
      this.attempts = 0;
      return;
    }
    this.attempts += 1;
    const cap = Math.min(
      RETRY_MAX_MS,
      RETRY_BASE_MS * 2 ** (this.attempts - 1),
    );
    const delay = cap / 2 + Math.random() * (cap / 2);
    this.setStatus(
      this.attempts >= OFFLINE_AFTER || !navigator.onLine
        ? "offline"
        : "reconnecting",
    );
    this.retryTimer = setTimeout(() => {
      this.retryTimer = undefined;
      this.open();
    }, delay);
  }

  private onVisibility() {
    if (document.visibilityState === "visible") {
      this.resume();
      return;
    }
    clearTimeout(this.hiddenTimer);
    this.hiddenTimer = setTimeout(() => {
      this.paused = true;
      clearTimeout(this.retryTimer);
      this.retryTimer = undefined;
      if (this.ws) this.ws.close(1000);
      else this.setStatus("offline");
    }, HIDDEN_PAUSE_MS);
  }

  private resume() {
    clearTimeout(this.hiddenTimer);
    if (this.ws) return;
    this.paused = false;
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = undefined;
    }
    this.open();
  }
}

let socket: LiveSocket | undefined;

export function liveSocket(): LiveSocket {
  if (!socket)
    socket = new LiveSocket(process.env.NEXT_PUBLIC_WS_URL || URL_DEFAULT);
  return socket;
}
