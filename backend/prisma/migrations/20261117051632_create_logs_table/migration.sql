-- CreateTable
CREATE TABLE "Log" (
    "id" SERIAL NOT NULL,
    "serverId" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "level" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "eventId" INTEGER NOT NULL,
    "channel" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Log_serverId_timestamp_idx" ON "Log"("serverId", "timestamp");

-- CreateIndex
CREATE INDEX "Log_serverId_level_idx" ON "Log"("serverId", "level");

-- CreateIndex
CREATE INDEX "Log_serverId_channel_idx" ON "Log"("serverId", "channel");

-- AddForeignKey
ALTER TABLE "Log" ADD CONSTRAINT "Log_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server"("id") ON DELETE CASCADE ON UPDATE CASCADE;
