/**
 * GtfsStop NGSI v2 data model
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
        messageFormat: 'lib/ngsi_v2/data_models/GtfsStop.js - {msg}'
    }
});
const NGSI = require('../../helpers/ngsi.js');

// read environment variables from .env file in current workdir into process.env
dotenv.config();


// create a NGSI v2 compliant object from a FPTF stop
const createFrom = (stop) => {
    if (stop) {
        let object = {};

        object['id'] = NGSI.sanitizeIdFieldString('GtfsStop:' + stop.id + NGSI.entityIdSuffix(process.env.BROKER_V2_ENTITY_ID_SUFFIX));
        object['type'] = 'GtfsStop';

        //--> MANDATORY attributes
        object['name'] = {
            "type": 'Text',
            "value": NGSI.sanitizeString(stop.name),
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
                "coordinates": [stop.location.longitude, stop.location.latitude]
            },
            "metadata": {
                "timestamp": {
                    "type": 'DateTime',
                    // set current date and time for each entity creation / update, since transformation source currently provides no timestamps
                    "value": new Date().toISOString()
                }
            }
        };
        //<--

        //--> OPTIONAL attributes
        object['hasParentStation'] = {
            "type": 'Relationship',
            "value": NGSI.sanitizeIdFieldString('GtfsStation:' + stop.station + NGSI.entityIdSuffix(process.env.BROKER_V2_ENTITY_ID_SUFFIX)),
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