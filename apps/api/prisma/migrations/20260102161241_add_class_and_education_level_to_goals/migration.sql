-- CreateTable
CREATE TABLE "learning_goals" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classId" TEXT,
    "subject" TEXT NOT NULL,
    "educationLevel" JSONB,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetScore" DECIMAL(5,2) NOT NULL,
    "currentScore" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "deadline" TIMESTAMP(3) NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_goals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "learning_goals_studentId_idx" ON "learning_goals"("studentId");

-- CreateIndex
CREATE INDEX "learning_goals_classId_idx" ON "learning_goals"("classId");

-- CreateIndex
CREATE INDEX "learning_goals_subject_idx" ON "learning_goals"("subject");

-- CreateIndex
CREATE INDEX "learning_goals_deadline_idx" ON "learning_goals"("deadline");

-- CreateIndex
CREATE INDEX "learning_goals_isCompleted_idx" ON "learning_goals"("isCompleted");

-- AddForeignKey
ALTER TABLE "learning_goals" ADD CONSTRAINT "learning_goals_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
