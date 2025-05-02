import type { NextApiRequest, NextApiResponse } from "next";
import { getMatchAvailablePlayers } from "@/lib/database/matchApi";
import { supabase } from "@/lib/database/supabase";
import { Player } from "@/lib/database/types";

type ErrorResponse = {
  error: string;
  details?: unknown;
};

/**
 * API endpoint for getting available players for a match
 * GET: Returns all players available for the specified match
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Player[] | ErrorResponse>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({
      error: "Invalid match ID",
    });
  }

  try {
    // Get player IDs available for this match
    const playerIds = await getMatchAvailablePlayers(id);

    if (playerIds.length === 0) {
      // If no players are specifically available, return all players
      const { data: allPlayers, error: playersError } = await supabase
        .from("players")
        .select("*");

      if (playersError) throw playersError;
      return res.status(200).json(allPlayers || []);
    }

    // Get player details for the available players
    const { data: players, error: playersError } = await supabase
      .from("players")
      .select("*")
      .in("id", playerIds);

    if (playersError) throw playersError;

    return res.status(200).json(players || []);
  } catch (error) {
    console.error("Error fetching available players:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return res.status(500).json({
      error: "Failed to retrieve available players",
      details: errorMessage,
    });
  }
}
