import { MARK_PLUS } from "@/components/elements/brand/brand";
import type { LedgerEntry } from "@/lib/api/client";
import { bookName } from "@/lib/config/vendor-registry";
import { kelly } from "@/lib/format";
import type { CSSProperties, ReactNode } from "react";

// The bots (openev-bot alert.embed.ts, openev-telegram alert.message.ts) write English only;
// this file mirrors their wording so the page shows the message exactly as it was sent.

const CHECK_PRICE = "Check the price at the book before betting.";
const CHAT_BANKROLL = 1000;
const CHAT_KELLY = 0.25;

const CONFIDENCE_LABEL: Record<LedgerEntry["confidence"], string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
  check: "Check",
};

const CONFIDENCE_COLOR: Record<LedgerEntry["confidence"], string> = {
  high: "#57f287",
  medium: "#fee75c",
  low: "#99aab5",
  check: "#ed4245",
};

function signed(line: number): string {
  return line > 0 ? `+${line}` : String(line);
}

function sideName(e: LedgerEntry): string {
  const line = Number(e.line);
  if (e.market === "total")
    return `${e.side === "over" ? "Over" : "Under"} ${line}`;
  if (e.side === "draw") return "Draw";
  const team = e.side === "home" ? e.home : e.away;
  if (e.market === "asian_handicap")
    return `${team} ${signed(e.side === "home" ? line : -line)}`;
  return team;
}

function marketName(e: LedgerEntry): string {
  const period = e.period === "first_half" ? ", 1st half" : "";
  if (e.market === "three_way") return `Match result${period}`;
  if (e.market === "total") return `Total ${Number(e.line)}${period}`;
  if (e.market === "asian_handicap")
    return `Asian handicap ${signed(Number(e.line))}${period}`;
  return `Moneyline${period}`;
}

function leagueName(league: string): string {
  return league.replace(/\s+-\s+/g, ", ");
}

function decimalOdds(odds: string | number): string {
  return Number(odds).toFixed(2);
}

function percent(x: number): string {
  return `${x >= 0 ? "+" : ""}${(x * 100).toFixed(1)}%`;
}

function stake(e: LedgerEntry): number {
  return Math.round(
    kelly(Number(e.alert_odds), 1 / Number(e.alert_fair_odds), CHAT_KELLY) *
      CHAT_BANKROLL,
  );
}

function telegramRelative(ms: number): string {
  const minutes = Math.round(Math.abs(ms) / 60_000);
  const span =
    minutes < 60
      ? `${minutes}m`
      : minutes < 48 * 60
        ? `${Math.floor(minutes / 60)}h ${minutes % 60}m`
        : `${Math.round(minutes / 1440)} days`;
  return ms >= 0 ? `in ${span}` : `${span} ago`;
}

function telegramKickoff(iso: string, at: number): string {
  const when = new Date(iso).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    hour12: false,
  });
  return `${when} UTC (${telegramRelative(new Date(iso).getTime() - at)})`;
}

// Discord renders <t:x:f> and <t:x:R> in the reader's client; these are the en-GB forms.
function discordFull(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
  });
}

function discordRelative(iso: string, at: number): string {
  const secs = (new Date(iso).getTime() - at) / 1000;
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "always" });
  const abs = Math.abs(secs);
  if (abs < 3600) return rtf.format(Math.round(secs / 60), "minute");
  if (abs < 86_400) return rtf.format(Math.round(secs / 3600), "hour");
  return rtf.format(Math.round(secs / 86_400), "day");
}

function clock(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
  });
}

// The bot's avatar is the mark itself: white plus on near black.
function Avatar(props: { className: string }) {
  return (
    <span className={props.className}>
      <svg aria-hidden viewBox="0 0 24 24" className="size-full">
        <rect width="24" height="24" fill="#0b0b0c" />
        <path d={MARK_PLUS} stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      </svg>
    </span>
  );
}

