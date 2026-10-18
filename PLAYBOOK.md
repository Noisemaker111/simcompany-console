# SimCompanies Playbook — reusable session system

The standing procedure for playing Jon's company (JonsCompany111). Follow top to bottom every
session and between timers. Update this file whenever the game teaches something new.

## Session checklist (every session, in order)

1. **Claim steering commands** — `POST {worker}/api/agent/claim` (worker = simcompany-console.jk10192000.workers.dev). Jon's orders override everything below.
2. **Prices** — `node tools/market.mjs` (GET API, 1 req/min max). Record grape/orange/apple buy prices + margins.
3. **Collect everything on the map** (`/landscape/`): click every right-side banner (achievement/level-up dialogs have a COLLECT button) and the golden $ statue at the HQ (login pickup).
4. **Check achievements** — `/achievements/`: anything "done" but uncollected = free cash. Track next-tier targets (they drive what we do).
5. **Store shelves** — `/b/{store}/`: restock with ALL + AVG PRICE. Empty shelf = rebuy fruit per margins (best margin first).
6. **Farm runs** — `/b/{farm}/production/{resource}/`: longest run the level allows. Surplus fruit beyond shelf space goes to the exchange at best bid (`/headquarters/warehouse/{res}/sell/` → ALL → UNDERCUT).
7. **Daily "Produce or sell today"** — after its cooldown (8:30 PM), collect +5 credits.
8. **Build/upgrade decision** — cash-gate ladder below.
9. **Push dashboard** — `{ state, log }` with fresh `ts` and a history point (t:'HH:MM', cash, water, power, transport, seeds, apples). Graphs need the time axis.

## Decision rules

- **Cash never below ~$1,000** outside builds; labor drains during runs (farm $104/h, store $138/h each).
- **Retail flip is the engine**: margin/u = store avg price − exchange ask − ~$2.25 (transport+fees observed). Rotate the best fruit; demand "low" still clears ~250 units/72 min per store.
- **Buy when shelf empties**; don't hoard more than 2 shelf-cycles of stock (cash sits idle otherwise).
- **Surplus apples** (over shelf space) → exchange at bid (thin but keeps XP + frees seeds).
- **Build gate**: build the next cheapest scaling building when cash ≥ cost + $2,000 buffer. Two buildings > one bigger building (Builder achievement ladder pays $4,500→$7,500→… for building counts).

## Build catalog (approx costs, verified 2026-10-18)

| Building | Cost | Notes |
|---|---|---|
| Farm | $6,875 | 202 apples/h; also seeds/oranges/grapes/wood/vegetables |
| Grocery store | $10,325 | retail all fruit; ~$380/h per shelf cycle |
| Ranch | $10,313 | pigs/cows chain |
| Beverage factory | $13,750 | higher-value production |
| Water reservoir | $20,626 | own water → farm input costs drop |
| Mine / Quarry | $24,063 | minerals chain |
| Bakery | $37,814 | flour/bread chain |
| Factory | $48,126 | industrial |
| Construction factory | $72,190 | **FOREVER GOAL** — construction units $2,440/u |
| Spring market | $6,903 | sells ONLY Easter goods — dead demand in October. Do not build outside season. |

Builds take 5 min and need materials (concrete/bricks/planks + construction units) — use BUY MISSING (~ = list cost).

## Roadmap / timeline (to construction units)

Phase 0 — NOW (level 2, $7k): two farms + two grocery stores running; store rotation + achievement ladder. (~$800–1,500/h with 2 shelves)
Phase 1 — tonight/tomorrow ($10–15k): collect Buyer $30k tier ($5,000), Builder 5/5 ($7,500), Employer 600 workers ($6,000). Keep both stores full; level to 3 (5hr runs).
Phase 2 — day 2–3 ($25–40k): Water reservoir (input independence) + Farm #3 or #4 (each farm ~$750/h profit).
Phase 3 — day 4–7 ($60–90k): Ranch/Beverage or Food processing — higher-value chains; upgrade stores (level 2+ = bigger shelves).
Phase 4 — week 2 ($100k+): Construction factory + keep retail engines running. Then construction units at $2,440/u = end-game income; reinvest into vertical integration facility.

## Open questions (verify as we play)

- Transport consumption per retail sale (affects margin math).
- Saturation endpoint (newspaper #138) for demand forecasting.
- Where exactly login rewards surface (golden statue pickup confirmed once; confirm it recurs daily).
- Upgrade costs per building level (UPGRADE button on building page).
