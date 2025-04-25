import type { NextApiRequest, NextApiResponse } from "next";
import { startDraft } from "@/lib/database/draftApi";

/**
 * API endpoint para iniciar un nuevo triaje.
 * POST /api/draft/start
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  try {
    const result = await startDraft();
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error al iniciar triaje:", error);
    return res.status(500).json({ success: false, error: String(error) });
  }
}
