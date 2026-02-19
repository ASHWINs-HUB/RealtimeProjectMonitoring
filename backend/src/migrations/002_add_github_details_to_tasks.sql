-- Migration: Add GitHub branch tracking to tasks
-- Description: Adds columns to store the associated GitHub branch and its public URL for EACH task.

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS github_branch VARCHAR(255);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS github_branch_url TEXT;

-- Index for faster lookup during webhook processing
CREATE INDEX IF NOT EXISTS idx_tasks_github_branch ON tasks(github_branch);
