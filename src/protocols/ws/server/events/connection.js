module.exports = (ws, req) => {
    process.emit('debug', 'New connection, URL: ' + req.url, 'ws');

    const url = new URL(req.url, `https://${req.headers.host}`);

    const urlPaths = req.url.split('/').slice(1);

    const connectionType = urlPaths[0];

    switch (connectionType) {
        case 'gateway':
            functions.initWsClient(ws, url);
            return ws.sendPayload('hello', {
                heartbeat_interval: config.heartbeat_interval
            });
        case 'auth':
            break;
    }
};
