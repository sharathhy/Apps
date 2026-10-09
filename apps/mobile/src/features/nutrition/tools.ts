/** Nutrition sub-pages, served at /nutrition-tools/<id>. */
export const nutritionTools = ['add', 'food', 'foods', 'scan'] as const;
export type NutritionToolId = (typeof nutritionTools)[number];
