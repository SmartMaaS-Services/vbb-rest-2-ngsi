const dotenv = require('dotenv');
const pino = require('pino');
const logger = pino({
    prettyPrint: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
        messageFormat: 'lib/ngsi_v2/helper.js - {msg}'
    }
});
const GtfsAgency = require('./data_models/GtfsAgency.js');
const GtfsRoute = require('./data_models/GtfsRoute.js');
const GtfsShape = require('./data_models/GtfsShape.js');
const GtfsStation = require('./data_models/GtfsStation.js');
const GtfsStop = require('./data_models/GtfsStop.js');

// read environment variables from .env file in current workdir into process.env
dotenv.config();


// transform data objects into NGSI v2-compatible entity objects
const transformIntoNGSI = (obj, type) => {
    if (type === 'GtfsAgency') {
        return GtfsAgency.createFrom(obj);
    } else if (type === 'GtfsRoute') {
        return GtfsRoute.createFrom(obj);
    } else if (type === 'GtfsShape') {
        return GtfsShape.createFrom(obj);
    } else if (type === 'GtfsStation') {
        return GtfsStation.createFrom(obj);
    } else if (type === 'GtfsStop') {
        return GtfsStop.createFrom(obj);
    }

    logger.warn('transformIntoNGSI: given type matches no supported NGSI v2 entity type');
    return null;
}


module.exports = { transformIntoNGSI };