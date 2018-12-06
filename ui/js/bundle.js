(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
function toLatLng(places) {
    if (places.length > 0) {
        var place = places[0];
        if (place.geometry) {
            return place.geometry.location;
        }
    }
    // CR atian: log error
    return null;
}

module.exports = {
    toLatLng: toLatLng
}

},{}],2:[function(require,module,exports){
const MAP_DIV = 'map';
const MAP_OPTIONS = {
    // Nyc fidi
    center: {lat: 40.7218, lng: -73.9998},
    zoom: 14,
    disableDefaultUI: true
};

const FROM_SEARCH_BOX = 'from-searchbox';
const TO_SEARCH_BOX = 'to-searchbox';

const MAX_ROUTES = 3;
function ROUTE_NAME_DIV(i) {
    return "#route-" + (i+1) + "-name";
}
function ROUTE_CONTAINER_DIV(i) {
    return "#route-" + (i+1) + "-container";
}
function ROUTE_DURATION_DIV(i) {
    return "#route-" + (i+1) + "-duration";
}
function ROUTE_DISTANCE_DIV(i) {
    return "#route-" + (i+1) + "-distance";
}

const MAX_OMWS = 1;
function OMW_CONTAINER(i) {
    return "#omw-container-" + (i+1);
}
function OMW_DIV(i) {
    return "#gas-" + (i+1);
}
function BUTTON_DIV(i) {
    return "#button-" + (i+1);
}

var Omw = {
    "GAS":1
};

module.exports = {
    MAP_DIV: MAP_DIV,
    MAP_OPTIONS: MAP_OPTIONS,
    FROM_SEARCH_BOX: FROM_SEARCH_BOX,
    TO_SEARCH_BOX: TO_SEARCH_BOX,
    MAX_ROUTES: MAX_ROUTES,
    ROUTE_NAME_DIV: ROUTE_NAME_DIV,
    ROUTE_CONTAINER_DIV: ROUTE_CONTAINER_DIV,
    ROUTE_DURATION_DIV: ROUTE_DURATION_DIV,
    ROUTE_DISTANCE_DIV: ROUTE_DISTANCE_DIV,
    MAX_OMWS: MAX_OMWS,
    OMW_CONTAINER: OMW_CONTAINER,
    OMW_DIV: OMW_DIV,
    BUTTON_DIV: BUTTON_DIV,
    Omw: Omw
};

},{}],3:[function(require,module,exports){
var Common = require('./common.js');
var Constants = require('./constants.js');
var UnitCalculator = require('./unit_calculator.js');
var Model = require('./model.js');

class Controller {
    _pointOnPath(milesIn) {
        var milesSoFar = 0;
        var prevLocation;
        var path = this.model.path;
        if (path.length > 0) {
            for (var location of path) {
                if (prevLocation && prevLocation != location) {
                    var distance = UnitCalculator.milesBetween(prevLocation, location);
                    if (milesSoFar + distance > milesIn) {
                        return prevLocation;
                    }
                    milesSoFar += distance;
                }
                prevLocation = location;
            };
            // CR atian: log error if milesIn is greater than total distance
            return prevLocation;
        } else {
            return null;
        }
    }

    _render() {
        this.directionsRenderer.setDirections(this.model.selections);
        this.directionsRenderer.setRouteIndex(this.model.selected);
    }

    _unrender() {
        this.directionsRenderer.setRouteIndex(-1);
    }

    _findPlace(omw, callback) {
        var query;
        switch(omw.type) {
        case Constants.Omw.GAS:
            query='gas';
            break;
        default:
            return;
            // CR atian: log error
        }
        var near = this._pointOnPath(omw.milesIn);
        var request =
                { locationBias: near,
                  query: query,
                  fields: [ 'name', 'geometry' ]
                };
        this.placesService.findPlaceFromQuery(request, (results, status) => {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                callback(results);
            } else {
                console.log('controller: status not ok');
                // CR atian: log error
            }
        });
    }

    _route() {
        var waypoints = [];
        this._unrender();
        this.model.selected = null;
        for (var i = 0; i < this.model.omw.length; i++) {
            if (this.model.omw[i]) {
                waypoints.push({
                    location: this.model.omw[i].cachedLocation,
                    stopover: true
                });
            }
        }
        var request = {
            origin: this.model.from,
            destination: this.model.to,
            waypoints: waypoints,
            travelMode: google.maps.TravelMode.DRIVING,
            provideRouteAlternatives: true,
            optimizeWaypoints: true
        };
        this.directionsService.route(request, (results, status) => {
            if (status == google.maps.DirectionsStatus.OK) {
                this.model.selections = results;
            } else {
                console.log('controller: status is: ' + status);
                // CR atian: log error
            }
        });
    }

    _routeIfCachedOmwLocations() {
        if (this.model.omw.every((omw) => (!omw) || (omw.cachedLocation != null))) {
            this._route();
            return true;
        }
        return false;
    }

    _routeIfEndpointsExist() {
        if (this.model.from && this.model.to) {
            if (!this._routeIfCachedOmwLocations()) {
                // User asked for omw before selecting a route. Let's just
                // auto-select the first route for them.
                if (this.model.selected == null) {
                    this.model.selected = 0;
                }
                for (var i = 0; i < this.model.omw.length; i++) {
                    const this_i = i;
                    var omw = this.model.omw[this_i];
                    if (omw && omw.cachedLocation == null) {
                        this._findPlace(this.model.omw[i], (results) => {
                            var location = Common.toLatLng(results);
                            this.model.addOmwLocation(this_i, location);
                            this._routeIfCachedOmwLocations();
                        });
                    }
                }
            }
        }
    }

    _initRouteListeners() {
        var containerDiv;
        for (var i = 0; i < Constants.MAX_ROUTES; i++) {
            const this_i = i;
            containerDiv = Constants.ROUTE_CONTAINER_DIV(i);
            $(containerDiv).click(() => {
                this.model.selected = this_i;
                this._render();
            });
        }
    }

    _initSearchBoxListeners() {
        var fromSearchBox = new google.maps.places.SearchBox(document.getElementById(Constants.FROM_SEARCH_BOX));
        var toSearchBox = new google.maps.places.SearchBox(document.getElementById(Constants.TO_SEARCH_BOX));

        fromSearchBox.addListener('places_changed', () => {
            this.model.from = fromSearchBox.getPlaces();
            this._routeIfEndpointsExist();
        });

        toSearchBox.addListener('places_changed', () => {
            this.model.to = toSearchBox.getPlaces();
            this._routeIfEndpointsExist();
        });
    }

    _initOmwListeners() {
        for (var i = 0; i < Constants.MAX_OMWS; i++) {
            const this_i = i;
            var omwDiv = Constants.OMW_DIV(i);
            $(omwDiv).keypress((event) => {
                var keycode = (event.keyCode ? event.keyCode : event.which);
                if(keycode == '13') { // We hit Enter
                    var milesIn = event.target.value;
                    this.model.setOmw(this_i, Constants.Omw.GAS, milesIn);
                    this._routeIfEndpointsExist();
                }
            });
            var buttonDiv = Constants.BUTTON_DIV(i);
            $(buttonDiv).click(() => {
                var nextDiv = Constants.OMW_CONTAINER(this_i+1);
                $(nextDiv).show();
            });
        }
    }

    constructor() {
        this.map = new google.maps.Map(document.getElementById(Constants.MAP_DIV), Constants.MAP_OPTIONS);
        this.placesService = new google.maps.places.PlacesService(this.map);
        this.directionsService = new google.maps.DirectionsService();
        this.directionsRenderer = new google.maps.DirectionsRenderer();
        this.directionsRenderer.setMap(this.map);
        this.model = new Model();

        this._initRouteListeners();
        this._initSearchBoxListeners();
        this._initOmwListeners();
    }
}

module.exports = Controller;

},{"./common.js":1,"./constants.js":2,"./model.js":5,"./unit_calculator.js":6}],4:[function(require,module,exports){
var Controller = require('./controller.js');

window.init = function() {
    var controller = new Controller();
};

},{"./controller.js":3}],5:[function(require,module,exports){
var Common = require('./common.js');
var Constants = require('./constants.js');
var View = require('./view.js');

class Model {
    set from (places) {
        this._from = Common.toLatLng(places);
    }
    set to (places) {
        this._to = Common.toLatLng(places);
    }
    get from () {
        return this._from;
    }
    get to () {
        return this._to;
    }

    set selections (result) {
        this._selections = result;
        this.view.showSelections(result);
    }
    get selections () {
        return this._selections;
    }

    get path () {
        if (this._selections && this.selected != null) {
            return this._selections.routes[this.selected].overview_path;
        } else {
            return [];
        }
    }

    setOmw(index, type, milesIn) {
        var omw = {
            type: type,
            milesIn: milesIn,
            cachedLocation: null
        };
        this.omw[index] = omw;
    }

    addOmwLocation(index, location) {
        if (index < this.omw.length) {
            var omw = this.omw[index];
            omw.cachedLocation = location;
        } else {
            // CR atian: log dev error
            console.log('cached omw location out of bounds');
        }
    }

    constructor() {
        this.omw = [];
        this.view = new View();
    }
}

module.exports = Model;

},{"./common.js":1,"./constants.js":2,"./view.js":7}],6:[function(require,module,exports){
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

function distanceString(meters) {
    var miles = METERS_TO_MILES * meters;
    if (miles < 10) {
        return (miles).toFixed(1) + ' mi';
    } else {
        return Math.round(miles) + ' mi';
    }
}

function toText(value, unit) {
    var valueRounded = Math.round(value);
    if (valueRounded == 0) {
        return "";
    } else {
        return valueRounded + ' ' + unit;
    }
}

const MINUTES_MULT = 60;
const HOURS_MULT = MINUTES_MULT * 60;
const DAYS_MULT = HOURS_MULT * 24;

function durationString(seconds) {
    var minutes, hours, days;
    if (seconds < MINUTES_MULT) {
        return toText(1, 'min');
    } else if (seconds < HOURS_MULT) {
        minutes = seconds/MINUTES_MULT;
        return toText(minutes, 'min');
    } else if (seconds < DAYS_MULT) {
        hours = seconds/HOURS_MULT;
        minutes = (seconds % HOURS_MULT) / MINUTES_MULT;
        return toText(hours, 'h')
            +  ' '
            +  toText(minutes, 'min');
    } else {
        days = seconds/DAYS_MULT;
        hours = (seconds % DAYS_MULT) / HOURS_MULT;
        minutes = (seconds % HOURS_MULT) / MINUTES_MULT;
        return toText(days, 'd')
            +  ' '
            +  toText(hours, 'h')
            +  ' '
            +  toText(minutes, 'min');
    }
}

module.exports = {
    milesBetween: milesBetween,
    distanceString: distanceString,
    durationString: durationString
};

},{}],7:[function(require,module,exports){
var Constants = require('./constants.js');
var UnitCalculator = require('./unit_calculator.js');

class View {
    showSelections(selections) {
        var containerDiv, nameDiv, durationDiv, distanceDiv;
        var route, name, duration, distance, durationSecs, distanceMeters;
        var routes = selections.routes;
        for (var i = 0; i < Constants.MAX_ROUTES; i++) {
            if (routes.length > i) {
                route = routes[i];

                containerDiv = Constants.ROUTE_CONTAINER_DIV(i);
                nameDiv = Constants.ROUTE_NAME_DIV(i);
                durationDiv = Constants.ROUTE_DURATION_DIV(i);
                distanceDiv = Constants.ROUTE_DISTANCE_DIV(i);

                if (i == 0) {
                    name = "Suggested route";
                } else {
                    name = "Alternative route";
                }

                distanceMeters = 0;
                durationSecs = 0;
                var legs = route.legs;
                for(var j = 0; j < legs.length; j++) {
                    var leg = legs[j];
                    if (leg.distance) { distanceMeters += leg.distance.value; }
                    if (leg.duration) { durationSecs += leg.duration.value; }
                }

                distance = UnitCalculator.distanceString(distanceMeters);
                duration = UnitCalculator.durationString(durationSecs);

                $(nameDiv).html(name);
                $(durationDiv).html(duration);
                $(distanceDiv).html(distance);
                $(containerDiv).show();
            } else {
                containerDiv = Constants.ROUTE_CONTAINER_DIV(i);
                $(containerDiv).hide();
            }
        }
    }

    constructor() {}
}

module.exports = View;

},{"./constants.js":2,"./unit_calculator.js":6}]},{},[4]);
