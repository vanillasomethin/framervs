import { loadLegacyPage } from "@/lib/legacy-html";

type LegacyPageProps = {
  sourcePath: string;
};

export function LegacyPage({ sourcePath }: LegacyPageProps) {
  const { assets, body } = loadLegacyPage(sourcePath);

  return (
    <main className="legacy-page" suppressHydrationWarning>
      <div
        dangerouslySetInnerHTML={{
          __html: `${assets}\n${body}`,
        }}
      />
    </main>
  );
}
