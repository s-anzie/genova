/*
  Warnings:

  - A unique constraint covering the columns `[classId,streamSubjectId]` on the table `class_subjects` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "academic_results" ADD COLUMN     "streamSubjectId" TEXT;

-- AlterTable
ALTER TABLE "class_subjects" ADD COLUMN     "streamSubjectId" TEXT,
ALTER COLUMN "levelSubjectId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "class_time_slots" ADD COLUMN     "streamSubjectId" TEXT;

-- AlterTable
ALTER TABLE "learning_goals" ADD COLUMN     "streamSubjectId" TEXT;

-- AlterTable
ALTER TABLE "shop_products" ADD COLUMN     "streamSubjectId" TEXT;

-- CreateTable
CREATE TABLE "tutor_teaching_stream_subjects" (
    "id" TEXT NOT NULL,
    "tutorProfileId" TEXT NOT NULL,
    "streamSubjectId" TEXT NOT NULL,
    "yearsExperience" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tutor_teaching_stream_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tutor_teaching_stream_subjects_tutorProfileId_idx" ON "tutor_teaching_stream_subjects"("tutorProfileId");

-- CreateIndex
CREATE INDEX "tutor_teaching_stream_subjects_streamSubjectId_idx" ON "tutor_teaching_stream_subjects"("streamSubjectId");

-- CreateIndex
CREATE UNIQUE INDEX "tutor_teaching_stream_subjects_tutorProfileId_streamSubject_key" ON "tutor_teaching_stream_subjects"("tutorProfileId", "streamSubjectId");

-- CreateIndex
CREATE INDEX "academic_results_streamSubjectId_idx" ON "academic_results"("streamSubjectId");

-- CreateIndex
CREATE INDEX "class_subjects_streamSubjectId_idx" ON "class_subjects"("streamSubjectId");

-- CreateIndex
CREATE UNIQUE INDEX "class_subjects_classId_streamSubjectId_key" ON "class_subjects"("classId", "streamSubjectId");

-- CreateIndex
CREATE INDEX "class_time_slots_streamSubjectId_idx" ON "class_time_slots"("streamSubjectId");

-- CreateIndex
CREATE INDEX "learning_goals_streamSubjectId_idx" ON "learning_goals"("streamSubjectId");

-- CreateIndex
CREATE INDEX "shop_products_streamSubjectId_idx" ON "shop_products"("streamSubjectId");

-- AddForeignKey
ALTER TABLE "class_time_slots" ADD CONSTRAINT "class_time_slots_streamSubjectId_fkey" FOREIGN KEY ("streamSubjectId") REFERENCES "stream_subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_results" ADD CONSTRAINT "academic_results_streamSubjectId_fkey" FOREIGN KEY ("streamSubjectId") REFERENCES "stream_subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_goals" ADD CONSTRAINT "learning_goals_streamSubjectId_fkey" FOREIGN KEY ("streamSubjectId") REFERENCES "stream_subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_products" ADD CONSTRAINT "shop_products_streamSubjectId_fkey" FOREIGN KEY ("streamSubjectId") REFERENCES "stream_subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutor_teaching_stream_subjects" ADD CONSTRAINT "tutor_teaching_stream_subjects_tutorProfileId_fkey" FOREIGN KEY ("tutorProfileId") REFERENCES "tutor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutor_teaching_stream_subjects" ADD CONSTRAINT "tutor_teaching_stream_subjects_streamSubjectId_fkey" FOREIGN KEY ("streamSubjectId") REFERENCES "stream_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_subjects" ADD CONSTRAINT "class_subjects_streamSubjectId_fkey" FOREIGN KEY ("streamSubjectId") REFERENCES "stream_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
