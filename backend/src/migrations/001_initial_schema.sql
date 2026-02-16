-- ProjectPulse AI - Complete Database Schema
-- Normalized, production-ready schema with proper constraints and indexes

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('hr', 'manager', 'team_leader', 'developer')),
  avatar_url VARCHAR(500),
  department VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================
-- 2. PROJECTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  project_key VARCHAR(50) UNIQUE,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'on_track', 'at_risk', 'delayed', 'completed', 'cancelled')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  deadline DATE,
  budget DECIMAL(12, 2),
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_project_key ON projects(project_key);

-- ============================================
-- 3. PROJECT_MANAGERS (Many-to-Many)
-- Multiple managers can accept same project
-- ============================================
CREATE TABLE IF NOT EXISTS project_managers (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  manager_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  accepted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, manager_id)
);

CREATE INDEX IF NOT EXISTS idx_pm_project ON project_managers(project_id);
CREATE INDEX IF NOT EXISTS idx_pm_manager ON project_managers(manager_id);
CREATE INDEX IF NOT EXISTS idx_pm_status ON project_managers(status);

-- ============================================
-- 4. SCOPES TABLE
-- Managers assign scopes to team leaders
-- ============================================
CREATE TABLE IF NOT EXISTS scopes (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  assigned_by INTEGER NOT NULL REFERENCES users(id),
  team_leader_id INTEGER NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold')),
  deadline DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scopes_project ON scopes(project_id);
CREATE INDEX IF NOT EXISTS idx_scopes_team_leader ON scopes(team_leader_id);

-- ============================================
-- 5. TEAMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  team_leader_id INTEGER NOT NULL REFERENCES users(id),
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_teams_leader ON teams(team_leader_id);

-- ============================================
-- 6. TEAM_MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS team_members (
  id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(team_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_tm_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_tm_user ON team_members(user_id);

-- ============================================
-- 7. TASKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  scope_id INTEGER REFERENCES scopes(id) ON DELETE SET NULL,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'in_review', 'done', 'blocked')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  assigned_to INTEGER REFERENCES users(id),
  assigned_by INTEGER REFERENCES users(id),
  story_points INTEGER DEFAULT 0,
  estimated_hours DECIMAL(6,2),
  actual_hours DECIMAL(6,2),
  due_date DATE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_scope ON tasks(scope_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- ============================================
-- 8. JIRA MAPPING TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS jira_mapping (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  jira_project_id VARCHAR(100),
  jira_project_key VARCHAR(50),
  jira_issue_id VARCHAR(100),
  jira_issue_key VARCHAR(100),
  jira_board_id VARCHAR(100),
  jira_sprint_id VARCHAR(100),
  sync_status VARCHAR(20) DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'error')),
  last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_jira_project ON jira_mapping(project_id);
CREATE INDEX IF NOT EXISTS idx_jira_task ON jira_mapping(task_id);
CREATE INDEX IF NOT EXISTS idx_jira_key ON jira_mapping(jira_project_key);

-- ============================================
-- 9. GITHUB MAPPING TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS github_mapping (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  repo_name VARCHAR(255) NOT NULL,
  repo_url VARCHAR(500) NOT NULL,
  repo_full_name VARCHAR(500),
  default_branch VARCHAR(100) DEFAULT 'main',
  is_private BOOLEAN DEFAULT false,
  webhook_id VARCHAR(100),
  last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_github_project ON github_mapping(project_id);

-- ============================================
-- 10. GITHUB COMMITS (for analytics)
-- ============================================
CREATE TABLE IF NOT EXISTS github_commits (
  id SERIAL PRIMARY KEY,
  github_mapping_id INTEGER NOT NULL REFERENCES github_mapping(id) ON DELETE CASCADE,
  commit_sha VARCHAR(40) NOT NULL,
  author_name VARCHAR(255),
  author_email VARCHAR(255),
  message TEXT,
  additions INTEGER DEFAULT 0,
  deletions INTEGER DEFAULT 0,
  files_changed INTEGER DEFAULT 0,
  committed_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_commits_mapping ON github_commits(github_mapping_id);
CREATE INDEX IF NOT EXISTS idx_commits_author ON github_commits(author_email);
CREATE INDEX IF NOT EXISTS idx_commits_date ON github_commits(committed_at);

-- ============================================
-- 11. ANALYTICS METRICS (ML results storage)
-- ============================================
CREATE TABLE IF NOT EXISTS analytics_metrics (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN (
    'risk_score', 'sprint_delay', 'developer_performance',
    'completion_forecast', 'burnout_score', 'velocity',
    'team_health', 'portfolio_risk'
  )),
  metric_value DECIMAL(10, 4) NOT NULL,
  confidence DECIMAL(5, 4),
  features JSONB,
  model_version VARCHAR(50),
  computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  valid_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_metrics_project ON analytics_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_metrics_user ON analytics_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_metrics_type ON analytics_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_metrics_computed ON analytics_metrics(computed_at);

-- ============================================
-- 12. SPRINT DATA (from Jira)
-- ============================================
CREATE TABLE IF NOT EXISTS sprints (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  jira_sprint_id VARCHAR(100),
  name VARCHAR(255) NOT NULL,
  state VARCHAR(50) DEFAULT 'future' CHECK (state IN ('future', 'active', 'closed')),
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  completed_points INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  goal TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sprints_project ON sprints(project_id);

-- ============================================
-- 13. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
  is_read BOOLEAN DEFAULT false,
  link VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

-- ============================================
-- 14. ACTIVITY LOG
-- ============================================
CREATE TABLE IF NOT EXISTS activity_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INTEGER,
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_project ON activity_log(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_date ON activity_log(created_at);
