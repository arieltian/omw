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
            var div = Constants.OMW_DIV(i);
            $(div).keypress((event) => {
                var keycode = (event.keyCode ? event.keyCode : event.which);
                if(keycode == '13') { // We hit Enter
                    var milesIn = event.target.value;
                    this.model.setOmw(this_i, Constants.Omw.GAS, milesIn);
                    this._routeIfEndpointsExist();
                }
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
