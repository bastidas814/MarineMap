import React, { useEffect, useRef, useState } from "react";
import { loadModules } from "esri-loader";
import "../styles/mapStyle.css";
import MapSettings from "./MapSettings";
import { use } from "react";
import { LAST_UPDATED, DATA_COLORS, REGION_COLORS, ESRI_CONFIG } from "../config/mapConfig";

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
  // make sure currRegions in a flat array
  currRegions = Array.isArray(currRegions[0]) ? currRegions[0] : currRegions;

  // ref variables
  const MapElem = useRef(null);
  const viewRef = useRef(null);
  const zoomRef = useRef(null);
  const geoJsonLayerRef = useRef(null);
  const graphicsLayerRef = useRef(null);
  const plotCountRef = useRef(0);
  const [renderer, setRenderer] = useState(null);
  

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
    loadModules(["esri/PopupTemplate"], { url: ESRI_CONFIG.url, css: true })
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
        "esri/geometry/Extent",
        "esri/widgets/Zoom"
      ],
      { url: ESRI_CONFIG.url }
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
          Zoom
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
          const extent = new Extent(ESRI_CONFIG.extent);

          // initialize map zoom/position
          const view = new MapView({
            map: webmap,
            zoom: ESRI_CONFIG.initialZoom,
            center: ESRI_CONFIG.initialCenter,
            container: MapElem.current,
            ui: {
              components: []
            },
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

          // create geoJSON layer for bioregions
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

          // create Group Layer for points
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

          // popup after click on point
          view.on("click", (evt) => {
            view.hitTest(evt).then((response) => {
              // point popup
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

              // region popup
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

          // zoom buttons
          viewRef.current = view;
          const zoomWidget = new Zoom({ view });
          view.ui.add(zoomWidget, "bottom-left");
          zoomWidget.container.style.position = "absolute";
          zoomWidget.container.style.left = `${getLeftPixel()}px`;
          zoomWidget.container.style.zIndex = "1001";
          zoomRef.current = zoomWidget; 
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

  // get left pixel value based on sidebar width
  const getLeftPixel = () => {
    if (!expandSide) return 32; 
    if (selectedTab === "oneSpecies") return 240;
    return 414;
  };

  // update zoom buttons when sidebar changes
  useEffect(() => {
    if (zoomRef.current) {
      zoomRef.current.container.style.left = `${getLeftPixel()}px`;
    }
  }, [expandSide, selectedTab]);

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

        // include regions to be shown
        const uniqueValueInfos = regionConfigs
          .filter(config => datasetsToShow[config.id])
          .flatMap(config => 
            config.data.map(region => ({
              value: region,
              symbol: {
                type: "simple-fill",
                color: REGION_COLORS[config.id].fill,
                outline: { color: REGION_COLORS[config.id].outlineColor, width: 1 },
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

  // create popup from site info
  const createSitePopupTemplate = (siteInfo) => {
    let content = `<p><strong>Record Date:</strong> ${siteInfo["Date"]}</p>`;
    if (siteInfo["Site Code"]) { // RAS Data
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
    } else if (siteInfo["DatasetID"]) { // OBIS data
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
    } else { // Nemesis data
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

  // cluster stops
  const makeStops = (max) => {
    const points = [1,2,5,10,50,100,300,500];
    return points.map(v => ({ 
      value: v, 
      size: 7 + Math.round(Math.sqrt(v/max) * 50) }));
  };

  // create features from site data
  const createFeatures = (Graphic, sitesData) => 
    sitesData.map((site, index) => new Graphic({
      geometry: {
        type: "point",
        longitude: parseFloat(site.Longitude),
        latitude: parseFloat(site.Latitude),
      },
      attributes: { ...site, ObjectID: index + 1}
  }));
  
  // create the fields/type for a ArcGIS feature
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

  // function to create layer with site data
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
            return `<p><strong>${count} records</strong></p>
            <span>Zoom in to see more.</span>`;
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
      { url: ESRI_CONFIG.url }
    )
    .then(([Graphic, FeatureLayer]) => {
      if (graphicsLayerRef.current) {
        plotCountRef.current += 1;
        graphicsLayerRef.current.removeAll(); // Clear existing layers
        
        Object.entries(DATA_COLORS).forEach(([key, colors]) => {
          const speciesConfigs = [
            { sites: currSites[key], style: "circle" },
            { sites: currSitesB[key], style: "triangle" }
          ];

          // add layer for each dataset
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
    // list of data and region labels with colors
    const legendItems = Object.entries({ ...REGION_COLORS, ...DATA_COLORS }).map(([key, colors]) => {
      return {
        key: key,
        color: colors.fill,
        border: colors.outline,
        label: colors.label,
      }
    });

    // filter to only datasets that are currently shown
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

  

  return (
    <div className="h-full w-full bg-base-100 relative">

      {/* Settings button */}
      <div 
        className={`absolute top-0 z-10 bg-none p-2`}
        style={{left: `${getLeftPixel()}px`}}
      >
        <MapSettings
          setDatasetToShow={setDatasetToShow}
          datasetsToShow={datasetsToShow}
          setBasemap={setBasemap}
          basemap={basemap}
          setClusterOn={setClusterOn}
          clusterOn={clusterOn}
        />
      </div>

      {/* Text for data last modified */}
      <div
        className="absolute text-xs text-primary-content bottom-0 z-10 bg-none p-2"
        style={{ left: `${getLeftPixel() + 55}px` }}
      >
        Data last modified: {LAST_UPDATED}
      </div>

      {/* Map with data */}
      <div ref={MapElem} className="h-full"></div>

      {/* Legend */}
      <Legend datasetsToShow={datasetsToShow} />
    </div>
  );
}

export default Map;
