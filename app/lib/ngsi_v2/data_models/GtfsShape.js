/**
 * GtfsShape NGSI v2 data model
 * 
 * NGSI harmonization based on FIWARE data models specified on https://fiware-datamodels.readthedocs.io/en/latest/UrbanMobility/doc/introduction/index.html
 */


const dotenv = require('dotenv');
const pino = require('pino');
const logger = pino({
    prettyPrint: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
        messageFormat: 'lib/ngsi_v2/data_models/GtfsShape.js - {msg}'
    }
});
const NGSI = require('../../helpers/ngsi.js');

// read environment variables from .env file in current workdir into process.env
dotenv.config();


// create a NGSI v2 compliant object from a given shape object
const createFrom = (shape) => {
    if (shape) {
        let object = {};

        object['id'] = NGSI.sanitizeIdFieldString('GtfsShape:' + shape.id + NGSI.entityIdSuffix(process.env.BROKER_V2_ENTITY_ID_SUFFIX));
        object['type'] = 'GtfsShape';

        //--> OPTIONAL attributes
        object['location'] = {
            "type": 'geo:json',
            "value": {
                "type": 'LineString',
                "coordinates": shape.coordinates
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

        return object;
    } else {
        return null;
    }
};


module.exports = { createFrom };