-- Enterprise Gamification & Skills Schema

-- User Skills Matrix
CREATE TABLE IF NOT EXISTS user_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    skill_name VARCHAR(50) NOT NULL,
    proficiency_level INTEGER DEFAULT 1, -- 1 to 10
    total_xp INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT FALSE,
    last_updated AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, skill_name)
);

-- Achievement Catalog
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'BUG_HUNTER_1'
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url VARCHAR(255),
    xp_reward INTEGER DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Earned Achievements
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_id)
);

-- Activity Logs for XP/Badge calculation
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL, -- 'PR_MERGED', 'TASK_CLOSED', 'BUG_RESOLVED'
    entity_id UUID, -- References task_id or commit_id
    xp_gained INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Achievements
INSERT INTO achievements (code, name, description, xp_reward) VALUES 
('FIRST_COMMIT', 'First Step', 'Pushed your first commit to a repository.', 100),
('TASK_MASTER', 'Task Master', 'Completed 10 tasks in a single week.', 500),
('BUG_HUNTER', 'Bug Hunter', 'Resolved 5 critical security vulnerabilities.', 1000),
('CODE_PURIST', 'Code Purist', 'Reduced technical debt by 20% in a repository.', 750),
('RELIABLE_DEV', 'Reliable Dev', 'Completed 5 tasks exactly on their deadline.', 400)
ON CONFLICT (code) DO NOTHING;
