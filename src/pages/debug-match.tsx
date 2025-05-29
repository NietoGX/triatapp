import { useEffect, useState } from "react";
import { matchApi } from "@/lib/api";

export default function DebugMatchPage() {
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [availablePlayers, setAvailablePlayers] = useState([]);

  const matchId = "a9cbcfaa-6a87-4262-ae86-5648c8751e7e";

  useEffect(() => {
    async function loadData() {
      try {
        console.log("Loading match data...");
        setLoading(true);

        const matchData = await matchApi.getById(matchId);
        console.log("Match data:", matchData);
        setMatch(matchData.match);

        const players = await matchApi.getAvailablePlayers(matchId);
        console.log("Available players:", players);
        setAvailablePlayers(players);

        setLoading(false);
      } catch (err) {
        console.error("Error:", err);
        setError(err instanceof Error ? err.message : "Error loading data");
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-800 text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Match Page</h1>

      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Loading State:</h2>
          <p>Loading: {loading ? "true" : "false"}</p>
        </div>

        {error && (
          <div>
            <h2 className="text-xl font-semibold">Error:</h2>
            <p className="text-red-400">{error}</p>
          </div>
        )}

        <div>
          <h2 className="text-xl font-semibold">Match Data:</h2>
          <pre className="bg-gray-700 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(match, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Available Players:</h2>
          <p>Count: {availablePlayers.length}</p>
          <pre className="bg-gray-700 p-4 rounded text-sm overflow-auto max-h-60">
            {JSON.stringify(availablePlayers, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
