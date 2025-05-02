import type { NextApiRequest, NextApiResponse } from "next";
import { getMatchById, getMatchStats } from "@/lib/database/matchApi";
import { Match, PlayerMatchStats } from "@/lib/database/types";

type ApiResponse = {
  match: Match;
  stats: PlayerMatchStats[];
};

type ErrorResponse = {
  error: string;
};

/**
 * API endpoint para gestionar un partido específico
 * GET: Obtiene los datos de un partido y sus estadísticas
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse | ErrorResponse>
) {
  // Only allow GET requests
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Invalid match ID" });
  }

  try {
    // Get match data
    const match = await getMatchById(id);

    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    // Get match stats
    const stats = await getMatchStats(id);

    return res.status(200).json({
      match,
      stats: stats || [],
    });
  } catch (error) {
    console.error("Error retrieving match:", error);
    return res.status(500).json({
      error: "Failed to retrieve match",
    });
  }
}
