# Sim Company Console

Two jobs, one project:

1. **Play SimCompanies for Jon** (simcompanies.com, company JonsCompany111, realm 0 Magnates) through his real Chrome with Owl (`owl.exe interact browser-*`).
2. **Keep the console dashboard live** (Cloudflare Worker, this repo's `worker/`) so Jon can watch and steer from anywhere: https://simcompany-console.jk10192000.workers.dev

## The mission: scale

Jon's forever goal is to build **construction-units production** (avg $2,440/unit). That needs levels, cash and building slots. Between actions, always be maximizing:

- Before each play session, run `node tools/market.mjs` (official GET API, **1 request/minute max, GET only**) to get current exchange prices and retail-flip margins. Buy the highest-margin fruit for the store shelf (grapes > oranges > apples today; re-verify — prices move).
- The **store is the money engine**: buy fruit cheap on the exchange, shelve at AVG PRICE in the grocery store. Rebuy every shelf cycle.
- The **farm** produces apples on the longest run the level allows (level 3 = 5hr orders); surplus goes to the exchange at best bid.
- Collect every achievement / level-up banner on the map (they hand out thousands).
- When cash allows, buy more retail capacity (upgrade store / build another store / unlock the 50-credit parcel) — more retail slots = more income per hour.
- Report before/after numbers with units; state pushes update the dashboard.

## Rules

- Every game action goes through the real browser UI (Owl steps). No game POSTs through the API — the game's own guide says automation that performs actions risks a captcha and account deletion. Jon has accepted the automation risk for browser play; still act human-paced, no rapid-fire loops.
- Never poll in a sleep loop; bounded waits between game timers, act, then update the dashboard and stop.
- Push dashboard state after every meaningful action: `POST {worker-url}/api/agent/state` with header `x-agent-token` (token in `worker/agent-token.txt`, never commit it). Body: `{ state, log }`. Keep `state.history` appending with real timestamps ('HH:MM') — graphs need the time axis.
- Claim steering commands each cycle: `POST /api/agent/claim` (returns queued commands, logs them as 'sent'). Obey Jon's commands over default strategy.
- Knowledge lives in `C:/Users/Jk101/.agents/knowledge/simcompany.md` — update it when you verify new mechanics (prices, recipes, unlocks, endpoints).

## Deploy

```
cd worker
wrangler deploy
```

KV namespace CONSOLE (id e213bc6e5b314058a02d5aa489d71bfb), secret AGENT_TOKEN.
