const logger = require('../../modules/logger');
const { inspect } = require('util');

module.exports = (req, res) => {
    logger.warn(`Unhandled request received:
    URL: ${req.path}
    Protocol: ${req.protocol}
    Body: ${inspect(req.body)}
    Header: ${inspect(req.headers)}`, req.protocol);
    res.status(404).send('Not found');
};
