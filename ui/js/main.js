var DistanceCalculator = require('./distance_calculator.js');
var Map = require('./map.js');
var Searchbox = require('./searchbox.js');
var Directions = require('./directions.js');
var Omw = require('./omw.js');

window.init = function() {
    var map = Map.init();
    var directions = new Directions(map);
    var searchbox = new Searchbox(directions);
    var omw = new Omw(map, directions);
};
