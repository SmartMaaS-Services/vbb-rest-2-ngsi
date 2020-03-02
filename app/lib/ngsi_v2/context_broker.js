const dotenv = require('dotenv');
const pino = require('pino');
const logger = pino({
    prettyPrint: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
        messageFormat: 'lib/ngsi_v2/context_broker.js - {msg}'
    }
});
const NGSI = require('../helpers/ngsi.js');
const REST = require('../helpers/rest.js');

// read environment variables from .env file in current workdir into process.env
dotenv.config();


// set headers of a request to the NGSI v2 broker
const setRequestHeaders = (headers) => {
    headers = headers || {};

// set additional headers
    if (process.env.BROKER_V2_AUTH_KEY) {
        headers['Authorization'] = process.env.BROKER_V2_AUTH_KEY;
    }
    if (process.env.BROKER_V2_API_KEY) {
        headers['X-Api-Key'] = process.env.BROKER_V2_API_KEY;
    }
    if (process.env.BROKER_V2_TENANT) {
        headers['Fiware-Service'] = process.env.BROKER_V2_TENANT;
    }
    if (process.env.BROKER_V2_SUBTENANT) {
        headers['Fiware-Servicepath'] = process.env.BROKER_V2_SUBTENANT;
    }

    return headers;
};

// set headers of a notification request to the QuantumLeap
const setQLRequestHeaders = (headers) => {
    headers = headers || {};

// set additional headers
    if (process.env.QL_V2_AUTH_KEY) {
        headers['Authorization'] = process.env.QL_V2_AUTH_KEY;
    }
    if (process.env.QL_V2_API_KEY) {
        headers['X-Api-Key'] = process.env.QL_V2_API_KEY;
    }
    if (process.env.QL_V2_TENANT) {
        headers['Fiware-Service'] = process.env.QL_V2_TENANT;
    }
    if (process.env.QL_V2_SUBTENANT) {
        headers['Fiware-Servicepath'] = process.env.QL_V2_SUBTENANT;
    }

    return headers;
};

const getExistingSubscriptions = (brokerUrl, params) => {
    const paramsString = REST.stringifyUrlParamsObject(params);
    const headers = setRequestHeaders({'Accept': 'application/json'});
    return REST.executeRequest('GET', `${brokerUrl}/subscriptions${paramsString}`, headers, null);
};

const createSubscription = (brokerUrl, entityType) => {
    if (!entityType) {
        logger.error('createSubscription: no entity type given - NGSI v2 subscription won\'t be created');
        return;
    }

    const headers = setRequestHeaders({'Content-Type': 'application/json'});
    const notificationRequestHeaders = setQLRequestHeaders();

    const entityIdSuffix = NGSI.sanitizeIdFieldString(process.env.BROKER_V2_ENTITY_ID_SUFFIX);

    let subscription = {};
    
    subscription['description'] = `Notify QuantumLeap of status changes of any ${entityType} entity` + (entityIdSuffix ? ' with ID suffix: ' + entityIdSuffix : '');
    subscription['subject'] = {
        "entities": [
            {
                "idPattern": entityType + (entityIdSuffix ? '.*:' + entityIdSuffix : '.*'),
                "type": entityType
            }
        ]
    };
    subscription['notification'] = {
        "httpCustom": {
            "url": REST.sanitizeUrl(process.env.QL_V2_NOTIFICATION_BASE_URL) + '/notify',
            "headers": notificationRequestHeaders
        },
        "metadata": ['dateCreated', 'dateModified']
    };
    subscription['throttling'] = 1;

    return REST.executeRequest('POST', `${brokerUrl}/subscriptions`, headers, JSON.stringify(subscription));
};

const getExistingEntities = (brokerUrl, params) => {
    const paramsString = REST.stringifyUrlParamsObject(params);
    const headers = setRequestHeaders({'Accept': 'application/json'});
    return REST.executeRequest('GET', `${brokerUrl}/entities${paramsString}`, headers, null);
};

const updateEntities = (brokerUrl, entities) => {
    if (!Array.isArray(entities) || (Array.isArray(entities) && !entities.length)) {
        return;
    }

    const headers = setRequestHeaders({'Content-Type': 'application/json'});
    const batchBody = JSON.stringify({'actionType': 'append', 'entities': entities});
    const batchBodySize = Buffer.byteLength(batchBody, 'utf8');
    // if body size would exceed context broker's default payload size limit of an incoming request [1048576 bytes (1 MiB)], split batch operation into several requests
    if (batchBodySize > 1048576) {
        return Promise.all(entities.map(entity => {
            if (entity && entity.id) {
                const requestUrl = `${brokerUrl}/entities/${entity.id}/attrs`;
                // remove id and type property from entity object because only attributes are allowed in the payload (update or append entity attributes)
                delete entity.id;
                delete entity.type;
                return REST.executeRequest('POST', requestUrl, headers, JSON.stringify(entity));
            }
        }));
    } else {
        return REST.executeRequest('POST', `${brokerUrl}/op/update`, headers, batchBody);
    }
};

const createEntities = (brokerUrl, entities) => {
    if (!Array.isArray(entities) || (Array.isArray(entities) && !entities.length)) {
        return;
    }
    
    const headers = setRequestHeaders({'Content-Type': 'application/json'});
    const batchBody = JSON.stringify({'actionType': 'append_strict', 'entities': entities});
    const batchBodySize = Buffer.byteLength(batchBody, 'utf8');
    // if body size would exceed context broker's default payload size limit of an incoming request [1048576 bytes (1 MiB)], split batch operation into several requests
    if (batchBodySize > 1048576) {
        return Promise.all(entities.map(entity => REST.executeRequest('POST', `${brokerUrl}/entities`, headers, JSON.stringify(entity))));
    } else {
        return REST.executeRequest('POST', `${brokerUrl}/op/update`, headers, batchBody);
    }
};

