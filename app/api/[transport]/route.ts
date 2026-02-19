import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import sql from "@/lib/db";
import { searchByName, searchByBarcode } from "@/lib/openfoodfacts";

const handler = createMcpHandler(
  (server) => {
    server.tool(
      "search_food_by_name",
      "Search Open Food Facts for a food by name. Returns up to 5 results with nutritional info per 100g.",
      { query: z.string().describe("Food name to search for") },
      async ({ query }) => {
        const results = await searchByName(query);
        if (results.length === 0) {
          return {
            content: [
              { type: "text", text: `No results found for "${query}".` },
            ],
          };
        }
        return {
          content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        };
      }
    );

    server.tool(
      "search_food_by_barcode",
      "Look up a food product by barcode on Open Food Facts. Returns nutritional info per 100g.",
      { barcode: z.string().describe("Product barcode") },
      async ({ barcode }) => {
        const result = await searchByBarcode(barcode);
        if (!result) {
          return {
            content: [
              {
                type: "text",
                text: `No product found for barcode "${barcode}".`,
              },
            ],
          };
        }
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }
    );

    server.tool(
      "log_food",
      "Log a food entry with nutritional information to the daily food log.",
      {
        name: z.string().describe("Name of the food"),
        calories: z.number().describe("Calories (kcal)"),
        protein: z.number().describe("Protein (g)"),
        carbs: z.number().describe("Carbohydrates (g)"),
        fat: z.number().describe("Fat (g)"),
        amount_g: z.number().describe("Amount eaten in grams"),
        timestamp: z
          .string()
          .optional()
          .describe(
            "ISO 8601 timestamp for when the food was eaten. Defaults to now."
          ),
      },
      async ({ name, calories, protein, carbs, fat, amount_g, timestamp }) => {
        const loggedAt = timestamp ? new Date(timestamp) : new Date();

        const [row] = await sql`
          INSERT INTO food_log (name, calories, protein, carbs, fat, amount_g, logged_at)
          VALUES (${name}, ${calories}, ${protein}, ${carbs}, ${fat}, ${amount_g}, ${loggedAt})
          RETURNING id, name, calories, protein, carbs, fat, amount_g, logged_at
        `;

        return {
          content: [
            {
              type: "text",
              text: `Logged: ${row!.name} (${row!.amount_g}g) — ${row!.calories} kcal, ${row!.protein}g protein, ${row!.carbs}g carbs, ${row!.fat}g fat at ${row!.logged_at}`,
            },
          ],
        };
      }
    );

    server.tool(
      "get_today",
      "Get all food entries logged today (UTC) with per-item details and aggregated totals.",
      {},
      async () => {
        const now = new Date();
        const startOfDay = new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
        );
        const endOfDay = new Date(startOfDay.getTime() + 86400000);

        const entries = await sql`
          SELECT id, name, calories, protein, carbs, fat, amount_g, logged_at
          FROM food_log
          WHERE logged_at >= ${startOfDay} AND logged_at < ${endOfDay}
          ORDER BY logged_at ASC
        `;

        if (entries.length === 0) {
          return {
            content: [{ type: "text", text: "No food logged today." }],
          };
        }

        const totals = entries.reduce(
          (acc, e) => ({
            calories: acc.calories + Number(e.calories),
            protein: acc.protein + Number(e.protein),
            carbs: acc.carbs + Number(e.carbs),
            fat: acc.fat + Number(e.fat),
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );

        const round = (n: number) => Math.round(n * 10) / 10;

        const result = {
          date: startOfDay.toISOString().split("T")[0],
          entries,
          totals: {
            calories: round(totals.calories),
            protein: round(totals.protein),
            carbs: round(totals.carbs),
            fat: round(totals.fat),
          },
        };

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }
    );
  },
  { serverInfo: { name: "food-tracker", version: "1.0.0" } },
  { basePath: "/api", maxDuration: 60 }
);

export { handler as GET, handler as POST, handler as DELETE };
