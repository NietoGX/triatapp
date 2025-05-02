import type { NextApiRequest, NextApiResponse } from "next";
import { updateMatchStatus } from "@/lib/database/matchApi";
import { MatchStatus } from "@/lib/database/types";

type UpdateStatusRequest = {
  status: MatchStatus;
};

/**
 * API endpoint for updating a match's status
 * PUT: Update match status
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow PUT method
  if (req.method !== "PUT") {
    res.setHeader("Allow", ["PUT"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { id } = req.query;

    if (!id || typeof id !== "string") {
      return res.status(400).json({
        success: false,
        error: "Match ID is required",
      });
    }

    const { status } = req.body as UpdateStatusRequest;

    if (!status || (status !== "PENDING" && status !== "FINISHED")) {
      return res.status(400).json({
        success: false,
        error: "Valid status (PENDING or FINISHED) is required",
      });
    }

    const result = await updateMatchStatus(id, status);

    if (result.success) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(500).json({
        success: false,
        error: "Failed to update match status",
        details: result.error,
      });
    }
  } catch (error) {
    console.error("Error in API update match status:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error,
    });
  }
}
