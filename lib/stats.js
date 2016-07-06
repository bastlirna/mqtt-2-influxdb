var log = require("./logger.js")("stats");

class StatsReporter {

    constructor (settings, mqttClient, influxClient) {

        this.startTime = new Date().getTime();

        this.interval = parseFloat(settings["stats_interval"] || 60) * 1000;

        var statTopic = settings["mqtt_stats_topic"];

        if (statTopic) {
            if (statTopic.substr(-1) != "/") {
                statTopic += "/";
            }

            log.info("MQTT stat topics: '%s'", statTopic);
            this.statTopic = statTopic;
        }

        log.info("Collection interval %s sec", this.interval / 1000);

        this.mqttClient = mqttClient; 
        this.influxClient = influxClient;
    }

    start () {
        setTimeout(() => this._done(), this.interval);
    }

    _done () {
        this.collect();
        this.show();

        setTimeout(() => this._done(), this.interval);
    }

    collect() { 
        this.mqttStats = this.mqttClient.collectStats();
        this.influxStats = this.influxClient.collectStats();
    }

    show () {

        log.info("MQTT (%s) InfluxDb (%s)", 
            this._prettyPrint(this.mqttStats), 
            this._prettyPrint(this.influxStats));

        if (this.statTopic) {

            this.mqttClient.publish(this.statTopic + "uptime", Math.round((new Date().getTime() - this.startTime) / 1000));

            var mem = process.memoryUsage();

            this.mqttClient.publish(this.statTopic + "heapTotal", mem.heapTotal);
            this.mqttClient.publish(this.statTopic + "heapUsed", mem.heapUsed);

            this._publishStat("mqtt", this.mqttStats);
            this._publishStat("influx", this.influxStats);
        }
    }

    _publishStat(name, obj) {
        for(var n in obj) {
            this.mqttClient.publish(this.statTopic + name + "/" + n, obj[n]);
        }
    }

    _prettyPrint (obj) {
        return Object.keys(obj).map((n) => n + ": " + obj[n]).join(", ");
    }

}

exports.StatsReporter = StatsReporter;
