
const colors = require('ansi-colors');
const moment = require('moment');
const fs = require('fs');

const logToDir = config.logToDir;
if (!fs.existsSync(logToDir))
  fs.mkdirSync(logToDir);

/**
 * Logger class for easy and aesthetically pleasing console logging
 */
class Logger {
  static log(content, name, type = 'log') {
    const timestamp = `[${moment().format('YYYY-MM-DD HH:mm:ss')}]:`;
    let color;
    switch (type) {
      case 'log':
        color = colors.blue;
        break;

      case 'warn':
        color = colors.yellow;
        break;

      case 'error':
        color = colors.red;
        break;

      case 'debug':
        color = colors.green;
        break;

      case 'cmd':
        color = colors.white;
        break;

      case 'ready':
        color = colors.green;
        break;

      default:
        throw new TypeError('Logger type must be either warn, debug, log, ready, cmd or error.');
    }

    let nameString = '';

    if (name) {
      if (name instanceof Array)
        nameString = ' ' + name.forEach(n => {
          return `[${n}]`;
        }).join(' ');
      else nameString = ` [${name.toUpperCase()}]`;
    }

    console.log(`${timestamp} ${color(type.toUpperCase())}${nameString} ${content}`);

    if (logToDir) {
      fs.appendFileSync(`${logToDir}/${type === 'log' ? 'out' : type}.log`, `${timestamp}${nameString} ${content}\n`);
    }
  }

  static error(content, name) {
    Logger.log(content, name, 'error');
  }

  static warn(content, name) {
    Logger.log(content, name, 'warn');
  }

  static debug(content, name) {
    Logger.log(content, name, 'debug');
  }

  static cmd(content, name) {
    Logger.log(content, name, 'cmd');
  }

  static ready(content, name) {
    Logger.log(content, name, 'ready');
  }
}

module.exports = Logger;
