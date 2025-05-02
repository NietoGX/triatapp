import type { NextApiRequest, NextApiResponse } from "next";
import { getDraftState } from "@/lib/database/draftApi";

/**
 * API endpoint para obtener el estado actual del triaje.
 * GET /api/draft/state?matchId=xxx
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  try {
    const { matchId } = req.query;

    if (!matchId || typeof matchId !== "string") {
      return res.status(400).json({
        success: false,
        error:
          "Se requiere un ID de partido válido para obtener el estado del triaje",
      });
    }

    const state = await getDraftState(matchId);
    return res.status(200).json(state);
  } catch (error) {
    console.error("Error al obtener estado del triaje:", error);
    return res.status(500).json({ success: false, error: String(error) });
  }
}
