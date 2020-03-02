const axios = require('axios');
const pino = require('pino');
const logger = pino({
    prettyPrint: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
        messageFormat: 'lib/helpers/rest.js - {msg}'
    }
});


const sanitizeUrl = (url) => {
    if (typeof url !== 'string') {
        logger.warn(`sanitizeUrl: url '${url}' is not a string`);
        return url;
    }

    // only remove trailing slash for now
    return url.replace(/\/$/, '');
};

const stringifyUrlParamsObject = (params) => {
    let paramsString = '';
    if (typeof params === 'object') {
        Object.entries(params).forEach(([key, value], index, array) => {
            if (index == 0) {
                paramsString = '?'; 
            }
            paramsString += `${key}=${value}`;
            if (index < (array.length - 1)) {
                paramsString += '&'; 
            } 
        });
    }

    return paramsString;
};

/**
 * Executes a RESTful HTTP request
 * @param {*} method
 * @param {*} url
 * @param {*} headers
 * @param {*} body
 */
const executeRequest = (method, url, headers, body) => {
    if (!axios) {
        logger.error('executeRequest: axios library not found');
    }
    if (!method) {
        logger.error('executeRequest: no HTTP method given');
    }
    if (!url) {
        logger.error('executeRequest: no request URL given');
    }

    //logger.info(`executeRequest: ${method} '${url}'`);
    //logger.info(`=> headers: ${JSON.stringify(headers)}`);

    let requestConfig = {
        method: method,
        url: url,
        headers: headers
    };
    if (method === 'PUT' || method === 'POST' || method === 'PATCH') {
        //logger.info(`=> body:\n${JSON.stringify(body)}`);
        requestConfig.data = body;
    }

    return new Promise((resolve, reject) => {
        axios.request(requestConfig)
        .then(response => {
            //logger.info('executeRequest: RESPONSE');
            if (response.error) {
                logger.error(response);
            } else {
                //logger.info(`<= status: ${response.status} ${response.statusText}`);
                //logger.info(`<= headers: ${JSON.stringify(response.headers)}`);
                //logger.info(`<= body:\n${JSON.stringify(response.data)}`);
            }
            resolve(response);
        })
        .catch(error => {
            logger.error(`executeRequest - failed request: ${requestConfig.method} '${requestConfig.url}'`);
            logger.error(error);
            //reject(error);
            resolve(error);
        });
    });
};


module.exports = { sanitizeUrl, stringifyUrlParamsObject, executeRequest };