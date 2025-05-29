import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/database/supabase";

/**
 * Debug endpoint to test available players logic step by step
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

    const debugLog: string[] = [];
    debugLog.push(`=== DEBUG AVAILABLE PLAYERS FOR MATCH: ${matchId} ===`);

    // Step 1: Get available players
    const { data: availablePlayers, error: availableError } = await supabase
      .from("match_available_players")
      .select("player_id")
      .eq("match_id", matchId)
      .eq("is_available", true);

    if (availableError) {
      debugLog.push(
        `ERROR getting available players: ${JSON.stringify(availableError)}`
      );
      return res.status(500).json({ error: "Database error", debugLog });
    }

    debugLog.push(
      `Available players from DB: ${JSON.stringify(availablePlayers)}`
    );

    if (!availablePlayers || availablePlayers.length === 0) {
      debugLog.push("No available players found");
      return res.status(200).json({
        availablePlayers: [],
        count: 0,
        debugLog,
        step: "no_available_players",
      });
    }

    const availablePlayerIds = availablePlayers.map((p) => p.player_id);
    debugLog.push(
      `Available player IDs (${availablePlayerIds.length}): ${JSON.stringify(
        availablePlayerIds
      )}`
    );

    // Step 2: Get draft history
    const { data: draftHistory, error: draftError } = await supabase
      .from("draft_history")
      .select("player_id")
      .eq("match_id", matchId);

    if (draftError) {
      debugLog.push(
        `ERROR getting draft history: ${JSON.stringify(draftError)}`
      );
      return res.status(500).json({ error: "Database error", debugLog });
    }

    debugLog.push(`Draft history from DB: ${JSON.stringify(draftHistory)}`);

    const draftedPlayerIds = [
      ...new Set((draftHistory || []).map((d) => d.player_id)),
    ];
    debugLog.push(
      `Drafted player IDs (${draftedPlayerIds.length}): ${JSON.stringify(
        draftedPlayerIds
      )}`
    );

    // Step 3: Filter
    const filteredPlayerIds = availablePlayerIds.filter((playerId) => {
      const isDrafted = draftedPlayerIds.includes(playerId);
      debugLog.push(
        `Player ${playerId}: ${
          isDrafted ? "DRAFTED (removing)" : "AVAILABLE (keeping)"
        }`
      );
      return !isDrafted;
    });

    debugLog.push(
      `Filtered player IDs (${filteredPlayerIds.length}): ${JSON.stringify(
        filteredPlayerIds
      )}`
    );

    if (filteredPlayerIds.length === 0) {
      debugLog.push("No players available after filtering");
      return res.status(200).json({
        availablePlayers: [],
        count: 0,
        debugLog,
        step: "filtered_to_zero",
      });
    }

    // Step 4: Get player details
    const { data: playerDetails, error: playersError } = await supabase
      .from("players")
      .select("*")
      .in("id", filteredPlayerIds);

    if (playersError) {
      debugLog.push(
        `ERROR getting player details: ${JSON.stringify(playersError)}`
      );
      return res.status(500).json({ error: "Database error", debugLog });
    }

    debugLog.push(`Player details: ${JSON.stringify(playerDetails)}`);

    return res.status(200).json({
      availablePlayers: playerDetails || [],
      count: (playerDetails || []).length,
      debugLog,
      step: "success",
      summary: {
        totalAvailable: availablePlayerIds.length,
        totalDrafted: draftedPlayerIds.length,
        afterFiltering: filteredPlayerIds.length,
        finalResult: (playerDetails || []).length,
      },
    });
  } catch (error) {
    console.error("[DEBUG] Error:", error);
    return res.status(500).json({ error: "Unexpected error", details: error });
  }
}
