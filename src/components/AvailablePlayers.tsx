import { useDrag } from "react-dnd";
import { Player } from "@/types";

interface AvailablePlayersProps {
  players: Player[];
  onPlayerDrop?: (player: Player) => void;
  isMobileView?: boolean;
}

export const AvailablePlayers = ({
  players,
  onPlayerDrop,
  isMobileView = false,
}: AvailablePlayersProps) => {
  // Componente de tarjeta de jugador arrastrable
  const DraggablePlayerCard = ({ player }: { player: Player }) => {
    const [collected, drag] = useDrag({
      type: "player",
      item: player,
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
      canDrag: !isMobileView, // Solo permitir arrastrar en desktop
    });

    const isDragging = collected.isDragging;

    return (
      <div
        ref={drag}
        onClick={() => isMobileView && onPlayerDrop && onPlayerDrop(player)}
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

  return (
    <div className="bg-field-dark/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 shadow-lg border border-white/10">
      <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-white drop-shadow flex items-center">
        <span className="bg-yellow-500 text-black rounded-full h-6 w-6 flex items-center justify-center mr-2 text-xs sm:text-sm">
          {players.length}
        </span>
        Jugadores Disponibles
      </h3>

      {players.length === 0 ? (
        <div className="flex justify-center items-center h-[120px] sm:h-[180px] bg-field-dark/50 rounded-md border border-white/5">
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
    </div>
  );
};

export default AvailablePlayers;
