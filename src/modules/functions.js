const fs = require('fs');
// const util = require('util');
const zlib = require('zlib');
const { Router } = require('express');
const selfsigned = require('selfsigned');
const { stringify } = JSON;

const functions = {

    loadConfigFile: (path = `${process.cwd()}/config.js`, writeIfNotExists = true) => {
        let config;
        try {
            config = require(path);
        } catch (err) {
            if (err.code === 'MODULE_NOT_FOUND') {
                config = constants.defaultConfig;
                /* if (writeIfNotExists)
                    // fs.writeFileSync(path, `module.exports = ${util.inspect(config, { depth: 0 })};\n`);
                    functions.saveConfig(path, config); */
            }
        }

        return config;
    },

    saveConfig: (path, configData) => {
        checkObject(configData);
        console.log(configData);
        fs.writeFileSync(path, `module.exports = ${stringify(configData, null, 4)}`);

        function checkObject(object) {
            for (const [key, value] of Object.entries(object)) {
                // Functions need to be stringified manually, otherwise they will be "[Function: functionName]"
                if (typeof value === 'function')
                    object[key] = value.toString().trim();
                if (value && value.constructor === Object) {
                    object[key] = checkObject(object[key]);
                }
            }

            return object;
        }
    },

    getCertificates: (path = './certificate') => {
        let key;
        let cert;

        try {
            key = fs.readFileSync(`${path}/key.pem`);
            cert = fs.readFileSync(`${path}/cert.pem`);
        } catch (err) {
            if (!fs.existsSync(path))
                fs.mkdirSync(path);

            const generated = selfsigned.generate(null, { days: 365 });
            key = generated.private;
            cert = generated.cert;

            fs.writeFileSync(`${path}/key.pem`, key);
            fs.writeFileSync(`${path}/cert.pem`, cert);

            process.emit('debug', 'Generated self-signed certifcate');
        }

        return { key, cert };
    },

    loadCommentedJson: (path) => {
        const commentRegex = /(\/\/.*)/g;
        const json = fs.readFileSync(path).toString().replace(commentRegex, '');

        const parsed = JSON.parse(json);

        return parsed;
    },

    initHttpEndpointDir: (path, parent /* Parent is either a router, or the express app itself. */) => {
        if (fs.statSync(path).isDirectory()) {
            const router = new Router();

            parent.use(`/${path.split('/').pop()}`, router);
            const dir = fs.readdirSync(path);
            for (const file of dir) {
                const filePath = `${path}/${file}`;
                functions.initHttpEndpointDir(filePath, router);
            }
            return;
        }

        // The current 'dir' is a file

        const name = `${path.split('/').pop().split('.')[0]}`;
        let endpointPath = `/${name}`;

        if (!path.endsWith('.js')) {
            const fileContent = fs.readFileSync(path).toString();
            if (name === 'index')
                endpointPath = '/';
            parent.get(endpointPath, (req, res) => {
                res.send(fileContent);
            });
            return;
        }

        const handler = require(path);

        const methods = ['get', 'post', 'put', 'patch', 'delete'];

        if (methods.includes(name))
            parent[name]('/', handler.exec);

        else {
            if (name === 'index')
                endpointPath = '/';

            parent.use(endpointPath, handler.exec);
        }

        if (handler.aliases) {
            for (const alias of handler.aliases)
                parent.use(`/${alias}`, handler.exec);
        }
    },

    initWsClient: (ws, url) => {
        ws.sendPayload = (op, data, options = {}, cb) => {
            let payload = {
                op: null,
                d: null,
                s: null,
                t: null
            };
            if (typeof op === 'string') {
                if (op === op.toUpperCase()) {
                    payload.t = op;
                    payload.op = 0;
                } else
                    payload.op = Object.values(constants.opcodes).find(opNumber => opNumber === constants.opcodes[op]) || op;
            } else
                payload.op = op;

            payload.d = data;

            payload = stringify(payload);

            if (url.searchParams.get('compress'))
                payload = zlib.deflateSync(payload);
            return ws.send(payload, options, cb);
        };

        ws.sendPayloadSync = async (op, data, options) => {
            return new Promise((res, rej) => {
                ws.sendPayload(op, data, options, () => res());
            });
        };

        for (const op of WSEvents) {
            ws.on(op[0], op[1].bind(null, ws));
        }
    },

    setupEvents: (eventMitter /* The EventMitter instance (optional) */, path /* path to the events folder */, collection /* collection to save the events to (optional) */, bindEventMitter = false) => {
        const eventFileNames = fs.readdirSync(path);
        for (const eventFileName of eventFileNames) {
            if (!eventFileName.endsWith('.js'))
                return;

            let cb = require(`${path}/${eventFileName}`);

            if (bindEventMitter && eventMitter)
                cb = cb.bind(null, eventMitter);

            const eventName = eventFileName.split('.js')[0];

            if (collection)
                collection.set(eventName, cb);

            if (eventMitter)
                eventMitter.on(eventName, cb);
        }
    },

    generateSnowflake: (date = Date.now()) => {
        date = BigInt(date);
        const epoch = BigInt(1420070400000);
        return (date - epoch) << BigInt(22);
    },

    generateRandomString: (maxLength = 40, lowest = 30) => {
        maxLength -= lowest;
        const length = Math.round(Math.random() * maxLength + lowest);
        let passwd = '';
        for (let i = 0; i < Math.ceil(length / 11); i++) {
            const rn = Math.random();
            const stringed = rn.toString(36).slice(2);
            passwd += stringed;
        }
        passwd = passwd.split('');

        if (passwd.length > length)
            passwd.length = length;

        for (let i = 0; i < (passwd.length - 1); i++) {
            if (isNaN(passwd[i]) && Math.random() > 0.5)
                passwd[i] = passwd[i].toUpperCase();
        }
        passwd = passwd.join('');
        return passwd;
    },

    wait: (ms) => {
        const promise = new Promise(res => {
            setTimeout(res, ms);
        });

        return promise;
    },

    time: {
        textFormat: (ms, long = false) => {
            const formats = {
                long: {
                    days: ' days',
                    hours: ' hours',
                    minutes: ' minutes',
                    seconds: ' seconds'
                },
                short: {
                    days: 'd',
                    hours: 'h',
                    minutes: 'm',
                    seconds: 's'
                }
            };
            if (isNaN(Number(ms)))
                return null;

            const returnFormat = long ? 'long' : 'short';

            const converted = functions.time.convertMs(ms);
            const days = `${converted.days}${formats[returnFormat].days} `;
            const hours = `${converted.hours}${formats[returnFormat].hours} `;
            const minutes = `${converted.minutes}${formats[returnFormat].minutes} `;
            const seconds = `${converted.seconds}${formats[returnFormat].seconds}`;

            const overall = `${parseInt(days) !== 0 ? days : ''}${parseInt(hours) !== 0 ? hours : ''
                }${parseInt(minutes) !== 0 ? minutes : ''}${parseInt(seconds) !== 0 ? seconds : ''
                }` || `${ms}ms`;
            return overall;
        },
        colonFormat: (ms = NaN) => {
            if (isNaN(Number(ms)))
                return null;
            let { days, hours, minutes, seconds } = functions.time.convertMs(ms, true);
            if (days.length === 1) days = `0${days}`;
            if (hours.length === 1) hours = `0${hours}`;
            if (minutes.length === 1) minutes = `0${minutes}`;
            if (seconds.length === 1) seconds = `0${seconds}`;

            const overall = `${days !== '00' ? `${days}:` : ''}${hours !== '00' ? `${hours}:` : ''}${minutes}:${seconds}`;
            return overall;
        },
        convertMs: (ms, returnString = false) => {
            const { floor } = Math;
            let totalSeconds = ms / 1000;
            const days = floor(totalSeconds / 86400);
            totalSeconds %= 86400;
            const hours = floor(totalSeconds / 3600);
            totalSeconds %= 3600;
            const minutes = floor(totalSeconds / 60);
            totalSeconds %= 60;
            const seconds = floor(totalSeconds % 60);

            return returnString ? {
                days: String(days),
                hours: String(hours),
                minutes: String(minutes),
                seconds: String(seconds)
            } : {
                    days,
                    hours,
                    minutes,
                    seconds
                };
        }
    }
};

module.exports = functions;
