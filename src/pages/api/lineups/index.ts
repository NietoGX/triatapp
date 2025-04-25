import type { NextApiRequest, NextApiResponse } from "next";
import { loadTeamLineups } from "@/lib/database/lineupApi";

/**
 * API endpoint para gestionar las alineaciones de equipos
 * GET: Obtiene todas las alineaciones actuales
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method) {
    case "GET":
      try {
        const lineups = await loadTeamLineups();
        res.status(200).json(lineups);
      } catch (error) {
        console.error("Error al cargar alineaciones:", error);
        res.status(500).json({ error: "Error al cargar las alineaciones" });
      }
      break;

    default:
      res.setHeader("Allow", ["GET"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
