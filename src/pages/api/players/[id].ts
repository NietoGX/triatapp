import type { NextApiRequest, NextApiResponse } from "next";
import {
  getPlayerById,
  updatePlayer,
  deletePlayer,
} from "@/lib/database/playerApi";
import type { Player } from "@/lib/database/types";

type ErrorResponse = {
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Player | ErrorResponse>
) {
  // Get the player ID from the URL
  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Invalid player ID" });
  }

  try {
    switch (req.method) {
      case "GET":
        // Get a player by ID
        const player = await getPlayerById(id);
        if (!player) {
          return res.status(404).json({ error: "Player not found" });
        }
        return res.status(200).json(player);

      case "PUT":
        // Update a player
        const updatedPlayer = await updatePlayer(id, req.body);
        if (!updatedPlayer) {
          return res.status(404).json({ error: "Player not found" });
        }
        return res.status(200).json(updatedPlayer);

      case "DELETE":
        // Delete a player
        const success = await deletePlayer(id);
        if (!success) {
          return res.status(404).json({ error: "Player not found" });
        }
        return res.status(204).end();

      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Error in player API:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
