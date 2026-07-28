CREATE TABLE "customer_profiles" (
	"identity_user_id" text PRIMARY KEY,
	"display_name" text NOT NULL,
	"loyalty_points" integer DEFAULT 0 NOT NULL,
	"notification_preferences" text DEFAULT 'all' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favorite_restaurants" (
	"identity_user_id" text NOT NULL,
	"restaurant_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY,
	"qr_code_id" text NOT NULL,
	"identity_user_id" text,
	"subtotal_cents" integer NOT NULL,
	"tax_cents" integer NOT NULL,
	"total_cents" integer NOT NULL,
	"payment_token_fingerprint" text NOT NULL,
	"status" text DEFAULT 'succeeded' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY,
	"restaurant_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"image_url" text NOT NULL,
	"price_cents" integer NOT NULL,
	"tax_rate" numeric(5,4) DEFAULT '0.0825' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qr_codes" (
	"id" text PRIMARY KEY,
	"product_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"batch_id" text NOT NULL,
	"serial_number" text NOT NULL,
	"status" text DEFAULT 'unused' NOT NULL,
	"redeemed_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "restaurants" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"category" text NOT NULL,
	"accent" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "favorites_user_restaurant_idx" ON "favorite_restaurants" ("identity_user_id","restaurant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_qr_code_idx" ON "payments" ("qr_code_id");--> statement-breakpoint
CREATE INDEX "payments_user_idx" ON "payments" ("identity_user_id");--> statement-breakpoint
CREATE INDEX "products_restaurant_idx" ON "products" ("restaurant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "qr_codes_token_hash_idx" ON "qr_codes" ("token_hash");--> statement-breakpoint
CREATE INDEX "qr_codes_batch_idx" ON "qr_codes" ("batch_id");--> statement-breakpoint
CREATE INDEX "qr_codes_status_idx" ON "qr_codes" ("status");--> statement-breakpoint
ALTER TABLE "favorite_restaurants" ADD CONSTRAINT "favorite_restaurants_restaurant_id_restaurants_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_qr_code_id_qr_codes_id_fkey" FOREIGN KEY ("qr_code_id") REFERENCES "qr_codes"("id");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_restaurant_id_restaurants_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE;