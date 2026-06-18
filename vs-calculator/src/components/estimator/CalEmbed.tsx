import { useEffect, useRef, useState } from "react";
import { getCalApi } from "@calcom/embed-react";

interface CalEmbedProps {
  calLink?: string;
  config?: {
    layout?: string;
    theme?: string;
  };
  namespace?: string;
}

/**
 * Cal.com Embed Component
 * Embeds the Cal.com booking interface directly in the app
 */
const CalEmbed = ({
  calLink = "vanilla-somethin-nezld5/15min",
  config = { layout: "month_view" },
  namespace = "15min"
}: CalEmbedProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    (async function () {
      const cal = await getCalApi({ namespace });

      // Configure Cal.com UI
      cal("ui", {
        cssVarsPerTheme: {
          light: { "cal-brand": "#44080b" } // VS brand color
        },
        hideEventTypeDetails: false,
        layout: config.layout || "month_view",
        theme: config.theme || "light",
        styles: {
          body: {
            background: "transparent"
          }
        }
      });

      // Listen to modal close events to cleanup properly
      cal("on", {
        action: "bookingSuccessful",
        callback: () => {
          setIsOpen(false);
        }
      });

      cal("on", {
        action: "__closeIframe",
        callback: () => {
          setIsOpen(false);
          // Force cleanup of any lingering overlays
          setTimeout(() => {
            const overlays = document.querySelectorAll('[class*="cal-"][class*="overlay"], [id*="cal-"][id*="backdrop"]');
            overlays.forEach(el => el.remove());
            // Re-enable body scroll
            document.body.style.overflow = '';
            document.body.style.pointerEvents = '';
          }, 100);
        }
      });

      // Auto-click the button to open the embed
      setTimeout(() => {
        buttonRef.current?.click();
        setIsOpen(true);
      }, 100);
    })();

    // Cleanup on unmount
    return () => {
      const overlays = document.querySelectorAll('[class*="cal-"][class*="overlay"], [id*="cal-"][id*="backdrop"]');
      overlays.forEach(el => el.remove());
      document.body.style.overflow = '';
      document.body.style.pointerEvents = '';
    };
  }, [namespace, config]);

  return (
    <div className="w-full h-full relative">
      {/* Hidden button - only for cal.com API trigger */}
      <button
        ref={buttonRef}
        data-cal-namespace={namespace}
        data-cal-link={calLink}
        data-cal-config={JSON.stringify(config)}
        className="hidden"
        aria-hidden="true"
      />

      {/* Loading indicator while Cal.com widget opens */}
      {!isOpen && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vs mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Opening booking calendar...</p>
          </div>
        </div>
      )}

      <style>{`
        [data-cal-namespace] * {
          cursor: auto !important;
        }
        .cal-modal-box input,
        .cal-modal-box button,
        .cal-modal-box select,
        .cal-modal-box a {
          cursor: pointer !important;
        }
      `}</style>
    </div>
  );
};

export default CalEmbed;
