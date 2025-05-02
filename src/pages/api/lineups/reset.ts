import type { NextApiRequest, NextApiResponse } from "next";
import { clearTeamLineups } from "@/lib/database/lineupApi";

type ResetRequest = {
  matchId?: string;
};

/**
 * API endpoint para resetear todas las alineaciones
 * POST: Elimina todas las asignaciones de jugadores a equipos
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
    const { matchId } = req.body as ResetRequest;

    const result = await clearTeamLineups(matchId);

    if (result.success) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(500).json({
        error: "Error al resetear las alineaciones",
        details: result.error,
      });
    }
  } catch (error) {
    console.error("Error en API reset lineups:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      details: error,
    });
  }
}
