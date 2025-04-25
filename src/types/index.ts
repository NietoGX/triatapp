export type PlayerPosition = "GK" | "CL" | "CR" | "ML" | "MR" | "ST" | "SUB";

export type AppPlayer = {
  id: string;
  name: string;
  rating: number;
  position: PlayerPosition | null;
  team: string | null;
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

// Tipos antiguos mantenidos para compatibilidad
export type Position = PlayerPosition;
export type Player = AppPlayer;
