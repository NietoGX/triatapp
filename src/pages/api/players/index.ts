import type { NextApiRequest, NextApiResponse } from "next";
import { getAllPlayers, createPlayer } from "@/lib/database/playerApi";
import type { Player } from "@/lib/database/types";

type ErrorResponse = {
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Player[] | Player | ErrorResponse>
) {
  try {
    switch (req.method) {
      case "GET":
        // Get all players
        const players = await getAllPlayers();
        return res.status(200).json(players);

      case "POST":
        // Create a new player
        const newPlayer = await createPlayer(req.body);
        return res.status(201).json(newPlayer);

      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Error in players API:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
