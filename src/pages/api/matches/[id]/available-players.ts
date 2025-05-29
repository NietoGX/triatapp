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

  // Set no-cache headers to prevent stale data during draft
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  try {
    const { id, t } = req.query;
    console.log(
      `[API] Getting available players for match ${id}, timestamp: ${t}`
    );

    if (!id || typeof id !== "string") {
      console.error("[API] Match ID is required");
      return res.status(400).json({ error: "Match ID is required" });
    }

    const players = await getMatchAvailablePlayers(id);
    console.log(
      `[API] Returning ${players.length} available players for match ${id}`
    );
    return res.status(200).json(players);
  } catch (error) {
    console.error(
      `[API] Error getting match available players for ${req.query.id}:`,
      error
    );
    return res.status(500).json({
      error: "Failed to get available players",
    });
  }
}
