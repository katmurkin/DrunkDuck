// Google SatelliteImagery
googlelink = '<a href="http://maps.google.com">Google Maps</a>';
var googleSLayer = L.tileLayer(
	'//{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
	attribution: ' Contains public sector information licensed under the Open Government Licence v3.0.' + 
	'<br>&copy The Canal & River Trust copyright and database rights reserved [2020]<br>Map data &copy; ' + googlelink,
	maxZoom: 18,
	subdomains:['mt0','mt1','mt2','mt3']
	});

// Open StreetMap
osmlink ='<a href="http://openstreetmap.org">OpenStreetMap</a>';
var osmLayer = L.tileLayer(
	'//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	attribution: 'Contains public sector information licensed under the Open Government Licence v3.0.' + 
	'<br>&copy The Canal & River Trust copyright and database rights reserved [2020]<br>Map data &copy; ' + osmlink,
	maxZoom: 18
	});
	
baseLayers = {"Google Satellite": googleSLayer,
	"Open Street Map": osmLayer};

// Define map
var map = L.map('map', {
	center: [ 52.481328, -1.877716],
	minZoom: 1,
	zoom: 12,
	layers: osmLayer});
// Map Control 
	L.control.layers(baseLayers).addTo(map); 
// Map pane for z-index
map.createPane('pubs');
map.getPane('pubs').style.zIndex = 450;