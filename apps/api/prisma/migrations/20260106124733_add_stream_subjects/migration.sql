-- CreateTable
CREATE TABLE "stream_subjects" (
    "id" TEXT NOT NULL,
    "streamId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "isCore" BOOLEAN NOT NULL DEFAULT false,
    "coefficient" INTEGER,
    "hoursPerWeek" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stream_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stream_subjects_streamId_idx" ON "stream_subjects"("streamId");

-- CreateIndex
CREATE INDEX "stream_subjects_subjectId_idx" ON "stream_subjects"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "stream_subjects_streamId_subjectId_key" ON "stream_subjects"("streamId", "subjectId");

-- AddForeignKey
ALTER TABLE "stream_subjects" ADD CONSTRAINT "stream_subjects_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "education_streams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stream_subjects" ADD CONSTRAINT "stream_subjects_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
