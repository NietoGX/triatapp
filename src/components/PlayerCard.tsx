import { AppPlayer } from "@/types";

interface PlayerCardProps {
  player: AppPlayer;
  onClick?: (player: AppPlayer) => void;
  isSelectable?: boolean;
  isSelected?: boolean;
  showStats?: boolean;
  className?: string;
  onIncrementStat?: (
    playerId: string,
    stat: "goals" | "assists" | "saves" | "goalsSaved"
  ) => void;
}

export default function PlayerCard({
  player,
  onClick,
  isSelectable = true,
  isSelected = false,
  showStats = true,
  className = "",
  onIncrementStat,
}: PlayerCardProps) {
  const handleClick = () => {
    if (isSelectable && onClick) {
      onClick(player);
    }
  };

  const handleIncrementStat = (
    stat: "goals" | "assists" | "saves" | "goalsSaved"
  ) => {
    if (onIncrementStat) {
      onIncrementStat(player.id, stat);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        bg-gray-800/80 backdrop-blur-sm rounded-lg p-3 shadow-md 
        transition-all duration-200 border border-white/5
        ${
          isSelectable
            ? "cursor-pointer hover:bg-gray-700/90"
            : "cursor-not-allowed opacity-70"
        }
        ${isSelected ? "ring-2 ring-blue-500" : ""}
        ${className}
      `}
    >
      <div className="flex justify-between items-start mb-1.5">
        <div className="font-medium text-white">{player.name}</div>
        <div className="text-yellow-400 text-sm">⭐ {player.rating}</div>
      </div>
      <div className="text-sm text-blue-300">
        {player.position ? player.position : "Sin posición"}
      </div>

      {showStats && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div
            onClick={(e) => {
              e.stopPropagation();
              handleIncrementStat("goals");
            }}
            className="bg-green-600/20 hover:bg-green-600/30 p-2 rounded-lg cursor-pointer transition-colors"
          >
            <div className="text-xs text-green-300">Goles</div>
            <div className="text-lg font-bold text-green-400">
              {player.stats?.goals || 0}
            </div>
          </div>

          <div
            onClick={(e) => {
              e.stopPropagation();
              handleIncrementStat("assists");
            }}
            className="bg-blue-600/20 hover:bg-blue-600/30 p-2 rounded-lg cursor-pointer transition-colors"
          >
            <div className="text-xs text-blue-300">Asistencias</div>
            <div className="text-lg font-bold text-blue-400">
              {player.stats?.assists || 0}
            </div>
          </div>

          <div
            onClick={(e) => {
              e.stopPropagation();
              handleIncrementStat("saves");
            }}
            className="bg-yellow-600/20 hover:bg-yellow-600/30 p-2 rounded-lg cursor-pointer transition-colors"
          >
            <div className="text-xs text-yellow-300">Paradas</div>
            <div className="text-lg font-bold text-yellow-400">
              {player.stats?.saves || 0}
            </div>
          </div>

          <div
            onClick={(e) => {
              e.stopPropagation();
              handleIncrementStat("goalsSaved");
            }}
            className="bg-purple-600/20 hover:bg-purple-600/30 p-2 rounded-lg cursor-pointer transition-colors"
          >
            <div className="text-xs text-purple-300">Goles Salvados</div>
            <div className="text-lg font-bold text-purple-400">
              {player.stats?.goalsSaved || 0}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
