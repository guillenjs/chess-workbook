import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import Toolbar from "./components/Toolbar.jsx";
import PuzzleFilters from "./components/PuzzleFilters.jsx";
import PuzzlePreview from "./components/PuzzlePreview.jsx";
import PrintableWorkbook from "./components/PrintableWorkbook.jsx";
import { enrichPuzzle } from "./lib/puzzles.js";
import { parseJsonResponse } from "./lib/api.js";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8787";

export default function App() {
  const [filters, setFilters] = useState({
    source: "local",
    theme: "mix",
    count: 6,
    difficulty: "normal",
    boardsPerPage: 4,
    color: ""
  });
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [puzzles, setPuzzles] = useState([]);

  const workbook = useMemo(() => puzzles.map((puzzle) => enrichPuzzle(puzzle, filters.difficulty)).filter(Boolean), [filters.difficulty, puzzles]);

  async function fetchPuzzles(event) {
    event?.preventDefault();
    setStatus("loading");
    setMessage("");

    const params = new URLSearchParams({
      theme: filters.theme,
      count: filters.count,
      difficulty: filters.difficulty
    });
    if (filters.color) params.set("color", filters.color);

    try {
      const endpoint = filters.source === "live" ? "live" : "local";
      const response = await fetch(`${apiBaseUrl}/api/puzzles/${endpoint}?${params}`);
      const payload = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error([payload.error, payload.details].filter(Boolean).join(": ") || "Could not fetch puzzles");
      }

      const nextPuzzles = payload.puzzles || [];
      setPuzzles(nextPuzzles);
      setMessage(payload.note || `Loaded ${nextPuzzles.length} puzzles from ${payload.source}.`);
      setStatus("idle");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <main className="appShell">
      <Toolbar />

      <PuzzleFilters filters={filters} updateFilter={updateFilter} fetchPuzzles={fetchPuzzles} status={status} message={message} />

      <PuzzlePreview workbook={workbook} fetchPuzzles={fetchPuzzles} />

      {workbook.length ? <PrintableWorkbook workbook={workbook} filters={filters} /> : null}

      <footer className="appFooter noPrint">
        <Download size={16} />
        Live puzzles use the Lichess batch puzzle API. A token is optional and only helps personalize results.
      </footer>
    </main>
  );
}
