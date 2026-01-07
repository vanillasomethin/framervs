import { loadLegacyPage } from "@/lib/legacy-html";

export function EstimatorEmbed() {
  const { assets, body } = loadLegacyPage("estimator/index.html");

  return (
    <section className="estimator-embed" suppressHydrationWarning>
      <div
        dangerouslySetInnerHTML={{
          __html: `${assets}\n${body}`,
        }}
      />
    </section>
  );
}
