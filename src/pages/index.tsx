import { useEffect, useState } from "react";
import Head from "next/head";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import { isMobile } from "react-device-detect";
import Link from "next/link";

import AvailablePlayers from "@/components/AvailablePlayers";
import TeamContainer from "@/components/TeamContainer";
import { Player, Team, Position } from "@/types";
import { playerApi } from "@/lib/api";

// Default empty teams structure
const DEFAULT_TEAMS: { [key: string]: Team } = {
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

export default function Home() {
  // Use mobile detection for touch vs mouse interactions
  const [isMobileView, setIsMobileView] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dbInitialized, setDbInitialized] = useState(false);

  // Players and teams state
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<{ [key: string]: Team }>(DEFAULT_TEAMS);

  useEffect(() => {
    setIsClient(true);
    setIsMobileView(isMobile);
  }, []);

  // Load players from database
  useEffect(() => {
    async function loadPlayers() {
      try {
        setIsLoading(true);
        const dbPlayers = await playerApi.getAll();

        // Map database players to app players format
        const appPlayers: Player[] = dbPlayers.map((p) => ({
          id: p.id,
          name: p.name,
          rating: p.rating,
          position: p.position as Position | null,
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

        // Restore team assignments from localStorage if it exists
        const storedTeamsData = localStorage.getItem("triatapp-teams");
        if (storedTeamsData) {
          const storedTeams = JSON.parse(storedTeamsData) as {
            [key: string]: Team;
          };

          // We need to merge the stored team assignments with the fresh player data
          const teamsWithUpdatedPlayers = { ...storedTeams };

          // For each position in each team, update player data with fresh data from DB
          Object.keys(teamsWithUpdatedPlayers).forEach((teamId) => {
            Object.keys(teamsWithUpdatedPlayers[teamId].players).forEach(
              (pos) => {
                const position = pos as Position;
                teamsWithUpdatedPlayers[teamId].players[position] =
                  teamsWithUpdatedPlayers[teamId].players[position].map(
                    (teamPlayer) => {
                      // Find the updated player data
                      const updatedPlayer = appPlayers.find(
                        (p) => p.id === teamPlayer.id
                      );
                      if (updatedPlayer) {
                        // Return player with team assignment but updated stats
                        return {
                          ...updatedPlayer,
                          team: teamId as "borjas" | "nietos",
                        };
                      }
                      return teamPlayer;
                    }
                  ) as Player[];
              }
            );
          });

          setTeams(teamsWithUpdatedPlayers);

          // Filter out players that are already in teams
          const assignedPlayerIds = new Set();
          Object.values(teamsWithUpdatedPlayers).forEach((team) => {
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
          // If no stored teams, all players are available
          setAvailablePlayers(appPlayers);
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error loading players:", error);
        setIsLoading(false);
      }
    }

    if (isClient) {
      loadPlayers();
    }
  }, [isClient, dbInitialized]);

  // Save teams state to localStorage when it changes
  useEffect(() => {
    if (isClient) {
      localStorage.setItem("triatapp-teams", JSON.stringify(teams));
    }
  }, [teams, isClient]);

  // Function to handle player drops on teams
  const handlePlayerDrop = (
    playerId: string,
    teamId: "borjas" | "nietos",
    position: Position
  ) => {
    // Find the player from available players or teams
    let player: Player | undefined = availablePlayers.find(
      (p) => p.id === playerId
    );

    if (!player) {
      // If not in availablePlayers, look in teams
      for (const tId of ["borjas", "nietos"] as const) {
        for (const pos of Object.keys(teams[tId].players) as Position[]) {
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
      for (const pos of Object.keys(newTeams[tId].players) as Position[]) {
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
  };

  // Remove player from team, return to available players
  const handleRemovePlayer = (playerId: string) => {
    // Find which team the player is on
    let playerTeam: string | null = null;
    let playerPosition: Position | null = null;
    let player: Player | null = null;

    // Search through teams
    Object.keys(teams).forEach((teamId) => {
      const team = teams[teamId];
      Object.keys(team.players).forEach((pos) => {
        const playerIndex = team.players[pos as Position].findIndex(
          (p) => p.id === playerId
        );
        if (playerIndex >= 0) {
          playerTeam = teamId;
          playerPosition = pos as Position;
          player = team.players[pos as Position][playerIndex];
        }
      });
    });

    if (playerTeam && playerPosition && player) {
      // Remove from team
      setTeams((prevTeams) => {
        const newTeams = { ...prevTeams };
        newTeams[playerTeam as string].players[playerPosition as Position] =
          newTeams[playerTeam as string].players[
            playerPosition as Position
          ].filter((p) => p.id !== playerId);
        return newTeams;
      });

      // Add to available players
      setAvailablePlayers((prev) => [
        ...prev,
        { ...player, team: null } as Player,
      ]);
    }
  };

  // Reset everything
  const handleReset = () => {
    setTeams(DEFAULT_TEAMS);
    localStorage.removeItem("triatapp-teams");
    // Reload players from database
    setDbInitialized((prev) => !prev); // Toggle to trigger reload
  };

  const backend = isMobileView ? TouchBackend : HTML5Backend;

  return (
    <>
      <Head>
        <title>Futbol Triaje</title>
        <meta
          name="description"
          content="Aplicación para organizar equipos de fútbol"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900">
        <div className="container mx-auto px-4 py-6 relative backdrop-blur-sm">
          <header className="mb-6 text-center">
            <h1 className="text-3xl font-bold text-white drop-shadow-lg">
              TriatApp
            </h1>
          </header>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="bg-white/90 p-6 rounded-lg shadow-lg text-center">
                <p className="text-xl mb-4">Cargando jugadores...</p>
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            </div>
          ) : (
            <DndProvider backend={backend}>
              {/* Panel de Acciones (Arriba) */}
              <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 mb-6 border border-white/10 shadow-lg">
                <h3 className="text-xl font-semibold mb-4 text-white">
                  Acciones
                </h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleReset}
                    className="bg-red-600/90 hover:bg-red-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    Reiniciar Equipos
                  </button>
                  {/* <button
                    onClick={handleInitializeDb}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium"
                  >
                    Inicializar Base de Datos
                  </button> */}
                  <Link
                    href="/players"
                    className="bg-green-600/90 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm font-medium text-center transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    Gestionar Jugadores
                  </Link>
                </div>
              </div>

              {/* Contenido Principal: Alineaciones (Izquierda) y Jugadores (Derecha) */}
              <div className="lg:flex gap-6">
                {/* Alineaciones (Izquierda) */}
                <div className="w-full lg:w-3/4 grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 lg:mb-0">
                  <TeamContainer
                    team={teams.borjas}
                    onPlayerDrop={handlePlayerDrop}
                    onPlayerRemove={handleRemovePlayer}
                    isMobileView={isMobileView}
                    availablePlayers={availablePlayers}
                  />
                  <TeamContainer
                    team={teams.nietos}
                    onPlayerDrop={handlePlayerDrop}
                    onPlayerRemove={handleRemovePlayer}
                    isMobileView={isMobileView}
                    availablePlayers={availablePlayers}
                  />
                </div>

                {/* Jugadores Disponibles (Derecha) */}
                <div className="w-full lg:w-1/4">
                  <AvailablePlayers
                    players={availablePlayers}
                    isMobileView={isMobileView}
                  />
                </div>
              </div>
            </DndProvider>
          )}
        </div>
      </main>
    </>
  );
}
