import type { NextApiRequest, NextApiResponse } from "next";
import { endDraft } from "@/lib/database/draftApi";

/**
 * API endpoint para finalizar un triaje activo.
 * POST /api/draft/end
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  try {
    const result = await endDraft();
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error al finalizar triaje:", error);
    return res.status(500).json({ success: false, error: String(error) });
  }
}
