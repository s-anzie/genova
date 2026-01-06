-- CreateTable
CREATE TABLE "tutor_teaching_subjects" (
    "id" TEXT NOT NULL,
    "tutorProfileId" TEXT NOT NULL,
    "levelSubjectId" TEXT NOT NULL,
    "yearsExperience" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tutor_teaching_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tutor_teaching_subjects_tutorProfileId_idx" ON "tutor_teaching_subjects"("tutorProfileId");

-- CreateIndex
CREATE INDEX "tutor_teaching_subjects_levelSubjectId_idx" ON "tutor_teaching_subjects"("levelSubjectId");

-- CreateIndex
CREATE UNIQUE INDEX "tutor_teaching_subjects_tutorProfileId_levelSubjectId_key" ON "tutor_teaching_subjects"("tutorProfileId", "levelSubjectId");

-- AddForeignKey
ALTER TABLE "tutor_teaching_subjects" ADD CONSTRAINT "tutor_teaching_subjects_tutorProfileId_fkey" FOREIGN KEY ("tutorProfileId") REFERENCES "tutor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutor_teaching_subjects" ADD CONSTRAINT "tutor_teaching_subjects_levelSubjectId_fkey" FOREIGN KEY ("levelSubjectId") REFERENCES "level_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
