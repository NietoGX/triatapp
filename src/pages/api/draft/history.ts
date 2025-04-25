import type { NextApiRequest, NextApiResponse } from "next";
import { getDraftHistory } from "@/lib/database/draftApi";

/**
 * API endpoint para obtener el historial del triaje.
 * GET /api/draft/history
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  try {
    const history = await getDraftHistory();
    return res.status(200).json(history);
  } catch (error) {
    console.error("Error al obtener historial del triaje:", error);
    return res.status(500).json({ error: String(error) });
  }
}
