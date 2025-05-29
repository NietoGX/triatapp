-- Esquema completo para TriatApp

-- Tabla para equipos
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

-- Tabla para jugadores
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  nickname TEXT,
  position TEXT,
  number INTEGER,
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  goals_saved INTEGER DEFAULT 0,
  rating INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para posiciones de jugadores en equipos
CREATE TABLE IF NOT EXISTS team_player_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  position TEXT NOT NULL,
  position_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para alineaciones de equipos
CREATE TABLE IF NOT EXISTS team_lineups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id TEXT NOT NULL,
  lineup_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para el estado del triaje
CREATE TABLE IF NOT EXISTS draft_state (
  id TEXT PRIMARY KEY DEFAULT 'current',
  current_team TEXT,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para el historial del triaje
CREATE TABLE IF NOT EXISTS draft_history (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  pick_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para partidos
CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  date TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para estadísticas de jugadores en partidos
CREATE TABLE IF NOT EXISTS player_match_stats (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  team_id TEXT NOT NULL,
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  goals_saved INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insertar equipos por defecto
INSERT INTO teams (id, name) VALUES ('borjas', 'Casper');
INSERT INTO teams (id, name) VALUES ('nietos', 'NietakO');

-- Índices para mejorar el rendimiento
CREATE INDEX idx_team_player_team ON team_player_positions(team_id);
CREATE INDEX idx_team_player_player ON team_player_positions(player_id);
CREATE INDEX idx_draft_history_team ON draft_history(team_id);
CREATE INDEX idx_draft_history_player ON draft_history(player_id);
CREATE INDEX idx_player_match_stats_match ON player_match_stats(match_id);
CREATE INDEX idx_player_match_stats_player ON player_match_stats(player_id);
CREATE INDEX idx_player_match_stats_team ON player_match_stats(team_id);
CREATE INDEX idx_team_lineups_team ON team_lineups(team_id);
