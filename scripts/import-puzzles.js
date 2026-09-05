import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const csvPath = resolve(process.argv[2] || "data/lichess_db_puzzle.csv");
const dbPath = resolve(process.argv[3] || "data/lichess-puzzles.sqlite");
const sqlitePath = process.env.SQLITE_BIN || "sqlite3";

console.log(`Importing ${csvPath}`);
console.log(`Writing ${dbPath}`);

const scratchDir = mkdtempSync(join(tmpdir(), "chess-workbook-import-"));
const sqlPath = join(scratchDir, "import.sql");

writeFileSync(
  sqlPath,
  `
.bail on
.mode csv
drop table if exists puzzles_raw;
create table puzzles_raw (
  PuzzleId text,
  FEN text,
  Moves text,
  Rating integer,
  RatingDeviation integer,
  Popularity integer,
  NbPlays integer,
  Themes text,
  GameUrl text,
  OpeningTags text,
  DailyDate text
);
.import --skip 1 '${csvPath.replaceAll("'", "''")}' puzzles_raw

drop table if exists puzzles;
create table puzzles (
  puzzle_id text primary key,
  fen text not null,
  moves text not null,
  rating integer not null,
  rating_deviation integer,
  popularity integer,
  nb_plays integer,
  themes text not null,
  game_url text,
  opening_tags text,
  daily_date text,
  side_to_move text generated always as (
    substr(fen, instr(fen, ' ') + 1, 1)
  ) stored
);

insert into puzzles (
  puzzle_id, fen, moves, rating, rating_deviation, popularity,
  nb_plays, themes, game_url, opening_tags, daily_date
)
select PuzzleId, FEN, Moves, Rating, RatingDeviation, Popularity,
       NbPlays, Themes, GameUrl, OpeningTags, DailyDate
from puzzles_raw;

drop table puzzles_raw;

create index if not exists idx_puzzles_rating on puzzles(rating);
create index if not exists idx_puzzles_side_to_move on puzzles(side_to_move);
create index if not exists idx_puzzles_themes on puzzles(themes);
create index if not exists idx_puzzles_rating_side on puzzles(rating, side_to_move);
vacuum;
`,
  "utf8"
);

const result = spawnSync(sqlitePath, [dbPath, `.read ${sqlPath}`], {
  stdio: "inherit"
});

rmSync(scratchDir, { recursive: true, force: true });

if (result.status !== 0) {
  process.exit(result.status || 1);
}

console.log("Puzzle database import complete.");
