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

// SVG Icons
const StarIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const PlusIcon = () => (
  <svg
    className="w-3 h-3"
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
    stat: "goals" | "assists" | "saves" | "goalsSaved",
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (onIncrementStat) {
      onIncrementStat(player.id, stat);
    }
  };

  const getPositionColor = (position: string | null) => {
    switch (position) {
      case "GK":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "CL":
      case "CR":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "ML":
      case "MR":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "ST":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getPositionName = (position: string | null) => {
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
      default:
        return "Sin posición";
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        card card-hover group relative
        ${isSelectable ? "cursor-pointer" : "cursor-not-allowed opacity-70"}
        ${isSelected ? "ring-2 ring-blue-500 bg-blue-500/10" : ""}
        ${className}
      `}
    >
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-sm mb-1 truncate">
              {player.name}
            </h3>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2 py-1 rounded-full border ${getPositionColor(
                  player.position
                )}`}
              >
                {getPositionName(player.position)}
              </span>
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1 bg-yellow-500/20 px-2 py-1 rounded-lg">
            <StarIcon />
            <span className="text-yellow-400 text-sm font-bold">
              {player.rating}
            </span>
          </div>
        </div>

        {/* Player Number */}
        {player.number && (
          <div className="text-xs text-gray-400 mb-2">#{player.number}</div>
        )}

        {/* Nickname */}
        {player.nickname && (
          <div className="text-xs text-gray-300 italic mb-2">
            &ldquo;{player.nickname}&rdquo;
          </div>
        )}
      </div>

      {/* Stats */}
      {showStats && (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-2">
            {/* Goals */}
            <div
              onClick={(e) =>
                onIncrementStat && handleIncrementStat("goals", e)
              }
              className={`
                group/stat p-2 rounded-lg transition-colors border border-green-500/20
                bg-green-500/10 hover:bg-green-500/20
                ${onIncrementStat ? "cursor-pointer" : ""}
              `}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-green-300 font-medium">
                    Goles
                  </div>
                  <div className="text-lg font-bold text-green-400">
                    {player.stats?.goals || 0}
                  </div>
                </div>
                {onIncrementStat && (
                  <div className="opacity-0 group-hover/stat:opacity-100 transition-opacity bg-green-500/30 rounded-full p-1">
                    <PlusIcon />
                  </div>
                )}
              </div>
            </div>

            {/* Assists */}
            <div
              onClick={(e) =>
                onIncrementStat && handleIncrementStat("assists", e)
              }
              className={`
                group/stat p-2 rounded-lg transition-colors border border-blue-500/20
                bg-blue-500/10 hover:bg-blue-500/20
                ${onIncrementStat ? "cursor-pointer" : ""}
              `}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-blue-300 font-medium">
                    Asist.
                  </div>
                  <div className="text-lg font-bold text-blue-400">
                    {player.stats?.assists || 0}
                  </div>
                </div>
                {onIncrementStat && (
                  <div className="opacity-0 group-hover/stat:opacity-100 transition-opacity bg-blue-500/30 rounded-full p-1">
                    <PlusIcon />
                  </div>
                )}
              </div>
            </div>

            {/* Saves */}
            <div
              onClick={(e) =>
                onIncrementStat && handleIncrementStat("saves", e)
              }
              className={`
                group/stat p-2 rounded-lg transition-colors border border-yellow-500/20
                bg-yellow-500/10 hover:bg-yellow-500/20
                ${onIncrementStat ? "cursor-pointer" : ""}
              `}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-yellow-300 font-medium">
                    Paradas
                  </div>
                  <div className="text-lg font-bold text-yellow-400">
                    {player.stats?.saves || 0}
                  </div>
                </div>
                {onIncrementStat && (
                  <div className="opacity-0 group-hover/stat:opacity-100 transition-opacity bg-yellow-500/30 rounded-full p-1">
                    <PlusIcon />
                  </div>
                )}
              </div>
            </div>

            {/* Goals Saved */}
            <div
              onClick={(e) =>
                onIncrementStat && handleIncrementStat("goalsSaved", e)
              }
              className={`
                group/stat p-2 rounded-lg transition-colors border border-purple-500/20
                bg-purple-500/10 hover:bg-purple-500/20
                ${onIncrementStat ? "cursor-pointer" : ""}
              `}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-purple-300 font-medium">
                    G. Salv.
                  </div>
                  <div className="text-lg font-bold text-purple-400">
                    {player.stats?.goalsSaved || 0}
                  </div>
                </div>
                {onIncrementStat && (
                  <div className="opacity-0 group-hover/stat:opacity-100 transition-opacity bg-purple-500/30 rounded-full p-1">
                    <PlusIcon />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
          <svg
            className="w-4 h-4 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
