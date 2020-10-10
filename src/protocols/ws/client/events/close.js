module.exports = async (ws, code, reason) => {
    const dateString = new Date().toLocaleString();

    await db.sessions.update({
        active: false,
        closed_at: dateString
    }, {
        where: {
            session_id: ws.session_id
        }
    });

    const timeout = config.delete_sessions_after;

    setTimeout(async () => {
        const session = db.sessions.findByPk(ws.session_id);

        if (!session.active) {
            await db.sessions.destroy({
                where: {
                    session_id: ws.session_id
                }
            });
            process.emit('debug', `Session with id ${ws.session_id} has been deleted.`, 'database');
        }
    }, timeout);

    process.emit('debug',
        `Session with id ${ws.session_id} closed with code "${code}" and reason "${reason}". Session was queued to be deleted in ${functions.time.textFormat(timeout, true)}.`,
        'ws'
    );
};
