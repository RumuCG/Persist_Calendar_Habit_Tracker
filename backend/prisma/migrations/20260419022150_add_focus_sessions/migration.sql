-- CreateTable
CREATE TABLE "focus_sessions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL DEFAULT '未命名专注',
    "start_time" DATETIME NOT NULL,
    "end_time" DATETIME,
    "duration" INTEGER NOT NULL,
    "expected_duration" INTEGER,
    "mode" TEXT NOT NULL,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "is_abandoned" BOOLEAN NOT NULL DEFAULT false,
    "interrupt_reason" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "focus_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "focus_sessions_user_id_start_time_idx" ON "focus_sessions"("user_id", "start_time");

-- CreateIndex
CREATE INDEX "focus_sessions_user_id_mode_idx" ON "focus_sessions"("user_id", "mode");
