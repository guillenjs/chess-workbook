import { BookOpen, RefreshCw } from "lucide-react";
import PuzzleCard from "./PuzzleCard.jsx";

export default function PuzzlePreview({ workbook, fetchPuzzles }) {
  return (
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
  );
}
