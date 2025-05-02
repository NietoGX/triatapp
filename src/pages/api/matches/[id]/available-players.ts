import type { NextApiRequest, NextApiResponse } from "next";
import { getMatchAvailablePlayers } from "@/lib/database/matchApi";
import { Player } from "@/lib/database/types";

/**
 * API endpoint for getting available players for a match
 * GET: Get all players available for this match
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Player[] | { error: string }>
) {
  // Only allow GET method
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { id } = req.query;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Match ID is required" });
    }

    const players = await getMatchAvailablePlayers(id);
    return res.status(200).json(players);
  } catch (error) {
    console.error("Error getting match available players:", error);
    return res.status(500).json({
      error: "Failed to get available players",
    });
  }
}
