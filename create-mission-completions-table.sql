-- Create mission_completions table for tracking mission progress
-- This table stores detailed information about each mission completion

CREATE TABLE IF NOT EXISTS mission_completions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_number INTEGER NOT NULL CHECK (scenario_number >= 1 AND scenario_number <= 30),
  mission_number INTEGER NOT NULL CHECK (mission_number >= 1 AND mission_number <= 5),
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  used_help BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Prevent duplicate completions for same user/scenario/mission
  UNIQUE(user_id, scenario_number, mission_number)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_mission_completions_user 
  ON mission_completions(user_id);

CREATE INDEX IF NOT EXISTS idx_mission_completions_scenario 
  ON mission_completions(user_id, scenario_number);

-- Add comment to explain the table
COMMENT ON TABLE mission_completions IS 'Stores mission completion records with detailed tracking';
COMMENT ON COLUMN mission_completions.used_help IS 'Whether user clicked "Help Me" button during mission';
COMMENT ON COLUMN mission_completions.score IS 'Quiz score after mission (0-100)';

-- Enable Row Level Security (RLS)
ALTER TABLE mission_completions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy: Users can view their own mission completions
CREATE POLICY "Users can view own mission completions"
  ON mission_completions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own mission completions
CREATE POLICY "Users can insert own mission completions"
  ON mission_completions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own mission completions (for retries)
CREATE POLICY "Users can update own mission completions"
  ON mission_completions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Note: We use UPSERT in the code to handle retries
-- If user retries a mission, it will update the existing record

