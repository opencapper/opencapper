CREATE TABLE "capper_payout_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"provider" text NOT NULL,
	"external_account_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "capper_payout_accounts_provider_check" CHECK ("capper_payout_accounts"."provider" in ('whop')),
	CONSTRAINT "capper_payout_accounts_status_check" CHECK ("capper_payout_accounts"."status" in ('pending', 'active', 'restricted'))
);
--> statement-breakpoint
CREATE TABLE "capper_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"price_cents" integer NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"interval" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "capper_plans_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "capper_plans_interval_check" CHECK ("capper_plans"."interval" in ('week', 'month', 'one_time')),
	CONSTRAINT "capper_plans_currency_check" CHECK ("capper_plans"."currency" = 'usd'),
	CONSTRAINT "capper_plans_price_check" CHECK ("capper_plans"."price_cents" > 0)
);
--> statement-breakpoint
CREATE TABLE "payment_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"event_id" text NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_events_provider_check" CHECK ("payment_events"."provider" in ('whop'))
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"buyer_user_id" integer NOT NULL,
	"capper_user_id" integer NOT NULL,
	"provider" text NOT NULL,
	"external_membership_id" text NOT NULL,
	"status" text NOT NULL,
	"current_period_end" timestamp with time zone,
	"provider_updated_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_provider_check" CHECK ("subscriptions"."provider" in ('whop')),
	CONSTRAINT "subscriptions_status_check" CHECK ("subscriptions"."status" in ('active', 'canceled', 'past_due'))
);
--> statement-breakpoint
ALTER TABLE "capper_payout_accounts" ADD CONSTRAINT "capper_payout_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capper_plans" ADD CONSTRAINT "capper_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_buyer_user_id_users_id_fk" FOREIGN KEY ("buyer_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_capper_user_id_users_id_fk" FOREIGN KEY ("capper_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "capper_payout_accounts_user_provider_idx" ON "capper_payout_accounts" USING btree ("user_id","provider");--> statement-breakpoint
CREATE UNIQUE INDEX "capper_payout_accounts_external_idx" ON "capper_payout_accounts" USING btree ("provider","external_account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_events_provider_event_idx" ON "payment_events" USING btree ("provider","event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_external_idx" ON "subscriptions" USING btree ("provider","external_membership_id");--> statement-breakpoint
CREATE INDEX "subscriptions_buyer_capper_idx" ON "subscriptions" USING btree ("buyer_user_id","capper_user_id");--> statement-breakpoint
CREATE INDEX "subscriptions_capper_idx" ON "subscriptions" USING btree ("capper_user_id");