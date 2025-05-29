import { useState } from "react";

export default function MigratePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>("");

  const handleMigrate = async () => {
    setIsLoading(true);
    setResult("Ejecutando migración...");

    try {
      const response = await fetch("/api/database/migrate", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        setResult("✅ Migración completada exitosamente!");
      } else {
        setResult(`❌ Error: ${data.error}\nDetalles: ${data.details}`);
      }
    } catch (error) {
      setResult(`❌ Error de conexión: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Migración de Base de Datos
          </h1>

          <div className="mb-6">
            <p className="text-gray-600 text-sm mb-4">
              Esta página ejecutará una migración para arreglar las claves
              foráneas faltantes en la base de datos que están causando
              problemas con el triaje.
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
              <p className="text-yellow-800 text-sm">
                ⚠️ Esta operación modificará la estructura de la base de datos.
                Asegúrate de tener un respaldo antes de continuar.
              </p>
            </div>
          </div>

          <button
            onClick={handleMigrate}
            disabled={isLoading}
            className={`w-full py-2 px-4 rounded-md font-medium ${
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            } text-white transition-colors`}
          >
            {isLoading ? "Ejecutando..." : "Ejecutar Migración"}
          </button>

          {result && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Resultado:
              </h3>
              <pre className="bg-gray-100 p-3 rounded text-sm text-gray-800 whitespace-pre-wrap">
                {result}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
