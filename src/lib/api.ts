import type { Player } from "./database/types";
import type { TeamLineup, PlayerPosition } from "./database/types";

// Base API URL
const API_URL = "/api";

// Generic fetch function with error handling
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(
      error.message || "An error occurred while fetching the data."
    );
  }

  // For 204 No Content responses
  if (res.status === 204) {
    return {} as T;
  }

  return res.json();
}

// Player API functions
export const playerApi = {
  // Get all players
  getAll: async (): Promise<Player[]> => {
    return fetchAPI<Player[]>("/players");
  },

  // Get a player by ID
  getById: async (id: string): Promise<Player> => {
    return fetchAPI<Player>(`/players/${id}`);
  },

  // Create a new player
  create: async (
    player: Omit<Player, "id" | "created_at" | "updated_at">
  ): Promise<Player> => {
    return fetchAPI<Player>("/players", {
      method: "POST",
      body: JSON.stringify(player),
    });
  },

  // Update a player
  update: async (
    id: string,
    updates: Partial<Omit<Player, "id" | "created_at" | "updated_at">>
  ): Promise<Player> => {
    return fetchAPI<Player>(`/players/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  // Delete a player
  delete: async (id: string): Promise<void> => {
    return fetchAPI<void>(`/players/${id}`, {
      method: "DELETE",
    });
  },

  // Initialize sample players
  initialize: async (): Promise<{ success: boolean; message: string }> => {
    return fetchAPI<{ success: boolean; message: string }>(
      "/players/initialize",
      {
        method: "POST",
      }
    );
  },
};

// Lineup API functions
export const lineupApi = {
  // Get all lineups
  getAll: async (): Promise<TeamLineup> => {
    return fetchAPI<TeamLineup>("/lineups");
  },

  // Save player position in a team
  savePosition: async (
    teamId: string,
    playerId: string,
    position: PlayerPosition,
    order: number = 0
  ): Promise<{ success: boolean }> => {
    return fetchAPI<{ success: boolean }>("/lineups/save", {
      method: "POST",
      body: JSON.stringify({
        teamId,
        playerId,
        position,
        order,
      }),
    });
  },

  // Remove player from a team
  removePlayer: async (
    teamId: string,
    playerId: string
  ): Promise<{ success: boolean }> => {
    return fetchAPI<{ success: boolean }>("/lineups/remove", {
      method: "POST",
      body: JSON.stringify({
        teamId,
        playerId,
      }),
    });
  },

  // Reset all team lineups
  reset: async (): Promise<{ success: boolean }> => {
    return fetchAPI<{ success: boolean }>("/lineups/reset", {
      method: "POST",
    });
  },
};

// Team API functions
export const teamApi = {
  // Initialize teams in the database
  initialize: async (): Promise<{ success: boolean; message: string }> => {
    return fetchAPI<{ success: boolean; message: string }>(
      "/teams/initialize",
      {
        method: "POST",
      }
    );
  },
};
