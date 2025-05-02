export type Player = {
  id: string;
  name: string;
  nickname?: string | null;
  position?: string | null;
  number?: number | null;
  goals: number;
  assists: number;
  saves: number;
  goals_saved: number;
  rating: number;
  created_at: string;
  updated_at: string;
};

export type PlayerPosition = "GK" | "CL" | "CR" | "ML" | "MR" | "ST" | "SUB";

export type AppPlayer = {
  id: string;
  name: string;
  rating: number;
  position: PlayerPosition | null;
  team: "borjas" | "nietos" | null;
  stats: {
    goals: number;
    assists: number;
    saves: number;
    goalsSaved: number;
  };
  number?: number;
  nickname?: string;
};

export type Team = {
  id: string;
  name: string;
  players: {
    [key in PlayerPosition]: AppPlayer[];
  };
};

export type TeamLineup = {
  [key: string]: Team;
};

export type TeamPlayerPosition = {
  id: string;
  team_id: string;
  player_id: string;
  position: PlayerPosition;
  position_order: number;
  match_id?: string | null;
};

// Tipos para el sistema de triaje
export type DraftState = {
  id: string;
  match_id?: string | null;
  current_team: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type DraftHistoryItem = {
  id: string;
  team_id: string;
  player_id: string;
  pick_order: number;
  created_at: string;
  teams?: { name: string };
  players?: { name: string };
};

export type DraftError = {
  message: string;
};

// Match types
export type Match = {
  id: string;
  name: string;
  date: string;
  created_at: string;
  updated_at: string;
};

export type MatchLineup = {
  id: string;
  match_id: string;
  team_id: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type PlayerMatchStats = {
  id: string;
  match_id: string;
  player_id: string;
  team_id: string;
  goals: number;
  assists: number;
  saves: number;
  goals_saved: number;
  created_at: string;
  updated_at: string;
};
