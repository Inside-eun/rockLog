-- CreateTable
CREATE TABLE "Festival" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "location" TEXT NOT NULL,
    "genre" TEXT NOT NULL,
    "imageUrl" TEXT,
    "lineup" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Performance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "festivalId" TEXT NOT NULL,
    "artistName" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "stage" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Performance_festivalId_fkey" FOREIGN KEY ("festivalId") REFERENCES "Festival" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "performanceId" TEXT NOT NULL,
    "watchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isPartial" BOOLEAN NOT NULL DEFAULT false,
    "actualMinutes" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserLog_performanceId_fkey" FOREIGN KEY ("performanceId") REFERENCES "Performance" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Festival_startDate_endDate_idx" ON "Festival"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "Festival_genre_idx" ON "Festival"("genre");

-- CreateIndex
CREATE INDEX "Performance_festivalId_idx" ON "Performance"("festivalId");

-- CreateIndex
CREATE INDEX "Performance_artistName_idx" ON "Performance"("artistName");

-- CreateIndex
CREATE INDEX "UserLog_performanceId_idx" ON "UserLog"("performanceId");

-- CreateIndex
CREATE INDEX "UserLog_watchedAt_idx" ON "UserLog"("watchedAt");
