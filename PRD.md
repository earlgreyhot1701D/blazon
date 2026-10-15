# Blazon: PRD

**Status:** v0.1, Oct 15 2026
**Challenge:** DEV Hacktoberfest Open-Source AI Challenge, Week 2, "Side Hustle." Due Oct 18 2026, 11:59 PM PDT.
**One line:** Type a word, get a coat of arms that never changes. Gemma writes the motto.

---

## 1. The problem

Personalized coat-of-arms art is a real Etsy category. One personalized crest download listed there at $70 (checked Oct 15 2026). Most sellers either draw by hand (slow, pricey) or use a random generator (different every time, so it isn't really *yours*).

Blazon gives you arms that belong to your word. Same word, same arms, forever. You can check it. Then a herald gives it a voice.

## 2. Who it's for

| Person | What they want |
|---|---|
| Someone buying a gift | A family name turned into something to frame, today, for free |
| A small Etsy seller | A starting design for a print they sell |
| A tabletop or worldbuilding hobbyist | Arms and lore for a house that doesn't exist |

## 3. The split

**Structure is deterministic. Flavor is AI-generated.**

| Part | Made by | Changes? |
|---|---|---|
| Field, tinctures, charge, arrangement | Hash of the word + fixed rule table | Never |
| Formal blazon text | Same rule table | Never |
| Shield SVG | Same rule table | Never |
| Motto | Gemma | Each time you ask |
| Lore paragraph | Gemma, grounded in the blazon | Each time you ask |
| Fallback motto when Gemma is away | Fixed list, picked by the word's hash | Never |

The model writes the caption. The math draws the picture.

## 4. Done, for the user

1. Land on the page. One empty box: your word. No word typed in for them, no sample arms, no sample motto. Understand it in two seconds.
2. Type a word. Arms and blazon appear instantly. Same word, same arms, every time.
3. Ask the herald for a motto. Motto and lore appear in under ten seconds. If the server is asleep, a "waking the herald" message shows instead of nothing.
4. Download for print. An SVG lands in downloads with the motto under the shield.
5. Under the button: free, and a Buy Me a Coffee link if they hang it on a wall.
6. Leave. Nothing stored, nothing to log out of.

**Not done, and we say so:** no PNG export, no editing the arms, no saved gallery.

## 5. Features

| Label | Feature |
|---|---|
| MUST | Deterministic arms, blazon, SVG (the Stitch redesign, `public/`) |
| MUST | `POST /motto` returns `{ motto, lore }` from Gemma |
| MUST | Fallback motto from a fixed list when Gemma is off, capped, or slow |
| MUST | Daily cap (total) and per-visitor cap. Key in env only |
| MUST | Download SVG includes the motto |
| MUST | "Waking the herald" state for Render free-tier cold start |
| MUST | Buy Me a Coffee link (buymeacoffee.com/earlgreyhot1701d) |
| MUST | Page loads empty. No prefilled word, no sample arms, no sample blazon, no sample motto or lore. Each area shows an empty state until the user acts. Example buttons stay, since the user has to click them |
| MUST | About area links to clewlabs.org |
| STUB | Ollama provider (self-hosted Gemma). Stub is in `server/gemma.js` |
| STUB | Etsy listing text export (title, tags, description) |
| STUB | Deterministic motto seed (same word, same motto) |
| NEVER | Model touches the arms, tinctures, charge, or blazon text |
| NEVER | Payment inside the app, accounts, or storing anything about the user |
| NEVER | `innerHTML`, `eval`, `Math.random`, API key in the browser |
| NEVER | Autopopulated content on load. Placeholder text in the input is fine; a real value is not |

## 5a. Empty states (what the page shows before the user acts)

| Area | Empty state |
|---|---|
| Word input | Empty, placeholder "Inscribe a word..." |
| Arms title | "Awaiting inscription" |
| Shield | Blank outline of the shield, no tinctures |
| Blazon line | "Enter a word to reveal its arms." |
| Heraldic elements | Each row shows a dash |
| Motto line | Hidden, takes no space |
| Herald panel | Lore empty; motto button disabled until arms exist |
| Copy, Download, Share | Disabled until arms exist |

Note: the current Stitch build loads with "Avalon" filled in and drawn. That gets removed in Block 2.

## 6. Architecture

```
Browser (public/)                       Server (server/, plain Node, no framework)
  index.html, style.css, app.js           index.js     static files, /healthz, POST /motto
  hash -> rule table -> SVG + blazon      validate.js  checks the request and Gemma's reply
  POST /motto { word, blazon }  ------>   limits.js    rate limit, daily caps
  <------ { motto, lore } or error        gemma.js     the only file that calls the model
  error -> fallback motto (from hash)
```

Hosted on Render, free plan. Model: `gemma-4-26b-a4b-it` on the Gemini API (same as Two Sisters Tinctures).

### `POST /motto` contract

Request:

```json
{ "word": "Cordero", "blazon": "Quarterly Sable and Argent, a cross counterchanged." }
```

| Field | Rule |
|---|---|
| `word` | 1 to 40 chars. Letters (any language), digits, space, apostrophe, hyphen, period |
| `blazon` | 1 to 120 chars. English letters, space, comma, period only. Real blazons top out at 61 chars |

Responses:

| Status | Body | Browser does |
|---|---|---|
| 200 | `{ "motto": "...", "lore": "..." }` | Show motto and lore. Source line: written by Gemma |
| 400 / 413 | `{ "error": "bad_request" \| "too_large" }` | Fallback motto |
| 403 | `{ "error": "origin" }` | Fallback motto |
| 429 | `{ "error": "daily_cap" \| "slow_down" }` + `Retry-After` | Fallback motto. Source line: herald reached today's limit |
| 502 | `{ "error": "unreadable" }` | Fallback motto |
| 503 | `{ "error": "model_off" }` | Fallback motto |
| 504 | `{ "error": "model_timeout" }` | Fallback motto |

Reply caps: motto 80 chars, lore 600 chars. Markup or links in either = rejected as 502.

## 7. Security (pre-deploy checklist)

| Item | How |
|---|---|
| Authorization | No accounts. Same-origin check on `/motto` |
| Validation | Browser and server. Server never trusts the browser or the model |
| CORS | None set. Cross-origin POST gets 403 |
| Rate limiting | 6/min per IP, `IP_DAILY_CAP` per IP, `DAILY_CAP` total |
| Password reset | N/A, no accounts |
| Frontend errors | Every fetch in try/catch, every failure shows a fallback motto |
| DB indexes | N/A, no database |
| Logging | Error codes and timing only. Never the word, the body, or the key |
| Alarms | STUB. Render's health check on `/healthz` |
| Rollback | Render "Rollback" to previous deploy. `autoDeployTrigger: off` at submission |
| Prompt injection | User text inside a DATA block with delimiters scrubbed; blazon allowlist; output checks |

## 8. Build blocks

| Block | What | Who | Status |
|---|---|---|---|
| 1 | Skeleton: Tinctures server copied, Blazon split into `public/` | Claude | PASS |
| 1b | Stitch redesign replaces `public/` | Claude | PASS |
| 3 | Server: `/motto` route, `gemma.js` prompt, `validate.js`, tests (21) | Claude | PASS |
| 2 | UI: motto button, states, fallback list, SVG download with motto, coffee link | Copilot | Next |
| 4 | Deploy to Render, set `GEMINI_API_KEY`, live test | Shara | |
| 5 | README, dev.to post, first user | Shara + Claude | |

## Appendix A: fallback mottos

Picked in the browser by the word's hash, so the same word always gets the same fallback. All original.

1. Steady in the long night
2. By patience, the tower stands
3. What is kept, endures
4. Quiet hands, open door
5. Hold the line, light the way
6. Slow roots, tall oak
7. Neither first nor last, but faithful
8. The tide returns
9. Kindness is a shield
10. Ask, and be answered
11. We mend what we break
12. Small fires, long winters

## Appendix B: Gemma prompt

Lives in `server/gemma.js` as `INSTRUCTIONS`. Temperature 0.9 (flavor wants variety), thinking level MINIMAL (Tinctures found the default timed out).
