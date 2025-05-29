import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/database/supabase";

/**
 * Debug endpoint to check match data consistency
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { matchId } = req.query;

    if (!matchId || typeof matchId !== "string") {
      return res.status(400).json({ error: "Match ID is required" });
    }

    console.log(`[DEBUG] Checking data for match: ${matchId}`);

    // Get match info
    const { data: match } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .single();

    // Get available players for this match
    const { data: availablePlayers } = await supabase
      .from("match_available_players")
      .select("*")
      .eq("match_id", matchId);

    // Get draft history
    const { data: draftHistory } = await supabase
      .from("draft_history")
      .select("*")
      .eq("match_id", matchId)
      .order("created_at");

    // Get draft state
    const { data: draftState } = await supabase
      .from("draft_state")
      .select("*")
      .eq("match_id", matchId);

    // Get all players (for reference)
    const { data: allPlayers } = await supabase
      .from("players")
      .select("id, name");

    // Get team lineups for this match
    const { data: lineups } = await supabase
      .from("team_player_positions")
      .select("*")
      .eq("match_id", matchId);

    const debugData = {
      match,
      availablePlayers: availablePlayers || [],
      draftHistory: draftHistory || [],
      draftState: draftState || [],
      allPlayers: allPlayers || [],
      lineups: lineups || [],
      summary: {
        totalPlayersInSystem: allPlayers?.length || 0,
        availablePlayersForMatch:
          availablePlayers?.filter((p) => p.is_available)?.length || 0,
        draftedPlayers: draftHistory?.length || 0,
        uniqueDraftedPlayers: [
          ...new Set(draftHistory?.map((d) => d.player_id) || []),
        ].length,
        playersInLineups: lineups?.length || 0,
      },
    };

    console.log("[DEBUG] Match data summary:", debugData.summary);

    return res.status(200).json(debugData);
  } catch (error) {
    console.error("[DEBUG] Error getting match data:", error);
    return res.status(500).json({ error: "Failed to get match data" });
  }
}
