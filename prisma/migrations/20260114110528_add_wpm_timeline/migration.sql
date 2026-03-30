/*
  Warnings:

  - Added the required column `wpmTimeline` to the `TypingResult` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TypingResult" ADD COLUMN     "wpmTimeline" JSONB NOT NULL;
