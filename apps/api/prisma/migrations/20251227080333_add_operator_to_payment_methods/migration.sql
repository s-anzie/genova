/*
  Warnings:

  - You are about to drop the column `provider` on the `payment_methods` table. All the data in the column will be lost.
  - Added the required column `operatorId` to the `payment_methods` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "payment_methods_provider_idx";

-- AlterTable
ALTER TABLE "payment_methods" DROP COLUMN "provider",
ADD COLUMN     "lastUsedAt" TIMESTAMP(3),
ADD COLUMN     "operatorId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "mobile_money_operators" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "provider" "MobileMoneyProvider" NOT NULL,
    "country" TEXT NOT NULL,
    "countryName" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "phonePrefix" TEXT NOT NULL,
    "phoneFormat" TEXT NOT NULL,
    "phoneLength" INTEGER NOT NULL,
    "color" TEXT NOT NULL,
    "logoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "supportedFeatures" JSONB NOT NULL DEFAULT '{}',
    "fees" JSONB NOT NULL DEFAULT '{}',
    "limits" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mobile_money_operators_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mobile_money_operators_code_key" ON "mobile_money_operators"("code");

-- CreateIndex
CREATE INDEX "mobile_money_operators_country_idx" ON "mobile_money_operators"("country");

-- CreateIndex
CREATE INDEX "mobile_money_operators_provider_idx" ON "mobile_money_operators"("provider");

-- CreateIndex
CREATE INDEX "mobile_money_operators_isActive_idx" ON "mobile_money_operators"("isActive");

-- CreateIndex
CREATE INDEX "payment_methods_operatorId_idx" ON "payment_methods"("operatorId");

-- AddForeignKey
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "mobile_money_operators"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
