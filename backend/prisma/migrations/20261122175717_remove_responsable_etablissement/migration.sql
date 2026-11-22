/*
  Warnings:

  - You are about to drop the column `etablissementId` on the `responsables` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "responsables" DROP CONSTRAINT "responsables_etablissementId_fkey";

-- DropIndex
DROP INDEX "responsables_etablissementId_idx";

-- AlterTable
ALTER TABLE "responsables" DROP COLUMN "etablissementId";
