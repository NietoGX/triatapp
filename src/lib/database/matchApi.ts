import { supabase } from "./supabase";
import { v4 as uuidv4 } from "uuid";
import { Match, MatchStatus, PlayerMatchStats } from "./types";

/**
 * Get all matches
 */
export async function getAllMatches(): Promise<Match[]> {
  try {
    const { data, error } = await supabase
      .from("matches")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching matches:", error);
    return [];
  }
}

/**
 * Get a match by ID
 */
export async function getMatchById(
  matchId: string
): Promise<{ success: boolean; match?: Match; error?: unknown }> {
  try {
    const { data, error } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .single();

    if (error) throw error;

    return { success: true, match: data };
  } catch (error) {
    console.error(`Error getting match ${matchId}:`, error);
    return { success: false, error };
  }
}

/**
 * Create a new match
 */
export async function createMatch(
  name: string,
  date: string,
  availablePlayers: string[]
): Promise<{ success: boolean; match?: Match; error?: unknown }> {
  try {
    const matchId = uuidv4();
    const now = new Date().toISOString();

    // Insert new match with PENDING status
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .insert({
        id: matchId,
        name,
        date,
        status: "PENDING",
        created_at: now,
        updated_at: now,
      })
      .select("*")
      .single();

    if (matchError) throw matchError;

    // Create available player entries for this match
    if (availablePlayers && availablePlayers.length > 0) {
      const availablePlayersData = availablePlayers.map((playerId) => ({
        id: uuidv4(),
        match_id: matchId,
        player_id: playerId,
        is_available: true,
        created_at: now,
        updated_at: now,
      }));

      const { error: availableError } = await supabase
        .from("match_available_players")
        .insert(availablePlayersData);

      if (availableError) throw availableError;
    }

    return { success: true, match };
  } catch (error) {
    console.error("Error creating match:", error);
    return { success: false, error };
  }
}

/**
 * Update match status
 */
export async function updateMatchStatus(
  matchId: string,
  status: MatchStatus
): Promise<{ success: boolean; error?: unknown }> {
  try {
    const { error } = await supabase
      .from("matches")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", matchId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error(`Error updating match ${matchId} status:`, error);
    return { success: false, error };
  }
}

/**
 * Get player stats for a match
 */
export async function getMatchStats(
  matchId: string
): Promise<{ success: boolean; stats?: PlayerMatchStats[]; error?: unknown }> {
  try {
    const { data, error } = await supabase
      .from("player_match_stats")
      .select("*")
      .eq("match_id", matchId);

    if (error) throw error;

    return { success: true, stats: data || [] };
  } catch (error) {
    console.error(`Error getting stats for match ${matchId}:`, error);
    return { success: false, error };
  }
}

/**
 * Save or update player statistics for a match
 */
