-- AlterTable
ALTER TABLE "participants" ADD COLUMN     "stan_count" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "stans" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stans_participant_id_idx" ON "stans"("participant_id");

-- CreateIndex
CREATE UNIQUE INDEX "stans_user_id_participant_id_key" ON "stans"("user_id", "participant_id");

-- AddForeignKey
ALTER TABLE "stans" ADD CONSTRAINT "stans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stans" ADD CONSTRAINT "stans_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
