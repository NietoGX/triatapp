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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
          <p className="mt-2 text-gray-300">Cargando partido...</p>
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-800/50 text-red-200 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-2">Error</h2>
            <p>{error || "No se ha podido cargar el partido"}</p>
            <Link
              href="/"
              className="mt-4 inline-block text-white hover:underline"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>
          {match ? match.name : "Cargando partido..."} | Futbol Triaje
        </title>
        <meta
          name="description"
          content="Detalles del partido y gestión de alineaciones"
        />
      </Head>
      <main className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900">
        <div className="container mx-auto py-6 px-4">
          {/* Header with match info and back button */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <Link
                href="/"
                className="inline-block mb-4 text-blue-400 hover:text-blue-300"
              >
                &larr; Volver a inicio
              </Link>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold text-white">
                    {match.name}
                  </h1>
                </div>
                <p className="text-xl text-gray-300">
                  {new Date(match.date).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
              <button
                onClick={() => setShowDraftSystem(!showDraftSystem)}
                className={`px-4 py-2 ${
                  isDraftActive
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-blue-600 hover:bg-blue-700"
                } text-white rounded transition-colors`}
              >
                {isDraftActive
                  ? "Triaje Activo"
                  : showDraftSystem
                  ? "Ocultar Triaje"
                  : "Mostrar Triaje"}
              </button>
              <button
                onClick={handleResetAll}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                disabled={isResetting}
              >
                {isResetting ? "Reiniciando..." : "Reiniciar Partido"}
              </button>
            </div>
          </div>

          <>
            {showDraftSystem && matchId && typeof matchId === "string" && (
              <DraftSystem
                availablePlayers={availablePlayers}
                teams={teams}
                matchId={matchId}
                onDraftStateChange={(newState: DraftState) => {
                  setIsDraftActive(newState.is_active);
                }}
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
            )}

            <div className="mb-4">
              <div className="bg-gray-800/60 p-4 rounded-lg shadow-lg mb-4">
                <h2 className="text-xl font-bold text-white border-b border-gray-700 pb-2 mb-3">
                  Alineaciones: {match?.name}
                </h2>
              </div>

              <DndProvider
                backend={
                  isClient
                    ? isMobileView
                      ? TouchBackend
                      : HTML5Backend
                    : HTML5Backend
                }
              >
                {/* Drag and Drop team builder interface */}
                <div className="lg:flex gap-6">
                  {/* Team lineups (Left) */}
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

                  {/* Available Players (Right) */}
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
          </>
        </div>
      </main>
    </>
  );
}
