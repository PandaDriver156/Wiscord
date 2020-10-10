const User = require('../../../../classes/User');

module.exports = async (ws, msg) => {
    process.emit('debug', `Received identification request from client, used client: ${msg.d.properties.browser || msg.d.properties.$browser}`, 'ws');

    const transaction = await sequelize.transaction();

    let token = msg.d.token;

    if (token.startsWith('Bot')) token = token.split(' ')[1];
    try {
        const { dataValues: userData } = await db.user_datas.findOne({
            where: {
                token
            }
        }, {
            transaction
        });

        const user = new User(userData);

        const sessionId = functions.generateRandomString();

        await db.sessions.create({
            session_id: sessionId,
            user_id: user.id,
            active: true
        }, {
            transaction
        });

        const userGuilds = await db.guild_members.findAll({
            where: {
                member_id: BigInt(user.id)
            },
            transaction
        });

        const guildDatas = await db.guild_datas.findAll({ transaction });

        const userGuildDatas = guildDatas.filter(guild => {
            return userGuilds.some(g => {
                return g.guild_id === guild.dataValues.id;
            });
        }).map(guild => guild.dataValues);

        await transaction.commit();

        ws.session_id = sessionId;

        await ws.sendPayloadSync('READY', {
            v: 6,
            user: user.publicProperties,
            private_channels: [],
            guilds: userGuildDatas.map(guild => {
                if (user.bot)
                    return {
                        id: guild.id,
                        unavaiable: true
                    };
                return guild;
            }),
            session_id: sessionId
        });
        process.emit('debug', 'Sent ready event to client', 'ws');
        if (user.bot)
            userGuildDatas.forEach(async guild => {
                await ws.sendPayloadSync('GUILD_CREATE', guild);
            });
    } catch (err) {
        logger.error(err);
        await transaction.rollback();
    }
};
