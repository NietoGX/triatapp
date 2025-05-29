import { useState, useEffect } from "react";
import { Match } from "@/lib/database/types";

interface EditMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMatchUpdated: () => void;
  match: Match | null;
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

const EditIcon = () => (
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
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
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

const SaveIcon = () => (
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
      d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
    />
  </svg>
);

export default function EditMatchModal({
  isOpen,
  onClose,
  onMatchUpdated,
  match,
}: EditMatchModalProps) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Update form when match changes
  useEffect(() => {
    if (match) {
      setName(match.name);
      // Parse date and time from the datetime string
      const matchDate = new Date(match.date);
      setDate(matchDate.toISOString().split("T")[0]);
      // Extract time in HH:MM format
      const timeString = matchDate.toTimeString().slice(0, 5);
      setTime(timeString);
    }
  }, [match]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!match) return;

    setIsSubmitting(true);
    setError("");

    try {
      // Combine date and time into a proper datetime string
      const matchDateTime = `${date}T${time}:00`;

      const response = await fetch(`/api/matches/${match.id}/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          date: matchDateTime,
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
      setTime("");
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
    <div className="modal-overlay">
      <div className="modal-content max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 rounded-lg">
              <EditIcon />
            </div>
            <h2 className="text-2xl font-bold text-white">Editar Partido</h2>
          </div>
          <button
            onClick={handleClose}
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
              <label htmlFor="edit-match-name" className="form-label">
                <div className="flex items-center gap-2">
                  <CalendarIcon />
                  Nombre del Partido
                </div>
              </label>
              <input
                type="text"
                id="edit-match-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
                placeholder="Ej: Partido del sábado"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-match-date" className="form-label">
                  <div className="flex items-center gap-2">
                    <CalendarIcon />
                    Fecha
                  </div>
                </label>
                <input
                  type="date"
                  id="edit-match-date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="form-input"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="edit-match-time" className="form-label">
                  <div className="flex items-center gap-2">
                    <ClockIcon />
                    Hora
                  </div>
                </label>
                <input
                  type="time"
                  id="edit-match-time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="form-input"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-700/50">
              <button
                type="button"
                onClick={handleClose}
                className="btn-secondary"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !name.trim() || !date || !time}
                className="btn-primary"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <SaveIcon />
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
