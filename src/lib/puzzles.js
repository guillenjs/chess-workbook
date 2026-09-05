import { Chess } from "chess.js";

export function enrichPuzzle(item, requestedDifficulty) {
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

function playUciMove(chess, uci) {
  return chess.move({
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    promotion: uci.slice(4, 5) || undefined
  });
}
