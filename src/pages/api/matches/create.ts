import type { NextApiRequest, NextApiResponse } from "next";
import { createMatch } from "@/lib/database/matchApi";
import { Match } from "@/lib/database/types";

type ErrorResponse = {
  error: string;
  details?: unknown;
};

type CreateMatchRequest = {
  name: string;
  date: string;
  location?: string;
  availablePlayers: string[];
};

/**
 * API endpoint for creating a new match
 * POST: Create a new match
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
    const { name, date, availablePlayers } = req.body as CreateMatchRequest;

    if (!name || !date) {
      return res.status(400).json({
        error: "Name and date are required fields",
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

    const result = await createMatch(name, date, availablePlayers || []);

    if (result.success && result.match) {
      res.status(201).json(result.match);
    } else {
      res.status(500).json({
        error: "Failed to create match",
        details: result.error,
      });
    }
  } catch (error) {
    console.error("Error in create match API:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error,
    });
  }
}
