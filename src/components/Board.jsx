
export default function Board({ fen, lastMove, coordinates = false }) {
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
