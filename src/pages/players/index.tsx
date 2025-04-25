import { useState, useEffect } from "react";
import Head from "next/head";
import { playerApi } from "@/lib/api";
import Link from "next/link";
import PlayerEditModal from "@/components/PlayerEditModal";
import { toast, Toaster } from "react-hot-toast";

interface PlayerData {
  id: string;
  name: string;
  nickname?: string | null;
  position?: string | null;
  number?: number | null;
  rating: number;
  goals: number;
  assists: number;
  saves: number;
  goals_saved: number;
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load players on component mount
  useEffect(() => {
    fetchPlayers();
  }, []);

  // Fetch players from the API
  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const data = await playerApi.getAll();
      setPlayers(data);
      setError("");
      setLoading(false);
    } catch (err) {
      console.error("Error fetching players:", err);
      setError(
        "Error loading players. Please make sure your database is set up correctly."
      );
      setLoading(false);
    }
  };

  // Initialize the database with sample players
  const handleInitializeDb = async () => {
    try {
      setLoading(true);
      setStatusMessage("Initializing database...");
      const result = await playerApi.initialize();
      setStatusMessage(result.message);
      await fetchPlayers();
    } catch (err) {
      console.error("Error initializing database:", err);
      setStatusMessage(
        "Error initializing database. Please check console for details."
      );
      setLoading(false);
    }
  };

  // Add a function to increment stats
  const incrementStat = async (
    player: PlayerData,
    statType: "goals" | "assists" | "saves" | "goals_saved"
  ) => {
    try {
      setLoading(true);
      setError("");

      // Make a copy of the player with the incremented stat
      const updatedPlayer = {
        ...player,
        [statType]: (player[statType] || 0) + 1,
      };

      // Calculate the new rating based on stats
      const baseRating = 80;
      const goalsBonus = updatedPlayer.goals * 0.3;
      const assistsBonus = updatedPlayer.assists * 0.2;
      const savesBonus = updatedPlayer.saves * 0.3;
      const goalsSavedBonus = updatedPlayer.goals_saved * 0.2;

      // Calculate total rating and round to nearest integer
      updatedPlayer.rating = Math.round(
        baseRating + goalsBonus + assistsBonus + savesBonus + goalsSavedBonus
      );

      // Update the player in the database
      await playerApi.update(player.id, updatedPlayer);

      // Update the local state
      setPlayers(players.map((p) => (p.id === player.id ? updatedPlayer : p)));

      // Show toast or some visual feedback
      toast.success(
        `${
          statType.charAt(0).toUpperCase() + statType.slice(1)
        } incrementado para ${player.name}`
      );
    } catch (err) {
      console.error(`Error al incrementar ${statType}:`, err);
      setError(
        `Error al incrementar ${statType}. Por favor, inténtalo de nuevo.`
      );
      toast.error(`Error al incrementar ${statType}`);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (player: PlayerData) => {
    setSelectedPlayer(player);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPlayer(null);
  };

  return (
    <>
      <Head>
        <title>Player Management - Futbol Triaje</title>
        <meta name="description" content="Manage players for Futbol Triaje" />
      </Head>
      <Toaster position="top-center" />
      <main className="min-h-screen bg-field-grass bg-cover bg-center p-4">
        <div className="container mx-auto bg-black/70 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg text-white">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
            <h1 className="text-2xl font-bold mb-4 sm:mb-0">
              Gestión de Jugadores
            </h1>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/players/new"
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-white"
              >
                Añadir Jugador
              </Link>
              <Link
                href="/"
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white"
              >
                Volver a Equipos
              </Link>
            </div>
          </div>

          {statusMessage && (
            <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500 rounded-lg">
              {statusMessage}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg">
              {error}
            </div>
          )}

          <div className="mb-6 flex flex-wrap gap-2">
            <button
              onClick={handleInitializeDb}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg"
              disabled={loading}
            >
              Inicializar Base de Datos
            </button>
            <button
              onClick={fetchPlayers}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
              disabled={loading}
            >
              Recargar
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center my-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center my-8">{error}</div>
          ) : players.length === 0 ? (
            <div className="bg-gray-800 p-6 rounded-lg text-center">
              <p className="text-xl mb-4">No se encontraron jugadores</p>
              <p>
                Haz clic en &ldquo;Inicializar Base de Datos&rdquo; para crear
                datos de ejemplo, o asegúrate de que tu base de datos esté
                configurada correctamente.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="bg-gray-800 rounded-lg p-4 shadow-md hover:bg-gray-700 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold">{player.name}</h3>
                      <p className="text-gray-400">{player.nickname || "-"}</p>
                      <div className="text-sm text-gray-500 mt-1">
                        {player.number && (
                          <span className="mr-2">#{player.number}</span>
                        )}
                        <span>{player.position || "Sin posición"}</span>
                      </div>
                    </div>
                    <div className="bg-gray-900 rounded-full w-10 h-10 flex items-center justify-center">
                      <span className="text-yellow-400 font-bold">
                        {player.rating}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-gray-900/50 p-2 rounded text-center relative group">
                      <div className="font-bold text-lg text-green-500">
                        {player.goals}
                      </div>
                      <div className="text-xs text-gray-400">Goles</div>
                      <button
                        onClick={() => incrementStat(player, "goals")}
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center bg-green-600/80 rounded transition-opacity"
                        title="Incrementar goles"
                        disabled={loading}
                      >
                        <span className="text-white font-bold text-lg">+</span>
                      </button>
                    </div>
                    <div className="bg-gray-900/50 p-2 rounded text-center relative group">
                      <div className="font-bold text-lg text-yellow-500">
                        {player.assists}
                      </div>
                      <div className="text-xs text-gray-400">Asist.</div>
                      <button
                        onClick={() => incrementStat(player, "assists")}
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center bg-yellow-600/80 rounded transition-opacity"
                        title="Incrementar asistencias"
                        disabled={loading}
                      >
                        <span className="text-white font-bold text-lg">+</span>
                      </button>
                    </div>
                    <div className="bg-gray-900/50 p-2 rounded text-center relative group">
                      <div className="font-bold text-lg text-purple-500">
                        {player.saves}
                      </div>
                      <div className="text-xs text-gray-400">Paradas</div>
                      <button
                        onClick={() => incrementStat(player, "saves")}
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center bg-purple-600/80 rounded transition-opacity"
                        title="Incrementar paradas"
                        disabled={loading}
                      >
                        <span className="text-white font-bold text-lg">+</span>
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="bg-gray-900/50 p-2 rounded text-center relative group">
                      <div className="font-bold text-lg text-blue-500">
                        {player.goals_saved}
                      </div>
                      <div className="text-xs text-gray-400">
                        Goles Salvados
                      </div>
                      <button
                        onClick={() => incrementStat(player, "goals_saved")}
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center bg-blue-600/80 rounded transition-opacity"
                        title="Incrementar goles salvados"
                        disabled={loading}
                      >
                        <span className="text-white font-bold text-lg">+</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => openEditModal(player)}
                      className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white"
                    >
                      Editar Jugador
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Player Edit Modal */}
      <PlayerEditModal
        player={selectedPlayer}
        isOpen={isModalOpen}
        onClose={closeModal}
        onPlayerUpdated={fetchPlayers}
      />
    </>
  );
}
