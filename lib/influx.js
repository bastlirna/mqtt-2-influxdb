const influx = require('influx');
const EventEmitter = require('events');

var log = require("./logger.js")("influx");

class InfluxClient extends EventEmitter {

    constructor (settings) {
        super();

        this.settings = settings;

        this.client = influx(this.settings);

        this.connectionCounter = 0;
        this.currentConnectionCounter = 0;
        this.maxCurrentConnections = 0;

        this.statBeginConnectionCounter = 0;

        log.info("Connect to %s://%s:%s (db: %s)", settings.protocol, settings.host, settings.port, settings.database);
    }

    store (id, topic, measurement) {

        this.connectionCounter++;
        this.currentConnectionCounter ++;
        this.maxCurrentConnections = Math.max(this.currentConnectionCounter, this.maxCurrentConnections);

        this.client.writePoint(measurement.name, measurement.values, measurement.tags, (err, response) => {
            
            this.currentConnectionCounter --;

            if (err) {

                var msg = err.message;

                if (msg.trim) {
                    msg = msg.trim();
                }

                log.error("Fail to store message #%s (%s): %s", id, topic, msg);
                this.emit("error", topic, msg);

            } else {
                log.trace("Message #%s store to '%s'", id, measurement.name);
            }

        });
    }

    collectStats () {

        var stat = {
            total: this.connectionCounter,
            interval: this.connectionCounter - this.statBeginConnectionCounter,
            maxConcurrent: this.maxCurrentConnections
        };

        this.statBeginConnectionCounter = this.connectionCounter;
        this.maxCurrentConnections = this.currentConnectionCounter;

        return stat;
    }

}

exports.InfluxClient = InfluxClient;
