import type { RichNode } from "../data-projects";
import { LazyVideo } from "./LazyVideo";

/**
 * "Behind the design" rich text: h5 (white, 40px above all but the first), paragraphs
 * Inter 300 20/30 muted (20px above all but the first). A paragraph can open with a bold
 * lead line; whole blocks can be bold (as the CMS entries are); a video fills the column.
 */
export function RichText({ nodes }: { nodes: RichNode[] }) {
  return (
    <div className="flex flex-col">
      {nodes.map((n, i) => {
        if (n.type === "video") {
          return (
            <LazyVideo key={i} src={n.src} className="block h-auto w-full" />
          );
        }
        if (n.type === "h5") {
          return (
            <h5 key={i} className={`vs-h5 text-vs-fg ${i > 0 ? "mt-10" : ""} ${n.bold ? "font-bold" : ""}`}>
              {n.text}
            </h5>
          );
        }
        return (
          <p
            key={i}
            className={`font-inter text-[20px] leading-[1.5] text-vs-muted ${n.bold ? "font-bold" : "font-light"} ${i > 0 ? "mt-5" : ""}`}
          >
            {n.lead !== undefined ? (
              <>
                <strong className="font-bold">{n.lead}</strong>
                <br />
              </>
            ) : null}
            {n.text}
          </p>
        );
      })}
    </div>
  );
}
