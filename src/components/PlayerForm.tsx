import { Position } from "@/types";
import { useState, useEffect } from "react";

interface PlayerFormProps {
  initialData?: {
    name: string;
    nickname?: string | null;
    position?: Position | null;
    number?: number | null;
    rating: number;
    stats: {
      goals: number;
      assists: number;
      saves: number;
      goalsSaved: number;
    };
  };
  onSubmit: (data: {
    name: string;
    nickname?: string | null;
    position?: Position | null;
    number?: number | null;
    rating: number;
    goals: number;
    assists: number;
    saves: number;
    goals_saved: number;
  }) => Promise<void>;
  onCancel?: () => void;
  submitButtonText?: string;
  cancelButtonText?: string;
}

const positions = [
  { value: "GK", label: "Portero" },
  { value: "CL", label: "Central Izq." },
  { value: "CR", label: "Central Der." },
  { value: "ML", label: "Medio Izq." },
  { value: "MR", label: "Medio Der." },
  { value: "ST", label: "Delantero" },
];

export default function PlayerForm({
  initialData,
  onSubmit,
  onCancel,
  submitButtonText = "Guardar",
  cancelButtonText = "Cancelar",
}: PlayerFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    nickname: initialData?.nickname || "",
    position: initialData?.position || "",
    number: initialData?.number?.toString() || "",
    rating: initialData?.rating.toString() || "80",
    goals: initialData?.stats.goals.toString() || "0",
    assists: initialData?.stats.assists.toString() || "0",
    saves: initialData?.stats.saves.toString() || "0",
    goals_saved: initialData?.stats.goalsSaved.toString() || "0",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

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
    setIsSubmitting(true);
    setError("");

    try {
      await onSubmit({
        name: formData.name,
        nickname: formData.nickname || null,
        position: (formData.position as Position) || null,
        number: formData.number ? parseInt(formData.number, 10) : null,
        rating: parseInt(formData.rating, 10),
        goals: parseInt(formData.goals, 10),
        assists: parseInt(formData.assists, 10),
        saves: parseInt(formData.saves, 10),
        goals_saved: parseInt(formData.goals_saved, 10),
      });
    } catch (err) {
      console.error("Error submitting form:", err);
      setError(
        err instanceof Error ? err.message : "Error al guardar el jugador"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 text-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block mb-1 text-white">
            Nombre <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 text-white"
            placeholder="Nombre completo"
          />
        </div>

        <div>
          <label htmlFor="nickname" className="block mb-1 text-white">
            Apodo
          </label>
          <input
            id="nickname"
            name="nickname"
            type="text"
            value={formData.nickname}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 text-white"
            placeholder="Apodo (opcional)"
          />
        </div>

        <div>
          <label htmlFor="position" className="block mb-1 text-white">
            Posición
          </label>
          <select
            id="position"
            name="position"
            value={formData.position}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 text-white"
          >
            <option value="">Seleccionar posición</option>
            {positions.map((pos) => (
              <option key={pos.value} value={pos.value}>
                {pos.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="number" className="block mb-1 text-white">
            Número de camiseta
          </label>
          <input
            id="number"
            name="number"
            type="number"
            min="0"
            max="99"
            value={formData.number}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 text-white"
            placeholder="Número de camiseta"
          />
        </div>
      </div>

      <div className="border-t border-gray-700 pt-4 mt-4">
        <h2 className="text-xl mb-3 text-white">Estadísticas</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="goals" className="block mb-1 text-white">
              Goles
            </label>
            <input
              id="goals"
              name="goals"
              type="number"
              min="0"
              value={formData.goals}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 text-white"
            />
          </div>

          <div>
            <label htmlFor="assists" className="block mb-1 text-white">
              Asistencias
            </label>
            <input
              id="assists"
              name="assists"
              type="number"
              min="0"
              value={formData.assists}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 text-white"
            />
          </div>

          <div>
            <label htmlFor="saves" className="block mb-1 text-white">
              Paradas
            </label>
            <input
              id="saves"
              name="saves"
              type="number"
              min="0"
              value={formData.saves}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 text-white"
            />
          </div>

          <div>
            <label htmlFor="goals_saved" className="block mb-1 text-white">
              Goles salvados
            </label>
            <input
              id="goals_saved"
              name="goals_saved"
              type="number"
              min="0"
              value={formData.goals_saved}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 text-white"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg text-white"
            disabled={isSubmitting}
          >
            {cancelButtonText}
          </button>
        )}
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Guardando..." : submitButtonText}
        </button>
      </div>
    </form>
  );
}
