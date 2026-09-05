import "dotenv/config";
import express from "express";
import cors from "cors";
import { hasPuzzleDatabase, queryPuzzles } from "./lib/puzzle-db.js";

const app = express();
const port = Number(process.env.PORT || 8787);
const lichessBaseUrl = "https://lichess.org";
const allowedDifficulties = new Set(["easiest", "easier", "normal", "harder", "hardest"]);
const livePuzzleCache = new Map();
const liveCacheTtlMs = 60_000;
let lichessCooldownUntil = 0;

app.use(cors({ origin: ["http://127.0.0.1:5173", "http://localhost:5173"] }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/puzzles/live", async (req, res) => {
  const {
    theme = "mix",
    difficulty = "normal",
    count = "8",
    color = ""
  } = req.query;

  const desiredCount = clampInteger(count, 1, 24, 8);
  const selectedDifficulty = allowedDifficulties.has(String(difficulty)) ? String(difficulty) : "normal";
  const selectedTheme = sanitizeAngle(theme);
  const selectedColor = color === "white" || color === "black" ? color : "";
  const cacheKey = JSON.stringify({
    theme: selectedTheme,
    difficulty: selectedDifficulty,
    count: desiredCount,
    color: selectedColor
  });
  const cached = livePuzzleCache.get(cacheKey);

  try {
    if (cached && Date.now() - cached.createdAt < liveCacheTtlMs) {
      return res.json({
        ...cached.payload,
        note: "Loaded from a short local cache to avoid Lichess rate limits."
      });
    }

    if (Date.now() < lichessCooldownUntil) {
      return res.status(429).json({
        error: "Lichess is rate limiting requests",
        details: "Please wait about one minute before asking Lichess for more puzzles. Seed puzzles still work while this cools down."
      });
    }

    const url = new URL(`/api/puzzle/batch/${selectedTheme}`, lichessBaseUrl);
    url.searchParams.set("difficulty", selectedDifficulty);
    url.searchParams.set("nb", String(desiredCount));
    if (selectedColor) url.searchParams.set("color", selectedColor);

    const response = await fetch(url, {
      headers: buildLichessHeaders()
    });

    if (!response.ok) {
      const details = await response.text();
      if (response.status === 429) {
        lichessCooldownUntil = Date.now() + liveCacheTtlMs;
      }
      return res.status(response.status).json({
        error: response.status === 429 ? "Lichess is rate limiting requests" : "Lichess request failed",
        status: response.status,
        details:
          response.status === 429
            ? "Lichess asks clients to wait a full minute after HTTP 429 before resuming API usage."
            : details.slice(0, 400)
      });
    }

    const payload = await response.json();
    const puzzles = (payload.puzzles ?? []).slice(0, desiredCount).map((item) => ({
      ...item,
      puzzle: {
        ...item.puzzle,
        difficulty: selectedDifficulty
      }
    }));

    const payloadForClient = {
      source: "lichess-live",
      note: null,
      puzzles
    };
    livePuzzleCache.set(cacheKey, {
      createdAt: Date.now(),
      payload: payloadForClient
    });
    res.json(payloadForClient);
  } catch (error) {
    res.status(502).json({
      error: "Could not reach Lichess",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

app.get("/api/puzzles/local", (req, res) => {
  const { theme = "mix", difficulty = "normal", count = "8", color = "" } = req.query;
  const desiredCount = clampInteger(count, 1, 24, 8);
  const selectedDifficulty = allowedDifficulties.has(String(difficulty)) ? String(difficulty) : "normal";
  const selectedTheme = sanitizeAngle(theme);
  const selectedColor = color === "white" || color === "black" ? color : "";

  if (!hasPuzzleDatabase()) {
    return res.status(503).json({
      error: "Puzzle database is not ready",
      details: "Run npm run import:puzzles to create data/lichess-puzzles.sqlite from the Lichess puzzle CSV."
    });
  }

  try {
    const puzzles = queryPuzzles({
      theme: selectedTheme,
      difficulty: selectedDifficulty,
      count: desiredCount,
      color: selectedColor
    });

    res.json({
      source: "local-database",
      note:
        puzzles.length < desiredCount
          ? `Loaded ${puzzles.length} matching puzzles from the local database. Try a broader theme or difficulty for more.`
          : null,
      puzzles
    });
  } catch (error) {
    res.status(500).json({
      error: "Could not query puzzle database",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

app.listen(port, () => {
  console.log(`Chess Workbook API running on http://127.0.0.1:${port}`);
});

function buildLichessHeaders() {
  const headers = {
    Accept: "application/json",
    "User-Agent": "chess-workbook/0.1.0"
  };

  if (process.env.LICHESS_TOKEN) {
    headers.Authorization = `Bearer ${process.env.LICHESS_TOKEN}`;
  }

  return headers;
}

function sanitizeAngle(value) {
  return String(value || "mix")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 80) || "mix";
}

function clampInteger(value, min, max, fallback) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}
