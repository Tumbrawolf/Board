# Board — Web Sim

Interactive, multiplayer web version of the **Board** tabletop game. Lives on the `web-sim`
branch. See the root `README.md` for the game's design/rules; this folder is the playable
implementation.

## Stage 1 (current): Lobby skeleton

- `server/` — Node + TypeScript backend: Express + Socket.IO for real-time rooms, `node:sqlite`
  (built into Node, no native deps) for a lightweight record of each started game.
- `client/` — Svelte 5 + TypeScript + Vite frontend.

What works right now: host a lobby (get a 4-letter room code), up to 4 players join by code,
host can fill empty seats with bots or remove seats, host edits room settings (Difficulty,
Secret Objective mix, a few optional rules) and everyone sees them live, players ready up, host
starts the game once everyone (non-bot) is ready. **The actual rules engine isn't wired in
yet** — "Start Game" just flips the room to `started` and records it to `data.sqlite`. That's
Stage 2.

## Running it locally

Two processes, in two terminals:

```bash
cd webapp/server
npm install      # first time only
npm run dev       # http://localhost:3001

cd webapp/client
npm install       # first time only
npm run dev       # http://localhost:5173
```

Open `http://localhost:5173` in up to 4 browser tabs/windows (or have other people on the same
network hit `http://<your-LAN-ip>:5173` once the client's started with `--host`) to test a
multi-player lobby. One tab creates the room and shares the 4-letter code; the others join with
it.

## Roadmap (see the project conversation for the full staging discussion)

1. ~~Lobby skeleton~~ (this stage)
2. Wire the rules engine in, all seats bot-controlled first (proves the engine refactor against
   the already-validated logic from `Working/sim.py` and the Playtest Game docs)
3. Make worker placement the first real human decision point
4. Expand to the rest of the decision points (purchases, equip, Command Cards, targeting)
5. Visual UI pass (board/lanes/resource trackers)
6. Rules page + Tutorial content
