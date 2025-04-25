import type { NextApiRequest, NextApiResponse } from "next";
import { clearTeamLineups } from "@/lib/database/lineupApi";

/**
 * API endpoint para resetear todas las alineaciones
 * POST: Elimina todas las asignaciones de jugadores a equipos
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
    const result = await clearTeamLineups();

    if (result.success) {
      return res.status(200).json({ success: true });
    } else {
      return res
        .status(500)
        .json({ error: "Error al resetear las alineaciones" });
    }
  } catch (error) {
    console.error("Error en API reset lineups:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}
