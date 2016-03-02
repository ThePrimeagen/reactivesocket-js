'use strict';

var addPayload = require('./addPayload');

var TYPES = require('./../../lib/protocol/constants').TYPES;

var RES_DATA = JSON.stringify({
    data: 'looks good'
});
var RES_META = 'RESPONSE';

module.exports = {
    RES_DATA: RES_DATA,
    RES_META: RES_META,

    responseFrame: responseFrame(),
    responseFrameWithData: addPayload(responseFrame(), {
        data: RES_DATA
    }),
    responseFrameWithMeta: addPayload(responseFrame(), {
        data: RES_DATA,
        metadata: RES_META
    })
};

function responseFrame() {
    var reqResBuffer = new Buffer(12).fill(0);

    // 12 bytes of data (0xc)
    reqResBuffer.writeUInt32BE(0xc, 0); // 4 bytes of data
    reqResBuffer.writeUInt16BE(TYPES.RESPONSE, 4);

    // Stream Id
    reqResBuffer.writeUInt32BE(0x00000004, 8);

    return reqResBuffer;
}
