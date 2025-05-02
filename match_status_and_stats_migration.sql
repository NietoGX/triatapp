-- Migration to add match status and improve player statistics system

-- Step 1: Add status field to matches table with PENDING as default
ALTER TABLE matches 
ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'PENDING' 
CHECK (status IN ('PENDING', 'FINISHED'));

-- Update existing matches to PENDING status
UPDATE matches SET status = 'PENDING';

-- Step 2: Create a trigger to update player total stats when match stats are updated
CREATE OR REPLACE FUNCTION update_player_stats_from_match()
RETURNS TRIGGER AS $$
BEGIN
    -- If a match is marked as FINISHED, update player stats
    IF (SELECT status FROM matches WHERE id = NEW.match_id) = 'FINISHED' THEN
        -- Update player's goals
        UPDATE players
        SET goals = (
            SELECT COALESCE(SUM(goals), 0)
            FROM player_match_stats
            WHERE player_id = NEW.player_id
            AND match_id IN (SELECT id FROM matches WHERE status = 'FINISHED')
        )
        WHERE id = NEW.player_id;
        
        -- Update player's assists
        UPDATE players
        SET assists = (
            SELECT COALESCE(SUM(assists), 0)
            FROM player_match_stats
            WHERE player_id = NEW.player_id
            AND match_id IN (SELECT id FROM matches WHERE status = 'FINISHED')
        )
        WHERE id = NEW.player_id;
        
        -- Update player's saves
        UPDATE players
        SET saves = (
            SELECT COALESCE(SUM(saves), 0)
            FROM player_match_stats
            WHERE player_id = NEW.player_id
            AND match_id IN (SELECT id FROM matches WHERE status = 'FINISHED')
        )
        WHERE id = NEW.player_id;
        
        -- Update player's goals_saved
        UPDATE players
        SET goals_saved = (
            SELECT COALESCE(SUM(goals_saved), 0)
            FROM player_match_stats
            WHERE player_id = NEW.player_id
            AND match_id IN (SELECT id FROM matches WHERE status = 'FINISHED')
        )
        WHERE id = NEW.player_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger that runs when player match stats are inserted or updated
CREATE TRIGGER update_player_stats_trigger
AFTER INSERT OR UPDATE ON player_match_stats
FOR EACH ROW
EXECUTE FUNCTION update_player_stats_from_match();

-- Create a trigger to update all players stats when a match status changes to FINISHED
CREATE OR REPLACE FUNCTION update_all_player_stats_on_match_finish()
RETURNS TRIGGER AS $$
BEGIN
    -- Only proceed if status changed to FINISHED
    IF NEW.status = 'FINISHED' AND (OLD.status IS NULL OR OLD.status <> 'FINISHED') THEN
        -- Update stats for all players in this match
        UPDATE players p
        SET 
            goals = (
                SELECT COALESCE(SUM(goals), 0)
                FROM player_match_stats
                WHERE player_id = p.id
                AND match_id IN (SELECT id FROM matches WHERE status = 'FINISHED')
            ),
            assists = (
                SELECT COALESCE(SUM(assists), 0)
                FROM player_match_stats
                WHERE player_id = p.id
                AND match_id IN (SELECT id FROM matches WHERE status = 'FINISHED')
            ),
            saves = (
                SELECT COALESCE(SUM(saves), 0)
                FROM player_match_stats
                WHERE player_id = p.id
                AND match_id IN (SELECT id FROM matches WHERE status = 'FINISHED')
            ),
            goals_saved = (
                SELECT COALESCE(SUM(goals_saved), 0)
                FROM player_match_stats
                WHERE player_id = p.id
                AND match_id IN (SELECT id FROM matches WHERE status = 'FINISHED')
            )
        WHERE p.id IN (
            SELECT DISTINCT player_id 
            FROM player_match_stats 
            WHERE match_id = NEW.id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger that runs when match status is updated
CREATE TRIGGER update_player_stats_on_match_finish_trigger
AFTER UPDATE ON matches
FOR EACH ROW
EXECUTE FUNCTION update_all_player_stats_on_match_finish();

-- Create player_match_stats table if it doesn't exist
CREATE TABLE IF NOT EXISTS player_match_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  team_id VARCHAR(50) NOT NULL,
  goals INTEGER NOT NULL DEFAULT 0,
  assists INTEGER NOT NULL DEFAULT 0,
  saves INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(match_id, player_id)
);

-- Create an index for faster lookups
CREATE INDEX idx_player_match_stats_match_id ON player_match_stats(match_id);
CREATE INDEX idx_player_match_stats_player_id ON player_match_stats(player_id);

-- Create a function to update player stats when a match is marked as FINISHED
CREATE OR REPLACE FUNCTION update_player_stats_on_match_finish() 
RETURNS TRIGGER AS $$
BEGIN
  -- Only run when a match is marked as FINISHED
  IF NEW.status = 'FINISHED' AND (OLD.status IS NULL OR OLD.status = 'PENDING') THEN
    -- Update player stats based on match stats
    UPDATE players p
    SET 
      goals = p.goals + COALESCE(pms.goals, 0),
      assists = p.assists + COALESCE(pms.assists, 0),
      saves = p.saves + COALESCE(pms.saves, 0)
    FROM player_match_stats pms
    WHERE p.id = pms.player_id AND pms.match_id = NEW.id;
  
  -- If a match is reopened (changed from FINISHED to PENDING), subtract the stats
  ELSIF NEW.status = 'PENDING' AND OLD.status = 'FINISHED' THEN
    UPDATE players p
    SET 
      goals = p.goals - COALESCE(pms.goals, 0),
      assists = p.assists - COALESCE(pms.assists, 0),
      saves = p.saves - COALESCE(pms.saves, 0)
    FROM player_match_stats pms
    WHERE p.id = pms.player_id AND pms.match_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update player stats when a match status changes
DROP TRIGGER IF EXISTS update_player_stats_trigger ON matches;
CREATE TRIGGER update_player_stats_trigger
AFTER UPDATE OF status ON matches
FOR EACH ROW
EXECUTE FUNCTION update_player_stats_on_match_finish();

-- Add comments for documentation
COMMENT ON TABLE player_match_stats IS 'Stores statistics for players in specific matches';
COMMENT ON COLUMN matches.status IS 'Status of the match: PENDING or FINISHED';
COMMENT ON COLUMN player_match_stats.match_id IS 'The match these statistics belong to';
COMMENT ON COLUMN player_match_stats.player_id IS 'The player these statistics belong to';
COMMENT ON COLUMN player_match_stats.team_id IS 'The team the player was on during this match';
COMMENT ON COLUMN player_match_stats.goals IS 'Number of goals scored in this match';
COMMENT ON COLUMN player_match_stats.assists IS 'Number of assists made in this match';
COMMENT ON COLUMN player_match_stats.saves IS 'Number of saves made in this match'; 