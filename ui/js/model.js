var Constants = require('./constants.js');
var View = require('./view.js');

class Model {
    _toLatLng(places) {
        if (places.length > 0) {
            var place = places[0];
            if (place.geometry) {
                return place.geometry.location;
            }
        }
        console.log('places contains no results');
        // CR atian: log error
        return null;
    }

    set from (places) {
        this._from = this._toLatLng(places);
    }
    set to (places) {
        this._to = this._toLatLng(places);
    }
    get from () {
        return this._from;
    }
    get to () {
        return this._to;
    }

    set selections (result) {
        this._selections = result;
        this.view.showSelections(result);
    }
    get selections () {
        return this._selections;
    }

    addOmw(places) {
        this.omw.push(this._toLatLng(places));
    }

    constructor() {
        this.omw = [];
        this.view = new View();
    }
}

module.exports = Model;
