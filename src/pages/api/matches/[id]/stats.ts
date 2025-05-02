import { NextApiRequest, NextApiResponse } from "next";
import { getMatchStats, savePlayerMatchStats } from "@/lib/database/matchApi";

type SavePlayerStatsRequest = {
  player_id: string;
  team_id: string;
  goals?: number;
  assists?: number;
  saves?: number;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id: matchId } = req.query;

  // Validate match ID
  if (!matchId || typeof matchId !== "string") {
    return res.status(400).json({
      success: false,
      message: "Invalid match ID",
    });
  }

  try {
    // GET: Retrieve match stats
    if (req.method === "GET") {
      const result = await getMatchStats(matchId);

      if (result.success) {
        return res.status(200).json({
          success: true,
          stats: result.stats,
        });
      } else {
        return res.status(404).json({
          success: false,
          error: result.error || "Failed to retrieve match stats",
        });
      }
    }

    // POST: Save player stats for match
    else if (req.method === "POST") {
      const statsData = req.body as SavePlayerStatsRequest;

      // Validate required fields
      if (!statsData.player_id || !statsData.team_id) {
        return res.status(400).json({
          success: false,
          message: "Player ID and team ID are required",
        });
      }

      const result = await savePlayerMatchStats({
        match_id: matchId,
        player_id: statsData.player_id,
        team_id: statsData.team_id,
        goals: statsData.goals || 0,
        assists: statsData.assists || 0,
        saves: statsData.saves || 0,
      });

      if (result.success) {
        return res.status(200).json({
          success: true,
          message: "Player stats saved successfully",
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to save player stats",
        });
      }
    }

    // Method not allowed
    else {
      return res.status(405).json({
        success: false,
        message: "Method not allowed",
      });
    }
  } catch (error) {
    console.error("Error handling match stats:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}
