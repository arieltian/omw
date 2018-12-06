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

function toName(places) {
    if (places.length > 0) {
        var place = places[0];
        return place.name;
    }
    // CR atian: log error
    return null;
}

module.exports = {
    toName: toName,
    toLatLng: toLatLng
}
