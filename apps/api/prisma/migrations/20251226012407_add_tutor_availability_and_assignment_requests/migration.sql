-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- CreateTable
CREATE TABLE "tutor_availability" (
    "id" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "dayOfWeek" INTEGER,
    "specificDate" TIMESTAMP(3),
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tutor_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tutor_assignment_requests" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "tutor_assignment_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tutor_availability_tutorId_idx" ON "tutor_availability"("tutorId");

-- CreateIndex
CREATE INDEX "tutor_availability_dayOfWeek_idx" ON "tutor_availability"("dayOfWeek");

-- CreateIndex
CREATE INDEX "tutor_availability_specificDate_idx" ON "tutor_availability"("specificDate");

-- CreateIndex
CREATE INDEX "tutor_assignment_requests_sessionId_idx" ON "tutor_assignment_requests"("sessionId");

-- CreateIndex
CREATE INDEX "tutor_assignment_requests_studentId_idx" ON "tutor_assignment_requests"("studentId");

-- CreateIndex
CREATE INDEX "tutor_assignment_requests_tutorId_idx" ON "tutor_assignment_requests"("tutorId");

-- CreateIndex
CREATE INDEX "tutor_assignment_requests_status_idx" ON "tutor_assignment_requests"("status");

-- AddForeignKey
ALTER TABLE "tutor_availability" ADD CONSTRAINT "tutor_availability_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutor_assignment_requests" ADD CONSTRAINT "tutor_assignment_requests_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "tutoring_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutor_assignment_requests" ADD CONSTRAINT "tutor_assignment_requests_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutor_assignment_requests" ADD CONSTRAINT "tutor_assignment_requests_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
