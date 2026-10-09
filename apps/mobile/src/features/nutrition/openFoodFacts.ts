import { create } from 'zustand';

import { NUTRIENT_LIMITS, type CustomFood, type Nutrients } from './model';

/**
 * Barcode lookups use Open Food Facts, a free, open database of packaged
 * foods (data under the Open Database License, so it is credited wherever
 * it is shown). Only the barcode number is sent. Values come from what
 * contributors typed off the packet, so the form asks the person to check.
 */
export const OFF_ATTRIBUTION = 'Open Food Facts (openfoodfacts.org), ODbL';

export type FoodDraft = Partial<Omit<CustomFood, 'id' | 'updatedAt'>>;

/** EAN-8, UPC-A, EAN-13 and GTIN-14 are 8 to 14 digits. */
export function cleanBarcode(text: string): string | null {
  const digits = text.replace(/\s+/g, '');
  return /^\d{8,14}$/.test(digits) ? digits : null;
}

type Nutriments = Record<string, unknown>;

const pick = (n: Nutriments, key: string, suffix: '_serving' | '_100g', max: number) => {
  const raw = n[`${key}${suffix}`];
  const v = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : NaN;
  return Number.isFinite(v) && v >= 0 && v <= max ? Math.round(v * 100) / 100 : null;
};

function nutrientsFrom(n: Nutriments, suffix: '_serving' | '_100g'): Nutrients {
  return {
    kcal: pick(n, 'energy-kcal', suffix, NUTRIENT_LIMITS.kcal),
    protein: pick(n, 'proteins', suffix, NUTRIENT_LIMITS.protein),
    carbs: pick(n, 'carbohydrates', suffix, NUTRIENT_LIMITS.carbs),
    fat: pick(n, 'fat', suffix, NUTRIENT_LIMITS.fat),
    fiber: pick(n, 'fiber', suffix, NUTRIENT_LIMITS.fiber),
  };
}

const known = (n: Nutrients) => Object.values(n).some((v) => v !== null);

/** Turns an Open Food Facts product into a food draft: per serving when the packet gives one, else per 100 g. */
export function draftFromProduct(barcode: string, product: Record<string, unknown>): FoodDraft {
  const n = (product.nutriments ?? {}) as Nutriments;
  const name = [product.product_name, product.brands]
    .filter((v): v is string => typeof v === 'string' && v.trim() !== '')
    .map((v) => v.trim())
    .join(' · ')
    .slice(0, 200);
  const servingGrams =
    typeof product.serving_quantity === 'number' && product.serving_quantity > 0
      ? Math.round(product.serving_quantity * 100) / 100
      : Number(product.serving_quantity) > 0
        ? Math.round(Number(product.serving_quantity) * 100) / 100
        : null;
  const perServing = nutrientsFrom(n, '_serving');
  const useServing = servingGrams !== null && known(perServing);
  return {
    name,
    barcode,
    servingUnit: useServing
      ? typeof product.serving_size === 'string' && product.serving_size.trim()
        ? product.serving_size.trim().slice(0, 60)
        : `${servingGrams} g`
      : '100 g',
    servingGrams: useServing ? servingGrams : 100,
    nutrients: useServing ? perServing : nutrientsFrom(n, '_100g'),
    group: 'other',
    source: 'openFoodFacts',
  };
}

export async function lookupBarcode(
  barcode: string,
  fetchImpl: typeof fetch = fetch,
): Promise<FoodDraft | null> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,brands,serving_size,serving_quantity,nutriments`;
  const response = await fetchImpl(url, { headers: { Accept: 'application/json' } });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Open Food Facts: ${response.status}`);
  const body = (await response.json()) as { status?: number; product?: Record<string, unknown> };
  if (body.status !== 1 || !body.product) return null;
  return draftFromProduct(barcode, body.product);
}

/** Hands a scanned product to the food form (not persisted). */
export const useFoodDraft = create<{ draft: FoodDraft | null }>(() => ({ draft: null }));
