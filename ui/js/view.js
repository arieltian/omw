var Constants = require('./constants.js');
var UnitCalculator = require('./unit_calculator.js');

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

                distance = UnitCalculator.distanceString(distanceMeters);
                duration = UnitCalculator.durationString(durationSecs);

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
