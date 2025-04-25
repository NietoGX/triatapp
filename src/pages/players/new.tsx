import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import { playerApi } from "@/lib/api";
import { Position } from "@/types";

type FormState = {
  name: string;
  nickname: string;
  position: string;
  number: string;
  rating: string;
  goals: string;
  assists: string;
  saves: string;
  goals_saved: string;
};

const initialFormState: FormState = {
  name: "",
  nickname: "",
  position: "",
  number: "",
  rating: "3",
  goals: "0",
  assists: "0",
  saves: "0",
  goals_saved: "0",
};

const positions = [
  { value: "GK", label: "Portero" },
  { value: "CL", label: "Central Izq." },
  { value: "CR", label: "Central Der." },
  { value: "ML", label: "Medio Izq." },
  { value: "MR", label: "Medio Der." },
  { value: "ST", label: "Delantero" },
];

export default function NewPlayerPage() {
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Convert string values to appropriate types
      const playerData = {
        name: formData.name,
        nickname: formData.nickname || null,
        position: (formData.position as Position) || null,
        number: formData.number ? parseInt(formData.number, 10) : null,
        rating: parseInt(formData.rating, 10),
        goals: parseInt(formData.goals, 10),
        assists: parseInt(formData.assists, 10),
        saves: parseInt(formData.saves, 10),
        goals_saved: parseInt(formData.goals_saved, 10),
      };

      await playerApi.create(playerData);
      router.push("/players");
    } catch (err: any) {
      console.error("Error creating player:", err);
      setError(err.message || "Failed to create player");
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Add New Player - Futbol Triaje</title>
        <meta name="description" content="Add a new player to Futbol Triaje" />
      </Head>
      <main className="min-h-screen bg-field-grass bg-cover bg-center p-4">
        <div className="container mx-auto max-w-2xl bg-black/70 backdrop-blur-sm rounded-xl p-6 shadow-lg text-white">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Add New Player</h1>
            <Link
              href="/players"
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white"
            >
              Back to Players
            </Link>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 text-white"
                  placeholder="Full name"
                />
              </div>

              <div>
                <label htmlFor="nickname" className="block mb-1">
                  Nickname
                </label>
                <input
                  id="nickname"
                  name="nickname"
                  type="text"
                  value={formData.nickname}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 text-white"
                  placeholder="Nickname (optional)"
                />
              </div>

              <div>
                <label htmlFor="position" className="block mb-1">
                  Position
                </label>
                <select
                  id="position"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 text-white"
                >
                  <option value="">Select position</option>
                  {positions.map((pos) => (
                    <option key={pos.value} value={pos.value}>
                      {pos.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="number" className="block mb-1">
                  Jersey Number
                </label>
                <input
                  id="number"
                  name="number"
                  type="number"
                  min="0"
                  max="99"
                  value={formData.number}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 text-white"
                  placeholder="Jersey number"
                />
              </div>

              <div>
                <label htmlFor="rating" className="block mb-1">
                  Rating <span className="text-red-500">*</span>
                </label>
                <input
                  id="rating"
                  name="rating"
                  type="number"
                  required
                  min="1"
                  max="5"
                  value={formData.rating}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 text-white"
                  placeholder="Player rating (1-5)"
                />
              </div>
            </div>

            <div className="border-t border-gray-700 pt-4 mt-4">
              <h2 className="text-xl mb-3">Statistics</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="goals" className="block mb-1">
                    Goals
                  </label>
                  <input
                    id="goals"
                    name="goals"
                    type="number"
                    min="0"
                    value={formData.goals}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 text-white"
                  />
                </div>

                <div>
                  <label htmlFor="assists" className="block mb-1">
                    Assists
                  </label>
                  <input
                    id="assists"
                    name="assists"
                    type="number"
                    min="0"
                    value={formData.assists}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 text-white"
                  />
                </div>

                <div>
                  <label htmlFor="saves" className="block mb-1">
                    Saves
                  </label>
                  <input
                    id="saves"
                    name="saves"
                    type="number"
                    min="0"
                    value={formData.saves}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 text-white"
                  />
                </div>

                <div>
                  <label htmlFor="goals_saved" className="block mb-1">
                    Goals Saved
                  </label>
                  <input
                    id="goals_saved"
                    name="goals_saved"
                    type="number"
                    min="0"
                    value={formData.goals_saved}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <Link
                href="/players"
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-white mr-2"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-white flex items-center"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  "Save Player"
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
