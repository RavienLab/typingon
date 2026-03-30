-- DropForeignKey
ALTER TABLE "TypingResult" DROP CONSTRAINT "TypingResult_sessionId_fkey";

-- AlterTable
ALTER TABLE "TypingResult" ALTER COLUMN "sessionId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "TypingResult" ADD CONSTRAINT "TypingResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TypingSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
