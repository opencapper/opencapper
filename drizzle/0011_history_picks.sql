CREATE TABLE "history_picks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"platform" text NOT NULL,
	"external_id" text NOT NULL,
	"tx_hash" text NOT NULL,
	"url" text NOT NULL,
	"traded_at" timestamp with time zone NOT NULL,
	"commence_time" timestamp with time zone NOT NULL,
	"sport_key" text NOT NULL,
	"event_slug" text NOT NULL,
	"home" text NOT NULL,
	"away" text NOT NULL,
	"market" text NOT NULL,
	"selection" text NOT NULL,
	"point" numeric(8, 2),
	"odds_decimal" numeric(10, 3) NOT NULL,
	"units" numeric(8, 2) NOT NULL,
	"market_ref" text NOT NULL,
	"outcome_index" integer NOT NULL,
	"result" text NOT NULL,
	"graded_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "history_picks_platform_check" CHECK ("history_picks"."platform" in ('polymarket', 'reddit')),
	CONSTRAINT "history_picks_result_check" CHECK ("history_picks"."result" in ('win', 'loss', 'push', 'void')),
	CONSTRAINT "history_picks_market_check" CHECK ("history_picks"."market" in ('h2h', 'spreads', 'totals')),
	CONSTRAINT "history_picks_units_check" CHECK ("history_picks"."units" > 0),
	CONSTRAINT "history_picks_odds_check" CHECK ("history_picks"."odds_decimal" > 1),
	CONSTRAINT "history_picks_before_start_check" CHECK ("history_picks"."traded_at" < "history_picks"."commence_time")
);
--> statement-breakpoint
ALTER TABLE "history_picks" ADD CONSTRAINT "history_picks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "history_picks_external_idx" ON "history_picks" USING btree ("platform","external_id");--> statement-breakpoint
CREATE UNIQUE INDEX "history_picks_tx_idx" ON "history_picks" USING btree ("tx_hash");--> statement-breakpoint
CREATE INDEX "history_picks_user_idx" ON "history_picks" USING btree ("user_id","commence_time");