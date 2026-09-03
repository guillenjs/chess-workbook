# Chess Workbook

A small React + Node app for building printable chess puzzle worksheets from Lichess puzzle data.

## What it does

- Queries a local SQLite database imported from the public Lichess puzzle CSV.
- Optionally fetches live puzzle batches from the Lichess puzzle API by theme, relative difficulty, count, and optional color.
- Prints a two-part workbook: puzzle boards first, solution key second.

## Lichess data notes

The local database source uses Lichess puzzle ratings and maps them to app difficulty labels:

```text
easiest: 0-900
easier: 901-1200
normal: 1201-1600
harder: 1601-2000
hardest: 2001+
```

Lichess live puzzle endpoints use relative difficulty directly: `easiest`, `easier`, `normal`, `harder`, and `hardest`.

Import the public Lichess puzzle CSV from:

https://database.lichess.org/#puzzles

That dataset includes `PuzzleId`, `FEN`, `Moves`, `Rating`, `Themes`, and related metadata. The app reconstructs the printable position by applying the first CSV move as the opponent's last move, then treats the remaining moves as the solution.

## Setup

```bash
npm install
cp .env.example .env
npm run import:puzzles
npm run dev
```

Then open the Vite URL, usually:

```text
http://127.0.0.1:5173
```

The local API defaults to:

```text
http://127.0.0.1:8787
```

## Optional Lichess token

Anonymous puzzle API calls work. If you add a token with `puzzle:read` scope:

```text
LICHESS_TOKEN=your_token_here
```

Lichess can avoid serving puzzles that account has already seen.

## Scripts

```bash
npm run dev       # React frontend + Express API
npm run import:puzzles # import data/lichess_db_puzzle.csv into SQLite
npm run build     # production frontend build
npm run preview   # preview built frontend
npm run lint      # eslint
```

## API routes

```text
GET /api/puzzles/live?theme=fork&count=6&difficulty=normal
GET /api/puzzles/local?theme=mix&count=6&difficulty=normal
```

## Codebase documentation

For a walkthrough of the main entry points, data flow, database import, puzzle reconstruction, and print layout, see:

```text
docs/architecture.md
```
