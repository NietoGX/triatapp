import type { NextApiRequest, NextApiResponse } from "next";
import { removePlayerFromTeam } from "@/lib/database/lineupApi";

type RemovePlayerRequest = {
  teamId: string;
  playerId: string;
  matchId?: string;
};

/**
 * API endpoint para eliminar un jugador de un equipo
 * POST: Elimina la asignación de un jugador a un equipo
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
    const { teamId, playerId, matchId } = req.body as RemovePlayerRequest;

    if (!teamId || !playerId) {
      return res.status(400).json({ error: "Faltan datos requeridos" });
    }

    const result = await removePlayerFromTeam(teamId, playerId, matchId);

    if (result.success) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(500).json({
        error: "Error al eliminar al jugador del equipo",
        details: result.error,
      });
    }
  } catch (error) {
    console.error("Error en API remove player:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      details: error,
    });
  }
}
