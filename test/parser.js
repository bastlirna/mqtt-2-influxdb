var assert = require('chai').assert;
var MessageParser = require('../lib/parser').MessageParser;
var logger = require('../lib/logger');

logger.level = 100;

var parser;

describe('MessageParser', function() {

    before(() => {
        parser = new MessageParser({});
    });

    describe('parseTopic', function() {
        
        it("should ignore empty message", () => {
            var r = parser.parseTopic(0, "");
            assert.isNull(r);
        });

        it('should skip / at begin', () => {
            var r1 = parser.parseTopic(0, "/m1/m2");
            var r2 = parser.parseTopic(0, "m1/m2");
            
            assert.deepEqual(r1, r2);
        });

        it('should skip / at the end', () => {
            var r1 = parser.parseTopic(0, "m1/m2/");
            var r2 = parser.parseTopic(0, "m1/m2");
            
            assert.deepEqual(r1, r2);
        });

        it('should trim spaces', () => {
            var r1 = parser.parseTopic(0, " /m1/m2/ ");
            var r2 = parser.parseTopic(0, "m1/m2");
            
            assert.deepEqual(r1, r2);
        });

        it('should get measurement name', () => {
            var r1 = parser.parseTopic(0, "m1");
            assert.equal(r1.measurement, "m1");
            
            var r2 = parser.parseTopic(0, "m1/m2");
            assert.equal(r2.measurement, "m1"); 
        });

        it('should get topic as tag', () => {
            var r = parser.parseTopic(0, "m1/a/b/c/d");
            assert.equal(r.tags.topic, "m1/a/b/c/d"); 
        });

        it('should get topic parts as tags', () => {
            var r = parser.parseTopic(0, "m1/a/b/c/d");

            var separator = "tp"
            assert.equal(r.tags[separator + 0], "m1", separator + 0);
            assert.equal(r.tags[separator + 1], "a", separator + 1); 
            assert.equal(r.tags[separator + 2], "b", separator + 2);
            assert.equal(r.tags[separator + 3], "c", separator + 3);
            assert.equal(r.tags[separator + 4], "d", separator + 4);
        });

    });

    describe('parsePayload', () => {

        describe("auto mode", () => {

            describe('filed name', () => {
                before(() => {
                    parser = new MessageParser({text_filed: "ttt", numeric_filed: "nnn"});
                });

                it('number', () => {
                    var p = parser.parsePayload(0, "123.456");
                    assert.deepEqual(p, { nnn: 123.456 });
                });

                it('text', () => {
                    var p = parser.parsePayload(0, "lorem ipsum");
                    assert.deepEqual(p, { ttt: "lorem ipsum" });
                });
            });

            describe('strict', () => {
                before(() => {
                    parser = new MessageParser({numeric_parser_mode: "strict"});
                });

                it('should detect number', () => {
                    var p = parser.parsePayload(0, "123.456");
                    assert.deepEqual(p, { value: 123.456 });
                });

                it('should detect negative number', () => {
                    var p = parser.parsePayload(0, "-123.456");
                    assert.deepEqual(p, { value: -123.456 });
                });

                it('should detect number even with spaces', () => {
                    var p = parser.parsePayload(0, "  123.456  ");
                    assert.deepEqual(p, { value: 123.456 });
                });

                it('should detect string with numbers as string', () => {
                    var p = parser.parsePayload(0, "123.456 lorem ipsum");
                    assert.deepEqual(p, { text: "123.456 lorem ipsum" });
                });

                it('should detect string', () => {
                    var p = parser.parsePayload(0, "lorem ipsum");
                    assert.deepEqual(p, { text: "lorem ipsum" });
                });

                it('should detect empty string as string', () => {
                    var p = parser.parsePayload(0, "");
                    assert.deepEqual(p, { text: "" });
                });
            });

            describe('tolerant', () => {
                before(() => {
                    parser = new MessageParser({numeric_parser_mode: "tolerant"});
                });

                it('should detect number', () => {
                    var p = parser.parsePayload(0, "123.456");
                    assert.deepEqual(p, { value: 123.456 });
                });

                it('should detect negative number', () => {
                    var p = parser.parsePayload(0, "-123.456");
                    assert.deepEqual(p, { value: -123.456 });
                });

                it('should detect number even with spaces', () => {
                    var p = parser.parsePayload(0, "  123.456  ");
                    assert.deepEqual(p, { value: 123.456 });
                });

                it('should detect number in text if begin with numbers', () => {
                    var p = parser.parsePayload(0, "123.456 lorem ispum");
                    assert.deepEqual(p, { value: 123.456 });
                });

                it('should detect string', () => {
                    var p = parser.parsePayload(0, "lorem ipsum");
                    assert.deepEqual(p, { text: "lorem ipsum" });
                });

                it('should detect empty string as string', () => {
                    var p = parser.parsePayload(0, "");
                    assert.deepEqual(p, { text: "" });
                });
            });

            describe("eager", () => {
                before(() => {
                    parser = new MessageParser({numeric_parser_mode: "eager"});
                });

                it('should detect number', () => {
                    var p = parser.parsePayload(0, "123.456");
                    assert.deepEqual(p, { value: 123.456 });
                });

                it('should detect negative number', () => {
                    var p = parser.parsePayload(0, "-123.456");
                    assert.deepEqual(p, { value: -123.456 });
                });

                it('should detect number inside text', () => {
                    var p = parser.parsePayload(0, "Lorem ipsum 123.456 post dolorem 42.");
                    assert.deepEqual(p, { value: 123.456 });
                });

                it('should detect string', () => {
                    var p = parser.parsePayload(0, "lorem ipsum");
                    assert.deepEqual(p, { text: "lorem ipsum" });
                });

                it('should detect empty string as string', () => {
                    var p = parser.parsePayload(0, "");
                    assert.deepEqual(p, { text: "" });
                });
            });
        });

        describe("static mode", () => {

            before(() => {
                parser = new MessageParser({mode: "static"});
            });

            it("should ignore numbers", () => {
                var p = parser.parsePayload(0, "123");
                assert.deepEqual(p, { payload: "123" });
            });

            it("should ignore text", () => {
                var p = parser.parsePayload(0, "lorem ipsum");
                assert.deepEqual(p, { payload: "lorem ipsum" });
            });

            it("should be possible to change filed", () => {
                parser = new MessageParser({mode: "static", static_filed: "xxx"});

                var p = parser.parsePayload(0, "lorem ipsum");
                assert.deepEqual(p, { xxx: "lorem ipsum" });
            });

        });
    });

    describe('parse', () => {

        before(() => {
            parser = new MessageParser({});
        });

        it('should skip empty topic', () => {
            var p = parser.parse(0, "", "123");
            assert.isNull(p);
        });

        it('should parse topic', () => {
            var p = parser.parse(0, "a/b/c", "123");
            assert.equal(p.name, "a");
            assert.deepEqual(p.tags, { topic: "a/b/c", tp0: "a", tp1: "b", tp2: "c" });
        });

        it('should parse payload', () => {
            var p = parser.parse(0, "a/b/c", "123");
            assert.deepEqual(p.values, { value: 123 });
        });
    });
});



