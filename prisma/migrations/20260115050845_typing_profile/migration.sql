-- AlterTable
ALTER TABLE "TypingResult" ALTER COLUMN "wpmTimeline" SET DEFAULT '[]';

-- CreateTable
CREATE TABLE "TypingProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "avgWpm" DOUBLE PRECISION NOT NULL,
    "avgAcc" DOUBLE PRECISION NOT NULL,
    "weakKeys" JSONB NOT NULL,
    "sessions" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TypingProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TypingProfile_userId_key" ON "TypingProfile"("userId");

-- AddForeignKey
ALTER TABLE "TypingProfile" ADD CONSTRAINT "TypingProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
