/**
 * GtfsShape NGSI-LD data model
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
        messageFormat: 'lib/ngsi_ld/data_models/GtfsShape.js - {msg}'
    }
});
const NGSI = require('../../helpers/ngsi.js');

// read environment variables from .env file in current workdir into process.env
dotenv.config();


// create a NGSI-LD compliant object from a given shape object
const createFrom = (shape) => {
    if (shape) {
        let object = {};

        object['id'] = NGSI.sanitizeIdFieldString(NGSI.ldEntityIdPrefix() + 'GtfsShape:' + shape.id + NGSI.entityIdSuffix(process.env.BROKER_LD_ENTITY_ID_SUFFIX));
        object['type'] = 'GtfsShape';

        //--> OPTIONAL attributes
        object['location'] = {
            "type": 'GeoProperty',
            "value": {
                "type": 'LineString',
                "coordinates": shape.coordinates
            },
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