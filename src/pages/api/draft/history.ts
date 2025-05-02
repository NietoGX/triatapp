import type { NextApiRequest, NextApiResponse } from "next";
import { getDraftHistory } from "@/lib/database/draftApi";

/**
 * API endpoint para obtener el historial del triaje.
 * GET /api/draft/history?matchId=xxx
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
          "Se requiere un ID de partido válido para obtener el historial del triaje",
      });
    }

    const history = await getDraftHistory(matchId);
    return res.status(200).json(history);
  } catch (error) {
    console.error("Error al obtener historial del triaje:", error);
    return res.status(500).json({ success: false, error: String(error) });
  }
}
