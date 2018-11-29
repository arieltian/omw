const MAX_OMWS = 1;

var DistanceCalculator = require('./distance_calculator.js');

function omwInputDiv(i) {
    return "#gas-" + (i+1);
}

function getPointOnPath(path, milesIn) {
    var milesSoFar = 0;
    var prevLocation;
    var distances = [];
    for (var location of path) {
        if (prevLocation && prevLocation != location) {
            var distance = DistanceCalculator.milesBetween(prevLocation, location);
            distances.push(distance);
            if (milesSoFar + distance > milesIn) {
                return prevLocation;
            }
            milesSoFar += distance;
        }
        prevLocation = location;
    };
    alert('miles in ' + milesIn + ' is greater than total distance ' + milesSoFar);
    return prevLocation;
}

class Omw {
    onGasFound(result) {
        if (result.length > 0) {
            alert('gas station name: ' + result[0].name);
        } else {
            alert('none found');
        }
    }

    findGasRequest(near) {
        var locationBias = new google.maps.LatLngBounds();
        var request =
                { locationBias: near,
                  query: 'gas',
                  fields: ['name']
                };
        this.placesService.findPlaceFromQuery(request, (result, status) => {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                this.onGasFound(result);
            } else {
                alert('bad places request status: ' + status);
            }
        });
    }

    findGas(milesIn) {
        var results = this.directions.getDirections();
        if (results) {
            var i = this.directions.getRouteIndex();
            var path = results.routes[i].overview_path;
            var locationBias = getPointOnPath(path, milesIn);
            if (locationBias) {
                this.findGasRequest(locationBias);
            }
        }
    }

    initCallbacks() {
        for (var i = 0; i < MAX_OMWS; i++) {
            var div = omwInputDiv(i);
            $(div).keypress((event) => {
                var keycode = (event.keyCode ? event.keyCode : event.which);
                if(keycode == '13') { // We hit Enter
                    var milesIn = event.target.value;
                    this.findGas(milesIn);
                }
            });
        }
    }

    constructor(map, directions) {
        this.placesService = new google.maps.places.PlacesService(map);
        this.initCallbacks();
        this.directions = directions;
    }
}

module.exports = Omw;
