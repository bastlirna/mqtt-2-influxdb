const mqtt = require('mqtt');
const EventEmitter = require('events');

const log = require("./logger.js")("mqtt");

// ---

class MqttClient extends EventEmitter  {

    constructor (config) {
        super();

        this.id = 0;

        this.config = config;
        this.topics = [];
        this.connected = false;

        this.config.clientId = 'mqtt2influxdb_' + Math.random().toString(16).substr(2, 8);

        this.statBeginId = 0;
    }

    connect () {
        log.info("Connecting to %s://%s:%s (client ID %s)", this.config.protocol, this.config.host, this.config.port, this. config.clientId);

        var client = this.client  = mqtt.connect(this.config);

        client.on('connect', () => {
            log.info("Connected");
            

            this.topics.forEach(t => {
                log.info("Subscribe to '%s'", t);
                client.subscribe(t);
            });

            this.connected = true; 
        });
        
        client.on("reconnect", (e) => {
            log.debug("Try to reconnect", e);
        });

        client.on("offline", (e) => {
            log.warn("Broker is offline", e);
        });

        client.on("error", (e) => {
            log.error("error", e);
        });

        client.on('message', (topic, message) => {
            this.id++;
            log.trace("Message #%s '%s'", this.id, topic, message.toString());

            this.emit("message", this.id, topic, message.toString());
        });

    }

    subscribe (topic) {
        this.topics.push(topic);

        if (this.connected) {
            this.client.subscribe(topic);
        }
    }

    publish (topic, payload) {
        if (this.connected == false) {
            return;
        }

        log.debug("Publish message '%s' '%s'", topic, payload);

        this.client.publish(topic.toString(), payload.toString(), {qos: 0, retain: false});
    }

    collectStats () {
        var interval = this.id - this.statBeginId;

        this.statBeginId = this.id;

        return {
            total: this.id,
            interval: interval
        }
    }
}

// ---

exports.MqttClient = MqttClient;
