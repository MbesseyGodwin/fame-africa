-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('VOTER', 'PARTICIPANT', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "CycleStatus" AS ENUM ('DRAFT', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'VOTING_OPEN', 'VOTING_CLOSED', 'REVEALING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ParticipantStatus" AS ENUM ('PENDING_PAYMENT', 'ACTIVE', 'ELIMINATED', 'WINNER', 'DISQUALIFIED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('VOTE_RECEIVED', 'ELIMINATION_WARNING', 'ELIMINATED', 'WINNER_ANNOUNCED', 'CYCLE_STARTING', 'CYCLE_ENDING', 'PAYMENT_CONFIRMED', 'SYSTEM');

-- CreateEnum
CREATE TYPE "FraudFlagType" AS ENUM ('DUPLICATE_PHONE', 'DUPLICATE_EMAIL', 'DUPLICATE_DEVICE', 'RAPID_VOTES', 'SUSPICIOUS_PATTERN', 'REPORTED_BY_USER');

-- CreateEnum
CREATE TYPE "SettingType" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'DATE');

-- CreateEnum
CREATE TYPE "AdPosition" AS ENUM ('TOP', 'BOTTOM', 'BOTH');

-- CreateEnum
CREATE TYPE "TiebreakerRule" AS ENUM ('LOWEST_CUMULATIVE_VOTES', 'LATEST_REGISTRATION', 'RANDOM');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "bio" TEXT,
    "photo_url" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'VOTER',
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "primary_color" TEXT NOT NULL DEFAULT '#534AB7',
    "button_color" TEXT NOT NULL DEFAULT '#534AB7',
    "header_color" TEXT NOT NULL DEFAULT '#534AB7',
    "accent_color" TEXT NOT NULL DEFAULT '#EEEDFE',
    "card_background" TEXT NOT NULL DEFAULT '#ffffff',
    "text_on_primary" TEXT NOT NULL DEFAULT '#ffffff',
    "dark_mode" BOOLEAN NOT NULL DEFAULT false,
    "font_family" TEXT NOT NULL DEFAULT 'system-ui,sans-serif',
    "font_size" INTEGER NOT NULL DEFAULT 14,
    "line_height" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
    "font_weight" TEXT NOT NULL DEFAULT '400',
    "border_radius" TEXT NOT NULL DEFAULT '8px',
    "compact_mode" BOOLEAN NOT NULL DEFAULT false,
    "show_avatars" BOOLEAN NOT NULL DEFAULT true,
    "email_notifications" BOOLEAN NOT NULL DEFAULT true,
    "sms_notifications" BOOLEAN NOT NULL DEFAULT true,
    "push_notifications" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competition_cycles" (
    "id" TEXT NOT NULL,
    "cycle_name" TEXT NOT NULL,
    "cycle_number" INTEGER NOT NULL,
    "status" "CycleStatus" NOT NULL DEFAULT 'DRAFT',
    "description" TEXT,
    "banner_image_url" TEXT,
    "registration_open" TIMESTAMP(3) NOT NULL,
    "registration_close" TIMESTAMP(3) NOT NULL,
    "voting_open" TIMESTAMP(3) NOT NULL,
    "voting_close" TIMESTAMP(3) NOT NULL,
    "reveal_at" TIMESTAMP(3) NOT NULL,
    "registration_fee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "fee_currency" TEXT NOT NULL DEFAULT 'NGN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competition_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competition_settings" (
    "id" TEXT NOT NULL,
    "cycle_id" TEXT,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" "SettingType" NOT NULL DEFAULT 'STRING',
    "label" TEXT,
    "description" TEXT,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "is_global" BOOLEAN NOT NULL DEFAULT false,
    "previous_value" TEXT,
    "updated_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competition_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participants" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "cycle_id" TEXT NOT NULL,
    "vote_link_slug" TEXT NOT NULL,
    "registration_fee_paid" BOOLEAN NOT NULL DEFAULT false,
    "payment_reference" TEXT,
    "payment_amount" DECIMAL(10,2),
    "paid_at" TIMESTAMP(3),
    "display_name" TEXT NOT NULL,
    "bio" TEXT,
    "photo_url" TEXT,
    "campaign_card_url" TEXT,
    "state" TEXT,
    "city" TEXT,
    "status" "ParticipantStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "eliminated_at" TIMESTAMP(3),
    "elimination_day" INTEGER,
    "final_rank" INTEGER,
    "total_votes" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votes" (
    "id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "cycle_id" TEXT NOT NULL,
    "voter_phone" TEXT NOT NULL,
    "voter_phone_hash" TEXT NOT NULL,
    "voter_email" TEXT NOT NULL,
    "voter_email_hash" TEXT NOT NULL,
    "device_fingerprint" TEXT,
    "ip_address" TEXT,
    "day_number" INTEGER NOT NULL,
    "vote_date" DATE NOT NULL,
    "verified_at" TIMESTAMP(3),
    "source" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_tokens" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "otp_code" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "participant_id" TEXT,
    "cycle_id" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_vote_tallies" (
    "id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "cycle_id" TEXT NOT NULL,
    "day_number" INTEGER NOT NULL,
    "vote_date" DATE NOT NULL,
    "vote_count" INTEGER NOT NULL DEFAULT 0,
    "cumulative_votes" INTEGER NOT NULL DEFAULT 0,
    "is_elimination_day" BOOLEAN NOT NULL DEFAULT false,
    "was_eliminated" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_vote_tallies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eliminations" (
    "id" TEXT NOT NULL,
    "cycle_id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "day_number" INTEGER NOT NULL,
    "elimination_date" DATE NOT NULL,
    "votes_on_day" INTEGER NOT NULL,
    "cumulative_votes" INTEGER NOT NULL,
    "total_participants_left" INTEGER NOT NULL,
    "tiebreaker_used" BOOLEAN NOT NULL DEFAULT false,
    "tiebreaker_rule" "TiebreakerRule",
    "announced_at" TIMESTAMP(3),
    "notification_sent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eliminations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sponsors" (
    "id" TEXT NOT NULL,
    "cycle_id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "logo_url" TEXT,
    "banner_image_url" TEXT,
    "website_url" TEXT,
    "prize_description" TEXT,
    "prize_amount" DECIMAL(10,2),
    "prize_currency" TEXT NOT NULL DEFAULT 'NGN',
    "prize_rank" INTEGER,
    "ad_position" "AdPosition" NOT NULL DEFAULT 'TOP',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sponsors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_impressions" (
    "id" TEXT NOT NULL,
    "sponsor_id" TEXT NOT NULL,
    "voter_phone_hash" TEXT,
    "page_context" TEXT,
    "shown_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" TEXT,

    CONSTRAINT "ad_impressions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fraud_flags" (
    "id" TEXT NOT NULL,
    "vote_id" TEXT NOT NULL,
    "flag_type" "FraudFlagType" NOT NULL,
    "details" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolved_by" TEXT,
    "resolved_at" TIMESTAMP(3),
    "resolution" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fraud_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "cycle_id" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "read_at" TIMESTAMP(3),
    "sent_via_sms" BOOLEAN NOT NULL DEFAULT false,
    "sent_via_email" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "old_value" JSONB,
    "new_value" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_resets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_user_id_key" ON "user_preferences"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "competition_settings_cycle_id_key_key" ON "competition_settings"("cycle_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "participants_user_id_key" ON "participants"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "participants_vote_link_slug_key" ON "participants"("vote_link_slug");

-- CreateIndex
CREATE INDEX "votes_participant_id_vote_date_idx" ON "votes"("participant_id", "vote_date");

-- CreateIndex
CREATE INDEX "votes_cycle_id_vote_date_idx" ON "votes"("cycle_id", "vote_date");

-- CreateIndex
CREATE UNIQUE INDEX "votes_voter_phone_hash_cycle_id_vote_date_key" ON "votes"("voter_phone_hash", "cycle_id", "vote_date");

-- CreateIndex
CREATE UNIQUE INDEX "votes_voter_email_hash_cycle_id_vote_date_key" ON "votes"("voter_email_hash", "cycle_id", "vote_date");

-- CreateIndex
CREATE INDEX "otp_tokens_phone_purpose_idx" ON "otp_tokens"("phone", "purpose");

-- CreateIndex
CREATE INDEX "daily_vote_tallies_cycle_id_vote_date_idx" ON "daily_vote_tallies"("cycle_id", "vote_date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_vote_tallies_participant_id_vote_date_key" ON "daily_vote_tallies"("participant_id", "vote_date");

-- CreateIndex
CREATE INDEX "eliminations_cycle_id_elimination_date_idx" ON "eliminations"("cycle_id", "elimination_date");

-- CreateIndex
CREATE INDEX "ad_impressions_sponsor_id_shown_at_idx" ON "ad_impressions"("sponsor_id", "shown_at");

-- CreateIndex
CREATE INDEX "fraud_flags_resolved_created_at_idx" ON "fraud_flags"("resolved", "created_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_idx" ON "notifications"("user_id", "read_at");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_created_at_idx" ON "audit_logs"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "password_resets_token_key" ON "password_resets"("token");

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competition_settings" ADD CONSTRAINT "competition_settings_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "competition_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "competition_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "competition_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_vote_tallies" ADD CONSTRAINT "daily_vote_tallies_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_vote_tallies" ADD CONSTRAINT "daily_vote_tallies_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "competition_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eliminations" ADD CONSTRAINT "eliminations_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "competition_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eliminations" ADD CONSTRAINT "eliminations_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sponsors" ADD CONSTRAINT "sponsors_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "competition_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_impressions" ADD CONSTRAINT "ad_impressions_sponsor_id_fkey" FOREIGN KEY ("sponsor_id") REFERENCES "sponsors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fraud_flags" ADD CONSTRAINT "fraud_flags_vote_id_fkey" FOREIGN KEY ("vote_id") REFERENCES "votes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "competition_cycles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
