import { useEffect, useState } from "react";
import Link from "next/link";
import { matchApi } from "@/lib/api";
import { Match } from "@/lib/database/types";
import CreateMatchModal from "./CreateMatchModal";
import EditMatchModal from "./EditMatchModal";

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
    className="w-4 h-4"
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
    className="w-4 h-4"
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

const TrashIcon = () => (
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
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
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

const ArrowRightIcon = () => (
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
      d="M9 5l7 7-7 7"
    />
  </svg>
);

const EmptyIcon = () => (
  <svg
    className="w-16 h-16 mx-auto text-gray-400 mb-4"
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

export default function MatchList() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const loadMatches = async () => {
    try {
      setIsLoading(true);
      const data = await matchApi.getAll();
      setMatches(data);
      setIsLoading(false);
    } catch (err) {
      console.error("Error loading matches:", err);
      setError("Error al cargar los partidos");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, []);

  const handleEditMatch = (match: Match, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation to match page
    e.stopPropagation();
    setSelectedMatch(match);
    setIsEditModalOpen(true);
  };

  const handleDeleteMatch = async (match: Match, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation to match page
    e.stopPropagation();

    // Create a custom confirmation dialog
    const confirmDelete = window.confirm(
      `¿Estás seguro de que quieres eliminar "${match.name}"?\n\n` +
        "Esta acción eliminará:\n" +
        "• El partido\n" +
        "• Todas las alineaciones\n" +
        "• Todo el historial de triaje\n" +
        "• Cualquier estado de draft\n\n" +
        "Esta acción no se puede deshacer."
    );

    if (!confirmDelete) return;

    try {
      setIsDeleting(match.id);
      await matchApi.delete(match.id);

      // Remove match from local state
      setMatches((prev) => prev.filter((m) => m.id !== match.id));

      // Success feedback (you could replace this with a toast notification)
      alert("Partido eliminado correctamente");
    } catch (err) {
      console.error("Error deleting match:", err);
      alert("Error al eliminar el partido. Inténtalo de nuevo.");
    } finally {
      setIsDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    };
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
    };

    const formattedDate = date.toLocaleDateString("es-ES", options);
    const formattedTime = date.toLocaleTimeString("es-ES", timeOptions);

    return { date: formattedDate, time: formattedTime };
  };

  return (
    <div className="space-y-6">
      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg animate-slide-in">
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

      {/* Loading State */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin h-10 w-10 border-4 border-green-500 rounded-full border-t-transparent mb-4"></div>
          <p className="text-gray-300">Cargando partidos...</p>
        </div>
      ) : matches.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16">
          <EmptyIcon />
          <h3 className="text-xl font-semibold text-white mb-2">
            No hay partidos creados
          </h3>
          <p className="text-gray-400 mb-6">
            Crea tu primer partido para empezar a organizar alineaciones
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-success"
          >
            <PlusIcon />
            Crear el primer partido
          </button>
        </div>
      ) : (
        /* Matches Grid */
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {matches.map((match) => {
            const { date, time } = formatDate(match.date);
            return (
              <div
                key={match.id}
                className="card card-hover group relative overflow-hidden"
              >
                <Link href={`/matches/${match.id}`} className="block p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-green-300 transition-colors">
                        {match.name}
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-300">
                          <CalendarIcon />
                          <span className="text-sm capitalize">{date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                          <ClockIcon />
                          <span className="text-sm">{time}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-green-400 group-hover:translate-x-1 transition-transform">
                      <ArrowRightIcon />
                    </div>
                  </div>

                  {/* Match Status or additional info could go here */}
                  <div className="mt-4 pt-4 border-t border-gray-700/50">
                    <span className="text-xs text-gray-400 bg-gray-700/30 px-2 py-1 rounded">
                      Partido activo
                    </span>
                  </div>
                </Link>

                {/* Action Buttons */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-stone-900/80 backdrop-blur-sm rounded-lg p-1 flex gap-1">
                  <button
                    onClick={(e) => handleEditMatch(match, e)}
                    className="btn-ghost btn-icon btn-sm hover:bg-green-600/20 hover:text-green-400"
                    title="Editar partido"
                    disabled={isDeleting === match.id}
                  >
                    <EditIcon />
                  </button>
                  <button
                    onClick={(e) => handleDeleteMatch(match, e)}
                    className="btn-ghost btn-icon btn-sm hover:bg-red-600/20 hover:text-red-400"
                    disabled={isDeleting === match.id}
                    title="Eliminar partido"
                  >
                    {isDeleting === match.id ? (
                      <div className="animate-spin h-4 w-4 border-2 border-current rounded-full border-t-transparent"></div>
                    ) : (
                      <TrashIcon />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <CreateMatchModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onMatchCreated={loadMatches}
      />

      <EditMatchModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedMatch(null);
        }}
        onMatchUpdated={loadMatches}
        match={selectedMatch}
      />
    </div>
  );
}
