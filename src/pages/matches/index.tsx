import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import MatchList from "@/components/MatchList";
import CreateMatchModal from "@/components/CreateMatchModal";

export default function MatchesPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleMatchCreated = () => {
    // Trigger a refresh of the match list
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <>
      <Head>
        <title>Partidos | Futbol Triaje</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-white">Partidos</h1>
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Volver al inicio
              </Link>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Nuevo Partido
              </button>
            </div>
          </div>

          <MatchList key={refreshTrigger} />

          <CreateMatchModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onMatchCreated={handleMatchCreated}
          />
        </div>
      </div>
    </>
  );
}
