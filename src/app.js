const path = require("path");
const process = require("process");
const fs = require("fs");

const logger = require("./lib/logger.js");
const nconf = require("nconf");

const StatsReporter = require("./lib/stats.js").StatsReporter;
const MqttClient    = require("./lib/mqtt.js").MqttClient;
const InfluxClient    = require("./lib/influx.js").InfluxClient;
const MessageParser = require('./lib/parser.js').MessageParser;

const log = logger("app");

// ---

log.info("Application start");

// Configuration --------------------------------------------------------------

nconf
    .argv()
    .env()
    .defaults({config: 'config.ini'});

const configFile = path.resolve(process.cwd(), nconf.get("config"));

// check if config is accessible
fs.accessSync(configFile, fs.R_OK);
    
log.info("Config file: ", configFile);

nconf.file({ file: configFile, format: nconf.formats.ini });

nconf.required(['mqtt:host', 'influxdb:host']);

if (nconf.get("verbose")) {
    logger.level = logger.levels.trace;
} else {
    logger.level = logger.levels.info;
}

// Application core -----------------------------------------------------------

const mqttClient = new MqttClient(nconf.get("mqtt"));
const influxClient = new InfluxClient(nconf.get("influxdb"))
const parser = new MessageParser(nconf.get("conversion"));
const stats = new StatsReporter(nconf.get("global"), mqttClient, influxClient);

// subscribe
for (var i in nconf.get("topics")) {
    mqttClient.subscribe(i);
}

// on new message
mqttClient.on("message", (id, topic, payload) => {
    // convert
    var result = parser.parse(id, topic, payload);
    // store into influx
    influxClient.store(id, topic, result);
});

// send errors to MQTT (if teher is desired topic in config)
var errTopic = nconf.get("global:mqtt_error_topic");
if (errTopic) {
    log.info("Error topic: %s", errTopic);

    influxClient.on("error", (topic, message) => {
        mqttClient.publish(errTopic, "Error on '" + topic + "': " + message);
    });
}

// let's get started
stats.start();
mqttClient.connect();

log.debug("Application up and running...");
