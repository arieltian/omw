var Constants = require('./constants.js');

class View {
    showSelections(selections) {
        var containerDiv, nameDiv, durationDiv, distanceDiv;
        var route, name, duration, distance;
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

                // legs must contain exactly one element
                distance = route.legs[0].distance.text;
                duration = route.legs[0].duration.text;

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
