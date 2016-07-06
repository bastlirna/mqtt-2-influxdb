const mqtt = require('mqtt');

var client = mqtt.connect("mqtt://192.168.88.4");

var topic = "/test/rnd";

function send() {

    var payload = Math.random();

    client.publish(topic, payload.toString());
}

client.on("connect", () => {
    setInterval(send, 0);
});
