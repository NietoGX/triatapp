import { useState } from "react";
import Head from "next/head";
import Link from "next/link";

export default function DbSetupPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    details?: unknown;
    match?: unknown;
  } | null>(null);

  const createMatchesTable = async () => {
    try {
      setIsCreating(true);
      setResult(null);

      const response = await fetch("/api/matches/create-table", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      console.log("Table creation result:", data);
      setResult(data);
    } catch (error) {
      console.error("Error creating table:", error);
      setResult({
        success: false,
        message: "Error creating table",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const testCreateMatch = async () => {
    try {
      setIsTesting(true);
      setResult(null);

      // Create a test match
      const response = await fetch("/api/matches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Test Match " + new Date().toLocaleTimeString(),
          date: new Date().toISOString().split("T")[0],
        }),
      });

      const data = await response.json();
      console.log("Match creation test result:", data);

      // Format the result appropriately
      if (response.ok) {
        setResult({
          success: true,
          message: "Test match created successfully",
          match: data,
        });
      } else {
        setResult({
          success: false,
          message: data.error || "Error creating test match",
          details: data.details || {},
        });
      }
    } catch (error) {
      console.error("Error testing match creation:", error);
      setResult({
        success: false,
        message: "Error testing match creation",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Database Setup | Futbol Triaje</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-white">Database Setup</h1>
            <Link
              href="/"
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Back to Home
            </Link>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">
              Matches Table Setup
            </h2>
            <p className="text-gray-300 mb-6">
              This will create or recreate the matches and player_match_stats
              tables with the correct schema. Use this if you&apos;re
              experiencing errors creating matches.
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={createMatchesTable}
                disabled={isCreating}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {isCreating ? "Creating Table..." : "Recreate Matches Table"}
              </button>

              <button
                onClick={testCreateMatch}
                disabled={isTesting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {isTesting ? "Creating Match..." : "Test Create Match"}
              </button>

              <Link
                href="/matches"
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Go to Matches
              </Link>
            </div>

            {result && (
              <div
                className={`mt-6 p-4 rounded-lg ${
                  result.success
                    ? "bg-green-800/50 text-green-200"
                    : "bg-red-800/50 text-red-200"
                }`}
              >
                <h3 className="text-lg font-bold mb-2">
                  {result.success ? "Success" : "Error"}
                </h3>
                <p>{result.message}</p>

                {(result.details || result.match) && (
                  <pre className="mt-2 p-2 bg-black/30 rounded overflow-auto text-sm">
                    {JSON.stringify(result.details || result.match, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
