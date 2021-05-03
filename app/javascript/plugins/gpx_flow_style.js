import FlowLine from "ol-ext/style/FlowLine";
import LineString from "ol/geom/LineString";
import * as coordinate from "ol/coordinate";

  // Calculate the min/max elevation on the line
  var min, max;
  function getMinMax (feature) {
    feature.getGeometry().getCoordinates()[0].forEach( function(p){
      max = Math.max(max||-Infinity, p[2]);
      min = Math.min(min||Infinity, p[2]);
    });
    max = Math.round(max/10+.4)*10;
    min = Math.round(min/10-.4)*10;
  }
  // Get the line color at dh
  function getColor(dh) {
    if (dh<128) return [2*dh,160-dh,0];
    else return [ 255, (dh-128)*4, (dh-128)*1.5 ];
  }
  // The style function
  function styleFn(f) {
    return new FlowLine({
      visible: false,
      lineCap: 'round',
      color: function(f, step){
        var seg = [];
        var line = f.getGeometry().getLineString(0);
        line.getCoordinateAtSeg(step*line.getLength(), seg);
        var h = (seg[0][2]+seg[0][2])/2;
        var dh = 255*(h-min)/(max-min);
        return getColor(dh);
      },
      width: 3,
      geometry: function (f) {
        if (f.getGeometry().getType() === 'MultiLineString') {
          return f.getGeometry().getLineString(0);
        } else {
          return f.getGeometry();
        }
      }
    })
  }
    /** Get the coordinate at a distance from the start
   * @param {number} r distance from the start
   * @param {Array<Array<coordinate>>} seg if provided fill the segment concerned
   * @return {ol.coordinate}
   */
  LineString.prototype.getCoordinateAtSeg = function (r, seg) {
    var c, d;
    if (r < 1e-10) {
      if (seg)  {
        c = this.getCoordinates();
        seg[0] = c[0];
        seg[1] = c[1];
      }
      return this.getFirstCoordinate();
    }
    if (this.getLength()-r < 1e-10) {
      if (seg) {
        c = this.getCoordinates();
        seg[0] = c[c.length-2];
        seg[1] = c[c.length-1];
      }
      return this.getLastCoordinate();
    }
    if (!seg) seg=[];
    var s = 0;
    var coord = this.getCoordinates();
    for (var i=1; i<coord.length; i++) {
      d = coordinate.distance(coord[i-1], coord[i]);
      if (s+d >= r) {
        var p0 = seg[0] = coord[i-1];
        var p1 = seg[1] = coord[i];
        d = coordinate.distance(p0,p1)
        return [
          p0[0] + (r-s) * (p1[0]-p0[0]) /d,
          p0[1] + (r-s) * (p1[1]-p0[1]) /d
        ];
      }
      s += d;
    }
  };

  export { getMinMax, styleFn };