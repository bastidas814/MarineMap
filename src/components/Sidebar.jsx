import { useState, useEffect } from "react";
import "../index.css";
import OneSpeciesSelection from "./OneSpeciesSelection";
import MultipleSpeciesSelection from "./MultipleSpeciesSelection";
import { use } from "react";

function Sidebar({
  selectedSpeciesInfo,
  selectedSpeciesBInfo,
  onSpeciesSelect,
  onSpeciesSelectB,
  showingSpeciesDetail,
  nemesisRegionNames,
  expandSide,
  setExpandSide,
  resetStates,
  selectedTab,
  setSelectedTab,
}) {
  const [hoverTab, setHoverTab] = useState(null);
  const [hoverPos, setHoverPos] = useState(null);

  const createHoverTab = () => {
    if (!hoverTab) {
      return
    }
    return (
      <div className="left-9 absolute z-50 p-1 align-middle bg-base-300 border-2 border-secondary text-sm rounded" 
        style={{ top: `${hoverPos}px` }}
      >
        {hoverTab}
      </div>
    )
  }

  return (
    <div>
    <div className="z-50 fixed w-fit h-full border-r-2 shadow-md border-primary flex flex-row bg-base-100">
      {/* Collapse sidebar with icons only */}
      <div className="flex flex-col bg-secondary items-center w-8">
        <div
          className={`cursor-pointer w-full py-2 text-center 
            hover:bg-base-300
            ${
              selectedTab === "oneSpecies" ? "bg-base-200" : ""
            }`
          }
          onClick={() => {
            if (selectedTab != "oneSpecies") {
              setSelectedTab("oneSpecies");
              setExpandSide(true);
              onSpeciesSelect(null);
              onSpeciesSelectB(null);
              resetStates();
            }
          }}
          onMouseOver={() => {
            setHoverTab("Single Species View"); 
            setHoverPos(60)
          }}
          onMouseLeave={() => {
            setHoverTab(null); 
            setHoverPos(null);
          }}
        >
          S
        </div>
        <div
          className={`cursor-pointer w-full py-2 text-center 
            hover:bg-base-300
            ${
            selectedTab === "multipleSpecies" ? "bg-base-200" : ""
          }`}
          onClick={() => {
            if (selectedTab != "multipleSpecies") {
              setSelectedTab("multipleSpecies");
              setExpandSide(true);
              onSpeciesSelect(null);
              onSpeciesSelectB(null);
              resetStates();
            }
          }}
          onMouseOver={() => {
            setHoverTab("Multi Species View"); 
            setHoverPos(100);
          }}
          onMouseLeave={() => {
            setHoverTab(null); 
            setHoverPos(null);
          }}
        >
          M
        </div>
      </div>

      {/* Expanded sidebar */}
      {expandSide && (
        <div className={`flex flex-col ${selectedTab == "multipleSpecies" ? "w-[384px]": "w-52"} h-full min-w`}>
          <div
            className="w-full p-2 flex justify-end align-bottom items-end">
            <span
              className="cursor-pointer"
              onClick={() => {
                setExpandSide(false);
                onSpeciesSelect(null);
                onSpeciesSelectB(null);
                resetStates();
                setSelectedTab("None");
              }}
            >
              ✕
            </span>
          </div>
          <div className="pb-1">
          {selectedTab === "oneSpecies" ? (
              <p className="font-bold text-center">
                Review One Species
              </p>
            ) : (
              <p className="font-bold text-center">
                Review Multiple Species
              </p>
            )
          }
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar pb-20">
            <div className="">
              {selectedTab === "oneSpecies" ? (
                <div>
                  <OneSpeciesSelection
                    selectedSpeciesRegionalInfo={selectedSpeciesInfo}
                    onSpeciesSelect={onSpeciesSelect}
                    showingSpeciesDetail={showingSpeciesDetail}
                    nemesisRegionNames={nemesisRegionNames}
                    />
                </div>
              ) : (
                <div>
                  <MultipleSpeciesSelection
                  selectedSpeciesARegionalInfo={selectedSpeciesInfo}
                  selectedSpeciesBRegionalInfo={selectedSpeciesBInfo}
                  onSpeciesSelect={onSpeciesSelect}
                  onSpeciesSelectB={onSpeciesSelectB}
                  showingSpeciesDetail={showingSpeciesDetail}
                  nemesisRegionNames={nemesisRegionNames}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    {createHoverTab()}
    </div>
  );
}

export default Sidebar;
