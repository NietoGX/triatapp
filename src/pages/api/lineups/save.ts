import type { NextApiRequest, NextApiResponse } from "next";
import { savePlayerPosition } from "@/lib/database/lineupApi";
import { PlayerPosition } from "@/lib/database/types";

type SavePositionRequest = {
  teamId: string;
  playerId: string;
  position: PlayerPosition;
  order?: number;
};

/**
 * API endpoint para guardar la posición de un jugador en un equipo
 * POST: Guarda la asignación de un jugador a una posición en un equipo
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
    const {
      teamId,
      playerId,
      position,
      order = 0,
    } = req.body as SavePositionRequest;

    if (!teamId || !playerId || !position) {
      return res.status(400).json({ error: "Faltan datos requeridos" });
    }

    const result = await savePlayerPosition(teamId, playerId, position, order);

    if (result.success) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(500).json({ error: "Error al guardar la posición" });
    }
  } catch (error) {
    console.error("Error en API save position:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}
