# Parity checklist: Water, Mood and Sleep (Phase 3)

Features commonly found in popular water, mood and sleep trackers, and whether this app has them. **Status after Phase 3:** every "Planned" item is built except the home-screen widget, which needs a native build and comes with the Phase 7 store builds. Items marked **Your call** are common elsewhere but not in the spec; they are not built unless you ask.

## Water

| Feature                                                                                   | Status                                                                         |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Personal daily goal with balanced guidance (NHS), never an extreme goal                   | Planned (goal form already built in Phase 2)                                   |
| Quick-add buttons (glass, bottle, cup) in ml or fl oz by region                           | Planned                                                                        |
| Custom amount and drink type (water, tea, coffee, milk, juice, coconut water, buttermilk) | Planned. All non-alcoholic drinks count, as the NHS says                       |
| Edit, delete and undo entries                                                             | Planned                                                                        |
| Today's progress ring and entry list                                                      | Planned                                                                        |
| Week and month charts, daily average                                                      | Planned                                                                        |
| Smart reminders spread across waking hours, paused once the goal is met                   | Planned (uses the Phase 2 reminder engine)                                     |
| Home-screen widget (Android and iOS)                                                      | Planned; needs a native build, so it is verified with the Phase 7 store builds |
| Offline logging, included in export and deletion                                          | Planned                                                                        |
| Achievements: first entry, Well hydrated, streaks                                         | Already defined in Phase 2                                                     |
| Apple Health / Google Health Connect sync                                                 | **Your call.** Adds another health-data permission                             |
| Gamified pets or plants that suffer when you miss a goal                                  | Not planned: guilt-based                                                       |

## Mood

| Feature                                                                                                   | Status                                       |
| --------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Quick check-in on a 5-point scale with labels and icons                                                   | Planned                                      |
| Feelings and activity tags, optional note                                                                 | Planned                                      |
| Guided breathing (box 4-4-4-4, 4-7-8, calm 5-5) with an animated guide, haptics and reduce-motion support | Planned. No workout content                  |
| Prompted journal with rotating prompts                                                                    | Planned                                      |
| Calendar view (a colour per day) and history                                                              | Planned                                      |
| Monthly insights: mood spread, tags that appear on better days                                            | Planned, labelled as patterns, not diagnosis |
| Streaks with a grace day                                                                                  | Planned (Phase 2 engine)                     |
| Support resources if a journal entry or note mentions self-harm: Tele-MANAS 14416 (India) and 988 (USA)   | Planned. Detection runs only on the device   |
| Optional app lock (device PIN, fingerprint or face)                                                       | Planned                                      |
| Offline, export and deletion                                                                              | Planned                                      |
| AI chat therapist or mood diagnosis                                                                       | Not planned: medical and safety risk         |

## Sleep

| Feature                                                              | Status                                                             |
| -------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Log bedtime, wake time and how rested you feel (1 to 5), with a note | Planned                                                            |
| Wind-down reminder                                                   | Planned (reminder template already exists)                         |
| Week chart of duration, average duration and bedtime consistency     | Planned                                                            |
| Handles nights that cross midnight and daylight saving changes       | Planned, with tests                                                |
| Automatic sleep detection with phone sensors or a wearable           | **Your call.** Needs extra permissions and is unreliable on phones |
| Sleep "score" or medical sleep advice                                | Not planned: would imply clinical validation                       |

Every screen keeps the medical disclaimer, and every estimate is labelled as an estimate.
