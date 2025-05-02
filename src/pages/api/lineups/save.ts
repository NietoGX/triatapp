import type { NextApiRequest, NextApiResponse } from "next";
import { savePlayerPosition } from "@/lib/database/lineupApi";
import { PlayerPosition } from "@/lib/database/types";

type SavePositionRequest = {
  teamId: string;
  playerId: string;
  position: PlayerPosition;
  order?: number;
  matchId?: string;
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
    console.log("Request body:", req.body);

    const {
      teamId,
      playerId,
      position,
      order = 0,
      matchId = undefined,
    } = req.body as SavePositionRequest;

    if (!teamId || !playerId || !position) {
      console.log("Missing required data:", { teamId, playerId, position });
      return res.status(400).json({ error: "Faltan datos requeridos" });
    }

    console.log("Saving position with data:", {
      teamId,
      playerId,
      position,
      order,
      matchId,
    });
    const result = await savePlayerPosition(
      teamId,
      playerId,
      position,
      order,
      matchId
    );
    console.log("Save result:", result);

    if (result.success) {
      return res.status(200).json({ success: true });
    } else {
      console.error("Error in savePlayerPosition:", result.error);
      let errorMessage = "Error al guardar la posición";

      // Check for specific Supabase error types
      if (
        result.error &&
        typeof result.error === "object" &&
        "code" in result.error &&
        result.error.code === "PGRST116"
      ) {
        errorMessage = "Error al verificar la posición del jugador";
        console.log(
          "This is a .single() query error, should be fixed in the backend"
        );
      }

      return res
        .status(500)
        .json({ error: errorMessage, details: result.error });
    }
  } catch (error) {
    console.error("Error en API save position:", error);
    res
      .status(500)
      .json({ error: "Error interno del servidor", details: error });
  }
}
