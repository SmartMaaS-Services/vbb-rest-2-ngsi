/**
 * GtfsStation NGSI v2 data model
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
        messageFormat: 'lib/ngsi_v2/data_models/GtfsStation.js - {msg}'
    }
});
const NGSI = require('../../helpers/ngsi.js');

// read environment variables from .env file in current workdir into process.env
dotenv.config();


// create a NGSI v2 compliant object from a FPTF station
const createFrom = (station) => {
    if (station) {
        let object = {};

        object['id'] = NGSI.sanitizeIdFieldString('GtfsStation:' + station.id + NGSI.entityIdSuffix(process.env.BROKER_V2_ENTITY_ID_SUFFIX));
        object['type'] = 'GtfsStation';

        //--> MANDATORY attributes
        object['name'] = {
            "type": 'Text',
            "value": NGSI.sanitizeString(station.name),
            "metadata": {
                "timestamp": {
                    "type": 'DateTime',
                    // set current date and time for each entity creation / update, since transformation source currently provides no timestamps
                    "value": new Date().toISOString()
                }
            }
        };
        object['location'] = {
            "type": 'geo:json',
            "value": {
                "type": 'Point',
                "coordinates": [station.location.longitude, station.location.latitude]
            },
            "metadata": {
                "timestamp": {
                    "type": 'DateTime',
                    // set current date and time for each entity creation / update, since transformation source currently provides no timestamps
                    "value": new Date().toISOString()
                }
            }
        };
        object['hasStop'] = {
            "type": 'Relationship',
            "value": station.stops.map(stop => NGSI.sanitizeIdFieldString('GtfsStop:' + stop.id + NGSI.entityIdSuffix(process.env.BROKER_V2_ENTITY_ID_SUFFIX))),
            "metadata": {
                "timestamp": {
                    "type": 'DateTime',
                    // set current date and time for each entity creation / update, since transformation source currently provides no timestamps
                    "value": new Date().toISOString()
                }
            }
        };
        //<--

        return object;
    } else {
        return null;
    }
};


module.exports = { createFrom };