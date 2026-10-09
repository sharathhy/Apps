# Parity checklist: Nutrition (Phase 5)

Features commonly found in popular food trackers, and whether this app has them. Items marked **Your call** are common elsewhere but not in the spec; they are not built unless you ask.

The rule for this module: **no calorie targets, deficits, "calories left" or weight-loss framing anywhere**, including achievements and notifications. Guidance is about balance and variety.

## Logging

| Feature                                                                                                 | Status                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Meals by time of day (breakfast, lunch, dinner, snacks) with quick re-log of recent and favourite foods | Planned                                                                                                                                                                                                   |
| Indian food database in household measures: katori, roti/chapati, idli, dosa, piece, glass, tablespoon  | Planned. A starter set of everyday foods across North, South, East and West Indian cooking, each with its nutrient source (ICMR-NIN Indian Food Composition Tables 2017, or USDA where IFCT has no entry) |
| US food database in cups, ounces, slices and pieces                                                     | Planned. A starter set of everyday foods from USDA FoodData Central (public domain)                                                                                                                       |
| Both databases work offline (bundled with the app)                                                      | Planned                                                                                                                                                                                                   |
| Search in English and Hindi (and common spellings like "chapati" / "roti")                              | Planned                                                                                                                                                                                                   |
| Barcode scan for packaged food                                                                          | Planned, using Open Food Facts (free and open). Camera permission asked only when you tap Scan, with an explanation first                                                                                 |
| Custom foods and recipes                                                                                | Planned (custom foods); recipes from several ingredients are **your call**                                                                                                                                |
| Macros: protein, carbohydrate, fat and fibre                                                            | Planned                                                                                                                                                                                                   |
| Energy (kcal) per food and per day                                                                      | Planned as plain information, **hidden by default** behind a setting, never with a target                                                                                                                 |
| Edit, delete and undo entries                                                                           | Planned                                                                                                                                                                                                   |
| Export and deletion                                                                                     | Planned                                                                                                                                                                                                   |

## Guidance

| Feature                                                                          | Status                                                                            |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Balanced plate view: how the day's food spreads across food groups               | Planned, following ICMR-NIN "My Plate for the Day" (India) and USDA MyPlate (USA) |
| Variety notes ("You had vegetables at two meals today")                          | Planned, positive wording only                                                    |
| Calorie goal, deficit, "calories remaining", weight-loss plans                   | Not planned: against the spec                                                     |
| Red/green "good" and "bad" food labels                                           | Not planned: encourages restriction                                               |
| Pregnancy-aware notes (for example, foods the NHS advises avoiding in pregnancy) | **Your call.** Useful, but adds medical content that needs review                 |

## Offline and sync (all trackers)

| Feature                                                                                             | Status                                           |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Every tracker keeps working with no connection                                                      | Already true; data is stored on the device first |
| Signed-in accounts sync water, mood, journal, breathing, sleep, cycle, pregnancy and nutrition logs | Planned                                          |
| A retry queue that sends changes when the connection returns, with backoff                          | Planned                                          |
| Conflicts between two devices resolved per entry (newest change wins), deletions kept as markers    | Planned                                          |
| A visible "Saved on this device, will sync" state and a sync status in Settings                     | Planned                                          |

## Achievements and notifications

| Feature                                                              | Status                        |
| -------------------------------------------------------------------- | ----------------------------- |
| "Colourful plate" for meals with vegetables or fruit on several days | Planned                       |
| "Home cooking" for logging home-made meals                           | Planned                       |
| Meal reminder (already in the reminder engine), neutral wording      | Planned                       |
| Anything rewarding eating less, skipping meals or weight change      | Not planned: against the spec |
