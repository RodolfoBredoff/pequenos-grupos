-- Migration 005: Add role column to leaders table
-- Supports 'leader' (full access) and 'secretary' (restricted access)

ALTER TABLE leaders
  ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'leader';

-- Ensure only valid roles are stored
ALTER TABLE leaders
  ADD CONSTRAINT leaders_role_check CHECK (role IN ('leader', 'secretary'));
