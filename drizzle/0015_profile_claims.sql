CREATE TABLE "claim_challenges" (
	"id" serial PRIMARY KEY NOT NULL,
	"profile_user_id" integer NOT NULL,
	"claimant_user_id" integer NOT NULL,
	"code" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_attempt_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_claims" (
	"id" serial PRIMARY KEY NOT NULL,
	"profile_user_id" integer NOT NULL,
	"claimant_user_id" integer NOT NULL,
	"method" text NOT NULL,
	"approved_by_user_id" integer,
	"verified_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "profile_claims_method_check" CHECK ("profile_claims"."method" in ('polymarket_bio', 'reddit_bio', 'admin')),
	CONSTRAINT "profile_claims_distinct_check" CHECK ("profile_claims"."profile_user_id" <> "profile_claims"."claimant_user_id")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "hidden_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "claim_challenges" ADD CONSTRAINT "claim_challenges_profile_user_id_users_id_fk" FOREIGN KEY ("profile_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_challenges" ADD CONSTRAINT "claim_challenges_claimant_user_id_users_id_fk" FOREIGN KEY ("claimant_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_claims" ADD CONSTRAINT "profile_claims_profile_user_id_users_id_fk" FOREIGN KEY ("profile_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_claims" ADD CONSTRAINT "profile_claims_claimant_user_id_users_id_fk" FOREIGN KEY ("claimant_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_claims" ADD CONSTRAINT "profile_claims_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "claim_challenges_pair_idx" ON "claim_challenges" USING btree ("profile_user_id","claimant_user_id");--> statement-breakpoint
CREATE INDEX "claim_challenges_claimant_idx" ON "claim_challenges" USING btree ("claimant_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "profile_claims_active_idx" ON "profile_claims" USING btree ("profile_user_id") WHERE "profile_claims"."revoked_at" is null;--> statement-breakpoint
CREATE INDEX "profile_claims_claimant_idx" ON "profile_claims" USING btree ("claimant_user_id");