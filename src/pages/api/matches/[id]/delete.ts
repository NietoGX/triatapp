import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/database/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Match ID is required" });
  }

  try {
    // First, check if match exists
    const { data: existingMatch, error: checkError } = await supabase
      .from("matches")
      .select("*")
      .eq("id", id)
      .single();

    if (checkError || !existingMatch) {
      return res.status(404).json({ error: "Match not found" });
    }

    // Delete related data first (due to foreign key constraints)

    // Delete draft history for this match
    await supabase.from("draft_history").delete().eq("match_id", id);

    // Delete team player positions for this match
    await supabase.from("team_player_positions").delete().eq("match_id", id);

    // Delete draft state for this match
    await supabase.from("draft_state").delete().eq("match_id", id);

    // Delete match available players for this match
    await supabase.from("match_available_players").delete().eq("match_id", id);

    // Finally, delete the match
    const { error: deleteError } = await supabase
      .from("matches")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting match:", deleteError);
      return res.status(500).json({ error: "Error deleting match" });
    }

    res.status(200).json({
      success: true,
      message: "Match deleted successfully",
      deletedMatch: existingMatch,
    });
  } catch (error) {
    console.error("Error in delete match API:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
