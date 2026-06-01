-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('per_lesson', 'prepaid', 'postpaid');

-- CreateEnum
CREATE TYPE "PaymentCategory" AS ENUM ('single', 'bulk');

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_lesson_id_fkey";

-- DropIndex
DROP INDEX "payments_lesson_id_key";

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "category" "PaymentCategory" NOT NULL DEFAULT 'single',
ADD COLUMN     "notes" TEXT,
ALTER COLUMN "lesson_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "payment_type" "PaymentType" NOT NULL DEFAULT 'per_lesson';

-- CreateTable
CREATE TABLE "lesson_payments" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lesson_payments_lesson_id_idx" ON "lesson_payments"("lesson_id");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_payments_payment_id_lesson_id_key" ON "lesson_payments"("payment_id", "lesson_id");

-- CreateIndex
CREATE INDEX "payments_lesson_id_idx" ON "payments"("lesson_id");

-- AddForeignKey
ALTER TABLE "lesson_payments" ADD CONSTRAINT "lesson_payments_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_payments" ADD CONSTRAINT "lesson_payments_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
