import { useState, useEffect } from "react";
import { AppPlayer } from "@/types";
import { matchApi } from "@/lib/api";
import { PlayerMatchStats } from "@/lib/database/types";

type PlayerStatsFormProps = {
  matchId: string;
  player: AppPlayer;
  teamId: string;
  onStatsSaved: () => void;
  existingStats?: PlayerMatchStats;
};

export default function PlayerStatsForm({
  matchId,
  player,
  teamId,
  onStatsSaved,
  existingStats,
}: PlayerStatsFormProps) {
  const [goals, setGoals] = useState(existingStats?.goals || 0);
  const [assists, setAssists] = useState(existingStats?.assists || 0);
  const [saves, setSaves] = useState(existingStats?.saves || 0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Update form when existingStats changes
    if (existingStats) {
      setGoals(existingStats.goals);
      setAssists(existingStats.assists);
      setSaves(existingStats.saves);
    }
  }, [existingStats]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      const result = await matchApi.saveStats(matchId, {
        player_id: player.id,
        team_id: teamId,
        goals,
        assists,
        saves,
      });

      if (result.success) {
        onStatsSaved();
      } else {
        setError("Failed to save player statistics");
      }
    } catch (err) {
      console.error("Error saving player stats:", err);
      setError("An error occurred while saving statistics");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-gray-800/70 rounded-md p-4 mb-4">
      <h3 className="text-lg font-medium text-white mb-3">
        {player.name}&apos;s Match Statistics
      </h3>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="bg-red-500/20 border border-red-500 p-2 rounded-lg text-white text-sm mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <label className="block text-gray-300 text-sm mb-1">Goals</label>
            <input
              type="number"
              min="0"
              value={goals}
              onChange={(e) => setGoals(Number(e.target.value))}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-1">Assists</label>
            <input
              type="number"
              min="0"
              value={assists}
              onChange={(e) => setAssists(Number(e.target.value))}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-1">Saves</label>
            <input
              type="number"
              min="0"
              value={saves}
              onChange={(e) => setSaves(Number(e.target.value))}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Stats"}
          </button>
        </div>
      </form>
    </div>
  );
}
