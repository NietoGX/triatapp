import { supabase } from "./supabase";
import type { Player } from "./types";

// Get all players
export async function getAllPlayers(): Promise<Player[]> {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .order("name");

  if (error) {
    console.error("Error fetching players:", error);
    throw error;
  }

  return data || [];
}

// Get a player by ID
export async function getPlayerById(id: string): Promise<Player | null> {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching player:", error);
    return null;
  }

  return data;
}

// Create a new player
export async function createPlayer(
  player: Omit<Player, "id" | "created_at" | "updated_at">
): Promise<Player | null> {
  const { data, error } = await supabase
    .from("players")
    .insert([player])
    .select()
    .single();

  if (error) {
    console.error("Error creating player:", error);
    throw error;
  }

  return data;
}

// Update a player
export async function updatePlayer(
  id: string,
  updates: Partial<Omit<Player, "id" | "created_at" | "updated_at">>
): Promise<Player | null> {
  const { data, error } = await supabase
    .from("players")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating player:", error);
    throw error;
  }

  return data;
}

// Delete a player
export async function deletePlayer(id: string): Promise<boolean> {
  const { error } = await supabase.from("players").delete().eq("id", id);

  if (error) {
    console.error("Error deleting player:", error);
    return false;
  }

  return true;
}

// Initialize players with sample data
export async function initializeSamplePlayers(): Promise<void> {
  const samplePlayers = [
    {
      name: "Alejandro Rubert",
      nickname: "Rubert",
      position: "ST",
      number: 9,
      rating: 80,
    },
    {
      name: "David Nieto",
      nickname: "NietakO",
      position: "GK",
      number: 1,
      rating: 80,
    },
    {
      name: "Eloy Ramon",
      nickname: "Eloy",
      position: "CR",
      number: 2,
      rating: 80,
    },
    {
      name: "Borja Monzonis",
      nickname: "Casper",
      position: "ST",
      number: 10,
      rating: 80,
    },
    {
      name: "Dani Gil",
      nickname: "Gilito",
      position: "MR",
      number: 8,
      rating: 80,
    },
    {
      name: "Sergi Campos",
      nickname: "Sergi",
      position: "ML",
      number: 7,
      rating: 80,
    },
    {
      name: "Lluis Miravet",
      nickname: "Lluismi",
      position: "ML",
      number: 11,
      rating: 80,
    },
    {
      name: "Alex Seglar",
      nickname: "Seru",
      position: "CL",
      number: 4,
      rating: 80,
    },
    {
      name: "Jordan",
      nickname: "Jordan",
      position: "MR",
      number: 6,
      rating: 80,
    },
    {
      name: "Albert",
      nickname: "CRFAN",
      position: "CL",
      number: 5,
      rating: 80,
    },
    { name: "Jordi", nickname: "Jordi", position: "CR", number: 3, rating: 80 },
    {
      name: "Serrano",
      nickname: "Serrano",
      position: "GK",
      number: 13,
      rating: 80,
    },
    {
      name: "Lluis Porta",
      nickname: "Porta",
      position: "ML",
      number: 14,
      rating: 80,
    },
    {
      name: "Carlos Font",
      nickname: "Carlitros",
      position: "ST",
      number: 11,
      rating: 80,
    },
  ];

  try {
    // Check if players already exist
    const { count } = await supabase
      .from("players")
      .select("*", { count: "exact", head: true });

    if (count === 0) {
      // No players, insert sample data
      const { error } = await supabase.from("players").insert(samplePlayers);

      if (error) {
        console.error("Error initializing sample players:", error);
        throw error;
      }

      console.log("Sample players initialized successfully");
    } else {
      // Players exist, delete them all and re-insert
      const { error: deleteError } = await supabase
        .from("players")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // A non-existent ID to match all records

      if (deleteError) {
        console.error("Error deleting existing players:", deleteError);
        throw deleteError;
      }

      // Insert the new players
      const { error: insertError } = await supabase
        .from("players")
        .insert(samplePlayers);

      if (insertError) {
        console.error("Error initializing sample players:", insertError);
        throw insertError;
      }

      console.log("Players reset and initialized successfully");
    }
  } catch (error) {
    console.error("Error in initialization process:", error);
    throw error;
  }
}
