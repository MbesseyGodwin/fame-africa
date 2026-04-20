-- CreateEnum
CREATE TYPE "ArenaEventStatus" AS ENUM ('SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ArenaParticipationStatus" AS ENUM ('ATTENDED', 'ABSENT', 'DISQUALIFIED_DURING');

-- AlterTable
ALTER TABLE "participants" ADD COLUMN     "arena_strikes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "arena_wins" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "arena_events" (
    "id" TEXT NOT NULL,
    "cycle_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "duration_minutes" INTEGER NOT NULL DEFAULT 60,
    "status" "ArenaEventStatus" NOT NULL DEFAULT 'SCHEDULED',
    "points_per_correct" INTEGER NOT NULL DEFAULT 100,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "arena_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arena_questions" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "question_text" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "correct_option_index" INTEGER NOT NULL,
    "timer_seconds" INTEGER NOT NULL DEFAULT 30,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "arena_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arena_participation" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "status" "ArenaParticipationStatus" NOT NULL DEFAULT 'ABSENT',
    "score" INTEGER NOT NULL DEFAULT 0,
    "correct_answers" INTEGER NOT NULL DEFAULT 0,
    "wrong_answers" INTEGER NOT NULL DEFAULT 0,
    "total_time_seconds" INTEGER NOT NULL DEFAULT 0,
    "joined_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "arena_participation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "arena_participation_event_id_participant_id_key" ON "arena_participation"("event_id", "participant_id");

-- AddForeignKey
ALTER TABLE "arena_events" ADD CONSTRAINT "arena_events_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "competition_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arena_questions" ADD CONSTRAINT "arena_questions_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "arena_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arena_participation" ADD CONSTRAINT "arena_participation_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "arena_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arena_participation" ADD CONSTRAINT "arena_participation_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
