# Cal.com Integration Guide

This guide explains how to integrate Cal.com with the Vanilla&Somethin' Calculator application.

## Prerequisites

- Cal.com account (https://cal.com)
- API key from Cal.com
- Cal.com username/event type configured

## Step 1: Configure Environment Variables

The environment variables are already set up in `.env.local`:

```env
VITE_CAL_API_KEY=cal_live_420f3dffbfbc8f19c70895b4600507a0
VITE_CAL_USERNAME=vanilla-somethin-nezld5
VITE_CAL_EVENT_TYPE_ID=
```

### Getting Your Event Type ID

1. Go to https://cal.com/event-types
2. Click on the event type you want to use (e.g., "30min Meeting", "Consultation", etc.)
3. The URL will show the event type ID or slug
4. Update `VITE_CAL_EVENT_TYPE_ID` in `.env.local`

Example event types:
- `30min` for a 30-minute meeting
- `consultation` for a consultation meeting
- `site-visit` for site visit scheduling

## Step 2: Integration Options

There are three ways to integrate Cal.com:

### Option A: Cal.com Embed Widget (Recommended - Easiest)

This embeds the Cal.com booking interface directly in your app.

**Implementation:**

1. Install Cal.com embed library:
```bash
npm install @calcom/embed-react
```

2. Update `MeetingScheduler.tsx` to include Cal.com embed:

```typescript
import Cal, { getCalApi } from "@calcom/embed-react";
import { useEffect } from "react";

// Inside your component:
const CalEmbed = () => {
  useEffect(() => {
    (async function () {
      const cal = await getCalApi();
      cal("ui", {
        styles: { branding: { brandColor: "#4F090C" } },
        hideEventTypeDetails: false,
        layout: "month_view"
      });
    })();
  }, []);

  return (
    <Cal
      calLink="vanilla-somethin-nezld5/30min"
      style={{ width: "100%", height: "100%", overflow: "scroll" }}
      config={{
        layout: 'month_view',
        theme: 'light'
      }}
    />
  );
};
```

3. Add the Cal.com embed as a new option in the "Schedule Meeting" flow.

### Option B: Direct Link Integration (Simplest - Already Implemented)

Users click a button that opens Cal.com in a new tab.

**Implementation:**

Update the "virtual" meeting option to use Cal.com:

```typescript
{
  id: "virtual",
  title: "Virtual Meeting",
  description: "Book via Cal.com",
  icon: <Video className="size-5" />,
  action: () => {
    window.open('https://cal.com/vanilla-somethin-nezld5', '_blank');
  }
}
```

### Option C: API Integration (Advanced - Programmatic Booking)

Create bookings programmatically using the Cal.com API.

**Implementation:**

1. Create a Cal.com API utility file `src/utils/calcom.ts`:

```typescript
const CAL_API_KEY = import.meta.env.VITE_CAL_API_KEY;
const CAL_API_BASE = 'https://api.cal.com/v1';

export interface BookingData {
  eventTypeId: number;
  start: string; // ISO 8601 format
  responses: {
    name: string;
    email: string;
    notes?: string;
  };
  timeZone: string;
  language: string;
  metadata?: Record<string, any>;
}

export const createBooking = async (data: BookingData) => {
  const response = await fetch(`${CAL_API_BASE}/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CAL_API_KEY}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to create booking');
  }

  return response.json();
};

