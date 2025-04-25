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
