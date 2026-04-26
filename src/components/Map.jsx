import React, { useEffect, useRef, useState } from "react";
import { loadModules } from "esri-loader";
import "../styles/mapStyle.css";
import MapSettings from "./MapSettings";
import { use } from "react";

function Map({
  allYears = false,
  currRegions = [],
  pastRegions = [],
  regionsDetail,
  nemesisRegionNames,
  currSites = {},
  currSitesB = {},
  expandSide = true,
  selectedTab,
}) {
  //TODO4 fix the popup for the first year region

  // make sure currRegions in a flat array
  currRegions = Array.isArray(currRegions[0]) ? currRegions[0] : currRegions;
  const MapElem = useRef(null);
  const viewRef = useRef(null);
  const geoJsonLayerRef = useRef(null);
  const graphicsLayerRef = useRef(null);
  const plotCountRef = useRef(0);
  const [renderer, setRenderer] = useState(null);
  const lastUpdated = "02/01/2026";

  const dataColors = {
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

  const regionColors = {
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

  const [datasetsToShow, setDatasetToShow] = useState({
    nemesisBioregions: true,
    currentRegions: true,
    pastRegions: true,
    nemesisSpecificSites: true,
    rasSites: true,
    obisSites: true,
  });

  //-----------------------------//
  // Creating popups for the map //
  //-----------------------------//
  // Add styles for the popup
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .esri-popup {
        position: absolute !important;
        z-index: 1000 !important;
        max-width: 300px;
      }

      .esri-popup__feature-menu {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
      }

      .esri-popup__content {
        white-space: normal;
        word-wrap: break-word;
        overflow-wrap: break-word;
      }

      .esri-popup__content-container {
        max-height: none;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Create the popup template base on unique region details
  const createPopupTemplate = (PopupTemplate, regionsDetail) => {
    return new PopupTemplate({
      content: [
        {
          type: "text",
          text: `
            <div class="custom-popup">
              <div class="popup-header">
                <p><strong>{expression/regionName}</strong> ({REG_NEWREG})</p>
                <p><strong>{expression/descriptiveText}</strong></p>
              </div>

            <div class="popup-body">
              <p>{expression/popupContent}</p>
            </div>
            </div>
          `,
        },
      ],
      expressionInfos: [
        {
          name: "regionName",
          title: "name",
          expression: `
            var region = $feature.REG_NEWREG;
            var names = {
              ${Object.entries(nemesisRegionNames)
                .map(([key, value]) => `'${key}': '${value}'`)
                .join(",")}
            };
            return names[region]
          `,
        },
        {
          name: "descriptiveText",
          title: "description",
          expression: `
            var region = $feature.REG_NEWREG;
            var currentRegions = ['${currRegions.join("','")}'];
            var allYears = ${allYears ? "true" : "false"};

            When(
              allYears, 'Years with Records (scroll for more):',
              Includes(currentRegions, region), 'Sources:',
              'Past Region:'
            )
          `,
        },
        {
          name: "popupContent",
          title: "Content",
          expression: `
            var region = $feature.REG_NEWREG;
            var currentRegions = ['${currRegions.join("','")}'];
            var allYears = ${allYears ? "true" : "false"};

            var details = {
                ${Object.entries(regionsDetail)
                  .map(
                    ([key, value]) => {
                      const sortedYears = Array.from(new Set(value)).sort();
                      return `'${key}': '${
                        allYears
                          ? sortedYears.join(", ")
                          : value
                              .map(
                                ({ RegionName, ...rest }) =>
                                  `${RegionName} (${rest["Source(s)"].trim()})`
                              )
                              .join(", ")
                      }'`
                })
                  .join(", ")}
            };

            if (allYears) {
              var detailsInfo = Split(details[region], ","); // Split into an array

              return detailsInfo
            }
            return IIF(
                Includes(currentRegions, region),
                IIF(hasKey(details, region), details[region], 'Source not found'),
                'Species have been spotted here in the past'
            );
            `,
        },
      ],
    });
  };

  // Add the popups for each year
  useEffect(() => {
    loadModules(["esri/PopupTemplate"], { url: "https://js.arcgis.com/4.25/" })
      .then(([PopupTemplate]) => {
        if (geoJsonLayerRef.current) {
          geoJsonLayerRef.current.popupTemplate = createPopupTemplate(
            PopupTemplate,
            regionsDetail
          );
        }
      })
      .catch((err) => console.error("Error updating popup:", err));
  }, 
  [regionsDetail,
    geoJsonLayerRef.current,
    allYears,
    currRegions
  ]);

  //---------------------------------------------------//
  // Creating the main section of the map with regions //
  //---------------------------------------------------//
  const [basemap, setBasemap] = useState("satellite");
  const [clusterOn, setClusterOn] = useState(true);

  // Main section to create the whole map
  useEffect(() => {
    loadModules(
      [
        "esri/views/MapView",
        "esri/WebMap",
        "esri/layers/GeoJSONLayer",
        "esri/layers/GroupLayer",
        "esri/PopupTemplate",
        "esri/renderers/UniqueValueRenderer",
        "esri/geometry/Extent"
      ],
      { url: "https://js.arcgis.com/4.25/" }
    )
      .then(
        ([
          MapView,
          WebMap,
          GeoJSONLayer,
          GroupLayer,
          PopupTemplate,
          UniqueValueRenderer,
          Extent,
        ]) => {
          // Adding styles for the popup
          // const style = document.createElement("style");
          // style.textContent = `

          // `;
          // document.head.appendChild(style);

          const webmap = new WebMap({ basemap });

          // TODO5: Tried defining the Lambert Conformal Conic projection
          // const lambertConformalConic = new SpatialReference({
          //   wkid: 102004, // WKID for North America Lambert Conformal Conic
          // });

          // limits map to some region in N. Am NE
          const extent = new Extent({
            ymin: 0,
            xmin: -100,
            xmax: -20,
            ymax: 50,
          });

          // initialize map zoom/position
          const view = new MapView({
            map: webmap,
            zoom: 4,
            center: [-65, 45],
            container: MapElem.current,
            // spatialReference: lambertConformalConic,

            // prevent zoom from going too far or too close
            constraints: {
              geometry: extent,
              minZoom: 3,
              maxZoom: 15,
            },
            popup: {
              dockEnabled: false,
              collapseEnabled: false,
              // highlightEnabled: true,
              // defaultPopupTemplateEnabled: true,
              // autoReposition: true,
              visibleElements: {
                featureNavigation: false,
                closeButton: true,
              },
              viewModel: {
                actions: {
                  zoom: false,
                },
                actionsMenuEnabled: false,
                includeDefaultActions: false,
              },
            },
          });
          view.popup.dockOptions = {
            buttonEnabled: false, // Hides the dock button
            breakpoint: false, // Disables responsive behavior
            position: "top-right", // Positions the popup where you want
          };

          const geoJsonLayer = new GeoJSONLayer({
            url: "/data/nemesisBioregions.geojson",
            outFields: ["*"],
            popupEnabled: true, // Explicitly enable popups
            popupTemplate: createPopupTemplate(PopupTemplate, regionsDetail),
          });

          geoJsonLayer.renderer = new UniqueValueRenderer({
            field: "REG_NEWREG",
            uniqueValueInfos: [],
          });

          webmap.add(geoJsonLayer);

          geoJsonLayerRef.current = geoJsonLayer;

          // const graphicsLayer = new GraphicsLayer();
          // webmap.add(graphicsLayer);
          // graphicsLayerRef.current = graphicsLayer;
          const groupLayer = new GroupLayer({ title: "Site data" });
          webmap.add(groupLayer);
          graphicsLayerRef.current = groupLayer;

          //TODO: fix highlight
          let highlightHandle = null;

          // once the layer‑view is available highlight on hover
          view.whenLayerView(groupLayer).then((layerView) => {
            view.on("pointer-move", (evt) => {
              view.hitTest(evt).then((response) => {
                if (highlightHandle) {
                  highlightHandle.remove();
                  highlightHandle = null;
                }

                const hit = response.results.find(
                  (r) => r.graphic && 
                  r.graphic.layer
                );

                if (!hit) {
                  view.container.style.cursor = "default";
                  return;
                }

                const featureLayer = hit.graphic.layer;
                view.whenLayerView(featureLayer).then((layerView) => {
                  if (layerView.highlight) {
                    if (featureLayer.type === "feature") {
                      highlightHandle = layerView.highlight(hit.graphic);
                    }
                    view.container.style.cursor = "pointer";
                  }
                });

              });
            });
          });
          
          view.popup.autoOpenEnabled = false;

          view.on("click", (evt) => {
            view.hitTest(evt).then((response) => {
              const pointHit = response.results.find(
                (r) => r.graphic && r.graphic.layer && r.graphic.layer !== geoJsonLayer
              );

              if (pointHit) {
                view.popup.open({
                  features: [pointHit.graphic],
                  location: evt.mapPoint,
                });
                return;
              }

              const regionHit = response.results.find(
                (r) => r.graphic && r.graphic.layer === geoJsonLayer
              );
              
              if (regionHit) {
                view.popup.open({
                  features: [regionHit.graphic],
                  location: evt.mapPoint,
                });
              } else {
                view.popup.close();
              }
            });
          });

          viewRef.current = view;
        }
      )
      .catch((err) => console.error("Error loading ESRI modules:", err));

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, [basemap]);

  // Update map with currRegions and pastRegions
  useEffect(() => {
    if (currRegions.length === 0 && pastRegions.length === 0) {
      if (geoJsonLayerRef.current) {
        geoJsonLayerRef.current.renderer = {
          type: "unique-value",
          field: "REG_NEWREG",
          uniqueValueInfos: [],
        };
      }
      return;
    };

    if (geoJsonLayerRef.current) {
      loadModules(["esri/renderers/UniqueValueRenderer"]).then(([UniqueValueRenderer]) => {
        
        const regionConfigs = [
          { id: "pastRegions", data: pastRegions },
          { id: "currentRegions", data: currRegions }
        ];

        const uniqueValueInfos = regionConfigs
          .filter(config => datasetsToShow[config.id])
          .flatMap(config => 
            config.data.map(region => ({
              value: region,
              symbol: {
                type: "simple-fill",
                color: regionColors[config.id].fill,
                outline: { color: regionColors[config.id].outlineColor, width: 1 },
              },
            }))
          );

        setRenderer(new UniqueValueRenderer({
          field: "REG_NEWREG",
          uniqueValueInfos
        }));
      });
    }
  }, [currRegions, pastRegions, datasetsToShow]);

  useEffect(() => {
    if (geoJsonLayerRef.current && renderer) {
      geoJsonLayerRef.current.renderer = renderer;
    }
  }, [renderer, geoJsonLayerRef.current]);

  //---------------------------------//
  // Adding specific sites to the map //
  //----------------------------------//

  const createSitePopupTemplate = (siteInfo) => {
    let content = `<p><strong>Record Date:</strong> ${siteInfo["Date"]}</p>`;
    if (siteInfo["Site Code"]) {
      content += `
      <p><strong>Site Name:</strong> ${siteInfo["Site Location"]}</p>
      <p><strong>City, State:</strong> ${siteInfo["City"]}, ${
        siteInfo["State"]
      }</p>
      <p><strong>(Lat, Long)</strong>: (${parseFloat(
        siteInfo["Latitude"]
      ).toFixed(2)},
      ${parseFloat(siteInfo["Longitude"]).toFixed(2)})</p>
      `;
    } else if (siteInfo["DatasetID"]) {
      content += `
      <p><strong>(Lat, Long)</strong>: (${parseFloat(
        siteInfo["Latitude"]
      ).toFixed(2)},
      ${parseFloat(siteInfo["Longitude"]).toFixed(2)})</p>

      <p><a href="https://obis.org/dataset/${siteInfo["DatasetID"]}"
        target="_blank"
        rel="noopener noreferrer"
        style="color: rgb(102,129,174);">
        Link to OBIS Dataset
      </a></p>`;
    } else {
      content += `
      <p><strong>Site Name:</strong> ${siteInfo["Site Location"]}</p>
      <p><strong>(Lat, Long)</strong>: (${parseFloat(
        siteInfo["Latitude"]
      ).toFixed(2)},
      ${parseFloat(siteInfo["Longitude"]).toFixed(2)})</p>
      <p><strong>Source:</strong> ${siteInfo["Source(s)"]}</p>
      `;
    }
    return { content: content };
   };

  const makeStops = (max) => {
    const points = [1,2,5,10,50,100,300,500];
    return points.map(v => ({ 
      value: v, 
      size: 7 + Math.round(Math.sqrt(v/max) * 50) }));
  };

  const createFeatures = (Graphic, sitesData) => 
    sitesData.map((site, index) => new Graphic({
      geometry: {
        type: "point",
        longitude: parseFloat(site.Longitude),
        latitude: parseFloat(site.Latitude),
      },
      attributes: site,
    }));
  
  const createFields = (sitesData) => {
    const sampleSite = sitesData[0] || {};
    const additionalFields = Object.keys(sampleSite).map(
      (key) => {
        const value = sampleSite[key];
        let type = 'string';
        if (key === 'Date') {
          type = 'double';
        }
        else if (typeof value === 'number') type = 'double';
        return {
          name: key,
          type: type,
        };
      }
    );
    return [
      { name: "ObjectID", type: "oid" },
      { name: "dataset", type: "string" },
      { name: "species", type: "string" },
      ...additionalFields,
    ];
  };

  const createSiteFeatureLayer = 
  (Graphic, FeatureLayer, sitesData, colors, style) => 
    new FeatureLayer({
      source: createFeatures(Graphic, sitesData),
      objectIdField: "ObjectID",
      geometryType: "point",
      fields: createFields(sitesData),
      outFields: ["*"],
      featureReduction: clusterOn ? {
        type: "cluster",
        clusterRadius: "60px",
        clusterMinSize: "15px",
        clusterMaxSize: "50px",
        
        labelingInfo: [
          {
            // deconflictionStrategy: "none",
            labelExpressionInfo: {
              expression: "Text($feature.cluster_count, '#,###')",
            },
            symbol: {
              type: "text",
              color: "#000000",
              font: { weight: "bold", size: "10px" },
            },
            labelPlacement: "center-center",
          },
        ],

        popupTemplate: {
          content: (feature) => {
            const layer = feature.graphic.layer;
            const count = feature.graphic.attributes.cluster_count;

            const query = layer.createQuery();
            const view = layer.view;

            query.geometry = feature.graphic.geometry;

            query.distance = view && view.resolution
            ? query.distance = 70*view.resolution
            : 50000;
            query.units = "meters";
            query.outFields = ["Date"];
            query.returnGeometry = false;
            return layer.queryFeatures(query).then((result) => {
              const dates = result.features.map(f => f.attributes.Date);
              const uniqueDates = [...new Set(dates)].sort((a, b) => a-b);
              // const dateInfo = uniqueDates.length > 0 
              //   ? `<p><strong>Dates:</strong><br>${uniqueDates.join('<br>')}</p>` 
              //   : '';
              const dateInfo = "";
              return `<p><strong>${count} records</strong></p>
              <span>Zoom in to see more.</span>
              ${dateInfo}`;
            });
          },
        },
      } : null,
      renderer: {
        type: "simple",
        symbol: {
          type: "simple-marker",
          style: style,
          color: colors.fill,
          size: 10,
          outline: { color: colors.outline, width: 1.5 },
        },
        visualVariables: [{
          type: "size",
          field: "cluster_count",
          stops: makeStops(300)
        }],
      },
      
      popupTemplate: {
        content:
        (feature) => createSitePopupTemplate(feature.graphic.attributes).content,
      },
    });
  
  // Update map by plotting clustered sites
  useEffect(() => {
    loadModules(
      ["esri/Graphic", "esri/layers/FeatureLayer"], 
      { url: "https://js.arcgis.com/4.25/" }
    )
    .then(([Graphic, FeatureLayer]) => {
      if (graphicsLayerRef.current) {
        plotCountRef.current += 1;
        graphicsLayerRef.current.removeAll(); // Clear existing layers
        
        Object.entries(dataColors).forEach(([key, colors]) => {
          const speciesConfigs = [
            { sites: currSites[key], style: "circle" },
            { sites: currSitesB[key], style: "triangle" }
          ];

          if (datasetsToShow[key]) {
            speciesConfigs.forEach(({ sites, style }) => {
              if (sites) {
                const layer = createSiteFeatureLayer(
                  Graphic, 
                  FeatureLayer, 
                  sites, 
                  colors, 
                  style, 
                );
                graphicsLayerRef.current.add(layer);
              }
            });
          }
        });
      }
    })
  }, [graphicsLayerRef.current, currSites, currSitesB, datasetsToShow, clusterOn]);


  // Create a legend showing only datasetsToShow
  const Legend = ({ datasetsToShow }) => {
    const legendItems = Object.entries({ ...regionColors, ...dataColors }).map(([key, colors]) => {
      return {
        key: key,
        color: colors.fill,
        border: colors.outline,
        label: colors.label,
      }
    });

    const itemsToShow = legendItems.filter(({ key }) => datasetsToShow[key]);

    if (itemsToShow.length === 0) {
      return (
        <div className="absolute top-4 right-4 bg-base-100 p-2 rounded shadow outline outline-primary">
          <h4 className="text-sm font-semibold">
            Select a database to show in settings
          </h4>
        </div>
      );
    }

    return (
      <div className="absolute top-4 right-4 bg-base-100 p-2 rounded shadow outline outline-primary">
        <h4 className="text-sm font-bold mb-2">Legend:</h4>
        {itemsToShow // Only render items with true value in datasetsToShow
          .map(({ color, border, label }, index) => (
            <div className="flex items-center" key={index}>
              <span
                className={`inline-block w-4 h-4 mr-2 border-2 border-${border}`}
                style={{ backgroundColor: color, borderColor: border }}
              ></span>
              <span>{label}</span>
            </div>
          ))}
      </div>
    );
  };

  const left_width = () => {
    if (!expandSide) {
      return 'left-8';
    }
    if (selectedTab == "oneSpecies"){
      return 'left-60';
    }
    return 'left-[414px]';
  }

  return (
    <div className="h-full w-full bg-base-100 relative">
      <div className={`absolute top-0 z-10 bg-none p-2 ${left_width()}`}>
        <MapSettings
          setDatasetToShow={setDatasetToShow}
          datasetsToShow={datasetsToShow}
          setBasemap={setBasemap}
          basemap={basemap}
          setClusterOn={setClusterOn}
          clusterOn={clusterOn}
        />
      </div>
      <div className={`absolute text-xs text-primary-content bottom-0 z-10 bg-none p-2 ${left_width()}`}>
        Data last modified: {lastUpdated}
      </div>

      <div ref={MapElem} className="h-full"></div>
      <Legend datasetsToShow={datasetsToShow} />
    </div>
  );
}

export default Map;
