import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import { isMobile } from "react-device-detect";

import AvailablePlayers from "@/components/AvailablePlayers";
import TeamContainer from "@/components/TeamContainer";
import DraftSystem from "@/components/DraftSystem";
import { AppPlayer, PlayerPosition, Team } from "@/types";
import { matchApi, lineupApi } from "@/lib/api";
import { Match, DraftState } from "@/lib/database/types";
import { createDefaultTeams, getAllTeamIds } from "@/lib/teams";
import { draftApi } from "@/lib/api";

// SVG Icons
const CalendarIcon = () => (
  <svg
    className="w-8 h-8"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const ClockIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 19l-7-7m0 0l7-7m-7 7h18"
    />
  </svg>
);

const PlayIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10v1m6-1v1m0 0l1 1m-1-1l-1 1m-5-1l1 1m-1-1l-1 1"
    />
  </svg>
);

const DraftIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
    />
  </svg>
);

const EyeOffIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L12 12m-3-3l6.364 6.364M21 21l-6.364-6.364m0 0L12 12m-3-3l6.364 6.364"
    />
  </svg>
);

const RefreshIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);

const AlertIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

export default function MatchDetailPage() {
  const router = useRouter();
  const { id: matchId } = router.query;

  // Match state
  const [match, setMatch] = useState<Match | null>(null);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isMobileView, setIsMobileView] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [showDraftSystem, setShowDraftSystem] = useState(false);
  const [isDraftActive, setIsDraftActive] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [currentDraftState, setCurrentDraftState] = useState<DraftState | null>(
    null
  );

  // Players and teams state
  const [availablePlayers, setAvailablePlayers] = useState<AppPlayer[]>([]);
  const [teams, setTeams] = useState<{ [key: string]: Team }>(
    createDefaultTeams()
  );

  useEffect(() => {
    setIsClient(true);
    setIsMobileView(isMobile);
  }, []);

  useEffect(() => {
    async function loadMatch() {
      if (!matchId || typeof matchId !== "string") return;

      try {
        setIsLoading(true);
        // Load match data
        const data = await matchApi.getById(matchId);
        setMatch(data.match);

        // Load only available players for this match (already filtered by draft history)
        const availablePlayers = await matchApi.getAvailablePlayers(matchId);

        // Map players to app format
        const appPlayers: AppPlayer[] = availablePlayers.map((p) => ({
          id: p.id,
          name: p.name,
          rating: p.rating,
          position: p.position as PlayerPosition | null,
          team: null,
          stats: {
            goals: p.goals,
            assists: p.assists,
            saves: p.saves,
            goalsSaved: p.goals_saved,
          },
          number: p.number || undefined,
          nickname: p.nickname || undefined,
        }));

        // Load match-specific lineups
        try {
          const lineups = await lineupApi.getAll(matchId);

          if (lineups && Object.keys(lineups).length > 0) {
            setTeams(lineups);

            // Filter out players already assigned to teams from the available players
            const assignedPlayerIds = new Set<string>();

            Object.values(lineups).forEach((team) => {
              Object.values(team.players).forEach((positionPlayers) => {
                positionPlayers.forEach((player) => {
                  assignedPlayerIds.add(player.id);
                });
              });
            });

            // Use the pre-filtered players from the API and further filter by lineup assignments
            setAvailablePlayers(
              appPlayers.filter((player) => !assignedPlayerIds.has(player.id))
            );
          } else {
            // If no lineups exist for this match, use the already filtered available players
            setAvailablePlayers(appPlayers);
          }
        } catch (error) {
          console.error("Error loading match lineups:", error);
          // Even if lineups fail to load, use the filtered available players
          setAvailablePlayers(appPlayers);
        }

        setIsLoading(false);
      } catch (err) {
        console.error("Error loading match:", err);
        setError("Error al cargar los datos del partido");
        setIsLoading(false);
      }
    }

    // Wait for router to be ready and have the matchId before loading
    if (isClient && matchId && router.isReady) {
      loadMatch();
    }
  }, [isClient, matchId, router.isReady]);

  // Load draft state independently of DraftSystem visibility
  const loadDraftState = async () => {
    if (!matchId || typeof matchId !== "string") return;

    try {
      const state = await draftApi.getState(matchId);
      setIsDraftActive(state.is_active);
      setCurrentDraftState(state);
    } catch (error) {
      console.error("Error loading draft state:", error);
    }
  };

  // Load draft state on mount and set up polling
  useEffect(() => {
    if (isClient && matchId && router.isReady) {
      loadDraftState();

      // Poll every 10 seconds to check for draft state changes
      const pollInterval = setInterval(loadDraftState, 10000);

      return () => clearInterval(pollInterval);
    }
  }, [isClient, matchId, router.isReady]);

  // Function to reset everything for this match
  const handleResetAll = async () => {
    if (isDraftActive) {
      alert(
        "No se puede reiniciar durante un triaje activo. Finaliza el triaje primero."
      );
      return;
    }

    const confirmReset = confirm(
      "¿Estás seguro de que quieres reiniciar completamente este partido?\n\n" +
        "Esto eliminará:\n" +
        "• Todas las alineaciones de equipos\n" +
        "• Todo el historial de triaje\n" +
        "• Cualquier estado de draft activo\n\n" +
        "Esta acción no se puede deshacer."
    );

    if (!confirmReset) return;

    try {
      setIsResetting(true);
      setError("");

      if (typeof matchId === "string") {
        // Call the reset API
        await matchApi.resetAll(matchId);

        // Reset local state
        setTeams(createDefaultTeams());
        setIsDraftActive(false);

        // Reload available players
        const availablePlayers = await matchApi.getAvailablePlayers(matchId);
        const appPlayers: AppPlayer[] = availablePlayers.map((p) => ({
          id: p.id,
          name: p.name,
          rating: p.rating,
          position: p.position as PlayerPosition | null,
          team: null,
          stats: {
            goals: p.goals,
            assists: p.assists,
            saves: p.saves,
            goalsSaved: p.goals_saved,
          },
          number: p.number || undefined,
          nickname: p.nickname || undefined,
        }));
        setAvailablePlayers(appPlayers);

        alert("¡Partido reiniciado completamente con éxito!");
      }
    } catch (error) {
      console.error("Error resetting match:", error);
      setError("Error al reiniciar el partido");
      alert("Error al reiniciar el partido. Inténtalo de nuevo.");
    } finally {
      setIsResetting(false);
    }
  };

  // Function to determine the best position for a player in a team
  const getBestPositionForPlayer = (
    player: AppPlayer,
    team: Team
  ): PlayerPosition => {
    // Check player's preferred position first
    if (player.position) {
      // Check if the preferred position is available (not full)
      const currentInPosition = team.players[player.position].length;
      const maxInPosition =
        player.position === "GK" ? 1 : player.position === "SUB" ? 3 : 2;

      if (currentInPosition < maxInPosition) {
        return player.position;
      }
    }

    // If preferred position is full or player has no position, find the best available spot
    const positionPriority: PlayerPosition[] = [
      "GK",
      "CL",
      "CR",
      "ML",
      "MR",
      "ST",
      "SUB",
    ];

    for (const position of positionPriority) {
      const currentInPosition = team.players[position].length;
      const maxInPosition = position === "GK" ? 1 : position === "SUB" ? 3 : 2;

      if (currentInPosition < maxInPosition) {
        return position;
      }
    }

    // If all positions are full, default to SUB
    return "SUB";
  };

  // Handle when a player is picked in the draft
  const handlePlayerPicked = async (playerId: string, teamId: string) => {
    console.log("[MATCH] 🎯 Player picked in draft:", { playerId, teamId });

    try {
      // Find the player in available players
      const player = availablePlayers.find((p) => p.id === playerId);
      if (!player) {
        console.error(
          "[MATCH] ❌ Player not found in available players:",
          playerId
        );
        return;
      }

      console.log("[MATCH] 👤 Found player:", {
        name: player.name,
        preferredPosition: player.position,
      });

      // Determine the best position for this player in the team
      const targetTeam = teams[teamId];
      if (!targetTeam) {
        console.error("[MATCH] ❌ Team not found:", teamId);
        return;
      }

      const position = getBestPositionForPlayer(player, targetTeam);
      console.log("[MATCH] 📍 Assigning player to position:", {
        player: player.name,
        team: targetTeam.name,
        position,
      });

      // Save the player position to the database
      if (typeof matchId === "string") {
        await lineupApi.savePosition(teamId, playerId, position, 0, matchId);
        console.log("[MATCH] 💾 Player position saved to database");
      }

      // Update local state: remove from available players
      setAvailablePlayers((prev) => {
        const newAvailable = prev.filter((p) => p.id !== playerId);
        console.log(
          "[MATCH] 📤 Player removed from available. Remaining:",
          newAvailable.length
        );
        return newAvailable;
      });

      // Update local state: add to team
      setTeams((prev) => {
        const newTeams = { ...prev };
        const playerWithTeam: AppPlayer = {
          ...player,
          team: teamId,
        };

        newTeams[teamId] = {
          ...newTeams[teamId],
          players: {
            ...newTeams[teamId].players,
            [position]: [...newTeams[teamId].players[position], playerWithTeam],
          },
        };

        console.log("[MATCH] 📥 Player added to team:", {
          team: newTeams[teamId].name,
          position,
          playersInPosition: newTeams[teamId].players[position].length,
        });

        return newTeams;
      });

      console.log("[MATCH] ✅ Player successfully moved to team!");
    } catch (error) {
      console.error("[MATCH] ❌ Error handling player pick:", error);
    }
  };

  // Update draft system state
  const handleDraftStateChange = (newState: DraftState) => {
    setIsDraftActive(newState.is_active);
    setCurrentDraftState(newState);
  };

  const getCurrentTeamName = () => {
    if (!currentDraftState?.current_team) return "Ninguno";
    return (
      teams[currentDraftState.current_team]?.name ||
      currentDraftState.current_team
    );
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", options);
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-stone-800 to-stone-900">
        <div className="container mx-auto py-6 px-4">
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500 mb-4"></div>
            <p className="text-gray-300">Cargando partido...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !match) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-stone-800 to-stone-900">
        <div className="container mx-auto py-6 px-4">
          <div className="flex flex-col items-center justify-center h-64">
            <div className="card-glass p-8 text-center max-w-md">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-red-600/20 rounded-xl">
                  <AlertIcon />
                </div>
              </div>
              <h2 className="text-xl font-bold text-white mb-4">Error</h2>
              <p className="text-gray-300 mb-6">
                {error || "No se ha podido cargar el partido"}
              </p>
              <Link href="/" className="btn-primary">
                <ArrowLeftIcon />
                Volver al inicio
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>{match.name} | TriatApp</title>
        <meta
          name="description"
          content={`Detalles y alineaciones del partido: ${match.name}`}
        />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-stone-800 to-stone-900">
        <div className="container mx-auto py-6 px-4">
          {/* Enhanced Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-green-600/20 rounded-xl">
                  <CalendarIcon />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white text-shadow-lg">
                    {match.name}
                  </h1>
                  <div className="flex items-center gap-2 text-gray-300 mt-2">
                    <ClockIcon />
                    <span className="text-lg">{formatDate(match.date)}</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-300">
                Gestiona las alineaciones y el triaje para este partido
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Link href="/" className="btn-primary">
                <ArrowLeftIcon />
                Volver al Inicio
              </Link>

              <button
                onClick={() => setShowDraftSystem(!showDraftSystem)}
                className={`btn ${
                  isDraftActive
                    ? showDraftSystem
                      ? "btn-secondary" // Activo y abierto
                      : "btn-success" // Activo y cerrado
                    : showDraftSystem
                    ? "btn-secondary" // Inactivo y abierto
                    : "btn-primary" // Inactivo y cerrado
                }`}
              >
                {showDraftSystem ? (
                  <>
                    <EyeOffIcon />
                    Cerrar Triaje
                  </>
                ) : (
                  <>
                    <DraftIcon />
                    Abrir Triaje
                  </>
                )}
              </button>

              <button
                onClick={handleResetAll}
                className="btn-danger"
                disabled={isResetting}
              >
                {isResetting ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent"></div>
                    Reiniciando...
                  </>
                ) : (
                  <>
                    <RefreshIcon />
                    Reiniciar Partido
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Draft Active Banner */}
          {isDraftActive && (
            <div
              className="bg-gradient-to-r from-green-600/20 to-green-500/20 border border-green-500/30 rounded-xl p-6 mb-8 animate-pulse cursor-pointer hover:from-green-600/30 hover:to-green-500/30 transition-all duration-300"
              onClick={() => setShowDraftSystem(true)}
              title="Click para abrir el sistema de triaje"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-600/30 rounded-xl">
                    <DraftIcon />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-green-300 mb-1">
                      🟢 Triaje Activo
                    </h3>
                    <p className="text-green-200">
                      {currentDraftState?.current_team ? (
                        <>
                          Turno de{" "}
                          <span className="font-bold text-white">
                            {getCurrentTeamName()}
                          </span>{" "}
                          - Esperando selección...
                        </>
                      ) : (
                        "El sistema de triaje está en curso. Los jugadores se asignan automáticamente."
                      )}
                    </p>
                    <p className="text-green-300 text-sm mt-1 font-medium">
                      👆 Click aquí para abrir el triaje
                    </p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-green-300 text-sm font-medium">
                      {currentDraftState?.current_team
                        ? "Esperando..."
                        : "Activo"}
                    </div>
                    <div className="text-green-200 text-xs">
                      Auto-actualización cada 10s
                    </div>
                  </div>
                  <div className="w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-6 animate-slide-in">
              <div className="flex items-center gap-2">
                <AlertIcon />
                {error}
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="space-y-8">
            {showDraftSystem && matchId && typeof matchId === "string" && (
              <div className="mb-8">
                <DraftSystem
                  availablePlayers={availablePlayers}
                  teams={teams}
                  matchId={matchId}
                  onDraftStateChange={handleDraftStateChange}
                  onPlayerPicked={handlePlayerPicked}
                  onTeamsReset={async () => {
                    setTeams(createDefaultTeams());
                    // Reload all players
                    try {
                      if (typeof matchId === "string") {
                        const availablePlayers =
                          await matchApi.getAvailablePlayers(matchId);
                        const appPlayers: AppPlayer[] = availablePlayers.map(
                          (p) => ({
                            id: p.id,
                            name: p.name,
                            rating: p.rating,
                            position: p.position as PlayerPosition | null,
                            team: null,
                            stats: {
                              goals: p.goals,
                              assists: p.assists,
                              saves: p.saves,
                              goalsSaved: p.goals_saved,
                            },
                            number: p.number || undefined,
                            nickname: p.nickname || undefined,
                          })
                        );
                        setAvailablePlayers(appPlayers);
                      }
                    } catch (error) {
                      console.error("Error resetting:", error);
                    }
                  }}
                />
              </div>
            )}

            {!showDraftSystem && (
              <div className="space-y-6">
                {/* Match Info Card */}
                <div className="card-glass p-6">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Alineaciones del Partido
                  </h2>
                  <p className="text-gray-300">
                    Gestiona las alineaciones de los equipos para este partido
                  </p>
                </div>

                {/* Teams and Players */}
                <DndProvider
                  backend={
                    isClient
                      ? isMobileView
                        ? TouchBackend
                        : HTML5Backend
                      : HTML5Backend
                  }
                >
                  <div className="lg:flex gap-6">
                    {/* Team lineups */}
                    <div className="w-full lg:w-3/4 grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 lg:mb-0">
                      {getAllTeamIds().map((teamId) => (
                        <TeamContainer
                          key={teamId}
                          team={teams[teamId]}
                          onPlayerDrop={async () => {}} // Simplified for now
                          onPlayerRemove={async () => {}} // Simplified for now
                          isMobileView={isMobileView}
                          availablePlayers={availablePlayers}
                          isDropDisabled={isDraftActive}
                          onPositionClick={() => {}} // Simplified for now
                        />
                      ))}
                    </div>

                    {/* Available Players */}
                    <div className="w-full lg:w-1/4">
                      <AvailablePlayers
                        players={availablePlayers}
                        isMobileView={isMobileView}
                        isDragDisabled={isDraftActive}
                      />
                    </div>
                  </div>
                </DndProvider>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
