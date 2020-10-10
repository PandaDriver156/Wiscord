module.exports = async (ws, msg) => {
    process.emit('debug', 'Client is attempting to reconnect.', 'ws');

    const session = await db.sessions.findByPk(msg.d.session_id);

    if (!session) {
        process.emit('debug', 'Client tried to resume an invalid session.', 'ws');
        return ws.sendPayload('invalid_session', false);
    }

    await db.sessions.update({
        active: true
    }, {
        where: {
            session_id: msg.d.session_id
        }
    });

    ws.session_id = msg.d.session_id;

    ws.sendPayload('RESUMED');
};
