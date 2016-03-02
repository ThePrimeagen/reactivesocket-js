'use strict';

var addPayload = require('./addPayload');

var TYPES = require('./../../lib/protocol/constants').TYPES;

var REQ_RES_DATA = JSON.stringify({
    arg1: 'yes',
    arg2: 'no'
});
var REQ_RES_META = 'Some Request Response Meta';

module.exports = {
    REQ_RES_DATA: REQ_RES_DATA,
    REQ_RES_META: REQ_RES_META,

    reqResFrame: reqTypeFrame(TYPES.REQUEST_RESPONSE),
    reqResFrameWithData: addPayload(reqTypeFrame(TYPES.REQUEST_RESPONSE), {
        data: REQ_RES_DATA
    }),
    reqResFrameWithMeta: addPayload(reqTypeFrame(TYPES.REQUEST_RESPONSE), {
        data: REQ_RES_DATA,
        metadata: REQ_RES_META
    }),

    reqStreamFrame: reqTypeFrame(TYPES.REQUEST_STREAM),
    reqStreamFrameWithData: addPayload(reqTypeFrame(TYPES.REQUEST_STREAM), {
        data: REQ_RES_DATA
    }),
    reqStreamFrameWithMeta: addPayload(reqTypeFrame(TYPES.REQUEST_STREAM), {
        data: REQ_RES_DATA,
        metadata: REQ_RES_META
    })
};

function reqTypeFrame(requestType) {
    var reqResBuffer = new Buffer(12).fill(0);

    // 12 bytes of data (0xc)
    reqResBuffer.writeUInt32BE(0xc, 0); // 4 bytes of data
    reqResBuffer.writeUInt16BE(requestType, 4);

    // Stream Id
    reqResBuffer.writeUInt32BE(0x00000004, 8);

    return reqResBuffer;
}
