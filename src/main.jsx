import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { BookOpen, Download, Loader2, Printer, RefreshCw, Search } from "lucide-react";
import { Chess } from "chess.js";
import "./styles.css";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8787";

const themeOptions = [
  "mix",
  "fork",
  "pin",
  "skewer",
  "discoveredAttack",
  "mate",
  "mateIn1",
  "mateIn2",
  "hangingPiece",
  "endgame",
  "opening",
  "middlegame",
  "queenRookEndgame",
  "advancedPawn"
];

const difficultyOptions = ["easiest", "easier", "normal", "harder", "hardest"];
const boardsPerPageOptions = [4, 6, 9, 12];

function App() {
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
      <section className="toolbar noPrint">
        <div>
          <p className="eyebrow">Lichess puzzle print studio</p>
          <h1>Chess Workbook</h1>
        </div>
        <button className="iconButton" type="button" onClick={() => window.print()} title="Print workbook">
          <Printer size={18} />
          Print
        </button>
      </section>

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

      <section className="preview noPrint">
        <div className="sectionHeader">
          <div>
            <p className="eyebrow">Preview</p>
            <h2>{workbook.length ? `${workbook.length} puzzles ready` : "Build a worksheet"}</h2>
          </div>
          <button className="secondaryButton" type="button" onClick={fetchPuzzles}>
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
        <div className="puzzleGrid">
          {workbook.map((item, index) => (
            <PuzzleCard key={item.id} item={item} index={index} />
          ))}
          {!workbook.length ? (
            <div className="emptyState">
              <BookOpen size={34} />
              Choose filters, then fetch puzzles to generate a two-page printable workbook.
            </div>
          ) : null}
        </div>
      </section>

      {workbook.length ? <PrintableWorkbook workbook={workbook} filters={filters} /> : null}

      <footer className="appFooter noPrint">
        <Download size={16} />
        Live puzzles use the Lichess batch puzzle API. A token is optional and only helps personalize results.
      </footer>
    </main>
  );
}

function PuzzleCard({ item, index }) {
  return (
    <article className="puzzleCard">
      <Board fen={item.positionFen} lastMove={item.lastMove} />
      <div className="cardMeta">
        <strong>#{index + 1} {item.sideToMove} to move</strong>
        <span>Difficulty {formatTheme(item.difficulty)}</span>
        <span>Last move: {item.lastMoveSan || "Unavailable"}</span>
        <span>{item.themes.map(formatTheme).slice(0, 3).join(", ")}</span>
      </div>
    </article>
  );
}

