-- CreateTable
CREATE TABLE "highlights" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "match_id" TEXT,
    "league" TEXT NOT NULL,
    "thumbnail_url" TEXT NOT NULL,
    "video_links" TEXT[],
    "duration" INTEGER,
    "views" INTEGER NOT NULL DEFAULT 0,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "highlights_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "highlights" ADD CONSTRAINT "highlights_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
