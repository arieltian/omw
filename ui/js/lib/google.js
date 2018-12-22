function Google (map) {
    let map = map;
    let directionsService = new google.maps.DirectionsService();
    let directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);
    let placesService = new google.maps.places.PlacesService(map);

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

    return Object.freeze({
        directions,
        placesNearby,
        render,
        unrender
    });
}

module.exports = Google;

