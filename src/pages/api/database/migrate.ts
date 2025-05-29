import type { NextApiRequest, NextApiResponse } from "next";
import { Pool } from "pg";

/**
 * API endpoint para ejecutar la migración de claves foráneas
 * POST /api/database/migrate
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL_NON_POOLING,
    ssl: true,
  });

  try {
    console.log("Iniciando migración de claves foráneas...");
    const client = await pool.connect();

    try {
      // Step 1: Add foreign key constraints for draft_history table
      try {
        await client.query(`
          ALTER TABLE draft_history
          ADD CONSTRAINT fk_draft_history_team
          FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;
        `);
        console.log("✓ Añadida foreign key para draft_history -> teams");
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        if (!errorMessage.includes("already exists")) {
          console.log(
            "⚠️ Foreign key draft_history -> teams ya existe o falló:",
            errorMessage
          );
        }
      }

      try {
        await client.query(`
          ALTER TABLE draft_history
          ADD CONSTRAINT fk_draft_history_player
          FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE;
        `);
        console.log("✓ Añadida foreign key para draft_history -> players");
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        if (!errorMessage.includes("already exists")) {
          console.log(
            "⚠️ Foreign key draft_history -> players ya existe o falló:",
            errorMessage
          );
        }
      }

      // Step 2: Add foreign key constraints for team_player_positions table
      try {
        await client.query(`
          ALTER TABLE team_player_positions
          ADD CONSTRAINT fk_team_player_positions_team
          FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;
        `);
        console.log(
          "✓ Añadida foreign key para team_player_positions -> teams"
        );
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        if (!errorMessage.includes("already exists")) {
          console.log(
            "⚠️ Foreign key team_player_positions -> teams ya existe o falló:",
            errorMessage
          );
        }
      }

      try {
        await client.query(`
          ALTER TABLE team_player_positions
          ADD CONSTRAINT fk_team_player_positions_player
          FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE;
        `);
        console.log(
          "✓ Añadida foreign key para team_player_positions -> players"
        );
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        if (!errorMessage.includes("already exists")) {
          console.log(
            "⚠️ Foreign key team_player_positions -> players ya existe o falló:",
            errorMessage
          );
        }
      }

      // Step 3: Add match_id column if it doesn't exist
      try {
        await client.query(`
          ALTER TABLE team_player_positions 
          ADD COLUMN IF NOT EXISTS match_id TEXT;
        `);
        console.log("✓ Columna match_id añadida a team_player_positions");
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.log("⚠️ Error añadiendo columna match_id:", errorMessage);
      }

      // Step 4: Add indexes
      try {
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_team_player_positions_match ON team_player_positions(match_id);
          CREATE INDEX IF NOT EXISTS idx_draft_history_team_id ON draft_history(team_id);
          CREATE INDEX IF NOT EXISTS idx_draft_history_player_id ON draft_history(player_id);
          CREATE INDEX IF NOT EXISTS idx_team_player_positions_team_id ON team_player_positions(team_id);
          CREATE INDEX IF NOT EXISTS idx_team_player_positions_player_id ON team_player_positions(player_id);
        `);
        console.log("✓ Índices creados");
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.log("⚠️ Error creando índices:", errorMessage);
      }

      console.log("Migración completada exitosamente");

      return res.status(200).json({
        success: true,
        message: "Migración de claves foráneas completada exitosamente",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error durante la migración:", error);
    return res.status(500).json({
      success: false,
      error: "Error ejecutando migración",
      details: String(error),
    });
  } finally {
    await pool.end();
  }
}
