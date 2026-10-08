# Native end-to-end flows (Maestro)

These flows drive the Android and iOS apps. They need a device build (a development build or the EAS preview APK), so they run from Phase 7 onward rather than in CI. The same journeys run on every push against the web build with Playwright (`e2e/web`).

```bash
# Install Maestro: https://maestro.mobile.dev
maestro test .maestro/            # all flows
maestro test .maestro/water.yaml  # one flow
```

Each flow starts from a fresh install (`clearState`) and goes through onboarding first.
