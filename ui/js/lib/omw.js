var Constants = require('./constants.js');
var Model = require('./model.js');
var GoogleApi = require('./google_api.js');

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

function Omw(model, googleApi) {
    function pointOnPath(milesIn) {
        var milesSoFar = 0;
        var prevLocation;
        for (var location of model.path()) {
            if (prevLocation && prevLocation != location) {
                var distance = DistanceCalculator.milesBetween(prevLocation, location);
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

    /**
     Score places returned for a single omw. If driving distance from origin is
     greater than milesIn, disqualify place. Score by absolute distance from
     path.
     */
    function scorePlaces(milesIn, places) {
        var deferred = $.Deferred();
        // Take the first 5 options to limit the number of google api calls
        // CR atian: don't hardcode this length
        places.splice(5);
        if (model.from == null) {
            return Promise.resolve([]);
        }
        var promises = places.map((place) => {
            if (place.geometry && place.geometry.location) {
                var name = place.name;
                var location = place.geometry.location;
                var request = {
                    origin: model.from,
                    destination: location,
                    travelMode: google.maps.TravelMode.DRIVING,
                    provideRouteAlternatives: false
                };
                return googleApi.directions(request).then((directions) => {
                    if (directions.routes != null &&
                        directions.routes[0].legs != null &&
                        directions.routes[0].legs[0] != null &&
                        directions.routes[0].legs[0].distance != null &&
                        directions.routes[0].legs[0].distance.value != null) {
                        var score = directions.routes[0].legs[0].distance.value * Constants.METERS_TO_MILES;
                        var placeResult =
                                { location : location,
                                  name : name,
                                  score : score
                                };
                        return Promise.resolve(placeResult);
                    } else {
                        return Promise.reject('ERROR: directions missing some fields');
                    }
                });
            } else {
                return Promise.reject('ERROR: geometry is null');
            }
        });

        Promise.all(promises).then(places => {
            places = places.filter(place => place.score <= milesIn);
            deferred.resolve(places);
        });

        return deferred.promise();
    }

    function addOneCachedPlace(omw) {
        var type;
        var deferred = $.Deferred();
        var near = pointOnPath(omw.milesIn);
        var request =
                { location: near,
                  rankBy: google.maps.places.RankBy.DISTANCE,
                  type: omw.type,
                  fields: [ 'name', 'geometry' ]
                };
        googleApi.placesNearby(request).then((places) => {
            return scorePlaces(omw.milesIn, places);
        }).then((places) => {
            deferred.resolve(places);
        });

        return deferred.promise();
    }

    function addCachedPlaces() {
        var deferred = $.Deferred();
        var promises = model.omw.map((omw, i) => {
            if (omw.cachedLocation == null) {
                var promise = addOneCachedPlace(omw).then(places => {
                    model.addOmwInfo(i, places);
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
        addCachedPlaces
    });
}

module.exports = Omw;
