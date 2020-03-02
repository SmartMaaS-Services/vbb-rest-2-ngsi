/**
 * GtfsStation NGSI-LD data model
 * 
 * Specification of source data format FTPF can be found here: https://github.com/public-transport/friendly-public-transport-format
 * NGSI harmonization based on FIWARE data models specified on https://fiware-datamodels.readthedocs.io/en/latest/UrbanMobility/doc/introduction/index.html
 */


const dotenv = require('dotenv');
const pino = require('pino');
const logger = pino({
    prettyPrint: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
        messageFormat: 'lib/ngsi_ld/data_models/GtfsStation.js - {msg}'
    }
});
const NGSI = require('../../helpers/ngsi.js');

// read environment variables from .env file in current workdir into process.env
dotenv.config();


// create a NGSI-LD compliant object from a FPTF station
const createFrom = (station) => {
    if (station) {
        let object = {};

        object['id'] = NGSI.sanitizeIdFieldString(NGSI.ldEntityIdPrefix() + 'GtfsStation:' + station.id + NGSI.entityIdSuffix(process.env.BROKER_LD_ENTITY_ID_SUFFIX));
        object['type'] = 'GtfsStation';

        //--> MANDATORY attributes
        object['name'] = {
            "type": 'Property',
            "value": NGSI.sanitizeString(station.name),
            // set current date and time for each entity creation / update, since transformation source currently provides no timestamps
            "observedAt": new Date().toISOString()
        };
        object['location'] = {
            "type": 'GeoProperty',
            "value": {
                "type": 'Point',
                "coordinates": [station.location.longitude, station.location.latitude]
            },
            // set current date and time for each entity creation / update, since transformation source currently provides no timestamps
            "observedAt": new Date().toISOString()
        };
        object['hasStop'] = {
            "type": 'Relationship',
            "object": station.stops.map(stop => NGSI.sanitizeIdFieldString(NGSI.ldEntityIdPrefix() + 'GtfsStop:' + stop.id + NGSI.entityIdSuffix(process.env.BROKER_LD_ENTITY_ID_SUFFIX))),
            // set current date and time for each entity creation / update, since transformation source currently provides no timestamps
            "observedAt": new Date().toISOString()
        };
        //<--

        //--> Linked Data @context property
        object['@context'] = NGSI.ldAtContextValue();
        //<--

        return object;
    } else {
        return null;
    }
};


module.exports = { createFrom };