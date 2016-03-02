'use strict';

var CONSTANTS = require('./../constants');
var LOG = require('./../../defaultLogger');

var getFrameHeader = require('./getFrameHeader');
var encodePayload = require('./encodePayload');
var metadata = require('./metadata');

var FLAGS = CONSTANTS.FLAGS;
var TYPES = CONSTANTS.TYPES;

/**
 * @param {number} streamId -
 * @param {number} initialN -
 * @param {object} payload The payload of the frame.
 * @returns {buffer} The encoded frame.
 * @private
 */
function getReqStreamFrame(streamId, initialN, payload) {
    LOG.debug({streamId: streamId,
              initialN: initialN,
              payload: payload},
              'getRequestStreamFrame: entering');

    var payloadBuf = encodePayload(payload);
    var flags = FLAGS.NONE;
    var headerBuf = getFrameHeader(payloadBuf.length,
                                   TYPES.REQUEST_STREAM,
                                   flags, streamId);

    // Writes the initial n into the buffer.
    buf.writeUInt32BE(initialN);

    // Attach the metadata flag if there is a metadata payload
    if (payload && payload.metadata) {
        metadata.flagMetadata(headerBuf);
    }

    var buf = Buffer.concat([headerBuf, payloadBuf]);

    LOG.debug({reqStreamFrame: buf}, 'returning req stream frame');
    return buf;
}

module.exports = getReqStreamFrame;
