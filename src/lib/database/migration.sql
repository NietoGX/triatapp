-- Migration to update matches and player_match_stats tables to use proper timestamp types

-- Step 1: Add temporary columns with correct types to matches table
ALTER TABLE matches 
ADD COLUMN temp_created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN temp_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Step 2: Update temporary columns with existing data where possible
UPDATE matches 
SET 
  temp_created_at = COALESCE(created_at::timestamp with time zone, CURRENT_TIMESTAMP),
  temp_updated_at = COALESCE(updated_at::timestamp with time zone, CURRENT_TIMESTAMP);

-- Step 3: Drop old columns
ALTER TABLE matches 
DROP COLUMN created_at,
DROP COLUMN updated_at;

-- Step 4: Rename temporary columns to original names
ALTER TABLE matches 
RENAME COLUMN temp_created_at TO created_at;

ALTER TABLE matches 
RENAME COLUMN temp_updated_at TO updated_at;

-- Now do the same for player_match_stats table
-- Step 1: Add temporary columns
ALTER TABLE player_match_stats 
ADD COLUMN temp_created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN temp_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Step 2: Update temporary columns
UPDATE player_match_stats 
SET 
  temp_created_at = COALESCE(created_at::timestamp with time zone, CURRENT_TIMESTAMP),
  temp_updated_at = COALESCE(updated_at::timestamp with time zone, CURRENT_TIMESTAMP);

-- Step 3: Drop old columns
ALTER TABLE player_match_stats 
DROP COLUMN created_at,
DROP COLUMN updated_at;

-- Step 4: Rename temporary columns
ALTER TABLE player_match_stats 
RENAME COLUMN temp_created_at TO created_at;

ALTER TABLE player_match_stats 
RENAME COLUMN temp_updated_at TO updated_at; 