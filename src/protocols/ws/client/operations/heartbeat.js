module.exports = async (ws) => {
    const time = Date.now();
    await ws.sendPayloadSync('heartbeat_ack');
    process.emit('debug', `Received heartbeat from client, latency: ${Math.round(Date.now() - time)}ms`, 'ws');
};