export const getEventTypes = async () => {
  const response = await fetch(`${CAL_API_BASE}/event-types`, {
    headers: {
      'Authorization': `Bearer ${CAL_API_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch event types');
  }

  return response.json();
};

export const getAvailability = async (
  username: string,
  eventTypeSlug: string,
  startTime: string,
  endTime: string
) => {
  const params = new URLSearchParams({
    username,
    eventTypeSlug,
    startTime,
    endTime,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  const response = await fetch(`${CAL_API_BASE}/slots/available?${params}`, {
    headers: {
      'Authorization': `Bearer ${CAL_API_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch availability');
  }

  return response.json();
};
```

2. Use in your component:

```typescript
import { createBooking } from '@/utils/calcom';

const handleBooking = async () => {
  try {
    const booking = await createBooking({
      eventTypeId: 123, // Your event type ID
      start: '2025-01-20T10:00:00Z',
      responses: {
        name: formData.name,
        email: formData.email,
        notes: `Project: ${estimate.projectType}, Area: ${estimate.area} ${estimate.areaUnit}`,
      },
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: 'en',
      metadata: {
        projectCost: estimate.totalCost,
        projectType: estimate.projectType,
      },
    });

    console.log('Booking created:', booking);
    toast({
      title: "Meeting Scheduled!",
      description: "You'll receive a confirmation email shortly.",
    });
  } catch (error) {
    console.error('Booking error:', error);
    toast({
      title: "Booking Failed",
      description: "Please try again or contact us directly.",
      variant: "destructive",
    });
  }
};
```

## Step 3: Update MeetingScheduler Component

Here's a complete example updating `MeetingScheduler.tsx` with Cal.com embed:

```typescript
import { useState } from "react";
import Cal from "@calcom/embed-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const MeetingScheduler = ({ autoExpand = false }) => {
  const [showCalEmbed, setShowCalEmbed] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowCalEmbed(true)}
        className="w-full bg-vs hover:bg-vs-light text-white font-semibold py-3 px-4 rounded-lg"
      >
        Schedule Meeting with Cal.com
      </button>

      <Dialog open={showCalEmbed} onOpenChange={setShowCalEmbed}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Schedule Your Consultation</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <Cal
              calLink="vanilla-somethin-nezld5"
              style={{ width: "100%", height: "100%", overflow: "scroll" }}
              config={{
                layout: 'month_view',
                theme: 'light'
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
```

## Step 4: Testing

1. **Test Embed (Option A):**
   - Click "Schedule Meeting"
   - Cal.com widget should load
   - Select date and time
   - Complete booking

2. **Test Direct Link (Option B):**
   - Click the link
   - Should open https://cal.com/vanilla-somethin-nezld5 in new tab

3. **Test API (Option C):**
   - Fill booking form
   - Submit
   - Check Cal.com dashboard for new booking
   - Verify email confirmation

## Step 5: Additional Features

### Prefill User Information

If you have user data from the estimator, prefill it:

```typescript
<Cal
  calLink="vanilla-somethin-nezld5/consultation"
  config={{
    name: formData.name,
    email: formData.email,
    notes: `Project estimate: ${formatCurrency(estimate.totalCost)}`,
    metadata: {
      projectType: estimate.projectType,
      area: estimate.area,
    }
  }}
/>
```

### Custom Event Types by Project Type

Route different project types to different event types:

```typescript
const getEventTypeSlug = (projectType: string) => {
  switch (projectType) {
    case 'residential':
      return 'residential-consultation';
    case 'commercial':
      return 'commercial-consultation';
    default:
      return '30min';
  }
};

<Cal calLink={`vanilla-somethin-nezld5/${getEventTypeSlug(estimate.projectType)}`} />
```

### Webhook Integration

Set up webhooks in Cal.com to receive booking notifications:

1. Go to https://cal.com/settings/developer/webhooks
2. Add webhook URL: `https://your-domain.com/api/cal-webhook`
3. Select events: `BOOKING_CREATED`, `BOOKING_RESCHEDULED`, `BOOKING_CANCELLED`
4. Create backend endpoint to handle webhooks

## Troubleshooting

### CORS Issues
If you encounter CORS errors with the API, ensure your domain is whitelisted in Cal.com settings.

### API Key Not Working
- Verify the API key is correct
- Check that the key hasn't expired
- Ensure the key has the necessary permissions

### Embed Not Loading
- Check that `@calcom/embed-react` is installed
- Verify the Cal.com username is correct
- Check browser console for errors

## Resources

- Cal.com API Documentation: https://cal.com/docs/api-reference
- Cal.com Embed Documentation: https://cal.com/docs/integrations/embed
- Cal.com Developer Portal: https://cal.com/settings/developer

## Current Configuration

- **API Key:** `cal_live_420f3dffbfbc8f19c70895b4600507a0`
- **Cal.com Profile:** https://cal.com/vanilla-somethin-nezld5
- **Cal.com Link:** https://cal.com/vanilla-somethin-nezld5/15min
- **Status:** ✅ **IMPLEMENTED** - All three options are now available!

## Implementation Status

### ✅ Option A: Cal.com Embed Widget (IMPLEMENTED)
- **Component:** `src/components/estimator/CalEmbed.tsx`
- **Integration:** Embedded in `MeetingScheduler` as "Book Consultation"
- **Features:**
  - Auto-opens booking interface
  - Custom VS brand color (#44080b)
  - Month view layout
  - Seamless in-app experience

### ✅ Option B: Direct Link (IMPLEMENTED)
- **Location:** "Request Callback" → "Virtual Meeting" option
- **URL:** Opens https://cal.com/vanilla-somethin-nezld5 in new tab

### ✅ Option C: API Integration (IMPLEMENTED)
- **Component:** `src/components/estimator/CalBookingForm.tsx`
- **Integration:** Available as "Quick Booking" (when API configured)
- **Features:**
  - 3-step booking wizard
  - Live availability checking
  - Project data integration
  - Custom booking metadata

Choose **Option A (Embed)** for the best user experience, as it keeps users on your site and provides a seamless booking experience. This is now the PRIMARY booking option in your app!
