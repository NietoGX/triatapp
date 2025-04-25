import { useState, useEffect } from "react";
import { draftApi } from "@/lib/api";
import { AppPlayer, Team } from "@/types";
import { DraftHistoryItem, DraftState } from "@/lib/database/types";
import { lineupApi } from "@/lib/api";

type DraftSystemProps = {
  availablePlayers: AppPlayer[];
  teams: { [key: string]: Team };
  onPlayerPicked: (playerId: string, teamId: string) => void;
  onTeamsReset?: () => Promise<void>;
  onDraftStateChange?: (state: DraftState) => void;
};

export default function DraftSystem({
  availablePlayers,
  teams,
  onPlayerPicked,
  onTeamsReset,
  onDraftStateChange,
}: DraftSystemProps) {
  const [draftState, setDraftState] = useState<DraftState>({
    id: "current",
    current_team: null,
    is_active: false,
  });

  const [draftHistory, setDraftHistory] = useState<DraftHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar el estado inicial del triaje
  useEffect(() => {
    loadDraftState();
    if (draftState.is_active) {
      loadDraftHistory();
    }
  }, []);

  // Notificar al componente padre cuando cambia el estado del triaje
  useEffect(() => {
    if (onDraftStateChange) {
      onDraftStateChange(draftState);
    }
  }, [draftState, onDraftStateChange]);

  // Cargar el estado del triaje
  const loadDraftState = async () => {
    try {
      setIsLoading(true);
      const state = await draftApi.getState();
      setDraftState(state);
      setIsLoading(false);
    } catch {
      setError("Error al cargar el estado del triaje");
      setIsLoading(false);
    }
  };

  // Cargar el historial del triaje
  const loadDraftHistory = async () => {
    try {
      const history = await draftApi.getHistory();
      setDraftHistory(history);
    } catch {
      setError("Error al cargar el historial del triaje");
    }
  };

  // Iniciar un nuevo triaje
  const handleStartDraft = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Primero, resetear los equipos
      try {
        // Resetear alineaciones en la base de datos
        await lineupApi.reset();

        // Si existe una función para resetear equipos en el componente padre, la llamamos
        if (onTeamsReset) {
          await onTeamsReset();
        }
      } catch (resetError) {
        console.error("Error al resetear equipos:", resetError);
        setError("Error al resetear equipos");
        setIsLoading(false);
        return;
      }

      // Luego, iniciar el triaje
      const result = await draftApi.start();

      if (result.success) {
        await loadDraftState();
        setDraftHistory([]);
      } else {
        setError("Error al iniciar el triaje");
      }

      setIsLoading(false);
    } catch {
      setError("Error al iniciar el triaje");
      setIsLoading(false);
    }
  };

  // Finalizar el triaje actual
  const handleEndDraft = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await draftApi.end();

      if (result.success) {
        await loadDraftState();
      } else {
        setError("Error al finalizar el triaje");
      }

      setIsLoading(false);
    } catch {
      setError("Error al finalizar el triaje");
      setIsLoading(false);
    }
  };

  // Seleccionar un jugador en el triaje
  const handlePickPlayer = async (playerId: string) => {
    if (!draftState.current_team) return;

    try {
      setIsLoading(true);
      setError(null);
      const result = await draftApi.pickPlayer(
        draftState.current_team,
        playerId
      );

      if (result.success) {
        // Actualizar el estado y el historial
        await loadDraftState();
        await loadDraftHistory();

        // Notificar al componente padre para actualizar la UI
        onPlayerPicked(playerId, draftState.current_team);
      } else {
        setError(result.error?.message || "Error al seleccionar jugador");
      }

      setIsLoading(false);
    } catch {
      setError("Error al seleccionar jugador");
      setIsLoading(false);
    }
  };

  // Mostrar el nombre del equipo actual
  const getCurrentTeamName = () => {
    if (!draftState.current_team) return "Ninguno";
    return teams[draftState.current_team]?.name || draftState.current_team;
  };

  return (
    <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 mb-6 border border-white/10 shadow-lg">
      <h2 className="text-2xl font-semibold mb-4 text-white">
        Sistema de Triaje
      </h2>

      {error && (
        <div className="bg-red-500/80 text-white p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Estado del triaje */}
      <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
        <p className="text-white mb-2">
          <span className="font-bold">Estado:</span>{" "}
          <span
            className={draftState.is_active ? "text-green-400" : "text-red-400"}
          >
            {draftState.is_active ? "Activo" : "Inactivo"}
          </span>
        </p>
        {draftState.is_active && (
          <p className="text-white">
            <span className="font-bold">Turno:</span> {getCurrentTeamName()}
          </p>
        )}
      </div>

      {/* Controles del triaje */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={handleStartDraft}
          disabled={isLoading || draftState.is_active}
          className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Procesando..." : "Iniciar Triaje"}
        </button>

        <button
          onClick={handleEndDraft}
          disabled={isLoading || !draftState.is_active}
          className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Procesando..." : "Finalizar Triaje"}
        </button>
      </div>

      {/* Lista de jugadores disponibles para seleccionar */}
      {draftState.is_active && (
        <div>
          <h3 className="text-xl text-white font-medium mb-3">
            Jugadores Disponibles
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {availablePlayers.map((player) => (
              <div
                key={player.id}
                onClick={() => handlePickPlayer(player.id)}
                className={`
                  p-3 rounded-lg cursor-pointer transition-all duration-200
                  ${
                    draftState.current_team
                      ? "hover:bg-blue-600 bg-gray-700/60"
                      : "bg-gray-700/30 cursor-not-allowed"
                  }
                `}
              >
                <p className="text-white font-medium">{player.name}</p>
                <div className="flex justify-between text-sm">
                  <span className="text-yellow-400">⭐ {player.rating}</span>
                  <span className="text-gray-300">
                    {player.position || "Sin posición"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historial del triaje */}
      {draftState.is_active && draftHistory.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xl text-white font-medium mb-3">
            Historial de Selecciones
          </h3>
          <div className="overflow-y-auto max-h-48 bg-gray-800/50 rounded-lg p-3">
            {draftHistory.map((pick) => (
              <div key={pick.id} className="mb-2 p-2 bg-gray-700/30 rounded-lg">
                <p className="text-white">
                  <span className="font-medium">
                    {pick.teams?.name || pick.team_id}:
                  </span>{" "}
                  seleccionó a {pick.players?.name || pick.player_id}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
