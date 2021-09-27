import GPX from 'ol/format/GPX';
import VectorSource from 'ol/source/Vector';
import LayerSwitcher from "ol-ext/control/LayerSwitcher";
import Map from 'ol/Map';
import OSM from 'ol/source/OSM';
import Stamen from 'ol/source/Stamen';
import TileLayer from 'ol/layer/Tile';
import TileWMS from 'ol/source/TileWMS';
import VectorLayer from 'ol/layer/Vector';
import View from 'ol/View';
import WMTS from 'ol/source/WMTS';
import WMTSTileGrid from 'ol/tilegrid/WMTS';
import {fromLonLat, get as getProjection} from 'ol/proj';
import {getWidth} from 'ol/extent';
import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style';
import Overlay from 'ol/Overlay';
import Tooltip from 'ol-ext/overlay/Tooltip';
import {toLonLat} from 'ol/proj';
import {toStringHDMS} from 'ol/coordinate';
import SearchGeoportail from "ol-ext/control/SearchGeoportail";
import ScaleLine from "ol/control/ScaleLine";
import {elevationMap, getElevationFromPixel} from 'ol-ext/util/imagesLoader';
import { getMinMax, styleFn } from './gpx_flow_style'
import CSS from 'ol-ext/filter/CSS';

let gpxLayer;
let map;
let apiKey = "";
let apiLHKey = "";
let gpxStyle;


const ignSource = (tileGrid) => {
  if (location.hostname === "localhost") {
    return new WMTS({
      url: `https://wxs.ign.fr/${apiLHKey}/geoportail/wmts?`,
      layer: 'GEOGRAPHICALGRIDSYSTEMS.MAPS',
      matrixSet: 'PM',
      format: 'image/jpeg',
      tileGrid: tileGrid,
      style: 'normal',
      attributions:
        '<a href="http://www.ign.fr" target="_blank">' +
        '<img src="https://wxs.ign.fr/static/logos/IGN/IGN.gif" title="Institut national de l\'' +
        'information géographique et forestière" alt="IGN"></a>',
    });
  } else {
    return new WMTS({
      url: `https://wxs.ign.fr/${apiKey}/geoportail/wmts?`,
      layer: 'GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2',
      matrixSet: 'PM',
      format: 'image/png',
      tileGrid: tileGrid,
      style: 'normal',
      attributions:
        '<a href="http://www.ign.fr" target="_blank">' +
        '<img src="https://wxs.ign.fr/static/logos/IGN/IGN.gif" title="Institut national de l\'' +
        'information géographique et forestière" alt="IGN"></a>',
    });
  }
}

const photoSource = (tileGrid) => {
  return new WMTS({
    url: `https://wxs.ign.fr/${apiKey}/geoportail/wmts?`,
    layer: 'ORTHOIMAGERY.ORTHOPHOTOS',
    matrixSet: 'PM',
    tileGrid: tileGrid,
    style: 'normal',
  });
}

const osmSource = (tileGrid) => {
  return new OSM();
}

