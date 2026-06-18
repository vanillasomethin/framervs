import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, User, Mail, MessageSquare, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createBooking, getEventTypes, getAvailability, isCalComConfigured, getDayRange, type EventType, type AvailableSlot } from "@/utils/calcom";
import { ProjectEstimate } from "@/types/estimator";

interface CalBookingFormProps {
  estimate?: ProjectEstimate;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CalBookingForm = ({ estimate, onSuccess, onCancel }: CalBookingFormProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState<'select-type' | 'select-datetime' | 'fill-details'>('select-type');
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    notes: estimate ? `Project Type: ${estimate.projectType}\nArea: ${estimate.area} ${estimate.areaUnit}\nEstimated Cost: ₹${estimate.totalCost.toLocaleString('en-IN')}` : '',
  });

  // Check if Cal.com is configured
  const isConfigured = isCalComConfigured();

  // Fetch event types on mount
  useEffect(() => {
    if (!isConfigured) return;

    const fetchEventTypes = async () => {
      try {
        setLoading(true);
        const types = await getEventTypes();
        setEventTypes(types);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load event types. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEventTypes();
  }, [isConfigured, toast]);

  // Fetch available slots when date is selected
  useEffect(() => {
    if (!selectedDate || !selectedEventType) return;

    const fetchSlots = async () => {
      try {
        setLoadingSlots(true);
        const date = new Date(selectedDate);
        const { start, end } = getDayRange(date);

        const slots = await getAvailability(
          selectedEventType.id,
          start,
          end
        );

        setAvailableSlots(slots);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load available time slots.",
          variant: "destructive",
        });
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [selectedDate, selectedEventType, toast]);

  const handleEventTypeSelect = (eventType: EventType) => {
    setSelectedEventType(eventType);
    setStep('select-datetime');
  };

  const handleSlotSelect = (slot: string) => {
    setSelectedSlot(slot);
    setStep('fill-details');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEventType || !selectedSlot || !formData.name || !formData.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const booking = await createBooking({
        eventTypeId: selectedEventType.id,
        start: selectedSlot,
        responses: {
          name: formData.name,
          email: formData.email,
          notes: formData.notes,
        },
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: 'en',
        metadata: estimate ? {
          projectType: estimate.projectType,
          area: estimate.area,
          areaUnit: estimate.areaUnit,
          totalCost: estimate.totalCost,
        } : {},
      });

      toast({
        title: "Meeting Scheduled!",
        description: "You'll receive a confirmation email shortly.",
      });

      onSuccess?.();
    } catch (error) {
      toast({
        title: "Booking Failed",
        description: error instanceof Error ? error.message : "Please try again or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (!isConfigured) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-600 mb-4">
          Cal.com integration is not configured. Please use the direct booking link or contact us.
        </p>
        <a
          href="https://cal.com/vanilla-somethin-nezld5"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-vs hover:bg-vs-light text-white font-semibold rounded-lg transition-colors"
        >
          Book on Cal.com
        </a>
      </div>
    );
  }

  if (loading && eventTypes.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="size-8 text-vs animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <div className={`flex items-center justify-center size-8 rounded-full ${step === 'select-type' || step === 'select-datetime' || step === 'fill-details' ? 'bg-vs text-white' : 'bg-gray-200 text-gray-500'}`}>
          <span className="text-xs font-bold">1</span>
        </div>
        <div className={`h-0.5 w-12 ${step === 'select-datetime' || step === 'fill-details' ? 'bg-vs' : 'bg-gray-200'}`} />
        <div className={`flex items-center justify-center size-8 rounded-full ${step === 'select-datetime' || step === 'fill-details' ? 'bg-vs text-white' : 'bg-gray-200 text-gray-500'}`}>
          <span className="text-xs font-bold">2</span>
        </div>
        <div className={`h-0.5 w-12 ${step === 'fill-details' ? 'bg-vs' : 'bg-gray-200'}`} />
        <div className={`flex items-center justify-center size-8 rounded-full ${step === 'fill-details' ? 'bg-vs text-white' : 'bg-gray-200 text-gray-500'}`}>
          <span className="text-xs font-bold">3</span>
        </div>
      </div>

      {/* Step 1: Select Event Type */}
      {step === 'select-type' && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-3"
        >
          <h3 className="text-lg font-semibold text-vs-dark">Select Meeting Type</h3>
          <div className="grid grid-cols-1 gap-3">
            {eventTypes.map((eventType) => (
              <button
                key={eventType.id}
                onClick={() => handleEventTypeSelect(eventType)}
                className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-vs transition-colors text-left group"
              >
                <Clock className="size-5 text-vs flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-vs-dark group-hover:text-vs transition-colors">
                    {eventType.title}
                  </h4>
                  <p className="text-sm text-gray-600">{eventType.length} minutes</p>
                  {eventType.description && (
                    <p className="text-xs text-gray-500 mt-1">{eventType.description}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Step 2: Select Date & Time */}
      {step === 'select-datetime' && selectedEventType && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <div>
            <button
              onClick={() => setStep('select-type')}
              className="text-sm text-vs hover:underline mb-2"
            >
              ← Change meeting type
            </button>
            <h3 className="text-lg font-semibold text-vs-dark">
              Select Date & Time
            </h3>
            <p className="text-sm text-gray-600">{selectedEventType.title} - {selectedEventType.length} minutes</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline size-4 mr-1" />
              Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vs/20 focus:border-vs"
            />
          </div>

          {selectedDate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline size-4 mr-1" />
                Available Times
              </label>
              {loadingSlots ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="size-6 text-vs animate-spin" />
                </div>
              ) : availableSlots.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                  {availableSlots.map((slot, index) => (
                    <button
                      key={index}
                      onClick={() => handleSlotSelect(slot.time)}
                      className="px-3 py-2 border-2 border-gray-200 rounded-lg hover:border-vs hover:bg-vs/5 text-sm font-medium transition-colors"
                    >
                      {formatTime(slot.time)}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No available slots for this date. Please select another date.
                </p>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Step 3: Fill Details */}
      {step === 'fill-details' && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="mb-4">
            <button
              onClick={() => setStep('select-datetime')}
              className="text-sm text-vs hover:underline mb-2"
            >
              ← Change date/time
            </button>
            <h3 className="text-lg font-semibold text-vs-dark">Your Details</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
              <Calendar className="size-4" />
              <span>{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <Clock className="size-4 ml-2" />
              <span>{formatTime(selectedSlot)}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User className="inline size-4 mr-1" />
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vs/20 focus:border-vs"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Mail className="inline size-4 mr-1" />
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vs/20 focus:border-vs"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MessageSquare className="inline size-4 mr-1" />
                Additional Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vs/20 focus:border-vs resize-none"
                placeholder="Any specific requirements or questions..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-vs hover:bg-vs-light text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Booking...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4" />
                    Confirm Booking
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </div>
  );
};

export default CalBookingForm;
