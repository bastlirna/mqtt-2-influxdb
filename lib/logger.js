const util = require("util");
const colors = require('colors/safe');

// ---

const LEVELS = ["trace", "debug", "info", "warn", "error"];
const LEVELS_SHORT = ["TRAC", "DBG ", "INFO", "WARN", "ERR!"];

const COLORS = ["gray", "white", "green", "yellow", "red"];

// --- Named Logger ---

class NamedLogger {
    constructor (logger, name) {
        this.logger = logger;
        this.name = name;
    }

    log (level, message) {
        this.logger.log(level, this.name, message);
    }
}

LEVELS.forEach((level, i) => {
    NamedLogger.prototype[level] = function (msg) {
        this.log(i, util.format.apply(util.format, arguments));
    }
});

// --- Loger ---

var logger = function (name) {
    return new NamedLogger(logger, name);
}

logger.levels = LEVELS;

LEVELS.forEach((level, i) => logger.levels[level] = i);

logger.log = function (level, name, message) {

    if (level < logger.level) return; 

    var l = LEVELS_SHORT[level].toUpperCase().substr(0, 4)
    var cl = colors[COLORS[level]](l)

    console.log('%s [%s]\t%s', cl, colors.gray(name), message);
}

logger.level = logger.levels.trace;

// --- exports ----------------------------------------------------------------

module.exports = logger;
