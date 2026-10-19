# Sim Company Console

Two jobs, one project:

1. **Play SimCompanies for Jon** (simcompanies.com, company JonsCompany111, realm 0 Magnates) through his real Chrome with Owl (`owl.exe interact browser-*`).
2. **Keep the console dashboard live** (Cloudflare Worker, this repo's `worker/`) so Jon can watch and steer from anywhere: https://simcompany-console.jk10192000.workers.dev

## Read first

**[PLAYBOOK.md](PLAYBOOK.md) is the standing procedure** — session checklist, decision rules, build catalog, and the roadmap/timeline to construction-units production. Follow it top to bottom. Knowledge doc: `C:/Users/Jk101/.agents/knowledge/simcompany.md`.

## Memory discipline (how this project learns)

1. The moment you need something you don't know, **append it to [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md)** (question, why needed, how to verify). Never hold an unknown in your head — the next session won't have it.
2. Every play session, **verify 1–2 open questions** with the smallest experiment, then move the verified answer into PLAYBOOK.md / the knowledge doc and archive the row with its evidence.
3. Every observation gets logged (log.txt + dashboard push) with numbers and units.
4. Game-timer waits are bounded (no sleep-loops) and end with a dashboard update.

## The mission: scale

Jon's forever goal is to build **construction-units production** (avg $2,440/unit; the factory is ~$72k). That needs levels, cash and building slots. Between actions, always be maximizing:

- Before each play session, run `node tools/market.mjs` (official GET API, **1 request/minute max, GET only**) to get current exchange prices and retail-flip margins. Buy the highest-margin fruit for the store shelf (grapes > oranges > apples today; re-verify — prices move).
- The **store is the money engine**: buy fruit cheap on the exchange, shelve at AVG PRICE in the grocery stores. Rebuy every shelf cycle. Two stores now.
- The **farms** produce apples on the longest run the level allows (level 3 = 5hr orders); surplus goes to the exchange at best bid.
- Collect every achievement / level-up banner on the map (they hand out thousands — today: $22k+ from banners) and check `/achievements/` for ready-but-uncollected rewards and next-tier targets.
- When cash allows, buy more retail/production capacity — the build gate is in the playbook.
- Report before/after numbers with units; state pushes update the dashboard.

## Rules

- Every game action goes through the real browser UI (Owl steps). No game POSTs through the API — the game's own guide says automation that performs actions risks a captcha and account deletion. Jon has accepted the automation risk for browser play; still act human-paced, no rapid-fire loops.
- **Human pacing: pause 3–6 s between browser actions** (a Start-Sleep between steps reads fine in logs and keeps the traffic human-shaped). Never chain many clicks in one instant; one meaningful action per beat.
- **No idle gaps by design**: the restock decision point is when a store's shelf timer has < 45 min left — warehouse stock must already cover the next shelf cycle. The worker's `derive()` flags this as a GAP ALERT; never let one fire and stay unfired.
- Never poll in a sleep loop; bounded waits between game timers, act, then update the dashboard and stop.
- Push dashboard state after every meaningful action: prefer one `POST {worker-url}/api/agent/event(s)` per action (canonical reducer) or `POST /api/agent/seed` for a full overwrite. Header `x-agent-token` (token in `worker/agent-token.txt`, never commit). Buildings carry `timer: {startsAt, endsAt, label}` so the site derives countdowns, "done — needs next step" and gap alerts.
- Claim steering commands each cycle: `POST /api/agent/claim` (returns queued commands, logs them as 'sent'). Obey Jon's commands over default strategy.
- Knowledge lives in `C:/Users/Jk101/.agents/knowledge/simcompany.md` — update it when you verify new mechanics (prices, recipes, unlocks, endpoints).

## Deploy

```
cd worker
wrangler deploy
```

KV namespace CONSOLE (id e213bc6e5b314058a02d5aa489d71bfb), secret AGENT_TOKEN.
