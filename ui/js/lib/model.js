var Constants = require('./constants.js');
var View = require('./view.js');

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

function cartesian(arrs) {
    var r = [], max = arrs.length-1;
    function f(arr, i) {
        for (var j=0, l=arrs[i].length; j<l; j++) {
            var a = arr.slice(0); // clone arr
            a.push(arrs[i][j]);
            if (i==max)
                r.push(a);
            else
                f(a, i+1);
        }
    }
    f([], 0);
    return r;
}

class Model {
    constructor () {
        /*
         Private fields:
         */
        this.view = new View();
        this._from = null;
        this._to = null;
        this.omw = [];
        this.orderedWaypoints = [[]];
        this._selections = [];
        this._selected = null;
        this.toRender = [];
        this.toRenderIndex = null;
    }

    set from (places) {
        this._from = toLatLng(places);
    }
    get from () {
        return this._from;
    }
    set to (places) {
        this._to = toLatLng(places);
    }
    get to () {
        return this._to;
    }
    set selections (result) {
        this._selections = result;
        var routes;
        if (this.omw.length == 0) {
            routes = this._selections[0].routes;
        } else {
            routes = this._selections.map(selection => selection.routes[0]);
        }
        this.view.showSelections(routes);
    }
    get selections () {
        return this._selections;
    }
    set selected (i) {
        this._selected = i;
        if (i == null) {
            return;
        }
        if (this.omw.length == 0) {
            this.toRender = this._selections[0];
            this.toRenderIndex = i;
        } else {
            this.toRender = this._selections[i];
            this.toRenderIndex = 0;
        }
    }
    get selected() {
        return this._selected;
    }

    path() {
        if (this.toRender &&
            this.toRenderIndex != null &&
            this.toRender.routes[this.toRenderIndex]) {
            return this.toRender.routes[this.toRenderIndex].overview_path;
        } else {
            return [];
        }
    }

    setOmw (index, type, milesIn) {
        this.omw[index] = {
            type: type,
            milesIn: milesIn,
            cachedPlaces: []
        };
    }

    recalculatePotentialWaypoints() {
        var cachedPlaces = this.omw.map(omw => omw.cachedPlaces);
        this.orderedWaypoints = cartesian(cachedPlaces);
        this.orderedWaypoints.sort((w1, w2) => {
            var w1_score = w1.reduce((acc, place) => acc + place.score);
            var w2_score = w2.reduce((acc, place) => acc + place.score);
            return w1_score - w2_score;
        });
        this.orderedWaypoints.splice(Constants.MAX_ROUTES);
    }

    addOmwInfo(index, places) {
        if (index < this.omw.length) {
            var omw = this.omw[index];
            omw.cachedPlaces = places;
            this.recalculatePotentialWaypoints();
        } else {
            // CR atian: log dev error
            console.log('cached omw location out of bounds');
        }
    }
}

module.exports = Model;
