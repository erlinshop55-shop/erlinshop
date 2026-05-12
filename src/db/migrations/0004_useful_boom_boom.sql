CREATE TYPE "public"."gender_target" AS ENUM('Men', 'Women', 'Kids', 'Unisex');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cart_session_id" uuid NOT NULL,
	"variant_id" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cart_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cart_sessions_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"variant_id" text,
	"product_name" text NOT NULL,
	"variant_name" text NOT NULL,
	"product_image" text,
	"price" integer NOT NULL,
	"quantity" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"status" "order_status" DEFAULT 'PENDING' NOT NULL,
	"customer_name" text NOT NULL,
	"customer_phone" text,
	"customer_id" text,
	"total_price" integer NOT NULL,
	"session_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone_number" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customers_phone_number_unique" UNIQUE("phone_number")
);
--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "parent_id" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "brand" text DEFAULT 'Unbranded' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "gender_target" "gender_target" DEFAULT 'Unisex' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_published" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "hero_title" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "hero_subtitle" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "hero_image_url" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "hero_images" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "footer_description" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "contact_address" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "contact_phone" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "contact_email" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "instagram_url" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "facebook_url" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "twitter_url" text;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_session_id_cart_sessions_id_fk" FOREIGN KEY ("cart_session_id") REFERENCES "public"."cart_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_session_id_cart_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."cart_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;