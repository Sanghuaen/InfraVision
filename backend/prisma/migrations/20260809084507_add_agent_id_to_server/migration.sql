/*
  Warnings:

  - A unique constraint covering the columns `[agentId]` on the table `Server` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `agentId` to the `Server` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Server" ADD COLUMN     "agentId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Server_agentId_key" ON "Server"("agentId");
