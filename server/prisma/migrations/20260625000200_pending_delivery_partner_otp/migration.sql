CREATE TABLE "PendingDeliveryPartner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "vehicleType" TEXT DEFAULT 'bike',
    "otpHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PendingDeliveryPartner_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PendingDeliveryPartner_email_key" ON "PendingDeliveryPartner"("email");
