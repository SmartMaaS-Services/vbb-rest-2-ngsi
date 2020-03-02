/**
 * GtfsRoute NGSI LD data model
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
        messageFormat: 'lib/ngsi_ld/data_models/GtfsRoute.js - {msg}'
    }
});
const NGSI = require('../../helpers/ngsi.js');

// read environment variables from .env file in current workdir into process.env
dotenv.config();


// create a NGSI LD compliant object from a given route object
const createFrom = (route) => {
    if (route) {
        let object = {};

        object['id'] = NGSI.sanitizeIdFieldString(NGSI.ldEntityIdPrefix() + 'GtfsRoute:' + route.id + NGSI.entityIdSuffix(process.env.BROKER_LD_ENTITY_ID_SUFFIX));
        object['type'] = 'GtfsRoute';
        
        //--> MANDATORY attributes
        object['name'] = {
            "type": 'Property',
            "value": NGSI.sanitizeString(route.name),
            // set current date and time for each entity creation / update, since transformation source currently provides no timestamps
            "observedAt": new Date().toISOString()
        };
        object['shortName'] = {
            "type": 'Property',
            "value": NGSI.sanitizeString(route.shortName),
            // set current date and time for each entity creation / update, since transformation source currently provides no timestamps
            "observedAt": new Date().toISOString()
        };
        object['routeType'] = {
            "type": 'Property',
            "value": NGSI.sanitizeString(route.routeType),
            // set current date and time for each entity creation / update, since transformation source currently provides no timestamps
            "observedAt": new Date().toISOString()
        };
        object['operatedBy'] = {
            "type": 'Relationship',
            "object": NGSI.sanitizeIdFieldString(NGSI.ldEntityIdPrefix() + 'GtfsAgency:' + route.operatedBy + NGSI.entityIdSuffix(process.env.BROKER_LD_ENTITY_ID_SUFFIX)),
            // set current date and time for each entity creation / update, since transformation source currently provides no timestamps
            "observedAt": new Date().toISOString()
        };
        //<--

        //--> OPTIONAL attributes
        object['routeColor'] = {
            "type": 'Property',
            "value": NGSI.sanitizeString(route.routeColor),
            // set current date and time for each entity creation / update, since transformation source currently provides no timestamps
            "observedAt": new Date().toISOString()
        };
        object['routeTextColor'] = {
            "type": 'Property',
            "value": NGSI.sanitizeString(route.routeTextColor),
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