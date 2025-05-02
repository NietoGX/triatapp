import { useEffect, useState } from "react";
import Head from "next/head";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import { isMobile } from "react-device-detect";
import Link from "next/link";

import AvailablePlayers from "@/components/AvailablePlayers";
import TeamContainer, {
  PlayerSelectionModal,
} from "@/components/TeamContainer";
import DraftSystem from "@/components/DraftSystem";
import { AppPlayer, PlayerPosition, Team } from "@/types";
import { playerApi, lineupApi, teamApi, matchApi } from "@/lib/api";
import { DraftState, Match } from "@/lib/database/types";
import CreateMatchModal from "@/components/CreateMatchModal";

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

export default function Home() {
  // Use mobile detection for touch vs mouse interactions
  const [isMobileView, setIsMobileView] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dbInitialized, setDbInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [showDraftSystem, setShowDraftSystem] = useState(false);
  const [isDraftActive, setIsDraftActive] = useState(false);

  // Match state
  const [latestMatch, setLatestMatch] = useState<Match | null>(null);
  const [isCreateMatchModalOpen, setIsCreateMatchModalOpen] = useState(false);

  // Players and teams state
  const [availablePlayers, setAvailablePlayers] = useState<AppPlayer[]>([]);
  const [teams, setTeams] = useState<{ [key: string]: Team }>(DEFAULT_TEAMS);
  const [selectedPosition, setSelectedPosition] = useState<{
    position: PlayerPosition;
    teamId: string;
  } | null>(null);

  useEffect(() => {
    setIsClient(true);
    setIsMobileView(isMobile);
  }, []);

  // Function to load match-specific lineups and players
  const loadMatchLineups = async (matchId: string) => {
    try {
      // Load available players for this match
      const matchPlayers = await matchApi.getAvailablePlayers(matchId);

      // Map players to app format
      const appPlayers: AppPlayer[] = matchPlayers.map((p) => ({
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
      console.error(`Error loading data for match ${matchId}:`, error);

      // Fallback to loading all players if match-specific loading fails
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
      } catch (err) {
        console.error("Error loading fallback players:", err);
        setAvailablePlayers([]);
      }
    }
  };

  // Load players, lineups and matches from database
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);

        // Load matches
        try {
          const matchesData = await matchApi.getAll();

          // Set the latest match based on created_at timestamp
          if (matchesData.length > 0) {
            const latestMatchData = matchesData.sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
            )[0];
            setLatestMatch(latestMatchData);

            // Load the latest match lineups
            await loadMatchLineups(latestMatchData.id);
          }
        } catch (error) {
          console.error("Error al cargar partidos:", error);
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error al cargar datos:", error);
        setIsLoading(false);
      }
    }

    if (isClient) {
      loadData();
    }
  }, [isClient, dbInitialized]);

  // Function to handle player drops on teams
  const handlePlayerDrop = async (
    playerId: string,
    teamId: string,
    position: PlayerPosition
  ) => {
    // Si el triaje está activo, no permitir añadir jugadores manualmente
    if (isDraftActive) {
      console.warn(
        "No se pueden añadir jugadores manualmente durante el triaje activo."
      );
      return;
    }

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
    const playerToAdd = {
      ...player,
      team: teamId,
    };
    newTeams[teamId].players[position].push(playerToAdd);

    // Step 5: Update the teams state
    setTeams(newTeams);

    // Step 6: Save the player position to the database for the current match
    try {
      if (latestMatch) {
        await lineupApi.savePosition(
          teamId,
          playerId,
          position,
          0, // default order
          latestMatch.id
        );
      }
    } catch (error) {
      console.error("Error al guardar la posición del jugador:", error);
    }
  };

  const handleRemovePlayer = async (playerId: string) => {
    // Si el triaje está activo, no permitir quitar jugadores manualmente
    if (isDraftActive) {
      console.warn(
        "No se pueden quitar jugadores manualmente durante el triaje activo."
      );
      return;
    }

    // Find the player from teams
    let player: AppPlayer | undefined;
    let playerTeamId: string | null = null;
    let playerPosition: PlayerPosition | null = null;

    // Search in teams to get the player's current position and team
    for (const teamId of ["borjas", "nietos"] as const) {
      for (const pos of Object.keys(
        teams[teamId].players
      ) as PlayerPosition[]) {
        const foundPlayer = teams[teamId].players[pos].find(
          (p) => p.id === playerId
        );
        if (foundPlayer) {
          player = foundPlayer;
          playerTeamId = teamId;
          playerPosition = pos;
          break;
        }
      }
      if (player) break;
    }

    // If player not found, exit function
    if (!player || !playerTeamId || !playerPosition) return;

    // Step 1: Create a new teams object to avoid direct mutation
    const newTeams = JSON.parse(JSON.stringify(teams)) as typeof teams;

    // Step 2: Remove player from their current team and position
    newTeams[playerTeamId].players[playerPosition] = newTeams[
      playerTeamId
    ].players[playerPosition].filter((p) => p.id !== playerId);

    // Step 3: Add player back to available players
    const playerToAdd = {
      ...player,
      team: null,
    };
    setAvailablePlayers((prev) => [...prev, playerToAdd]);

    // Step 4: Update the teams state
    setTeams(newTeams);

    // Step 5: Remove the player position from the database for the current match
    try {
      if (latestMatch) {
        await lineupApi.removePlayer(playerTeamId, playerId, latestMatch.id);
      }
    } catch (error) {
      console.error("Error al quitar al jugador del equipo:", error);
    }
  };

  const handleReset = async () => {
    // Si el triaje está activo, no permitir reiniciar alineaciones
    if (isDraftActive) {
      console.warn(
        "No se pueden reiniciar las alineaciones durante el triaje activo."
      );
      return;
    }

    // Collect all players from teams
    const allPlayers: AppPlayer[] = [];
    for (const teamId of ["borjas", "nietos"] as const) {
      for (const pos of Object.keys(
        teams[teamId].players
      ) as PlayerPosition[]) {
        teams[teamId].players[pos].forEach((player) => {
          allPlayers.push({
            ...player,
            team: null,
          });
        });
      }
    }

    // Reset teams to default (empty)
    setTeams(DEFAULT_TEAMS);

    // Add all team players back to available players
    setAvailablePlayers((prev) => [...prev, ...allPlayers]);

    // Reset the lineups in the database for the current match
    try {
      if (latestMatch) {
        await lineupApi.reset(latestMatch.id);
      }
    } catch (error) {
      console.error("Error al reiniciar las alineaciones:", error);
    }
  };

  const handleInitializeDb = async () => {
    try {
      setIsInitializing(true);
      // Inicializar la base de datos con datos de prueba
      const result = await teamApi.initialize();
      if (result) {
        setDbInitialized(true);
        console.log("Base de datos inicializada correctamente");
      }
    } catch (error) {
      console.error("Error al inicializar la base de datos:", error);
    } finally {
      setIsInitializing(false);
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

  const handlePositionClick = (position: PlayerPosition, teamId: string) => {
    // Only open selection modal on mobile view
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

  const handleMatchCreated = async () => {
    setIsCreateMatchModalOpen(false);

    try {
      const matchesData = await matchApi.getAll();

      // Set the latest match
      if (matchesData.length > 0) {
        const latestMatchData = matchesData.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        setLatestMatch(latestMatchData);

        // Reset teams to default (empty)
        setTeams(DEFAULT_TEAMS);

        // Load the latest match lineups
        await loadMatchLineups(latestMatchData.id);
      }
    } catch (error) {
      console.error("Error loading matches after creation:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    };
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", options);
  };

  return (
    <>
      <Head>
        <title>Futbol Triaje</title>
        <meta
          name="description"
          content="Sistema de triaje para partidos de fútbol"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900">
        <div className="container mx-auto py-6 px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Futbol Triaje
              </h1>
              {latestMatch ? (
                <div className="bg-blue-900/30 p-3 rounded-lg mb-4">
                  <h2 className="text-xl font-semibold text-blue-300">
                    Próximo partido: {latestMatch.name}
                  </h2>
                  <p className="text-gray-300">
                    {formatDate(latestMatch.date)}
                  </p>
                  <Link
                    href={`/matches/${latestMatch.id}`}
                    className="text-sm text-blue-400 hover:text-blue-300 mt-1 inline-block"
                  >
                    Ver detalles &rarr;
                  </Link>
                </div>
              ) : (
                <p className="text-gray-300 mb-4">
                  No hay partidos programados
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
              <Link
                href="/players"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              >
                Jugadores
              </Link>
              <Link
                href="/matches"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              >
                Partidos
              </Link>
              <Link
                href="/db-setup"
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
              >
                Config BD
              </Link>
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
                onClick={() => setIsCreateMatchModalOpen(true)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
              >
                Nuevo Partido
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : !dbInitialized && availablePlayers.length === 0 ? (
            <div className="bg-gray-800 p-6 rounded-lg mb-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-4">
                Base de datos no inicializada
              </h2>
              <p className="text-gray-300 mb-6">
                Necesitas inicializar la base de datos para empezar a usar la
                aplicación.
              </p>
              <button
                onClick={handleInitializeDb}
                disabled={isInitializing}
                className={`px-6 py-3 rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors ${
                  isInitializing ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isInitializing
                  ? "Inicializando..."
                  : "Inicializar Base de Datos"}
              </button>
            </div>
          ) : (
            <>
              {showDraftSystem && (
                <DraftSystem
                  availablePlayers={availablePlayers}
                  teams={teams}
                  matchId={latestMatch ? latestMatch.id : ""}
                  onDraftStateChange={handleDraftStateChange}
                  onPlayerPicked={handleDraftPlayerPicked}
                  onTeamsReset={handleReset}
                />
              )}

              {!showDraftSystem && latestMatch && (
                <div className="mb-4">
                  <div className="bg-gray-800/60 p-4 rounded-lg shadow-lg mb-4">
                    <h2 className="text-xl font-bold text-white border-b border-gray-700 pb-2 mb-3">
                      Alineaciones para: {latestMatch.name}
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

                        <div className="mt-4 flex space-x-2 justify-end">
                          <button
                            onClick={handleReset}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                          >
                            Reiniciar Alineaciones
                          </button>
                        </div>
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
              )}
            </>
          )}
        </div>

        <CreateMatchModal
          isOpen={isCreateMatchModalOpen}
          onClose={() => setIsCreateMatchModalOpen(false)}
          onMatchCreated={handleMatchCreated}
        />
      </main>
    </>
  );
}
