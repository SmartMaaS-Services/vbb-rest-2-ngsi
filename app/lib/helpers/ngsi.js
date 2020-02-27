const pino = require('pino');
const logger = pino({
    prettyPrint: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
        messageFormat: 'lib/helpers/ngsi.js - {msg}'
    }
});


const entityIdSuffix = (suffix) => (suffix ? ':' + suffix : '');

const sanitizeString = (value) => {
    // convert value into a string and remove UTF-8 control characters as well as any other forbidden character
    // see https://fiware-orion.readthedocs.io/en/master/user/forbidden_characters/index.html
    return ('' + value).replace(/[\x00-\x1F\x7F-\x9F<>"'=;()]/g, '');
};

const sanitizeIdFieldString = (value) => {
    // fields used as identifiers have some disallowed characters as specified here: http://fiware.github.io/specifications/ngsiv2/stable/ in 'Field syntax restrictions'
    // remove them in addition to the overall forbidden characters
    return sanitizeString(value).replace(/[\s&?\/#]/g, '');
};


module.exports = { entityIdSuffix, sanitizeString, sanitizeIdFieldString };