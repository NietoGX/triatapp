import { useEffect, useState } from "react";
import Link from "next/link";
import { matchApi } from "@/lib/api";
import { Match } from "@/lib/database/types";
import CreateMatchModal from "./CreateMatchModal";

export default function MatchList() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
            <Link
              key={match.id}
              href={`/matches/${match.id}`}
              className="bg-gray-800 hover:bg-gray-700 p-6 rounded-lg transition-colors"
            >
              <h3 className="text-xl font-bold text-white mb-2">
                {match.name}
              </h3>
              <p className="text-gray-300">{formatDate(match.date)}</p>
            </Link>
          ))}
        </div>
      )}

      <CreateMatchModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onMatchCreated={loadMatches}
      />
    </div>
  );
}
