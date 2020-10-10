exports.exec = async (req, res) => {
    let token = req.headers.authorization || null;

    if (!token)
        return res.status(401).send('No token provided');

    if (token.startsWith('Bot')) token = token.split(' ')[1];

    const userData = await db.user_datas.findOne({
        where: {
            token: token
        }
    });

    if (!userData) {
        return res.status(401).send('Invalid token');
    }

    res.status(200).send({
        url: `wss://${req.get('host')}:${config.port}/gateway`,
        shards: 1,
        session_start_limit: {
            total: 1000,
            remaining: 999,
            reset_after: 14400000
        }
    });
};