function Field(props: { name: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-[12px] font-bold text-[#b5bac1]">{props.name}</div>
      <div className="mt-0.5 text-[14px] leading-snug whitespace-pre-line text-[#dbdee1]">
        {props.children}
      </div>
    </div>
  );
}

// Discord's own message stamp: "Today at" for today, the date otherwise.
function sentAt(iso: string, now: number): string {
  const day = (ms: number) =>
    new Date(ms).toLocaleDateString("en-GB", { timeZone: "Europe/London" });
  const at = new Date(iso).getTime();
  return day(at) === day(now)
    ? `Today at ${clock(iso)}`
    : `${day(at)} ${clock(iso)}`;
}

export function DiscordAlert(props: {
  entry: LedgerEntry;
  label: string;
  now: number;
}) {
  const e = props.entry;
  const at = new Date(e.alerted_at).getTime();
  const border: CSSProperties = {
    borderLeftColor: CONFIDENCE_COLOR[e.confidence],
  };
  return (
    <figure className="w-full max-w-[600px] rounded-lg bg-[#313338] p-4 font-sans text-[#dbdee1] sm:p-5">
      <figcaption className="sr-only">{props.label}</figcaption>
      <div className="flex gap-3">
        <Avatar className="block size-10 shrink-0 overflow-hidden rounded-full" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 text-[15px] font-bold text-white">
            OpenEV
            <span className="rounded-[3px] bg-[#5865f2] px-1 py-px text-[10px] font-semibold">
              APP
            </span>
            <time className="text-[12px] font-medium text-[#949ba4]">
              {sentAt(e.alerted_at, props.now)}
            </time>
          </div>
          <div
            className="mt-2 rounded-md border-l-4 bg-[#2b2d31] px-4 py-3"
            style={border}
          >
            <div className="text-[12px] font-semibold text-white">
              {leagueName(e.league)}
            </div>
            <div className="mt-1 text-[16px] font-bold text-[#00a8fc]">
              {`${sideName(e)} at ${bookName(e.book)}`}
            </div>
            <div className="mt-1 text-[14px] whitespace-pre-line">
              {`${e.home} vs ${e.away}\n${marketName(e)}`}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
              <Field name="Odds">
                <b className="text-white">{decimalOdds(e.alert_odds)}</b>
                {`\nfair ${decimalOdds(e.alert_fair_odds)}`}
              </Field>
              <Field name="EV">
                <b className="text-white">{percent(e.alert_ev)}</b>
              </Field>
              <Field name="Confidence">{CONFIDENCE_LABEL[e.confidence]}</Field>
              <Field name="Quarter Kelly">{`${stake(e)} per ${CHAT_BANKROLL}`}</Field>
              <Field name="Kickoff">
                <span className="rounded-[3px] bg-[#3f4147] px-0.5">
                  {discordFull(e.starts_at)}
                </span>
                {"\n"}
                <span className="rounded-[3px] bg-[#3f4147] px-0.5">
                  {discordRelative(e.starts_at, at)}
                </span>
              </Field>
            </div>
            <div className="mt-3 text-[12px] text-[#b5bac1]">
              {CHECK_PRICE}
              <span className="ml-3">{sentAt(e.alerted_at, props.now)}</span>
            </div>
          </div>
          <div className="mt-2 flex gap-2">
            {["Bet details", "Game"].map((l) => (
              <span
                key={l}
                className="rounded-[4px] bg-[#4e5058] px-4 py-1.5 text-[13px] font-medium text-white"
              >
                {l}
              </span>
            ))}
          </div>
        </div>
      </div>
    </figure>
  );
}

export function TelegramAlert(props: {
  entry: LedgerEntry;
  label: string;
  botLabel: string;
}) {
  const e = props.entry;
  const at = new Date(e.alerted_at).getTime();
  return (
    <figure className="w-[300px] justify-self-center rounded-[44px] border border-black/10 bg-[#1a1a1a] p-2.5 sm:w-[320px]">
      <figcaption className="sr-only">{props.label}</figcaption>
      <div className="flex h-[520px] flex-col overflow-hidden rounded-[36px] bg-[#d3e2c6]">
        <div className="flex items-center gap-2.5 border-b border-[#ddd] bg-white px-4 pt-10 pb-3 text-[#111]">
          <Avatar className="block size-9 shrink-0 overflow-hidden rounded-full" />
          <div className="leading-tight">
            <b className="block text-[15px] font-extrabold">OpenEV</b>
            <span className="text-[12px] font-medium text-[#3e8ed0]">
              {props.botLabel}
            </span>
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-end gap-2 px-3 py-3">
          <div className="max-w-[94%] rounded-[16px_16px_16px_4px] bg-white px-3 py-2.5 text-[13px] leading-[1.38] text-[#111] shadow-[0_1px_1px_rgba(0,0,0,0.08)]">
            <p>
              <b>{sideName(e)}</b> at <b>{bookName(e.book)}</b>
            </p>
            <p>{`${e.home} vs ${e.away}, ${marketName(e)}`}</p>
            <p>{leagueName(e.league)}</p>
            <p className="mt-[1.38em]">
              Odds <b>{decimalOdds(e.alert_odds)}</b>, fair{" "}
              {decimalOdds(e.alert_fair_odds)}
            </p>
            <p>
              EV <b>{percent(e.alert_ev)}</b>
            </p>
            <p>Confidence: {CONFIDENCE_LABEL[e.confidence]}</p>
            <p>Kickoff: {telegramKickoff(e.starts_at, at)}</p>
            <p>
              Stake: <b>{stake(e)}</b> per {CHAT_BANKROLL}, quarter Kelly
            </p>
            <p className="mt-[1.38em]">
              <i>{CHECK_PRICE}</i>
            </p>
            <time className="mt-0.5 block text-right text-[10px] text-[#8a9a88]">
              {clock(e.alerted_at)}
            </time>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {["Bet details", "Game"].map((l) => (
              <span
                key={l}
                className="rounded-lg bg-[#ffffffb3] py-2 text-center text-[12px] font-bold text-[#2a7bc0]"
              >
                {l}
              </span>
            ))}
          </div>
        </div>
      </div>
    </figure>
  );
}
