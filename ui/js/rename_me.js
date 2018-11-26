// Global google maps services
var map;
// CR atian: move this into Searchbox
var from;
var to;

const NYC_FIDI = {lat: 40.7218, lng: -73.9998};
const FROM_SEARCH_BOX = 'from-searchbox';
const TO_SEARCH_BOX = 'to-searchbox';
const MAX_ROUTES = 3;
const EARTH_RADIUS_METERS = 6371000;

class DistanceCalculator {
    // Implements Haversine formula
    static between(p1, p2) {
        var lat1 = Math.radians(p1.lat);
        var lat2 = Math.radians(p2.lat);
        var delta_lat = Math.radians(p2.lat - p1.lat);
        var delta_lng = Math.radians(p2.lng - p1.lng);
        var lat_partial = Math.sin(delta_lat/2);
        var lng_partial = Math.sin(delta_lng/2);
        var a = lat_partial * lat_partial +
                Math.cos(lat1) * Math.cos(lat2) +
                lng_partial + lng_partial;
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return EARTH_RADIUS_METERS * c;
    }
}

class Routes {
    // These indices are zero-indexed
    routeNameDiv(i) {
        return "#route-" + (i+1) + "-name";
    }
    routeContainerDiv(i) {
        return "#route-" + (i+1) + "-container";
    }
    routeDurationDiv(i) {
        return "#route-" + (i+1) + "-duration";
    }
    routeDistanceDiv(i) {
        return "#route-" + (i+1) + "-distance";
    }

    render(i) {
        this.directionsRenderer.setDirections(this.routeResult);
        this.directionsRenderer.setRouteIndex(i);
    }

    showRouteSelections(routes) {
        var containerDiv, nameDiv, durationDiv, distanceDiv;
        var route, name, duration, distance;
        for (var i = 0; i < MAX_ROUTES; i++) {
            if (routes.length > i) {
                route = routes[i];

                containerDiv = this.routeContainerDiv(i);
                nameDiv = this.routeNameDiv(i);
                durationDiv = this.routeDurationDiv(i);
                distanceDiv = this.routeDistanceDiv(i);

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

    hideRouteSelections() {
        var containerDiv;
        for (var i = 0; i < MAX_ROUTES; i++) {
            containerDiv = this.routeContainerDiv(i);
            $(containerDiv).hide();
        }
    }

    onRouteSelected(i) {
        this.render(i);
    }

    initCallbacks() {
        var containerDiv;
        for (var i = 0; i < MAX_ROUTES; i++) {
            containerDiv = this.routeContainerDiv(i);
            $(containerDiv).click(() => {
                this.onRouteSelected(i);
            });
        }
    }

    constructor(map) {
        this.routeResult = [];
        this.directionsRenderer = new google.maps.DirectionsRenderer();
        this.directionsRenderer.setMap(map);
        this.initCallbacks();
    }

    onRoutesRequest(result) {
        this.routeResult = result;
        var routes = result.routes;
        if (routes.length > 1) {
            this.showRouteSelections(routes);
        } else { // Only one route
            this.render(0);
        }
    }
}

class Directions {
    constructor(map) {
        this.directionsService = new google.maps.DirectionsService();
        this.map = map;
    }

    route(routes, from, to) {
        var containerDiv, nameDiv, durationDiv, distanceDiv;
        var route, name, duration, distance;
        var request = {
            origin: from,
            destination: to,
            travelMode: google.maps.TravelMode.DRIVING,
            provideRouteAlternatives: true
        };
        this.directionsService.route(request, function(results, status) {
            if (status == google.maps.DirectionsStatus.OK) {
                routes.onRoutesRequest(results);
            }
        });
    }
}

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

    constructor(routes, directions) {
        var fromSearchBox = new google.maps.places.SearchBox(document.getElementById(FROM_SEARCH_BOX));
        var toSearchBox = new google.maps.places.SearchBox(document.getElementById(TO_SEARCH_BOX));

        fromSearchBox.addListener('places_changed', () => {
            from = this.onChanged(fromSearchBox);
            if (from && to) {
                directions.route (routes, from, to);
            }
        });

        toSearchBox.addListener('places_changed', () => {
            to = this.onChanged(toSearchBox);
            if (from && to) {
                directions.route (routes, from, to);
            }
        });
    }
}

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: NYC_FIDI,
        zoom: 14,
        disableDefaultUI: true
    });
}

function init() {
    initMap();
    var directions = new Directions(map);
    var routes = new Routes(map);
    var searchbox = new Searchbox(routes, directions);
}
