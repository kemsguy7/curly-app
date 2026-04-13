<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Curly subscription management app. The integration includes:

- **PostHog SDK** installed (`posthog-react-native`) with all required Expo peer dependencies
- **`app.config.js`** created (converted from `app.json`) to support runtime env var injection via `extra`
- **`src/config/posthog.ts`** — PostHog client configured via `expo-constants`, with autocapture, lifecycle events, debug mode in dev, and graceful fallback if the token is not set
- **`app/_layout.tsx`** — `PostHogProvider` wrapping the app, plus manual screen tracking via `usePathname` / `useGlobalSearchParams` for Expo Router compatibility
- **Auth screens** — user identify + event capture on sign-in and sign-up
- **Settings screen** — `user_signed_out` capture + `posthog.reset()` on sign-out
- **Home screen** — `subscription_card_expanded` / `subscription_card_collapsed` events with subscription metadata
- **Subscription details screen** — `subscription_details_viewed` on mount

| Event | Description | File |
|---|---|---|
| `user_signed_in` | User signs in (password, MFA, or trust code) | `app/(auth)/sign-in.tsx` |
| `user_signed_up` | User creates and verifies a new account | `app/(auth)/sign-up.tsx` |
| `user_signed_out` | User signs out from settings | `app/(tabs)/settings.tsx` |
| `subscription_card_expanded` | User expands a subscription card on the home screen | `app/(tabs)/index.tsx` |
| `subscription_card_collapsed` | User collapses a subscription card on the home screen | `app/(tabs)/index.tsx` |
| `subscription_details_viewed` | User opens the subscription details screen | `app/subscriptions/[id].tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics**: https://us.posthog.com/project/380475/dashboard/1461785
- **Sign-ups & Sign-ins (Daily)**: https://us.posthog.com/project/380475/insights/cQCtTL9C
- **Sign-up → Subscription Engagement Funnel**: https://us.posthog.com/project/380475/insights/HLY4J014
- **Churn Signal — Daily Sign-outs**: https://us.posthog.com/project/380475/insights/qSYTmTZB
- **Subscription Engagement — Card Expansions & Detail Views**: https://us.posthog.com/project/380475/insights/FQgO2LC3
- **Sign-in Method Breakdown**: https://us.posthog.com/project/380475/insights/Bt8TdmhQ

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
