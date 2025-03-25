/*
  Warnings:

  - Made the column `height` on table `imgx_preset` required. This step will fail if there are existing NULL values in that column.
  - Made the column `width` on table `imgx_preset` required. This step will fail if there are existing NULL values in that column.
  - Made the column `height` on table `imgx_template` required. This step will fail if there are existing NULL values in that column.
  - Made the column `width` on table `imgx_template` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `imgx_preset` MODIFY `height` INTEGER NOT NULL,
    MODIFY `width` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `imgx_template` MODIFY `height` INTEGER NOT NULL,
    MODIFY `width` INTEGER NOT NULL;
