-- Migration to add match_id to draft tables
-- This allows tracking drafts for specific matches

-- Step 1: Add match_id column to draft_state table
ALTER TABLE draft_state 
ADD COLUMN match_id TEXT;

-- Step 2: Update the primary key to include match_id
-- First, remove the primary key constraint
ALTER TABLE draft_state
DROP CONSTRAINT IF EXISTS draft_state_pkey;

-- Then add a new primary key that includes match_id
ALTER TABLE draft_state
ADD PRIMARY KEY (id, match_id);

-- Step 3: Add match_id column to draft_history table
ALTER TABLE draft_history
ADD COLUMN match_id TEXT NOT NULL DEFAULT '0';

-- Step 4: Create indexes for better performance
CREATE INDEX idx_draft_state_match ON draft_state(match_id);
CREATE INDEX idx_draft_history_match ON draft_history(match_id);

-- Step 5: Add foreign key constraints
ALTER TABLE draft_state
ADD CONSTRAINT fk_draft_state_match
FOREIGN KEY (match_id)
REFERENCES matches(id)
ON DELETE CASCADE;

ALTER TABLE draft_history
ADD CONSTRAINT fk_draft_history_match
FOREIGN KEY (match_id)
REFERENCES matches(id)
ON DELETE CASCADE;

-- Step 6: Remove the default '0' constraint once all existing records are updated
ALTER TABLE draft_history
ALTER COLUMN match_id DROP DEFAULT; 