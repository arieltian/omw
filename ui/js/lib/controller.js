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
