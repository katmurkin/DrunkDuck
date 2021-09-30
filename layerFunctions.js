// Define global variables
var canalGroup = L.layerGroup();
var canalSelectedGroup = L.featureGroup();
var pubGroup = L.layerGroup();
var pubFilteredResults = [];
var selectedCanalSection = null;
var canalGeoJSON;
var boatDistanceFromSectionStart;
var boatDistanceFromSectionEnd;
var boatPositionMarker;
var boatPositionGeoJSON;

// Define styles
var pubStyle = {radius: 4, fillColor: "LightSlateGrey", color: "#000", weight: 1, opacity: 1, fillOpacity: 0.8, pane: 'pubs'};
var selectedPubMarker = {fillColor: "Lime", radius: 5, fillOpacity: 0.8};
var canalStyle = {color: "#3b0ead", weight: 3};
var selectedCanalStyle = {color: "deeppink", weight: 3};

// Process each canal function. 
function processEachCanal(feature, canalLayer) {
        // Add to group to allow zoom to selected canal
        var str = document.getElementById("search").value;
        var fname = feature.properties.name.slice(0,-6);
        if (fname == str) {
                canalLayer.addTo(canalSelectedGroup);
        }
}

// Calculate distances to selected pubs
function calcDistToPub(pubCanalSection, pubPoint) {
        // Check if a canal has been selected
        if (selectedCanalSection == null) {
            // Return -1 to indicate function not able to work if no start position has been selected
            // Can't calculate distance as no canal selected
            return -1;
        }   
        // Check if pub is on same canal as boat start location
        if (pubCanalSection.slice(0,-6) != selectedCanalSection.slice(0,-6)) {
            // Not on same canal
            // Return -1 to indicate function not able to work on points not on same canal
            return -1;
        }
    var pubCanalGeoJSON;
        // Get line for pubCanalSection
        canalGeoJSON.eachLayer(function (eachCanal) {
            if (eachCanal.feature.properties.name == pubCanalSection) {
               // Should be linestring. Some canal features were originlly geometry collection (left in as safeguard)  
               if (eachCanal.feature.geometry.type === "LineString") {
                    // Store feature for later use
                    pubCanalGeoJSON = eachCanal.feature;
                }
            }
        });
        
        // Distance of pub from start and end of canal section
        var startPointPubCanal = pubCanalGeoJSON.geometry.coordinates[0];
        // Split canal at pub location (note turf function does not need point to be located on canal line)
        var pubSlice = turf.lineSlice(startPointPubCanal, pubPoint.feature, pubCanalGeoJSON);
        pubDistanceFromSectionStart = turf.length(pubSlice, {units: 'kilometers'});
        pubboatDistanceFromSectionEnd = (turf.length(pubCanalGeoJSON, {units: 'kilometers'}) - pubDistanceFromSectionStart); 
        if (pubCanalSection == selectedCanalSection) {
        // Pub on current canal section
            var returnedLength = Math.abs(pubDistanceFromSectionStart - boatDistanceFromSectionStart);
            return turf.round(returnedLength, 2);
        } else {
            // Pub on different section of same canal
            // Selected canal number
            startSectionNo = selectedCanalSection.slice(-3);
            endSectionNo = pubCanalSection.slice(-3);
            midSection = endSectionNo - startSectionNo;
            if (startSectionNo < endSectionNo) {
                // Boat is lower than pub
                // Measure upwards to pub section
                // MidSections are all 1km in length
                startLength = boatDistanceFromSectionEnd;
                pubLength = pubDistanceFromSectionStart;
                midLength = (endSectionNo - startSectionNo) -1;
            } else {
                // Measure downwards to pub
                // MidSections are all 1km in length
                startLength = boatDistanceFromSectionStart;
                pubLength = pubboatDistanceFromSectionEnd;
                midLength = (startSectionNo - endSectionNo) - 1;
            }
            totalDist = turf.round((startLength + midLength + pubLength), 2)
            return  totalDist;
        }
}

