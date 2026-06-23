-- CreateTable
CREATE TABLE "user_universities" (
    "user_id" TEXT NOT NULL,
    "university_id" TEXT NOT NULL,

    CONSTRAINT "user_universities_pkey" PRIMARY KEY ("user_id","university_id")
);

-- CreateIndex
CREATE INDEX "user_universities_university_id_idx" ON "user_universities"("university_id");

-- AddForeignKey
ALTER TABLE "user_universities" ADD CONSTRAINT "user_universities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_universities" ADD CONSTRAINT "user_universities_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
