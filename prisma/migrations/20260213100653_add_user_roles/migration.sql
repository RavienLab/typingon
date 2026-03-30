-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'examiner', 'admin');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'user';
