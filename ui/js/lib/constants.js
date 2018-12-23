// Distance
const EARTH_RADIUS_METERS = 6371000;
const METERS_TO_MILES = 0.00062137;

// Time
const SECS_IN_MIN = 60;
const SECS_IN_HOUR = SECS_IN_MIN * 60;
const SECS_IN_DAY = SECS_IN_HOUR * 24;

// Div elements
const MAP_DIV = 'map';
const MAP_OPTIONS = {
    // Nyc fidi
    center: {lat: 40.7218, lng: -73.9998},
    zoom: 14,
    disableDefaultUI: true
};

const FROM_SEARCH_BOX = 'from-searchbox';
const TO_SEARCH_BOX = 'to-searchbox';

const MAX_ROUTES = 3;
function ROUTE_NAME_DIV(i) {
    return "#route-" + (i+1) + "-name";
}
function ROUTE_CONTAINER_DIV(i) {
    return "#route-" + (i+1) + "-container";
}
function ROUTE_DURATION_DIV(i) {
    return "#route-" + (i+1) + "-duration";
}
function ROUTE_DISTANCE_DIV(i) {
    return "#route-" + (i+1) + "-distance";
}

const MAX_OMWS = 3;
function OMW_CONTAINER(i) {
    return "#omw-container-" + (i+1);
}
function OMW_DIV(i) {
    return "#gas-" + (i+1);
}
function BUTTON_DIV(i) {
    return "#button-" + (i+1);
}

var Omw = {
    GAS: "gas_station"
};

module.exports = {
    EARTH_RADIUS_METERS: EARTH_RADIUS_METERS,
    METERS_TO_MILES: METERS_TO_MILES,
    SECS_IN_MIN: SECS_IN_MIN,
    SECS_IN_HOUR: SECS_IN_HOUR,
    SECS_IN_DAY: SECS_IN_DAY,
    MAP_DIV: MAP_DIV,
    MAP_OPTIONS: MAP_OPTIONS,
    FROM_SEARCH_BOX: FROM_SEARCH_BOX,
    TO_SEARCH_BOX: TO_SEARCH_BOX,
    MAX_ROUTES: MAX_ROUTES,
    ROUTE_NAME_DIV: ROUTE_NAME_DIV,
    ROUTE_CONTAINER_DIV: ROUTE_CONTAINER_DIV,
    ROUTE_DURATION_DIV: ROUTE_DURATION_DIV,
    ROUTE_DISTANCE_DIV: ROUTE_DISTANCE_DIV,
    MAX_OMWS: MAX_OMWS,
    OMW_CONTAINER: OMW_CONTAINER,
    OMW_DIV: OMW_DIV,
    BUTTON_DIV: BUTTON_DIV,
    Omw: Omw
};
