import type {
  PayoutAccountStatus,
  PlanInterval,
} from "@/lib/api/typebox/payments";
import { msg } from "@/lib/config/constants";

export const INTERVAL_LABELS = {
  week: msg("PAYMENTS.SELL.INTERVAL_WEEK"),
  month: msg("PAYMENTS.SELL.INTERVAL_MONTH"),
  one_time: msg("PAYMENTS.SELL.INTERVAL_ONE_TIME"),
} satisfies Record<PlanInterval, string>;

export const PRICE_LABELS = {
  week: msg("PAYMENTS.PRICE_WEEK"),
  month: msg("PAYMENTS.PRICE_MONTH"),
  one_time: msg("PAYMENTS.PRICE_ONE_TIME"),
} satisfies Record<PlanInterval, string>;

export const ACCOUNT_STATUS_LABELS = {
  pending: msg("PAYMENTS.SELL.STATUS_PENDING"),
  active: msg("PAYMENTS.SELL.STATUS_ACTIVE"),
  restricted: msg("PAYMENTS.SELL.STATUS_RESTRICTED"),
} satisfies Record<PayoutAccountStatus, string>;

export function formatUsd(cents: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function formatFeeShare(feeBps: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 2,
  }).format(feeBps / 10000);
}
