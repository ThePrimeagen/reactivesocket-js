'use strict';

var metadata = require('./metadata');

module.exports = {
    encodePayload: require('./encodePayload'),
    getErrorFrame: require('./getErrorFrame'),
    getFrameHeader: require('./getFrameHeader'),
    getReqResFrame: require('./getReqResFrame'),
    getReqStreamFrame: require('./getReqStreamFrame'),
    getResponseFrame: require('./getResponseFrame'),
    getSetupFrame: require('./getSetupFrame'),
    parseFrame: require('./parseFrame'),

    // boolean operators on frames.
    isCompleted: require('./isCompleted'),
    isValidFrameType: require('./isFrameValidType'),

    // Metadata setting
    flagMetadata: metadata.flagMetadata,
    hasMetadata: metadata.hasMetadata
};

/**
 * @param {Number} streamId The Stream ID.
 * @param {Object} payload The payload.
 *
 * @returns {Buffer} The fnf frame.
 *
function getFireNForgetFrame(streamId, payload) {
    LOG.debug({streamId: streamId, payload: payload},
              'getFireNForgetFrame: entering');

    var flags = FLAGS.NONE;

    if (payload.metadata) {
        flags |= FLAGS.METADATA;
    }

    var payloadBuf = encodePayload(payload);
    var frameHeaderBuf = getFrameHeader(payloadBuf.length,
                                        TYPES.REQUEST_FNF, flags,
                                        streamId);

    var buf = Buffer.concat([frameHeaderBuf, payloadBuf]);
    LOG.debug({frame: buf, length: buf.length}, 'getFireNForgetFrame: exiting');
    return buf;
}



function getChannelFrame(streamId, initReqNum, payload) {
    LOG.debug({
        streamId: streamId,
        initReqNum: initReqNum,
        payload: payload
    }, 'getChannelFrame: entering');

    var flags = FLAGS.NONE;

    if (payload.metadata) {
        flags |= FLAGS.METADATA;
    }

    if (initReqNum) {
        flags |= FLAGS.REQUEST_N_PRESENT;
    }

    var payloadBuf = encodePayload(payload);
    var frameHeaderBuf;

    if (initReqNum) {
        var initReqNumBuf;
        initReqNumBuf = new Buffer(4);
        initReqNumBuf.writeUInt32BE(initReqNum);
        frameHeaderBuf = getFrameHeader(payloadBuf.length +
                                        initReqNumBuf.length,
                                        TYPES.REQUEST_CHANNEL, flags,
                                        streamId);
        frameHeaderBuf = Buffer.concat([frameHeaderBuf, initReqNumBuf]);


    } else {
        frameHeaderBuf = getFrameHeader(payloadBuf.length,
                                        TYPES.REQUEST_CHANNEL, flags,
                                        streamId);
    }

    var buf = Buffer.concat([frameHeaderBuf, payloadBuf]);
    LOG.debug({frame: buf}, 'getChannelFrame: exiting');
    return buf;
}

/**
 * @param {Number} initReqNum The initila number of requests.
 * @param {Object} payload The payload.
 * @param {Number} streamId The Stream ID.
 *
 * @returns {Buffer} The encoded subscription frame.
 *
function getSubscriptionFrame(initReqNum, payload, streamId) {
    return getStreamableFrame(initReqNum, payload, streamId,
                              TYPES.REQUEST_SUB);
}

/**
 * @param {Number} initReqNum The initila number of requests.
 * @param {Object} payload The payload.
 * @param {Number} streamId The Stream ID.
 *
 * @returns {Buffer} The encoded request stream frame.
 *
function getRequestStreamFrame(initReqNum, payload, streamId) {
    return getStreamableFrame(initReqNum, payload, streamId,
                              TYPES.REQUEST_STREAM);
}

// Internal
function getStreamableFrame(initReqNum, payload, streamId, type) {
    LOG.debug({
        initReqNum: initReqNum, payload: payload, streamId: streamId, type: type
    }, 'getStreamableFrame: entering');
    var payloadBuf = encodePayload(payload);

    var flags = FLAGS.NONE;

    if (payload.metadata) {
        flags |= FLAGS.METADATA;
    }

    var frameHeaderBuf = getFrameHeader(payloadBuf.length, type, flags,
                                        streamId);
    var initReqNumBuf = new Buffer(4);
    initReqNumBuf.writeUInt32BE(initReqNum, 0);

    var buf = Buffer.concat([frameHeaderBuf, initReqNumBuf, payloadBuf]);

    LOG.debug({frame: buf}, 'getStreamableFrame: exiting');
    return buf;
}


/**
/// Mainline
var ws = new WebSocket('ws://127.0.0.1:8888');
var ReactiveSocket = require('...');
ws.on('open', function open() {
    var rs = new ReactiveSocket(ws, ...);
});

var setupFrame = getSetupFrame(12345678, 87654321, {
    metadata: 'UTF-8',
    data: 'UTF-8'
});

var fireNForgetFrame = getFireNForgetFrame(2, {
    metadata: 'hello',
    data: 'steve'
});

//var channelFrame = getChannelFrame(2, 128, {
//metadata: 'hello',
//data: 'steve!'
//});
//var reqResFrame = getReqResFrame(2, {
//metadata: 'foobar',
//data: 'Hello Steve!'
//});

//var subFrame = getSubscriptionFrame(10, {
//metadata: 'subscribe!',
//data: 'hello steve!'
//}, 2);

//var reqStreamFrame = getRequestStreamFrame(10, {
//metadata: 'subscribe!',
//data: 'hello steve!'
//}, 2);

ws.on('open', function open() {
    LOG.info('opened ws');
    ws.send(setupFrame, {binary: true}, function (err) {
        LOG.info({err: err}, 'sent setup');
        //ws.send(reqResFrame, {binary: true}, function (e2) {
        //ws.send(subFrame, {binary: true}, function (e2) {
        //ws.send(reqStreamFrame, {binary: true}, function (e2) {
        //ws.send(channelFrame, {binary: true}, function (e2) {
        ws.send(fireNForgetFrame, {binary: true}, function (e2) {
            LOG.info({err: e2}, 'sent data');
        });
    });
});

ws.on('close', function () {
    console.log('closed');
});

var msgCount = 0;
ws.on('message', function (msg) {
    console.log('raw msg', msg);
    console.log('count', msgCount++);
    var frame = parse(msg, 0);
    console.log(frame);
    console.log('data', frame.payload.data);
    console.log('metadata', frame.payload.metadata);
});
*/
