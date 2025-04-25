import { useDrag, useDrop } from "react-dnd";
import { Player, Position, Team } from "@/types";
import { useRef, useEffect, useState } from "react";

interface TeamContainerProps {
  team: Team;
  onPlayerDrop: (
    playerId: string,
    teamId: "borjas" | "nietos",
    position: Position
  ) => void;
  onPlayerRemove: (playerId: string) => void;
  isMobileView?: boolean;
  availablePlayers?: Player[];
}

export const TeamContainer = ({
  team,
  onPlayerDrop,
  onPlayerRemove,
  isMobileView = false,
  availablePlayers = [],
}: TeamContainerProps) => {
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(
    null
  );

  // Asegurarnos de que todas las posiciones existen en el objeto team.players
  useEffect(() => {
    const positions: Position[] = ["GK", "CL", "CR", "ML", "MR", "ST", "SUB"];
    positions.forEach((pos) => {
      if (!team.players[pos]) {
        team.players[pos] = [];
      }
    });
  }, [team]);

  const getPositionColor = (position: Position) => {
    switch (position) {
      case "GK":
        return "bg-yellow-400/80";
      case "CL":
      case "CR":
        return "bg-blue-400/80";
      case "ML":
      case "MR":
        return "bg-green-500/80";
      case "ST":
        return "bg-red-600/80";
      case "SUB":
        return "bg-gray-400/80";
      default:
        return "bg-gray-200/80";
    }
  };

  const getPositionName = (position: Position) => {
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
  };

  const handlePositionClick = (position: Position) => {
    if (isMobileView) {
      // Si ya está seleccionada, la deseleccionamos
      if (selectedPosition === position) {
        setSelectedPosition(null);
      } else {
        setSelectedPosition(position);
      }
    }
  };

  const handlePlayerSelect = (player: Player, position: Position) => {
    if (isMobileView && selectedPosition) {
      onPlayerDrop(player.id, team.id, position);
      setSelectedPosition(null);
    }
  };

  // Componente jugador con drag habilitado
  const DraggablePlayerCard = ({ player }: { player: Player }) => {
    const divRef = useRef<HTMLDivElement>(null);
    const [collected, connectDrag] = useDrag<
      Player,
      unknown,
      { isDragging: boolean }
    >({
      type: "player",
      item: player,
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
    });

    // Connect the drag ref to our div ref
    useEffect(() => {
      if (divRef.current) {
        connectDrag(divRef);
      }
    }, [connectDrag]);

    const isDragging = collected.isDragging;

    return (
      <div
        ref={divRef}
        className={`${
          team.id === "borjas" ? "bg-red-600" : "bg-purple-600"
        } rounded-lg shadow-md p-2 sm:p-3 flex flex-col items-center min-w-[90px] sm:min-w-[100px] ${
          isDragging ? "opacity-50" : "opacity-100"
        } cursor-move relative group`}
      >
        <div
          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity z-10"
          onClick={(e) => {
            e.stopPropagation();
            onPlayerRemove(player.id);
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="bg-black/50 rounded-full w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center mb-1">
          <p className="text-white font-bold text-lg">{player.rating}</p>
        </div>
        <p className="text-white font-bold text-sm sm:text-base text-center truncate w-full">
          {player.name}
        </p>
        {player.stats && (
          <div className="mt-1 flex items-center justify-center space-x-2 text-white/80 text-xs">
            {player.position === "GK" ? (
              <span title="Saves">{player.stats.saves} S</span>
            ) : (
              <>
                <span title="Goals">{player.stats.goals} G</span>
                <span title="Assists">{player.stats.assists} A</span>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  const PositionDropZone = ({
    position,
    maxPlayers,
    className = "",
  }: {
    position: Position;
    maxPlayers: number;
    className?: string;
  }) => {
    const dropZoneRef = useRef<HTMLDivElement>(null);

    // Asegurarse de que la posición exista en el equipo
    if (!team.players[position]) {
      team.players[position] = [];
    }

    // Crear una lista de IDs de jugadores únicas
    const uniquePlayerIds = Array.from(
      new Set(team.players[position].map((player) => player.id))
    );

    // Filtrar jugadores duplicados manteniendo sólo la primera ocurrencia
    const uniquePlayers = uniquePlayerIds.map(
      (id) => team.players[position].find((player) => player.id === id)!
    );

    const [collected, drop] = useDrop<
      Player,
      { team: string; position: Position },
      { isOver: boolean; canDrop: boolean }
    >({
      accept: "player",
      drop: (item: Player) => {
        onPlayerDrop(item.id, team.id, position);
        return { team: team.id, position };
      },
      canDrop: () => uniquePlayers.length < maxPlayers,
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
        canDrop: !!monitor.canDrop(),
      }),
    });

    const isOver = collected.isOver;
    const canDrop = collected.canDrop;
    const activeDropZone = isOver && canDrop;
    const canAddMore = uniquePlayers.length < maxPlayers;

    // Conectar el ref al elemento DOM
    useEffect(() => {
      if (dropZoneRef.current) {
        drop(dropZoneRef.current);
      }
    }, [drop]);

    return (
      <div className={`mb-1 sm:mb-2 ${className}`}>
        <div
          onClick={() => handlePositionClick(position)}
          className={`flex items-center justify-between mb-1 ${getPositionColor(
            position
          )} px-2 sm:px-3 py-0.5 sm:py-1 rounded-md shadow-md ${
            isMobileView ? "cursor-pointer" : ""
          } ${selectedPosition === position ? "ring-2 ring-white" : ""}`}
        >
          <p className="font-bold text-white drop-shadow text-xs sm:text-sm truncate">
            {getPositionName(position)}
          </p>
          <p className="ml-1 sm:ml-2 text-xs text-white">
            {uniquePlayers.length}/{maxPlayers}
          </p>
        </div>

        <div
          ref={dropZoneRef}
          onClick={() => isMobileView && handlePositionClick(position)}
          className={`min-h-[120px] sm:min-h-[140px] ${
            activeDropZone ? "bg-field-light/70" : "bg-field-dark/70"
          } backdrop-blur-sm rounded-md p-1 sm:p-2 border ${
            activeDropZone ? "border-white/80 border-2" : "border-white/10"
          } shadow-md transition-all duration-200 flex flex-wrap gap-1 sm:gap-2 items-center justify-center ${
            isMobileView ? "cursor-pointer" : ""
          }`}
        >
          {uniquePlayers.length === 0 ? (
            <p className="text-white/60 text-xs sm:text-sm text-center">
              {isMobileView
                ? "Toca para añadir jugadores"
                : "Arrastra jugadores aquí"}
            </p>
          ) : position === "SUB" ? (
            <div className="flex flex-wrap gap-2 justify-center w-full">
              {uniquePlayers.map((player) => (
                <DraggablePlayerCard key={player.id} player={player} />
              ))}
            </div>
          ) : (
            <div className="flex justify-center w-full">
              {uniquePlayers.map((player) => (
                <DraggablePlayerCard key={player.id} player={player} />
              ))}
            </div>
          )}
        </div>

        {/* Selector de jugadores para móvil */}
        {isMobileView && selectedPosition === position && canAddMore && (
          <div className="fixed inset-0 bg-black/80 z-50 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h4 className="text-white text-lg font-bold">
                {getPositionName(position)} - Selecciona un jugador
              </h4>
              <button
                onClick={() => setSelectedPosition(null)}
                className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-full"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {availablePlayers.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-white/70 text-lg">
                    No hay jugadores disponibles
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {availablePlayers.map((player) => (
                    <div
                      key={player.id}
                      onClick={() => handlePlayerSelect(player, position)}
                      className="bg-gray-800 hover:bg-gray-700 text-white p-4 rounded-lg cursor-pointer shadow-md"
                    >
                      <div className="flex items-center">
                        <span className="bg-yellow-500 text-black rounded-full w-10 h-10 flex items-center justify-center mr-3 text-lg font-bold">
                          {player.rating}
                        </span>
                        <span className="text-lg">{player.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-white/10">
              <button
                onClick={() => setSelectedPosition(null)}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg text-base font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const teamBgClass =
    team.id === "borjas"
      ? "from-red-600/50 to-red-800/50"
      : "from-purple-600/50 to-purple-800/50";
  const teamTextColor =
    team.id === "borjas" ? "text-red-100" : "text-purple-100";

  return (
    <div
      className={`bg-gradient-to-br ${teamBgClass} backdrop-blur-sm rounded-xl p-2 sm:p-4 border border-white/10 shadow-lg`}
    >
      <h2
        className={`text-xl sm:text-2xl font-bold mb-2 sm:mb-3 text-center ${teamTextColor} drop-shadow-lg`}
      >
        {team.name}
      </h2>

      <div className="relative pb-2 sm:pb-4">
        {/* Campo de fútbol */}
        <div className="absolute inset-0 bg-field rounded-lg opacity-75 z-0"></div>

        {/* Líneas del campo */}
        <div className="absolute inset-0 z-0">
          <div className="absolute w-full h-[1px] top-1/2 bg-white/20"></div>
          <div className="absolute w-[1px] h-full left-1/2 bg-white/20"></div>
          <div className="absolute w-20 h-20 sm:w-32 sm:h-32 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-[1px] border-white/20 rounded-full"></div>
          <div className="absolute w-24 h-24 sm:w-40 sm:h-40 -top-4 sm:-top-6 left-1/2 -translate-x-1/2 border-b-[1px] border-white/20 rounded-b-full"></div>
          <div className="absolute w-24 h-24 sm:w-40 sm:h-40 -bottom-4 sm:-bottom-6 left-1/2 -translate-x-1/2 border-t-[1px] border-white/20 rounded-t-full"></div>
        </div>

        {/* Estructura de alineación 6 jugadores */}
        <div className="grid grid-cols-4 gap-1 sm:gap-2 relative z-1">
          {/* Portero */}
          <div className="col-span-4 flex justify-center">
            <div className="w-full max-w-[120px] sm:max-w-[140px]">
              <PositionDropZone position="GK" maxPlayers={1} />
            </div>
          </div>

          {/* Defensa - 2 Centrales */}
          <div className="col-span-2 flex justify-center">
            <div className="w-full">
              <PositionDropZone position="CL" maxPlayers={1} />
            </div>
          </div>

          <div className="col-span-2 flex justify-center">
            <div className="w-full">
              <PositionDropZone position="CR" maxPlayers={1} />
            </div>
          </div>

          {/* Medio Campo - 2 Medios */}
          <div className="col-span-2 flex justify-center">
            <div className="w-full">
              <PositionDropZone position="ML" maxPlayers={1} />
            </div>
          </div>

          <div className="col-span-2 flex justify-center">
            <div className="w-full">
              <PositionDropZone position="MR" maxPlayers={1} />
            </div>
          </div>

          {/* Delantero */}
          <div className="col-span-4 flex justify-center">
            <div className="w-full max-w-[120px] sm:max-w-[140px]">
              <PositionDropZone position="ST" maxPlayers={1} />
            </div>
          </div>
        </div>

        {/* Suplentes */}
        <div className="mt-2 sm:mt-4">
          <PositionDropZone position="SUB" maxPlayers={10} />
        </div>
      </div>
    </div>
  );
};

export default TeamContainer;
