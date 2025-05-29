import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/database/supabase";
import { getAllTeamIds, getTeamsForDB } from "@/lib/teams";

/**
 * API endpoint para inicializar los equipos en la base de datos
 * POST: Crea los equipos por defecto si no existen
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const teamIds = getAllTeamIds();

    // Verificar si ya existen equipos
    const { data: existingTeams, error: checkError } = await supabase
      .from("teams")
      .select("id")
      .in("id", teamIds);

    if (checkError) throw checkError;

    // Si ya existen todos los equipos, no hacer nada
    if (existingTeams && existingTeams.length === teamIds.length) {
      return res.status(200).json({
        success: true,
        message: "Los equipos ya están inicializados",
      });
    }

    // Crear los equipos por defecto
    const teamsForDB = getTeamsForDB();
    const teamsToInsert = teamsForDB.filter(
      (team) => !existingTeams?.find((existing) => existing.id === team.id)
    );

    // Insertar equipos faltantes
    if (teamsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("teams")
        .insert(teamsToInsert);

      if (insertError) throw insertError;
    }

    return res.status(200).json({
      success: true,
      message: "Equipos inicializados correctamente",
    });
  } catch (error) {
    console.error("Error al inicializar equipos:", error);
    res.status(500).json({ error: "Error al inicializar los equipos" });
  }
}
