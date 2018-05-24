/*
 * L.CRS.EPSG4326 is a CRS popular among advanced GIS specialists.
 */

L.CRS.GCJ02 = L.extend({}, L.CRS.Earth, {
	code: 'EPSG:4326',
	projection: L.Projection.GCJ02,
	transformation: new L.Transformation(1 / 180, 1, -1 / 180, 0.5)
});