function PrintableWorkbook({ workbook, filters }) {
  const boardsPerPage = boardsPerPageOptions.includes(Number(filters.boardsPerPage)) ? Number(filters.boardsPerPage) : 4;
  const puzzlePages = chunkArray(workbook, boardsPerPage);

  return (
    <section className={`printWorkbook boardsPerPage-${boardsPerPage}`}>
      {puzzlePages.map((page, pageIndex) => (
        <div className="printPage" key={`puzzle-page-${pageIndex}`}>
          <PrintHeader title="Puzzle Sheet" filters={filters} pageNumber={pageIndex + 1} />
          <div className="printGrid">
            {page.map((item, itemIndex) => {
              const puzzleNumber = pageIndex * boardsPerPage + itemIndex + 1;

              return (
                <article className="printPuzzle" key={item.id}>
                  <Board fen={item.positionFen} lastMove={item.lastMove} coordinates />
                  <div className="printMeta">
                    <strong>{puzzleNumber}. {item.sideToMove} to move</strong>
                    <span>Last move: {item.lastMoveSan || "Unavailable"}</span>
                    <span className="printThemes">
                      {formatTheme(item.difficulty)} | {item.themes.map(formatTheme).slice(0, 3).join(", ")}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ))}
      <div className="printPage answerPage">
        <PrintHeader title="Solution Key" filters={filters} />
        <ol className="answers">
          {workbook.map((item) => (
            <li key={item.id}>
              <strong>{item.sideToMove}:</strong> {item.solutionSan.join(" ")}
              <span> Lichess puzzle {item.id}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function PrintHeader({ title, filters, pageNumber }) {
  return (
    <header className="printHeader">
      <div>
        <p>Chess Workbook</p>
        <h2>{title}</h2>
      </div>
      <span>
        {formatTheme(filters.theme)} | {formatTheme(filters.difficulty)}{pageNumber ? ` | Page ${pageNumber}` : ""}
      </span>
    </header>
  );
}

function Board({ fen, lastMove, coordinates = false }) {
  const board = fenToBoard(fen);
  const activeColor = fen.split(" ")[1] || "w";
  const flipped = activeColor === "b";
  const ranks = flipped ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1];
  const files = flipped ? ["h", "g", "f", "e", "d", "c", "b", "a"] : ["a", "b", "c", "d", "e", "f", "g", "h"];
  const highlightedSquares = uciSquares(lastMove);

  return (
    <div className="board" aria-label="Chess puzzle position">
      {ranks.map((rank) =>
        files.map((file) => {
          const square = `${file}${rank}`;
          const piece = board[square];
          const dark = (files.indexOf(file) + ranks.indexOf(rank)) % 2 === 1;
          const highlight = highlightedSquares.includes(square);

          return (
            <div className={`square ${dark ? "dark" : "light"} ${highlight ? "highlight" : ""}`} key={square}>
              {piece ? <span className={piece === piece.toUpperCase() ? "whitePiece" : "blackPiece"}>{pieceGlyph(piece)}</span> : null}
              {coordinates && file === files[0] ? <small className="rankLabel">{rank}</small> : null}
              {coordinates && rank === ranks[ranks.length - 1] ? <small className="fileLabel">{file}</small> : null}
            </div>
          );
        })
      )}
    </div>
  );
}

async function parseJsonResponse(response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return {
      error: "The server returned a non-JSON response",
      details: text.slice(0, 240)
    };
  }
}

function enrichPuzzle(item, requestedDifficulty) {
  if (!item?.puzzle) return null;

  const position = new Chess();
  let lastMove = item.puzzle.lastMove || "";
  let lastMoveSan = item.puzzle.lastMoveSan || "";
  let solutionMoves = item.puzzle.solution ?? [];

  if (item.puzzle.fen) {
    try {
      position.load(item.puzzle.fen);
    } catch {
      return null;
    }

    if (solutionMoves.length > 1) {
      try {
        const moveIn = playUciMove(position, solutionMoves[0]);
        lastMove = moveIn?.lan || solutionMoves[0];
        lastMoveSan = moveIn?.san || solutionMoves[0];
        solutionMoves = solutionMoves.slice(1);
      } catch {
        solutionMoves = item.puzzle.solution ?? [];
      }
    }
  } else {
    const game = new Chess();
    try {
      game.loadPgn(item.game.pgn, { strict: false });
    } catch {
      return null;
    }

    const history = game.history({ verbose: true });
    const initialPly = item.puzzle.initialPly ?? history.length;
    history.slice(0, initialPly).forEach((move) => position.move(move.san));
    const previousMove = history[initialPly - 1];
    lastMove = previousMove?.lan || "";
    lastMoveSan = previousMove?.san || "";
  }

  const solutionBoard = new Chess(position.fen());
  const solutionSan = [];

  for (const uci of solutionMoves) {
    try {
      const move = playUciMove(solutionBoard, uci);
      solutionSan.push(move?.san || uci);
    } catch {
      solutionSan.push(uci);
    }
  }

  return {
    id: item.puzzle.id,
    rating: item.puzzle.rating,
    difficulty: item.puzzle.requestedDifficulty || item.puzzle.difficulty || item.puzzle.difficultyLevel || requestedDifficulty || "normal",
    themes: item.puzzle.themes,
    positionFen: position.fen(),
    lastMove,
    lastMoveSan,
    sideToMove: position.turn() === "w" ? "White" : "Black",
    solutionSan
  };
}

function fenToBoard(fen) {
  const [placement] = fen.split(" ");
  const board = {};
  const ranks = placement.split("/");

  ranks.forEach((rankValue, rankIndex) => {
    let fileIndex = 0;
    for (const char of rankValue) {
      if (Number.isInteger(Number(char))) {
        fileIndex += Number(char);
      } else {
        const file = "abcdefgh"[fileIndex];
        const rank = 8 - rankIndex;
        board[`${file}${rank}`] = char;
        fileIndex += 1;
      }
    }
  });

  return board;
}

function uciSquares(uci) {
  if (!uci || uci.length < 4) return [];
  return [uci.slice(0, 2), uci.slice(2, 4)];
}

function playUciMove(chess, uci) {
  return chess.move({
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    promotion: uci.slice(4, 5) || undefined
  });
}

function pieceGlyph(piece) {
  return {
    k: "♚",
    q: "♛",
    r: "♜",
    b: "♝",
    n: "♞",
    p: "♟",
    K: "♔",
    Q: "♕",
    R: "♖",
    B: "♗",
    N: "♘",
    P: "♙"
  }[piece];
}

function formatTheme(value) {
  return String(value)
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function chunkArray(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

createRoot(document.getElementById("root")).render(<App />);
