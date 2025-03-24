/*
  Warnings:

  - Added the required column `propertyId` to the `Chat` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Chat" ADD COLUMN "propertyId" INTEGER;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
