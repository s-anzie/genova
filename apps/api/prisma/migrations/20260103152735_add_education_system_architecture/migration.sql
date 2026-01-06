/*
  Warnings:

  - You are about to drop the column `educationDetails` on the `student_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `educationLevel` on the `student_profiles` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "LevelCategory" AS ENUM ('PRIMARY', 'MIDDLE_SCHOOL', 'HIGH_SCHOOL', 'UNIVERSITY', 'PROFESSIONAL');

-- CreateEnum
CREATE TYPE "SubjectCategory" AS ENUM ('SCIENCE', 'LANGUAGE', 'HUMANITIES', 'ARTS', 'SPORTS', 'TECHNOLOGY', 'ECONOMICS');

-- AlterTable
ALTER TABLE "student_profiles" DROP COLUMN "educationDetails",
DROP COLUMN "educationLevel",
ADD COLUMN     "educationLevelId" TEXT,
ADD COLUMN     "educationStreamId" TEXT,
ADD COLUMN     "educationSystemId" TEXT;

-- AlterTable
ALTER TABLE "tutor_profiles" ADD COLUMN     "levelIds" TEXT[],
ADD COLUMN     "subjectIds" TEXT[],
ADD COLUMN     "teachingLanguageIds" TEXT[];

-- CreateTable
CREATE TABLE "education_systems" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "education_systems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "education_levels" (
    "id" TEXT NOT NULL,
    "systemId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "LevelCategory" NOT NULL,
    "order" INTEGER NOT NULL,
    "hasStreams" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "education_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "education_streams" (
    "id" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "education_streams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "category" "SubjectCategory" NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "level_subjects" (
    "id" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "isCore" BOOLEAN NOT NULL DEFAULT false,
    "coefficient" INTEGER,
    "hoursPerWeek" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "level_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teaching_languages" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nativeName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teaching_languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "local_languages" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "speakers" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "local_languages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "education_systems_countryId_idx" ON "education_systems"("countryId");

-- CreateIndex
CREATE UNIQUE INDEX "education_systems_countryId_code_key" ON "education_systems"("countryId", "code");

-- CreateIndex
CREATE INDEX "education_levels_systemId_idx" ON "education_levels"("systemId");

-- CreateIndex
CREATE INDEX "education_levels_category_idx" ON "education_levels"("category");

-- CreateIndex
CREATE UNIQUE INDEX "education_levels_systemId_code_key" ON "education_levels"("systemId", "code");

-- CreateIndex
CREATE INDEX "education_streams_levelId_idx" ON "education_streams"("levelId");

-- CreateIndex
CREATE UNIQUE INDEX "education_streams_levelId_code_key" ON "education_streams"("levelId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_code_key" ON "subjects"("code");

-- CreateIndex
CREATE INDEX "level_subjects_levelId_idx" ON "level_subjects"("levelId");

-- CreateIndex
CREATE INDEX "level_subjects_subjectId_idx" ON "level_subjects"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "level_subjects_levelId_subjectId_key" ON "level_subjects"("levelId", "subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "teaching_languages_code_key" ON "teaching_languages"("code");

-- CreateIndex
CREATE INDEX "local_languages_countryId_idx" ON "local_languages"("countryId");

-- CreateIndex
CREATE UNIQUE INDEX "local_languages_countryId_name_key" ON "local_languages"("countryId", "name");

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_educationSystemId_fkey" FOREIGN KEY ("educationSystemId") REFERENCES "education_systems"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_educationLevelId_fkey" FOREIGN KEY ("educationLevelId") REFERENCES "education_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_educationStreamId_fkey" FOREIGN KEY ("educationStreamId") REFERENCES "education_streams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "education_systems" ADD CONSTRAINT "education_systems_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "education_levels" ADD CONSTRAINT "education_levels_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "education_systems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "education_streams" ADD CONSTRAINT "education_streams_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "education_levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "level_subjects" ADD CONSTRAINT "level_subjects_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "education_levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "level_subjects" ADD CONSTRAINT "level_subjects_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "local_languages" ADD CONSTRAINT "local_languages_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
