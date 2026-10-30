-- CreateTable
CREATE TABLE "invoices" (
    "id" SERIAL NOT NULL,
    "reference" TEXT NOT NULL,
    "customer" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "issue_date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" SERIAL NOT NULL,
    "reference" TEXT NOT NULL,
    "payer" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "paid_date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invoices_reference_key" ON "invoices"("reference");

-- CreateIndex
CREATE INDEX "payments_reference_idx" ON "payments"("reference");
