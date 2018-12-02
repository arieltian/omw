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

const MAX_OMWS = 1;
function OMW_DIV(i) {
    return "#gas-" + (i+1);
}

var Omw = {
    "GAS":1
};

module.exports = {
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
    OMW_DIV: OMW_DIV,
    Omw: Omw
};
