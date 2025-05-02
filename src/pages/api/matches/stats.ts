import type { NextApiRequest, NextApiResponse } from "next";
import { savePlayerMatchStats } from "@/lib/database/matchApi";

type SaveStatsRequest = {
  matchId: string;
  playerId: string;
  teamId: string;
  goals?: number;
  assists?: number;
  saves?: number;
};

type ErrorResponse = {
  error: string;
  details?: unknown;
};

/**
 * API endpoint para guardar estadísticas de jugadores en un partido
 * POST: Guarda las estadísticas de un jugador en un partido específico
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ success: boolean } | ErrorResponse>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const {
      matchId,
      playerId,
      teamId,
      goals = 0,
      assists = 0,
      saves = 0,
    } = req.body as SaveStatsRequest;

    if (!matchId || !playerId || !teamId) {
      return res.status(400).json({ error: "Faltan datos requeridos" });
    }

    const result = await savePlayerMatchStats({
      match_id: matchId,
      player_id: playerId,
      team_id: teamId,
      goals,
      assists,
      saves,
    });

    if (result.success) {
      return res.status(200).json({ success: true });
    } else {
      console.error("Error in savePlayerMatchStats:", result.error);
      return res.status(500).json({
        error: "Error al guardar las estadísticas",
        details: result.error,
      });
    }
  } catch (error) {
    console.error("Error en API de estadísticas:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      details: error,
    });
  }
}
