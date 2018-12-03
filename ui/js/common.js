function toLatLng(places) {
    if (places.length > 0) {
        var place = places[0];
        if (place.geometry) {
            return place.geometry.location;
        }
    }
    // CR atian: log error
    return null;
}

module.exports = {
    toLatLng: toLatLng
}
