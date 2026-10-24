ALTER TABLE "users" ALTER COLUMN "discord_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "telegram_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "auth_user_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_auth_user_id_user_id_fk" FOREIGN KEY ("auth_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_telegram_id_unique" UNIQUE("telegram_id");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_auth_user_id_unique" UNIQUE("auth_user_id");