CREATE TABLE "pick_disqualifications" (
	"pick_id" integer PRIMARY KEY NOT NULL,
	"actual_start" timestamp with time zone NOT NULL,
	"detected_by" text NOT NULL,
	"evidence" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pick_disqualifications_detected_by_check" CHECK ("pick_disqualifications"."detected_by" in ('import', 'grading', 'repair'))
);
--> statement-breakpoint
CREATE TABLE "pick_result_changes" (
	"id" serial PRIMARY KEY NOT NULL,
	"pick_id" integer NOT NULL,
	"from_result" text NOT NULL,
	"to_result" text NOT NULL,
	"reason" text NOT NULL,
	"actor" text NOT NULL,
	"txid" bigint DEFAULT txid_current() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pick_result_changes_from_check" CHECK ("pick_result_changes"."from_result" in ('pending', 'win', 'loss', 'push', 'void', 'half_win', 'half_loss', 'split')),
	CONSTRAINT "pick_result_changes_to_check" CHECK ("pick_result_changes"."to_result" in ('pending', 'win', 'loss', 'push', 'void', 'half_win', 'half_loss', 'split'))
);
--> statement-breakpoint
ALTER TABLE "history_picks" DROP CONSTRAINT "history_picks_result_check";--> statement-breakpoint
ALTER TABLE "pick_settlements" DROP CONSTRAINT "pick_settlements_result_check";--> statement-breakpoint
ALTER TABLE "picks" DROP CONSTRAINT "picks_result_check";--> statement-breakpoint
ALTER TABLE "pick_settlements" ADD COLUMN "void_reason" text;--> statement-breakpoint
ALTER TABLE "pick_disqualifications" ADD CONSTRAINT "pick_disqualifications_pick_id_picks_id_fk" FOREIGN KEY ("pick_id") REFERENCES "public"."picks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pick_result_changes" ADD CONSTRAINT "pick_result_changes_pick_id_picks_id_fk" FOREIGN KEY ("pick_id") REFERENCES "public"."picks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pick_result_changes_pick_idx" ON "pick_result_changes" USING btree ("pick_id");--> statement-breakpoint
ALTER TABLE "history_picks" ADD CONSTRAINT "history_picks_result_check" CHECK ("history_picks"."result" in ('win', 'loss', 'push', 'void', 'half_win', 'half_loss', 'split'));--> statement-breakpoint
ALTER TABLE "pick_settlements" ADD CONSTRAINT "pick_settlements_void_reason_check" CHECK ("pick_settlements"."void_reason" in ('postponed', 'timeout'));--> statement-breakpoint
ALTER TABLE "pick_settlements" ADD CONSTRAINT "pick_settlements_result_check" CHECK ("pick_settlements"."result" in ('pending', 'win', 'loss', 'push', 'void', 'half_win', 'half_loss', 'split'));--> statement-breakpoint
ALTER TABLE "picks" ADD CONSTRAINT "picks_result_check" CHECK ("picks"."result" in ('pending', 'win', 'loss', 'push', 'void', 'half_win', 'half_loss', 'split'));