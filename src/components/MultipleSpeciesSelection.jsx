import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import CollapsibleSection from "./CollapsibleSection";
import { createBodyFromRegionalInfo, setLinks, createSpeciesHeader } from "./SidebarInfo";

/**
 * Component for selecting and displaying information about multiple species.
 *
 * @param {Object} props - Component props
 * @param {Object} props.selectedSpeciesARegionalInfo - Regional info for species A
 * @param {Object} props.selectedSpeciesBRegionalInfo - Regional info for species B
 * @param {Function} props.onSpeciesSelect - Callback when species A is selected
 * @param {Function} props.onSpeciesSelectB - Callback when species B is selected
 * @param {Function} props.showingSpeciesDetail - Callback to indicate if species detail is shown
 * @param {Object} props.nemesisRegionNames - Mapping of region codes to region names
 * @returns {JSX.Element} - Rendered component
 */
function MultipleSpeciesSelection({
    selectedSpeciesARegionalInfo,
    selectedSpeciesBRegionalInfo,
    onSpeciesSelect,
    onSpeciesSelectB,
    showingSpeciesDetail,
    nemesisRegionNames,
  }) {
  const [speciesData, setSpeciesData] = useState([]);
  const [selectedSpeciesA, setSelectedSpeciesA] = useState(null);
  const [selectedSpeciesB, setSelectedSpeciesB] = useState(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false); // Track sidebar visibility
  const [speciesFormattedRegionalInfoA, setSpeciesFormattedRegionalInfoA] =
    useState("");
  const [speciesFormattedRegionalInfoB, setSpeciesFormattedRegionalInfoB] =
    useState("");
  const [speciesFormattedOccA, setSpeciesFormattedOccA] =
    useState("");
  const [speciesFormattedOccB, setSpeciesFormattedOccB] =
    useState("");

  const [nemesisLinkA, setNemesisLinkA] = useState("");
  const [nemesisLinkB, setNemesisLinkB] = useState("");

  const [WoRMSLinkA, setWoRMSLinkA] = useState("")
  const [WoRMSLinkB, setWoRMSLinkB] = useState("")


  // Functions to handle species selection
  const handleSpeciesAChange = (event) => {
    setSelectedSpeciesA(event.target.value);
  };

  const handleSpeciesBChange = (event) => {
    setSelectedSpeciesB(event.target.value);
  };

  // Update formatted regional info on sidebar when selected species info changes
  useEffect(() => {
    if (!selectedSpeciesARegionalInfo || !selectedSpeciesBRegionalInfo){
      return;
    }

    createBodyFromRegionalInfo(
      selectedSpeciesARegionalInfo,
      nemesisRegionNames,
      setSpeciesFormattedRegionalInfoA,
      setSpeciesFormattedOccA
    );
    createBodyFromRegionalInfo(
      selectedSpeciesBRegionalInfo,
      nemesisRegionNames,
      setSpeciesFormattedRegionalInfoB,
      setSpeciesFormattedOccB
    );
  }, [selectedSpeciesARegionalInfo, selectedSpeciesBRegionalInfo]);


  /**
   * Handles the button click to generate the map and show species details.
   * includes setting links to Nemesis and WoRMS pages
   * @returns {void}
   */
  const handleButtonClick = () => {
    if (selectedSpeciesAInfo && selectedSpeciesBInfo) {
      setLinks(
        selectedSpeciesAInfo,
        setNemesisLinkA,
        setWoRMSLinkA,
        onSpeciesSelect,
        setIsSidebarVisible,
        showingSpeciesDetail,
      )
      setLinks(
        selectedSpeciesBInfo,
        setNemesisLinkB,
        setWoRMSLinkB,
        onSpeciesSelectB,
        setIsSidebarVisible,
        showingSpeciesDetail,
      )
    } else {
      alert("Please select two species.");
    }
  };

  // Filter for the two selected species nemesis descriptions based on their IDs
  const selectedSpeciesAInfo = speciesData.find(
    (species) => species["Species OBIS/WoRMS ID"] === selectedSpeciesA
  );
  const selectedSpeciesBInfo = speciesData.find(
    (species) => species["Species OBIS/WoRMS ID"] === selectedSpeciesB
  );

  // Fetches nemesis description for all species from csv on component mount
  useEffect(() => {
    // Fetch the CSV file
    fetch("/descriptions/speciesSet.csv")
      .then((response) => response.text())
      .then((csvData) => {
        // Parse the CSV data
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
   * Formats the collapsible sections for the sidebar when multiple species are selected
   *
   * @returns {JSX.Element} - Formatted collapsible sections
   */
  const formattedCollapsible = (() => {
    if (!selectedSpeciesARegionalInfo || !selectedSpeciesBRegionalInfo) {
      return;
    }
    
    let firstRecordsFormattedA = (
      <CollapsibleSection
        title={`First records for ${selectedSpeciesAInfo["Species Name"]}:`}
        body={speciesFormattedRegionalInfoA}
      />
    );
    let firstRecordsFormattedB = (
      <CollapsibleSection
        title={`First records for ${selectedSpeciesBInfo["Species Name"]}:`}
        body={speciesFormattedRegionalInfoB}
      />
    );

    let moreDetailsFormattedA = nemesisLinkA;
    let moreDetailsFormattedB = nemesisLinkB;

    if (!selectedSpeciesARegionalInfo[1]) {
      firstRecordsFormattedA = (
        <CollapsibleSection
          title={`Occurences for ${selectedSpeciesAInfo["Species Name"]}:`}
          body={
          <>
            {speciesFormattedOccA}
          </>
        }
        />
      );
      moreDetailsFormattedA = WoRMSLinkA;
    }

    if (!selectedSpeciesBRegionalInfo[1]) {
      firstRecordsFormattedB = (
        <CollapsibleSection
          title={`Occurences for ${selectedSpeciesBInfo["Species Name"]}:`}
          body={
          <>
            {speciesFormattedOccB}
          </>
        }
        />
      );
      moreDetailsFormattedB = WoRMSLinkB;
    }

    return (
      <>
      <div className="flex gap-x-2 flex-row w-full border- border-blue-200">
        <div className="border- flex flex-col w-1/2 p-2 border-primary">
        {/* Add more species details */}
          {firstRecordsFormattedA}
        </div>
        <div className="bg-primary w-0.5"></div>
        <div className="flex flex-col w-1/2 p-2 border-">
          {firstRecordsFormattedB}
        </div>
      </div>

      <div className="flex gap-x-2 flex-row w-full border- border-blue-200">
        <div className="border- flex flex-col w-1/2 p-2 border-primary">
          <CollapsibleSection
              title="More details:"
              body={
                <div>
                  <p>{moreDetailsFormattedA}</p>
                </div>
              }
              bodyStyle="text-primary"
            />
        </div>
        <div className="bg-primary w-0.5"></div>
        <div className="flex flex-col w-1/2 p-2 border-">
          <CollapsibleSection
              title="More details:"
              body={
                <div>
                  <p>{moreDetailsFormattedB}</p>
                </div>
              }
              bodyStyle="text-primary"
            />
        </div>
      </div>        
      </>
    )
  });

  return (
    <div>
      {!isSidebarVisible && (
        <div className="m-2 flex flex-col">
          <div className="flex gap-x-2">
            <div className="flex flex-col w-1/2 p-2 border-">
              <div className="text-sm">Select species 1 (circle)</div>
              <select
                className="select focus:outline-none outline-none select-xs w-full select-secondary rounded-md text-xs"
                onChange={handleSpeciesAChange}
              >
                <option disabled selected>
                  Select a species
                </option>
                {speciesData.sort((a,b) =>
                  a["Species Name"].localeCompare(b["Species Name"])
                  )
                .map((species, index) => (
                  <option key={index} value={species["Species OBIS/WoRMS ID"]}>
                    {species["Species Name"]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col w-1/2 p-2 border-">
              <div className="text-sm">Select species 2 (triangle)</div>
              <select
                className="select focus:outline-none outline-none select-xs w-full select-secondary rounded-md text-xs"
                onChange={handleSpeciesBChange}
              >
                <option disabled selected>
                  Select a species
                </option>
                {speciesData.sort((a,b) =>
                  a["Species Name"].localeCompare(b["Species Name"])
                  )
                .map((species, index) => (
                  <option key={index} value={species["Species OBIS/WoRMS ID"]}>
                    {species["Species Name"]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleButtonClick}
            className="btn btn-sm m-4 mx-16 items-center align-middle justify-center btn-secondary"
          >
            Generate map
          </button>
        </div>
      )}

      {isSidebarVisible && selectedSpeciesAInfo && selectedSpeciesBInfo && (
        <div className="flex flex-col p-2 w-full">
          <div className="flex gap-x-2 flex-row w-full border- border-blue-200">
            <div className="border- flex flex-col w-1/2 p-2 border-primary">
              <h2 className="text-sm font-semibold italic">
                {selectedSpeciesAInfo["Species Name"]}
              </h2>
              {createSpeciesHeader(selectedSpeciesAInfo)}

              <p className="text-sm mt-2">(circle)</p>

            </div>
            <div className="bg-primary w-0.5"></div>
            <div className="flex flex-col w-1/2 p-2 border-">
              <h2 className="text-sm font-semibold italic">
                {selectedSpeciesBInfo["Species Name"]}
              </h2>
              {createSpeciesHeader(selectedSpeciesBInfo)}
              <p className="text-sm mt-2">(triangle)</p>
            </div>
          </div>
          
          {formattedCollapsible()}

          <button
            className="mt-4 m-4 mx-16 btn btn-sm btn-secondary"
            onClick={() => {
              setIsSidebarVisible(false)
              showingSpeciesDetail(false);
              onSpeciesSelect(null);
              onSpeciesSelectB(null);
              setSelectedSpeciesA(null);
              setSelectedSpeciesB(null);   // clear this component's selection
            }} // Close the sidebar
          >
            Review new species
          </button>
        </div>
      )}
    </div>
  );
}

export default MultipleSpeciesSelection;
