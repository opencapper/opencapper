CREATE TABLE "pick_sources" (
	"pick_id" integer PRIMARY KEY NOT NULL,
	"platform" text NOT NULL,
	"external_id" text NOT NULL,
	"url" text NOT NULL,
	"posted_at" timestamp with time zone NOT NULL,
	"raw_text" text,
	"market_ref" text,
	"outcome_index" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pick_sources_platform_check" CHECK ("pick_sources"."platform" in ('polymarket', 'reddit'))
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "source_platform" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "source_handle" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "source_url" text;--> statement-breakpoint
ALTER TABLE "pick_sources" ADD CONSTRAINT "pick_sources_pick_id_picks_id_fk" FOREIGN KEY ("pick_id") REFERENCES "public"."picks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "pick_sources_external_idx" ON "pick_sources" USING btree ("platform","external_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_source_idx" ON "users" USING btree ("source_platform","source_handle");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_source_platform_check" CHECK ("users"."source_platform" in ('polymarket', 'reddit'));--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_source_complete_check" CHECK (("users"."source_platform" is null) = ("users"."source_handle" is null) and ("users"."source_platform" is null) = ("users"."source_url" is null));