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
