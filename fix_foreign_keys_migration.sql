-- Migration to fix foreign key relationships for Supabase automatic JOINs
-- This fixes the errors where Supabase can't find relationships between tables

-- Step 1: Add foreign key constraints for draft_history table
-- First add foreign key for team_id -> teams(id)
ALTER TABLE draft_history
ADD CONSTRAINT fk_draft_history_team
FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;

-- Add foreign key for player_id -> players(id)
ALTER TABLE draft_history
ADD CONSTRAINT fk_draft_history_player
FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE;

-- Step 2: Add foreign key constraints for team_player_positions table
-- Add foreign key for team_id -> teams(id)
ALTER TABLE team_player_positions
ADD CONSTRAINT fk_team_player_positions_team
FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;

-- Add foreign key for player_id -> players(id)
ALTER TABLE team_player_positions
ADD CONSTRAINT fk_team_player_positions_player
FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE;

-- Step 3: Add foreign key constraint for match_id in team_player_positions (if column exists)
-- This needs to be conditional since the column might not exist in all databases
DO $$
BEGIN
    -- Check if match_id column exists
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'team_player_positions'
        AND column_name = 'match_id'
    ) THEN
        -- Add foreign key only if column exists and matches table exists
        IF EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_name = 'matches'
        ) THEN
            ALTER TABLE team_player_positions
            ADD CONSTRAINT fk_team_player_positions_match
            FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Step 4: Add missing match_id column to team_player_positions if it doesn't exist
ALTER TABLE team_player_positions 
ADD COLUMN IF NOT EXISTS match_id TEXT;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_team_player_positions_match ON team_player_positions(match_id);

-- Step 5: Make sure we have the proper data types
-- Fix player_id type inconsistencies (some tables use TEXT, others UUID)
-- Check current data type and convert if necessary
DO $$
BEGIN
    -- Check if players.id is TEXT type
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'players'
        AND column_name = 'id'
        AND data_type = 'text'
    ) THEN
        -- Convert players table to use UUID if it's currently TEXT
        -- First, ensure we have the uuid extension
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        
        -- We won't automatically convert existing data as it could be destructive
        -- Log a warning instead
        RAISE NOTICE 'Warning: players.id is TEXT type. Consider converting to UUID for consistency.';
    END IF;
    
    -- Same check for other problematic columns
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'draft_history'
        AND column_name = 'player_id'
        AND data_type = 'text'
    ) AND EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'players'
        AND column_name = 'id'
        AND data_type = 'uuid'
    ) THEN
        RAISE NOTICE 'Warning: Type mismatch between draft_history.player_id (TEXT) and players.id (UUID).';
    END IF;
END $$;

-- Step 6: Ensure all tables have proper indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_draft_history_team_id ON draft_history(team_id);
CREATE INDEX IF NOT EXISTS idx_draft_history_player_id ON draft_history(player_id);
CREATE INDEX IF NOT EXISTS idx_team_player_positions_team_id ON team_player_positions(team_id);
CREATE INDEX IF NOT EXISTS idx_team_player_positions_player_id ON team_player_positions(player_id);

-- Step 7: Update Supabase metadata cache
-- This is a Supabase-specific command to refresh the schema cache
NOTIFY pgrst, 'reload schema'; 