CREATE TABLE "participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"sport_group" text NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"image_url" text,
	"country" text,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "participants_kind_check" CHECK ("participants"."kind" in ('team', 'fighter'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "participants_sport_group_name_idx" ON "participants" USING btree ("sport_group","name");