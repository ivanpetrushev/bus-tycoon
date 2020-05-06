import villages from './data/villages';
import towns from './data/town-city';

export function get_nearest_town(lat, lon) {
    let minDistance = distance(lat, lon, towns['elements'][0]['lat'], towns['elements'][0]['lon'], 'K') * 1000;
    let selectedNode = towns['elements'][0];
    for (let i = 1; i < towns['elements'].length; i++) {
        let dist = distance(lat, lon, towns['elements'][i]['lat'], towns['elements'][i]['lon'], 'K') * 1000;
        if (dist < minDistance) {
            minDistance = dist;
            selectedNode = towns['elements'][i];
        }
    }
    return {node: selectedNode, dist: minDistance};
}

export function get_nearest_village(lat, lon) {
    let minDistance = distance(lat, lon, villages['elements'][0]['lat'], villages['elements'][0]['lon'], 'K') * 1000;
    let selectedNode = villages['elements'][0];
    for (let i = 1; i < villages['elements'].length; i++) {
        let dist = distance(lat, lon, villages['elements'][i]['lat'], villages['elements'][i]['lon'], 'K') * 1000;
        if (dist < minDistance) {
            minDistance = dist;
            selectedNode = villages['elements'][i];
        }
    }
    return {node: selectedNode, dist: minDistance};
}

export function get_nearest_node(lat, lon) {
    let village = get_nearest_village(lat, lon);
    let town = get_nearest_town(lat, lon);
    if (village.dist < town.dist) {
        return village;
    } else {
        return town;
    }
}

export function getRandomLocation(latitude, longitude, radiusInMeters) {

    let getRandomCoordinates = function (radius, uniform) {
        // Generate two random numbers
        let a = Math.random(),
            b = Math.random();

        // Flip for more uniformity.
        if (uniform) {
            if (b < a) {
                let c = b;
                b = a;
                a = c;
            }
        }

        // It's all triangles.
        return [
            b * radius * Math.cos(2 * Math.PI * a / b),
            b * radius * Math.sin(2 * Math.PI * a / b)
        ];
    };

    let randomCoordinates = getRandomCoordinates(radiusInMeters, true);

    // Earths radius in meters via WGS 84 model.
    let earth = 6378137;

    // Offsets in meters.
    let northOffset = randomCoordinates[0],
        eastOffset = randomCoordinates[1];

    // Offset coordinates in radians.
    let offsetLatitude = northOffset / earth,
        offsetLongitude = eastOffset / (earth * Math.cos(Math.PI * (latitude / 180)));

    // Offset position in decimal degrees.
    return {
        latitude: latitude + (offsetLatitude * (180 / Math.PI)),
        longitude: longitude + (offsetLongitude * (180 / Math.PI))
    }
}

// https://www.geodatasource.com/developers/javascript
export function distance(lat1, lon1, lat2, lon2, unit) {
    if ((lat1 === lat2) && (lon1 === lon2)) {
        return 0;
    } else {
        let radlat1 = Math.PI * lat1 / 180;
        let radlat2 = Math.PI * lat2 / 180;
        let theta = lon1 - lon2;
        let radtheta = Math.PI * theta / 180;
        let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
        if (dist > 1) {
            dist = 1;
        }
        dist = Math.acos(dist);
        dist = dist * 180 / Math.PI;
        dist = dist * 60 * 1.1515;
        if (unit === "K") {
            dist = dist * 1.609344
        }
        if (unit === "N") {
            dist = dist * 0.8684
        }
        return dist;
    }
}

export function makeid(length) {
    let result = '';
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

export function polyline_decode (str, precision) {
    var index = 0,
        lat = 0,
        lng = 0,
        coordinates = [],
        shift = 0,
        result = 0,
        byte = null,
        latitude_change,
        longitude_change,
        factor = Math.pow(10, Number.isInteger(precision) ? precision : 5);

    // Coordinates have variable length when encoded, so just keep
    // track of whether we've hit the end of the string. In each
    // loop iteration, a single coordinate is decoded.
    while (index < str.length) {

        // Reset shift, result, and byte
        byte = null;
        shift = 0;
        result = 0;

        do {
            byte = str.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

        shift = result = 0;

        do {
            byte = str.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

        lat += latitude_change;
        lng += longitude_change;

        coordinates.push([lat / factor, lng / factor]);
    }

    return coordinates;
};

export function saveJSON(data, filename) {
    if (!data) {
        console.error('No data')
        return;
    }

    if (!filename) filename = 'console.json'

    if (typeof data === "object") {
        data = JSON.stringify(data, undefined, 4)
    }

    let blob = new Blob([data], {type: 'text/json'}),
        e = document.createEvent('MouseEvents'),
        a = document.createElement('a')

    a.download = filename
    a.href = window.URL.createObjectURL(blob)
    a.dataset.downloadurl = ['text/json', a.download, a.href].join(':')
    e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
    a.dispatchEvent(e)
}