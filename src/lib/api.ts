import type { Player } from "./database/types";

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
