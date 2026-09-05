import { DatabaseSync } from "node:sqlite";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const defaultDbPath = join(__dirname, "../../data/lichess-puzzles.sqlite");

const difficultyRanges = {
  easiest: [0, 900],
  easier: [901, 1200],
  normal: [1201, 1600],
  harder: [1601, 2000],
  hardest: [2001, 4000]
};

let db;

export function hasPuzzleDatabase() {
  return existsSync(getPuzzleDbPath());
}

export function getPuzzleDbPath() {
  return process.env.PUZZLE_DB_PATH || defaultDbPath;
}

export function queryPuzzles({ theme = "mix", difficulty = "normal", count = 8, color = "" }) {
  const database = getDatabase();
  const [minRating, maxRating] = difficultyRanges[difficulty] || difficultyRanges.normal;
  const where = ["rating between ? and ?"];
  const params = [minRating, maxRating];

  if (theme !== "mix") {
    where.push("(' ' || themes || ' ') like ?");
    params.push(`% ${theme} %`);
  }

  if (color === "white" || color === "black") {
    where.push("side_to_move = ?");
    params.push(color === "white" ? "w" : "b");
  }

  params.push(count);

  const rows = database
    .prepare(
      `
      select puzzle_id, fen, moves, rating, rating_deviation, popularity, nb_plays,
             themes, game_url, opening_tags, side_to_move
      from puzzles
      where ${where.join(" and ")}
      order by random()
      limit ?
      `
    )
    .all(...params);

  return rows.map((row) => ({
    game: {
      id: parseGameId(row.game_url),
      url: row.game_url,
      pgn: "",
      players: []
    },
    puzzle: {
      id: row.puzzle_id,
      fen: row.fen,
      rating: row.rating,
      ratingDeviation: row.rating_deviation,
      popularity: row.popularity,
      plays: row.nb_plays,
      solution: row.moves.split(" ").filter(Boolean),
      themes: row.themes.split(" ").filter(Boolean),
      gameUrl: row.game_url,
      openingTags: row.opening_tags?.split(" ").filter(Boolean) || [],
      difficulty,
      sideToMove: row.side_to_move
    }
  }));
}

function getDatabase() {
  if (!db) {
    if (!hasPuzzleDatabase()) {
      throw new Error(`Puzzle database not found at ${getPuzzleDbPath()}. Run npm run import:puzzles first.`);
    }
    db = new DatabaseSync(getPuzzleDbPath(), { readOnly: true });
  }

  return db;
}

function parseGameId(gameUrl) {
  const match = String(gameUrl || "").match(/lichess\.org\/([^/#]+)/);
  return match?.[1] || "";
}