// Process canal geoJSON
function processCanalsJSON(data) {
        var selectedCanalName = document.getElementById("search").value;
        canalGeoJSON = L.geoJSON(data, {
            style:function(feature) {
                // Slice name to remove canal section identifier from popup box
                if (feature.properties.name.slice(0, -6) == selectedCanalName) {
                    return selectedCanalStyle;
                } else {
                    return canalStyle;
                }
            },
            onEachFeature: processEachCanal
        }).addTo(canalGroup);

        //zoom map to show entire canal if boat location not set
        if (selectedCanalSection === null) {
            if (canalSelectedGroup.getLayers().length > 0) {
                map.fitBounds(canalSelectedGroup.getBounds());
            }
        }
}

       
//on each pub function, returning name, postcode and associated canal name
function processEachPub(feature, layer) {
        // Create popup text 
        popUpText = "Name: " + feature.properties.PubName + "<br>Postcode: " + feature.properties.Postcode + 
            "<br>Nearest Canal: " + feature.properties.CloseCanal.slice(0,-6) + 
            "<br>Food: " + feature.properties.Food + "&nbsp; Real Ale: "+ feature.properties.RealAle + "<br>Garden: " + 
            feature.properties.Garden + "&nbsp; Dog Friendly: " + feature.properties.DogFriendly ;
        feature.properties.popupContent = popUpText;
        if (feature.properties && feature.properties.popupContent) {
            layer.bindPopup(feature.properties.popupContent);
        }

        // Add to selection
        // Default to add all pubs on canal to table, then remove with conditions below
        var addPubToSelection = true;
        // Canal condition
        var selectedCanalName = document.getElementById("search").value;
        var pubClosestCanalName = feature.properties.CloseCanal.slice(0, -6);
        if (pubClosestCanalName != selectedCanalName) {
            addPubToSelection = false
        }

        var tristateTick = 10004; var tristateCross = 10006;
        // Food condition
        var foodTristate = document.getElementById("foodTristate").value.charCodeAt(0); 
        if ((foodTristate == tristateTick) && (feature.properties.Food == "No")) {
            addPubToSelection = false;
        }
        if ((foodTristate == tristateCross) && (feature.properties.Food == "Yes")) {
            addPubToSelection = false;
        }

        // Real ale condition
        var aleTristate = document.getElementById("aleTristate").value.charCodeAt(0); 
        if ((aleTristate == tristateTick) && (feature.properties.RealAle == "No")) {
            addPubToSelection = false;
        }
        if ((aleTristate == tristateCross) && (feature.properties.RealAle == "Yes")) {
            addPubToSelection = false;
        }
        
        // Garden condition
        var gardenTristate = document.getElementById("gardenTristate").value.charCodeAt(0); 
        if ((gardenTristate == tristateTick) && (feature.properties.Garden == "No")) {
            addPubToSelection = false;
        }
        if ((gardenTristate == tristateCross) && (feature.properties.Garden == "Yes")) {
            addPubToSelection = false;
        }             
        
        // Dog friendly condition
        var dogTristate = document.getElementById("dogTristate").value.charCodeAt(0);
        if ((dogTristate == tristateTick) && (feature.properties.DogFriendly == "No")) {
            addPubToSelection = false;
        }
        if ((dogTristate == tristateCross) && (feature.properties.DogFriendly == "Yes")) {
            addPubToSelection = false;
        }
                

        // Add to array if meets conditions
        if (addPubToSelection == true) {
            distToPub = calcDistToPub(feature.properties.CloseCanal,layer);
            pubDetailsToAdd = {PubName: feature.properties.PubName,
                PubAddress: feature.properties.PubAddress,
                Postcode: feature.properties.Postcode,
                Food: feature.properties.Food,
                RealAle: feature.properties.RealAle,
                Garden: feature.properties.Garden,
                DogFriendly: feature.properties.DogFriendly,
                Distance: distToPub};
            pubFilteredResults.push(pubDetailsToAdd);
            // If pub selected change style to allow for easier identification
            layer.setStyle(selectedPubMarker);
        }
}


function processPubsJSON(data) {
        L.geoJSON(data, {        
            pointToLayer: function (feature, latlng) {return L.circleMarker(latlng, pubStyle);},
            onEachFeature: processEachPub
        }).addTo(canalGroup);

        // make Pub Results Table
        pubResultsTableHTML = "<table>";
 
        // Sort array by distance
        pubFilteredResults.sort(function (a, b) {
            return a.Distance - b.Distance;
        });
 
        if (pubFilteredResults.length != 0) {
            for (i = 0; i< pubFilteredResults.length; i++) {
                pubResultsTableHTML += "<tr> <td>" + pubFilteredResults[i].PubName + "<br>" + pubFilteredResults[i].PubAddress + 
                    "<br>" + pubFilteredResults[i].Postcode;
                if (pubFilteredResults[i].Distance == -1) { 
                    pubResultsTableHTML += "<br> Distance: <i>Select starting location on map</i>";
                } else {
                    pubResultsTableHTML += "<br> Distance: "+ pubFilteredResults[i].Distance + " km";
                }
                pubResultsTableHTML += "<br> Food: " + pubFilteredResults[i].Food + "&nbsp &nbsp &nbsp &nbsp Real Ale: " + 
                    pubFilteredResults[i].RealAle + "<br> Garden: " + pubFilteredResults[i].Garden + "&nbsp &nbsp &nbsp &nbsp Dog Friendly: " + 
                    pubFilteredResults[i].DogFriendly + "</td> </tr>";
            };
        } else { 
            pubResultsTableHTML += "<tr><td>" + "No results" + "</td></tr>";
        };
        pubResultsTableHTML += "</table>";
        document.getElementById("resultsTable").innerHTML = pubResultsTableHTML;           
}

