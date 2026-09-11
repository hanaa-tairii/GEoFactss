-- Add a revocation counter so logout invalidates previously issued JWTs.
ALTER TABLE "User" ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;
