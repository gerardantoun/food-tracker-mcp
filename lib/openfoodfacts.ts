const USER_AGENT = "FoodTrackerMCP/1.0 (github.com/gerardantoun/food-tracker-mcp)";

const OFF_BASE_URL = process.env.OFF_BASE_URL ?? "https://world.openfoodfacts.org";

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

export interface ProductFields {
  code: string;
  product_name?: string;
  brands?: string;
  quantity?: string;
  serving_size?: string;
  categories?: string;
  ingredients_text?: string;
  nutrition_data_per?: "100g" | "serving";
  calories?: number;
  fat?: number;
  saturated_fat?: number;
  carbs?: number;
  sugars?: number;
  fiber?: number;
  protein?: number;
  salt?: number;
  comment?: string;
}

function buildProductForm(input: ProductFields): FormData {
  const userId = process.env.OFF_USERNAME;
  const password = process.env.OFF_PASSWORD;
  if (!userId || !password) {
    throw new Error("OFF_USERNAME and OFF_PASSWORD environment variables are required.");
  }

  const form = new FormData();
  form.append("user_id", userId);
  form.append("password", password);
  form.append("app_name", "FoodTrackerMCP");
  form.append("app_version", "1.0.0");
  form.append("code", input.code);

  if (input.product_name !== undefined) form.append("product_name", input.product_name);
  if (input.brands !== undefined) form.append("brands", input.brands);
  if (input.quantity !== undefined) form.append("quantity", input.quantity);
  if (input.serving_size !== undefined) form.append("serving_size", input.serving_size);
  if (input.categories !== undefined) form.append("categories", input.categories);
  if (input.ingredients_text !== undefined) form.append("ingredients_text_en", input.ingredients_text);
  if (input.comment !== undefined) form.append("comment", input.comment);
  if (input.nutrition_data_per !== undefined) form.append("nutrition_data_per", input.nutrition_data_per);

  if (input.calories !== undefined) {
    form.append("nutriment_energy-kcal", String(input.calories));
    form.append("nutriment_energy-kcal_unit", "kcal");
  }
  if (input.fat !== undefined) {
    form.append("nutriment_fat", String(input.fat));
    form.append("nutriment_fat_unit", "g");
  }
  if (input.saturated_fat !== undefined) {
    form.append("nutriment_saturated-fat", String(input.saturated_fat));
    form.append("nutriment_saturated-fat_unit", "g");
  }
  if (input.carbs !== undefined) {
    form.append("nutriment_carbohydrates", String(input.carbs));
    form.append("nutriment_carbohydrates_unit", "g");
  }
  if (input.sugars !== undefined) {
    form.append("nutriment_sugars", String(input.sugars));
    form.append("nutriment_sugars_unit", "g");
  }
  if (input.fiber !== undefined) {
    form.append("nutriment_fiber", String(input.fiber));
    form.append("nutriment_fiber_unit", "g");
  }
  if (input.protein !== undefined) {
    form.append("nutriment_proteins", String(input.protein));
    form.append("nutriment_proteins_unit", "g");
  }
  if (input.salt !== undefined) {
    form.append("nutriment_salt", String(input.salt));
    form.append("nutriment_salt_unit", "g");
  }

  return form;
}

async function submitProduct(form: FormData): Promise<{ status: number; status_verbose: string }> {
  const res = await fetch(`${OFF_BASE_URL}/cgi/product_jqm2.pl`, {
    method: "POST",
    headers: { "User-Agent": USER_AGENT },
    body: form,
  });

  if (!res.ok) throw new Error(`Open Food Facts request failed: ${res.status}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json();
  return { status: data.status, status_verbose: data.status_verbose };
}

export async function addProduct(input: ProductFields & { product_name: string }): Promise<{ status: number; status_verbose: string }> {
  return submitProduct(buildProductForm(input));
}

export async function updateProduct(input: ProductFields): Promise<{ status: number; status_verbose: string }> {
  return submitProduct(buildProductForm(input));
}
