import { useState, useEffect } from "react";
import Head from "next/head";
import { playerApi } from "@/lib/api";
import Link from "next/link";
import PlayerEditModal from "@/components/PlayerEditModal";
import PlayerCard from "@/components/PlayerCard";
import { toast } from "react-hot-toast";
import { AppPlayer, Position } from "@/types";

// SVG Icons
const ArrowLeftIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 19l-7-7m0 0l7-7m-7 7h18"
    />
  </svg>
);

const UsersIcon = () => (
  <svg
    className="w-8 h-8"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
    />
  </svg>
);

const PlusIcon = () => (
  <svg
    className="w-5 h-5"
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

const UserPlusIcon = () => (
  <svg
    className="w-16 h-16"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
    />
  </svg>
);

export default function PlayersPage() {
  const [players, setPlayers] = useState<AppPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<AppPlayer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPlayers = async () => {
    try {
      const data = await playerApi.getAll();
      const appPlayers: AppPlayer[] = data.map((player) => ({
        ...player,
        team: null,
        position: player.position as Position | null,
        stats: {
          goals: player.goals,
          assists: player.assists,
          saves: player.saves,
          goalsSaved: player.goals_saved,
        },
      }));
      setPlayers(appPlayers);
      setError(null);
    } catch (err) {
      console.error("Error fetching players:", err);
      setError("Error al cargar los jugadores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  const handlePlayerUpdated = (updatedPlayer: AppPlayer) => {
    setPlayers((prevPlayers) =>
      prevPlayers.map((player) =>
        player.id === updatedPlayer.id ? updatedPlayer : player
      )
    );
    toast.success("Jugador actualizado correctamente");
  };

  const handleIncrementStat = async (
    playerId: string,
    statType: "goals" | "assists" | "saves" | "goalsSaved"
  ) => {
    try {
      const player = players.find((p) => p.id === playerId);
      if (!player) return;

      const updatedStats = {
        ...player.stats,
        [statType]: player.stats[statType] + 1,
      };

      const updatedPlayer = await playerApi.update(playerId, {
        name: player.name,
        nickname: player.nickname,
        position: player.position,
        number: player.number,
        rating: player.rating,
        goals: updatedStats.goals,
        assists: updatedStats.assists,
        saves: updatedStats.saves,
        goals_saved: updatedStats.goalsSaved,
      });

      const appPlayer: AppPlayer = {
        ...updatedPlayer,
        team: player.team,
        position: updatedPlayer.position as Position | null,
        stats: updatedStats,
      };

      setPlayers((prevPlayers) =>
        prevPlayers.map((p) => (p.id === playerId ? appPlayer : p))
      );
      toast.success(`Estadística actualizada correctamente`);
    } catch (error) {
      console.error("Error updating player:", error);
      toast.error("Error al actualizar la estadística");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-300">Cargando jugadores...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-4">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error}
          </div>
        </div>
        <button onClick={fetchPlayers} className="btn-primary">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Jugadores | Fútbol Triaje</title>
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900">
        <div className="container mx-auto px-4 py-8">
          {/* Enhanced Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="btn-ghost btn-icon hover:bg-gray-700/50"
                title="Volver a Alineaciones"
              >
                <ArrowLeftIcon />
              </Link>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600/20 rounded-xl">
                  <UsersIcon />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white text-shadow-lg">
                    Jugadores
                  </h1>
                  <p className="text-gray-300 mt-1">
                    Gestiona tu plantilla de jugadores
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-300 bg-gray-800/50 px-3 py-2 rounded-lg">
                <span className="font-medium">{players.length}</span> jugadores
              </div>
              <Link href="/players/new" className="btn-success">
                <PlusIcon />
                Añadir Jugador
              </Link>
            </div>
          </div>

          {/* Players Grid */}
          {players.length === 0 ? (
            /* Empty State */
            <div className="text-center py-16">
              <div className="mb-6 text-gray-400">
                <UserPlusIcon />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No hay jugadores registrados
              </h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                Añade tu primer jugador para empezar a organizar tu equipo
              </p>
              <Link href="/players/new" className="btn-success btn-lg">
                <PlusIcon />
                Crear Primer Jugador
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {players.map((player) => (
                <div key={player.id} className="animate-slide-in">
                  <PlayerCard
                    player={player}
                    onClick={() => {
                      setSelectedPlayer(player);
                      setIsModalOpen(true);
                    }}
                    showStats={true}
                    className="hover:scale-105 transition-transform"
                    onIncrementStat={handleIncrementStat}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Edit Modal */}
          {selectedPlayer && (
            <PlayerEditModal
              player={selectedPlayer}
              isOpen={isModalOpen}
              onClose={() => {
                setIsModalOpen(false);
                setSelectedPlayer(null);
              }}
              onPlayerUpdated={handlePlayerUpdated}
            />
          )}
        </div>
      </main>
    </>
  );
}
