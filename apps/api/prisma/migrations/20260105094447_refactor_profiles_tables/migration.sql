/*
  Warnings:

  - You are about to drop the column `subject` on the `academic_results` table. All the data in the column will be lost.
  - You are about to drop the column `subject` on the `class_time_slots` table. All the data in the column will be lost.
  - You are about to drop the column `educationLevel` on the `classes` table. All the data in the column will be lost.
  - You are about to drop the column `subjects` on the `classes` table. All the data in the column will be lost.
  - You are about to drop the column `educationLevel` on the `shop_products` table. All the data in the column will be lost.
  - You are about to drop the column `subject` on the `shop_products` table. All the data in the column will be lost.
  - You are about to drop the column `learningGoals` on the `student_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `preferredSubjects` on the `student_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `availability` on the `tutor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `educationLevels` on the `tutor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `languages` on the `tutor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `levelIds` on the `tutor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `subjectIds` on the `tutor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `subjects` on the `tutor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `teachingLanguageIds` on the `tutor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `country_education_systems` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `country_languages` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "country_education_systems" DROP CONSTRAINT "country_education_systems_countryId_fkey";

-- DropForeignKey
ALTER TABLE "country_languages" DROP CONSTRAINT "country_languages_countryId_fkey";

-- DropIndex
DROP INDEX "academic_results_subject_idx";

-- DropIndex
DROP INDEX "shop_products_educationLevel_idx";

-- DropIndex
DROP INDEX "shop_products_subject_idx";

-- AlterTable
ALTER TABLE "academic_results" DROP COLUMN "subject";

-- AlterTable
ALTER TABLE "class_time_slots" DROP COLUMN "subject";

-- AlterTable
ALTER TABLE "classes" DROP COLUMN "educationLevel",
DROP COLUMN "subjects";

-- AlterTable
ALTER TABLE "shop_products" DROP COLUMN "educationLevel",
DROP COLUMN "subject";

-- AlterTable
ALTER TABLE "student_profiles" DROP COLUMN "learningGoals",
DROP COLUMN "preferredSubjects";

-- AlterTable
ALTER TABLE "tutor_availability" ADD COLUMN     "tutorProfileId" TEXT;

-- AlterTable
ALTER TABLE "tutor_profiles" DROP COLUMN "availability",
DROP COLUMN "educationLevels",
DROP COLUMN "languages",
DROP COLUMN "levelIds",
DROP COLUMN "subjectIds",
DROP COLUMN "subjects",
DROP COLUMN "teachingLanguageIds";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "country";

-- DropTable
DROP TABLE "country_education_systems";

-- DropTable
DROP TABLE "country_languages";

-- CreateTable
CREATE TABLE "tutor_teaching_languages" (
    "id" TEXT NOT NULL,
    "tutorProfileId" TEXT NOT NULL,
    "teachingLanguageId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tutor_teaching_languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_preferred_subjects" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "levelSubjectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_preferred_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tutor_teaching_languages_tutorProfileId_idx" ON "tutor_teaching_languages"("tutorProfileId");

-- CreateIndex
CREATE INDEX "tutor_teaching_languages_teachingLanguageId_idx" ON "tutor_teaching_languages"("teachingLanguageId");

-- CreateIndex
CREATE UNIQUE INDEX "tutor_teaching_languages_tutorProfileId_teachingLanguageId_key" ON "tutor_teaching_languages"("tutorProfileId", "teachingLanguageId");

-- CreateIndex
CREATE INDEX "student_preferred_subjects_studentProfileId_idx" ON "student_preferred_subjects"("studentProfileId");

-- CreateIndex
CREATE INDEX "student_preferred_subjects_levelSubjectId_idx" ON "student_preferred_subjects"("levelSubjectId");

-- CreateIndex
CREATE UNIQUE INDEX "student_preferred_subjects_studentProfileId_levelSubjectId_key" ON "student_preferred_subjects"("studentProfileId", "levelSubjectId");

-- AddForeignKey
ALTER TABLE "tutor_availability" ADD CONSTRAINT "tutor_availability_tutorProfileId_fkey" FOREIGN KEY ("tutorProfileId") REFERENCES "tutor_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutor_teaching_languages" ADD CONSTRAINT "tutor_teaching_languages_tutorProfileId_fkey" FOREIGN KEY ("tutorProfileId") REFERENCES "tutor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutor_teaching_languages" ADD CONSTRAINT "tutor_teaching_languages_teachingLanguageId_fkey" FOREIGN KEY ("teachingLanguageId") REFERENCES "teaching_languages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_preferred_subjects" ADD CONSTRAINT "student_preferred_subjects_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_preferred_subjects" ADD CONSTRAINT "student_preferred_subjects_levelSubjectId_fkey" FOREIGN KEY ("levelSubjectId") REFERENCES "level_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
