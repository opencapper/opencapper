CREATE TABLE "log_anchors" (
	"id" serial PRIMARY KEY NOT NULL,
	"root" "bytea" NOT NULL,
	"size" bigint NOT NULL,
	"ots" "bytea" NOT NULL,
	"upgraded" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pick_log" (
	"seq" bigint PRIMARY KEY NOT NULL,
	"pick_id" integer NOT NULL,
	"leaf_hash" "bytea" NOT NULL,
	"prev_root" "bytea" NOT NULL,
	"root" "bytea" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pick_log_pick_id_unique" UNIQUE("pick_id"),
	CONSTRAINT "pick_log_seq_check" CHECK ("pick_log"."seq" > 0),
	CONSTRAINT "pick_log_hash_length_check" CHECK (octet_length("pick_log"."leaf_hash") = 32 and octet_length("pick_log"."prev_root") = 32 and octet_length("pick_log"."root") = 32)
);
--> statement-breakpoint
ALTER TABLE "pick_log" ADD CONSTRAINT "pick_log_pick_id_picks_id_fk" FOREIGN KEY ("pick_id") REFERENCES "public"."picks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "log_anchors_created_idx" ON "log_anchors" USING btree ("created_at");