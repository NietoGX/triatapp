import { supabase } from "./supabase";
import { v4 as uuidv4 } from "uuid";
import { Match, PlayerMatchStats } from "./types";

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
export async function getMatchById(id: string): Promise<Match | null> {
  try {
    const { data, error } = await supabase
      .from("matches")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching match:", error);
    return null;
  }
}

/**
 * Create a new match
 */
export async function createMatch(
  matchData: Omit<Match, "id" | "created_at" | "updated_at">
): Promise<Match | null> {
  try {
    const id = uuidv4();

    // Create a simplified match object with only the required fields
    const newMatch = {
      id,
      name: matchData.name,
      date: matchData.date,
      // Don't include timestamp fields - let the database defaults handle them
    };

    console.log(
      "Attempting to create match with data:",
      JSON.stringify(newMatch, null, 2)
    );

    // First try to insert without selecting to see if there's an error
    const { error: insertError } = await supabase
      .from("matches")
      .insert(newMatch);

    if (insertError) {
      console.error("Error inserting match:", insertError);
      throw insertError;
    }

    // Now fetch the inserted record
    const { data, error: selectError } = await supabase
      .from("matches")
      .select("*")
      .eq("id", id)
      .single();

    if (selectError) {
      console.error("Error fetching created match:", selectError);
      throw selectError;
    }

    console.log("Successfully created match:", data);
    return data;
  } catch (error) {
    console.error("Error creating match:", error);
    return null;
  }
}

/**
 * Update player stats for a match
 */
export async function savePlayerMatchStats(
  matchId: string,
  playerId: string,
  teamId: string,
  stats: {
    goals?: number;
    assists?: number;
    saves?: number;
    goals_saved?: number;
  }
): Promise<{ success: boolean; error?: unknown }> {
  try {
    // First check if there's an existing record
    const { data: existingData, error: selectError } = await supabase
      .from("player_match_stats")
      .select("id")
      .eq("match_id", matchId)
      .eq("player_id", playerId)
      .eq("team_id", teamId);

    if (selectError) throw selectError;

    const now = new Date().toISOString();

    if (existingData && existingData.length > 0) {
      // Update existing record
      const { error: updateError } = await supabase
        .from("player_match_stats")
        .update({
          ...stats,
          updated_at: now,
        })
        .eq("id", existingData[0].id);

      if (updateError) throw updateError;
    } else {
      // Create new record
      const { error: insertError } = await supabase
        .from("player_match_stats")
        .insert({
          id: uuidv4(),
          match_id: matchId,
          player_id: playerId,
          team_id: teamId,
          goals: stats.goals || 0,
          assists: stats.assists || 0,
          saves: stats.saves || 0,
          goals_saved: stats.goals_saved || 0,
          created_at: now,
          updated_at: now,
        });

      if (insertError) throw insertError;
    }

    return { success: true };
  } catch (error) {
    console.error("Error saving player match stats:", error);
    return { success: false, error };
  }
}

/**
 * Get all stats for a specific match
 */
export async function getMatchStats(
  matchId: string
): Promise<PlayerMatchStats[]> {
  try {
    const { data, error } = await supabase
      .from("player_match_stats")
      .select("*")
      .eq("match_id", matchId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching match stats:", error);
    return [];
  }
}

/**
 * Get available players for a match
 */
export async function getMatchAvailablePlayers(
  matchId: string
): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("match_available_players")
      .select("player_id")
      .eq("match_id", matchId)
      .eq("is_available", true);

    if (error) throw error;
    return data?.map((record) => record.player_id) || [];
  } catch (error) {
    console.error("Error fetching match available players:", error);
    return [];
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
