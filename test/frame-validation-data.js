var VERSION = require('./../lib/protocol/support/version');
var FLAGS = require('./../lib/protocol/support/flags');
var blankSetupBuffer = new Buffer(24);

blankSetupBuffer.writeUInt32BE(0x00000000, 0); // No Payload
blankSetupBuffer.writeUInt32BE(0x00010000, 4); // type setup, no flags
blankSetupBuffer.writeUInt32BE(0x00000000, 8); // streamId 0
blankSetupBuffer.writeUInt32BE(VERSION & 0xFFFFFFFF, 12); // streamId 0
blankSetupBuffer.writeUInt32BE(0x0000003FF, 16); // time between keep alive frames,
                                            // 1023ms
blankSetupBuffer.writeUInt32BE(0x000000FFF, 20); // max lifetime, 4095ms
// No data or mimetype

module.exports = {
    blankSetupBuffer: blankSetupBuffer,
    mutators: {
        setLeaseFlag: setLeaseFlag
    }
};

function setLeaseFlag(buffer, lease) {
    setFlag(buffer, FLAGS.LEASE);
}

// The setFlag function will set the flag to true / false at position (LSb)
// example:
// typeAndFlags: 0x00 00 00 00
// flag: true
// position: 0x0200
// out: 0x00 00 02 00
function setFlag(buffer, position) {
    var typeAndFlags = buffer.readUInt32BE(4);

    // Invert value to use XOR as flag setter
    buffer.writeUInt32BE(typeAndFlags | (0x1 << position), 4);
}
