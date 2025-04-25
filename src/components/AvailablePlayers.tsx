import { useDrag } from "react-dnd";
import { AppPlayer, PlayerPosition } from "@/types";
import { useRef, useEffect, useState } from "react";

interface AvailablePlayersProps {
  players: AppPlayer[];
  onPlayerDrop?: (player: AppPlayer) => void;
  isMobileView?: boolean;
  isDragDisabled?: boolean;
}

export const AvailablePlayers = ({
  players,
  onPlayerDrop,
  isMobileView = false,
  isDragDisabled = false,
}: AvailablePlayersProps) => {
  const [selectedPlayer, setSelectedPlayer] = useState<AppPlayer | null>(null);

  // Función para obtener el nombre de posición en español
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

  const handlePlayerClick = (player: AppPlayer, e: React.MouseEvent) => {
    e.stopPropagation();

    if (isMobileView && onPlayerDrop) {
      // En móviles, mantener el comportamiento de seleccionar para asignar
      onPlayerDrop(player);
    } else {
      // En otros casos, mostrar modal de información
      setSelectedPlayer(player);
    }
  };

  // Componente de tarjeta de jugador arrastrable
  const DraggablePlayerCard = ({
    player,
    isDragDisabled,
  }: {
    player: AppPlayer;
    isDragDisabled?: boolean;
  }) => {
    const divRef = useRef<HTMLDivElement>(null);
    const [{ isDragging }, drag] = useDrag(
      () => ({
        type: "PLAYER",
        item: { id: player.id },
        collect: (monitor) => ({
          isDragging: !!monitor.isDragging(),
        }),
        canDrag: !isDragDisabled,
      }),
      [player.id, isDragDisabled]
    );

    // Connect the drag ref to our div ref
    useEffect(() => {
      if (divRef.current) {
        drag(divRef);
      }
    }, [drag]);

    const dragClass = isDragging ? "opacity-50" : "";
    const disabledClass = isDragDisabled
      ? "cursor-not-allowed opacity-70"
      : "cursor-grab";

    return (
      <div
        ref={divRef}
        onClick={(e) => handlePlayerClick(player, e)}
        className={`bg-gray-800/80 backdrop-blur-sm rounded-lg p-3 shadow-md ${dragClass} ${disabledClass} hover:bg-gray-700/90 transition-all duration-200 border border-white/5`}
      >
        <div className="flex justify-between items-start mb-1.5">
          <div className="font-medium text-white">{player.name}</div>
          <div className="text-yellow-400 text-sm">⭐ {player.rating}</div>
        </div>
        <div className="text-sm text-blue-300">
          {player.position ? player.position : "Sin posición"}
        </div>
        <div className="mt-1 text-xs text-gray-400 flex space-x-1.5">
          <span>G: {player.stats?.goals || 0}</span>
          <span>A: {player.stats?.assists || 0}</span>
          {(player.position === "GK" || player.stats?.saves > 0) && (
            <>
              <span>P: {player.stats?.saves || 0}</span>
              <span>GP: {player.stats?.goalsSaved || 0}</span>
            </>
          )}
        </div>
      </div>
    );
  };

  // Modal para mostrar información detallada del jugador
  const PlayerInfoModal = () => {
    if (!selectedPlayer) return null;

    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900/90 backdrop-blur-md rounded-xl max-w-md w-full shadow-lg overflow-hidden">
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

  // Grupo los jugadores por posición para mostrarlos ordenados
  const groupedPlayers: { [key: string]: AppPlayer[] } = {
    Porteros: players.filter((p) => p.position === "GK"),
    Defensas: players.filter((p) => p.position === "CL" || p.position === "CR"),
    Mediocampistas: players.filter(
      (p) => p.position === "ML" || p.position === "MR"
    ),
    Delanteros: players.filter((p) => p.position === "ST"),
    Otros: players.filter(
      (p) =>
        !p.position ||
        !["GK", "CL", "CR", "ML", "MR", "ST"].includes(p.position)
    ),
  };

  // Eliminar categorías vacías
  Object.keys(groupedPlayers).forEach((key) => {
    if (groupedPlayers[key].length === 0) {
      delete groupedPlayers[key];
    }
  });

  return (
    <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/10 shadow-lg">
      <h3 className="text-xl font-semibold mb-4 text-white">
        Jugadores Disponibles {isDragDisabled && "(Triaje activo)"}
      </h3>

      {Object.keys(groupedPlayers).length === 0 ? (
        <p className="text-gray-400 text-center py-4">
          No hay jugadores disponibles
        </p>
      ) : (
        <div className="space-y-5">
          {Object.entries(groupedPlayers).map(([category, categoryPlayers]) => (
            <div key={category}>
              <h4 className="text-white/80 text-sm font-medium mb-2">
                {category} ({categoryPlayers.length})
              </h4>
              <div className="space-y-2">
                {categoryPlayers.map((player) => (
                  <DraggablePlayerCard
                    key={player.id}
                    player={player}
                    isDragDisabled={isDragDisabled}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de información del jugador */}
      {selectedPlayer && <PlayerInfoModal />}
    </div>
  );
};

export default AvailablePlayers;
