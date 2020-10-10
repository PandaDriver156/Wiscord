(async () => {
    const https = require('https');
    const fs = require('fs');
    const express = require('express');
    const { Server: WsServer } = require('ws');
    const bodyParser = require('body-parser');
    const app = express();
    const { Sequelize } = require('sequelize');

    global.functions = require('./modules/functions');
    global.constants = require('./modules/constants');
    global.config = functions.loadConfigFile();
    global.logger = require('./modules/logger');
    global.WSOperations = new Map();
    global.WSEvents = new Map();

    logger.log('Launching Wiscord API...');

    if (config.debug)
        process.on('debug', logger.debug);

    // Initialize database

    const sequelize = new Sequelize(config.sequelizeOptions);

    global.sequelize = sequelize;

    global.db = {};
    for (const name in constants.databaseOptions) {
        global.db[name] = sequelize.define(name, constants.databaseOptions[name], {
            underscored: true
        });
    }

    await sequelize.sync();

    // Queue sessions to be closed
    const transaction = await sequelize.transaction();
    try {
        const sessions = await db.sessions.findAll({ transaction });
        if (!sessions.length)
            await transaction.commit();
        else {
            for (let i = 0; i < sessions.length; i++) {
                const session = sessions[i];
                const deleteAt = Math.max(0, config.delete_sessions_after - (Date.now() - Date.parse(session.closed_at)));
                setTimeout(async () => {
                    await session.destroy({
                        transaction
                    });

                    process.emit('debug', `Session with id ${session.session_id} has been deleted.`, 'database');
                    if (sessions.length - 1 === i)
                        await transaction.commit();
                }, deleteAt);
            }
        }
    } catch {
        await transaction.rollback();
    }

    process.package = require('../package.json');

    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());

    const httpsServer = https.createServer(functions.getCertificates(), app);

    const wss = new WsServer({
        server: httpsServer,
        clientTracking: true
    });

    // Shutdown gracefully
    process.on('SIGINT', async () => {
        logger.cmd('SIGINT detected');
        process.emit('debug', 'Closing WebSocket connections...');
        for (const client of wss.clients) {
            client.close(4000, 'API is shutting down');
            await functions.wait(100);
        }

        process.emit('debug', 'Exiting...');
        process.exit();
    });

    const basePath = `${process.cwd()}/src/protocols`;
    // HTTP endpoint handler

    const httpPath = `${basePath}/http`;
    try {
        app.use(require(`${httpPath}/precheck`));
    } catch { } // eslint-disable-line
    const httpEndpoints = fs.readdirSync(`${httpPath}/endpoints`);
    for (const endpoint of httpEndpoints)
        functions.initHttpEndpointDir(`${httpPath}/endpoints/${endpoint}`, app);

    try {
        app.use(require(`${httpPath}/postcheck`));
    } catch { } // eslint-disable-line

    // WS
    const wsPath = `${basePath}/ws`;
    functions.setupEvents(wss, `${wsPath}/server/events`);
    functions.setupEvents(null, `${wsPath}/client/events`, WSEvents);
    functions.setupEvents(null, `${wsPath}/client/operations`, WSOperations);

    httpsServer.listen(config.port, () => {
        const fixedMsUptime = (process.uptime() * 1000).toFixed(2);
        const bootTime = functions.time.textFormat(fixedMsUptime);
        logger.ready(`Wiscord API Server running on port ${httpsServer.address().port}, took ${bootTime}`);
    });
})();
