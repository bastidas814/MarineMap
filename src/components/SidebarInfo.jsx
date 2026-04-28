import React, { useState } from "react";

/**
 * helper function to create body content from regional info
 * @param {*} regionalInfo the regional info object
 * @param {*} nemesisRegionNames mapping of region codes to region names
 * @param {*} setSpeciesFormattedRegionalInfo a callback to set the formatted regional info state
 * @param {*} setSpeciesFormattedOcc a callback to set the formatted occurrence state
 * @returns JSX body content
 */
export function createBodyFromRegionalInfo(regionalInfo, nemesisRegionNames, setSpeciesFormattedRegionalInfo, setSpeciesFormattedOcc) {
  if (regionalInfo[1]) {
    let body = Object.entries(regionalInfo[0]).map(
    ([region, details]) => {
      const { Year, Vectors, ...rest } = details;
      return (
      <div key={region} className="py-1">
        <span className="font-bold">
        {nemesisRegionNames[region]} ({Year}):
        </span>
        <br />
        <span className="font-semibold"> Invasion Status: </span>{" "}
        {rest["Invasion Status"]}
        <br />
        <span className="font-semibold"> Population Status: </span>{" "}
        {rest["Population Status"]}
        <br />
        <span className="font-semibold"> Vectors: </span> {Vectors}
      </div>
      );
    }
    );
    setSpeciesFormattedRegionalInfo(body);
  } else {
    let body = Object.entries(regionalInfo[0]).map(
    (row) => {
      return (
      <div className="py-1">
        <span className="font-bold">
        {row[1]['Region']}:
        </span>
        <br />
        <span className="font-semibold"> Introduction Origin: </span>{" "}
        {row[1]["Introduction Origin"] || "Unknown"}
        <br />
        <span className="font-semibold"> Invasiveness: </span>{" "}
        {row[1]["Invasiveness"] || "Unknown"}
        <br />
        <span className="font-semibold"> Occurrence: </span>{" "}
        {row[1]["Occurrence"] || "Unknown"}
        <br />
        <span className="font-semibold"> Quality: </span>{" "}
        {row[1]["Quality"]}
      </div>
      );
    }
    );
    if (Object.keys(regionalInfo[0]).length === 0) {
    body = "No data"
    }
    setSpeciesFormattedOcc(body);
  }
}

export function setLinks(speciesInfo, setNemesisLink, setWoRMSLink, onSpeciesSelect, setShowSpeciesDetail, showingSpeciesDetail) {
  setNemesisLink(
    <a
      href={
        "https://invasions.si.edu/nemesis/species_summary/" +
        speciesInfo["Species Nemesis ID"]
      }
      target="_blank"
      rel="noopener noreferrer"
      className="hover:underline"
    >
      Nemesis page
    </a>
  );
  setWoRMSLink(
    <a
      href={
        speciesInfo["WoRMS URL"]
      }
      target="_blank"
      rel="noopener noreferrer"
      className="hover:underline"
    >
      WoRMS page
    </a>
  )
  onSpeciesSelect(speciesInfo); //set to species id
  setShowSpeciesDetail(true); // Populate sidebar with species' detail when a species is selected
  showingSpeciesDetail(true);
}

export function createSpeciesHeader(speciesInfo) {
  const ImgLink = speciesInfo["Species Img"];
  const urlObj = new URL(ImgLink);
  const ImgDomain = urlObj.hostname

  return (
    <>
    <p className="text-sm">
      {speciesInfo["Classification"]} species
    </p>
    <p className="text-sm mt-2">
      {speciesInfo["Species Description"]}
    </p>
    <img
      src={speciesInfo["Species Img"]}
      alt={speciesInfo["Species Name"]}
      className="w-full h-auto"
    />
    <a className="text-xs">
      Image credit: <br></br>
      <a className="text-primary hover:underline"
      href={speciesInfo["Species Img"]}
      target="_blank"
      rel="noopener noreferrer"
      >
        {ImgDomain}
        </a>
    </a>
    </>
  );
}

export default { createBodyFromRegionalInfo, setLinks, createSpeciesHeader }