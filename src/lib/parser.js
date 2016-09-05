var log = require("./logger.js")("parser");

// ---

class MessageParser {

    constructor (settings) {
        this.settings = {
            mode: settings.mode || "auto",
            static_filed: settings.static_filed || "payload",
            text_filed: settings.text_filed || "text",
            numeric_filed: settings.numeric_filed || "value",
            numeric_parser_mode: settings.numeric_parser_mode || "tolerant"
        };

        this.initParser();
    }

    initParser () {
        switch (this.settings.numeric_parser_mode){

            case "strict":
                var regx = /^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$/;
                this._numericParser = (value) => {
                    if (regx.test(value)) {
                        return parseFloat(value);
                    }
                    return Number.NaN;
                }
                break;

            case "tolerant":
                this._numericParser = (value) => parseFloat(value);
                break;

            case "eager":
                var regx = /([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)/;
                this._numericParser = (value) => {
                    var m = regx.exec(value);
                    if (m != null) {
                        return parseFloat(m[1]);
                    }
                    return Number.NaN;
                }
                break;

            default:
                throw "Unknown parser '" + this.settings.numeric_parser_mode + "'";
        }
    }

    parse (id, topic, payload) {

        var t = this.parseTopic(id, topic);
        var v = this.parsePayload(id, payload);

        if (t == null) {
            return null;
        }

        return {
            name: t.measurement,
            tags: t.tags,
            values: v
        }
    }

    parseTopic (id, topic) {

        topic = topic.trim();

        if (topic.charAt(0) == "/") {
            topic = topic.substr(1);
        }

        if (topic.charAt(topic.length-1) == "/") {
            topic = topic.substr(0, topic.length - 1);
        }

        if (topic == "") {
            return null;
        }

        var parts = topic.split("/");

        // measurement
        var measurement = parts[0];

        // tags
        var tags = {
            topic: topic
        };

        for(var i = 0; i < parts.length; i++) {
            tags["tp" + i] = parts[i];
        }

        // result
        var m = {
            measurement: measurement,
            tags: tags
        };

        return m;
    };

    parsePayload (id, payload) {

        var result = {};

        if (this.settings.mode == "static") {

            
            result[this.settings.static_filed] = payload;

        } else {
            
            var num = this._numericParser(payload.trim());

            if (!isNaN(num)) {

                log.trace("Message #%s payload is number", id);
                result[this.settings.numeric_filed] = num;
            } else {
                log.trace("Message #%s payload is text", id);

                result[this.settings.text_filed] = payload;
            }
        }
        
        return result;
    };

}

// ---

exports.MessageParser = MessageParser;
