-- Migration 012: add objectives column to lessons
-- Stores learning objectives as a JSONB array set by the teacher.
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS objectives JSONB DEFAULT '[]'::jsonb;
