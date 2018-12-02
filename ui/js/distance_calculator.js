const EARTH_RADIUS_METERS = 6371000;
const METERS_TO_MILES = 0.00062137;
const SECONDS_TO_MINUTES = 0.01666666;

function radians(degrees) {
    return degrees * (Math.PI / 180);
}

function milesBetween(p1, p2) {
    var p1_lat = p1.lat();
    var p1_lng = p1.lng();
    var p2_lat = p2.lat();
    var p2_lng = p2.lng();

    var lat1 = radians(p1_lat);
    var lat2 = radians(p2_lat);
    var delta_lat = radians(p2_lat - p1_lat);
    var delta_lng = radians(p2_lng - p1_lng);

    var lat_partial = Math.sin(delta_lat/2);
    var lng_partial = Math.sin(delta_lng/2);
    var a = lat_partial * lat_partial +
            Math.cos(lat1) * Math.cos(lat2) *
            lng_partial * lng_partial;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (EARTH_RADIUS_METERS * c) * METERS_TO_MILES;
}

function distanceString(meters) {
    var miles = METERS_TO_MILES * meters;
    return (miles).toFixed(1) + ' mi';
}

// CR atian: rename this module
function durationString(seconds) {
    var minutes = SECONDS_TO_MINUTES * seconds;
    return Math.round(minutes) + ' mins';
}

module.exports = {
    milesBetween: milesBetween,
    distanceString: distanceString,
    durationString: durationString
};
