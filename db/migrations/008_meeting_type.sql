-- Migration 008: Add meeting_type column to meetings
-- 'regular' = weekly/recurring meeting
-- 'special_event' = special/event meeting created outside the normal schedule

ALTER TABLE meetings
  ADD COLUMN IF NOT EXISTS meeting_type VARCHAR(20) NOT NULL DEFAULT 'regular';

ALTER TABLE meetings
  ADD CONSTRAINT meetings_type_check CHECK (meeting_type IN ('regular', 'special_event'));
