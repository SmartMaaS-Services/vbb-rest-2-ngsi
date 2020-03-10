const Bottleneck = require('bottleneck');
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


class VbbRest {
    constructor() {
        // set rate limit for requests to VBB REST API: 5 requests/s (1000 ms / 5 = 200 ms) and 5 concurrent requests at most
        this.REQ_LIMITER = new Bottleneck({maxConcurrent: 5, minTime: 200});
    }

    test() {
        console.log("hallo!");
    }

    allStations() {
        return this.REQ_LIMITER.schedule(() => REST.executeRequest('GET', `${REST.sanitizeUrl(process.env.VBBREST_BASE_URL)}/stations/all`, {'Accept': 'application/json'}, null));
    }

    journeys(params) {
        const paramsString = REST.stringifyUrlParamsObject(params);
        return this.REQ_LIMITER.schedule(() => REST.executeRequest('GET', `${REST.sanitizeUrl(process.env.VBBREST_BASE_URL)}/journeys${paramsString}`, {'Accept': 'application/json'}, null));
    }

    trip(tripId, params) {
        if (!tripId) {
            logger.error('trip: no tripId given');
            return;
        }
        const paramsString = REST.stringifyUrlParamsObject(params);
        return this.REQ_LIMITER.schedule(() => REST.executeRequest('GET', `${REST.sanitizeUrl(process.env.VBBREST_BASE_URL)}/trips/${tripId}${paramsString}`, {'Accept': 'application/json'}, null));
    }

}


module.exports = VbbRest;