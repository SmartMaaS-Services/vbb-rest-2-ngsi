const dotenv = require('dotenv');
const pino = require('pino');
const logger = pino({
    prettyPrint: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
        messageFormat: 'lib/helpers/vbb_rest.js - {msg}'
    }
});
const REST = require('./rest.js');

// read environment variables from .env file in current workdir into process.env
dotenv.config();


const allStations = () => {
    return REST.executeRequest('GET', `${REST.sanitizeUrl(process.env.VBBREST_BASE_URL)}/stations/all`, {'Accept': 'application/json'}, null);
};

const journeys = (params) => {
    const paramsString = REST.stringifyUrlParamsObject(params);
    return REST.executeRequest('GET', `${REST.sanitizeUrl(process.env.VBBREST_BASE_URL)}/journeys${paramsString}`, {'Accept': 'application/json'}, null);
};

const trip = (tripId, params) => {
    if (!tripId) {
        logger.error('trip: no tripId given');
        return;
    }
    const paramsString = REST.stringifyUrlParamsObject(params);
    return REST.executeRequest('GET', `${REST.sanitizeUrl(process.env.VBBREST_BASE_URL)}/trips/${tripId}${paramsString}`, {'Accept': 'application/json'}, null);
};


module.exports = { allStations, journeys, trip };