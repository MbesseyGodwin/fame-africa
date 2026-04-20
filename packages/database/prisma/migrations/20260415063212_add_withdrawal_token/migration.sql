-- AlterTable
ALTER TABLE "participants" ADD COLUMN     "withdrawal_token" TEXT,
ADD COLUMN     "withdrawal_token_expires_at" TIMESTAMP(3);
