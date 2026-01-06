-- CreateTable
CREATE TABLE "student_preferred_stream_subjects" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "streamSubjectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_preferred_stream_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "student_preferred_stream_subjects_studentProfileId_idx" ON "student_preferred_stream_subjects"("studentProfileId");

-- CreateIndex
CREATE INDEX "student_preferred_stream_subjects_streamSubjectId_idx" ON "student_preferred_stream_subjects"("streamSubjectId");

-- CreateIndex
CREATE UNIQUE INDEX "student_preferred_stream_subjects_studentProfileId_streamSu_key" ON "student_preferred_stream_subjects"("studentProfileId", "streamSubjectId");

-- AddForeignKey
ALTER TABLE "student_preferred_stream_subjects" ADD CONSTRAINT "student_preferred_stream_subjects_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_preferred_stream_subjects" ADD CONSTRAINT "student_preferred_stream_subjects_streamSubjectId_fkey" FOREIGN KEY ("streamSubjectId") REFERENCES "stream_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
