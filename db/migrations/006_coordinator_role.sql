-- Migration 006: Add coordinator role to leaders table
-- Coordinator has full access to their own organization

ALTER TABLE leaders DROP CONSTRAINT IF EXISTS leaders_role_check;

ALTER TABLE leaders
  ADD CONSTRAINT leaders_role_check CHECK (role IN ('leader', 'secretary', 'coordinator'));
