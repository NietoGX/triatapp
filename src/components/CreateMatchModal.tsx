import { useState, useEffect } from "react";
import { matchApi, playerApi } from "@/lib/api";
import { Player } from "@/lib/database/types";
import CreatePlayerModal from "./CreatePlayerModal";

interface CreateMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMatchCreated: () => void;
}

export default function CreateMatchModal({
  isOpen,
  onClose,
  onMatchCreated,
}: CreateMatchModalProps) {
  const [name, setName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [isCreatePlayerModalOpen, setIsCreatePlayerModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPlayers();
    }
  }, [isOpen]);

  const loadPlayers = async () => {
    try {
      setIsLoading(true);
      const data = await playerApi.getAll();
      setPlayers(data);
      setIsLoading(false);
    } catch (err) {
      console.error("Error loading players:", err);
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || !date) {
      setError("Por favor completa todos los campos");
      return;
    }

    if (selectedPlayers.length === 0) {
      setError("Selecciona al menos un jugador para el partido");
      return;
    }

    try {
      setIsSubmitting(true);
      console.log("Creating match with:", {
        name,
        date,
        players: selectedPlayers,
      });

      await matchApi.create({
        name,
        date,
        availablePlayers: selectedPlayers,
      });

      setIsSubmitting(false);
      onMatchCreated();
      onClose();

      // Reset form
      setName("");
      setDate(new Date().toISOString().split("T")[0]);
      setSelectedPlayers([]);
    } catch (err) {
      setIsSubmitting(false);
      let errorMessage = "Error al crear el partido. Inténtalo de nuevo.";

      if (err instanceof Error) {
        console.error(`Error creating match: ${err.message}`);
        errorMessage = `Error: ${err.message}`;
      } else {
        console.error("Unknown error creating match:", err);
      }

      setError(errorMessage);
    }
  };

  const togglePlayerSelection = (playerId: string) => {
    setSelectedPlayers((prevSelected) => {
      if (prevSelected.includes(playerId)) {
        return prevSelected.filter((id) => id !== playerId);
      } else {
        return [...prevSelected, playerId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedPlayers.length === players.length) {
      setSelectedPlayers([]);
    } else {
      setSelectedPlayers(players.map((player) => player.id));
    }
  };

  const handlePlayerCreated = (newPlayer: Player) => {
    setPlayers((prevPlayers) => [...prevPlayers, newPlayer]);
    setSelectedPlayers((prevSelected) => [...prevSelected, newPlayer.id]);
    setIsCreatePlayerModalOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-800 rounded-lg shadow-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-4">
          Crear Nuevo Partido
        </h2>

        {error && (
          <div className="bg-red-800/50 text-red-200 p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-white mb-2">
              Nombre del Partido
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white"
              placeholder="Ej: Partido del Sábado"
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="date" className="block text-white mb-2">
              Fecha
            </label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white"
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-white">Jugadores Disponibles</label>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-2 py-1 text-xs rounded bg-blue-600 text-white"
                >
                  {selectedPlayers.length === players.length
                    ? "Deseleccionar Todos"
                    : "Seleccionar Todos"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatePlayerModalOpen(true)}
                  className="px-2 py-1 text-xs rounded bg-green-600 text-white"
                >
                  Nuevo Jugador
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-4 bg-gray-700 rounded">
                <div className="inline-block animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                <p className="mt-2 text-gray-300 text-sm">
                  Cargando jugadores...
                </p>
              </div>
            ) : players.length === 0 ? (
              <div className="text-center py-4 bg-gray-700 rounded">
                <p className="text-gray-300">No hay jugadores registrados</p>
                <button
                  type="button"
                  onClick={() => setIsCreatePlayerModalOpen(true)}
                  className="mt-2 px-3 py-1 rounded bg-green-600 text-white text-sm"
                >
                  Crear Jugador
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 bg-gray-700 rounded">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className={`p-2 rounded cursor-pointer flex items-center ${
                      selectedPlayers.includes(player.id)
                        ? "bg-blue-700 text-white"
                        : "bg-gray-600 text-gray-200"
                    }`}
                    onClick={() => togglePlayerSelection(player.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPlayers.includes(player.id)}
                      onChange={() => {}}
                      className="mr-2"
                    />
                    <div>
                      <div className="font-medium">{player.name}</div>
                      {player.position && (
                        <div className="text-xs opacity-80">
                          {player.position}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-600 text-white"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-blue-600 text-white"
              disabled={isSubmitting || selectedPlayers.length === 0}
            >
              {isSubmitting ? "Creando..." : "Crear Partido"}
            </button>
          </div>
        </form>

        {isCreatePlayerModalOpen && (
          <CreatePlayerModal
            isOpen={isCreatePlayerModalOpen}
            onClose={() => setIsCreatePlayerModalOpen(false)}
            onPlayerCreated={handlePlayerCreated}
          />
        )}
      </div>
    </div>
  );
}
