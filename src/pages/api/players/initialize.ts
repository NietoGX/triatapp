import type { NextApiRequest, NextApiResponse } from "next";
import { initializeSamplePlayers } from "@/lib/database/playerApi";

type ApiResponse = {
  success: boolean;
  message: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed, use POST",
    });
  }

  try {
    await initializeSamplePlayers();
    return res.status(200).json({
      success: true,
      message: "Sample players initialized successfully",
    });
  } catch (error) {
    console.error("Error initializing players:", error);
    return res.status(500).json({
      success: false,
      message: "Error initializing players",
    });
  }
}
