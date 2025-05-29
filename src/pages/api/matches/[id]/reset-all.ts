import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/database/supabase";

/**
 * API endpoint para reiniciar completamente un partido
 * POST: Elimina todas las alineaciones y el historial de draft
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { id: matchId } = req.query;

    if (!matchId || typeof matchId !== "string") {
      return res.status(400).json({
        error: "Se requiere un ID de partido válido",
      });
    }

    console.log(`[RESET ALL] Starting complete reset for match: ${matchId}`);

    // Step 1: Clear team lineups for this match
    const { error: lineupError } = await supabase
      .from("team_player_positions")
      .delete()
      .eq("match_id", matchId);

    if (lineupError) {
      console.error("[RESET ALL] Error clearing lineups:", lineupError);
      throw lineupError;
    }
    console.log("[RESET ALL] ✅ Lineups cleared");

    // Step 2: Clear draft history for this match
    const { error: draftHistoryError } = await supabase
      .from("draft_history")
      .delete()
      .eq("match_id", matchId);

    if (draftHistoryError) {
      console.error(
        "[RESET ALL] Error clearing draft history:",
        draftHistoryError
      );
      throw draftHistoryError;
    }
    console.log("[RESET ALL] ✅ Draft history cleared");

    // Step 3: Deactivate any active draft for this match
    const { error: draftStateError } = await supabase
      .from("draft_state")
      .update({
        is_active: false,
        current_team: null,
        updated_at: new Date().toISOString(),
      })
      .eq("match_id", matchId);

    if (draftStateError) {
      console.error("[RESET ALL] Error deactivating draft:", draftStateError);
      throw draftStateError;
    }
    console.log("[RESET ALL] ✅ Draft state deactivated");

    console.log(
      `[RESET ALL] ✅ Complete reset successful for match: ${matchId}`
    );

    return res.status(200).json({
      success: true,
      message: "Partido reiniciado completamente",
    });
  } catch (error) {
    console.error("[RESET ALL] Error:", error);
    res.status(500).json({
      error: "Error interno del servidor al reiniciar el partido",
      details: error,
    });
  }
}
