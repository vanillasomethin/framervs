/**
 * Cal.com API Integration
 * Docs: https://cal.com/docs/api-reference
 */

const CAL_API_KEY = import.meta.env.VITE_CAL_API_KEY;
const CAL_API_BASE = 'https://api.cal.com/v1';

export interface BookingData {
  eventTypeId: number;
  start: string; // ISO 8601 format
  responses: {
    name: string;
    email: string;
    notes?: string;
    location?: string;
  };
  timeZone: string;
  language: string;
  metadata?: Record<string, any>;
}

export interface EventType {
  id: number;
  slug: string;
  title: string;
  length: number;
  description?: string;
}

export interface AvailableSlot {
  time: string;
  attendees?: number;
  bookingUid?: string;
}

/**
 * Fetch all available event types
 */
export const getEventTypes = async (): Promise<EventType[]> => {
  try {
    const response = await fetch(`${CAL_API_BASE}/event-types`, {
      headers: {
        'Authorization': `Bearer ${CAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch event types');
    }

    const data = await response.json();
    return data.event_types || [];
  } catch (error) {
    console.error('Error fetching event types:', error);
    throw error;
  }
};

/**
 * Get available slots for a specific date range
 */
export const getAvailability = async (
  eventTypeId: number,
  startTime: string,
  endTime: string,
  timeZone: string = Intl.DateTimeFormat().resolvedOptions().timeZone
): Promise<AvailableSlot[]> => {
  try {
    const params = new URLSearchParams({
      eventTypeId: eventTypeId.toString(),
      startTime,
      endTime,
      timeZone,
    });

    const response = await fetch(`${CAL_API_BASE}/slots/available?${params}`, {
      headers: {
        'Authorization': `Bearer ${CAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch availability');
    }

    const data = await response.json();
    return data.slots || [];
  } catch (error) {
    console.error('Error fetching availability:', error);
    throw error;
  }
};

/**
 * Create a new booking
 */
export const createBooking = async (data: BookingData) => {
  try {
    const response = await fetch(`${CAL_API_BASE}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CAL_API_KEY}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create booking');
    }

    return response.json();
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
};

/**
 * Cancel a booking
 */
export const cancelBooking = async (bookingId: number, reason?: string) => {
  try {
    const response = await fetch(`${CAL_API_BASE}/bookings/${bookingId}/cancel`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CAL_API_KEY}`,
      },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to cancel booking');
    }

    return response.json();
  } catch (error) {
    console.error('Error canceling booking:', error);
    throw error;
  }
};

/**
 * Reschedule a booking
 */
export const rescheduleBooking = async (
  bookingId: number,
  newStartTime: string,
  reason?: string
) => {
  try {
    const response = await fetch(`${CAL_API_BASE}/bookings/${bookingId}/reschedule`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CAL_API_KEY}`,
      },
      body: JSON.stringify({
        start: newStartTime,
        reason,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to reschedule booking');
    }

    return response.json();
  } catch (error) {
    console.error('Error rescheduling booking:', error);
    throw error;
  }
};

/**
 * Get booking by ID
 */
export const getBooking = async (bookingId: number) => {
  try {
    const response = await fetch(`${CAL_API_BASE}/bookings/${bookingId}`, {
      headers: {
        'Authorization': `Bearer ${CAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch booking');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching booking:', error);
    throw error;
  }
};

/**
 * Helper: Format date for Cal.com API (ISO 8601)
 */
export const formatDateForCal = (date: Date): string => {
  return date.toISOString();
};

/**
 * Helper: Get start and end of day in ISO format
 */
export const getDayRange = (date: Date): { start: string; end: string } => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return {
    start: formatDateForCal(start),
    end: formatDateForCal(end),
  };
};

/**
 * Helper: Check if Cal.com API is configured
 */
export const isCalComConfigured = (): boolean => {
  return !!(CAL_API_KEY && CAL_API_KEY !== 'your_cal_api_key_here');
};
