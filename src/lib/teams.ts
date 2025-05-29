import { Team } from "@/types";

// Team configuration - centralized place to manage teams
export const TEAM_CONFIG = {
  TEAM_A: {
    id: "borjas",
    name: "Equipo A",
    color: "bg-red-600", // Used for styling
  },
  TEAM_B: {
    id: "nietos",
    name: "Equipo B",
    color: "bg-purple-600", // Used for styling
  },
} as const;

// Get all team IDs as an array
export const getAllTeamIds = (): string[] => {
  return Object.values(TEAM_CONFIG).map((team) => team.id);
};

// Get team config by ID
export const getTeamConfig = (teamId: string) => {
  return Object.values(TEAM_CONFIG).find((team) => team.id === teamId);
};

// Get team name by ID
export const getTeamName = (teamId: string): string => {
  const team = getTeamConfig(teamId);
  return team ? team.name : teamId;
};

// Get team color by ID for styling
export const getTeamColor = (teamId: string): string => {
  const team = getTeamConfig(teamId);
  return team ? team.color : "gray";
};

// Create default empty teams structure dynamically
export const createDefaultTeams = (): { [key: string]: Team } => {
  const teams: { [key: string]: Team } = {};

  Object.values(TEAM_CONFIG).forEach((teamConfig) => {
    teams[teamConfig.id] = {
      id: teamConfig.id,
      name: teamConfig.name,
      players: {
        GK: [],
        CL: [],
        CR: [],
        ML: [],
        MR: [],
        ST: [],
        SUB: [],
      },
    };
  });

  return teams;
};

// Get teams for database initialization
export const getTeamsForDB = () => {
  return Object.values(TEAM_CONFIG).map((team) => ({
    id: team.id,
    name: team.name,
  }));
};

export function getTeamBorderColor(teamId: string): string {
  const baseColor = getTeamColor(teamId);
  return baseColor.replace("bg-", "border-") + "/60";
}

export function getTeamTextColor(teamId: string): string {
  const baseColor = getTeamColor(teamId);
  const colorMap: { [key: string]: string } = {
    "bg-red-600": "text-red-400",
    "bg-purple-600": "text-purple-400",
  };
  return colorMap[baseColor] || "text-gray-400";
}

export function getTeamBorderSolidColor(teamId: string): string {
  const baseColor = getTeamColor(teamId);
  const colorMap: { [key: string]: string } = {
    "bg-red-600": "border-red-500",
    "bg-purple-600": "border-purple-500",
  };
  return colorMap[baseColor] || "border-gray-500";
}
