import 'ol/ol.css';
import Map from 'ol/Map';
import TileLayer from 'ol/layer/Tile';
import View from 'ol/View';
import WMTS from 'ol/source/WMTS';
import WMTSTileGrid from 'ol/tilegrid/WMTS';
import {fromLonLat, get as getProjection} from 'ol/proj';
import {getWidth} from 'ol/extent';

const buildMap = () => {
  const map = new Map({
    target: 'map',
    view: new View({
      zoom: 5,
      center: fromLonLat([5, 45]),
    }),
  });

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

  // For more information about the IGN API key see
  // https://geoservices.ign.fr/blog/2017/06/28/geoportail_sans_compte.html

  var ign_source = new WMTS({
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

  const ign = new TileLayer({
    source: ign_source,
  });

  map.addLayer(ign);
};

const initOpenLayers = () => {
  buildMap();
};

export { initOpenLayers };