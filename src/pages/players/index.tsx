import { useState, useEffect } from "react";
import Head from "next/head";
import { playerApi } from "@/lib/api";
import Link from "next/link";
import PlayerEditModal from "@/components/PlayerEditModal";
import PlayerCard from "@/components/PlayerCard";
import { toast } from "react-hot-toast";
import { AppPlayer, Position } from "@/types";

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Jugadores | Fútbol Triaje</title>
      </Head>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="bg-gray-700/50 hover:bg-gray-700 p-2 rounded-lg text-white transition-colors"
              title="Volver a Alineaciones"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
            <h1 className="text-3xl font-bold text-white">Jugadores</h1>
          </div>
          <Link
            href="/players/new"
            className="bg-blue-600/50 hover:bg-blue-600 p-2 rounded-lg text-white transition-colors"
            title="Añadir Nuevo Jugador"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {players.map((player) => (
            <div key={player.id} className="relative group">
              <PlayerCard
                player={player}
                onClick={() => {
                  setSelectedPlayer(player);
                  setIsModalOpen(true);
                }}
                showStats={true}
                className="cursor-pointer hover:scale-105 transition-transform"
                onIncrementStat={handleIncrementStat}
              />
            </div>
          ))}
        </div>

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
    </>
  );
}
