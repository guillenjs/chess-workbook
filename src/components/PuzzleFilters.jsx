import { Loader2, Search } from "lucide-react";
import { themeOptions, difficultyOptions, boardsPerPageOptions } from "../lib/options.js";
import { formatTheme } from "../lib/format.js";

export default function PuzzleFilters({ filters, updateFilter, fetchPuzzles, status, message }) {
  return (
      <section className="builder noPrint">
        <form onSubmit={fetchPuzzles} className="filters">
          <label>
            Source
            <select value={filters.source} onChange={(event) => updateFilter("source", event.target.value)}>
              <option value="local">Local database</option>
              <option value="live">Lichess API</option>
            </select>
          </label>

          <label>
            Theme
            <select value={filters.theme} onChange={(event) => updateFilter("theme", event.target.value)}>
              {themeOptions.map((theme) => (
                <option key={theme} value={theme}>
                  {formatTheme(theme)}
                </option>
              ))}
            </select>
          </label>

          <label>
            Count
            <input
              type="number"
              min="1"
              max="24"
              value={filters.count}
              onChange={(event) => updateFilter("count", event.target.value)}
            />
          </label>

          <label>
            Difficulty
            <select value={filters.difficulty} onChange={(event) => updateFilter("difficulty", event.target.value)}>
              {difficultyOptions.map((difficulty) => (
                <option key={difficulty} value={difficulty}>
                  {formatTheme(difficulty)}
                </option>
              ))}
            </select>
          </label>

          <label>
            Color
            <select value={filters.color} onChange={(event) => updateFilter("color", event.target.value)}>
              <option value="">Either</option>
              <option value="white">White to move</option>
              <option value="black">Black to move</option>
            </select>
          </label>

          <label>
            Boards per page
            <select
              value={filters.boardsPerPage}
              onChange={(event) => updateFilter("boardsPerPage", Number(event.target.value))}
            >
              {boardsPerPageOptions.map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </label>

          <button className="primaryButton" type="submit" disabled={status === "loading"}>
            {status === "loading" ? <Loader2 size={18} className="spin" /> : <Search size={18} />}
            Get puzzles
          </button>
        </form>
        {message ? <p className={`status ${status}`}>{message}</p> : null}
      </section>
  );
}
