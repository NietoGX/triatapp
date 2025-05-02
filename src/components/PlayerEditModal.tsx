import { AppPlayer, Position } from "@/types";
import PlayerForm from "./PlayerForm";
import { playerApi } from "@/lib/api";

interface PlayerEditModalProps {
  player: AppPlayer;
  isOpen: boolean;
  onClose: () => void;
  onPlayerUpdated: (player: AppPlayer) => void;
}

export default function PlayerEditModal({
  player,
  isOpen,
  onClose,
  onPlayerUpdated,
}: PlayerEditModalProps) {
  if (!isOpen || !player) return null;

  const handleSubmit = async (data: {
    name: string;
    nickname?: string | null;
    position?: string | null;
    number?: number | null;
    rating: number;
    goals: number;
    assists: number;
    saves: number;
    goals_saved: number;
  }) => {
    try {
      const updatedPlayer = await playerApi.update(player.id, {
        name: data.name,
        nickname: data.nickname,
        position: data.position as Position | null,
        number: data.number,
        rating: data.rating,
        goals: data.goals,
        assists: data.assists,
        saves: data.saves,
        goals_saved: data.goals_saved,
      });

      // Convert the updated player to AppPlayer type
      const appPlayer: AppPlayer = {
        ...updatedPlayer,
        team: player.team, // Preserve the team from the original player
        position: data.position as Position | null,
        stats: {
          goals: data.goals,
          assists: data.assists,
          saves: data.saves,
          goalsSaved: data.goals_saved,
        },
      };

      onPlayerUpdated(appPlayer);
      onClose();
    } catch (error) {
      console.error("Error updating player:", error);
      throw error;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-gray-900 opacity-75"></div>
        </div>

        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="absolute top-0 right-0 pt-4 pr-4">
              <button
                type="button"
                className="bg-gray-800 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                onClick={onClose}
              >
                <span className="sr-only">Cerrar</span>
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="mt-3 text-center sm:mt-0 sm:text-left">
              <h3 className="text-lg leading-6 font-medium text-white">
                Editar jugador
              </h3>
              <div className="mt-2">
                <PlayerForm
                  initialData={{
                    name: player.name,
                    nickname: player.nickname,
                    position: player.position,
                    number: player.number,
                    rating: player.rating,
                    stats: player.stats,
                  }}
                  onSubmit={handleSubmit}
                  onCancel={onClose}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
