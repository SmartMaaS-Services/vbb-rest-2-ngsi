/**
 * GtfsRoute NGSI v2 data model
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
        messageFormat: 'lib/ngsi_v2/data_models/GtfsRoute.js - {msg}'
    }
});
const NGSI = require('../../helpers/ngsi.js');

// read environment variables from .env file in current workdir into process.env
dotenv.config();


// create a NGSI v2 compliant object from a given route object
const createFrom = (route) => {
    if (route) {
        let object = {};

        object['id'] = NGSI.sanitizeIdFieldString('GtfsRoute:' + route.id + NGSI.entityIdSuffix(process.env.BROKER_V2_ENTITY_ID_SUFFIX));
        object['type'] = 'GtfsRoute';
        
        //--> MANDATORY attributes
        object['name'] = {
            "type": 'Text',
            "value": NGSI.sanitizeString(route.name),
            "metadata": {
                "timestamp": {
                    "type": 'DateTime',
                    // set current date and time for each entity creation / update, since transformation source currently provides no timestamps
                    "value": new Date().toISOString()
                }
            }
        };
        object['shortName'] = {
            "type": 'Text',
            "value": NGSI.sanitizeString(route.shortName),
            "metadata": {
                "timestamp": {
                    "type": 'DateTime',
                    // set current date and time for each entity creation / update, since transformation source currently provides no timestamps
                    "value": new Date().toISOString()
                }
            }
        };
        object['routeType'] = {
            "type": 'Text',
            "value": NGSI.sanitizeString(route.routeType),
            "metadata": {
                "timestamp": {
                    "type": 'DateTime',
                    // set current date and time for each entity creation / update, since transformation source currently provides no timestamps
                    "value": new Date().toISOString()
                }
            }
        };
        object['operatedBy'] = {
            "type": 'Relationship',
            "value": NGSI.sanitizeIdFieldString('GtfsAgency:' + route.operatedBy + NGSI.entityIdSuffix(process.env.BROKER_V2_ENTITY_ID_SUFFIX)),
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
        object['routeColor'] = {
            "type": 'Text',
            "value": NGSI.sanitizeString(route.routeColor),
            "metadata": {
                "timestamp": {
                    "type": 'DateTime',
                    // set current date and time for each entity creation / update, since transformation source currently provides no timestamps
                    "value": new Date().toISOString()
                }
            }
        };
        object['routeTextColor'] = {
            "type": 'Text',
            "value": NGSI.sanitizeString(route.routeTextColor),
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