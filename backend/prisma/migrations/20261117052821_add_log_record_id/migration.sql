/*
  Warnings:

  - A unique constraint covering the columns `[serverId,channel,recordId]` on the table `Log` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `recordId` to the `Log` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Log" ADD COLUMN     "recordId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Log_serverId_channel_recordId_key" ON "Log"("serverId", "channel", "recordId");
