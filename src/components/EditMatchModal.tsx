import { useState, useEffect } from "react";
import { Match } from "@/lib/database/types";

interface EditMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMatchUpdated: () => void;
  match: Match | null;
}

export default function EditMatchModal({
  isOpen,
  onClose,
  onMatchUpdated,
  match,
}: EditMatchModalProps) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Update form when match changes
  useEffect(() => {
    if (match) {
      setName(match.name);
      // Format date for input (YYYY-MM-DD)
      const matchDate = new Date(match.date);
      setDate(matchDate.toISOString().split("T")[0]);
    }
  }, [match]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!match) return;

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/matches/${match.id}/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          date: date,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error updating match");
      }

      // Success
      onMatchUpdated();
      onClose();

      // Reset form
      setName("");
      setDate("");
    } catch (err) {
      console.error("Error updating match:", err);
      setError(err instanceof Error ? err.message : "Error updating match");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setError("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md mx-4">
        <h2 className="text-2xl font-bold text-white mb-6">Editar Partido</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="edit-match-name"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Nombre del Partido
            </label>
            <input
              type="text"
              id="edit-match-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: Partido del sábado"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label
              htmlFor="edit-match-date"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Fecha
            </label>
            <input
              type="date"
              id="edit-match-date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <div className="bg-red-800/50 text-red-200 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim() || !date}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {isSubmitting ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
