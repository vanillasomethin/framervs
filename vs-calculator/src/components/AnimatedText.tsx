
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedTextProps {
  text: string;
  className?: string;
  once?: boolean;
  threshold?: number;
}

const AnimatedText = ({
  text,
  className,
  once = true,
  threshold = 0.1,
}: AnimatedTextProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold }
    );

    const currentRef = textRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [once, threshold]);

  const words = text.split(" ");

  return (
    <div ref={textRef} className={className} aria-label={text}>
      <span className="sr-only">{text}</span>
      {words.map((word, wordIndex) => (
        <span key={`word-${wordIndex}`} className="inline-block overflow-hidden mr-2">
          <span
            className={cn(
              "inline-block transition-transform duration-700",
              isVisible
                ? "transform-none"
                : "translate-y-full opacity-0"
            )}
            style={{
              transitionDelay: `${100 + wordIndex * 50}ms`,
            }}
          >
            {word}
          </span>
        </span>
      ))}
    </div>
  );
};

export default AnimatedText;
