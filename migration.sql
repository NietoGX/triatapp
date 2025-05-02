-- Migration to add match_id to team_player_positions table
-- This allows tracking player positions for specific matches

-- Step 1: Add match_id column to team_player_positions table
ALTER TABLE team_player_positions 
ADD COLUMN match_id TEXT;

-- Step 2: Update existing records to NULL for match_id (these are general positions not tied to matches)
UPDATE team_player_positions
SET match_id = NULL;

-- Step 3: Create an index for better performance
CREATE INDEX idx_team_player_positions_match ON team_player_positions(match_id);

-- Step 4: Add match_lineups table to store match-specific lineups
CREATE TABLE IF NOT EXISTS match_lineups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id TEXT NOT NULL,
  team_id TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Step 5: Create indices for better performance
CREATE INDEX idx_match_lineups_match ON match_lineups(match_id);
CREATE INDEX idx_match_lineups_team ON match_lineups(team_id); 