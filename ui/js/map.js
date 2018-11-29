const NYC_FIDI = {lat: 40.7218, lng: -73.9998};
const ZOOM = 14;
const MAP_ID = 'map';

function init() {
    var map = new google.maps.Map(document.getElementById(MAP_ID), {
        center: NYC_FIDI,
        zoom: ZOOM,
        disableDefaultUI: true
    });
    return map;
}

module.exports = {
    init: init
};
