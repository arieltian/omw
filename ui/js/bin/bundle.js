(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var Controller = require('../lib/controller.js');

window.init = function() {
    var controller = new Controller();
};

},{"../lib/controller.js":3}],2:[function(require,module,exports){
// Distance
const EARTH_RADIUS_METERS = 6371000;
const METERS_TO_MILES = 0.00062137;

// Time
const SECS_IN_MIN = 60;
const SECS_IN_HOUR = SECS_IN_MIN * 60;
const SECS_IN_DAY = SECS_IN_HOUR * 24;

// Div elements
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

const MAX_OMWS = 3;
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
    GAS: "gas_station"
};

module.exports = {
    EARTH_RADIUS_METERS: EARTH_RADIUS_METERS,
    METERS_TO_MILES: METERS_TO_MILES,
    SECS_IN_MIN: SECS_IN_MIN,
    SECS_IN_HOUR: SECS_IN_HOUR,
    SECS_IN_DAY: SECS_IN_DAY,
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
var Constants = require('./constants.js');
var Model = require('./model.js');
var Omw = require('./omw.js');
var GoogleApi = require('./google_api.js');

function Controller() {
    let model = new Model();
    let googleApi = new GoogleApi();
    let omw = new Omw(model, googleApi);

    function initRouteListeners() {
        var containerDiv;
        for (var i = 0; i < Constants.MAX_ROUTES; i++) {
            const this_i = i;
            containerDiv = Constants.ROUTE_CONTAINER_DIV(i);
            $(containerDiv).click(() => {
                model.selected = this_i;
                googleApi.render(model.toRender, model.toRenderIndex);
            });
        }
    }

    function route() {
        googleApi.unrender();
        model.selected = null;
        var promises = model.orderedWaypoints.map(waypoints => {
            waypoints = waypoints.map(cachedPlace => {
                return {
                    location: cachedPlace.location,
                    stopover: true
                };
            });
            var request = {
                origin: model.from,
                destination: model.to,
                waypoints: waypoints,
                travelMode: googleApi.MODE_DRIVING,
                provideRouteAlternatives: true,
                optimizeWaypoints: true
            };
            return googleApi.directions(request);
        });

        Promise.all(promises).then(selections => {
            model.selections = selections;
        });
    }

    function routeIfEndpointsExist() {
        if (model.from && model.to) {
            // User asked for omw before selecting a route. Let's just
            // auto-select the first route for them.
            if (model.selected == null) {
                model.selected = 0;
            }
            omw.addCachedPlaces().then(() => {
                route();
            });
        }
    }

    function initSearchBoxListeners() {
        googleApi.onFromChanged((from) => {
            model.from = from;
            routeIfEndpointsExist();
        });

        googleApi.onToChanged((to) => {
            model.to = to;
            routeIfEndpointsExist();
        });
    }

    function initOmwListeners() {
        for (var i = 0; i < Constants.MAX_OMWS; i++) {
            const this_i = i;
            var omwDiv = Constants.OMW_DIV(i);
            $(omwDiv).keypress((event) => {
                var keycode = (event.keyCode ? event.keyCode : event.which);
                if(keycode == '13') { // We hit Enter
                    var milesIn = event.target.value;
                    var type = Constants.Omw.GAS;
                    model.setOmw(this_i, type, milesIn);
                    routeIfEndpointsExist();
                }
            });
            var buttonDiv = Constants.BUTTON_DIV(i);
            $(buttonDiv).click(() => {
                var nextDiv = Constants.OMW_CONTAINER(this_i+1);
                $(nextDiv).show();
            });
        }
    }

    initRouteListeners();
    initSearchBoxListeners();
    initOmwListeners();
}

module.exports = Controller;

},{"./constants.js":2,"./google_api.js":4,"./model.js":5,"./omw.js":6}],4:[function(require,module,exports){
var Constants = require('./constants.js');

function Google () {
    let map = new google.maps.Map(document.getElementById(Constants.MAP_DIV), Constants.MAP_OPTIONS);
    let directionsService = new google.maps.DirectionsService();
    let directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);
    let placesService = new google.maps.places.PlacesService(map);
    let fromSearchBox = new google.maps.places.SearchBox(document.getElementById(Constants.FROM_SEARCH_BOX));
    let toSearchBox = new google.maps.places.SearchBox(document.getElementById(Constants.TO_SEARCH_BOX));

    function withStatus(deferred, results, status) {
        if (status == google.maps.DirectionsStatus.OK) {
            deferred.resolve(results);
        } else {
            // CR atian: log error
            console.log('error status: ' + status);
            deferred.reject('ERROR: status from google ' + status);
        }
    }

    function directions(request) {
        var deferred = $.Deferred();
        directionsService.route(request, (results, status) => {
            withStatus(deferred, results, status);
        });
        return deferred.promise();
    }


    function placesNearby(request) {
        var deferred = $.Deferred();
        placesService.nearbySearch(request, (results, status, _pagination) => {
            withStatus(deferred, results, status);
        });
        return deferred.promise();
    }

    function render(directions, index) {
        directionsRenderer.setDirections(directions);
        directionsRenderer.setRouteIndex(index);
    }

    function unrender() {
        directionsRenderer.setRouteIndex(-1);
    }

    function onFromChanged(callback) {
        fromSearchBox.addListener('places_changed', () => {
            callback(fromSearchBox.getPlaces());
        });
    }

    function onToChanged(callback) {
        toSearchBox.addListener('places_changed', () => {
            callback(toSearchBox.getPlaces());
        });
    }

    const MODE_DRIVING = google.maps.TravelMode.DRIVING;

    return Object.freeze({
        directions,
        placesNearby,
        render,
        unrender,
        onFromChanged,
        onToChanged,
        MODE_DRIVING
    });
}

module.exports = Google;

},{"./constants.js":2}],5:[function(require,module,exports){
var Constants = require('./constants.js');
var View = require('./view.js');

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

function toName(places) {
    if (places.length > 0) {
        var place = places[0];
        return place.name;
    }
    // CR atian: log error
    return null;
}

function cartesian(arrs) {
    var r = [], max = arrs.length-1;
    function f(arr, i) {
        for (var j=0, l=arrs[i].length; j<l; j++) {
            var a = arr.slice(0); // clone arr
            a.push(arrs[i][j]);
            if (i==max)
                r.push(a);
            else
                f(a, i+1);
        }
    }
    f([], 0);
    return r;
}

class Model {
    constructor () {
        /*
         Private fields:
         */
        this.view = new View();
        this._from = null;
        this._to = null;
        this.omw = [];
        this.orderedWaypoints = [[]];
        this._selections = [];
        this._selected = null;
        this.toRender = [];
        this.toRenderIndex = null;
    }

    set from (places) {
        this._from = toLatLng(places);
    }
    get from () {
        return this._from;
    }
    set to (places) {
        this._to = toLatLng(places);
    }
    get to () {
        return this._to;
    }
    set selections (result) {
        this._selections = result;
        var routes;
        if (this.omw.length == 0) {
            routes = this._selections[0].routes;
        } else {
            routes = this._selections.map(selection => selection.routes[0]);
        }
        this.view.showSelections(routes);
    }
    get selections () {
        return this._selections;
    }
    set selected (i) {
        this._selected = i;
        if (i == null) {
            return;
        }
        if (this.omw.length == 0) {
            this.toRender = this._selections[0];
            this.toRenderIndex = i;
        } else {
            this.toRender = this._selections[i];
            this.toRenderIndex = 0;
        }
    }
    get selected() {
        return this._selected;
    }

    path() {
        if (this.toRender &&
            this.toRenderIndex != null &&
            this.toRender.routes[this.toRenderIndex]) {
            return this.toRender.routes[this.toRenderIndex].overview_path;
        } else {
            return [];
        }
    }

    setOmw (index, type, milesIn) {
        this.omw[index] = {
            type: type,
            milesIn: milesIn,
            cachedPlaces: []
        };
    }

    recalculatePotentialWaypoints() {
        var cachedPlaces = this.omw.map(omw => omw.cachedPlaces);
        this.orderedWaypoints = cartesian(cachedPlaces);
        this.orderedWaypoints.sort((w1, w2) => {
            var w1_score = w1.reduce((acc, place) => acc + place.score);
            var w2_score = w2.reduce((acc, place) => acc + place.score);
            return w1_score - w2_score;
        });
        this.orderedWaypoints.splice(Constants.MAX_ROUTES);
    }

    addOmwInfo(index, places) {
        if (index < this.omw.length) {
            var omw = this.omw[index];
            omw.cachedPlaces = places;
            this.recalculatePotentialWaypoints();
        } else {
            // CR atian: log dev error
            console.log('cached omw location out of bounds');
        }
    }
}

module.exports = Model;

},{"./constants.js":2,"./view.js":7}],6:[function(require,module,exports){
var Constants = require('./constants.js');
var Model = require('./model.js');
var GoogleApi = require('./google_api.js');

class DistanceCalculator {
    static radians(degrees) {
        return degrees * (Math.PI / 180);
    }

    static milesBetween(p1, p2) {
        var p1_lat = p1.lat();
        var p1_lng = p1.lng();
        var p2_lat = p2.lat();
        var p2_lng = p2.lng();

        var lat1 = DistanceCalculator.radians(p1_lat);
        var lat2 = DistanceCalculator.radians(p2_lat);
        var delta_lat = DistanceCalculator.radians(p2_lat - p1_lat);
        var delta_lng = DistanceCalculator.radians(p2_lng - p1_lng);

        var lat_partial = Math.sin(delta_lat/2);
        var lng_partial = Math.sin(delta_lng/2);
        var a = lat_partial * lat_partial +
                Math.cos(lat1) * Math.cos(lat2) *
                lng_partial * lng_partial;
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return (Constants.EARTH_RADIUS_METERS * c) * Constants.METERS_TO_MILES;
    }
}

function Omw(model, googleApi) {
    function pointOnPath(milesIn) {
        var milesSoFar = 0;
        var prevLocation;
        for (var location of model.path()) {
            if (prevLocation && prevLocation != location) {
                var distance = DistanceCalculator.milesBetween(prevLocation, location);
                if (milesSoFar + distance > milesIn) {
                    return prevLocation;
                }
                milesSoFar += distance;
            }
            prevLocation = location;
        };
        // ERROR: milesIn is greater than total distance
        return prevLocation;
    }

    /**
     Score places returned for a single omw. If driving distance from origin is
     greater than milesIn, disqualify place. Score by absolute distance from
     path.
     */
    function scorePlaces(milesIn, places) {
        var deferred = $.Deferred();
        // Take the first 5 options to limit the number of google api calls
        // CR atian: don't hardcode this length
        places.splice(5);
        if (model.from == null) {
            return Promise.resolve([]);
        }
        var promises = places.map((place) => {
            if (place.geometry && place.geometry.location) {
                var name = place.name;
                var location = place.geometry.location;
                var request = {
                    origin: model.from,
                    destination: location,
                    travelMode: google.maps.TravelMode.DRIVING,
                    provideRouteAlternatives: false
                };
                return googleApi.directions(request).then((directions) => {
                    if (directions.routes != null &&
                        directions.routes[0].legs != null &&
                        directions.routes[0].legs[0] != null &&
                        directions.routes[0].legs[0].distance != null &&
                        directions.routes[0].legs[0].distance.value != null) {
                        var score = directions.routes[0].legs[0].distance.value * Constants.METERS_TO_MILES;
                        var placeResult =
                                { location : location,
                                  name : name,
                                  score : score
                                };
                        return Promise.resolve(placeResult);
                    } else {
                        return Promise.reject('ERROR: directions missing some fields');
                    }
                });
            } else {
                return Promise.reject('ERROR: geometry is null');
            }
        });

        Promise.all(promises).then(places => {
            places = places.filter(place => place.score <= milesIn);
            deferred.resolve(places);
        });

        return deferred.promise();
    }

    function addOneCachedPlace(omw) {
        var type;
        var deferred = $.Deferred();
        var near = pointOnPath(omw.milesIn);
        var request =
                { location: near,
                  rankBy: google.maps.places.RankBy.DISTANCE,
                  type: omw.type,
                  fields: [ 'name', 'geometry' ]
                };
        googleApi.placesNearby(request).then((places) => {
            return scorePlaces(omw.milesIn, places);
        }).then((places) => {
            deferred.resolve(places);
        });

        return deferred.promise();
    }

    function addCachedPlaces() {
        var deferred = $.Deferred();
        var promises = model.omw.map((omw, i) => {
            if (omw.cachedLocation == null) {
                var promise = addOneCachedPlace(omw).then(places => {
                    model.addOmwInfo(i, places);
                });
                return promise;
            } else {
                return Promise.resolve();
            }
        });

        Promise.all(promises).then(() => {
            deferred.resolve();
        });

        return deferred;
    }

    return Object.freeze({
        addCachedPlaces
    });
}

module.exports = Omw;

},{"./constants.js":2,"./google_api.js":4,"./model.js":5}],7:[function(require,module,exports){
var Constants = require('./constants.js');

class Units {
    static distanceString(meters) {
        var miles = Constants.METERS_TO_MILES * meters;
        if (miles < 10) {
            return (miles).toFixed(1) + ' mi';
        } else {
            return Math.round(miles) + ' mi';
        }
    }

    static toText(value, unit) {
        var valueRounded = Math.round(value);
        if (valueRounded == 0) {
            return "";
        } else {
            return valueRounded + ' ' + unit;
        }
    }

    static durationString(seconds) {
        var minutes, hours, days;
        if (seconds < Constants.SECS_IN_MIN) {
            return Units.toText(1, 'min');
        } else if (seconds < Constants.SECS_IN_HOUR) {
            minutes = seconds/Constants.SECS_IN_MIN;
            return Units.toText(minutes, 'min');
        } else if (seconds < Constants.SECS_IN_DAY) {
            hours = seconds/Constants.SECS_IN_HOUR;
            minutes = (seconds % Constants.SECS_IN_HOUR) / Constants.SECS_IN_MIN;
            return Units.toText(hours, 'h')
                +  ' '
                +  Units.toText(minutes, 'min');
        } else {
            days = seconds/Constants.SECS_IN_DAY;
            hours = (seconds % Constants.SECS_IN_DAY) / Constants.SECS_IN_HOUR;
            minutes = (seconds % Constants.SECS_IN_HOUR) / Constants.SECS_IN_MIN;
            return Units.toText(days, 'd')
                +  ' '
                +  Units.toText(hours, 'h')
                +  ' '
                +  Units.toText(minutes, 'min');
        }
    }
}

class View {
    showSelections(routes) {
        var containerDiv, nameDiv, durationDiv, distanceDiv;
        var route, name, duration, distance, durationSecs, distanceMeters;
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

                distance = Units.distanceString(distanceMeters);
                duration = Units.durationString(durationSecs);

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

},{"./constants.js":2}]},{},[1]);
