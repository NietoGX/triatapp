import { useDrag } from "react-dnd";
import { AppPlayer, PlayerPosition } from "@/types";
import { useRef, useEffect, useState } from "react";

interface AvailablePlayersProps {
  players: AppPlayer[];
  onPlayerDrop?: (player: AppPlayer) => void;
  isMobileView?: boolean;
}

export const AvailablePlayers = ({
  players,
  onPlayerDrop,
  isMobileView = false,
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
  const DraggablePlayerCard = ({ player }: { player: AppPlayer }) => {
    const divRef = useRef<HTMLDivElement>(null);
    const [{ isDragging }, connectDrag] = useDrag<
      AppPlayer,
      unknown,
      { isDragging: boolean }
    >({
      type: "player",
      item: player,
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
      canDrag: !isMobileView, // Solo permitir arrastrar en desktop
    });

    // Connect the drag ref to our div ref
    useEffect(() => {
      if (divRef.current) {
        connectDrag(divRef);
      }
    }, [connectDrag]);

    return (
      <div
        ref={divRef}
        onClick={(e) => handlePlayerClick(player, e)}
        className={`w-full bg-yellow-500 rounded-lg overflow-hidden shadow-md transition-all duration-200 hover:bg-yellow-400 
          ${isDragging ? "opacity-50" : "opacity-100"}
          ${isMobileView ? "cursor-pointer" : "cursor-move"}`}
      >
        <div className="flex items-center p-2 sm:p-3">
          <div className="flex-shrink-0 bg-black/60 rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center mr-3">
            <p className="text-white font-bold text-lg sm:text-xl">
              {player.rating}
            </p>
          </div>
          <div className="flex-grow">
            <h4 className="text-black font-bold text-base sm:text-lg truncate">
              {player.name}
            </h4>
            <p className="text-black/80 text-xs uppercase">
              {player.position || "Sin posición"}
            </p>
          </div>
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

  return (
    <div className="bg-black/20 backdrop-blur-md rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 shadow-lg border border-white/10">
      <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-white drop-shadow flex items-center">
        <span className="bg-yellow-500 text-black rounded-full h-6 w-6 flex items-center justify-center mr-2 text-xs sm:text-sm">
          {players.length}
        </span>
        Jugadores Disponibles
      </h3>

      {players.length === 0 ? (
        <div className="flex justify-center items-center h-[120px] sm:h-[180px] bg-black/30 rounded-md border border-white/5">
          <p className="text-white/70 text-sm sm:text-base">
            Todos los jugadores han sido asignados
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {players.map((player) => (
            <DraggablePlayerCard key={player.id} player={player} />
          ))}
        </div>
      )}

      {/* Modal de información del jugador */}
      {selectedPlayer && <PlayerInfoModal />}
    </div>
  );
};

export default AvailablePlayers;
