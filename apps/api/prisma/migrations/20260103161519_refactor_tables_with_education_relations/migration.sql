-- AlterTable
ALTER TABLE "academic_results" ADD COLUMN     "levelSubjectId" TEXT,
ALTER COLUMN "subject" DROP NOT NULL;

-- AlterTable
ALTER TABLE "class_time_slots" ADD COLUMN     "levelSubjectId" TEXT,
ALTER COLUMN "subject" DROP NOT NULL;

-- AlterTable
ALTER TABLE "classes" ADD COLUMN     "educationLevelId" TEXT,
ADD COLUMN     "educationStreamId" TEXT,
ADD COLUMN     "educationSystemId" TEXT,
ALTER COLUMN "educationLevel" DROP NOT NULL;

-- AlterTable
ALTER TABLE "learning_goals" ADD COLUMN     "levelSubjectId" TEXT,
ALTER COLUMN "subject" DROP NOT NULL;

-- AlterTable
ALTER TABLE "shop_products" ADD COLUMN     "levelSubjectId" TEXT,
ALTER COLUMN "subject" DROP NOT NULL,
ALTER COLUMN "educationLevel" DROP NOT NULL;

-- CreateTable
CREATE TABLE "class_subjects" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "levelSubjectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "class_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "class_subjects_classId_idx" ON "class_subjects"("classId");

-- CreateIndex
CREATE INDEX "class_subjects_levelSubjectId_idx" ON "class_subjects"("levelSubjectId");

-- CreateIndex
CREATE UNIQUE INDEX "class_subjects_classId_levelSubjectId_key" ON "class_subjects"("classId", "levelSubjectId");

-- CreateIndex
CREATE INDEX "academic_results_levelSubjectId_idx" ON "academic_results"("levelSubjectId");

-- CreateIndex
CREATE INDEX "class_time_slots_levelSubjectId_idx" ON "class_time_slots"("levelSubjectId");

-- CreateIndex
CREATE INDEX "classes_educationSystemId_idx" ON "classes"("educationSystemId");

-- CreateIndex
CREATE INDEX "classes_educationLevelId_idx" ON "classes"("educationLevelId");

-- CreateIndex
CREATE INDEX "learning_goals_levelSubjectId_idx" ON "learning_goals"("levelSubjectId");

-- CreateIndex
CREATE INDEX "shop_products_levelSubjectId_idx" ON "shop_products"("levelSubjectId");

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_educationSystemId_fkey" FOREIGN KEY ("educationSystemId") REFERENCES "education_systems"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_educationLevelId_fkey" FOREIGN KEY ("educationLevelId") REFERENCES "education_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_educationStreamId_fkey" FOREIGN KEY ("educationStreamId") REFERENCES "education_streams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_time_slots" ADD CONSTRAINT "class_time_slots_levelSubjectId_fkey" FOREIGN KEY ("levelSubjectId") REFERENCES "level_subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_results" ADD CONSTRAINT "academic_results_levelSubjectId_fkey" FOREIGN KEY ("levelSubjectId") REFERENCES "level_subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_goals" ADD CONSTRAINT "learning_goals_levelSubjectId_fkey" FOREIGN KEY ("levelSubjectId") REFERENCES "level_subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_products" ADD CONSTRAINT "shop_products_levelSubjectId_fkey" FOREIGN KEY ("levelSubjectId") REFERENCES "level_subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_subjects" ADD CONSTRAINT "class_subjects_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_subjects" ADD CONSTRAINT "class_subjects_levelSubjectId_fkey" FOREIGN KEY ("levelSubjectId") REFERENCES "level_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
