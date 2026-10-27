-- Exactly one of assetId / buyerProfileId must be set. SQLite cannot add a CHECK
-- to an existing table, so the table is rebuilt the way Prisma does it.
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ContactRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "initiatorId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "assetId" TEXT,
    "buyerProfileId" TEXT,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "responseNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" DATETIME,
    CONSTRAINT "ContactRequest_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ContactRequest_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ContactRequest_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ContactRequest_buyerProfileId_fkey" FOREIGN KEY ("buyerProfileId") REFERENCES "BuyerProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ContactRequest_exactly_one_subject_check" CHECK (("assetId" IS NULL) <> ("buyerProfileId" IS NULL))
);
INSERT INTO "new_ContactRequest" ("assetId", "buyerProfileId", "createdAt", "id", "initiatorId", "message", "respondedAt", "responseNote", "status", "targetId") SELECT "assetId", "buyerProfileId", "createdAt", "id", "initiatorId", "message", "respondedAt", "responseNote", "status", "targetId" FROM "ContactRequest";
DROP TABLE "ContactRequest";
ALTER TABLE "new_ContactRequest" RENAME TO "ContactRequest";
CREATE INDEX "ContactRequest_targetId_status_idx" ON "ContactRequest"("targetId", "status");
CREATE INDEX "ContactRequest_initiatorId_status_idx" ON "ContactRequest"("initiatorId", "status");
CREATE UNIQUE INDEX "ContactRequest_initiatorId_assetId_key" ON "ContactRequest"("initiatorId", "assetId");
CREATE UNIQUE INDEX "ContactRequest_initiatorId_buyerProfileId_key" ON "ContactRequest"("initiatorId", "buyerProfileId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
