-- Esquema simplificado para Futbol Triaje
-- Este esquema está diseñado para guardar únicamente la alineación actual

-- Tabla para equipos
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

-- Tabla para jugadores
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
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
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  position TEXT NOT NULL,
  position_order INTEGER DEFAULT 0
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

-- Insertar equipos por defecto
INSERT INTO teams (id, name) VALUES ('borjas', 'Casper');
INSERT INTO teams (id, name) VALUES ('nietos', 'NietakO');

-- Índices para mejorar el rendimiento
CREATE INDEX idx_team_player_team ON team_player_positions(team_id);
CREATE INDEX idx_team_player_player ON team_player_positions(player_id); 