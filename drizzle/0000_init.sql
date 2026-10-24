CREATE TABLE "picks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"guild_id" text,
	"sequence" integer NOT NULL,
	"sport_key" text NOT NULL,
	"event_id" text NOT NULL,
	"home" text NOT NULL,
	"away" text NOT NULL,
	"commence_time" timestamp with time zone NOT NULL,
	"market" text NOT NULL,
	"selection" text NOT NULL,
	"point" numeric(8, 2),
	"bookmaker" text NOT NULL,
	"odds_decimal" numeric(10, 3) NOT NULL,
	"odds_captured_at" timestamp with time zone NOT NULL,
	"units" numeric(8, 2) NOT NULL,
	"result" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "picks_result_check" CHECK ("picks"."result" in ('pending', 'win', 'loss', 'push', 'void')),
	CONSTRAINT "picks_market_check" CHECK ("picks"."market" in ('h2h', 'spreads', 'totals')),
	CONSTRAINT "picks_units_check" CHECK ("picks"."units" > 0),
	CONSTRAINT "picks_odds_check" CHECK ("picks"."odds_decimal" > 1)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"discord_id" text NOT NULL,
	"username" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_discord_id_unique" UNIQUE("discord_id"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "picks" ADD CONSTRAINT "picks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "picks_user_sequence_idx" ON "picks" USING btree ("user_id","sequence");--> statement-breakpoint
CREATE INDEX "picks_guild_commence_idx" ON "picks" USING btree ("guild_id","commence_time");