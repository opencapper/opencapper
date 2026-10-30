import { isRecord } from "@/lib/utils/base";

type Stored = Record<string, unknown>;

// Allow lists, never deny lists: a field Whop adds later (email, address, IP, card, risk) stays out by default.
const ENVELOPE_FIELDS = ["id", "type", "timestamp", "account_id"];
const BASE_FIELDS = ["id", "status", "created_at", "updated_at"];
const MEMBERSHIP_FIELDS = [
  ...BASE_FIELDS,
  "product_id",
  "variant_id",
  "cancel_at_period_end",
  "canceled_at",
  "current_period_start",
  "current_period_end",
  "expires_at",
];
const PAYMENT_FIELDS = [
  ...BASE_FIELDS,
  "paid_at",
  "currency",
  "account_id",
  "product_id",
  "variant_id",
  "membership_id",
];
const PAYMENT_AMOUNTS = [
  "total",
  "subtotal",
  "usd_total",
  "amount_after_fees",
  "refunded_amount",
  "application_fee",
  "application_fee_amount",
  "platform_fee",
  "platform_fee_amount",
];
const METADATA_FIELDS = ["buyer_user_id", "capper_user_id"];

function scalar(value: unknown): boolean {
  return (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

function pick(source: Stored, fields: string[]): Stored {
  const out: Stored = {};
  for (const field of fields) {
    if (field in source && scalar(source[field])) out[field] = source[field];
  }
  return out;
}

// Whop amounts come as a number or as a Money object; only the figure and currency are kept.
function amount(value: unknown): unknown {
  if (scalar(value)) return value;
  if (!isRecord(value)) return undefined;
  return pick(value, ["amount", "currency", "decimals"]);
}

function minimizeData(type: string, data: Stored): Stored {
  if (type.startsWith("membership.")) {
    const account = isRecord(data.account) ? data.account : {};
    const metadata = isRecord(data.metadata) ? data.metadata : {};
    return {
      ...pick(data, MEMBERSHIP_FIELDS),
      account_id: typeof account.id === "string" ? account.id : null,
      metadata: pick(metadata, METADATA_FIELDS),
    };
  }
  if (type.startsWith("payment.")) {
    const out = pick(data, PAYMENT_FIELDS);
    for (const field of PAYMENT_AMOUNTS) {
      const value = amount(data[field]);
      if (field in data && value !== undefined) out[field] = value;
    }
    return out;
  }
  return pick(data, BASE_FIELDS);
}

export function minimizeWhopEvent(event: Stored): Stored {
  const type = typeof event.type === "string" ? event.type : "";
  return {
    ...pick(event, ENVELOPE_FIELDS),
    data: isRecord(event.data) ? minimizeData(type, event.data) : null,
  };
}
