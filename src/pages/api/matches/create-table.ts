import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/database/supabase";

type TableCreateResponse = {
  success: boolean;
  message: string;
  details?: unknown;
};

/**
 * API endpoint for creating the matches table
 * POST: Creates the matches table with the correct structure
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TableCreateResponse>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // Try to drop the table if it exists (ignore errors)
    try {
      await supabase.rpc("execute_sql", {
        sql: "DROP TABLE IF EXISTS matches;",
      });
      console.log("Dropped existing matches table");
    } catch (dropError) {
      console.error("Error dropping matches table (non-fatal):", dropError);
    }

    // Create the matches table with proper schema
    const { error: createError } = await supabase.rpc("execute_sql", {
      sql: `
        CREATE TABLE matches (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          date TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `,
    });

    if (createError) {
      console.error("Error creating matches table:", createError);
      return res.status(500).json({
        success: false,
        message: "Error creating matches table",
        details: createError,
      });
    }

    // Create the player_match_stats table
    const { error: statsTableError } = await supabase.rpc("execute_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS player_match_stats (
          id TEXT PRIMARY KEY,
          match_id TEXT NOT NULL,
          player_id TEXT NOT NULL,
          team_id TEXT NOT NULL,
          goals INTEGER DEFAULT 0,
          assists INTEGER DEFAULT 0,
          saves INTEGER DEFAULT 0,
          goals_saved INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `,
    });

    if (statsTableError) {
      console.error(
        "Error creating player_match_stats table:",
        statsTableError
      );
      return res.status(500).json({
        success: false,
        message: "Error creating player_match_stats table",
        details: statsTableError,
      });
    }

    // Create indices for better performance
    try {
      await supabase.rpc("execute_sql", {
        sql: `
          CREATE INDEX IF NOT EXISTS idx_player_match_stats_match ON player_match_stats(match_id);
          CREATE INDEX IF NOT EXISTS idx_player_match_stats_player ON player_match_stats(player_id);
          CREATE INDEX IF NOT EXISTS idx_player_match_stats_team ON player_match_stats(team_id);
        `,
      });
    } catch (indexError) {
      console.warn("Error creating indices (non-fatal):", indexError);
    }

    return res.status(200).json({
      success: true,
      message: "Match tables created successfully",
    });
  } catch (error) {
    console.error("Error in create-table API:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({
      success: false,
      message: "Error creating tables",
      details: errorMessage,
    });
  }
}
