-- AlterTable
ALTER TABLE "User" ADD COLUMN     "documentUrl" TEXT,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false;
