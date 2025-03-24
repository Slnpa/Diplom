/*
  Warnings:

  - You are about to drop the `OwnerRequest` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "OwnerRequest" DROP CONSTRAINT "OwnerRequest_userId_fkey";

-- DropTable
DROP TABLE "OwnerRequest";

-- DropEnum
DROP TYPE "RequestStatus";
