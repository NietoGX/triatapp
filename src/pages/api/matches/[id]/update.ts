import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/database/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;
  const { name, date } = req.body;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Match ID is required" });
  }

  if (!name || !date) {
    return res.status(400).json({ error: "Name and date are required" });
  }

  try {
    // First, check if match exists
    const { data: existingMatch, error: checkError } = await supabase
      .from("matches")
      .select("*")
      .eq("id", id)
      .single();

    if (checkError || !existingMatch) {
      return res.status(404).json({ error: "Match not found" });
    }

    // Update the match
    const { data: updatedMatch, error: updateError } = await supabase
      .from("matches")
      .update({
        name: name.trim(),
        date: date,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating match:", updateError);
      return res.status(500).json({ error: "Error updating match" });
    }

    res.status(200).json({
      success: true,
      message: "Match updated successfully",
      match: updatedMatch,
    });
  } catch (error) {
    console.error("Error in update match API:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
