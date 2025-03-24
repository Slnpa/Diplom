/*
  Warnings:

  - You are about to drop the column `address` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Property` table. All the data in the column will be lost.
  - You are about to alter the column `pricePerNight` on the `Property` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - Added the required column `location` to the `Property` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Property` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Property" DROP COLUMN "address",
DROP COLUMN "createdAt",
DROP COLUMN "title",
DROP COLUMN "updatedAt",
ADD COLUMN     "location" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ALTER COLUMN "pricePerNight" SET DATA TYPE INTEGER;
