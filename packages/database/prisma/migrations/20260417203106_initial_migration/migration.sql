/*
  Warnings:

  - You are about to drop the column `email` on the `otp_tokens` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'AI_ADVICE';

-- AlterTable
ALTER TABLE "otp_tokens" DROP COLUMN "email",
ADD COLUMN     "voter_email" TEXT,
ALTER COLUMN "phone" DROP NOT NULL;

-- AlterTable
ALTER TABLE "votes" ALTER COLUMN "voter_phone" DROP NOT NULL,
ALTER COLUMN "voter_phone_hash" DROP NOT NULL,
ALTER COLUMN "voter_email" DROP NOT NULL,
ALTER COLUMN "voter_email_hash" DROP NOT NULL;

-- CreateTable
CREATE TABLE "kyc_records" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "bvn" TEXT NOT NULL,
    "id_type" TEXT NOT NULL,
    "id_image_url" TEXT NOT NULL,
    "status" "KycStatus" NOT NULL DEFAULT 'PENDING',
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kyc_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "past_winners" (
    "id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "cycle_id" TEXT NOT NULL,
    "prize_amount" DECIMAL(10,2) NOT NULL,
    "prize_photo_url" TEXT,
    "win_quote" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "past_winners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_advice" (
    "id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "cycle_id" TEXT NOT NULL,
    "advice_text" TEXT NOT NULL,
    "analysis_data" JSONB,
    "tone" TEXT NOT NULL DEFAULT 'coach',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_advice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_proofs" (
    "id" TEXT NOT NULL,
    "cycle_id" TEXT NOT NULL,
    "day_number" INTEGER NOT NULL,
    "audit_date" DATE NOT NULL,
    "merkle_root" TEXT NOT NULL,
    "vote_count" INTEGER NOT NULL,
    "tx_hash" TEXT,
    "proof_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_proofs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "kyc_records_user_id_key" ON "kyc_records"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "past_winners_participant_id_key" ON "past_winners"("participant_id");

-- CreateIndex
CREATE INDEX "ai_advice_participant_id_created_at_idx" ON "ai_advice"("participant_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "audit_proofs_cycle_id_audit_date_key" ON "audit_proofs"("cycle_id", "audit_date");

-- AddForeignKey
ALTER TABLE "kyc_records" ADD CONSTRAINT "kyc_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "past_winners" ADD CONSTRAINT "past_winners_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "past_winners" ADD CONSTRAINT "past_winners_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "competition_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_advice" ADD CONSTRAINT "ai_advice_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_advice" ADD CONSTRAINT "ai_advice_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "competition_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_proofs" ADD CONSTRAINT "audit_proofs_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "competition_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
