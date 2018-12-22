var Constants = require('../common/constants.js');
var Model = require('./model.js');
var Google = require('./google.js');

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

function Omw(model, google) {
    let model = model;
    let google = google;

    function pointOnPath(milesIn) {
        var milesSoFar = 0;
        var prevLocation;
        for (var location of model.path) {
            if (prevLocation && prevLocation != location) {
                var distance = UnitCalculator.milesBetween(prevLocation, location);
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

    function sortByDistance(resultsLong) {
        var deferred;
        // CR atian: don't hardcode this length
        var results = resultsLong.slice(0, 3);
        if (model.from == null) {
            return Promise.resolve(results);
        }
        var promises = results.map((result) => {
            if (result.geometry && result.geometry.location) {
                var location = result.geometry.location;
                var request = {
                    origin: model.from,
                    destination: location,
                    travelMode: google.maps.TravelMode.DRIVING,
                    provideRouteAlternatives: false
                };
                return google.directions(request);
            } else {
                return Promise.reject('ERROR: geometry is null');
            }
        });

        Promise.all(promises).then((results) => {
            results.sort((r1, r2) => {
                var r1Distance = r1.routes[0].legs[0].distance.value;
                var r2Distance = r2.routes[0].legs[0].distance.value;
                return r1Distance - r2Distance;
            });
            deferred.resolve(results);
        });

        return deferred.promise();
    }

    function find(omw) {
        var deferred, type;
        switch(omw.type) {
        case Constants.Omw.GAS:
            type='gas_station';
            break;
        default:
            return Promise.reject('ERROR: unknown type: ' + omw.type);
        }
        var near = pointOnPath(omw.milesIn);
        var request =
                { location: near,
                  rankBy: google.maps.places.RankBy.DISTANCE,
                  type: type,
                  fields: [ 'name', 'geometry' ]
                };
        var promise = google.placesNearby(request);
        promise.then((result) => {
            var promise = sortByDistance(result);
            promise.then((result) => {
                deferred.resolve(result);
            });
        });
        return deferred.promise();
    }

    function findLocations() {
        var deferred;
        var promises = model.omw.map((owm, i) => {
            if (omw.cachedLocation == null) {
                var promise = find(omw) .then(results => {
                    model.addOmwInfo(i, results);
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
        findLocations
    });
}

module.exports = Omw;
