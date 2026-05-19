-- AlterEnum
ALTER TYPE "MetodoPago" ADD VALUE 'PAYPAL';

-- AlterTable
ALTER TABLE "suscripciones" ADD COLUMN "paypalOrderId" TEXT;
