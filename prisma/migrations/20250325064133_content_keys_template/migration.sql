/*
  Warnings:

  - You are about to drop the column `contentKeys` on the `imgx_preset` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `imgx_preset` DROP COLUMN `contentKeys`;

-- AlterTable
ALTER TABLE `imgx_template` ADD COLUMN `contentKeys` VARCHAR(191) NULL;
