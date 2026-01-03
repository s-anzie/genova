-- AlterTable
ALTER TABLE "student_profiles" ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "tutor_profiles" ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;
