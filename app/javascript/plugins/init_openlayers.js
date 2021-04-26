import 'ol/ol.css';
import "ol-layerswitcher/src/ol-layerswitcher.css";
import LayerSwitcher from "ol-layerswitcher";
import Map from 'ol/Map';
import OSM from 'ol/source/OSM';
import TileLayer from 'ol/layer/Tile';
import View from 'ol/View';
import WMTS from 'ol/source/WMTS';
import WMTSTileGrid from 'ol/tilegrid/WMTS';
import {fromLonLat, get as getProjection} from 'ol/proj';
import {getWidth} from 'ol/extent';


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

  const map = new Map({
    target: 'map',
    layers: [
      osmLayer,
      ignLayer,
      photoLayer
    ],
    view: new View({
      zoom: 5,
      center: fromLonLat([5, 45]),
    }),
  });

  // add the LayerSwitcher (a.k.a. Map Legend)
  const layerSwitcher = new LayerSwitcher();
  layerSwitcher.ascending = false;
  layerSwitcher.useLegendGraphics = true;
  
  map.addControl(layerSwitcher);  

};

const initOpenLayers = () => {
  buildMap();
};

export { initOpenLayers };