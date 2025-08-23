/*
  Warnings:

  - You are about to drop the column `courseId` on the `acompanhamentos` table. All the data in the column will be lost.
  - You are about to drop the column `courseName` on the `acompanhamentos` table. All the data in the column will be lost.
  - You are about to drop the column `fullName` on the `acompanhamentos` table. All the data in the column will be lost.
  - You are about to drop the column `grade` on the `acompanhamentos` table. All the data in the column will be lost.
  - You are about to drop the column `progress` on the `acompanhamentos` table. All the data in the column will be lost.
  - You are about to drop the column `shortName` on the `acompanhamentos` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `acompanhamentos` table. All the data in the column will be lost.
  - Added the required column `descricao` to the `acompanhamentos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nome` to the `acompanhamentos` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "acompanhamento_cursos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "acompanhamentoId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "courseName" TEXT NOT NULL,
    "shortName" TEXT,
    "fullName" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'CURSANDO',
    "progress" REAL NOT NULL DEFAULT 0,
    "grade" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "acompanhamento_cursos_acompanhamentoId_fkey" FOREIGN KEY ("acompanhamentoId") REFERENCES "acompanhamentos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_acompanhamentos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "mostrar_card_resumo" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "acompanhamentos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_acompanhamentos" ("createdAt", "id", "updatedAt", "userId") SELECT "createdAt", "id", "updatedAt", "userId" FROM "acompanhamentos";
DROP TABLE "acompanhamentos";
ALTER TABLE "new_acompanhamentos" RENAME TO "acompanhamentos";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "acompanhamento_cursos_acompanhamentoId_courseId_key" ON "acompanhamento_cursos"("acompanhamentoId", "courseId");
