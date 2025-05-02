import { supabase } from "./supabase";
import { v4 as uuidv4 } from "uuid";
import { Player, PlayerPosition, TeamLineup } from "./types";

/**
 * Guarda la asignación de un jugador a una posición en un equipo
 */
export async function savePlayerPosition(
  teamId: string,
  playerId: string,
  position: PlayerPosition,
  positionOrder: number = 0
) {
  try {
    console.log("Checking existing position for:", { teamId, playerId });

    // Convert playerId to string if it's not already
    const playerIdStr = String(playerId);

    // Buscar primero si ya existe una entrada para este jugador y equipo
    const { data: existingData, error: selectError } = await supabase
      .from("team_player_positions")
      .select("id")
      .eq("team_id", teamId)
      .eq("player_id", playerIdStr);

    if (selectError) {
      console.error("Error checking existing position:", selectError);
      throw selectError;
    }

    // If we have data and it contains at least one row
    if (existingData && existingData.length > 0) {
      console.log("Updating existing position:", existingData[0].id);
      // Actualizar la posición existente
      const { error: updateError } = await supabase
        .from("team_player_positions")
        .update({
          position,
          position_order: positionOrder,
        })
        .eq("id", existingData[0].id);

      if (updateError) {
        console.error("Error updating position:", updateError);
        throw updateError;
      }
    } else {
      console.log("Creating new position with data:", {
        teamId,
        playerId: playerIdStr,
        position,
        positionOrder,
      });
      // Crear una nueva asignación
      const { error: insertError } = await supabase
        .from("team_player_positions")
        .insert({
          id: uuidv4(),
          team_id: teamId,
          player_id: playerIdStr,
          position,
          position_order: positionOrder,
        });

      if (insertError) {
        console.error("Error inserting position:", insertError);
        throw insertError;
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error al guardar la posición del jugador:", error);
    return { success: false, error };
  }
}

/**
 * Elimina la asignación de un jugador de un equipo
 */
export async function removePlayerFromTeam(teamId: string, playerId: string) {
  try {
    const { error } = await supabase
      .from("team_player_positions")
      .delete()
      .eq("team_id", teamId)
      .eq("player_id", playerId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Error al eliminar al jugador del equipo:", error);
    return { success: false, error };
  }
}

/**
 * Carga las alineaciones de todos los equipos
 */
export async function loadTeamLineups(): Promise<TeamLineup> {
  try {
    // 1. Obtener todas las asignaciones de jugadores a equipos
    const { data: positionsData, error: positionsError } = await supabase
      .from("team_player_positions")
      .select("*")
      .order("position_order");

    if (positionsError) throw positionsError;

    // 2. Obtener todos los jugadores para tener su información completa
    const { data: playersData, error: playersError } = await supabase
      .from("players")
      .select("*");

    if (playersError) throw playersError;

    // 3. Obtener información de los equipos
    const { data: teamsData, error: teamsError } = await supabase
      .from("teams")
      .select("*");

    if (teamsError) throw teamsError;

    // Crear un mapa de jugadores por ID para fácil acceso
    const playersMap: Record<string, Player> = {};
    playersData.forEach((player) => {
      playersMap[player.id] = player;
    });

    // Crear el objeto de alineaciones
    const teamLineup: TeamLineup = {};

    // Inicializar equipos con estructura vacía
    teamsData.forEach((team) => {
      teamLineup[team.id] = {
        id: team.id,
        name: team.name,
        players: {
          GK: [],
          CL: [],
          CR: [],
          ML: [],
          MR: [],
          ST: [],
          SUB: [],
        },
      };
    });

    // Llenar las posiciones con los jugadores
    positionsData.forEach((position) => {
      const player = playersMap[position.player_id];
      if (player && teamLineup[position.team_id]) {
        const teamPosition = position.position as PlayerPosition;

        // Asegurarse de que la posición existe en el equipo
        if (!teamLineup[position.team_id].players[teamPosition]) {
          teamLineup[position.team_id].players[teamPosition] = [];
        }

        // Añadir el jugador a la posición
        teamLineup[position.team_id].players[teamPosition].push({
          id: player.id,
          name: player.name,
          rating: player.rating,
          position: player.position as PlayerPosition | null,
          team: position.team_id as "borjas" | "nietos",
          stats: {
            goals: player.goals,
            assists: player.assists,
            saves: player.saves,
            goalsSaved: player.goals_saved,
          },
          number: player.number || undefined,
          nickname: player.nickname || undefined,
        });
      }
    });

    return teamLineup;
  } catch (error) {
    console.error("Error al cargar las alineaciones:", error);
    return {
      borjas: {
        id: "borjas",
        name: "Casper",
        players: {
          GK: [],
          CL: [],
          CR: [],
          ML: [],
          MR: [],
          ST: [],
          SUB: [],
        },
      },
      nietos: {
        id: "nietos",
        name: "NietakO",
        players: {
          GK: [],
          CL: [],
          CR: [],
          ML: [],
          MR: [],
          ST: [],
          SUB: [],
        },
      },
    };
  }
}

/**
 * Limpia todas las asignaciones de jugadores a equipos
 */
export async function clearTeamLineups() {
  try {
    const { error } = await supabase
      .from("team_player_positions")
      .delete()
      .neq("id", "placeholder");
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error al limpiar las alineaciones:", error);
    return { success: false, error };
  }
}
