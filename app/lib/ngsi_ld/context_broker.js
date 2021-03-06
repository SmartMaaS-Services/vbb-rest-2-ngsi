const Bottleneck = require('bottleneck');
const dotenv = require('dotenv');
const pino = require('pino');
const logger = pino({
    prettyPrint: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
        messageFormat: 'lib/ngsi_ld/context_broker.js - {msg}'
    }
});
const NGSI_LD = require('./helper.js');
const REST = require('../helpers/rest.js');

// read environment variables from .env file in current workdir into process.env
dotenv.config();


class ContextBroker {
    constructor() {
        // set rate limit for requests to context broker: 20 requests/s (1000 ms / 20 = 50 ms) and 20 concurrent requests at most 
        this.REQ_LIMITER = new Bottleneck({maxConcurrent: 20, minTime: 50});
    }

    // set headers of a request to the NGSI-LD broker
    setRequestHeaders(headers) {
        headers = headers || {};

    // set additional headers
        if (process.env.BROKER_LD_AUTH_KEY) {
            headers['Authorization'] = 'Bearer ' + process.env.BROKER_LD_AUTH_KEY;
        }
        if (process.env.BROKER_LD_API_KEY) {
            headers['X-Api-Key'] = process.env.BROKER_LD_API_KEY;
        }
        if (process.env.BROKER_LD_TENANT) {
            headers['Fiware-Service'] = process.env.BROKER_LD_TENANT;
        }
        if (process.env.BROKER_LD_SUBTENANT) {
            headers['Fiware-Servicepath'] = process.env.BROKER_LD_SUBTENANT;
        }

        return headers;
    }

    getExistingEntities(brokerUrl, params) {
        const paramsString = REST.stringifyUrlParamsObject(params);
        const headers = this.setRequestHeaders({'Accept': 'application/ld+json', 
                                            'Link': '<https://fiware.github.io/data-models/context.jsonld>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"'
                                        });
        return this.REQ_LIMITER.schedule(() => REST.executeRequest('GET', `${brokerUrl}/entities${paramsString}`, headers, null));
    }

    updateEntities(brokerUrl, entities) {
        if (!Array.isArray(entities) || (Array.isArray(entities) && !entities.length)) {
            return;
        }

        const headers = this.setRequestHeaders({'Content-Type': 'application/ld+json'});
        //const batchBody = JSON.stringify(entities);
        //const batchBodySize = Buffer.byteLength(batchBody, 'utf8');
        // if body size would exceed context broker's default payload size limit of an incoming request [1048576 bytes (1 MiB)], split batch operation into several requests
        //if (batchBodySize > 1048576) {
            const queryTasks = entities.map(entity => {
                return this.REQ_LIMITER.schedule(() => {
                    if (entity && entity.id) {
                        const requestUrl = `${brokerUrl}/entities/${entity.id}/attrs`;
                        // remove id and type property from entity object because only attributes are allowed in the payload (update or append entity attributes)
                        delete entity.id;
                        delete entity.type;
                        return REST.executeRequest('PATCH', requestUrl, headers, JSON.stringify(entity));
                    }
                });
            });
            return Promise.all(queryTasks);
        // as of March 2nd, 2020: batch operation "update" not yet implemented in Orion LD
        //} else {
        //    return this.REQ_LIMITER.schedule(() => REST.executeRequest('POST', `${brokerUrl}/entityOperations/update`, headers, batchBody));
        //}
    }

    createEntities(brokerUrl, entities) {
        if (!Array.isArray(entities) || (Array.isArray(entities) && !entities.length)) {
            return;
        }
        
        const headers = this.setRequestHeaders({'Content-Type': 'application/ld+json'});
        const batchBody = JSON.stringify(entities);
        const batchBodySize = Buffer.byteLength(batchBody, 'utf8');
        // if body size would exceed context broker's default payload size limit of an incoming request [1048576 bytes (1 MiB)], split batch operation into several requests
        if (batchBodySize > 1048576) {
            const queryTasks = entities.map(entity => {
                return this.REQ_LIMITER.schedule(() => REST.executeRequest('POST', `${brokerUrl}/entities`, headers, JSON.stringify(entity)));
            });
            return Promise.all(queryTasks);
        // as of March 2nd, 2020: batch operation "create" not yet implemented in Orion LD, use "upsert" instead (replaces existing entity contents by default)
        } else {
            return this.REQ_LIMITER.schedule(() => REST.executeRequest('POST', `${brokerUrl}/entityOperations/upsert`, headers, batchBody));
        }
    }

