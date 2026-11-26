import React, { useMemo } from "react";
import {
  ContributionGraph,
  generateContributionData,
} from "./ContributionGraph";

/** Contribution graph + its placeholder data, split out for lazy loading. */
const BuildRhythm: React.FC = () => {
  const contributionData = useMemo(() => generateContributionData(), []);
  return (
    <ContributionGraph
      className="cad-card relative overflow-hidden p-4"
      data={contributionData}
    />
  );
};

export default BuildRhythm;
