/**
 * GtfsAgency NGSI v2 data model
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
        messageFormat: 'lib/ngsi_v2/data_models/GtfsAgency.js - {msg}'
    }
});
const NGSI = require('../../helpers/ngsi.js');

// read environment variables from .env file in current workdir into process.env
dotenv.config();


// create a NGSI v2 compliant object from a given agency object
const createFrom = (agency) => {
    if (agency) {
        let object = {};

        object['id'] = NGSI.sanitizeIdFieldString('GtfsAgency:' + agency.id + NGSI.entityIdSuffix(process.env.BROKER_V2_ENTITY_ID_SUFFIX));
        object['type'] = 'GtfsAgency';
        
        //--> MANDATORY attributes
        object['name'] = {
            "type": 'Text',
            "value": NGSI.sanitizeString(agency.name),
            "metadata": {
                "timestamp": {
                    "type": 'DateTime',
                    // set current date and time for each entity creation / update, since transformation source currently provides no timestamps
                    "value": new Date().toISOString()
                }
            }
        };
        object['source'] = {
            "type": 'URL',
            "value": NGSI.sanitizeString(agency.url),
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