import GPX from 'ol/format/GPX';
import VectorSource from 'ol/source/Vector';
import LayerSwitcher from "ol-layerswitcher";
import Map from 'ol/Map';
import OSM from 'ol/source/OSM';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import View from 'ol/View';
import WMTS from 'ol/source/WMTS';
import WMTSTileGrid from 'ol/tilegrid/WMTS';
import {fromLonLat, get as getProjection} from 'ol/proj';
import {getWidth} from 'ol/extent';
import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style';
import Overlay from 'ol/Overlay';
import {toLonLat} from 'ol/proj';
import {toStringHDMS} from 'ol/coordinate';

let gpxLayer;
let map;

const ignSource = (tileGrid) => {
  return new WMTS({
    // url: "https://wxs.ign.fr/emlz85c4agppn27qo3ss4ypx/geoportail/wmts",
    url: "https://wxs.ign.fr/jhyvi0fgmnuxvfv0zjzorvdn/geoportail/wmts",
    layer: 'GEOGRAPHICALGRIDSYSTEMS.MAPS',
    matrixSet: 'PM',
    format: 'image/jpeg',
    projection: 'EPSG:3857',
    tileGrid: tileGrid,
    style: 'normal',
    attributions:
      '<a href="http://www.ign.fr" target="_blank">' +
      '<img src="https://wxs.ign.fr/static/logos/IGN/IGN.gif" title="Institut national de l\'' +
      'information géographique et forestière" alt="IGN"></a>',
  });
}

const photoSource = (tileGrid) => {
  return new WMTS({
    url: "https://wxs.ign.fr/jhyvi0fgmnuxvfv0zjzorvdn/geoportail/wmts",
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
   * Elements that make up the popup.
   */
  var container = document.getElementById('popup');
  var content = document.getElementById('popup-content');
  var closer = document.getElementById('popup-closer');

  /**
   * Create an overlay to anchor the popup to the map.
   */
  var overlay = new Overlay({
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
    overlay.setPosition(undefined);
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
        color: '#0f0',
        width: 3,
      }),
    }),
  };

  gpxLayer = new VectorLayer({
    source: new VectorSource({
    }),
    style: function (feature) {
      return style[feature.getGeometry().getType()];
    },
  });

  map = new Map({
    target: 'map',
    layers: [
      osmLayer,
      ignLayer,
      photoLayer,
      gpxLayer
    ],
    view: new View({
      zoom: 5,
      center: fromLonLat([5, 45]),
    }),
    overlays: [overlay],
  });

  // add the LayerSwitcher (a.k.a. Map Legend)
  const layerSwitcher = new LayerSwitcher();
  layerSwitcher.ascending = false;
  layerSwitcher.useLegendGraphics = true;
  
  map.addControl(layerSwitcher);  

  map.on('singleclick', function (evt) {
    var coordinate = evt.coordinate;
    var hdms = toStringHDMS(toLonLat(coordinate));

    content.innerHTML = '<p>You clicked here:</p><code>' + hdms + '</code>';
    overlay.setPosition(coordinate);
  });
};


const fileSelected = (event) => {
  let firstFile;
  const gpxFormat = new GPX();
  let gpxFeatures;
  const fileList = event.target.files;
  firstFile = fileList[0];
  console.log(fileList);
  const reader = new FileReader();
  reader.readAsText(firstFile, "UTF-8");
  reader.onload = function (evt) {
    console.log(evt.target.result);
    gpxFeatures = gpxFormat.readFeatures(evt.target.result,{
      dataProjection:'EPSG:4326',
      featureProjection:'EPSG:3857'
    });
    console.log("gpxFeatures",gpxFeatures);
    gpxLayer.getSource().addFeatures(gpxFeatures);
  }
};

const initOpenLayers = () => {
  buildMap();
  const fileSelector = document.getElementById('file-selector');
  fileSelector.addEventListener('change', (event) => {
    fileSelected(event);
  });
  
};

export { initOpenLayers };