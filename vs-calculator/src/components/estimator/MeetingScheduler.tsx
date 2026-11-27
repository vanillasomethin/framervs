// Book a call or message the studio. "Book a call" opens Cal.com's own booking page
// in a new tab (no embedded calendar, so the page and its pointer behave normally).
const CAL_30 = "https://cal.com/hisham-khalid-qyohid/30min";
const CAL_15 = "https://cal.com/hisham-khalid-qyohid/15min";
const WHATSAPP_NUMBER = "917411324448";
const EMAIL = "hello@vanillasometh.in";

interface MeetingSchedulerProps {
  // Kept so existing callers compile; the card no longer pulses for attention.
  autoExpand?: boolean;
  estimate?: { totalCost?: number; area?: number; areaUnit?: string; city?: string };
}

const MeetingScheduler = ({ estimate }: MeetingSchedulerProps) => {
  const context =
    estimate && estimate.totalCost
      ? ` My estimate is around ₹${Math.round(estimate.totalCost).toLocaleString("en-IN")} for ${estimate.area} ${estimate.areaUnit} in ${estimate.city}.`
      : "";
  const message = `Hi, I'd like to talk about my project.${context}`;

  return (
    <div className="rounded-xl border border-vs-dark/10 bg-white p-6">
      <h3 className="text-center text-xl font-medium text-vs-dark">Talk to the studio</h3>
      <p className="mt-1 text-center text-sm text-vs-dark/60">A 30-minute call, or a message on WhatsApp.</p>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <a
          href={CAL_30}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-vs-dark px-5 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-vs"
        >
          Book a call
        </a>
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-vs-dark/30 px-5 py-3 text-center text-sm font-medium text-vs-dark transition-colors hover:border-vs-dark"
        >
          WhatsApp us
        </a>
      </div>

      <p className="mt-4 text-center text-xs text-vs-dark/60">
        Short on time?{" "}
        <a href={CAL_15} target="_blank" rel="noopener noreferrer" className="font-medium text-vs-dark underline-offset-2 hover:underline">
          Book a 15-min intro
        </a>
        {" "}· Prefer email?{" "}
        <a
          href={`mailto:${EMAIL}?subject=${encodeURIComponent("Project consultation")}&body=${encodeURIComponent(message)}`}
          className="font-medium text-vs-dark underline-offset-2 hover:underline"
        >
          Write to us
        </a>
      </p>
    </div>
  );
};

export default MeetingScheduler;
