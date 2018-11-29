(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const MAX_ROUTES = 3;

var DistanceCalculator = require('./distance_calculator.js');

function routeNameDiv(i) {
    return "#route-" + (i+1) + "-name";
}
function routeContainerDiv(i) {
    return "#route-" + (i+1) + "-container";
}
function routeDurationDiv(i) {
    return "#route-" + (i+1) + "-duration";
}
function routeDistanceDiv(i) {
    return "#route-" + (i+1) + "-distance";
}

function showRouteSelections(routes) {
    var containerDiv, nameDiv, durationDiv, distanceDiv;
    var route, name, duration, distance;
    for (var i = 0; i < MAX_ROUTES; i++) {
        if (routes.length > i) {
            route = routes[i];

            containerDiv = routeContainerDiv(i);
            nameDiv = routeNameDiv(i);
            durationDiv = routeDurationDiv(i);
            distanceDiv = routeDistanceDiv(i);

            if (i == 0) {
                name = "Suggested route";
            } else {
                name = "Alternative route";
            }

            // legs must contain exactly one element
            distance = route.legs[0].distance.text;
            duration = route.legs[0].duration.text;

            $(nameDiv).html(name);
            $(durationDiv).html(duration);
            $(distanceDiv).html(distance);
            $(containerDiv).show();
        }
    }
}

class Directions {
    render(i) {
        this.directionsRenderer.setDirections(this.routeResult);
        this.directionsRenderer.setRouteIndex(i);
    };

    initCallbacks() {
        var containerDiv;
        for (var i = 0; i < MAX_ROUTES; i++) {
            const this_i = i;
            containerDiv = routeContainerDiv(i);
            $(containerDiv).click(() => {
                this.render(this_i);
            });
        }
    };

    onRoutesRequest(result) {
        this.routeResult = result;
        var routes = result.routes;
        if (routes.length > 1) {
            showRouteSelections(routes);
        } else { // Only one route
            this.render(0);
        }
    };

    route(from, to) {
        // CR atian: distance still unused
        var distance = DistanceCalculator.milesBetween(from, to);
        var request = {
            origin: from,
            destination: to,
            travelMode: google.maps.TravelMode.DRIVING,
            provideRouteAlternatives: true
        };
        this.directionsService.route(request, (results, status) => {
            if (status == google.maps.DirectionsStatus.OK) {
                this.onRoutesRequest(results);
            }
        });
    }

    getDirections() {
        return this.directionsRenderer.getDirections();
    }

    getRouteIndex() {
        return this.directionsRenderer.getRouteIndex();
    }

    constructor(map) {
        this.map = map;
        this.directionsService = new google.maps.DirectionsService();
        this.directionsRenderer = new google.maps.DirectionsRenderer();
        this.directionsRenderer.setMap(map);
        this.initCallbacks();

        this.routeResult = [];
    }
}

module.exports = Directions;

},{"./distance_calculator.js":2}],2:[function(require,module,exports){
const EARTH_RADIUS_METERS = 6371000;
const METERS_TO_MILES = 0.00062137;

function radians(degrees) {
    return degrees * (Math.PI / 180);
}

function milesBetween(p1, p2) {
    var p1_lat = p1.lat();
    var p1_lng = p1.lng();
    var p2_lat = p2.lat();
    var p2_lng = p2.lng();

    var lat1 = radians(p1_lat);
    var lat2 = radians(p2_lat);
    var delta_lat = radians(p2_lat - p1_lat);
    var delta_lng = radians(p2_lng - p1_lng);

    var lat_partial = Math.sin(delta_lat/2);
    var lng_partial = Math.sin(delta_lng/2);
    var a = lat_partial * lat_partial +
            Math.cos(lat1) * Math.cos(lat2) *
            lng_partial * lng_partial;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (EARTH_RADIUS_METERS * c) * METERS_TO_MILES;
}

module.exports = {
    milesBetween: milesBetween
};

},{}],3:[function(require,module,exports){
var DistanceCalculator = require('./distance_calculator.js');
var Map = require('./map.js');
var Searchbox = require('./searchbox.js');
var Directions = require('./directions.js');
var Omw = require('./omw.js');

window.init = function() {
    var map = Map.init();
    var directions = new Directions(map);
    var searchbox = new Searchbox(directions);
    var omw = new Omw(map, directions);
};

},{"./directions.js":1,"./distance_calculator.js":2,"./map.js":4,"./omw.js":5,"./searchbox.js":6}],4:[function(require,module,exports){
const NYC_FIDI = {lat: 40.7218, lng: -73.9998};
const ZOOM = 14;
const MAP_ID = 'map';

function init() {
    var map = new google.maps.Map(document.getElementById(MAP_ID), {
        center: NYC_FIDI,
        zoom: ZOOM,
        disableDefaultUI: true
    });
    return map;
}

module.exports = {
    init: init
};

},{}],5:[function(require,module,exports){
const MAX_OMWS = 1;

var DistanceCalculator = require('./distance_calculator.js');

function omwInputDiv(i) {
    return "#gas-" + (i+1);
}

function getPointOnPath(path, milesIn) {
    var milesSoFar = 0;
    var prevLocation;
    var distances = [];
    for (var location of path) {
        if (prevLocation && prevLocation != location) {
            var distance = DistanceCalculator.milesBetween(prevLocation, location);
            distances.push(distance);
            if (milesSoFar + distance > milesIn) {
                return prevLocation;
            }
            milesSoFar += distance;
        }
        prevLocation = location;
    };
    alert('miles in ' + milesIn + ' is greater than total distance ' + milesSoFar);
    return prevLocation;
}

class Omw {
    onGasFound(result) {
        if (result.length > 0) {
            alert('gas station name: ' + result[0].name);
        } else {
            alert('none found');
        }
    }

    findGasRequest(near) {
        var locationBias = new google.maps.LatLngBounds();
        var request =
                { locationBias: near,
                  query: 'gas',
                  fields: ['name']
                };
        this.placesService.findPlaceFromQuery(request, (result, status) => {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                this.onGasFound(result);
            } else {
                alert('bad places request status: ' + status);
            }
        });
    }

    findGas(milesIn) {
        var results = this.directions.getDirections();
        if (results) {
            var i = this.directions.getRouteIndex();
            var path = results.routes[i].overview_path;
            var locationBias = getPointOnPath(path, milesIn);
            if (locationBias) {
                this.findGasRequest(locationBias);
            }
        }
    }

    initCallbacks() {
        for (var i = 0; i < MAX_OMWS; i++) {
            var div = omwInputDiv(i);
            $(div).keypress((event) => {
                var keycode = (event.keyCode ? event.keyCode : event.which);
                if(keycode == '13') { // We hit Enter
                    var milesIn = event.target.value;
                    this.findGas(milesIn);
                }
            });
        }
    }

    constructor(map, directions) {
        this.placesService = new google.maps.places.PlacesService(map);
        this.initCallbacks();
        this.directions = directions;
    }
}

module.exports = Omw;

},{"./distance_calculator.js":2}],6:[function(require,module,exports){
const FROM_SEARCH_BOX = 'from-searchbox';
const TO_SEARCH_BOX = 'to-searchbox';

class Searchbox {
    onChanged(searchBox) {
        var places = searchBox.getPlaces();

        if (places.length == 0) {
            return undefined;
        } else if (places.length > 1) {
            console.log("More than one place in query");
        }

        var place = places[0];
        if (!place.geometry) {
            console.log("Place contains no geometry");
            return undefined;
        }

        return place.geometry.location;
    }

    constructor(directions) {
        var fromSearchBox = new google.maps.places.SearchBox(document.getElementById(FROM_SEARCH_BOX));
        var toSearchBox = new google.maps.places.SearchBox(document.getElementById(TO_SEARCH_BOX));

        fromSearchBox.addListener('places_changed', () => {
            this.from = this.onChanged(fromSearchBox);
            if (this.from && this.to) {
                directions.route (this.from, this.to);
            }
        });

        toSearchBox.addListener('places_changed', () => {
            this.to = this.onChanged(toSearchBox);
            if (this.from && this.to) {
                directions.route (this.from, this.to);
            }
        });
    }
}

module.exports = Searchbox;

},{}]},{},[3]);
