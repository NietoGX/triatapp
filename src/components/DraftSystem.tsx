import { useState, useEffect, useCallback } from "react";
import { draftApi } from "@/lib/api";
import { AppPlayer, Team } from "@/types";
import { DraftHistoryItem, DraftState } from "@/lib/database/types";
import { lineupApi } from "@/lib/api";

type DraftSystemProps = {
  availablePlayers: AppPlayer[];
  teams: { [key: string]: Team };
  matchId: string;
  onPlayerPicked: (playerId: string, teamId: string) => void;
  onTeamsReset?: () => Promise<void>;
  onDraftStateChange?: (state: DraftState) => void;
};

export default function DraftSystem({
  availablePlayers,
  teams,
  matchId,
  onPlayerPicked,
  onTeamsReset,
  onDraftStateChange,
}: DraftSystemProps) {
  const [draftState, setDraftState] = useState<DraftState>({
    id: "current",
    match_id: matchId,
    current_team: null,
    is_active: false,
  });

  const [draftHistory, setDraftHistory] = useState<DraftHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPickingPlayer, setIsPickingPlayer] = useState(false);
  const [lastPickTime, setLastPickTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fadeEffect, setFadeEffect] = useState(false);
  const [showTurnIndicator, setShowTurnIndicator] = useState(false);

  // Cargar el estado del triaje
  const loadDraftState = useCallback(async () => {
    try {
      setIsLoading(true);
      const state = await draftApi.getState(matchId);
      setDraftState(state);
      setIsLoading(false);
    } catch {
      setError("Error al cargar el estado del triaje");
      setIsLoading(false);
    }
  }, [matchId]);

  // Cargar el historial del triaje
  const loadDraftHistory = useCallback(async () => {
    try {
      const history = await draftApi.getHistory(matchId);
      setDraftHistory(history);
    } catch {
      setError("Error al cargar el historial del triaje");
    }
  }, [matchId]);

  // Cargar el estado inicial del triaje
  useEffect(() => {
    if (matchId) {
      loadDraftState();
      if (draftState.is_active) {
        loadDraftHistory();
      }
    }
  }, [matchId, draftState.is_active, loadDraftState, loadDraftHistory]);

  // Notificar al componente padre cuando cambia el estado del triaje
  useEffect(() => {
    if (onDraftStateChange) {
      onDraftStateChange(draftState);
    }
  }, [draftState, onDraftStateChange]);

  // Efecto de animación cuando cambia el turno
  useEffect(() => {
    if (draftState.is_active && draftState.current_team) {
      setFadeEffect(true);
      setShowTurnIndicator(true);

      const fadeTimer = setTimeout(() => {
        setFadeEffect(false);
      }, 2000);

      const indicatorTimer = setTimeout(() => {
        setShowTurnIndicator(false);
      }, 3000);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(indicatorTimer);
      };
    }
  }, [draftState.current_team, draftState.is_active]);

  // Iniciar un nuevo triaje
  const handleStartDraft = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Primero, resetear los equipos
      try {
        // Resetear alineaciones en la base de datos
        await lineupApi.reset(matchId);

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
      const result = await draftApi.start(matchId);

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
      const result = await draftApi.end(matchId);

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
    // Prevenir selecciones múltiples rápidas
    const now = Date.now();
    if (now - lastPickTime < 300) {
      return; // Ignorar clics rápidos
    }
    setLastPickTime(now);

    if (!draftState.current_team || isPickingPlayer) return;

    try {
      setIsPickingPlayer(true);
      setError(null);
      const result = await draftApi.pickPlayer(
        draftState.current_team,
        playerId,
        matchId
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

      // Añadir un pequeño retardo para prevenir dobles clicks
      setTimeout(() => {
        setIsPickingPlayer(false);
      }, 300);
    } catch {
      setError("Error al seleccionar jugador");
      setTimeout(() => {
        setIsPickingPlayer(false);
      }, 300);
    }
  };

  // Mostrar el nombre del equipo actual
  const getCurrentTeamName = () => {
    if (!draftState.current_team) return "Ninguno";
    return teams[draftState.current_team]?.name || draftState.current_team;
  };

  return (
    <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 mb-6 border border-white/10 shadow-lg relative">
      {showTurnIndicator && draftState.is_active && draftState.current_team && (
        <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-blue-600/80 backdrop-blur-md p-6 rounded-xl shadow-lg border border-blue-400 animate-bounce-in">
            <div className="text-center">
              <p className="text-white text-lg">Turno de</p>
              <p className="text-white text-4xl font-bold my-2 animate-pulse">
                {getCurrentTeamName()}
              </p>
              <p className="text-blue-200 text-sm">¡Selecciona un jugador!</p>
            </div>
          </div>
        </div>
      )}

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
          <div className="mt-2">
            <p className="text-white text-sm font-medium mb-1">Turno actual:</p>
            <div
              className={`
                bg-blue-600/40 p-3 rounded-lg border border-blue-500/50 
                flex items-center justify-center relative
                ${fadeEffect ? "animate-pulse" : ""}
              `}
            >
              <div
                className={`
                absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-400/30 to-blue-400/0
                rounded-lg ${fadeEffect ? "animate-gradient-x" : "opacity-0"}
              `}
              ></div>
              <p className="text-white text-xl font-bold relative z-10">
                {getCurrentTeamName()}
              </p>
            </div>
          </div>
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl text-white font-medium">
              Jugadores Disponibles
              {isPickingPlayer && (
                <span className="ml-2 text-yellow-400 text-sm">
                  (Seleccionando jugador...)
                </span>
              )}
            </h3>
            <div
              className={`
              flex items-center bg-blue-600/30 px-3 py-1 rounded-lg
              transition-all duration-300
              ${fadeEffect ? "bg-blue-500/50 shadow-lg shadow-blue-500/20" : ""}
            `}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-blue-400 mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-white font-medium">
                Turno:{" "}
                <span
                  className={`${
                    fadeEffect ? "text-white font-bold" : "text-blue-300"
                  }`}
                >
                  {getCurrentTeamName()}
                </span>
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {availablePlayers.map((player) => {
              const isSelectable = draftState.current_team && !isPickingPlayer;
              return (
                <div
                  key={player.id}
                  onClick={() => isSelectable && handlePickPlayer(player.id)}
                  onTouchStart={(e) => {
                    if (isSelectable) {
                      e.currentTarget.style.transform = "scale(0.98)";
                      e.currentTarget.style.backgroundColor =
                        "rgba(59, 130, 246, 0.3)";
                    }
                  }}
                  onTouchMove={(e) => {
                    if (isSelectable) {
                      // Restaurar el estado normal si el dedo se mueve (para evitar selección accidental)
                      e.currentTarget.style.transform = "scale(1)";
                      e.currentTarget.style.backgroundColor = "";
                    }
                  }}
                  onTouchEnd={(e) => {
                    if (isSelectable) {
                      e.preventDefault();
                      e.currentTarget.style.transform = "scale(1)";
                      e.currentTarget.style.backgroundColor = "";
                      handlePickPlayer(player.id);
                    }
                  }}
                  onTouchCancel={(e) => {
                    if (isSelectable) {
                      e.currentTarget.style.transform = "scale(1)";
                      e.currentTarget.style.backgroundColor = "";
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Seleccionar a ${player.name}`}
                  className={`
                    p-3 rounded-lg transition-all duration-150
                    ${
                      isSelectable
                        ? "hover:bg-blue-600 active:bg-blue-700 bg-gray-700/60 cursor-pointer"
                        : "bg-gray-700/30 cursor-not-allowed"
                    }
                    ${isPickingPlayer ? "opacity-50" : ""}
                    tap-highlight-color-transparent user-select-none
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
              );
            })}
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

      <style jsx>{`
        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3) translateY(-40px);
          }
          50% {
            opacity: 1;
            transform: scale(1.05) translateY(0);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes gradientX {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        .animate-bounce-in {
          animation: bounceIn 0.6s ease-out;
        }

        .animate-gradient-x {
          background-size: 200% 100%;
          animation: gradientX 2s linear infinite;
        }

        .tap-highlight-color-transparent {
          -webkit-tap-highlight-color: transparent;
        }

        .user-select-none {
          -webkit-user-select: none;
          user-select: none;
        }
      `}</style>
    </div>
  );
}
