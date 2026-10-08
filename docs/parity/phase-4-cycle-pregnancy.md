# Parity checklist: Cycle and Pregnancy (Phase 4)

Features commonly found in popular cycle and pregnancy trackers, and whether this app has them. Both modules are only offered to people who chose "Women" or "Everyone" during setup, and only after the separate consent for that data category. Items marked **Your call** are common elsewhere but not in the spec; they are not built unless you ask.

Every screen in both modules shows the medical disclaimer. Every prediction is labelled as an estimate, and the source behind each calculation is cited in the code and on screen.

## Cycle

| Feature                                                                                             | Status                                                                                              |
| --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Log period start and end, edit and delete                                                           | Planned                                                                                             |
| Next period prediction from your own history (average of recent cycles, 28 days until there's data) | Planned, labelled as an estimate                                                                    |
| Fertile window and estimated ovulation (about 14 days before the next period)                       | Planned. Always labelled as an estimate and "not a form of contraception" (NHS, ACOG)               |
| Irregular cycles: shows a range instead of a single day when cycles vary by more than 7 days        | Planned. Suggests talking to a doctor when cycles fall outside 21 to 35 days, without alarm wording |
| Daily log: flow (spotting to heavy), symptoms, mood link, note                                      | Planned                                                                                             |
| Calendar with logged and predicted days told apart by pattern as well as colour                     | Planned (colour-blind safe)                                                                         |
| Cycle history: length and period length per cycle, averages                                         | Planned                                                                                             |
| Period reminder before the estimated start                                                          | Planned (Phase 2 reminder engine, private wording on the lock screen)                               |
| Export (CSV and JSON) and deletion                                                                  | Planned (CSV per cycle for sharing with a doctor)                                                   |
| Uses the "last period start" already asked for in Phase 2                                           | Planned                                                                                             |
| Contraception mode, "safe days" or pregnancy-chance percentages                                     | Not planned: unsafe and against the spec                                                            |
| Basal temperature or ovulation test logging                                                         | **Your call.** Common in fertility apps; could look like a contraception method                     |
| Apple Health / Health Connect sync                                                                  | **Your call** (same open question as Phase 3)                                                       |

## Pregnancy

| Feature                                                                                                    | Status                                                                                                                                  |
| ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Due date from last period (Naegele's rule, LMP + 280 days), from a known due date, or from conception date | Planned, labelled as an estimate (ACOG, NHS)                                                                                            |
| Current week and day, trimester, days to go                                                                | Planned                                                                                                                                 |
| Week-by-week content for weeks 4 to 42, each with its source (WHO, ACOG, NHS)                              | Planned. Written plainly, no size-of-fruit claims presented as fact, English and Hindi                                                  |
| Appointments with reminders                                                                                | Planned                                                                                                                                 |
| Symptom log with how strong it was                                                                         | Planned. A short list of symptoms (heavy bleeding, severe headache, reduced movement) shows "contact your doctor or maternity unit now" |
| Weight log with a chart, no targets or loss goals                                                          | Planned. Shows the IOM/ACOG ranges only as reference text, never as a goal                                                              |
| Kick counter (count to 10, session history)                                                                | Planned, from week 28. Reduced movement always points to contacting a midwife or doctor (NHS)                                           |
| Baby names with favourites                                                                                 | Planned                                                                                                                                 |
| Hospital bag checklist with a starter list you can edit                                                    | Planned                                                                                                                                 |
| Partner sharing: invite by link, choose what to share, revoke anytime                                      | Planned. Needs its own consent and a signed-in account. Revoking deletes the partner's access immediately                               |
| Push to the partner for server events (an update was shared)                                               | Planned, Expo push service (free). Private wording                                                                                      |
| Contraction timer                                                                                          | **Your call.** Common, but most guidance says to call the maternity unit rather than rely on an app                                     |
| Pregnancy loss: a gentle way to end tracking that stops all pregnancy content and reminders                | Planned. Ends tracking quietly, no achievements                                                                                         |
| Postpartum mode or baby tracker                                                                            | Not planned for now (outside the spec)                                                                                                  |

## How the calculations are checked

Unit tests compare the due date, gestational age, cycle averages and fertile window against worked examples from the cited sources, including leap years, cycles across daylight saving changes and time zone moves.
