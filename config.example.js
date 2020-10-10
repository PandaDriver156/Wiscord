const { Transaction } = require('sequelize');

const config = {
    port: 3000, // Port number where the Wiscord API should run.
    heartbeat_interval: 45000, // How often clients should send a heartbeat
    debug: false, // Whether to enable very detailed logging. Must be set to false, true or no-database (will log everything except database operations)
    logToDir: './logs', // Whether to save logs into a foler. Must be set to either false or the name of the directory.
    delete_sessions_after: 300000, // How many milliseconds to wait before deleting a client's session if the client disconnected.
    sequelizeOptions: { // Options for the Sequelize ORM
        dialect: 'sqlite',
        storage: './data/sqlite.db', // don't forget to remove 'storage' and 'transactionType' if you change dialect, as they're only available in sqlite.
        transactionType: Transaction.TYPES.IMMEDIATE
    }
};

config.sequelizeOptions.logging = config.debug && config.debug !== 'no-database' ? msg => process.emit('debug', msg, 'sequelize') : false;

module.exports = config;
