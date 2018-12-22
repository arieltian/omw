var Constants = require('../common/constants.js');
var View = require('../view/view.js');

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

class Model {
    set from (places) {
        this._from = toLatLng(places);
    }
    set to (places) {
        this._to = toLatLng(places);
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

    get path () {
        if (this._selections && this.selected != null) {
            return this._selections.routes[this.selected].overview_path;
        } else {
            return [];
        }
    }

    setOmw(index, type, milesIn) {
        var omw = {
            type: type,
            milesIn: milesIn,
            cachedName: null,
            cachedLocation: null
        };
        this.omw[index] = omw;
    }

    addOmwInfo(index, places) {
        if (index < this.omw.length) {
            var omw = this.omw[index];
            omw.cachedName = toName(places);
            omw.cachedLocation = toLatLng(places);
        } else {
            // CR atian: log dev error
            console.log('cached omw location out of bounds');
        }
    }

    constructor() {
        this.omw = [];
        this.view = new View();
    }
}

module.exports = Model;
