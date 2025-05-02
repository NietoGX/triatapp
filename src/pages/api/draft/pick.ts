import type { NextApiRequest, NextApiResponse } from "next";
import { pickPlayer } from "@/lib/database/draftApi";

type PickPlayerRequest = {
  teamId: string;
  playerId: string;
  matchId: string;
};

/**
 * API endpoint para seleccionar un jugador en el triaje.
 * POST /api/draft/pick
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  try {
    const { teamId, playerId, matchId } = req.body as PickPlayerRequest;

    if (!teamId || !playerId || !matchId) {
      return res.status(400).json({
        success: false,
        error:
          "Se requieren teamId, playerId y matchId para seleccionar un jugador",
      });
    }

    const result = await pickPlayer(teamId, playerId, matchId);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error al seleccionar jugador:", error);
    return res.status(500).json({ success: false, error: String(error) });
  }
}
