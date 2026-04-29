export const LAST_UPDATED = "02/01/2026";

export const DATA_COLORS = {
    nemesisSpecificSites: { 
        fill: "rgba(147,192,209,1)", 
        outline: "rgba(30, 102, 129, 0.8)", 
        label: "NEMESIS Sites" 
    },
    rasSites: { 
        fill: "rgba(245,200,92,1)", 
        outline: "rgba(120, 92, 25, 0.8)", 
        label: "RAS Sites" 
    },
    obisSites: { 
        fill: "rgba(121,209,168,1)", 
        outline: "rgba(17, 105, 64, 0.8)", 
        label: "OBIS Sites" 
    },
};

export const REGION_COLORS = {
    currentRegions: { 
        fill: "rgba(102,129,174, 0.5)", 
        outlineColor: "rgb(102,129,174)", 
        outline: "primary", 
        label: "Current Regions"},
    pastRegions: { 
        fill: "rgba(147,192,209, 0.3)",
        outlineColor: "rgb(147,192,209)",
        outline: "primary", 
        label: "Current + Past Regions"
    },
}

export const ESRI_CONFIG = {
  url: "https://js.arcgis.com/4.25/",
  extent: { ymin: 0, xmin: -100, xmax: -20, ymax: 50 },
  initialZoom: 4,
  initialCenter: [-65, 45],
};