// create or update given entitiy objects in NGSI v2 broker
// NOTE: currently this function only accepts arrays of entities with the same type - different entity types in one array may lead to unexpected behavior
const createOrUpdateEntities = async (brokerUrl, entities) => {
    if (!brokerUrl || (typeof brokerUrl !== 'string')) {
        logger.error('createOrUpdateEntities: broker URL \'' + brokerUrl + '\' not applicable');
        return;
    } 
    if (!Array.isArray(entities)) {
        logger.error('createOrUpdateEntities: entities is not an array');
        return;
    }
    if (!entities.length) {
        logger.warn('createOrUpdateEntities: no NGSI v2 entities given - nothing to create or update');
        return;
    }

    try {
        // for entityType definition use type of first object contained in entities array passed to this function
        const entityType = entities[0].type;
        //TODO do subsequent queries if total count of this entity type in the broker (as denoted by 'Fiware-Total-Count' response header) is higher 
        // than specified query parameter 'limit' (1000 is max. number allowed by FIWARE Orion Context Broker implementation) -> assume we don't exceed this limit for now
        const existingEntitiesResponse = await getExistingEntities(brokerUrl, {type: entityType, attrs: 'id', options: 'keyValues,count', limit: '1000'});

        if (existingEntitiesResponse && existingEntitiesResponse.data && Array.isArray(existingEntitiesResponse.data)) {
            // IDs of entities that already exist in NGSI v2 broker
            const existingIds = existingEntitiesResponse.data.map(entity => entity.id);
            // entities that already exist in NGSI v2 broker and need to be updated
            const entitiesToUpdate = [];
            // entities that do not exist in NGSI v2 broker and need to be created
            const entitiesToCreate = [];
            for (const entity of entities) {
                // entity already exists in NGSI v2 broker
                if (existingIds.includes(entity.id)) {
                    entitiesToUpdate.push(entity);
                } else {
                    entitiesToCreate.push(entity);
                }
            }

            if (entitiesToUpdate.length || entitiesToCreate.length) {
                // if historic data persistence is enabled and notification base URL is set, subscribe for value changes of entity attributes in the context broker before adding / updating entities
                if (process.env.ENABLE_HISTORIC_DATA_STORAGE && process.env.ENABLE_HISTORIC_DATA_STORAGE === 'true' && process.env.QL_V2_NOTIFICATION_BASE_URL) {
                    //TODO do subsequent queries if total count of subscriptions in the broker (as denoted by 'Fiware-Total-Count' response header) is higher 
                    // than specified query parameter 'limit' (1000 is max. number allowed by FIWARE Orion Context Broker implementation) -> assume we don't exceed this limit for now
                    const existingSubscriptionsResponse = await getExistingSubscriptions(brokerUrl, {options: 'count', limit: '1000'});
                    if (existingSubscriptionsResponse && existingSubscriptionsResponse.data && Array.isArray(existingSubscriptionsResponse.data)) {
                        // subscription already exists for this entity type (only check by entity type and entity id pattern as specified on creation by this application)
                        const subscriptionExists = existingSubscriptionsResponse.data.some(subscription => {
                            if (subscription.subject && Array.isArray(subscription.subject.entities) && subscription.subject.entities.length) {
                                const subjectEntity = subscription.subject.entities[0];
                                const entityIdSuffix = NGSI.sanitizeIdFieldString(process.env.BROKER_V2_ENTITY_ID_SUFFIX);
                                // 'idPattern' must equal '<ENTITY_TYPE>.*[:ENTITY_ID_SUFFIX]' and 'type' must equal '<ENTITY_TYPE>'
                                return (subjectEntity.idPattern === entityType + (entityIdSuffix ? '.*:' + entityIdSuffix : '.*') && subjectEntity.type === entityType);
                            }
                        });
                        if (!subscriptionExists) {
                            logger.info(`CREATING NEW subscription for entity type '${entityType}' in NGSI v2 broker...`);
                            // create subscription
                            await createSubscription(brokerUrl, entityType);
                        }
                    }
                }

                let updatingEntities = null, creatingEntities = null;
                if (entitiesToUpdate.length) {
                    logger.info(`UPDATING ${entitiesToUpdate.length} EXISTING entities in NGSI v2 broker...`);
                    //logger.info(JSON.stringify(entitiesToUpdate));
                    // update existing entity objects in context broker
                    updatingEntities = updateEntities(brokerUrl, entitiesToUpdate);
                }
                if (entitiesToCreate.length) {
                    logger.info(`CREATING ${entitiesToCreate.length} NEW entities in NGSI v2 broker...`);
                    //logger.info(JSON.stringify(entitiesToCreate));
                    // create new entity objects in context broker
                    creatingEntities = createEntities(brokerUrl, entitiesToCreate);
                }

                await updatingEntities;
                await creatingEntities;
            }
        } else {
            logger.error(`createOrUpdateEntities: could not query existing entities of type '${entityType}' in NGSI v2 broker`);
        }
    } catch(error) {
        logger.error('createOrUpdateEntities: ' + error);
    }
};


module.exports = { createOrUpdateEntities };