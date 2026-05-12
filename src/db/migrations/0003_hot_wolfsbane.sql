ALTER TABLE "products" ALTER COLUMN "images" SET DEFAULT '{}'::text[];--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;