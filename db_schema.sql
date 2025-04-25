-- Esquema simplificado para Futbol Triaje
-- Este esquema está diseñado para guardar únicamente la alineación actual

-- Tabla de equipos
CREATE TABLE teams (
  id VARCHAR(50) PRIMARY KEY,       -- 'borjas', 'nietos', etc.
  name VARCHAR(100) NOT NULL        -- 'Casper', 'NietakO', etc.
);

-- Tabla de jugadores (ya existente en la aplicación)
-- Se muestra aquí sólo como referencia
CREATE TABLE players (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  nickname VARCHAR(100),
  number INT,
  position VARCHAR(20),             -- Posición preferida del jugador
  rating INT NOT NULL,
  goals INT DEFAULT 0,
  assists INT DEFAULT 0,
  saves INT DEFAULT 0,
  goals_saved INT DEFAULT 0
);

-- Tabla para almacenar la asignación de jugadores a posiciones dentro de cada equipo
CREATE TABLE team_player_positions (
  id VARCHAR(50) PRIMARY KEY,
  team_id VARCHAR(50) NOT NULL,     -- Equipo al que pertenece esta asignación
  player_id VARCHAR(50) NOT NULL,   -- Jugador asignado
  position VARCHAR(20) NOT NULL,    -- 'GK', 'CL', 'CR', 'ML', 'MR', 'ST', 'SUB'
  position_order INT DEFAULT 0,     -- Para posiciones que permiten múltiples jugadores (como suplentes)
  UNIQUE (team_id, player_id)       -- Un jugador solo puede estar una vez en cada equipo
);

-- Insertar equipos por defecto
INSERT INTO teams (id, name) VALUES ('borjas', 'Casper');
INSERT INTO teams (id, name) VALUES ('nietos', 'NietakO');

-- Índices para mejorar el rendimiento
CREATE INDEX idx_team_player_team ON team_player_positions(team_id);
CREATE INDEX idx_team_player_player ON team_player_positions(player_id); 