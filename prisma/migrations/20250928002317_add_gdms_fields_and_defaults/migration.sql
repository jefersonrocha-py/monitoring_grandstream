-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Antenna" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "lat" REAL NOT NULL DEFAULT 0,
    "lon" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DOWN',
    "gdmsApId" TEXT,
    "networkId" TEXT,
    "networkName" TEXT,
    "lastSyncAt" DATETIME,
    "lastStatusChange" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Antenna" ("createdAt", "description", "id", "lat", "lon", "name", "status", "updatedAt") SELECT "createdAt", "description", "id", "lat", "lon", "name", "status", "updatedAt" FROM "Antenna";
DROP TABLE "Antenna";
ALTER TABLE "new_Antenna" RENAME TO "Antenna";
CREATE UNIQUE INDEX "Antenna_name_key" ON "Antenna"("name");
CREATE UNIQUE INDEX "Antenna_gdmsApId_key" ON "Antenna"("gdmsApId");
CREATE INDEX "Antenna_status_idx" ON "Antenna"("status");
CREATE INDEX "Antenna_lat_lon_idx" ON "Antenna"("lat", "lon");
CREATE INDEX "Antenna_gdmsApId_idx" ON "Antenna"("gdmsApId");
CREATE INDEX "Antenna_networkId_idx" ON "Antenna"("networkId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "StatusHistory_antennaId_changedAt_idx" ON "StatusHistory"("antennaId", "changedAt");
