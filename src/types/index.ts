export type Position = "GK" | "CL" | "CR" | "ML" | "MR" | "ST" | "SUB";

export type Player = {
  id: string;
  name: string;
  rating: number;
  position?: Position | null;
  team?: "borjas" | "nietos" | null;
  stats?: {
    goals: number;
    assists: number;
    saves: number;
    goalsSaved: number;
  };
  number?: number;
  nickname?: string;
};

export type Team = {
  id: "borjas" | "nietos";
  name: string;
  players: {
    GK: Player[]; // Portero
    CL: Player[]; // Central Izquierda
    CR: Player[]; // Central Derecha
    ML: Player[]; // Medio Izquierda
    MR: Player[]; // Medio Derecha
    ST: Player[]; // Delantero Pichichi
    SUB: Player[]; // Suplentes
  };
};
