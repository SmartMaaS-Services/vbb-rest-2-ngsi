/**
 * GtfsAgency NGSI-LD data model
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
        messageFormat: 'lib/ngsi_ld/data_models/GtfsAgency.js - {msg}'
    }
});
const NGSI = require('../../helpers/ngsi.js');

// read environment variables from .env file in current workdir into process.env
dotenv.config();


// create a NGSI-LD compliant object from a given agency object
const createFrom = (agency) => {
    if (agency) {
        let object = {};

        object['id'] = NGSI.sanitizeIdFieldString(NGSI.ldEntityIdPrefix() + 'GtfsAgency:' + agency.id + NGSI.entityIdSuffix(process.env.BROKER_LD_ENTITY_ID_SUFFIX));
        object['type'] = 'GtfsAgency';
        
        //--> MANDATORY attributes
        object['name'] = {
            "type": 'Property',
            "value": NGSI.sanitizeString(agency.name),
            // set current date and time for each entity creation / update, since transformation source currently provides no timestamps
            "observedAt": new Date().toISOString()
        };
        object['source'] = {
            "type": 'Property',
            "value": NGSI.sanitizeString(agency.url),
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