var Constants = require('./constants.js');

class Units {
    static distanceString(meters) {
        var miles = Constants.METERS_TO_MILES * meters;
        if (miles < 10) {
            return (miles).toFixed(1) + ' mi';
        } else {
            return Math.round(miles) + ' mi';
        }
    }

    static toText(value, unit) {
        var valueRounded = Math.round(value);
        if (valueRounded == 0) {
            return "";
        } else {
            return valueRounded + ' ' + unit;
        }
    }

    static durationString(seconds) {
        var minutes, hours, days;
        if (seconds < Constants.SECS_IN_MIN) {
            return Units.toText(1, 'min');
        } else if (seconds < Constants.SECS_IN_HOUR) {
            minutes = seconds/Constants.SECS_IN_MIN;
            return Units.toText(minutes, 'min');
        } else if (seconds < Constants.SECS_IN_DAY) {
            hours = seconds/Constants.SECS_IN_HOUR;
            minutes = (seconds % Constants.SECS_IN_HOUR) / Constants.SECS_IN_MIN;
            return Units.toText(hours, 'h')
                +  ' '
                +  Units.toText(minutes, 'min');
        } else {
            days = seconds/Constants.SECS_IN_DAY;
            hours = (seconds % Constants.SECS_IN_DAY) / Constants.SECS_IN_HOUR;
            minutes = (seconds % Constants.SECS_IN_HOUR) / Constants.SECS_IN_MIN;
            return Units.toText(days, 'd')
                +  ' '
                +  Units.toText(hours, 'h')
                +  ' '
                +  Units.toText(minutes, 'min');
        }
    }
}

class View {
    showSelections(selections) {
        var containerDiv, nameDiv, durationDiv, distanceDiv;
        var route, name, duration, distance, durationSecs, distanceMeters;
        var routes = selections.routes;
        for (var i = 0; i < Constants.MAX_ROUTES; i++) {
            if (routes.length > i) {
                route = routes[i];

                containerDiv = Constants.ROUTE_CONTAINER_DIV(i);
                nameDiv = Constants.ROUTE_NAME_DIV(i);
                durationDiv = Constants.ROUTE_DURATION_DIV(i);
                distanceDiv = Constants.ROUTE_DISTANCE_DIV(i);

                if (i == 0) {
                    name = "Suggested route";
                } else {
                    name = "Alternative route";
                }

                distanceMeters = 0;
                durationSecs = 0;
                var legs = route.legs;
                for(var j = 0; j < legs.length; j++) {
                    var leg = legs[j];
                    if (leg.distance) { distanceMeters += leg.distance.value; }
                    if (leg.duration) { durationSecs += leg.duration.value; }
                }

                distance = Units.distanceString(distanceMeters);
                duration = Units.durationString(durationSecs);

                $(nameDiv).html(name);
                $(durationDiv).html(duration);
                $(distanceDiv).html(distance);
                $(containerDiv).show();
            } else {
                containerDiv = Constants.ROUTE_CONTAINER_DIV(i);
                $(containerDiv).hide();
            }
        }
    }

    constructor() {}
}

module.exports = View;
