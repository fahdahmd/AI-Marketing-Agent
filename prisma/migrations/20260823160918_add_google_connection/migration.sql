-- CreateTable
CREATE TABLE "GoogleConnection" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "accessTokenEnc" TEXT NOT NULL,
    "refreshTokenEnc" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "gaPropertyId" TEXT,
    "searchConsoleSiteUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoogleConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GoogleConnection_brandId_key" ON "GoogleConnection"("brandId");

-- AddForeignKey
ALTER TABLE "GoogleConnection" ADD CONSTRAINT "GoogleConnection_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;