export async function savePlayerMatchStats(statsData: {
  match_id: string;
  player_id: string;
  team_id: string;
  goals: number;
  assists: number;
  saves: number;
}): Promise<{ success: boolean; error?: unknown }> {
  try {
    // Check if stats already exist for this player in this match
    const { data: existingStats, error: queryError } = await supabase
      .from("player_match_stats")
      .select("id")
      .eq("match_id", statsData.match_id)
      .eq("player_id", statsData.player_id)
      .single();

    if (queryError && queryError.code !== "PGRST116") {
      console.error("Error checking existing stats:", queryError);
      return { success: false, error: queryError };
    }

    // If stats exist, update them, otherwise insert new record
    if (existingStats?.id) {
      const { error } = await supabase
        .from("player_match_stats")
        .update({
          goals: statsData.goals,
          assists: statsData.assists,
          saves: statsData.saves,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingStats.id);

      if (error) {
        console.error("Error updating player match stats:", error);
        return { success: false, error };
      }
    } else {
      const { error } = await supabase.from("player_match_stats").insert({
        match_id: statsData.match_id,
        player_id: statsData.player_id,
        team_id: statsData.team_id,
        goals: statsData.goals,
        assists: statsData.assists,
        saves: statsData.saves,
      });

      if (error) {
        console.error("Error inserting player match stats:", error);
        return { success: false, error };
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error saving player match stats:", error);
    return { success: false, error };
  }
}

/**
 * Get available players for a match
 */
export async function getMatchAvailablePlayers(matchId: string) {
  try {
    console.log(
      `[DEBUG] === STARTING getMatchAvailablePlayers for match: ${matchId} ===`
    );

    // Step 1: Get all players marked as available for this match
    const { data: availablePlayers, error: availableError } = await supabase
      .from("match_available_players")
      .select("player_id")
      .eq("match_id", matchId)
      .eq("is_available", true);

    if (availableError) {
      console.error(
        "[DEBUG] Error fetching available players:",
        availableError
      );
      throw availableError;
    }

    console.log(`[DEBUG] Raw available players from DB:`, availablePlayers);

    if (!availablePlayers || availablePlayers.length === 0) {
      console.log("[DEBUG] No available players found, returning empty array");
      return [];
    }

    const availablePlayerIds = availablePlayers.map((p) => p.player_id);
    console.log(
      `[DEBUG] Available player IDs (${availablePlayerIds.length}):`,
      availablePlayerIds
    );

    // Step 2: Get drafted player IDs
    const { data: draftHistory, error: draftError } = await supabase
      .from("draft_history")
      .select("player_id")
      .eq("match_id", matchId);

    if (draftError) {
      console.error("[DEBUG] Error fetching draft history:", draftError);
      throw draftError;
    }

    console.log(`[DEBUG] Raw draft history from DB:`, draftHistory);

    const draftedPlayerIds = [
      ...new Set((draftHistory || []).map((d) => d.player_id)),
    ];
    console.log(
      `[DEBUG] Drafted player IDs (${draftedPlayerIds.length}):`,
      draftedPlayerIds
    );

    // Step 3: Filter out drafted players
    const filteredPlayerIds = availablePlayerIds.filter((playerId) => {
      const isDrafted = draftedPlayerIds.includes(playerId);
      console.log(
        `[DEBUG] Player ${playerId}: ${
          isDrafted ? "DRAFTED (filtered out)" : "AVAILABLE (keeping)"
        }`
      );
      return !isDrafted;
    });

    console.log(
      `[DEBUG] Final filtered player IDs (${filteredPlayerIds.length}):`,
      filteredPlayerIds
    );

    if (filteredPlayerIds.length === 0) {
      console.log(
        "[DEBUG] No players available after filtering, returning empty array"
      );
      return [];
    }

    // Step 4: Get player details
    console.log(
      `[DEBUG] Fetching player details for ${filteredPlayerIds.length} players`
    );
    const { data: playerDetails, error: playersError } = await supabase
      .from("players")
      .select("*")
      .in("id", filteredPlayerIds);

    if (playersError) {
      console.error("[DEBUG] Error fetching player details:", playersError);
      throw playersError;
    }

    console.log(`[DEBUG] Player details fetched:`, playerDetails);
    console.log(
      `[DEBUG] === FINISHED getMatchAvailablePlayers, returning ${
        playerDetails?.length || 0
      } players ===`
    );

    return playerDetails || [];
  } catch (error) {
    console.error("[DEBUG] === ERROR in getMatchAvailablePlayers ===", error);
    throw error;
  }
}

/**
 * Update available players for a match
 */
export async function updateMatchAvailablePlayers(
  matchId: string,
  playerIds: string[]
): Promise<boolean> {
  try {
    // First, set all players for this match as unavailable
    const { error: updateError } = await supabase
      .from("match_available_players")
      .update({ is_available: false })
      .eq("match_id", matchId);

    if (updateError) throw updateError;

    // Then, make selected players available again
    if (playerIds.length > 0) {
      const { error: resetError } = await supabase
        .from("match_available_players")
        .update({ is_available: true })
        .eq("match_id", matchId)
        .in("player_id", playerIds);

      if (resetError) throw resetError;
    }

    return true;
  } catch (error) {
    console.error("Error updating match available players:", error);
    return false;
  }
}

/**
 * Add new available players to a match
 */
export async function addMatchAvailablePlayers(
  matchId: string,
  playerIds: string[]
): Promise<boolean> {
  try {
    const now = new Date().toISOString();

    const { error } = await supabase.from("match_available_players").insert(
      playerIds.map((playerId) => ({
        id: uuidv4(),
        match_id: matchId,
        player_id: playerId,
        is_available: true,
        created_at: now,
        updated_at: now,
      }))
    );

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error adding match available players:", error);
    return false;
  }
}
