const USER_AGENT = "FoodTrackerMCP/1.0";

export interface NutritionResult {
  product_name: string;
  code?: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
}

function normalize(product: {
  product_name?: string;
  code?: string;
  nutriments?: Record<string, number>;
}): NutritionResult | null {
  if (!product.product_name || !product.nutriments) return null;

  return {
    product_name: product.product_name,
    code: product.code,
    calories_per_100g: product.nutriments["energy-kcal_100g"] ?? 0,
    protein_per_100g: product.nutriments["proteins_100g"] ?? 0,
    carbs_per_100g: product.nutriments["carbohydrates_100g"] ?? 0,
    fat_per_100g: product.nutriments["fat_100g"] ?? 0,
  };
}

export async function searchByName(query: string): Promise<NutritionResult[]> {
  const url = new URL("https://world.openfoodfacts.org/api/v2/search");
  url.searchParams.set("q", query);
  url.searchParams.set("fields", "code,product_name,nutriments");
  url.searchParams.set("page_size", "5");

  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!res.ok) throw new Error(`Open Food Facts search failed: ${res.status}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json();
  return (data.products ?? [])
    .map(normalize)
    .filter((p: NutritionResult | null): p is NutritionResult => p !== null);
}

export async function searchByBarcode(
  barcode: string
): Promise<NutritionResult | null> {
  const res = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}?fields=product_name,nutriments`,
    { headers: { "User-Agent": USER_AGENT } }
  );

  if (!res.ok) throw new Error(`Open Food Facts lookup failed: ${res.status}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json();
  if (data.status !== 1) return null;

  return normalize({ ...data.product, code: barcode });
}
