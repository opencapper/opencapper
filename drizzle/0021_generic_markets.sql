CREATE TABLE "event_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"sport_key" text NOT NULL,
	"event_id" text NOT NULL,
	"source" text NOT NULL,
	"status" text NOT NULL,
	"winner" text,
	"home_score" numeric(8, 2),
	"away_score" numeric(8, 2),
	"method" text,
	"method_detail" text,
	"periods_scheduled" integer,
	"period_ended" integer,
	"period_clock" integer,
	"bonuses" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_results_status_check" CHECK ("event_results"."status" in ('final', 'cancelled', 'postponed')),
	CONSTRAINT "event_results_winner_check" CHECK ("event_results"."winner" in ('home', 'away', 'draw'))
);
--> statement-breakpoint
ALTER TABLE "history_picks" DROP CONSTRAINT "history_picks_market_check";--> statement-breakpoint
ALTER TABLE "pick_settlements" DROP CONSTRAINT "pick_settlements_void_reason_check";--> statement-breakpoint
ALTER TABLE "picks" DROP CONSTRAINT "picks_market_check";--> statement-breakpoint
ALTER TABLE "picks" ADD COLUMN "spec" jsonb NOT NULL;--> statement-breakpoint
CREATE INDEX "event_results_event_idx" ON "event_results" USING btree ("sport_key","event_id","id");--> statement-breakpoint
ALTER TABLE "history_picks" ADD CONSTRAINT "history_picks_market_check" CHECK ("history_picks"."market" in ('h2h', 'spreads', 'totals', 'method', 'period_win', 'distance'));--> statement-breakpoint
ALTER TABLE "pick_settlements" ADD CONSTRAINT "pick_settlements_void_reason_check" CHECK ("pick_settlements"."void_reason" in ('postponed', 'timeout', 'cancelled', 'no_contest'));--> statement-breakpoint
ALTER TABLE "picks" ADD CONSTRAINT "picks_market_check" CHECK ("picks"."market" in ('h2h', 'spreads', 'totals', 'method', 'period_win', 'distance'));