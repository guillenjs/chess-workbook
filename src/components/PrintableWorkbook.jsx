import Board from "./Board.jsx";
import PrintHeader from "./PrintHeader.jsx";
import { boardsPerPageOptions } from "../lib/options.js";
import { formatTheme } from "../lib/format.js";

function chunkArray(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

export default function PrintableWorkbook({ workbook, filters }) {
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

