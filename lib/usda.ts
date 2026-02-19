import type { NutritionResult } from "./openfoodfacts";

const USDA_API_KEY = process.env.USDA_API_KEY ?? "DEMO_KEY";

export async function searchUSDA(
  query: string
): Promise<NutritionResult[]> {
  const res = await fetch(
    `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=5&dataType=SR%20Legacy,Foundation&api_key=${USDA_API_KEY}`,
    { cache: "no-store" }
  );

  if (!res.ok) throw new Error(`USDA search failed: ${res.status}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json();

  return (data.foods ?? [])
    .map(normalize)
    .filter((r: NutritionResult | null): r is NutritionResult => r !== null);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalize(food: any): NutritionResult | null {
  if (!food.description || !food.foodNutrients) return null;

  const nutrients: Record<string, number> = {};
  for (const n of food.foodNutrients) {
    nutrients[n.nutrientName] = n.value;
  }

  const calories = nutrients["Energy"] ?? 0;
  const protein = nutrients["Protein"] ?? 0;
  const carbs = nutrients["Carbohydrate, by difference"] ?? 0;
  const fat = nutrients["Total lipid (fat)"] ?? 0;

  return {
    product_name: food.description,
    brand: food.foodCategory || undefined,
    calories_per_100g: calories,
    protein_per_100g: protein,
    carbs_per_100g: carbs,
    fat_per_100g: fat,
  };
}
