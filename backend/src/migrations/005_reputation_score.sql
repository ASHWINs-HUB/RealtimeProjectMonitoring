-- Add reputation_score to users table with a base of 3000
ALTER TABLE users ADD COLUMN IF NOT EXISTS reputation_score INTEGER DEFAULT 3000;

-- Update existing users to have the base score if they don't have it
UPDATE users SET reputation_score = 3000 WHERE reputation_score IS NULL;
