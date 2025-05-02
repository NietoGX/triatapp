import { useState } from "react";
import { playerApi } from "@/lib/api";
import { Player } from "@/lib/database/types";

interface CreatePlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayerCreated: (player: Player) => void;
}

export default function CreatePlayerModal({
  isOpen,
  onClose,
  onPlayerCreated,
}: CreatePlayerModalProps) {
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [position, setPosition] = useState("");
  const [number, setNumber] = useState("");
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const positions = ["GK", "CL", "CR", "ML", "MR", "ST"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name) {
      setError("El nombre del jugador es obligatorio");
      return;
    }

    if (!rating || rating < 1 || rating > 10) {
      setError("La valoración debe estar entre 1 y 10");
      return;
    }

    try {
      setIsSubmitting(true);

      const playerData = {
        name,
        nickname: nickname || undefined,
        position: position || undefined,
        number: number ? parseInt(number) : undefined,
        rating,
        goals: 0,
        assists: 0,
        saves: 0,
        goals_saved: 0,
      };

      console.log("Creating player with:", playerData);
      const player = await playerApi.create(playerData);

      setIsSubmitting(false);
      if (player) {
        onPlayerCreated(player);
      } else {
        setError("No se pudo crear el jugador. Inténtalo de nuevo.");
      }
    } catch (err) {
      setIsSubmitting(false);
      let errorMessage = "Error al crear el jugador. Inténtalo de nuevo.";

      if (err instanceof Error) {
        console.error(`Error creating player: ${err.message}`);
        errorMessage = `Error: ${err.message}`;
      } else {
        console.error("Unknown error creating player:", err);
      }

      setError(errorMessage);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-gray-800 rounded-lg shadow-lg w-full max-w-md p-6">
        <h2 className="text-2xl font-bold text-white mb-4">
          Crear Nuevo Jugador
        </h2>

        {error && (
          <div className="bg-red-800/50 text-red-200 p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-white mb-2">
              Nombre *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white"
              placeholder="Nombre del jugador"
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="nickname" className="block text-white mb-2">
              Apodo
            </label>
            <input
              type="text"
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white"
              placeholder="Apodo (opcional)"
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="position" className="block text-white mb-2">
                Posición
              </label>
              <select
                id="position"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 text-white"
                disabled={isSubmitting}
              >
                <option value="">Seleccionar...</option>
                {positions.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="number" className="block text-white mb-2">
                Número
              </label>
              <input
                type="number"
                id="number"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 text-white"
                placeholder="Nº"
                disabled={isSubmitting}
                min="1"
                max="99"
              />
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="rating" className="block text-white mb-2">
              Valoración (1-10) *
            </label>
            <div className="flex items-center">
              <input
                type="range"
                id="rating"
                value={rating}
                onChange={(e) => setRating(parseInt(e.target.value))}
                className="w-full"
                min="1"
                max="10"
                disabled={isSubmitting}
              />
              <span className="ml-2 text-white font-bold">{rating}</span>
            </div>
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
              className="px-4 py-2 rounded bg-green-600 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creando..." : "Crear Jugador"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
