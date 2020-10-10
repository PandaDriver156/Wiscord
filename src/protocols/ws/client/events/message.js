const { inspect } = require('util');
const { parse } = JSON;

module.exports = (ws, msg) => {
    try {
        msg = parse(msg);
    } catch { } // eslint-disable-line

    const opName = Object.keys(constants.opcodes).find(key => constants.opcodes[key] === msg.op);
    const opCb = WSOperations.get(opName);
    if (opCb)
        opCb(ws, msg);

    else {
        let output;
        try {
            output = '(parsed) \n' + inspect(parse(msg));
        } catch {
            output = msg;
        }
        logger.warn(`Unhandled message received: ${inspect(output)}`, 'ws');
    }
};
