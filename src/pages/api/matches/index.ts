import type { NextApiRequest, NextApiResponse } from "next";
import { getAllMatches, createMatch } from "@/lib/database/matchApi";
import { Match } from "@/lib/database/types";

type ErrorResponse = {
  error: string;
  details?: unknown;
};

/**
 * API endpoint para gestionar los partidos
 * GET: Obtiene todos los partidos
 * POST: Crea un nuevo partido
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Match[] | Match | ErrorResponse>
) {
  try {
    switch (req.method) {
      case "GET":
        // Get all matches
        const matches = await getAllMatches();
        return res.status(200).json(matches);

      case "POST":
        // Log the incoming request body
        console.log(
          "Match creation request body:",
          JSON.stringify(req.body, null, 2)
        );

        if (!req.body || !req.body.name || !req.body.date) {
          console.error("Invalid match data:", req.body);
          return res.status(400).json({
            error: "Datos de partido inválidos",
            details: "Se requieren los campos 'name' y 'date'",
          });
        }

        // Create a new match
        try {
          const newMatch = await createMatch(req.body);
          if (!newMatch) {
            console.error("Match creation returned null");
            return res.status(500).json({ error: "Error al crear el partido" });
          }
          console.log("Match created successfully:", newMatch);
          return res.status(201).json(newMatch);
        } catch (createError) {
          console.error("Error specific to match creation:", createError);
          const errorMessage =
            createError instanceof Error
              ? createError.message
              : "Error desconocido al crear el partido";
          return res.status(500).json({
            error: "Error al crear el partido",
            details: errorMessage,
          });
        }

      default:
        return res.status(405).json({ error: "Método no permitido" });
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";
    console.error("Error general en API de partidos:", error);
    return res.status(500).json({
      error: "Error interno del servidor",
      details: errorMessage,
    });
  }
}
