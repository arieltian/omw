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
