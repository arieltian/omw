var Common = require('./common.js');
var Constants = require('./constants.js');
var View = require('./view.js');

class Model {
    set from (places) {
        this._from = Common.toLatLng(places);
    }
    set to (places) {
        this._to = Common.toLatLng(places);
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

    addOmwInfo(index, name, location) {
        if (index < this.omw.length) {
            var omw = this.omw[index];
            omw.cachedName = name;
            omw.cachedLocation = location;
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
