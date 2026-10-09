# Privacy Policy (DRAFT — for legal review)

> **Status:** draft prepared by the development team. It must be reviewed by a qualified lawyer for India (Digital Personal Data Protection Act, 2023) and the USA (including Washington My Health My Data Act, Nevada SB 370, Connecticut and other state consumer health data laws) before publication. Placeholders are marked `[…]`.

**Effective date:** […]  
**Data fiduciary / controller:** […legal entity name, address…]  
**Grievance officer (India):** […name, email…]  
**Contact:** […privacy email…]

## 1. Summary

- Your health data is stored on your device first. An account is optional.
- We never sell your data and never use it for advertising. The app contains no advertising SDKs.
- You choose each category of health data separately, and you can withdraw consent at any time.
- You can export or permanently delete all of your data from inside the app.

## 2. What we collect

| Category                   | Examples                                                  | When                             | Purpose                                                |
| -------------------------- | --------------------------------------------------------- | -------------------------------- | ------------------------------------------------------ |
| Account                    | Email address, password (hashed)                          | Only if you create an account    | Sign-in, backup, sync                                  |
| Preferences                | Language, theme, which trackers you use, region and units | Always (on device)               | Show the app the way you chose                         |
| Water                      | Amounts and times                                         | If you consent                   | Daily progress and reminders                           |
| Mood and journal           | Mood ratings, tags, journal text, breathing sessions      | If you consent                   | Insights and streaks                                   |
| Sleep                      | Bed and wake times, quality                               | If you consent                   | Sleep patterns                                         |
| Period and cycle           | Period dates, flow, symptoms                              | If you consent                   | Cycle estimates                                        |
| Pregnancy                  | Due date, appointments, kicks, weight, checklists, names  | If you consent                   | Week-by-week tracking                                  |
| Nutrition                  | Meals, foods, custom foods                                | If you consent                   | Balanced nutrition summaries                           |
| Consent records            | What you agreed to and when                               | Always                           | Proving consent as the law requires                    |
| Anonymous usage statistics | Screen counts, crash reports                              | Only if you consent              | Fixing problems; never includes health details         |
| Notification delivery log  | Notification type, platform, outcome                      | When a notification is delivered | Debugging; contains no user identifier or message text |

We do not collect precise location, contacts, photos or advertising identifiers. If you scan a food barcode, the camera is used only while the scanner is open; no image is stored or sent.

## 3. Where data is stored

- **On your device**, in the app's private storage.
- **In your account** (only if you create one), in our database hosted by Supabase […region…]. Data is encrypted in transit (TLS) and at rest. Row Level Security ensures each account can read only its own records. While you are signed in, entries for the trackers you have allowed are copied to your account automatically so they are backed up and available on your other devices; trackers you have not allowed stay on the device.

## 4. Sharing

We do not sell or rent personal data. We share data only:

- with service providers that host the service on our behalf (Supabase for database and authentication; Sentry for crash reports with health details removed), under contracts that restrict their use;
- with Open Food Facts, only when you look up a packaged food: the barcode number is sent so the product can be found. No account details or health data are sent with it;
- with a partner you explicitly invite through partner sharing, limited to what you choose, revocable at any time;
- when required by law.

## 5. Your rights

You can, from inside the app: view and change consents (Settings → Your data → Data permissions), export all data (Settings → Your data → Export), and delete all data and your account (Settings → Your data → Delete). Deletion removes data from the device, our database and file storage, and cancels all scheduled notifications. You may also contact us to exercise rights of access, correction, erasure, grievance redressal and nomination under the DPDP Act, or rights under applicable US state laws. We do not discriminate against anyone for exercising their rights.

## 6. Children

The app is not directed to children under 18. […confirm age policy and verifiable parental consent requirements under DPDP Act…]

## 7. Retention

We keep account data until you delete it. Consent records are kept for […] after withdrawal where the law requires proof of consent. Backups are purged within […] days.

## 8. Changes

We will notify you in the app before material changes take effect and ask for fresh consent where required.
