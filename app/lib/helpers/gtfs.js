const pino = require('pino');
const logger = pino({
    prettyPrint: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
        messageFormat: 'lib/helpers/gtfs.js - {msg}'
    }
});


// get a GTFS-defined 'route_type' enum whose value matches a given FTPF 'mode' or 'subMode' string
// compare https://developers.google.com/transit/gtfs/reference#routestxt and https://github.com/public-transport/friendly-public-transport-format/blob/1.2.1/spec/readme.md
const getRouteTypeForFTPFmode = Object.freeze({
    train: 2,
    bus: 3,
    watercraft: 4,
    taxi: 0,
    gondola: 6,
    aircraft: 6,        // !!! does not match any GTFS 'route_type': set 6 ("Aerial lift, suspended cable car (e.g., gondola lift, aerial tramway)") as fallback
    car: 0,
    bicycle: 0,         // !!! does not match any GTFS 'route_type': set 0 ("Tram, Streetcar, Light rail") as fallback
    walking: 0          // !!! does not match any GTFS 'route_type': set 0 ("Tram, Streetcar, Light rail") as fallback
});


module.exports = { getRouteTypeForFTPFmode };