import { supabase } from "./supabase";
import { v4 as uuidv4 } from "uuid";

/**
 * Inicia un nuevo triaje, seleccionando aleatoriamente el equipo que empieza
 */
export async function startDraft() {
  try {
    // Obtener los equipos disponibles
    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("id");

    if (teamsError) throw teamsError;
    if (!teams || teams.length < 2) {
      throw new Error("Se necesitan al menos dos equipos para el triaje");
    }

    // Seleccionar aleatoriamente un equipo para comenzar
    const randomIndex = Math.floor(Math.random() * teams.length);
    const startingTeam = teams[randomIndex].id;

    // Actualizar o crear el estado del triaje
    const { error } = await supabase.from("draft_state").upsert(
      {
        id: "current",
        current_team: startingTeam,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (error) throw error;

    // Eliminar historial de triaje anterior
    const { error: clearError } = await supabase
      .from("draft_history")
      .delete()
      .neq("id", "placeholder");

    if (clearError) throw clearError;

    return { success: true, startingTeam };
  } catch (error) {
    console.error("Error al iniciar el triaje:", error);
    return { success: false, error };
  }
}

/**
 * Termina el triaje activo
 */
export async function endDraft() {
  try {
    const { error } = await supabase
      .from("draft_state")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", "current");

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Error al finalizar el triaje:", error);
    return { success: false, error };
  }
}

/**
 * Obtiene el estado actual del triaje
 */
export async function getDraftState() {
  try {
    const { data, error } = await supabase
      .from("draft_state")
      .select("*")
      .eq("id", "current")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No existe el estado, se creará uno por defecto
      } else {
        throw error;
      }
    }

    // Si no existe, crear un estado inicial inactivo
    if (!data) {
      return {
        id: "current",
        current_team: null,
        is_active: false,
      };
    }

    return data;
  } catch (error) {
    console.error("Error al obtener el estado del triaje:", error);
    return { id: "current", current_team: null, is_active: false };
  }
}

/**
 * Registra la selección de un jugador en el triaje
 */
export async function pickPlayer(teamId: string, playerId: string) {
  try {
    // Verificar el estado actual del triaje
    const draftState = await getDraftState();

    if (!draftState.is_active) {
      throw new Error("No hay un triaje activo");
    }

    if (draftState.current_team !== teamId) {
      throw new Error("No es el turno de este equipo");
    }

    // Obtener el último orden de selección
    const { data: lastPick, error: lastError } = await supabase
      .from("draft_history")
      .select("pick_order")
      .order("pick_order", { ascending: false })
      .limit(1);

    if (lastError) throw lastError;

    const pickOrder =
      lastPick && lastPick.length > 0 ? lastPick[0].pick_order + 1 : 1;

    // Registrar la selección
    const { error: pickError } = await supabase.from("draft_history").insert({
      id: uuidv4(),
      team_id: teamId,
      player_id: playerId,
      pick_order: pickOrder,
    });

    if (pickError) throw pickError;

    // Determinar el próximo equipo
    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("id")
      .neq("id", teamId);

    if (teamsError) throw teamsError;
    if (!teams || teams.length === 0) {
      throw new Error("No se encontraron equipos alternos");
    }

    // Cambiar al siguiente equipo
    const nextTeam = teams[0].id;
    const { error: updateError } = await supabase
      .from("draft_state")
      .update({
        current_team: nextTeam,
        updated_at: new Date().toISOString(),
      })
      .eq("id", "current");

    if (updateError) throw updateError;

    return { success: true, nextTeam };
  } catch (error) {
    console.error("Error al seleccionar jugador:", error);
    return { success: false, error };
  }
}

/**
 * Obtiene el historial del triaje actual
 */
export async function getDraftHistory() {
  try {
    const { data, error } = await supabase
      .from("draft_history")
      .select(
        `
        id,
        team_id,
        player_id,
        pick_order,
        created_at,
        teams(name),
        players(name)
      `
      )
      .order("pick_order");

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error("Error al obtener el historial del triaje:", error);
    return [];
  }
}
