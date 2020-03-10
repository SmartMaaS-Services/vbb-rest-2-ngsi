const dotenv = require('dotenv');
const pino = require('pino');
const logger = pino({
    prettyPrint: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
        messageFormat: 'index.js - {msg}'
    }
});
const REST = require('./lib/helpers/rest.js');
const VBB_REST = require('./lib/helpers/vbb_rest.js');
const GTFS = require('./lib/helpers/gtfs.js');
const NGSI_V2 = require('./lib/ngsi_v2/helper.js');
const NGSI_LD = require('./lib/ngsi_ld/helper.js');
const ContextBrokerV2 = require('./lib/ngsi_v2/context_broker.js');
const ContextBrokerLD = require('./lib/ngsi_ld/context_broker.js');

// read environment variables from .env file in current workdir into process.env
dotenv.config();


// context brokers (theoretically in future we could supply context data to more than one broker of a type)
const BROKERS = { v2: [REST.sanitizeUrl(process.env.BROKER_V2_BASE_URL)], ld: [REST.sanitizeUrl(process.env.BROKER_LD_BASE_URL)] };

// give other required services some time (20 seconds) to get started before trying to connect to them
setTimeout(() => {

    // create class instances
    const vbbRest = new VBB_REST();
    const cbV2 = new ContextBrokerV2();
    const cbLD = new ContextBrokerLD();

    function transformIntoNGSI(objArray, type) {
        if (!Array.isArray(objArray)) {
            logger.error('transformIntoNGSI: objArray is not an array');
            return [];
        }
        if (!type || (typeof type !== 'string')) {
            logger.error('transformIntoNGSI: unsupported entity type ' + type);
            return [];
        }

        logger.info(`initiating ${type} transformation into NGSI...`);
        let entityV2Objects = [], entityLDObjects = [];

        // we have a list of NGSI v2 context brokers -> transform objects to compatible NGSI v2 entity objects
        if (BROKERS.v2.length) {
            entityV2Objects = objArray.map(obj => NGSI_V2.transformIntoNGSI(obj, type));
        }
        // we have a list of NGSI-LD context brokers -> transform objects to compatible NGSI-LD entity objects
        if (BROKERS.ld.length) {
            entityLDObjects = objArray.map(obj => NGSI_LD.transformIntoNGSI(obj, type));
        }

        return { v2: entityV2Objects, ld: entityLDObjects };
    }

    async function queryVBBStations() {
        try {
            logger.info('querying stations from vbb-rest API...');
            // TODO --> instead of querying all stations (~ 13000) for demo purposes just return an array of 10 arbitrary stations for now.
            //return Object.values({"900000245025":{"type":"station","id":"900000245025","name":"Rangsdorf, Bahnhof","location":{"type":"location","latitude":52.294125,"longitude":13.431112},"weight":1841.25,"stops":[{"type":"stop","id":"000008012713","name":"Rangsdorf, Bahnhof","station":"900000245025","location":{"type":"location","latitude":52.294125,"longitude":13.431112}},{"type":"stop","id":"300000005271","name":"Rangsdorf, Bahnhof","station":"900000245025","location":{"type":"location","latitude":52.294125,"longitude":13.431112}},{"type":"stop","id":"300000005273","name":"Rangsdorf, Bahnhof","station":"900000245025","location":{"type":"location","latitude":52.294125,"longitude":13.431112}}]},"900000550090":{"type":"station","id":"900000550090","name":"Leipzig, Hauptbahnhof","location":{"type":"location","latitude":51.344817,"longitude":12.381321},"weight":1775,"stops":[{"type":"stop","id":"000008010205","name":"Leipzig, Hauptbahnhof","station":"900000550090","location":{"type":"location","latitude":51.344817,"longitude":12.381321}},{"type":"stop","id":"000008098205","name":"Leipzig, Hauptbahnhof","station":"900000550090","location":{"type":"location","latitude":51.344817,"longitude":12.381321}}]},"900000435000":{"type":"station","id":"900000435000","name":"Senftenberg, Bahnhof","location":{"type":"location","latitude":51.52679,"longitude":14.003977},"weight":605,"stops":[{"type":"stop","id":"000008010327","name":"Senftenberg, Bahnhof","station":"900000435000","location":{"type":"location","latitude":51.52679,"longitude":14.003977}}]},"900000550112":{"type":"station","id":"900000550112","name":"Schwerin, Hauptbahnhof","location":{"type":"location","latitude":53.635261,"longitude":11.40752},"weight":975,"stops":[{"type":"stop","id":"000008010324","name":"Schwerin, Hauptbahnhof","station":"900000550112","location":{"type":"location","latitude":53.635261,"longitude":11.40752}},{"type":"stop","id":"710009550112","name":"Schwerin, Hauptbahnhof","station":"900000550112","location":{"type":"location","latitude":53.635261,"longitude":11.40752}}]},"900000550319":{"type":"station","id":"900000550319","name":"Mühlanger, Bahnhof","location":{"type":"location","latitude":51.855704,"longitude":12.748198},"weight":155,"stops":[{"type":"stop","id":"000008012393","name":"Mühlanger, Bahnhof","station":"900000550319","location":{"type":"location","latitude":51.855704,"longitude":12.748198}}]},"900000435339":{"type":"station","id":"900000435339","name":"Großräschen, Bahnhof","location":{"type":"location","latitude":51.591486,"longitude":14.014993},"weight":462.5,"stops":[{"type":"stop","id":"000008011756","name":"Großräschen, Bahnhof","station":"900000435339","location":{"type":"location","latitude":51.591486,"longitude":14.014993}},{"type":"stop","id":"390094353391","name":"Großräschen, Bahnhof","station":"900000435339","location":{"type":"location","latitude":51.591486,"longitude":14.014993}}]},"900000311307":{"type":"station","id":"900000311307","name":"Eisenhüttenstadt, Bahnhof","location":{"type":"location","latitude":52.147961,"longitude":14.65872},"weight":792.5,"stops":[{"type":"stop","id":"000008011471","name":"Eisenhüttenstadt, Bahnhof","station":"900000311307","location":{"type":"location","latitude":52.147961,"longitude":14.65872}},{"type":"stop","id":"650030890101","name":"Eisenhüttenstadt, Bahnhof","station":"900000311307","location":{"type":"location","latitude":52.147961,"longitude":14.65872}},{"type":"stop","id":"650030890103","name":"Eisenhüttenstadt, Bahnhof","station":"900000311307","location":{"type":"location","latitude":52.147961,"longitude":14.65872}}]},"900000222030":{"type":"station","id":"900000222030","name":"Borkheide, Bahnhof","location":{"type":"location","latitude":52.23115,"longitude":12.854964},"weight":1452.5,"stops":[{"type":"stop","id":"000008011238","name":"Borkheide, Bahnhof","station":"900000222030","location":{"type":"location","latitude":52.23115,"longitude":12.854964}},{"type":"stop","id":"450009222030","name":"Borkheide, Bahnhof","station":"900000222030","location":{"type":"location","latitude":52.23115,"longitude":12.854964}},{"type":"stop","id":"250000085101","name":"Borkheide, Bahnhof","station":"900000222030","location":{"type":"location","latitude":52.23115,"longitude":12.854964}}]},"900000230999":{"type":"station","id":"900000230999","name":"S Potsdam Hauptbahnhof","location":{"type":"location","latitude":52.390935,"longitude":13.067187},"weight":15970.75,"stops":[{"type":"stop","id":"000008012666","name":"S Potsdam Hauptbahnhof","station":"900000230999","location":{"type":"location","latitude":52.390935,"longitude":13.067187}},{"type":"stop","id":"060023005896","name":"S Potsdam Hauptbahnhof","station":"900000230999","location":{"type":"location","latitude":52.390935,"longitude":13.067187}},{"type":"stop","id":"060023005897","name":"S Potsdam Hauptbahnhof","station":"900000230999","location":{"type":"location","latitude":52.390935,"longitude":13.067187}},{"type":"stop","id":"300000000408","name":"S Potsdam Hauptbahnhof","station":"900000230999","location":{"type":"location","latitude":52.390935,"longitude":13.067187}},{"type":"stop","id":"270000042301","name":"S Potsdam Hauptbahnhof","station":"900000230999","location":{"type":"location","latitude":52.390935,"longitude":13.067187}},{"type":"stop","id":"270000042302","name":"S Potsdam Hauptbahnhof","station":"900000230999","location":{"type":"location","latitude":52.390935,"longitude":13.067187}},{"type":"stop","id":"450009230999","name":"S Potsdam Hauptbahnhof","station":"900000230999","location":{"type":"location","latitude":52.390935,"longitude":13.067187}},{"type":"stop","id":"270000042303","name":"S Potsdam Hauptbahnhof","station":"900000230999","location":{"type":"location","latitude":52.390935,"longitude":13.067187}},{"type":"stop","id":"270000042304","name":"S Potsdam Hauptbahnhof","station":"900000230999","location":{"type":"location","latitude":52.390935,"longitude":13.067187}},{"type":"stop","id":"100000110506","name":"S Potsdam Hauptbahnhof","station":"900000230999","location":{"type":"location","latitude":52.390935,"longitude":13.067187}},{"type":"stop","id":"100000110509","name":"S Potsdam Hauptbahnhof","station":"900000230999","location":{"type":"location","latitude":52.390935,"longitude":13.067187}},{"type":"stop","id":"100000110503","name":"S Potsdam Hauptbahnhof","station":"900000230999","location":{"type":"location","latitude":52.390935,"longitude":13.067187}},{"type":"stop","id":"270000042351","name":"S Potsdam Hauptbahnhof","station":"900000230999","location":{"type":"location","latitude":52.390935,"longitude":13.067187}},{"type":"stop","id":"270000042305","name":"S Potsdam Hauptbahnhof","station":"900000230999","location":{"type":"location","latitude":52.390935,"longitude":13.067187}},{"type":"stop","id":"270000042306","name":"S Potsdam Hauptbahnhof","station":"900000230999","location":{"type":"location","latitude":52.390935,"longitude":13.067187}},{"type":"stop","id":"270000042307","name":"S Potsdam Hauptbahnhof","station":"900000230999","location":{"type":"location","latitude":52.390935,"longitude":13.067187}},{"type":"stop","id":"250000110508","name":"S Potsdam Hauptbahnhof","station":"900000230999","location":{"type":"location","latitude":52.390935,"longitude":13.067187}},{"type":"stop","id":"250000110509","name":"S Potsdam Hauptbahnhof","station":"900000230999","location":{"type":"location","latitude":52.390935,"longitude":13.067187}},{"type":"stop","id":"250000110503","name":"S Potsdam Hauptbahnhof","station":"900000230999","location":{"type":"location","latitude":52.390935,"longitude":13.067187}},{"type":"stop","id":"250000110505","name":"S Potsdam Hauptbahnhof","station":"900000230999","location":{"type":"location","latitude":52.390935,"longitude":13.067187}},{"type":"stop","id":"300000000406","name":"S Potsdam Hauptbahnhof","station":"900000230999","location":{"type":"location","latitude":52.390935,"longitude":13.067187}},{"type":"stop","id":"250000110506","name":"S Potsdam Hauptbahnhof","station":"900000230999","location":{"type":"location","latitude":52.390935,"longitude":13.067187}}]},"900000205022":{"type":"station","id":"900000205022","name":"Netzeband, Bahnhof","location":{"type":"location","latitude":52.995291,"longitude":12.628685},"weight":180,"stops":[{"type":"stop","id":"000008012428","name":"Netzeband, Bahnhof","station":"900000205022","location":{"type":"location","latitude":52.995291,"longitude":12.628685}}]}});
            // <--
            const stations = await vbbRest.allStations();
            if (stations && typeof stations.data === 'object') {
                return Object.values(stations.data);
            } else {
                logger.warn('queryVBBStations: query returned no stations');
                return [];
            }
        } catch(error) {
            logger.error('queryVBBStations: awaiting vbbRest.allStations: ' + error);
        }
    }

    async function queryVBBJourneys(/*stations*/) {
        logger.info('querying journeys from vbb-rest API...');
        // query just one journey of some selected connections (from station A to station B) for now
        const journeyParams = [ {from: '900000044201', to: '900000007150', results: 1}, 
                                {from: '900000120004', to: '900000100025', results: 1},
                                {from: '900000230205', to: '900000446442', results: 1},
                                {from: '900000089453', to: '900000230200', results: 1},
                                {from: '900000310929', to: '900000023203', results: 1},
                                {from: '900000040104', to: '900000100516', results: 1},
                                {from: '900000100009', to: '900000100020', results: 1},
                                {from: '900000205474', to: '900000004104', results: 1},
                                {from: '900000100001', to: '900000022171', results: 1},
                                {from: '900000022172', to: '900000019158', results: 1}
                            ];

        const queryResults = journeyParams.map(paramObject => vbbRest.journeys(paramObject));
        return Promise.all(queryResults.map(async (result) => {
            try {
                // return first journey from each result set
                const journeys = await result;
                if (journeys && typeof journeys.data === 'object') {
                    if (Array.isArray(journeys.data.journeys) && journeys.data.journeys.length) {
                        return journeys.data.journeys[0];
                    }
                } else {
                    logger.warn('queryVBBJourneys: query returned no journey');
                }
            } catch(error) {
                logger.error('queryVBBJourneys: awaiting vbbRest.journeys: ' + error);
            }
        }));
    }

    async function processJourneys(journeys) {
        try {
            logger.info('processing journeys...');
            let gtfsAgencies = [], gtfsRoutes = [], gtfsShapes = [];

            // iterate over all journey legs (journey parts) to gather information about the routes
            await Promise.all(journeys.map(async (journey) => {
                if (journey && Array.isArray(journey.legs) && journey.legs.length) {
                    await Promise.all(journey.legs.map(async (route) => {
                        // line of a transport operator on this route
                        const line = route.line;
                        if (line) {
                            // transport operator (agency)
                            const operator = line.operator;
                            if (operator) {
                                gtfsAgencies.push({
                                    id: operator.id,
                                    name: operator.name,
                                    // should be a mandatory value according to GTFS / NGSI data model, but is not provided by the vbb REST API 
                                    url: ''
                                });

                                const routeOrigin = route.origin;
                                const routeDestination = route.destination;
                                const lineColor = line.color;
                                // try to map a FTPF mode to a GTFS-defined route type
                                const routeType = GTFS.getRouteTypeForFTPFmode[line.mode];
                                // route object
                                gtfsRoutes.push({
                                    // format of a route id is not specified by GTFS -> compose in this format: <ROUTE_ORIGIN_STOP_ID>-<ROUTE_DEST_STOP_ID>
                                    id: `${routeOrigin.id}-${routeDestination.id}`,
                                    name: line.name ? `${line.name} - ${route.direction}` : route.direction,
                                    shortName: line.name,
                                    routeType: (routeType === 'number') ? routeType.toString() : '0',
                                    operatedBy: operator.id,
                                    // if colors are given, expect them to be in hex format -> remove leading '#' to have value in GTFS-defined format
                                    routeColor: (lineColor && (lineColor.bg === 'string')) ? lineColor.bg.trim().replace(/^#/, '') : 'FFFFFF',
                                    routeTextColor: (lineColor && (lineColor.fg === 'string')) ? lineColor.fg.trim().replace(/^#/, '') : '000000'
                                });

                                // trip object for a route
                                const trip = await vbbRest.trip(route.tripId, {
                                    lineName: line.name,
                                    // if set to true, trip object will contain a GeoJSON FeatureCollection of both Points near to each stop and intermediate Points along the route
                                    // (each of which serves as partial coordinate of a LineString to be built)
                                    polyline: true
                                });
                                if (trip && typeof trip.data === 'object') {
                                    // filter coordinates from the returned FeatureCollection
                                    const polyline = trip.data.polyline;
                                    if (polyline && Array.isArray(polyline.features)) {
                                        // find index of feature that contains the coordinates of the route's origin
                                        const featureStartIndex = polyline.features.findIndex(feature => {
                                            // feature has a describing properties object and its 'id'-property equals stop id of route's origin
                                            return (feature.properties && feature.properties.id === routeOrigin.id);
                                        });
                                        // find index of feature that contains the coordinates of the route's destination
                                        const featureEndIndex = polyline.features.findIndex(feature => {
                                            // feature has a describing properties object and its 'id'-property equals stop id of route's destination
                                            return (feature.properties && feature.properties.id === routeDestination.id);
                                        });
                                        // start and end index for all Point coordinates have been found
                                        if (featureStartIndex > -1 && featureEndIndex > -1) {
                                            const lineStringCoordinates = polyline.features
                                                .filter((feature, index) => {
                                                    // feature (Point) is within index range
                                                    if (index >= featureStartIndex && index <= featureEndIndex) {
                                                        return (feature.geometry && feature.geometry.type === 'Point' && Array.isArray(feature.geometry.coordinates));
                                                    }
                                                })
                                                // return all partial coordinates of the route as elements of a new array (the resulting LineString coordinates array)
                                                .map(feature => feature.geometry.coordinates);
                                            
                                            // create a shape object for the travel path on this route
                                            gtfsShapes.push({
                                                // format of a route id is not specified by GTFS -> compose in this format: <ROUTE_ORIGIN_STOP_ID>-<ROUTE_DEST_STOP_ID>
                                                id: `${routeOrigin.id}-${routeDestination.id}`,
                                                coordinates: lineStringCoordinates
                                            });
                                        }
                                    }
                                } else {
                                    logger.warn(`processJourneys: query returned no trip with id '${route.tripId}' and line name '${line.name}'`);
                                }
                            }
                        }
                    }));
                }
            }));

            // transform data objects into corresponding NGSI entity objects
            const transformedNGSIagencies = transformIntoNGSI(gtfsAgencies, 'GtfsAgency');
            const transformedNGSIroutes = transformIntoNGSI(gtfsRoutes, 'GtfsRoute');
            const transformedNGSIshapes = transformIntoNGSI(gtfsShapes, 'GtfsShape');

            //--> start tasks simultaneously
            // - create or update GtfsAgency/GtfsRoute/GtfsShape entities in NGSI Context Broker
            const createUpdateAgenciesTasksV2 = BROKERS.v2.map(v2Url => cbV2.createOrUpdateEntities(v2Url, transformedNGSIagencies.v2));
            const createUpdateAgenciesTasksLD = BROKERS.ld.map(ldUrl => cbLD.createOrUpdateEntities(ldUrl, transformedNGSIagencies.ld));
            const createUpdateRoutesTasksV2 = BROKERS.v2.map(v2Url => cbV2.createOrUpdateEntities(v2Url, transformedNGSIroutes.v2));
            const createUpdateRoutesTasksLD = BROKERS.ld.map(ldUrl => cbLD.createOrUpdateEntities(ldUrl, transformedNGSIroutes.ld));
            const createUpdateShapesTasksV2 = BROKERS.v2.map(v2Url => cbV2.createOrUpdateEntities(v2Url, transformedNGSIshapes.v2));
            const createUpdateShapesTasksLD = BROKERS.ld.map(ldUrl => cbLD.createOrUpdateEntities(ldUrl, transformedNGSIshapes.ld));
            //<--

            //--> wait for tasks to finish
            for (const taskV2 of createUpdateAgenciesTasksV2) await taskV2;
            for (const taskLD of createUpdateAgenciesTasksLD) await taskLD;
            for (const taskV2 of createUpdateRoutesTasksV2) await taskV2;
            for (const taskLD of createUpdateRoutesTasksLD) await taskLD;
            for (const taskV2 of createUpdateShapesTasksV2) await taskV2;
            for (const taskLD of createUpdateShapesTasksLD) await taskLD;
            //<--
        } catch(error) {
            logger.error('processJourneys: ', error);
        }
    }

    async function queryAndImportData() {
        try {
            logger.info('=== BEGIN of queryAndImportData interval ===');
            
            // - query stations
            const stations = await queryVBBStations();
            // - extract stops from stations
            const arrayOfStopArrays = stations.map(station => station.stops);
            const stops = [].concat(...arrayOfStopArrays);
            logger.info(`queried ${stations.length} stations and ${stops.length} stops`);
            // - transform stations and stops into NGSI
            const transformedNGSIstations = transformIntoNGSI(stations, 'GtfsStation');
            const transformedNGSIstops = transformIntoNGSI(stops, 'GtfsStop');

            //--> start tasks simultaneously
            // - create or update GtfsStation/GtfsStop entities in NGSI Context Broker
            const createUpdateStationsTasksV2 = BROKERS.v2.map(v2Url => cbV2.createOrUpdateEntities(v2Url, transformedNGSIstations.v2));
            const createUpdateStationsTasksLD = BROKERS.ld.map(ldUrl => cbLD.createOrUpdateEntities(ldUrl, transformedNGSIstations.ld));
            const createUpdateStopsTasksV2 = BROKERS.v2.map(v2Url => cbV2.createOrUpdateEntities(v2Url, transformedNGSIstops.v2));
            const createUpdateStopsTasksLD = BROKERS.ld.map(ldUrl => cbLD.createOrUpdateEntities(ldUrl, transformedNGSIstops.ld));
            // - query journeys (TODO query all possible journeys of all possible connections (based on available stations): just take some selected journeys for now)
            const queryingJourneys = queryVBBJourneys(/*stations*/);
            //<--

            //--> wait for tasks to finish
            for (const taskV2 of createUpdateStationsTasksV2) await taskV2;
            for (const taskLD of createUpdateStationsTasksLD) await taskLD;
            for (const taskV2 of createUpdateStopsTasksV2) await taskV2;
            for (const taskLD of createUpdateStopsTasksLD) await taskLD;
            //<--

            // - wait for the journey query to finish and process journeys 
            //   (includes extraction, NGSI transformation and entity creation/update of transport operators, routes and geo shape information)
            const journeys = await queryingJourneys;
            logger.info(`queried ${journeys.length} journeys`);
            await processJourneys(journeys);

            logger.info('=== END of queryAndImportData interval ===');
        } catch(error) {
            logger.error('queryAndImportData: ', error);
        }
    }

    // init application
    async function init() {
        logger.info('=== application started ===');
        await queryAndImportData();
        // keep re-querying / importing VBB public transport data every VBBREST_QUERY_INTERVAL seconds [default: 86400 seconds (24h)]
        setInterval(queryAndImportData, (process.env.VBBREST_QUERY_INTERVAL || 86400) * 1000);
    }

    init();

}, (process.env.APP_START_DELAY || 20) * 1000);