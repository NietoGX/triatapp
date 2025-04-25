import { useState, useEffect } from "react";
import { Position } from "@/types";
import { playerApi } from "@/lib/api";

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

type PlayerEditModalProps = {
  player: PlayerData | null;
  isOpen: boolean;
  onClose: () => void;
  onPlayerUpdated: () => void;
};

type FormState = {
  name: string;
  nickname: string;
  position: string;
  number: string;
  rating: string;
  goals: string;
  assists: string;
  saves: string;
  goals_saved: string;
};

const positions = [
  { value: "GK", label: "Portero" },
  { value: "CL", label: "Central Izq." },
  { value: "CR", label: "Central Der." },
  { value: "ML", label: "Medio Izq." },
  { value: "MR", label: "Medio Der." },
  { value: "ST", label: "Delantero" },
];

export default function PlayerEditModal({
  player,
  isOpen,
  onClose,
  onPlayerUpdated,
}: PlayerEditModalProps) {
  const [formData, setFormData] = useState<FormState>({
    name: "",
    nickname: "",
    position: "",
    number: "",
    rating: "80",
    goals: "0",
    assists: "0",
    saves: "0",
    goals_saved: "0",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (player && isOpen) {
      // Transform the player data to form state
      setFormData({
        name: player.name || "",
        nickname: player.nickname || "",
        position: player.position || "",
        number: player.number ? player.number.toString() : "",
        rating: player.rating.toString(),
        goals: player.goals.toString(),
        assists: player.assists.toString(),
        saves: player.saves.toString(),
        goals_saved: player.goals_saved.toString(),
      });
    }
  }, [player, isOpen]);

  // Calculate rating when stats change
  useEffect(() => {
    const goals = parseInt(formData.goals, 10) || 0;
    const assists = parseInt(formData.assists, 10) || 0;
    const saves = parseInt(formData.saves, 10) || 0;
    const goalsSaved = parseInt(formData.goals_saved, 10) || 0;

    const baseRating = 80;
    const goalsBonus = goals * 0.3;
    const assistsBonus = assists * 0.2;
    const savesBonus = saves * 0.3;
    const goalsSavedBonus = goalsSaved * 0.2;

    const newRating = Math.round(
      baseRating + goalsBonus + assistsBonus + savesBonus + goalsSavedBonus
    );

    setFormData((prev) => ({ ...prev, rating: newRating.toString() }));
  }, [formData.goals, formData.assists, formData.saves, formData.goals_saved]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!player?.id) return;

    setSaving(true);
    setError("");

    try {
      // Convert string values to appropriate types
      const goalsValue = parseInt(formData.goals, 10);
      const assistsValue = parseInt(formData.assists, 10);
      const savesValue = parseInt(formData.saves, 10);
      const goalsSavedValue = parseInt(formData.goals_saved, 10);

      // Calculate rating based on stats
      const baseRating = 80;
      const goalsBonus = goalsValue * 0.3;
      const assistsBonus = assistsValue * 0.2;
      const savesBonus = savesValue * 0.3;
      const goalsSavedBonus = goalsSavedValue * 0.2;

      // Calculate total rating and round to nearest integer
      const calculatedRating = Math.round(
        baseRating + goalsBonus + assistsBonus + savesBonus + goalsSavedBonus
      );

      const playerData = {
        name: formData.name,
        nickname: formData.nickname || null,
        position: (formData.position as Position) || null,
        number: formData.number ? parseInt(formData.number, 10) : null,
        rating: calculatedRating,
        goals: goalsValue,
        assists: assistsValue,
        saves: savesValue,
        goals_saved: goalsSavedValue,
      };

      await playerApi.update(player.id, playerData);
      onPlayerUpdated();
      onClose();
    } catch (err) {
      console.error("Error updating player:", err);
      setError("Failed to update player");
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!player?.id) return;

    if (window.confirm("¿Estás seguro que quieres eliminar este jugador?")) {
      try {
        setSaving(true);
        await playerApi.delete(player.id);
        onPlayerUpdated();
        onClose();
      } catch (err) {
        console.error("Error deleting player:", err);
        setError("Failed to delete player");
        setSaving(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative bg-gray-800 rounded-lg w-full max-w-md md:max-w-lg p-5 shadow-lg">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          disabled={saving}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <h2 className="text-xl font-bold text-white mb-4">Editar Jugador</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="modal-name" className="block mb-1 text-gray-300">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                id="modal-name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 text-white"
                placeholder="Nombre completo"
              />
            </div>

            <div>
              <label
                htmlFor="modal-nickname"
                className="block mb-1 text-gray-300"
              >
                Apodo
              </label>
              <input
                id="modal-nickname"
                name="nickname"
                type="text"
                value={formData.nickname}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 text-white"
                placeholder="Apodo (opcional)"
              />
            </div>

            <div>
              <label
                htmlFor="modal-position"
                className="block mb-1 text-gray-300"
              >
                Posición
              </label>
              <select
                id="modal-position"
                name="position"
                value={formData.position}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 text-white"
              >
                <option value="">Selecciona posición</option>
                {positions.map((pos) => (
                  <option key={pos.value} value={pos.value}>
                    {pos.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="modal-number"
                className="block mb-1 text-gray-300"
              >
                Número
              </label>
              <input
                id="modal-number"
                name="number"
                type="number"
                min="0"
                max="99"
                value={formData.number}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 text-white"
                placeholder="Número de camiseta"
              />
            </div>

            <div>
              <label
                htmlFor="modal-rating"
                className="block mb-1 text-gray-300"
              >
                Rating <span className="text-red-500">*</span>
              </label>
              <input
                id="modal-rating"
                name="rating"
                type="number"
                required
                min="1"
                max="99"
                value={formData.rating}
                readOnly
                className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 text-white"
              />
              <p className="text-xs text-gray-400 mt-1">
                Calculado automáticamente (Base: 80 + Goles: 0.3 + Asist: 0.2 +
                Paradas: 0.3 + Goles Salvados: 0.2)
              </p>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-4 mt-4">
            <h3 className="text-lg mb-3 text-gray-300">Estadísticas</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label
                  htmlFor="modal-goals"
                  className="block mb-1 text-gray-300"
                >
                  Goles
                </label>
                <input
                  id="modal-goals"
                  name="goals"
                  type="number"
                  min="0"
                  value={formData.goals}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="modal-assists"
                  className="block mb-1 text-gray-300"
                >
                  Asistencias
                </label>
                <input
                  id="modal-assists"
                  name="assists"
                  type="number"
                  min="0"
                  value={formData.assists}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="modal-saves"
                  className="block mb-1 text-gray-300"
                >
                  Paradas
                </label>
                <input
                  id="modal-saves"
                  name="saves"
                  type="number"
                  min="0"
                  value={formData.saves}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="modal-goals_saved"
                  className="block mb-1 text-gray-300"
                >
                  Goles Salvados
                </label>
                <input
                  id="modal-goals_saved"
                  name="goals_saved"
                  type="number"
                  min="0"
                  value={formData.goals_saved}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 text-white"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <button
              type="button"
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-white"
              disabled={saving}
            >
              Eliminar
            </button>

            <div>
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-white mr-2"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-white inline-flex items-center"
              >
                {saving ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Guardando...
                  </>
                ) : (
                  "Guardar Cambios"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
