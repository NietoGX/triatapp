import { useEffect, useState } from "react";
import Link from "next/link";
import { matchApi } from "@/lib/api";
import { Match } from "@/lib/database/types";
import CreateMatchModal from "./CreateMatchModal";
import EditMatchModal from "./EditMatchModal";

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

    const confirmDelete = confirm(
      `¿Estás seguro de que quieres eliminar el partido "${match.name}"?\n\n` +
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

      alert("Partido eliminado correctamente");
    } catch (err) {
      console.error("Error deleting match:", err);
      alert("Error al eliminar el partido. Inténtalo de nuevo.");
    } finally {
      setIsDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString("es-ES", options);
  };

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Partidos</h2>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Nuevo Partido
        </button>
      </div>

      {error && (
        <div className="bg-red-800/50 text-red-200 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
          <p className="mt-2 text-gray-300">Cargando partidos...</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="bg-gray-800/50 p-8 rounded-lg text-center">
          <p className="text-gray-300 mb-4">No hay partidos creados</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Crear el primer partido
          </button>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {matches.map((match) => (
            <div
              key={match.id}
              className="bg-gray-800 hover:bg-gray-700 p-6 rounded-lg transition-colors relative group"
            >
              <Link href={`/matches/${match.id}`} className="block">
                <h3 className="text-xl font-bold text-white mb-2">
                  {match.name}
                </h3>
                <p className="text-gray-300">{formatDate(match.date)}</p>
              </Link>

              {/* Action buttons */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <button
                  onClick={(e) => handleEditMatch(match, e)}
                  className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                  title="Editar partido"
                >
                  ✏️
                </button>
                <button
                  onClick={(e) => handleDeleteMatch(match, e)}
                  className="p-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                  disabled={isDeleting === match.id}
                  title="Eliminar partido"
                >
                  {isDeleting === match.id ? "..." : "🗑️"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
