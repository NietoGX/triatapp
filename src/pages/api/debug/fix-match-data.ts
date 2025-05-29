import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/database/supabase";
import { v4 as uuidv4 } from "uuid";

/**
 * Debug endpoint to fix match data inconsistencies
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { matchId } = req.body;

    if (!matchId || typeof matchId !== "string") {
      return res.status(400).json({ error: "Match ID is required" });
    }

    console.log(`[FIX] Fixing data inconsistencies for match: ${matchId}`);

    // Get current available players
    const { data: availablePlayers } = await supabase
      .from("match_available_players")
      .select("player_id")
      .eq("match_id", matchId)
      .eq("is_available", true);

    // Get draft history
    const { data: draftHistory } = await supabase
      .from("draft_history")
      .select("player_id")
      .eq("match_id", matchId);

    const availablePlayerIds = (availablePlayers || []).map((p) => p.player_id);
    const draftedPlayerIds = [
      ...new Set((draftHistory || []).map((d) => d.player_id)),
    ];

    console.log(`[FIX] Available players: ${availablePlayerIds.length}`);
    console.log(`[FIX] Drafted players: ${draftedPlayerIds.length}`);

    // Find players that are drafted but not in available list
    const missingFromAvailable = draftedPlayerIds.filter(
      (playerId) => !availablePlayerIds.includes(playerId)
    );

    console.log(
      `[FIX] Players missing from available list: ${missingFromAvailable.length}`,
      missingFromAvailable
    );

    if (missingFromAvailable.length > 0) {
      // Add missing players to match_available_players
      const now = new Date().toISOString();
      const newAvailableEntries = missingFromAvailable.map((playerId) => ({
        id: uuidv4(),
        match_id: matchId,
        player_id: playerId,
        is_available: false, // Mark as not available since they're already drafted
        created_at: now,
        updated_at: now,
      }));

      const { error: insertError } = await supabase
        .from("match_available_players")
        .insert(newAvailableEntries);

      if (insertError) {
        console.error("[FIX] Error inserting missing players:", insertError);
        throw insertError;
      }

      console.log(
        `[FIX] Added ${missingFromAvailable.length} missing players to match_available_players`
      );
    }

    // Now get updated available players (excluding drafted ones)
    const { data: updatedAvailable } = await supabase
      .from("match_available_players")
      .select("player_id")
      .eq("match_id", matchId)
      .eq("is_available", true);

    const updatedAvailableIds = (updatedAvailable || []).map(
      (p) => p.player_id
    );

    // Filter out drafted players from available list
    const actuallyAvailable = updatedAvailableIds.filter(
      (playerId) => !draftedPlayerIds.includes(playerId)
    );

    console.log(
      `[FIX] Actually available players after fix: ${actuallyAvailable.length}`
    );

    return res.status(200).json({
      success: true,
      before: {
        availablePlayers: availablePlayerIds.length,
        draftedPlayers: draftedPlayerIds.length,
        missingFromAvailable: missingFromAvailable.length,
      },
      after: {
        availablePlayers: actuallyAvailable.length,
        addedMissingPlayers: missingFromAvailable.length,
      },
      missingPlayersAdded: missingFromAvailable,
      actuallyAvailableNow: actuallyAvailable,
    });
  } catch (error) {
    console.error("[FIX] Error fixing match data:", error);
    return res.status(500).json({ error: "Failed to fix match data" });
  }
}
