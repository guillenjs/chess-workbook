import { Printer } from "lucide-react";

export default function Toolbar() {
  return (
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
  );
}
