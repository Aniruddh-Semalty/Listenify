-- AlterTable
ALTER TABLE "Stream" ADD COLUMN     "largeThumbnailImage" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "smallThumbnailImage" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "title" TEXT NOT NULL DEFAULT '';
