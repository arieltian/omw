var Constants = require('./constants.js');
var Model = require('./model.js');
var Omw = require('./omw.js');
var GoogleApi = require('./google_api.js');

function Controller() {
    let model = new Model();
    let map = new google.maps.Map(document.getElementById(Constants.MAP_DIV), Constants.MAP_OPTIONS);
    let googleApi = new GoogleApi(map);
    let omw = new Omw(model, googleApi);

    function initRouteListeners() {
        var containerDiv;
        for (var i = 0; i < Constants.MAX_ROUTES; i++) {
            const this_i = i;
            containerDiv = Constants.ROUTE_CONTAINER_DIV(i);
            $(containerDiv).click(() => {
                model.selected = this_i;
                googleApi.render(model.selections, model.selected);
            });
        }
    }

    function route() {
        googleApi.unrender();
        model.selected = null;
        var waypoints = model.omw.map((omw) => {
            return {
                location: omw.cachedLocation,
                stopover: true
            };
        });
        var request = {
            origin: model.from,
            destination: model.to,
            waypoints: waypoints,
            travelMode: google.maps.TravelMode.DRIVING,
            provideRouteAlternatives: true,
            optimizeWaypoints: true
        };
        var promise = googleApi.directions(request);
        promise.then((results) => {
            model.selections = results;
        });
    }

    function routeIfEndpointsExist() {
        if (model.from && model.to) {
            // User asked for omw before selecting a route. Let's just
            // auto-select the first route for them.
            if (model.selected == null) {
                model.selected = 0;
            }
            omw.addCachedLocations().then(() => {
                route();
            });
        }
    }

    function initSearchBoxListeners() {
        var fromSearchBox = new google.maps.places.SearchBox(document.getElementById(Constants.FROM_SEARCH_BOX));
        var toSearchBox = new google.maps.places.SearchBox(document.getElementById(Constants.TO_SEARCH_BOX));

        fromSearchBox.addListener('places_changed', () => {
            model.from = fromSearchBox.getPlaces();
            routeIfEndpointsExist();
        });

        toSearchBox.addListener('places_changed', () => {
            model.to = toSearchBox.getPlaces();
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
                    model.setOmw(this_i, Constants.Omw.GAS, milesIn);
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
