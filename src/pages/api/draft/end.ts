import type { NextApiRequest, NextApiResponse } from "next";
import { endDraft } from "@/lib/database/draftApi";

type EndDraftRequest = {
  matchId: string;
};

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
    const { matchId } = req.body as EndDraftRequest;

    if (!matchId) {
      return res.status(400).json({
        success: false,
        error: "Se requiere un ID de partido para finalizar el triaje",
      });
    }

    const result = await endDraft(matchId);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error al finalizar triaje:", error);
    return res.status(500).json({ success: false, error: String(error) });
  }
}
