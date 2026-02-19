const USER_AGENT = "FoodTrackerMCP/1.0";

export interface NutritionResult {
  product_name: string;
  brand?: string;
  quantity?: string;
  serving_size?: string;
  code?: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
}

function normalize(product: {
  product_name?: string;
  brands?: string;
  quantity?: string;
  serving_size?: string;
  code?: string;
  nutriments?: Record<string, number>;
}): NutritionResult | null {
  if (!product.product_name || !product.nutriments) return null;

  return {
    product_name: product.product_name,
    brand: product.brands || undefined,
    quantity: product.quantity || undefined,
    serving_size: product.serving_size || undefined,
    code: product.code,
    calories_per_100g: product.nutriments["energy-kcal_100g"] ?? 0,
    protein_per_100g: product.nutriments["proteins_100g"] ?? 0,
    carbs_per_100g: product.nutriments["carbohydrates_100g"] ?? 0,
    fat_per_100g: product.nutriments["fat_100g"] ?? 0,
  };
}

export async function searchByName(query: string): Promise<NutritionResult[]> {
  const res = await fetch(
    `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&fields=code,product_name,brands,quantity,serving_size,nutriments&page_size=5`,
    { headers: { "User-Agent": USER_AGENT }, cache: "no-store" }
  );

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
    `https://world.openfoodfacts.net/api/v2/product/${encodeURIComponent(barcode)}?fields=product_name,brands,quantity,serving_size,nutriments`,
    { headers: { "User-Agent": USER_AGENT }, cache: "no-store" }
  );

  if (!res.ok) throw new Error(`Open Food Facts lookup failed: ${res.status}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json();
  if (data.status !== 1) return null;

  return normalize({ ...data.product, code: barcode });
}
