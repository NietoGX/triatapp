import { useDrag, useDrop } from "react-dnd";
import { AppPlayer, PlayerPosition, Team } from "@/types";
import { useRef, useEffect, useState } from "react";
import {
  getTeamColor,
  getTeamBorderColor,
  getTeamTextColor,
  getTeamBorderSolidColor,
} from "@/lib/teams";

interface TeamContainerProps {
  team: Team;
  onPlayerDrop: (
    playerId: string,
    teamId: string,
    position: PlayerPosition
  ) => void;
  onPlayerRemove: (playerId: string) => void;
  isMobileView?: boolean;
  availablePlayers?: AppPlayer[];
  isDropDisabled?: boolean;
  onPositionClick?: (position: PlayerPosition, teamId: string) => void;
}

export const TeamContainer = ({
  team,
  onPlayerDrop,
  onPlayerRemove,
  isMobileView = false,
  isDropDisabled = false,
  onPositionClick,
}: TeamContainerProps) => {
  const [selectedPlayer, setSelectedPlayer] = useState<AppPlayer | null>(null);
  const [selectedPosition, setSelectedPosition] =
    useState<PlayerPosition | null>(null);

  // Asegurarnos de que todas las posiciones existen en el objeto team.players
  useEffect(() => {
    const positions: PlayerPosition[] = [
      "GK",
      "CL",
      "CR",
      "ML",
      "MR",
      "ST",
      "SUB",
    ];
    positions.forEach((pos) => {
      if (!team.players[pos]) {
        team.players[pos] = [];
      }
    });
  }, [team]);

  const getPositionColor = (position: PlayerPosition) => {
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

  const getPositionName = (position: PlayerPosition) => {
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

  const handlePositionClick = (position: PlayerPosition) => {
    if (isMobileView && !isDropDisabled) {
      // Si ya está seleccionada, la deseleccionamos
      if (selectedPosition === position) {
        setSelectedPosition(null);
        onPositionClick?.(position, team.id);
      } else {
        setSelectedPosition(position);
        onPositionClick?.(position, team.id);
      }
    }
  };

  const handlePlayerClick = (player: AppPlayer, e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que se active el onClick del PositionDropZone
    setSelectedPlayer(player);
  };

  // Componente jugador con drag habilitado
  const DraggablePlayerCard = ({ player }: { player: AppPlayer }) => {
    const divRef = useRef<HTMLDivElement>(null);
    const [{ isDragging }, connectDrag] = useDrag(
      () => ({
        type: "PLAYER",
        item: { id: player.id },
        collect: (monitor) => ({
          isDragging: !!monitor.isDragging(),
        }),
        canDrag: !isDropDisabled,
      }),
      [player.id, isDropDisabled]
    );

    // Connect the drag ref to our div ref
    useEffect(() => {
      if (divRef.current) {
        connectDrag(divRef);
      }
    }, [connectDrag]);

    const disabledClass = isDropDisabled ? "opacity-70" : "";
    const teamColor = getTeamColor(team.id);

    return (
      <div
        ref={divRef}
        onClick={(e) => handlePlayerClick(player, e)}
        className={`${teamColor} rounded-lg shadow-md p-2 sm:p-3 flex flex-col items-center justify-center w-full h-full ${
          isDragging ? "opacity-50" : "opacity-100"
        } cursor-pointer relative group ${disabledClass}`}
      >
        <div
          className={`absolute -top-2 -right-2 bg-red-500 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center cursor-pointer ${
            isDropDisabled ? "hidden" : "opacity-0 group-hover:opacity-100"
          } transition-opacity z-10`}
          onClick={(e) => {
            if (isDropDisabled) return;
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
        <div className="bg-black/50 rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center mb-2">
          <p className="text-white font-bold text-xl">{player.rating}</p>
        </div>
        <p className="text-white font-bold text-sm sm:text-base text-center w-full mb-1">
          {player.name}
        </p>
        {player.stats && (
          <div className="flex items-center justify-center space-x-2 text-white/80 text-xs">
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
    position: PlayerPosition;
    maxPlayers: number;
    className?: string;
  }) => {
    const dropZoneRef = useRef<HTMLDivElement>(null);

    // Asegurarse de que la posición exista en el equipo
    if (!team.players[position]) {
      team.players[position] = [];
    }

    const positionColor = getPositionColor(position);
    const positionName = getPositionName(position);
    const isActive = selectedPosition === position;

    // React DnD hook para permitir soltar jugadores
    const [{ isOver }, drop] = useDrop(
      () => ({
        accept: "PLAYER",
        canDrop: () => !isDropDisabled,
        drop: (item: { id: string }) => {
          if (isDropDisabled) return;
          onPlayerDrop(item.id, team.id, position);
        },
        collect: (monitor) => ({
          isOver: !!monitor.isOver() && !isDropDisabled,
        }),
      }),
      [team.id, position, onPlayerDrop, isDropDisabled]
    );

    // Connect the drop ref to our div ref
    useEffect(() => {
      if (dropZoneRef.current) {
        drop(dropZoneRef);
      }
    }, [drop]);

    // Clases para resaltar cuando se está arrastrando encima
    const dropHighlight = isOver
      ? "border-yellow-300 bg-black/40"
      : "border-gray-700/50";
    const activeHighlight = isActive ? "border-blue-500" : "";
    const disabledClass = isDropDisabled ? "opacity-70 cursor-not-allowed" : "";

    return (
      <div
        ref={dropZoneRef}
        className={`${className} ${positionColor} p-2 sm:p-3 rounded-lg ${dropHighlight} ${activeHighlight} ${disabledClass} transition-colors border-2 hover:border-white/30`}
        onClick={() => handlePositionClick(position)}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-black font-bold text-sm sm:text-base">
            {positionName}
          </h3>
          <span className="text-black/80 font-bold text-xs">
            {team.players[position].length}/{maxPlayers}
          </span>
        </div>

        <div
          className={`w-full grid gap-2 ${
            position === "SUB" ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1"
          }`}
        >
          {team.players[position].map((player) => (
            <DraggablePlayerCard key={player.id} player={player} />
          ))}

          {/* Espacios vacíos para completar la cuadrícula */}
          {Array.from(
            { length: maxPlayers - team.players[position].length },
            (_, i) => (
              <div
                key={`empty-${position}-${i}`}
                className={`border-2 border-dashed ${
                  isOver ? "border-yellow-300" : "border-white/20"
                } rounded-lg min-h-[80px] sm:min-h-[100px] flex items-center justify-center ${
                  isActive ? "bg-blue-500/30" : "bg-black/20"
                } ${isDropDisabled ? "opacity-50" : ""}`}
              >
                {isActive ? (
                  <p className="text-blue-200 text-xs text-center px-2">
                    Haz clic para seleccionar jugador
                  </p>
                ) : isDropDisabled ? (
                  <p className="text-gray-400 text-xs text-center px-2">
                    Triaje activo
                  </p>
                ) : (
                  <p className="text-gray-400 text-xs text-center px-2">
                    Coloca un jugador aquí
                  </p>
                )}
              </div>
            )
          )}
        </div>
      </div>
    );
  };

  const getTeamRating = () => {
    // Obtener los jugadores no suplentes
    const startingPlayers = Object.entries(team.players)
      .filter(([pos]) => pos !== "SUB")
      .flatMap(([, players]) => players);

    // Calcular la media si hay jugadores
    if (startingPlayers.length > 0) {
      const totalRating = startingPlayers.reduce(
        (sum, player) => sum + player.rating,
        0
      );
      return (totalRating / startingPlayers.length).toFixed(1);
    }
    return "-";
  };

  // Modal para mostrar información detallada del jugador
  const PlayerInfoModal = () => {
    if (!selectedPlayer) return null;

    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
        <div className="bg-stone-900/90 backdrop-blur-md rounded-xl max-w-md w-full shadow-lg overflow-hidden">
          <div className="p-5">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">
                  {selectedPlayer.name}
                </h3>
                {selectedPlayer.nickname && (
                  <p className="text-gray-300 text-sm">
                    &ldquo;{selectedPlayer.nickname}&rdquo;
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedPlayer(null)}
                className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-full"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            <div className="flex items-center mb-6">
              <div className="bg-yellow-500 text-black rounded-full w-16 h-16 flex items-center justify-center mr-4">
                <span className="text-3xl font-bold">
                  {selectedPlayer.rating}
                </span>
              </div>
              <div>
                <p className="text-white font-semibold">
                  {selectedPlayer.position
                    ? getPositionName(selectedPlayer.position)
                    : "Sin posición"}
                </p>
                {selectedPlayer.number && (
                  <p className="text-gray-300 text-sm">
                    Dorsal: {selectedPlayer.number}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-black/40 rounded-lg p-4 mb-4">
              <h4 className="text-white font-semibold mb-3">Estadísticas</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-800/80 rounded-md p-2">
                  <p className="text-gray-400 text-xs">Goles</p>
                  <p className="text-white text-xl font-semibold">
                    {selectedPlayer.stats?.goals || 0}
                  </p>
                </div>
                <div className="bg-gray-800/80 rounded-md p-2">
                  <p className="text-gray-400 text-xs">Asistencias</p>
                  <p className="text-white text-xl font-semibold">
                    {selectedPlayer.stats?.assists || 0}
                  </p>
                </div>
                <div className="bg-gray-800/80 rounded-md p-2">
                  <p className="text-gray-400 text-xs">Paradas</p>
                  <p className="text-white text-xl font-semibold">
                    {selectedPlayer.stats?.saves || 0}
                  </p>
                </div>
                <div className="bg-gray-800/80 rounded-md p-2">
                  <p className="text-gray-400 text-xs">Goles salvados</p>
                  <p className="text-white text-xl font-semibold">
                    {selectedPlayer.stats?.goalsSaved || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedPlayer(null)}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`${getTeamBorderColor(
        team.id
      )} border rounded-2xl bg-black/20 backdrop-blur-md p-3 sm:p-4 shadow-lg relative overflow-hidden`}
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3
            className={`font-bold text-lg sm:text-xl ${getTeamTextColor(
              team.id
            )}`}
          >
            {team.name}
          </h3>
          <div className="flex items-center">
            <span className="text-xs text-white/60 mr-1">Media:</span>
            <span
              className={`bg-black/50 text-white text-sm px-2 py-0.5 rounded-md ${getTeamBorderSolidColor(
                team.id
              )} border`}
            >
              {getTeamRating()}
            </span>
          </div>
        </div>

        {/* Campo de fútbol */}
        <div className="relative pb-8 sm:pb-10">
          {/* Fondo del campo */}
          <div className="absolute inset-0 bg-green-800/50 rounded-xl opacity-75 z-0"></div>

          {/* Líneas del campo */}
          <div className="absolute inset-0 z-0 rounded-xl overflow-hidden">
            <div className="absolute w-full h-[1px] top-1/2 bg-white/30"></div>
            <div className="absolute w-[1px] h-full left-1/2 bg-white/30"></div>
            {/* Círculo central */}
            <div className="absolute w-16 h-16 sm:w-24 sm:h-24 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-[1px] border-white/30 rounded-full"></div>
            {/* Área grande superior */}
            <div className="absolute w-32 h-16 sm:w-48 sm:h-24 top-0 left-1/2 -translate-x-1/2 border-b-[1px] border-l-[1px] border-r-[1px] border-white/30 rounded-b-xl"></div>
            {/* Área grande inferior */}
            <div className="absolute w-32 h-16 sm:w-48 sm:h-24 bottom-0 left-1/2 -translate-x-1/2 border-t-[1px] border-l-[1px] border-r-[1px] border-white/30 rounded-t-xl"></div>
            {/* Área pequeña superior */}
            <div className="absolute w-16 h-8 sm:w-24 sm:h-12 top-0 left-1/2 -translate-x-1/2 border-b-[1px] border-l-[1px] border-r-[1px] border-white/30 rounded-b-lg"></div>
            {/* Área pequeña inferior */}
            <div className="absolute w-16 h-8 sm:w-24 sm:h-12 bottom-0 left-1/2 -translate-x-1/2 border-t-[1px] border-l-[1px] border-r-[1px] border-white/30 rounded-t-lg"></div>
          </div>

          {/* Estructura de alineación en forma de campo de fútbol */}
          <div className="grid grid-rows-4 gap-4 sm:gap-6 relative z-10 pt-4 pb-4">
            {/* Portero */}
            <div className="row-start-4 flex justify-center">
              <div className="w-full max-w-[120px] sm:max-w-[140px]">
                <PositionDropZone position="GK" maxPlayers={1} />
              </div>
            </div>

            {/* Defensas */}
            <div className="row-start-3 flex justify-between px-2 sm:px-4">
              <div className="w-[45%]">
                <PositionDropZone position="CL" maxPlayers={1} />
              </div>
              <div className="w-[45%]">
                <PositionDropZone position="CR" maxPlayers={1} />
              </div>
            </div>

            {/* Medios */}
            <div className="row-start-2 flex justify-between px-2 sm:px-4">
              <div className="w-[45%]">
                <PositionDropZone position="ML" maxPlayers={1} />
              </div>
              <div className="w-[45%]">
                <PositionDropZone position="MR" maxPlayers={1} />
              </div>
            </div>

            {/* Delantero */}
            <div className="row-start-1 flex justify-center">
              <div className="w-full max-w-[120px] sm:max-w-[140px]">
                <PositionDropZone position="ST" maxPlayers={1} />
              </div>
            </div>
          </div>
        </div>

        {/* Suplentes */}
        <div className="mt-3">
          <PositionDropZone
            position="SUB"
            maxPlayers={5}
            className="bg-gray-700/30"
          />
        </div>
      </div>

      {/* Modal de información del jugador */}
      {selectedPlayer && <PlayerInfoModal />}
    </div>
  );
};

// Modal para selección de jugadores (fuera del componente TeamContainer)
export const PlayerSelectionModal = ({
  selectedPosition,
  availablePlayers,
  onPlayerSelect,
  onClose,
  getPositionName,
}: {
  selectedPosition: PlayerPosition | null;
  availablePlayers: AppPlayer[];
  onPlayerSelect: (player: AppPlayer, position: PlayerPosition) => void;
  onClose: () => void;
  getPositionName: (position: PlayerPosition) => string;
}) => {
  if (!selectedPosition || availablePlayers.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex flex-col overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-stone-900/90">
        <h4 className="text-white text-lg font-bold">
          {getPositionName(selectedPosition)} - Elige un jugador
        </h4>
        <button
          onClick={onClose}
          className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-full transition-colors"
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

      <div className="flex-1 overflow-y-auto bg-stone-900/80">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-4">
          {availablePlayers.map((player) => (
            <div
              key={player.id}
              onClick={() => onPlayerSelect(player, selectedPosition)}
              className="bg-gray-800/80 backdrop-blur-sm hover:bg-gray-700 text-white p-4 rounded-lg cursor-pointer shadow-md transition-colors"
            >
              <div className="flex items-center">
                <span className="bg-yellow-500 text-black rounded-full w-10 h-10 flex items-center justify-center mr-3 text-lg font-bold">
                  {player.rating}
                </span>
                <div>
                  <span className="text-lg block">{player.name}</span>
                  <span className="text-sm text-gray-400">
                    {player.position || "Sin posición"}
                  </span>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-400 flex space-x-2">
                <span>G: {player.stats?.goals || 0}</span>
                <span>A: {player.stats?.assists || 0}</span>
                <span>P: {player.stats?.saves || 0}</span>
                <span>GP: {player.stats?.goalsSaved || 0}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-white/10 bg-stone-900/90">
        <button
          onClick={onClose}
          className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg text-base font-medium transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default TeamContainer;
