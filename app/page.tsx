import { EstimatorEmbed } from "@/components/estimator-embed";
import { LegacyPage } from "@/components/legacy-page";

export default function Page() {
  return (
    <div className="home-page">
      <LegacyPage sourcePath="index.html" />
      <EstimatorEmbed />
    </div>
  );
import HomePage from "@/components/home-page";

export default function Page() {
  return <HomePage />;
}
