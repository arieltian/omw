var Constants = require('./constants.js');
var DistanceCalculator = require('./distance_calculator.js');
var Model = require('./model.js');

class Controller {
    renderDirections(selections, selected) {
        this.directionsRenderer.setDirections(selections);
        this.directionsRenderer.setRouteIndex(selected);
    }

    _pointOnPath(milesIn) {
        var milesSoFar = 0;
        var prevLocation,
            path;
        var selected = this.model.selected;
        if (selected != null) {
            path = this.model.selections.routes[selected].overview_path;
        } else {
            // CR atian: handle this case
            return null;
        }
        for (var location of path) {
            if (prevLocation && prevLocation != location) {
                var distance = DistanceCalculator.milesBetween(prevLocation, location);
                if (milesSoFar + distance > milesIn) {
                    return prevLocation;
                }
                milesSoFar += distance;
            }
            prevLocation = location;
        };
        // CR atian: log error if milesIn is greater than total distance
        return prevLocation;
    }

    _findPlace(omw, milesIn) {
        var query;
        switch(omw) {
        case Constants.Omw.GAS:
            query='gas';
            break;
        default:
            return;
            // CR atian: log error
        }
        var near = this._pointOnPath(milesIn);
        var request =
                { locationBias: near,
                  query: query,
                  fields: [ 'name', 'geometry' ]
                };
        this.placesService.findPlaceFromQuery(request, (results, status) => {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                if (results.length > 0) {
                    // CR atian: maybe do something a little smarter
                    var result = results[0];
                    if (result.geometry) {
                        var omw = result.geometry.location;
                        this.model.addOmw(omw);
                        alert('omw: ' + result.name);
                    } else {
                        // CR atian: log error
                    }
                } else {
                    // CR atian: log error
                }
            } else {
                // CR atian: log error
            }
        });
    }

    _maybeRoute() {
        if (this.model.from && this.model.to && !this.model.selections) {
            var request = {
                origin: this.model.from,
                destination: this.model.to,
                travelMode: google.maps.TravelMode.DRIVING,
                provideRouteAlternatives: true
            };
            this.directionsService.route(request, (results, status) => {
                if (status == google.maps.DirectionsStatus.OK) {
                    this.model.selections = results;
                } else {
                    // CR atian: log error
                }
            });
        }
    }

    _render() {
        this.directionsRenderer.setDirections(this.model.selections);
        this.directionsRenderer.setRouteIndex(this.model.selected);
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
            this._maybeRoute();
        });

        toSearchBox.addListener('places_changed', () => {
            this.model.to = toSearchBox.getPlaces();
            this._maybeRoute();
        });
    }

    _initOmwListeners() {
        for (var i = 0; i < Constants.MAX_OMWS; i++) {
            var div = Constants.OMW_DIV(i);
            $(div).keypress((event) => {
                var keycode = (event.keyCode ? event.keyCode : event.which);
                if(keycode == '13') { // We hit Enter
                    var milesIn = event.target.value;
                    this._findPlace(Constants.Omw.GAS, milesIn);
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
