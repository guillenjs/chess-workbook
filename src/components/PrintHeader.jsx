import { formatTheme } from "../lib/format.js";

export default function PrintHeader({ title, filters, pageNumber }) {
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
