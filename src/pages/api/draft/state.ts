import type { NextApiRequest, NextApiResponse } from "next";
import { getDraftState } from "@/lib/database/draftApi";

/**
 * API endpoint para obtener el estado actual del triaje.
 * GET /api/draft/state
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  try {
    const state = await getDraftState();
    return res.status(200).json(state);
  } catch (error) {
    console.error("Error al obtener estado del triaje:", error);
    return res.status(500).json({ error: String(error) });
  }
}
