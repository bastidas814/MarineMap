import React from "react";
import Map from "./Map";
import Timeline from "./Timeline";

function MapSection({
  allYears,
  currSpeciesRegions,
  pastSpeciesRegions,
  pastSpeciesRegionsB,
  regionsDetail,
  currSites,
  currSitesB,
  speciesYears,
  allYearRegionMap,
  setNewYear,
  showTimeline,
  nemesisRegionNames,
  expandSide,
  selectedTab,
}) {

  // turn set into list
  pastSpeciesRegions = Array.from(pastSpeciesRegions);

  return (
    <div className="relative flex flex-col h-full w-full">
      <Map
        allYears={allYears}
        currRegions={currSpeciesRegions}
        pastRegions={pastSpeciesRegions}
        pastRegionsB={pastSpeciesRegionsB}
        regionsDetail={regionsDetail}
        nemesisRegionNames={nemesisRegionNames}
        currSites={currSites}
        currSitesB={currSitesB}
        expandSide={expandSide}
        selectedTab={selectedTab}
      />
      {showTimeline && (
        <Timeline allowedYears={speciesYears} setNewYear={setNewYear} />
      )}
    </div>
  );
}

export default MapSection;
