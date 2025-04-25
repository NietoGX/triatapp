import type { NextApiRequest, NextApiResponse } from "next";
import { pickPlayer } from "@/lib/database/draftApi";

/**
 * API endpoint para seleccionar un jugador en el triaje.
 * POST /api/draft/pick
 * Body: { teamId: string, playerId: string }
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  try {
    const { teamId, playerId } = req.body;

    if (!teamId || !playerId) {
      return res.status(400).json({
        success: false,
        error: "Se requieren teamId y playerId",
      });
    }

    const result = await pickPlayer(teamId, playerId);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error al seleccionar jugador:", error);
    return res.status(500).json({ success: false, error: String(error) });
  }
}
