CREATE TABLE "pick_settlements" (
	"pick_id" integer PRIMARY KEY NOT NULL,
	"result" text DEFAULT 'pending' NOT NULL,
	"home_score" numeric(8, 2),
	"away_score" numeric(8, 2),
	"graded_at" timestamp with time zone,
	"closing_odds_decimal" numeric(10, 3),
	"closing_bookmaker" text,
	"closing_captured_at" timestamp with time zone,
	"clv" numeric(10, 6),
	CONSTRAINT "pick_settlements_result_check" CHECK ("pick_settlements"."result" in ('pending', 'win', 'loss', 'push', 'void')),
	CONSTRAINT "pick_settlements_closing_odds_check" CHECK ("pick_settlements"."closing_odds_decimal" > 1)
);
--> statement-breakpoint
ALTER TABLE "pick_settlements" ADD CONSTRAINT "pick_settlements_pick_id_picks_id_fk" FOREIGN KEY ("pick_id") REFERENCES "public"."picks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pick_settlements_graded_at_idx" ON "pick_settlements" USING btree ("graded_at");