const EARTH_RADIUS_METERS = 6371000;
const METERS_TO_MILES = 0.00062137;

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
    if (miles < 10) {
        return (miles).toFixed(1) + ' mi';
    } else {
        return Math.round(miles) + ' mi';
    }
}

function toText(value, unit) {
    var valueRounded = Math.round(value);
    if (valueRounded == 0) {
        return "";
    } else {
        return valueRounded + ' ' + unit;
    }
}

const MINUTES_MULT = 60;
const HOURS_MULT = MINUTES_MULT * 60;
const DAYS_MULT = HOURS_MULT * 24;

function durationString(seconds) {
    var minutes, hours, days;
    if (seconds < MINUTES_MULT) {
        return toText(1, 'min');
    } else if (seconds < HOURS_MULT) {
        minutes = seconds/MINUTES_MULT;
        return toText(minutes, 'min');
    } else if (seconds < DAYS_MULT) {
        hours = seconds/HOURS_MULT;
        minutes = (seconds % HOURS_MULT) / MINUTES_MULT;
        return toText(hours, 'h')
            +  ' '
            +  toText(minutes, 'min');
    } else {
        days = seconds/DAYS_MULT;
        hours = (seconds % DAYS_MULT) / HOURS_MULT;
        minutes = (seconds % HOURS_MULT) / MINUTES_MULT;
        return toText(days, 'd')
            +  ' '
            +  toText(hours, 'h')
            +  ' '
            +  toText(minutes, 'min');
    }
}

module.exports = {
    milesBetween: milesBetween,
    distanceString: distanceString,
    durationString: durationString
};
