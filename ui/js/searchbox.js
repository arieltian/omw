const FROM_SEARCH_BOX = 'from-searchbox';
const TO_SEARCH_BOX = 'to-searchbox';

class Searchbox {
    onChanged(searchBox) {
        var places = searchBox.getPlaces();

        if (places.length == 0) {
            return undefined;
        } else if (places.length > 1) {
            console.log("More than one place in query");
        }

        var place = places[0];
        if (!place.geometry) {
            console.log("Place contains no geometry");
            return undefined;
        }

        return place.geometry.location;
    }

    constructor(directions) {
        var fromSearchBox = new google.maps.places.SearchBox(document.getElementById(FROM_SEARCH_BOX));
        var toSearchBox = new google.maps.places.SearchBox(document.getElementById(TO_SEARCH_BOX));

        fromSearchBox.addListener('places_changed', () => {
            this.from = this.onChanged(fromSearchBox);
            if (this.from && this.to) {
                directions.route (this.from, this.to);
            }
        });

        toSearchBox.addListener('places_changed', () => {
            this.to = this.onChanged(toSearchBox);
            if (this.from && this.to) {
                directions.route (this.from, this.to);
            }
        });
    }
}

module.exports = Searchbox;
