-- Migration to add Admin and Stakeholder roles, and Proposed project status

-- 1. Update users role check constraint
-- PostgreSQL doesn't allow direct modification of CHECK constraints easily without dropping and recreating or using DOMAINS.
-- We will drop the constraint and recreate it.

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('hr', 'manager', 'team_leader', 'developer', 'admin', 'stakeholder'));

-- 2. Update projects status check constraint
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE projects ADD CONSTRAINT projects_status_check CHECK (status IN ('proposed', 'pending', 'active', 'on_track', 'at_risk', 'delayed', 'completed', 'cancelled'));