    // create or update given entitiy objects in NGSI-LD broker
    // NOTE: currently this function only accepts arrays of entities with the same type - different entity types in one array may lead to unexpected behavior
    async createOrUpdateEntities(brokerUrl, entities) {
        if (!brokerUrl || (typeof brokerUrl !== 'string')) {
            logger.error('createOrUpdateEntities: broker URL \'' + brokerUrl + '\' not applicable');
            return;
        } 
        if (!Array.isArray(entities)) {
            logger.error('createOrUpdateEntities: entities is not an array');
            return;
        }
        if (!entities.length) {
            logger.warn('createOrUpdateEntities: no NGSI-LD entities given - nothing to create or update');
            return;
        }

        try {
            // for entityType definition use type of first object contained in entities array passed to this function
            const entityType = entities[0].type;
            // limit fetched entities to certain attributes (must be of type "Property" or "Relationship")
            // as of March 9th, 2020: while trying to reduce response payload size by using query parameter 'attrs' with at least one existing attribute name, a full set of existing entites in the repsonse can not be guaranteed 
            const attrsFilter = null;/*NGSI_LD.filterableAttributes(entityType).join();*/
            //TODO do subsequent queries if total count of this entity type in the broker (as denoted by 'Fiware-Total-Count' response header) is higher 
            // than specified query parameter 'limit' (1000 is max. number allowed by FIWARE Orion Context Broker implementation) -> assume we don't exceed this limit for now
            let params = {type: entityType, options: 'keyValues,count', limit: '1000'};
            if (attrsFilter) {
                params.attrs = attrsFilter;
            }
            const existingEntitiesResponse = await this.getExistingEntities(brokerUrl, params);

            if (existingEntitiesResponse && existingEntitiesResponse.data && Array.isArray(existingEntitiesResponse.data)) {
                // IDs of entities that already exist in NGSI-LD broker
                const existingIds = existingEntitiesResponse.data.map(entity => entity.id);
                // entities that already exist in NGSI-LD broker and need to be updated
                const entitiesToUpdate = [];
                // entities that do not exist in NGSI-LD broker and need to be created
                const entitiesToCreate = [];
                for (const entity of entities) {
                    // entity already exists in NGSI-LD broker
                    if (existingIds.includes(entity.id)) {
                        entitiesToUpdate.push(entity);
                    } else {
                        entitiesToCreate.push(entity);
                    }
                }

                if (entitiesToUpdate.length || entitiesToCreate.length) {
                    let updatingEntities = null, creatingEntities = null;
                    if (entitiesToUpdate.length) {
                        logger.info(`UPDATING ${entitiesToUpdate.length} EXISTING entities in NGSI-LD broker...`);
                        //logger.info(JSON.stringify(entitiesToUpdate));
                        // update existing entity objects in context broker
                        updatingEntities = this.updateEntities(brokerUrl, entitiesToUpdate);
                    }
                    if (entitiesToCreate.length) {
                        logger.info(`CREATING ${entitiesToCreate.length} NEW entities in NGSI-LD broker...`);
                        //logger.info(JSON.stringify(entitiesToCreate));
                        // create new entity objects in context broker
                        creatingEntities = this.createEntities(brokerUrl, entitiesToCreate);
                    }

                    await updatingEntities;
                    await creatingEntities;
                }
            } else {
                logger.error(`createOrUpdateEntities: could not query existing entities of type '${entityType}' in NGSI-LD broker`);
            }
        } catch(error) {
            logger.error('createOrUpdateEntities: ' + error);
        }
    }
}


module.exports = ContextBroker;