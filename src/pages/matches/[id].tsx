import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import { isMobile } from "react-device-detect";

import AvailablePlayers from "@/components/AvailablePlayers";
import TeamContainer, {
  PlayerSelectionModal,
} from "@/components/TeamContainer";
import DraftSystem from "@/components/DraftSystem";
import { AppPlayer, PlayerPosition, Team } from "@/types";
import { matchApi, playerApi, lineupApi } from "@/lib/api";
import {
  Match,
  DraftState,
  PlayerMatchStats,
  MatchStatus,
} from "@/lib/database/types";
import PlayerStatsForm from "@/components/PlayerStatsForm";

// Default empty teams structure
const DEFAULT_TEAMS: { [key: string]: Team } = {
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

  // Players and teams state
  const [availablePlayers, setAvailablePlayers] = useState<AppPlayer[]>([]);
  const [teams, setTeams] = useState<{ [key: string]: Team }>(DEFAULT_TEAMS);
  const [selectedPosition, setSelectedPosition] = useState<{
    position: PlayerPosition;
    teamId: string;
  } | null>(null);

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [matchStats, setMatchStats] = useState<PlayerMatchStats[]>([]);
  const [selectedPlayerForStats, setSelectedPlayerForStats] = useState<{
    player: AppPlayer;
    teamId: string;
  } | null>(null);

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

        // Load only available players for this match
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

          if (lineups && (lineups.borjas || lineups.nietos)) {
            setTeams(lineups);

            // Filter out players already assigned to teams
            const assignedPlayerIds = new Set<string>();

            Object.values(lineups).forEach((team) => {
              Object.values(team.players).forEach((positionPlayers) => {
                positionPlayers.forEach((player) => {
                  assignedPlayerIds.add(player.id);
                });
              });
            });

            setAvailablePlayers(
              appPlayers.filter((player) => !assignedPlayerIds.has(player.id))
            );
          } else {
            // If no lineups exist for this match, show all available players
            setAvailablePlayers(appPlayers);
          }
        } catch (error) {
          console.error("Error loading match lineups:", error);
          setAvailablePlayers(appPlayers);
        }

        setIsLoading(false);
      } catch (err) {
        console.error("Error loading match:", err);
        setError("Error al cargar los datos del partido");
        setIsLoading(false);
      }
    }

    if (isClient && matchId) {
      loadMatch();
    }
  }, [isClient, matchId]);

  useEffect(() => {
    async function loadMatchStats() {
      if (!matchId || typeof matchId !== "string") return;

      try {
        const response = await matchApi.getById(matchId);

        // Set match stats ensuring it's an array
        if (response.stats && Array.isArray(response.stats)) {
          setMatchStats(response.stats);
        } else {
          console.warn("Match stats is not an array, setting to empty array");
          setMatchStats([]);
        }
      } catch (error) {
        console.error("Error loading match stats:", error);
        setMatchStats([]);
      }
    }

    if (match) {
      loadMatchStats();
    }
  }, [match, matchId]);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString("es-ES", options);
  };

  // Function to handle player drops on teams
  const handlePlayerDrop = async (
    playerId: string,
    teamId: string,
    position: PlayerPosition
  ) => {
    // Find the player from available players or teams
    let player: AppPlayer | undefined = availablePlayers.find(
      (p) => p.id === playerId
    );

    if (!player) {
      // If not in availablePlayers, look in teams
      for (const tId of ["borjas", "nietos"] as const) {
        for (const pos of Object.keys(teams[tId].players) as PlayerPosition[]) {
          const foundPlayer = teams[tId].players[pos].find(
            (p) => p.id === playerId
          );
          if (foundPlayer) {
            player = foundPlayer;
            break;
          }
        }
        if (player) break;
      }
    }

    // If player not found, exit function
    if (!player) return;

    // Step 1: Create a new teams object to avoid direct mutation
    const newTeams = JSON.parse(JSON.stringify(teams)) as typeof teams;

    // Step 2: Remove player from available players if they're there
    if (!player.team) {
      setAvailablePlayers((prev) => prev.filter((p) => p.id !== playerId));
    }

    // Step 3: Remove player from any team and position they might be in
    for (const tId of ["borjas", "nietos"] as const) {
      for (const pos of Object.keys(
        newTeams[tId].players
      ) as PlayerPosition[]) {
        newTeams[tId].players[pos] = newTeams[tId].players[pos].filter(
          (p) => p.id !== playerId
        );
      }
    }

    // Step 4: Add player to the new team and position
    const updatedPlayer = {
      ...player,
      team: teamId,
    };

    newTeams[teamId].players[position].push(updatedPlayer);

    // Step 5: Update state with the new teams object
    setTeams(newTeams);

    // Step 6: Save to database with match ID
    try {
      // Determine the order (always at the end for now)
      const order = newTeams[teamId].players[position].length - 1;

      // Save the position to the database with matchId
      if (typeof matchId === "string") {
        await lineupApi.savePosition(
          teamId,
          playerId,
          position,
          order,
          matchId
        );
      }
    } catch (error) {
      console.error("Error saving position to database:", error);
      // Revert UI changes on error
      setTeams((prevTeams) => {
        const revertedTeams = { ...prevTeams };
        revertedTeams[teamId].players[position] = revertedTeams[teamId].players[
          position
        ].filter((p) => p.id !== playerId);
        return revertedTeams;
      });
      // Add the player back to available players
      setAvailablePlayers((prev) => [...prev, player as AppPlayer]);
      // Show error message
      alert(
        `Error al guardar la posición: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`
      );
    }
  };

  // Remove player from team, return to available players
  const handleRemovePlayer = async (playerId: string) => {
    // Find which team the player is on
    let playerTeam: string | null = null;
    let playerPosition: PlayerPosition | null = null;
    let player: AppPlayer | null = null;

    // Search through teams
    Object.keys(teams).forEach((teamId) => {
      const team = teams[teamId];
      Object.keys(team.players).forEach((pos) => {
        const playerIndex = team.players[pos as PlayerPosition].findIndex(
          (p) => p.id === playerId
        );
        if (playerIndex >= 0) {
          playerTeam = teamId;
          playerPosition = pos as PlayerPosition;
          player = team.players[pos as PlayerPosition][playerIndex];
        }
      });
    });

    if (playerTeam && playerPosition && player) {
      // Remove from team
      setTeams((prevTeams) => {
        const newTeams = { ...prevTeams };
        newTeams[playerTeam as string].players[
          playerPosition as PlayerPosition
        ] = newTeams[playerTeam as string].players[
          playerPosition as PlayerPosition
        ].filter((p) => p.id !== playerId);
        return newTeams;
      });

      // Add to available players
      setAvailablePlayers((prev) => [
        ...prev,
        { ...(player as AppPlayer), team: null } as AppPlayer,
      ]);

      // Remove from database with matchId
      try {
        if (typeof matchId === "string") {
          await lineupApi.removePlayer(playerTeam, playerId, matchId as string);
        }
      } catch (error) {
        console.error("Error removing player from database:", error);
      }
    }
  };

  // Reset lineups for this match
  const handleReset = async () => {
    // Reset state
    setTeams(DEFAULT_TEAMS);

    // Reload all players as available
    try {
      const dbPlayers = await playerApi.getAll();

      const appPlayers: AppPlayer[] = dbPlayers.map((p) => ({
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

      // Reset lineups in database for this match
      if (typeof matchId === "string") {
        await lineupApi.reset(matchId);
      }
    } catch (error) {
      console.error("Error resetting lineups:", error);
    }
  };

  const handlePositionClick = (position: PlayerPosition, teamId: string) => {
    if (isMobileView) {
      setSelectedPosition({ position, teamId });
    }
  };

  const handlePlayerSelect = (player: AppPlayer, position: PlayerPosition) => {
    if (selectedPosition) {
      handlePlayerDrop(player.id, selectedPosition.teamId, position);
      setSelectedPosition(null);
    }
  };

  // Handle when a player is picked in the draft system
  const handleDraftPlayerPicked = (playerId: string, teamId: string) => {
    // Find player in available players
    const player = availablePlayers.find((p) => p.id === playerId);
    if (!player) return;

    // Get default position based on player's preferred position or SUB
    const position = player.position || "SUB";

    // Use the existing handlePlayerDrop function to add player to team
    handlePlayerDrop(playerId, teamId, position);
  };

  // Update draft system state
  const handleDraftStateChange = (newState: DraftState) => {
    setIsDraftActive(newState.is_active);
  };

  // Function to update match status
  const handleUpdateStatus = async (newStatus: MatchStatus) => {
    if (!matchId || typeof matchId !== "string" || !match) return;

    try {
      setIsUpdatingStatus(true);
      const result = await matchApi.updateStatus(matchId, newStatus);

      if (result.success) {
        // Update local match state with new status
        setMatch({ ...match, status: newStatus });

        // Show success message
        alert(`Match status updated to ${newStatus}`);
      } else {
        // Show error message
        alert("Failed to update match status");
      }
    } catch (error) {
      console.error("Error updating match status:", error);
      alert("Error updating match status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Function to refresh match stats
  const refreshMatchStats = async () => {
    if (!matchId || typeof matchId !== "string") return;

    try {
      const statsResult = await matchApi.getStats(matchId);
      if (statsResult.success && statsResult.stats) {
        if (Array.isArray(statsResult.stats)) {
          setMatchStats(statsResult.stats);
        } else {
          console.warn("Match stats is not an array, setting to empty array");
          setMatchStats([]);
        }
      } else {
        setMatchStats([]);
      }
    } catch (error) {
      console.error("Error refreshing match stats:", error);
      setMatchStats([]);
    }
  };

  // Function to open stats form for a player
  const handleOpenPlayerStats = (player: AppPlayer, teamId: string) => {
    setSelectedPlayerForStats({ player, teamId });
  };

  // Function called after stats are saved
  const handleStatsSaved = () => {
    refreshMatchStats();
    setSelectedPlayerForStats(null);
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

  // Add this to the UI component, where appropriate
  const renderMatchActions = () => {
    if (!match) return null;

    return (
      <div className="flex gap-2 mt-2">
        {match.status === "PENDING" && (
          <button
            onClick={() => handleUpdateStatus("FINISHED")}
            disabled={isUpdatingStatus}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors disabled:opacity-50"
          >
            {isUpdatingStatus ? "Updating..." : "Mark as Finished"}
          </button>
        )}

        {match.status === "FINISHED" && (
          <button
            onClick={() => handleUpdateStatus("PENDING")}
            disabled={isUpdatingStatus}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors disabled:opacity-50"
          >
            {isUpdatingStatus ? "Updating..." : "Reopen Match"}
          </button>
        )}
      </div>
    );
  };

  // Add this to the header section of your UI
  const renderMatchStatus = () => {
    if (!match) return null;

    return (
      <div
        className={`text-sm font-medium px-2 py-1 rounded inline-block ${
          match.status === "FINISHED"
            ? "bg-green-600/30 text-green-200"
            : "bg-yellow-600/30 text-yellow-200"
        }`}
      >
        {match.status === "FINISHED" ? "Finished" : "Pending"}
      </div>
    );
  };

  // Add this to your UI to display match stats
  const renderPlayerStats = () => {
    // Ensure matchStats is an array before trying to map over it
    if (!matchStats || !Array.isArray(matchStats) || matchStats.length === 0) {
      return (
        <div className="mt-8">
          <h3 className="text-xl font-bold text-white mb-4">
            Match Statistics
          </h3>
          <div className="bg-gray-800/60 p-4 rounded-lg text-gray-400">
            No statistics available for this match yet.
          </div>
        </div>
      );
    }

    return (
      <div className="mt-8">
        <h3 className="text-xl font-bold text-white mb-4">Match Statistics</h3>
        <div className="bg-gray-800/60 p-4 rounded-lg">
          <table className="w-full text-gray-300">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-2">Player</th>
                <th className="text-center py-2">Team</th>
                <th className="text-center py-2">Goals</th>
                <th className="text-center py-2">Assists</th>
                <th className="text-center py-2">Saves</th>
              </tr>
            </thead>
            <tbody>
              {matchStats.map((stat) => {
                // Get player name from available players or lineups
                const playerName =
                  availablePlayers.find((p) => p.id === stat.player_id)?.name ||
                  "Unknown";
                const teamName =
                  stat.team_id === "borjas" ? "Borjas" : "Nietos";

                return (
                  <tr key={stat.id} className="border-b border-gray-700/50">
                    <td className="py-2">{playerName}</td>
                    <td className="text-center py-2">{teamName}</td>
                    <td className="text-center py-2">{stat.goals}</td>
                    <td className="text-center py-2">{stat.assists}</td>
                    <td className="text-center py-2">{stat.saves}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Add this to your UI to display player list with stats option
  const renderPlayersWithStatsOption = () => {
    if (!match || match.status !== "FINISHED") return null;

    const getTeamPlayers = (team: Team) => {
      // Flatten all positions into a single list of players
      return Object.values(team.players)
        .flat()
        .map((player) => (
          <li
            key={player.id}
            className="flex justify-between items-center p-2 rounded hover:bg-gray-700/60"
          >
            <span>{player.name}</span>
            <button
              onClick={() => handleOpenPlayerStats(player, team.id)}
              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-xs text-white rounded"
            >
              Manage Stats
            </button>
          </li>
        ));
    };

    return (
      <div className="mt-8">
        <h3 className="text-xl font-bold text-white mb-4">
          Player Statistics Management
        </h3>
        <div className="bg-gray-800/60 p-4 rounded-lg">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="text-lg font-medium text-white mb-3">
                Borjas Team
              </h4>
              <ul className="space-y-1">{getTeamPlayers(teams.borjas)}</ul>
            </div>

            <div>
              <h4 className="text-lg font-medium text-white mb-3">
                Nietos Team
              </h4>
              <ul className="space-y-1">{getTeamPlayers(teams.nietos)}</ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Add this modal to your JSX
  const renderPlayerStatsModal = () => {
    if (!selectedPlayerForStats) return null;

    let existingStats;
    if (Array.isArray(matchStats)) {
      existingStats = matchStats.find(
        (stat) =>
          stat.player_id === selectedPlayerForStats.player.id &&
          stat.team_id === selectedPlayerForStats.teamId
      );
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
        <div className="w-full max-w-md">
          <PlayerStatsForm
            matchId={matchId as string}
            player={selectedPlayerForStats.player}
            teamId={selectedPlayerForStats.teamId}
            onStatsSaved={handleStatsSaved}
            existingStats={existingStats}
          />
          <div className="flex justify-end">
            <button
              onClick={() => setSelectedPlayerForStats(null)}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

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
              {match ? (
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-4xl font-bold text-white">
                      {match.name}
                    </h1>
                    {renderMatchStatus()}
                  </div>
                  <p className="text-xl text-gray-300">
                    {formatDate(match.date)}
                  </p>
                  {renderMatchActions()}
                </div>
              ) : (
                <h1 className="text-4xl font-bold text-white mb-2">
                  Cargando partido...
                </h1>
              )}
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
                onClick={handleReset}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
              >
                Reiniciar Alineaciones
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-500/20 border border-red-500 p-4 rounded-lg text-white text-center">
              {error}
            </div>
          ) : (
            <>
              {showDraftSystem && matchId && typeof matchId === "string" && (
                <DraftSystem
                  availablePlayers={availablePlayers}
                  teams={teams}
                  matchId={matchId}
                  onDraftStateChange={handleDraftStateChange}
                  onPlayerPicked={handleDraftPlayerPicked}
                  onTeamsReset={handleReset}
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
                      <TeamContainer
                        team={teams.borjas}
                        onPlayerDrop={handlePlayerDrop}
                        onPlayerRemove={handleRemovePlayer}
                        isMobileView={isMobileView}
                        availablePlayers={availablePlayers}
                        isDropDisabled={isDraftActive}
                        onPositionClick={handlePositionClick}
                      />
                      <TeamContainer
                        team={teams.nietos}
                        onPlayerDrop={handlePlayerDrop}
                        onPlayerRemove={handleRemovePlayer}
                        isMobileView={isMobileView}
                        availablePlayers={availablePlayers}
                        isDropDisabled={isDraftActive}
                        onPositionClick={handlePositionClick}
                      />
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

                  {/* Player selection modal for mobile */}
                  {selectedPosition && (
                    <PlayerSelectionModal
                      selectedPosition={selectedPosition.position}
                      availablePlayers={availablePlayers}
                      onPlayerSelect={handlePlayerSelect}
                      onClose={() => setSelectedPosition(null)}
                      getPositionName={(position) => {
                        switch (position) {
                          case "GK":
                            return "Portero";
                          case "CL":
                            return "Central Izq.";
                          case "CR":
                            return "Central Der.";
                          case "ML":
                            return "Medio Izq.";
                          case "MR":
                            return "Medio Der.";
                          case "ST":
                            return "Delantero";
                          case "SUB":
                            return "Suplentes";
                          default:
                            return position;
                        }
                      }}
                    />
                  )}
                </DndProvider>
              </div>

              {/* Display player stats */}
              {renderPlayerStats()}

              {/* In your return statement, before the closing main tag */}
              {match &&
                match.status === "FINISHED" &&
                renderPlayersWithStatsOption()}
            </>
          )}
        </div>
      </main>

      {/* At the end of your JSX, before the closing fragment */}
      {renderPlayerStatsModal()}
    </>
  );
}
