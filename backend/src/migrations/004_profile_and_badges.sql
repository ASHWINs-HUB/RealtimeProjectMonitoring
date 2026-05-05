-- Migration to add profile fields and task-timing achievements

-- 1. Update Users table with profile fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS education TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS degree VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS salary DECIMAL(12, 2) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS skills_summary TEXT;

-- 2. Add more specific achievements for task timing
INSERT INTO achievements (code, name, description, xp_reward) VALUES 
('EARLY_BIRD', 'Early Bird', 'Completed a task at least 24 hours before the deadline.', 200),
('ON_TIME_NINJA', 'On-Time Ninja', 'Completed a task exactly on the deadline date.', 150),
('LATE_RECOVERY', 'Late Recovery', 'Completed a task after the deadline (Better late than never!).', 50),
('CRITICAL_SMASHER', 'Critical Smasher', 'Completed a critical priority task before the deadline.', 500),
('HIGH_SPEED_DEV', 'High Speed Developer', 'Completed 3 tasks in a single day.', 300)
ON CONFLICT (code) DO NOTHING;
