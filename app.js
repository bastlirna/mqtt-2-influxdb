const path = require("path");
const process = require("process");
const fs = require("fs");

var logger = require("./lib/logger.js");
var nconf = require("nconf");

var StatsReporter = require("./lib/stats.js").StatsReporter;
var MqttClient    = require("./lib/mqtt.js").MqttClient;
var InfluxClient    = require("./lib/influx.js").InfluxClient;
var MessageParser = require('./lib/parser.js').MessageParser;

var log = logger("app");

// ---

log.info("Application start");

// --- Load configuration ---

nconf
    .argv()
    .env()
    .defaults({config: 'config.ini'});

var configFile = path.resolve(process.cwd(), nconf.get("config"));

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

// --- Application ---

var mqttClient = new MqttClient(nconf.get("mqtt"));
var influxClient = new InfluxClient(nconf.get("influxdb"))
var parser = new MessageParser(nconf.get("conversion"));

var stats = new StatsReporter(nconf.get("global"), mqttClient, influxClient);

stats.start();

var topics = nconf.get("topics");

for (var i in topics) {
    mqttClient.subscribe(i);
}

mqttClient.on("message", (id, topic, payload) => {

    var result = parser.parse(id, topic, payload);

    //console.log(result);

    influxClient.store(id, topic, result);

});

var errTopic = nconf.get("global:mqtt_error_topic");

if (errTopic) {
    log.info("Error topic: %s", errTopic);

    influxClient.on("error", (topic, message) => {
        mqttClient.publish(errTopic, "Error on '" + topic + "': " + message);
    });
}

mqttClient.connect();

log.debug("Init done");
