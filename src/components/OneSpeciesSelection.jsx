import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import { IoIosArrowDown } from "react-icons/io";
import CollapsibleSection from "./CollapsibleSection";
import { createBodyFromRegionalInfo, setLinks, createSpeciesHeader } from "./SidebarInfo"; 
import { use } from "react";

/**
 * Component for selecting one species and displaying its information
 * @param {Object} props - Component props
 * @param {Array} props.selectedSpeciesRegionalInfo - Regional info for the selected species
 * @param {Function} props.onSpeciesSelect - Callback when a species is selected
 * @param {Function} props.showingSpeciesDetail - Callback to indicate if species detail is shown
 * @param {Object} props.nemesisRegionNames - Mapping of region codes to region names
 * @returns {JSX.Element} - Rendered component
 */
function OneSpeciesSelection({
  selectedSpeciesRegionalInfo,
  onSpeciesSelect,
  showingSpeciesDetail,
  nemesisRegionNames,
}) {
  const [speciesData, setSpeciesData] = useState([]);
  const [selectedSpecies, setSelectedSpecies] = useState(null);
  const [showSpeciesDetail, setShowSpeciesDetail] = useState(false); // Track sidebar visibility
  const [speciesFormatedRegionalInfo, setSpeciesFormatedRegionalInfo] =
    useState("");
  const [speciesFormattedOcc, setSpeciesFormattedOcc] =
    useState("");
  const [nemesisLink, setNemesisLink] = useState("");
  const [WoRMSLink, setWoRMSLink] = useState("")
  const handleSpeciesChange = (event) => {
    setSelectedSpecies(event.target.value);
  };

  // Update formatted regional info on sidebar when selected species info changes
  useEffect(() => {
    if (!selectedSpeciesRegionalInfo) {
      return;
    }

    createBodyFromRegionalInfo(
      selectedSpeciesRegionalInfo,
      nemesisRegionNames,
      setSpeciesFormatedRegionalInfo,
      setSpeciesFormattedOcc,
    )

  }, [selectedSpeciesRegionalInfo]);

  /**
   * Handles the button click to generate the map and show species details
   * includes setting links to Nemesis and WoRMS pages.
   * @returns {void}
   */
  const handleButtonClick = () => {
    if (selectedSpeciesInfo) {
      setLinks(
        selectedSpeciesInfo,
        setNemesisLink,
        setWoRMSLink,
        onSpeciesSelect,
        setShowSpeciesDetail,
        showingSpeciesDetail,
      )
    } else {
      alert("Please select a species.");
    }
  };

  // Filter for selected species nemesis description based on selected species name
  const selectedSpeciesInfo = speciesData.find(
    (species) => species["Species Name"] === selectedSpecies
  );

  // Fetches nemesis description for all species from csv on component mount
  useEffect(() => {
    fetch("/descriptions/speciesSet.csv")
      .then((response) => response.text())
      .then((csvData) => {
        Papa.parse(csvData, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            setSpeciesData(results.data);
          },
        });
      })
      .catch((error) => console.error("Error fetching the CSV file:", error));
  }, []);

  /**
   * Formats the collapsible sections for the sidebar when a species is selected
   *
   * @returns {JSX.Element} - Formatted collapsible sections
   */
  const formattedCollapsible = (() => {
    if (!selectedSpeciesRegionalInfo) {
      return;
    }
    {/* <CollapsibleSection title="Classification:" body="Classification" /> */}
    return (
      <>
      <CollapsibleSection
        title={selectedSpeciesRegionalInfo[1]
          ? "First records:"
          : "Occurences:"
        }
        body={
          selectedSpeciesRegionalInfo[1] 
          ? speciesFormatedRegionalInfo
          : speciesFormattedOcc
        }
      />

      <CollapsibleSection
        title="More details:"
        body={
          <>
          {WoRMSLink}
          <br></br>
          {selectedSpeciesRegionalInfo[1]
            ? nemesisLink
            : ""
          } 
          </>
        }
        bodyStyle="text-primary"
      />
      </>
    )
  });

  return (
    <div>
      {!showSpeciesDetail && (
        <div className="m-2 flex flex-col">
          <div className="text-sm">Select a species:</div>

          <select
            className="select focus:outline-none outline-none select-xs w-full select-secondary rounded-md text-xs"
            onChange={handleSpeciesChange}
          >
            <option disabled selected>
              Select a species
            </option>
            {speciesData.sort((a,b) =>
              a["Species Name"].localeCompare(b["Species Name"])
              )
              .map((species, index) => (
              <option key={index} value={species["Species Name"]}>
                {species["Species Name"]}
              </option>
            ))}
          </select>

          <button
            onClick={handleButtonClick}
            className="btn btn-sm m-4 items-center align-middle justify-center btn-secondary"
          >
            Generate map
          </button>
        </div>
      )}

      {/* Sidebar for species info */}
      {/*         <div className="sidebar bg-gray-200 p-4 rounded-md w-1/3 h-full fixed right-0 top-0">
       */}
      {showSpeciesDetail && selectedSpeciesInfo && (
        <div className="m-2 flex flex-col">
          <h2 className="text-xl font-semibold">
            {selectedSpeciesInfo["Species Name"]}
          </h2>

          {createSpeciesHeader(selectedSpeciesInfo)}

          {formattedCollapsible()}

          <button
            className="mt-4 btn btn-sm btn-secondary"
            onClick={() => {
              setShowSpeciesDetail(false);
              showingSpeciesDetail(false);
              onSpeciesSelect(null);
              setSelectedSpecies(null);   // clear this component's selection
            }}
          >
            Review new species
          </button>
        </div>
      )}
    </div>
  );
}

export default OneSpeciesSelection;
