-- Create players table
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    nickname VARCHAR(255),
    position VARCHAR(50),
    number INTEGER,
    goals INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0, -- For goalkeepers
    goals_saved INTEGER DEFAULT 0, -- For defenders or goalkeepers
    rating INTEGER NOT NULL DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on player name for faster lookups
CREATE INDEX idx_players_name ON players(name);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_players_updated_at
BEFORE UPDATE ON players
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Example insert for initial test data
-- INSERT INTO players (name, nickname, position, number, rating)
-- VALUES
--   ('David Nieto', 'Dave', 'GK', 1, 4),
--   ('Carlos Borja', 'Borjas', 'ST', 9, 5),
--   ('Juan Pérez', 'Juanito', 'MR', 8, 3); 