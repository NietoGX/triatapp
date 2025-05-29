import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/database/supabase";
import { v4 as uuidv4 } from "uuid";

/**
 * Fix player references in match_available_players
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

    console.log(`[FIX-REFS] Fixing player references for match: ${matchId}`);

    // Get all real players
    const { data: realPlayers } = await supabase
      .from("players")
      .select("id, name");

    if (!realPlayers || realPlayers.length === 0) {
      return res
        .status(400)
        .json({ error: "No players found in players table" });
    }

    console.log(`[FIX-REFS] Found ${realPlayers.length} real players`);

    // Delete all existing match_available_players for this match
    const { error: deleteError } = await supabase
      .from("match_available_players")
      .delete()
      .eq("match_id", matchId);

    if (deleteError) {
      console.error("[FIX-REFS] Error deleting old data:", deleteError);
      throw deleteError;
    }

    console.log("[FIX-REFS] Deleted old match_available_players data");

    // Create new entries with correct player IDs
    const now = new Date().toISOString();
    const newAvailableEntries = realPlayers.map((player) => ({
      id: uuidv4(),
      match_id: matchId,
      player_id: player.id,
      is_available: true, // Make all players available initially
      created_at: now,
      updated_at: now,
    }));

    const { error: insertError } = await supabase
      .from("match_available_players")
      .insert(newAvailableEntries);

    if (insertError) {
      console.error("[FIX-REFS] Error inserting new data:", insertError);
      throw insertError;
    }

    console.log(
      `[FIX-REFS] Created ${newAvailableEntries.length} new match_available_players entries`
    );

    // Now check if we need to mark any players as unavailable based on draft history
    const { data: draftHistory } = await supabase
      .from("draft_history")
      .select("player_id")
      .eq("match_id", matchId);

    const draftedPlayerIds = [
      ...new Set((draftHistory || []).map((d) => d.player_id)),
    ];

    // Check which drafted players exist in the real players
    const validDraftedPlayers = draftedPlayerIds.filter((playerId) =>
      realPlayers.some((p) => p.id === playerId)
    );

    console.log(
      `[FIX-REFS] Found ${draftedPlayerIds.length} drafted players, ${validDraftedPlayers.length} are valid`
    );

    if (validDraftedPlayers.length > 0) {
      // Mark drafted players as not available
      const { error: updateError } = await supabase
        .from("match_available_players")
        .update({ is_available: false })
        .eq("match_id", matchId)
        .in("player_id", validDraftedPlayers);

      if (updateError) {
        console.error(
          "[FIX-REFS] Error updating drafted players:",
          updateError
        );
        throw updateError;
      }

      console.log(
        `[FIX-REFS] Marked ${validDraftedPlayers.length} drafted players as unavailable`
      );
    }

    // Final count
    const { data: finalAvailable } = await supabase
      .from("match_available_players")
      .select("player_id")
      .eq("match_id", matchId)
      .eq("is_available", true);

    return res.status(200).json({
      success: true,
      message: "Player references fixed successfully",
      summary: {
        totalRealPlayers: realPlayers.length,
        newEntriesCreated: newAvailableEntries.length,
        draftedPlayersFound: draftedPlayerIds.length,
        validDraftedPlayers: validDraftedPlayers.length,
        finalAvailablePlayers: (finalAvailable || []).length,
      },
      realPlayers: realPlayers.map((p) => ({ id: p.id, name: p.name })),
      validDraftedPlayers,
    });
  } catch (error) {
    console.error("[FIX-REFS] Error:", error);
    return res.status(500).json({ error: "Failed to fix player references" });
  }
}
