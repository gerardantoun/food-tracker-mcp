# Food Tracker MCP - MVP

## Tech Stack

| Layer        | Choice                                     |
|--------------|--------------------------------------------|
| Language     | TypeScript                                 |
| MCP SDK      | `@modelcontextprotocol/sdk` + Vercel `mcp-handler` |
| Runtime      | Vercel Functions                           |
| Database     | Supabase (Postgres)                        |
| External API | Open Food Facts                            |

## Premise

Claude's vision does the heavy lifting — it identifies foods, reads barcodes, parses nutrition labels, reads scales. The MCP is a thin lookup + logging layer.

## MCP Tools

1. **`search_food(query)`** — search Open Food Facts API by name or barcode, return nutritional info
2. **`log_food(name, calories, protein, carbs, fat, amount_g, timestamp?)`** — save a food entry. Timestamp defaults to now but can be set to any date/time (e.g., logging yesterday's meals).
3. **`get_today()`** — return all entries logged today with per-item and total macros

## What Claude Handles Natively (No MCP Work)

- Identify food from photos
- Read barcodes from images
- Read nutrition labels from images
- Read weight from packaging or kitchen scales
- Ask about portions
- All conversational logic

## What's Excluded from MVP

- Keyword matching system
- Image storage / product memory
- Custom product database
- History-based suggestions
- Multi-user / auth

## Data Model

### `food_log`

| Column     | Type      | Description                                        |
|------------|-----------|----------------------------------------------------|
| id         | INTEGER   | Primary key, auto-increment                        |
| name       | TEXT      | Food name (e.g., "Chicken Breast")                 |
| calories   | REAL      | kcal                                               |
| protein    | REAL      | grams                                              |
| carbs      | REAL      | grams                                              |
| fat        | REAL      | grams                                              |
| amount_g   | REAL      | portion size in grams                               |
| logged_at  | TIMESTAMP | when the food was eaten, defaults to now, user-overridable |

Single table. Single user. No relations. Just log and query.

## Example Flow

1. User sends photo of chicken breast packaging to Claude
2. Claude reads the image: "raw chicken breast, 600g on the label"
3. Claude calls `search_food("chicken breast raw")`
4. MCP returns nutritional data per 100g
5. Claude asks "Are you eating all 600g or a portion?"
6. User says "half"
7. Claude calculates for 300g, calls `log_food("Chicken Breast", 495, 93, 0, 10.5, 300)`
8. Entry saved. User can call `get_today()` anytime to see their daily totals.
