import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import MatchList from "@/components/MatchList";
import CreateMatchModal from "@/components/CreateMatchModal";

// SVG Icons
const CalendarIcon = () => (
  <svg
    className="w-8 h-8"
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

const HomeIcon = () => (
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
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
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

export default function MatchesPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleMatchCreated = () => {
    // Trigger a refresh of the match list
    setRefreshTrigger((prev) => prev + 1);
    setIsCreateModalOpen(false);
  };

  return (
    <>
      <Head>
        <title>Partidos | TriatApp</title>
        <meta
          name="description"
          content="Gestión de partidos - Sistema de triaje para fútbol"
        />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-stone-800 to-stone-900">
        <div className="container mx-auto py-6 px-4">
          {/* Enhanced Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-green-600/20 rounded-xl">
                  <CalendarIcon />
                </div>
                <h1 className="text-4xl font-bold text-white text-shadow-lg">
                  Gestión de Partidos
                </h1>
              </div>
              <p className="text-gray-300">
                Organiza y gestiona todos tus partidos de fútbol
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Link href="/" className="btn-primary">
                <HomeIcon />
                Volver al Inicio
              </Link>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="btn-success"
              >
                <PlusIcon />
                Nuevo Partido
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            <MatchList key={refreshTrigger} />
          </div>
        </div>

        <CreateMatchModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onMatchCreated={handleMatchCreated}
        />
      </main>
    </>
  );
}
