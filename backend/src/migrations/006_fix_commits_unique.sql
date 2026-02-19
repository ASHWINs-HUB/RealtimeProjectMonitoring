-- Add unique constraint to github_commits to support ON CONFLICT
ALTER TABLE github_commits ADD CONSTRAINT unique_mapping_sha_v2 UNIQUE (github_mapping_id, commit_sha);
