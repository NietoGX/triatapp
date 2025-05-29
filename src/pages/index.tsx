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
import { createDefaultTeams, getAllTeamIds } from "@/lib/teams";
import { draftApi } from "@/lib/api";

// SVG Icons
const HomeIcon = () => (
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
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
);

const UsersIcon = () => (
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
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
    />
  </svg>
);

const CalendarIcon = () => (
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
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const ClockIcon = () => (
  <svg
    className="w-4 h-4"
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

const PlusIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4v16m8-8H4"
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
    className="w-4 h-4"
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

const DatabaseIcon = () => (
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
      d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
    />
  </svg>
);

export default function Home() {
  // Use mobile detection for touch vs mouse interactions
  const [isMobileView, setIsMobileView] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dbInitialized, setDbInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [showDraftSystem, setShowDraftSystem] = useState(false);
  const [isDraftActive, setIsDraftActive] = useState(false);
  const [currentDraftState, setCurrentDraftState] = useState<DraftState | null>(
    null
  );

  // Match state
  const [latestMatch, setLatestMatch] = useState<Match | null>(null);
  const [isCreateMatchModalOpen, setIsCreateMatchModalOpen] = useState(false);

  // Players and teams state
  const [players, setPlayers] = useState<AppPlayer[]>([]);
  const [teams, setTeams] = useState<{ [key: string]: Team }>(
    createDefaultTeams()
  );
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

      // If we have available players for this match, use them
      if (matchPlayers && matchPlayers.length > 0) {
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
        try {
          const lineups = await lineupApi.getAll(matchId);

          if (lineups && Object.keys(lineups).length > 0) {
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

            setPlayers(
              appPlayers.filter((player) => !assignedPlayerIds.has(player.id))
            );
          } else {
            // If no lineups exist for this match, show all available players for this match
            setPlayers(appPlayers);
            setTeams(createDefaultTeams());
          }
        } catch (error) {
          console.error("Error loading match lineups:", error);
          setPlayers(appPlayers);
          setTeams(createDefaultTeams());
        }
      } else {
        // If no specific players for this match, keep current players and load/reset lineups
        console.log(
          "No specific players for this match, keeping current players"
        );

        try {
          const lineups = await lineupApi.getAll(matchId);

          if (lineups && Object.keys(lineups).length > 0) {
            setTeams(lineups);

            // Filter out players already assigned to teams from current players
            const assignedPlayerIds = new Set<string>();

            Object.values(lineups).forEach((team) => {
              Object.values(team.players).forEach((positionPlayers) => {
                positionPlayers.forEach((player) => {
                  assignedPlayerIds.add(player.id);
                });
              });
            });

            setPlayers((currentPlayers) =>
              currentPlayers.filter(
                (player) => !assignedPlayerIds.has(player.id)
              )
            );
          } else {
            // Reset teams to default if no lineups exist
            setTeams(createDefaultTeams());
          }
        } catch (error) {
          console.error("Error loading match lineups:", error);
          setTeams(createDefaultTeams());
        }
      }
    } catch (error) {
      console.error(`Error loading data for match ${matchId}:`, error);
      // Don't override players on error, just reset teams
      setTeams(createDefaultTeams());
    }
  };

  // Load players, lineups and matches from database
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);

        // Always try to load players first
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
          setPlayers(appPlayers);
        } catch (error) {
          console.error("Error al cargar jugadores:", error);
          setPlayers([]);
        }

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
          } else {
            setLatestMatch(null);
          }
        } catch (error) {
          console.error("Error al cargar partidos:", error);
          setLatestMatch(null);
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

  // Load draft state independently of DraftSystem visibility
  const loadDraftState = async () => {
    if (!latestMatch?.id) return;

    try {
      const state = await draftApi.getState(latestMatch.id);
      setIsDraftActive(state.is_active);
      setCurrentDraftState(state);
    } catch (error) {
      console.error("Error loading draft state:", error);
    }
  };

  // Load draft state when latest match changes and set up polling
  useEffect(() => {
    if (latestMatch?.id) {
      loadDraftState();

      // Poll every 10 seconds to check for draft state changes
      const pollInterval = setInterval(loadDraftState, 10000);

      return () => clearInterval(pollInterval);
    } else {
      // Reset draft state if no match
      setIsDraftActive(false);
      setCurrentDraftState(null);
    }
  }, [latestMatch?.id]);

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
    let player: AppPlayer | undefined = players.find((p) => p.id === playerId);

    if (!player) {
      // If not in availablePlayers, look in teams
      const teamIds = getAllTeamIds();
      for (const tId of teamIds) {
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
      setPlayers((prev) => prev.filter((p) => p.id !== playerId));
    }

    // Step 3: Remove player from any team and position they might be in
    const teamIds = getAllTeamIds();
    for (const tId of teamIds) {
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
    const teamIds = getAllTeamIds();
    for (const teamId of teamIds) {
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
    setPlayers((prev) => [...prev, playerToAdd]);

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
    const teamIds = getAllTeamIds();
    for (const teamId of teamIds) {
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
    setTeams(createDefaultTeams());

    // Add all team players back to available players
    setPlayers((prev) => [...prev, ...allPlayers]);

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
    setIsInitializing(true);
    try {
      // Initialize teams first
      await teamApi.initialize();

      // Then initialize players
      const result = await playerApi.initialize();

      if (result.success) {
        setDbInitialized(true);
        // Reload data after initialization
        const dbPlayers = await playerApi.getAll();
        const appPlayers = dbPlayers.map((p) => ({
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
        setPlayers(appPlayers);
      }
    } catch (error) {
      console.error("Error initializing database:", error);
    } finally {
      setIsInitializing(false);
    }
  };

  // Handle when a player is picked in the draft system
  const handleDraftPlayerPicked = (playerId: string, teamId: string) => {
    // Find player in available players
    const player = players.find((p) => p.id === playerId);
    if (!player) return;

    // Get default position based on player's preferred position or SUB
    const position = player.position || "SUB";

    // Use a special function for draft picks that bypasses the draft active check
    handleDraftPlayerAddition(playerId, teamId, position);
  };

  // Special function to handle player additions during draft (bypasses draft active check)
  const handleDraftPlayerAddition = async (
    playerId: string,
    teamId: string,
    position: PlayerPosition
  ) => {
    // Find the player from available players or teams
    let player: AppPlayer | undefined = players.find((p) => p.id === playerId);

    if (!player) {
      // If not in availablePlayers, look in teams
      const teamIds = getAllTeamIds();
      for (const tId of teamIds) {
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
      setPlayers((prev) => prev.filter((p) => p.id !== playerId));
    }

    // Step 3: Remove player from any team and position they might be in
    const teamIds = getAllTeamIds();
    for (const tId of teamIds) {
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
        setTeams(createDefaultTeams());

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
        <title>TriatApp</title>
        <meta
          name="description"
          content="Sistema de triaje para partidos de fútbol"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-stone-800 to-stone-900">
        <div className="container mx-auto py-6 px-4">
          {/* Enhanced Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-green-600/20 rounded-xl">
                  <HomeIcon />
                </div>
                <h1 className="text-4xl font-bold text-white text-shadow-lg">
                  TriatApp ⚽️
                </h1>
              </div>

              {latestMatch ? (
                <div className="card-glass p-4 mb-4 max-w-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarIcon />
                    <h2 className="text-lg font-semibold text-green-300">
                      Próximo partido
                    </h2>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {latestMatch.name}
                  </h3>
                  <div className="flex items-center gap-2 text-gray-300 mb-3">
                    <ClockIcon />
                    <span className="text-sm">
                      {formatDate(latestMatch.date)}
                    </span>
                  </div>
                  <Link
                    href={`/matches/${latestMatch.id}`}
                    className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 text-sm font-medium transition-colors"
                  >
                    Ver detalles
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                </div>
              ) : (
                <div className="text-gray-300 mb-4 flex items-center gap-2">
                  <CalendarIcon />
                  <span>No hay partidos programados</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Link href="/players" className="btn-primary">
                <UsersIcon />
                Jugadores
              </Link>
              <Link href="/matches" className="btn-primary">
                <CalendarIcon />
                Partidos
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
                onClick={() => setIsCreateMatchModalOpen(true)}
                className="btn-success"
              >
                <PlusIcon />
                Nuevo Partido
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
                      {latestMatch
                        ? `Partido: ${latestMatch.name}`
                        : "Auto-actualización cada 10s"}
                    </div>
                  </div>
                  <div className="w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500 mb-4"></div>
              <p className="text-gray-300">Cargando aplicación...</p>
            </div>
          ) : players.length === 0 ? (
            /* No Players State */
            <div className="text-center py-16">
              <div className="mb-6">
                <DatabaseIcon />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">
                No hay jugadores registrados
              </h2>
              <p className="text-gray-300 mb-6 max-w-md mx-auto">
                Necesitas crear algunos jugadores para empezar a usar la
                aplicación.
              </p>
              <button
                onClick={handleInitializeDb}
                disabled={isInitializing}
                className="btn-primary btn-lg"
              >
                {isInitializing ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent"></div>
                    Inicializando...
                  </>
                ) : (
                  <>
                    <DatabaseIcon />
                    Inicializar Base de Datos
                  </>
                )}
              </button>
            </div>
          ) : !latestMatch ? (
            /* No Matches State */
            <div className="text-center py-16">
              <div className="mb-6">
                <CalendarIcon />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">
                No hay partidos creados
              </h2>
              <p className="text-gray-300 mb-6 max-w-md mx-auto">
                Crea tu primer partido para empezar a organizar las
                alineaciones.
              </p>
              <button
                onClick={() => setIsCreateMatchModalOpen(true)}
                className="btn-success btn-lg"
              >
                <PlusIcon />
                Crear Primer Partido
              </button>
            </div>
          ) : (
            /* Main Content */
            <>
              {showDraftSystem && (
                <div className="mb-8">
                  <DraftSystem
                    availablePlayers={players}
                    teams={teams}
                    matchId={latestMatch ? latestMatch.id : ""}
                    onDraftStateChange={handleDraftStateChange}
                    onPlayerPicked={handleDraftPlayerPicked}
                    onTeamsReset={handleReset}
                  />
                </div>
              )}

              {!showDraftSystem && latestMatch && (
                <div className="space-y-6">
                  {/* Match Header */}
                  <div className="card-glass p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                          Alineaciones para: {latestMatch.name}
                        </h2>
                        <div className="flex items-center gap-2 text-gray-300">
                          <ClockIcon />
                          <span className="text-sm">
                            {formatDate(latestMatch.date)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={handleReset}
                        className="btn-danger btn-sm"
                        disabled={isDraftActive}
                      >
                        <RefreshIcon />
                        Reiniciar Alineaciones
                      </button>
                    </div>
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
                            onPlayerDrop={handlePlayerDrop}
                            onPlayerRemove={handleRemovePlayer}
                            isMobileView={isMobileView}
                            availablePlayers={players}
                            isDropDisabled={isDraftActive}
                            onPositionClick={handlePositionClick}
                          />
                        ))}
                      </div>

                      {/* Available Players */}
                      <div className="w-full lg:w-1/4">
                        <AvailablePlayers
                          players={players}
                          isMobileView={isMobileView}
                          isDragDisabled={isDraftActive}
                        />
                      </div>
                    </div>

                    {/* Mobile Player Selection Modal */}
                    {selectedPosition && (
                      <PlayerSelectionModal
                        selectedPosition={selectedPosition.position}
                        availablePlayers={players}
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
