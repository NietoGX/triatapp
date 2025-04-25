export type Position = "GK" | "CL" | "CR" | "ML" | "MR" | "ST" | "SUB";

export type Player = {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  position?: Position;
  team?: "borjas" | "nietos" | null;
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
