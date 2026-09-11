-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Country" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "officialName" TEXT NOT NULL,
    "cca3" TEXT NOT NULL,
    "capital" TEXT,
    "region" TEXT NOT NULL,
    "subregion" TEXT,
    "continent" TEXT NOT NULL,
    "flag" TEXT NOT NULL,
    "flagAlt" TEXT,
    "population" INTEGER NOT NULL,
    "area" DOUBLE PRECISION,
    "languages" TEXT[],
    "currencies" TEXT[],
    "timezones" TEXT[],
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "fingerprint" TEXT,
    "userId" TEXT,
    "countryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Country_slug_key" ON "Country"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Country_cca3_key" ON "Country"("cca3");

-- CreateIndex
CREATE INDEX "Country_continent_idx" ON "Country"("continent");

-- CreateIndex
CREATE INDEX "Country_region_idx" ON "Country"("region");

-- CreateIndex
CREATE INDEX "Country_name_idx" ON "Country"("name");

-- CreateIndex
CREATE INDEX "Rating_countryId_idx" ON "Rating"("countryId");

-- CreateIndex
CREATE UNIQUE INDEX "Rating_userId_countryId_key" ON "Rating"("userId", "countryId");

-- CreateIndex
CREATE INDEX "Comment_countryId_createdAt_idx" ON "Comment"("countryId", "createdAt");

-- CreateIndex
CREATE INDEX "Comment_fingerprint_idx" ON "Comment"("fingerprint");

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;
