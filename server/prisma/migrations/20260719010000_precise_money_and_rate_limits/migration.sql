ALTER TABLE "Product"
  ALTER COLUMN "price" TYPE DECIMAL(12,2) USING ROUND("price"::numeric, 2),
  ALTER COLUMN "originalPrice" TYPE DECIMAL(12,2) USING ROUND("originalPrice"::numeric, 2);

ALTER TABLE "Order"
  ALTER COLUMN "subtotal" TYPE DECIMAL(12,2) USING ROUND("subtotal"::numeric, 2),
  ALTER COLUMN "deliveryFee" TYPE DECIMAL(12,2) USING ROUND("deliveryFee"::numeric, 2),
  ALTER COLUMN "tax" TYPE DECIMAL(12,2) USING ROUND("tax"::numeric, 2),
  ALTER COLUMN "total" TYPE DECIMAL(12,2) USING ROUND("total"::numeric, 2);

CREATE TABLE "RateLimitBucket" (
  "key" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 1,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "RateLimitBucket_expiresAt_idx" ON "RateLimitBucket"("expiresAt");
