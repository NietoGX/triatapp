import { useEffect, useState } from "react";
import Head from "next/head";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import { isMobile } from "react-device-detect";
import Link from "next/link";

import AvailablePlayers from "@/components/AvailablePlayers";
import TeamContainer from "@/components/TeamContainer";
import DraftSystem from "@/components/DraftSystem";
import { AppPlayer, PlayerPosition, Team } from "@/types";
import { playerApi, lineupApi, teamApi, draftApi } from "@/lib/api";
import { DraftState } from "@/lib/database/types";

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
  const [isInitializing, setIsInitializing] = useState(false);
  const [showDraftSystem, setShowDraftSystem] = useState(false);
  const [isDraftActive, setIsDraftActive] = useState(false);

  // Players and teams state
  const [availablePlayers, setAvailablePlayers] = useState<AppPlayer[]>([]);
  const [teams, setTeams] = useState<{ [key: string]: Team }>(DEFAULT_TEAMS);

  useEffect(() => {
    setIsClient(true);
    setIsMobileView(isMobile);
  }, []);

  // Load players and lineups from database
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);

        // 1. Cargar los jugadores
        const dbPlayers = await playerApi.getAll();

        // 2. Mapear jugadores a formato de la aplicación
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

        // 3. Cargar las alineaciones desde la base de datos
        try {
          const lineups = await lineupApi.getAll();

          if (lineups && (lineups.borjas || lineups.nietos)) {
            setTeams(lineups);

            // Filtrar jugadores disponibles (los que no están en ningún equipo)
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
            // Si no hay alineaciones en la BD, todos los jugadores están disponibles
            setAvailablePlayers(appPlayers);
          }
        } catch (error) {
          console.error("Error al cargar alineaciones:", error);
          // Si falla la carga de alineaciones, mostrar todos los jugadores como disponibles
          setAvailablePlayers(appPlayers);
        }

        // 4. Verificar el estado del triaje
        try {
          const draftState = await draftApi.getState();
          setIsDraftActive(draftState.is_active);

          // Si el triaje está activo, mostrar automáticamente el panel de triaje
          if (draftState.is_active) {
            setShowDraftSystem(true);
          }
        } catch (error) {
          console.error("Error al verificar estado del triaje:", error);
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
    const updatedPlayer = {
      ...player,
      team: teamId,
    };

    newTeams[teamId].players[position].push(updatedPlayer);

    // Step 5: Update state with the new teams object
    setTeams(newTeams);

    // Step 6: Guardar en la base de datos
    try {
      // Determinar el orden (por ahora siempre al final)
      const order = newTeams[teamId].players[position].length - 1;

      // Guardar la posición en la base de datos
      await lineupApi.savePosition(teamId, playerId, position, order);
    } catch (error) {
      console.error("Error al guardar posición en base de datos:", error);
      // Podría implementarse un rollback o notificación al usuario
    }
  };

  // Remove player from team, return to available players
  const handleRemovePlayer = async (playerId: string) => {
    // Si el triaje está activo, no permitir quitar jugadores manualmente
    if (isDraftActive) {
      console.warn(
        "No se pueden quitar jugadores manualmente durante el triaje activo."
      );
      return;
    }

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
        { ...player, team: null } as AppPlayer,
      ]);

      // Eliminar de la base de datos
      try {
        await lineupApi.removePlayer(playerTeam, playerId);
      } catch (error) {
        console.error("Error al eliminar jugador de la base de datos:", error);
      }
    }
  };

  // Reset everything
  const handleReset = async () => {
    // Si el triaje está activo, no permitir resetear manualmente
    if (isDraftActive) {
      console.warn(
        "No se pueden resetear los equipos durante el triaje activo."
      );
      return;
    }

    // Resetear el estado
    setTeams(DEFAULT_TEAMS);

    // Recargar todos los jugadores como disponibles
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

      // Resetear alineaciones en la base de datos
      await lineupApi.reset();
    } catch (error) {
      console.error("Error al resetear alineaciones:", error);
    }

    // Toggle para forzar recarga
    setDbInitialized((prev) => !prev);
  };

  // Inicializar la base de datos
  const handleInitializeDb = async () => {
    try {
      setIsInitializing(true);

      // Inicializar equipos
      await teamApi.initialize();

      // Inicializar jugadores de ejemplo
      await playerApi.initialize();

      // Recargar los datos
      setDbInitialized(!dbInitialized);

      setIsInitializing(false);
    } catch (error) {
      console.error("Error al inicializar la base de datos:", error);
      setIsInitializing(false);
    }
  };

  // Manejar la selección de jugadores en el triaje
  const handleDraftPlayerPicked = (playerId: string, teamId: string) => {
    // Buscar al jugador seleccionado
    const player = availablePlayers.find((p) => p.id === playerId);
    if (!player) return;

    // Primero, eliminar al jugador de la lista de disponibles
    setAvailablePlayers((prev) => prev.filter((p) => p.id !== playerId));

    // Step 1: Create a new teams object to avoid direct mutation
    const newTeams = JSON.parse(JSON.stringify(teams)) as typeof teams;

    // Step 2: Add player to the SUB position in the team
    const updatedPlayer = {
      ...player,
      team: teamId,
    };

    newTeams[teamId].players["SUB"].push(updatedPlayer);

    // Step 3: Update state with the new teams object
    setTeams(newTeams);

    // Step 4: Guardar en la base de datos
    try {
      // Determinar el orden (por ahora siempre al final)
      const order = newTeams[teamId].players["SUB"].length - 1;

      // Guardar la posición en la base de datos
      lineupApi.savePosition(teamId, playerId, "SUB", order);
    } catch (error) {
      console.error("Error al guardar posición en base de datos:", error);
    }
  };

  // Alternar la visibilidad del sistema de triaje
  const toggleDraftSystem = () => {
    setShowDraftSystem(!showDraftSystem);
  };

  // Actualizar el estado del triaje
  const handleDraftStateChange = (newState: DraftState) => {
    setIsDraftActive(newState.is_active);
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
              TriatApp ⚽️
            </h1>
            <p className="text-white/80">De NietakO para los chavales ❤️</p>
          </header>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
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
                    disabled={isDraftActive}
                    className="bg-red-600/90 hover:bg-red-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Reiniciar Equipos
                  </button>
                  <button
                    onClick={handleInitializeDb}
                    disabled={isInitializing || isDraftActive}
                    className="bg-blue-600/90 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isInitializing
                      ? "Inicializando..."
                      : "Inicializar Base de Datos"}
                  </button>
                  <Link
                    href="/players"
                    className={`bg-green-600/90 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm font-medium text-center transition-all duration-200 shadow-md hover:shadow-lg ${
                      isDraftActive ? "opacity-50 pointer-events-none" : ""
                    }`}
                  >
                    Gestionar Jugadores
                  </Link>
                  <button
                    onClick={toggleDraftSystem}
                    className={`${
                      showDraftSystem
                        ? "bg-yellow-500/90 hover:bg-yellow-600"
                        : "bg-purple-600/90 hover:bg-purple-700"
                    } text-white py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg`}
                  >
                    {showDraftSystem ? "Ocultar Triaje" : "Mostrar Triaje"}
                  </button>
                </div>

                {/* Mensaje de alerta durante triaje activo */}
                {isDraftActive && (
                  <div className="mt-4 bg-blue-500/80 text-white p-3 rounded-lg">
                    <p className="font-medium">
                      ⚠️ Triaje activo: Durante el triaje solo se pueden asignar
                      jugadores mediante el sistema de triaje.
                    </p>
                  </div>
                )}
              </div>

              {/* Sistema de Triaje */}
              {showDraftSystem && (
                <DraftSystem
                  availablePlayers={availablePlayers}
                  teams={teams}
                  onPlayerPicked={handleDraftPlayerPicked}
                  onTeamsReset={handleReset}
                  onDraftStateChange={handleDraftStateChange}
                />
              )}

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
                    isDropDisabled={isDraftActive}
                  />
                  <TeamContainer
                    team={teams.nietos}
                    onPlayerDrop={handlePlayerDrop}
                    onPlayerRemove={handleRemovePlayer}
                    isMobileView={isMobileView}
                    availablePlayers={availablePlayers}
                    isDropDisabled={isDraftActive}
                  />
                </div>

                {/* Jugadores Disponibles (Derecha) */}
                <div className="w-full lg:w-1/4">
                  <AvailablePlayers
                    players={availablePlayers}
                    isMobileView={isMobileView}
                    isDragDisabled={isDraftActive}
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
