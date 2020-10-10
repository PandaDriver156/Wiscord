const fs = require('fs');
const nexe = require('nexe');
const util = require('util');

global.functions = require('./modules/functions');
global.constants = require('./modules/constants');

const config = functions.loadConfigFile();

if (!fs.existsSync('./dist'))
    fs.mkdirSync('./dist');

nexe.compile({
    input: 'src/index.js',
    output: 'dist/Wiscord',
    resources: ['src/**/*'],
    targets: [
        {
            platform: process.platform,
            arch: process.arch,
            version: '12.16.2'
        }
    ]
}).then(() => {
    fs.writeFileSync('./dist/config.js', `module.exports = ${util.inspect(config)};\n`);
});
