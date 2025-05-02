import type { NextApiRequest, NextApiResponse } from "next";
import { createMatch } from "@/lib/database/matchApi";
import { Match } from "@/lib/database/types";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/lib/database/supabase";

type ErrorResponse = {
  error: string;
  details?: unknown;
};

/**
 * API endpoint for creating new matches
 * POST: Creates a new match with the given name and date
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Match | ErrorResponse>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { name, date, availablePlayers } = req.body;

    if (!name || !date) {
      return res.status(400).json({
        error: "Missing required fields",
        details: "Both name and date are required",
      });
    }

    if (
      !availablePlayers ||
      !Array.isArray(availablePlayers) ||
      availablePlayers.length === 0
    ) {
      return res.status(400).json({
        error: "Missing required fields",
        details: "Available players must be provided",
      });
    }

    console.log("Creating match with data:", { name, date, availablePlayers });

    // Create the match first
    const match = await createMatch({ name, date });

    if (!match) {
      return res.status(500).json({
        error: "Failed to create match",
      });
    }

    // Then save the available players for this match
    const now = new Date().toISOString();
    const availablePlayersData = availablePlayers.map((playerId) => ({
      id: uuidv4(),
      match_id: match.id,
      player_id: playerId,
      is_available: true,
      created_at: now,
      updated_at: now,
    }));

    const { error: insertError } = await supabase
      .from("match_available_players")
      .insert(availablePlayersData);

    if (insertError) {
      console.error("Error inserting available players:", insertError);
      // Return the match anyway, but log the error
      console.warn("Match created but failed to save available players");
    } else {
      console.log(
        `Successfully added ${availablePlayers.length} players to match ${match.id}`
      );
    }

    return res.status(201).json(match);
  } catch (error) {
    console.error("Error creating match:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return res.status(500).json({
      error: "Failed to create match",
      details: errorMessage,
    });
  }
}
