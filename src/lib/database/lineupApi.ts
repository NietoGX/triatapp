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
  positionOrder: number = 0,
  matchId?: string
) {
  try {
    console.log("Checking existing position for:", {
      teamId,
      playerId,
      matchId,
    });

    // Convert playerId to string if it's not already
    const playerIdStr = String(playerId);

    // Buscar primero si ya existe una entrada para este jugador y equipo
    const { data: existingData, error: selectError } = await supabase
      .from("team_player_positions")
      .select("id")
      .eq("team_id", teamId)
      .eq("player_id", playerIdStr)
      .eq(matchId ? "match_id" : "match_id", matchId || null);

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
        matchId,
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
          match_id: matchId || null,
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
export async function removePlayerFromTeam(
  teamId: string,
  playerId: string,
  matchId?: string
) {
  try {
    // Build query based on whether matchId is provided
    let query = supabase
      .from("team_player_positions")
      .delete()
      .eq("team_id", teamId)
      .eq("player_id", playerId);

    // Add match_id filter if provided, otherwise filter for null match_id
    if (matchId) {
      query = query.eq("match_id", matchId);
    } else {
      query = query.is("match_id", null);
    }

    const { error } = await query;

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
export async function loadTeamLineups(matchId?: string): Promise<TeamLineup> {
  try {
    // 1. Obtener todas las asignaciones de jugadores a equipos
    let query = supabase
      .from("team_player_positions")
      .select("*")
      .order("position_order");

    // Filter by match_id if provided, otherwise get general positions (null match_id)
    if (matchId) {
      query = query.eq("match_id", matchId);
    } else {
      query = query.is("match_id", null);
    }

    const { data: positionsData, error: positionsError } = await query;

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
        id: "Equipo A",
        name: "Equipo A",
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
        id: "Equipo B",
        name: "Equipo B",
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
 * Elimina todas las posiciones de jugadores en equipos
 */
export async function clearTeamLineups(matchId?: string) {
  try {
    // Build query based on whether matchId is provided
    let query = supabase.from("team_player_positions").delete();

    if (matchId) {
      // Delete only match-specific positions
      query = query.eq("match_id", matchId);
    } else {
      // Delete only general positions (null match_id)
      query = query.is("match_id", null);
    }

    const { error } = await query;

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Error al limpiar alineaciones:", error);
    return { success: false, error };
  }
}

/**
 * Create a match lineup entry to track match-specific lineups
 */
export async function createMatchLineup(matchId: string, teamId: string) {
  try {
    const { data, error } = await supabase
      .from("match_lineups")
      .insert({
        id: uuidv4(),
        match_id: matchId,
        team_id: teamId,
        is_active: true,
      })
      .select("*")
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error("Error al crear alineación para el partido:", error);
    return { success: false, error };
  }
}

/**
 * Get all match lineups for a specific match
 */
export async function getMatchLineups(matchId: string) {
  try {
    const { data, error } = await supabase
      .from("match_lineups")
      .select("*")
      .eq("match_id", matchId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error al obtener alineaciones del partido:", error);
    return [];
  }
}
