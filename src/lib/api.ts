import type { Player } from "./database/types";
import type {
  TeamLineup,
  PlayerPosition,
  DraftState,
  DraftHistoryItem,
  DraftError,
  Match,
  PlayerMatchStats,
  MatchStatus,
} from "./database/types";

// Base API URL
const API_URL = "/api";

// Generic fetch function with error handling
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!res.ok) {
      // Try to parse error as JSON
      let errorData: { error?: string; message?: string; details?: unknown } =
        {};
      try {
        errorData = await res.json();
      } catch {
        // If JSON parsing fails, use status text
        throw new Error(`${res.status}: ${res.statusText}`);
      }

      // Improved error message with more details
      const errorMessage =
        errorData.error ||
        errorData.message ||
        `API Error: ${res.status} ${res.statusText}`;

      console.error(`API Error (${endpoint}):`, errorData);
      throw new Error(errorMessage);
    }

    // For 204 No Content responses
    if (res.status === 204) {
      return {} as T;
    }

    return res.json();
  } catch (error) {
    // Log the raw error for debugging but rethrow to maintain the error chain
    console.error(`Error in fetchAPI (${endpoint}):`, error);
    throw error;
  }
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
  getAll: async (matchId?: string): Promise<TeamLineup> => {
    const endpoint = matchId ? `/lineups?matchId=${matchId}` : "/lineups";
    return fetchAPI<TeamLineup>(endpoint);
  },

  // Save player position in a team
  savePosition: async (
    teamId: string,
    playerId: string,
    position: PlayerPosition,
    order: number = 0,
    matchId?: string
  ): Promise<{ success: boolean }> => {
    return fetchAPI<{ success: boolean }>("/lineups/save", {
      method: "POST",
      body: JSON.stringify({
        teamId,
        playerId,
        position,
        order,
        matchId,
      }),
    });
  },

  // Remove player from a team
  removePlayer: async (
    teamId: string,
    playerId: string,
    matchId?: string
  ): Promise<{ success: boolean }> => {
    return fetchAPI<{ success: boolean }>("/lineups/remove", {
      method: "POST",
      body: JSON.stringify({
        teamId,
        playerId,
        matchId,
      }),
    });
  },

  // Reset all team lineups
  reset: async (matchId?: string): Promise<{ success: boolean }> => {
    return fetchAPI<{ success: boolean }>("/lineups/reset", {
      method: "POST",
      body: JSON.stringify({
        matchId,
      }),
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

// Draft API functions
export const draftApi = {
  // Iniciar un nuevo triaje
  start: async (
    matchId: string
  ): Promise<{
    success: boolean;
    startingTeam?: string;
    error?: DraftError;
  }> => {
    return fetchAPI<{
      success: boolean;
      startingTeam?: string;
      error?: DraftError;
    }>("/draft/start", {
      method: "POST",
      body: JSON.stringify({
        matchId,
      }),
    });
  },

  // Terminar el triaje actual
  end: async (
    matchId: string
  ): Promise<{ success: boolean; error?: DraftError }> => {
    return fetchAPI<{ success: boolean; error?: DraftError }>("/draft/end", {
      method: "POST",
      body: JSON.stringify({
        matchId,
      }),
    });
  },

  // Obtener el estado actual del triaje
  getState: async (matchId: string): Promise<DraftState> => {
    return fetchAPI<DraftState>(
      `/draft/state?matchId=${encodeURIComponent(matchId)}`
    );
  },

  // Seleccionar un jugador para un equipo en el triaje
  pickPlayer: async (
    teamId: string,
    playerId: string,
    matchId: string
  ): Promise<{ success: boolean; nextTeam?: string; error?: DraftError }> => {
    return fetchAPI<{
      success: boolean;
      nextTeam?: string;
      error?: DraftError;
    }>("/draft/pick", {
      method: "POST",
      body: JSON.stringify({
        teamId,
        playerId,
        matchId,
      }),
    });
  },

  // Obtener el historial de selecciones del triaje
  getHistory: async (matchId: string): Promise<DraftHistoryItem[]> => {
    return fetchAPI<DraftHistoryItem[]>(
      `/draft/history?matchId=${encodeURIComponent(matchId)}`
    );
  },
};

// Define a type for match creation
interface CreateMatchData {
  name: string;
  date: string;
  location?: string;
  availablePlayers: string[];
}

// Match API functions
export const matchApi = {
  // Get all matches
  getAll: async (): Promise<Match[]> => {
    return fetchAPI<Match[]>("/matches");
  },

  // Get match by ID
  getById: async (id: string): Promise<{ match: Match }> => {
    return fetchAPI<{ match: Match }>(`/matches/${id}`);
  },

  // Get available players for a match
  getAvailablePlayers: async (matchId: string): Promise<Player[]> => {
    const timestamp = Date.now();
    return fetchAPI<Player[]>(
      `/matches/${matchId}/available-players?t=${timestamp}`
    );
  },

  // Update match status
  updateStatus: async (
    id: string,
    status: MatchStatus
  ): Promise<{ success: boolean }> => {
    return fetchAPI<{ success: boolean }>(`/matches/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  },

  // Update match
  update: async (
    id: string,
    data: { name: string; date: string }
  ): Promise<{ success: boolean; match: Match }> => {
    return fetchAPI<{ success: boolean; match: Match }>(
      `/matches/${id}/update`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );
  },

  // Delete match
  delete: async (
    id: string
  ): Promise<{ success: boolean; message: string; deletedMatch: Match }> => {
    return fetchAPI<{ success: boolean; message: string; deletedMatch: Match }>(
      `/matches/${id}/delete`,
      {
        method: "DELETE",
      }
    );
  },

  // Reset all match data (lineups + draft)
  resetAll: async (
    matchId: string
  ): Promise<{ success: boolean; message: string }> => {
    return fetchAPI<{ success: boolean; message: string }>(
      `/matches/${matchId}/reset-all`,
      {
        method: "POST",
      }
    );
  },

  // Create a new match
  create: async (data: CreateMatchData) => {
    try {
      const response = await fetch("/api/matches/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error creating match");
      }

      return (await response.json()) as Match;
    } catch (error) {
      console.error("Error in matchApi.create:", error);
      throw error;
    }
  },

  // Get match statistics
  getStats: async (
    matchId: string
  ): Promise<{ success: boolean; stats?: PlayerMatchStats[] }> => {
    return fetchAPI(`/api/matches/${matchId}/stats`);
  },

  // Save player statistics for a match
  saveStats: async (
    matchId: string,
    playerStats: {
      player_id: string;
      team_id: string;
      goals?: number;
      assists?: number;
      saves?: number;
    }
  ): Promise<{ success: boolean }> => {
    return fetchAPI(`/api/matches/${matchId}/stats`, {
      method: "POST",
      body: JSON.stringify(playerStats),
    });
  },
};