// Function addCanal
// Adds sorted canal names to dropdown select box
function addCanalSelection() {
        // Get select element
        var selectObj = document.getElementById("search");
        $.getJSON('GeoJSON/canalData.json',
            function(data) {
                // Create sorted array of canal names
                var canalNames = [];
                for (i = 0; i < data.features.length; i++) {
                    // Get new name to add to array
                    canalNameToAdd = data.features[i].properties.name.slice(0,-6);
                    // Check if same name already exists in array
                    if (canalNames.indexOf(canalNameToAdd) == -1) {
                        // Name does not already exist, add this
                        canalNames.push(canalNameToAdd);
                    }
                }
                canalNames.sort();
                // Create 'welcome option'
                var option = document.createElement("option");
                option.text = "Select Canal";
                selectObj.add(option);
                // Add canal options
                for (i = 0; i < canalNames.length; i++) {
                    option = document.createElement("Option"); 
                    option.text = canalNames[i];
                    selectObj.add(option);
                }
            }
    );
}


//Draw the map
function draw() {
        // Clear previous layers
        if (map.hasLayer(canalGroup)) {
            canalGroup.clearLayers();
        }
        if (map.hasLayer(pubGroup)) {
            pubGroup.clearLayers();
        }    
        canalSelectedGroup.clearLayers();

        // Clear previous results table
        pubFilteredResults = [];
        // If mapclick is not canal in dropdown then dropdown has changed: deselect mapclick
        if (selectedCanalSection != null) {
            if (selectedCanalSection.slice(0,-6) !== document.getElementById("search").value) {
                selectedCanalSection = null;
                if (boatPositionMarker != undefined) {
                    boatPositionMarker.clearLayers();
                }
            }
        }
        
        //Draw canals
        $.getJSON('GeoJSON/canalData.json',
            function(data) {
            processCanalsJSON(data);
            }
        );
        canalGroup.addTo(map);

        // Add pubs to map
        $.getJSON('GeoJSON/Pub_Database.json',
            function(data) {
              processPubsJSON(data)
            }
        );
        pubGroup.addTo(map);

};

// Add canals to select element on page load
addCanalSelection();

// Draw map on page load
draw();

function locateNearestCanal(clickPosition) {
        var clickPositionTurfPoint = turf.point([clickPosition.latlng.lng, clickPosition.latlng.lat]);
        var distanceToClosestCanal = -1;
        var closestCanalName;
   
        canalGeoJSON.eachLayer(function (eachCanal) {
            if (eachCanal.feature.geometry.type == "LineString") {
                // Convert current canal to turf GeoJSON
                var canalTurf = eachCanal.feature;
                // Calculate distance from point to current canal
                var closestPointOnCanal = turf.nearestPointOnLine(canalTurf, clickPositionTurfPoint, {units: "kilometers"});
                // If current canal is undefined
                if (distanceToClosestCanal == -1) {
                    // Store current canal details as closest canal
                    boatPositionGeoJSON = closestPointOnCanal;
                    distanceToClosestCanal = closestPointOnCanal.properties.dist;
                    closestCanalName = eachCanal.feature.properties.name;
                    boatDistanceFromSectionStart = closestPointOnCanal.properties.location;      
                    boatDistanceFromSectionEnd = turf.length(canalTurf, {units: 'kilometers'}) - boatDistanceFromSectionStart;
                } else {
                    // If current canal is closer than stored canal
                    if (closestPointOnCanal.properties.dist < distanceToClosestCanal) {
                        // Store current canal details as closest canal
                        boatPositionGeoJSON = closestPointOnCanal;
                        distanceToClosestCanal = closestPointOnCanal.properties.dist;
                        closestCanalName = eachCanal.feature.properties.name;
                        boatDistanceFromSectionStart = closestPointOnCanal.properties.location;
                        boatDistanceFromSectionEnd = turf.length(canalTurf, {units: 'kilometers'}) - boatDistanceFromSectionStart;
                    }
                }
            }
        })
        selectedCanalSection = closestCanalName;
        // Clear boat position to avoid cluttering up map
        if (boatPositionMarker != undefined) {
            boatPositionMarker.clearLayers();
        }
        boatPositionMarker = L.geoJSON(boatPositionGeoJSON).addTo(map);
        // Set dropdown box to current canal 
        document.getElementById("search").value = closestCanalName.slice(0,-6);
        // Redraw map with new selections
        draw();
}

map.on('click', locateNearestCanal);
