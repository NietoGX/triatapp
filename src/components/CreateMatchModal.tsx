import { useState, useEffect } from "react";
import { matchApi, playerApi } from "@/lib/api";
import { Player } from "@/lib/database/types";
import CreatePlayerModal from "./CreatePlayerModal";

interface CreateMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMatchCreated: () => void;
}

// SVG Icons
const CalendarIcon = () => (
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
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const ClockIcon = () => (
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
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const UserIcon = () => (
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
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

const UsersIcon = () => (
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
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
    />
  </svg>
);

const PlusIcon = () => (
  <svg
    className="w-4 h-4"
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

const XIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

export default function CreateMatchModal({
  isOpen,
  onClose,
  onMatchCreated,
}: CreateMatchModalProps) {
  const [name, setName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("20:00"); // Default to 8:00 PM
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

    if (!name || !date || !time) {
      setError("Por favor completa todos los campos");
      return;
    }

    if (selectedPlayers.length === 0) {
      setError("Selecciona al menos un jugador para el partido");
      return;
    }

    try {
      setIsSubmitting(true);

      // Combine date and time into a proper datetime string
      const matchDateTime = `${date}T${time}:00`;

      console.log("Creating match with:", {
        name,
        date: matchDateTime,
        players: selectedPlayers,
      });

      await matchApi.create({
        name,
        date: matchDateTime,
        availablePlayers: selectedPlayers,
      });

      setIsSubmitting(false);
      onMatchCreated();
      onClose();

      // Reset form
      setName("");
      setDate(new Date().toISOString().split("T")[0]);
      setTime("20:00");
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
    <div className="modal-overlay">
      <div className="modal-content">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-600/20 rounded-lg">
              <CalendarIcon />
            </div>
            <h2 className="text-2xl font-bold text-white">
              Crear Nuevo Partido
            </h2>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost btn-icon hover:bg-gray-700/50"
            disabled={isSubmitting}
          >
            <XIcon />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-6 animate-slide-in">
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
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Match Name */}
            <div>
              <label htmlFor="name" className="form-label">
                <div className="flex items-center gap-2">
                  <CalendarIcon />
                  Nombre del Partido
                </div>
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
                placeholder="Ej: Partido del Sábado"
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className="form-label">
                  <div className="flex items-center gap-2">
                    <CalendarIcon />
                    Fecha
                  </div>
                </label>
                <input
                  type="date"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="form-input"
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div>
                <label htmlFor="time" className="form-label">
                  <div className="flex items-center gap-2">
                    <ClockIcon />
                    Hora
                  </div>
                </label>
                <input
                  type="time"
                  id="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="form-input"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            {/* Players Selection */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="form-label mb-0">
                  <div className="flex items-center gap-2">
                    <UsersIcon />
                    Jugadores Disponibles
                  </div>
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="btn-secondary btn-sm"
                    disabled={isSubmitting}
                  >
                    {selectedPlayers.length === players.length
                      ? "Deseleccionar Todos"
                      : "Seleccionar Todos"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreatePlayerModalOpen(true)}
                    className="btn-success btn-sm"
                    disabled={isSubmitting}
                  >
                    <PlusIcon />
                    Nuevo Jugador
                  </button>
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-8 card">
                  <div className="inline-block animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent mb-2"></div>
                  <p className="text-gray-300 text-sm">Cargando jugadores...</p>
                </div>
              ) : players.length === 0 ? (
                <div className="text-center py-8 card">
                  <div className="mb-4">
                    <UserIcon />
                  </div>
                  <p className="text-gray-300 mb-4">
                    No hay jugadores registrados
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsCreatePlayerModalOpen(true)}
                    className="btn-success btn-sm"
                    disabled={isSubmitting}
                  >
                    <PlusIcon />
                    Crear Primer Jugador
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto p-1">
                  {players.map((player) => (
                    <div
                      key={player.id}
                      onClick={() =>
                        !isSubmitting && togglePlayerSelection(player.id)
                      }
                      className={`
                        p-4 rounded-lg cursor-pointer transition-all duration-200 border-2
                        ${
                          selectedPlayers.includes(player.id)
                            ? "bg-blue-600/20 border-blue-500 ring-2 ring-blue-500/30"
                            : "card border-transparent hover:border-gray-600"
                        }
                        ${
                          isSubmitting
                            ? "opacity-50 cursor-not-allowed"
                            : "hover-lift"
                        }
                      `}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-white text-sm">
                          {player.name}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-yellow-400 text-xs">
                            ⭐ {player.rating}
                          </span>
                          <div
                            className={`w-4 h-4 rounded border-2 transition-colors ${
                              selectedPlayers.includes(player.id)
                                ? "bg-blue-500 border-blue-500"
                                : "border-gray-400"
                            }`}
                          >
                            {selectedPlayers.includes(player.id) && (
                              <svg
                                className="w-3 h-3 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-blue-300">
                        {player.position || "Sin posición"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-700/50">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-success"
                disabled={isSubmitting || selectedPlayers.length === 0}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
                    Creando...
                  </>
                ) : (
                  <>
                    <PlusIcon />
                    Crear Partido
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

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
