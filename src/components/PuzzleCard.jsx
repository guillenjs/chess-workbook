import Board from "./Board.jsx";
import { formatTheme } from "../lib/format.js";

export default function PuzzleCard({ item, index }) {
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
