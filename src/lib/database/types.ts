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
};
