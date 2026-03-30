-- AlterTable
ALTER TABLE "TypingResult" ADD COLUMN     "durationMs" INTEGER,
ADD COLUMN     "paragraph" TEXT,
ADD COLUMN     "practiceMode" TEXT,
ALTER COLUMN "keystrokes" DROP NOT NULL;
