import { useDrag } from "react-dnd";
import { Player } from "@/types";
import { useRef, useEffect } from "react";

interface PlayerCardProps {
  player: Player;
  isDraggable?: boolean;
  onClick?: () => void;
}

export const PlayerCard = ({
  player,
  isDraggable = true,
  onClick,
}: PlayerCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);

  // Generar una media aleatoria entre 80 y 90 si no existe
  const playerRating = player.rating || Math.floor(Math.random() * 11) + 80;

  const [{ isDragging }, dragRef] = useDrag<
    Player,
    unknown,
    { isDragging: boolean }
  >(() => ({
    type: "player",
    item: { ...player, rating: playerRating },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    canDrag: isDraggable,
  }));

  // Aplicar el drag ref al elemento completo
  useEffect(() => {
    if (isDraggable && cardRef.current) {
      dragRef(cardRef.current);
    }
  }, [dragRef, isDraggable]);

  // Colores según el equipo
  const getCardColor = () => {
    if (player.team === "borjas") return "bg-red-600";
    if (player.team === "nietos") return "bg-purple-600";
    return "bg-yellow-500"; // Color default para jugadores sin equipo
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div
      ref={cardRef}
      onClick={handleClick}
      className={`${getCardColor()} ${
        isDragging ? "opacity-50" : "opacity-100"
      } ${
        isDraggable ? "cursor-move" : "cursor-default"
      } h-[120px] w-[100px] sm:h-[140px] sm:w-[120px] rounded-lg overflow-hidden relative shadow-lg transition-transform duration-200 hover:-translate-y-1 flex flex-col touch-manipulation`}
    >
      {/* Cabecera con Rating */}
      <div className="w-full bg-black/60 px-2 py-1 sm:py-2 text-center">
        <div className="bg-white/20 rounded-full w-12 h-12 sm:w-16 sm:h-16 mx-auto flex items-center justify-center">
          <p className="text-white font-bold text-2xl sm:text-3xl">
            {playerRating}
          </p>
        </div>
        <p className="text-white font-bold mt-1 text-shadow text-center truncate text-sm sm:text-base">
          {player.name}
        </p>
        <p className="text-white text-xs uppercase -mt-1">
          {player.position || "??"}
        </p>
      </div>

      {/* Badge de equipo */}
      {player.team && (
        <div className="absolute top-1 sm:top-2 right-1 sm:right-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center">
          <div
            className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full ${
              player.team === "borjas" ? "bg-red-500" : "bg-purple-500"
            } flex items-center justify-center text-xs font-bold text-white`}
          >
            {player.team === "borjas" ? "B" : "N"}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerCard;
