# Cal.com Integration Guide

This app books meetings using the **keyless Cal.com embed** via
[`@calcom/embed-react`](https://cal.com/docs/integrations/embed). Clicking a
booking option opens the Cal.com scheduler in a modal popup, on-site, with no
page navigation.

> **No API key is used or required.** A previous version of this project shipped
> a REST-API booking path that needed a `cal_live_…` key. That path was removed
> because this is a static Vite site: any `VITE_*` value is inlined into the
> client bundle and would publicly leak the key. Do **not** add a Cal.com API
> key to `.env` / `.env.local`.

## How it works

The integration lives entirely in:

- `src/components/estimator/MeetingScheduler.tsx`

The Cal.com handle and event types are defined as constants at the top of that
file so they are easy to change in one place:

```ts
const CAL_NAMESPACE = "vs-booking";
const CAL_LINK_15 = "hisham-khalid-qyohid/15min"; // 15-minute intro call
const CAL_LINK_30 = "hisham-khalid-qyohid/30min"; // 30-minute consultation
```

The embed is initialized once with `getCalApi`, then opened as a modal for the
chosen event type:

```ts
import { getCalApi } from "@calcom/embed-react";

// Initialize the embed UI once (single consistent namespace).
useEffect(() => {
  (async () => {
    const cal = await getCalApi({ namespace: CAL_NAMESPACE });
    cal("ui", {
      cssVarsPerTheme: { light: { "cal-brand": "#44080b" } }, // VS brand color
      hideEventTypeDetails: false,
      layout: "month_view",
      theme: "light",
    });
  })();
}, []);

// Open the popup for a specific event type.
const openCalWidget = async (calLink: string) => {
  const cal = await getCalApi({ namespace: CAL_NAMESPACE });
  cal("modal", { calLink, config: { layout: "month_view" } });
};
```

> **Namespace note:** the *same* `namespace` must be used for both `getCalApi`
> and every `cal(...)` action. A mismatch (e.g. initializing one namespace and
> opening another) causes the popup to silently no-op. This app uses a single
> `CAL_NAMESPACE` everywhere.

## Booking options

`MeetingScheduler` offers two Cal.com options plus WhatsApp and email
fallbacks:

| Option                       | calLink                       |
| ---------------------------- | ----------------------------- |
| Book a 15-min intro call     | `hisham-khalid-qyohid/15min`  |
| Book a 30-min consultation   | `hisham-khalid-qyohid/30min`  |

## Changing the handle or event types

1. Open `src/components/estimator/MeetingScheduler.tsx`.
2. Edit `CAL_LINK_15` / `CAL_LINK_30` (format: `<cal-handle>/<event-slug>`).
3. To add another event type, add a constant and a corresponding option in
   `mainOptions` that calls `openCalWidget(<your link>)`.

## Resources

- Cal.com Embed Documentation: https://cal.com/docs/integrations/embed
- Public profile: https://cal.com/hisham-khalid-qyohid
