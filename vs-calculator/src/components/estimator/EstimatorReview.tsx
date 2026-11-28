import { useEffect, useState } from "react";
import { Star, ExternalLink } from "lucide-react";
import { ProjectEstimate } from "@/types/estimator";

// "How useful was this estimate?" Ratings go to the studio's admin (CRM >
// Estimator reviews). Every rater, whatever the stars, then gets the same neutral
// invitation to review the studio on Google: Google's policy forbids asking only
// happy customers (or asking them more prominently), and a Business Profile can be
// restricted for it.

const EstimatorReview = ({ estimate }: { estimate: ProjectEstimate }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  const [googleUrl, setGoogleUrl] = useState("");
  const [copied, setCopied] = useState(false);

  // The Google review link is set in Admin > Website > Contact details
  useEffect(() => {
    fetch("/content.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((c) => {
        const url = c?.cms?.contact?.googleReviewUrl;
        if (typeof url === "string" && /^https:\/\//.test(url)) setGoogleUrl(url);
      })
      .catch(() => {});
  }, []);

  const submit = async () => {
    if (!rating) return;
    setState("sending");
    setError("");
    try {
      const res = await fetch("/.netlify/functions/estimator-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          comment,
          website,
          estimate: {
            projectType: estimate.projectType,
            city: estimate.city,
            area: estimate.area,
            areaUnit: estimate.areaUnit,
            totalCost: estimate.totalCost,
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not send your rating.");
      setState("sent");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send your rating.");
      setState("error");
    }
  };

  const openGoogle = async () => {
    if (comment.trim()) {
      try {
        await navigator.clipboard.writeText(comment.trim());
        setCopied(true);
      } catch {
        /* clipboard blocked: they can retype it */
      }
    }
    window.open(googleUrl, "_blank", "noopener,noreferrer");
  };

  const shown = hover || rating;

  if (state === "sent") {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5 text-center">
        <p className="font-semibold text-vs-dark">Thank you for rating the estimator.</p>
        <p className="text-sm text-gray-600 mt-2">Your feedback goes straight to our team, and we use it to make the estimate more accurate.</p>
        {googleUrl ? (
          <>
            <p className="text-sm text-gray-600 mt-3">
              If you'd like, you can also share your experience on Google.
              {comment.trim() ? " We've copied your comment so you can paste it." : ""}
            </p>
            <button
              onClick={openGoogle}
              className="mt-3 inline-flex items-center gap-2 px-6 py-3 bg-vs text-white font-semibold rounded-lg hover:bg-vs-dark transition-colors"
            >
              Review us on Google <ExternalLink size={16} />
            </button>
            {copied ? <p className="text-xs text-gray-500 mt-2">Comment copied. Paste it into the review box.</p> : null}
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <p className="font-semibold text-vs-dark text-center">How useful was this estimate?</p>
      <div className="flex justify-center gap-1 mt-3" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onMouseEnter={() => setHover(n)}
            onClick={() => setRating(n)}
            className="p-1"
          >
            <Star size={30} className={n <= shown ? "fill-amber-400 text-amber-400" : "text-gray-300"} />
          </button>
        ))}
      </div>
      {rating ? (
        <div className="mt-4 space-y-3">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 1000))}
            rows={3}
            placeholder={rating >= 4 ? "What did you find most helpful? (optional)" : "What should we improve? (optional)"}
            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:border-vs"
          />
          {/* Hidden from people; bots fill it in */}
          <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="text-center">
            <button
              onClick={submit}
              disabled={state === "sending"}
              className="px-6 py-2.5 bg-vs text-white font-semibold rounded-lg hover:bg-vs-dark transition-colors disabled:opacity-60"
            >
              {state === "sending" ? "Sending…" : "Send rating"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default EstimatorReview;