const buildMap = () => {
  /**
   * Elements that make up the popup for coordinates.
   */
  var container = document.getElementById('popup-coord');
  var content = document.getElementById('popup-coord-content');
  var closer = document.getElementById('popup-coord-closer');

  /**
   * Create an overlay to anchor the popup to the map.
   */
  var overlayAnchor = new Overlay({
    element: container,
    autoPan: true,
    autoPanAnimation: {
      duration: 250,
    },
  });

  /**
   * Add a click handler to hide the popup.
   * @return {boolean} Don't follow the href.
   */
  closer.onclick = function () {
    overlayAnchor.setPosition(undefined);
    closer.blur();
    return false;
  };
  let resolutions = [];
  let matrixIds = [];
  let proj3857 = getProjection('EPSG:3857');
  let maxResolution = getWidth(proj3857.getExtent()) / 256;

  for (let i = 0; i < 18; i++) {
    matrixIds[i] = i.toString();
    resolutions[i] = maxResolution / Math.pow(2, i);
  }

  const tileGrid = new WMTSTileGrid({
    origin: [-20037508, 20037508],
    resolutions: resolutions,
    matrixIds: matrixIds,
  });

  const ignLayer = new TileLayer({
    source: ignSource(tileGrid),
    title: "Cartes IGN",
    opacity: 0.7
  });

  const photoLayer = new TileLayer({
    source: photoSource(tileGrid),
    title: "Photographies aériennes",
    opacity: 0.7
  });

  const osmLayer = new TileLayer({
    source: osmSource(),
    title: "OSM"
  });

  const stamenWatercolorLayer = new TileLayer({
    source: new Stamen({layer: 'watercolor'}),
    title: "Stamen-watercolor"
  });
  const stamenTerrainLayer = new TileLayer({
    source: new Stamen({layer: 'terrain-labels'}),
    title: "Stamen-terrain-labels"
  });

  var style = {
    'Point': new Style({
      image: new CircleStyle({
        fill: new Fill({
          color: 'rgba(255,255,0,0.4)',
        }),
        radius: 5,
        stroke: new Stroke({
          color: '#ff0',
          width: 1,
        }),
      }),
    }),
    'LineString': new Style({
      stroke: new Stroke({
        color: '#f00',
        width: 3,
      }),
    }),
    'MultiLineString': new Style({
      stroke: new Stroke({
        color: '#b8b5ff',
        width: 3,
      }),
    }),
  };

  const gpxSource = new VectorSource();
	gpxSource.once('change',function(e) {
    if (gpxSource.getState() === 'ready'){
      getMinMax (gpxSource.getFeatures()[0]);
		}
  });

  gpxLayer = new VectorLayer({
    source: gpxSource,
    title: "GPX tracks",
    // style: styleFn,
    style: function (feature) {
      return style[feature.getGeometry().getType()];
    },
  });

  map = new Map({
    target: 'map',
    layers: [
      osmLayer,
      ignLayer,
      // photoLayer,
      // stamenWatercolorLayer,
      // stamenTerrainLayer,
      gpxLayer
    ],
    view: new View({
      zoom: 5,
      center: fromLonLat([5, 45]),
      }),
    overlays: [overlayAnchor],
  });


  // A set of elevation layers
  const elevationLayers = [
    {
      title: 'MNT SRTM3',
      url: 'https://wxs.ign.fr/altimetrie/geoportail/r/wms',
      layer: 'ELEVATION.ELEVATIONGRIDCOVERAGE.SRTM3',
      //extent: [ -20037554.725947514, -8625918.87376409, 20037554.725947514, 8625918.87376409 ]
    },{
      title: 'MNS',
      url: 'https://wxs.ign.fr/altimetrie/geoportail/r/wms',
      layer: 'ELEVATION.ELEVATIONGRIDCOVERAGE.HIGHRES.MNS',
      extent: [ -578959.605490584, 5203133.393641367, 921974.2487313666, 6643289.75487211 ]
    }, {
      title: 'MNT-RGE-Alti',
      url: 'https://wxs.ign.fr/altimetrie/geoportail/r/wms',
      layer: 'ELEVATION.ELEVATIONGRIDCOVERAGE.HIGHRES',
      extent: [ -7007874.496280316, -1460624.494037931, 5043253.3127169, 6639937.650114076 ]
    }, {
      title: 'MNT BDAlti V1',
      url: 'https://wxs.ign.fr/altimetrie/geoportail/r/wms',
      layer: 'ELEVATION.ELEVATIONGRIDCOVERAGE',
      extent: [ -7007874.496280316, -1460624.494037931, 5043253.3127169, 6639937.650114076 ]
    }
  ];

  // Add tile layer
  const layer = elevationLayers[1]
  const elevTileLayer = new TileLayer ({
    title: layer.title,
    displayInLayerSwitcher: false,
    opacity: 0,
    extent: layer.extent,
    minResolution: 0,
    maxResolution: 197231.79878968254,
    source: new TileWMS({
      url: layer.url,
      projection: 'EPSG:3857',
      attributions: [ 'Geoservices-IGN' ],
      crossOrigin: 'anonymous',
      params: {
        LAYERS: layer.layer,
        FORMAT: 'image/x-bil;bits=32',
        VERSION: '1.3.0'
      }
    })
  });
  map.addLayer(elevTileLayer);

  // Tile load function to convert elevation
  const alti = elevationMap();
  elevTileLayer.getSource().setTileLoadFunction(alti);

  // Hide the layer (but keep it on the map)
  const hide = new CSS({ display: false });
  elevTileLayer.addFilter(hide);

  // Prevent layer smoothing
  elevTileLayer.once('prerender', function(evt) {
    evt.context.imageSmoothingEnabled = false;
    evt.context.webkitImageSmoothingEnabled = false;
    evt.context.mozImageSmoothingEnabled = false;
    evt.context.msImageSmoothingEnabled = false;
  });

  // Add a popup to display elevation
  const popup = new Tooltip();
  map.addOverlay(popup)
  map.on('pointermove', function(e) {
    map.forEachLayerAtPixel(
      e.pixel, 
      function(layer, p) {
        if (layer===elevTileLayer) {
          var h = getElevationFromPixel(p);
          popup.setInfo(h>-5000 ? h.toFixed(2)+' m' : '');
        }
      }),{
        layerFilter: function(l) {
          return l===elevTileLayer;
        }
      }
  });

  const layerSwitcher = new LayerSwitcher();
  map.addControl(layerSwitcher);  

  // Set the control grid reference
  const search = new SearchGeoportail({
    apiKey: apiKey,
    // type: 'Commune',
    reverse: true
    });
  map.addControl (search);

  // Select feature when click on the reference index
  search.on('select', function(e) {
    // console.log(e);
    map.getView().animate({
      center:e.coordinate,
      zoom: Math.max (map.getView().getZoom(),16)
    });
  });

  map.addControl(new ScaleLine());

  map.on('singleclick', function (evt) {
    var coordinate = evt.coordinate;
    var hdms = toStringHDMS(toLonLat(coordinate));

    content.innerHTML = '<p>You clicked here:</p><code>' + hdms + '</code>';
    overlayAnchor.setPosition(coordinate);
  });
};


const fileSelected = (event) => {
  let firstFile;
  const gpxFormat = new GPX();
  let gpxFeatures;
  const fileList = event.target.files;
  firstFile = fileList[0];
  const reader = new FileReader();
  reader.readAsText(firstFile, "UTF-8");
  reader.onload = function (evt) {
    gpxFeatures = gpxFormat.readFeatures(evt.target.result,{
      dataProjection:'EPSG:4326',
      featureProjection:'EPSG:3857'
    });
    // gpxFeatures = gpxFormat.readFeatures(evt.target.result);
    gpxLayer.getSource().addFeatures(gpxFeatures);
  }
};

const initOpenLayers = () => {
  fetch('/init', { headers: { accept: "application/json" }})
    .then(response => response.json())
    .then((data) => {
      apiKey = data.ignApiKey;
      apiLHKey = data.ignLHApiKey;
      buildMap();
    });
  const fileSelector = document.getElementById('file-selector');
  fileSelector.addEventListener('change', (event) => {
    fileSelected(event);
  });
  
};

export { initOpenLayers };