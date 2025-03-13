/*
  Warnings:

  - You are about to drop the column `config` on the `imgx_preset` table. All the data in the column will be lost.
  - Added the required column `contentProps` to the `imgx_preset` table without a default value. This is not possible if the table is not empty.
  - Added the required column `styleProps` to the `imgx_preset` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `imgx_preset` DROP COLUMN `config`,
    ADD COLUMN `contentProps` JSON NOT NULL,
    ADD COLUMN `styleProps` JSON NOT NULL;
