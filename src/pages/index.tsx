import { useState, useCallback, useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { v4 as uuidv4 } from "uuid";

import { Player, Position, Team } from "@/types";
import AvailablePlayers from "@/components/AvailablePlayers";
import TeamContainer from "@/components/TeamContainer";

// Datos de ejemplo para jugadores
const SAMPLE_PLAYERS: Player[] = [
  {
    id: uuidv4(),
    name: "Alexandre",
    avatar: "https://randomuser.me/api/portraits/men/1.jpg",
    rating: 86,
    position: undefined,
    team: null,
  },
  {
    id: uuidv4(),
    name: "Aitor",
    avatar: "https://randomuser.me/api/portraits/men/2.jpg",
    rating: 87,
    position: undefined,
    team: null,
  },
  {
    id: uuidv4(),
    name: "Rubert",
    avatar: "https://randomuser.me/api/portraits/men/3.jpg",
    rating: 85,
    position: undefined,
    team: null,
  },
  {
    id: uuidv4(),
    name: "Nieto",
    avatar: "https://randomuser.me/api/portraits/men/4.jpg",
    rating: 89,
    position: undefined,
    team: null,
  },
  {
    id: uuidv4(),
    name: "Eloy",
    avatar: "https://randomuser.me/api/portraits/men/5.jpg",
    rating: 84,
    position: undefined,
    team: null,
  },
  {
    id: uuidv4(),
    name: "Borja",
    avatar: "https://randomuser.me/api/portraits/men/6.jpg",
    rating: 88,
    position: undefined,
    team: null,
  },
  {
    id: uuidv4(),
    name: "Gilito",
    avatar: "https://randomuser.me/api/portraits/men/7.jpg",
    rating: 83,
    position: undefined,
    team: null,
  },
  {
    id: uuidv4(),
    name: "Sergi",
    avatar: "https://randomuser.me/api/portraits/men/8.jpg",
    rating: 85,
    position: undefined,
    team: null,
  },
  {
    id: uuidv4(),
    name: "Lluism",
    avatar: "https://randomuser.me/api/portraits/men/9.jpg",
    rating: 82,
    position: undefined,
    team: null,
  },
  {
    id: uuidv4(),
    name: "Seglar",
    avatar: "https://randomuser.me/api/portraits/men/10.jpg",
    rating: 84,
    position: undefined,
    team: null,
  },
  {
    id: uuidv4(),
    name: "Jordan",
    avatar: "https://randomuser.me/api/portraits/men/11.jpg",
    rating: 86,
    position: undefined,
    team: null,
  },
  {
    id: uuidv4(),
    name: "Albert",
    avatar: "https://randomuser.me/api/portraits/men/12.jpg",
    rating: 85,
    position: undefined,
    team: null,
  },
  {
    id: uuidv4(),
    name: "Jordi",
    avatar: "https://randomuser.me/api/portraits/men/13.jpg",
    rating: 83,
    position: undefined,
    team: null,
  },
  {
    id: uuidv4(),
    name: "Serrano",
    avatar: "https://randomuser.me/api/portraits/men/14.jpg",
    rating: 87,
    position: undefined,
    team: null,
  },
  {
    id: uuidv4(),
    name: "Lluis",
    avatar: "https://randomuser.me/api/portraits/men/15.jpg",
    rating: 84,
    position: undefined,
    team: null,
  },
  {
    id: uuidv4(),
    name: "Carlitros",
    avatar: "https://randomuser.me/api/portraits/men/16.jpg",
    rating: 85,
    position: undefined,
    team: null,
  },
];

// Estado inicial de equipos
const INITIAL_TEAMS: Team[] = [
  {
    id: "borjas",
    name: "Team Borjas",
    players: {
      GK: [], // Portero
      CL: [], // Central Izquierda
      CR: [], // Central Derecha
      ML: [], // Medio Izquierda
      MR: [], // Medio Derecha
      ST: [], // Delantero Pichichi
      SUB: [], // Suplentes
    },
  },
  {
    id: "nietos",
    name: "Team Nietos",
    players: {
      GK: [], // Portero
      CL: [], // Central Izquierda
      CR: [], // Central Derecha
      ML: [], // Medio Izquierda
      MR: [], // Medio Derecha
      ST: [], // Delantero Pichichi
      SUB: [], // Suplentes
    },
  },
];

export default function Home() {
  // Estado para controlar si estamos en el cliente
  const [isClient, setIsClient] = useState(false);

  // Inicializar con los valores por defecto
  const [availablePlayers, setAvailablePlayers] =
    useState<Player[]>(SAMPLE_PLAYERS);
  const [teams, setTeams] = useState<Team[]>(INITIAL_TEAMS);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  // Este useEffect se ejecuta sólo en el cliente después del primer render
  useEffect(() => {
    setIsClient(true);

    // Cargar datos del localStorage
    const storedPlayers = localStorage.getItem("triatapp-availablePlayers");
    const storedTeams = localStorage.getItem("triatapp-teams");

    if (storedPlayers) {
      setAvailablePlayers(JSON.parse(storedPlayers));
    }

    if (storedTeams) {
      setTeams(JSON.parse(storedTeams));
    }

    // Detectar si es un dispositivo móvil
    const detectMobile = () => {
      return (
        window.innerWidth <= 768 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        )
      );
    };

    setIsMobileDevice(detectMobile());

    const handleResize = () => {
      setIsMobileDevice(detectMobile());
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Guardar en localStorage cada vez que cambian (solo en cliente)
  useEffect(() => {
    if (isClient) {
      localStorage.setItem(
        "triatapp-availablePlayers",
        JSON.stringify(availablePlayers)
      );
    }
  }, [availablePlayers, isClient]);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem("triatapp-teams", JSON.stringify(teams));
    }
  }, [teams, isClient]);

  const handlePlayerDrop = useCallback(
    (playerId: string, teamId: "borjas" | "nietos", position: Position) => {
      // Encontrar al jugador en los disponibles
      const player = availablePlayers.find((p) => p.id === playerId);

      // Verificar si el jugador ya está en un equipo
      if (player?.team) {
        // Encontrar el equipo actual del jugador
        const currentTeam = teams.find((t) => t.id === player.team);
        if (currentTeam) {
          // Eliminar al jugador de su posición actual
          Object.keys(currentTeam.players).forEach((pos) => {
            const positionKey = pos as Position;
            currentTeam.players[positionKey] = currentTeam.players[
              positionKey
            ].filter((p) => p.id !== playerId);
          });
        }
      }

      if (player) {
        // Actualizar el atributo team del jugador
        player.team = teamId;

        // Añadir el jugador al nuevo equipo y posición
        const newTeam = teams.find((t) => t.id === teamId);
        if (newTeam) {
          const updatedPlayer = { ...player, position };

          // Asegurarse de que la posición existe en el equipo
          if (!newTeam.players[position]) {
            newTeam.players[position] = [];
          }

          newTeam.players[position].push(updatedPlayer);
        }

        // Actualizar los jugadores disponibles
        setAvailablePlayers(availablePlayers.filter((p) => p.id !== playerId));

        // Actualizar los equipos
        setTeams([...teams]);
      }
    },
    [availablePlayers, teams]
  );

  const handleRemovePlayer = useCallback(
    (playerOrId: Player | string) => {
      // Obtener el ID del jugador
      const playerId =
        typeof playerOrId === "string" ? playerOrId : playerOrId.id;

      // Buscar en qué equipo está el jugador
      for (const team of teams) {
        let playerFound = false;

        // Buscar en cada posición del equipo
        Object.keys(team.players).forEach((positionKey) => {
          const position = positionKey as Position;
          const playerIndex = team.players[position].findIndex(
            (p) => p.id === playerId
          );

          if (playerIndex !== -1) {
            // Obtener el jugador
            const player = team.players[position][playerIndex];

            // Eliminar al jugador de su posición
            team.players[position].splice(playerIndex, 1);
            playerFound = true;

            // Resetear el atributo team del jugador
            player.team = null;

            // Añadir de nuevo a disponibles
            setAvailablePlayers([...availablePlayers, player]);
          }
        });

        if (playerFound) break;
      }

      // Actualizar los equipos
      setTeams([...teams]);
    },
    [availablePlayers, teams]
  );

  const handleReset = useCallback(() => {
    setAvailablePlayers(SAMPLE_PLAYERS.map((p) => ({ ...p, team: null })));
    setTeams(INITIAL_TEAMS);

    if (isClient) {
      localStorage.removeItem("triatapp-availablePlayers");
      localStorage.removeItem("triatapp-teams");
    }
  }, [isClient]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black bg-field-pattern p-2 sm:p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col justify-between mb-4 sm:mb-6 md:flex-row">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 md:mb-0 text-center md:text-left drop-shadow-lg">
              TriatAPP
            </h1>
            <button
              onClick={handleReset}
              className="bg-gray-800/80 hover:bg-gray-700/80 text-white py-1 sm:py-2 px-3 sm:px-4 rounded-md shadow-md transition-colors backdrop-blur-sm text-sm sm:text-base"
            >
              Reiniciar TriatAPP
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            <div className="md:col-span-1 order-3 md:order-1">
              <AvailablePlayers
                players={availablePlayers}
                onPlayerDrop={handleRemovePlayer}
                isMobileView={isMobileDevice}
              />
            </div>

            <div className="md:col-span-1 order-1 md:order-2">
              <TeamContainer
                team={teams[0]}
                onPlayerDrop={handlePlayerDrop}
                isMobileView={isMobileDevice}
                availablePlayers={availablePlayers}
              />
            </div>

            <div className="md:col-span-1 order-2 md:order-3">
              <TeamContainer
                team={teams[1]}
                onPlayerDrop={handlePlayerDrop}
                isMobileView={isMobileDevice}
                availablePlayers={availablePlayers}
              />
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}
