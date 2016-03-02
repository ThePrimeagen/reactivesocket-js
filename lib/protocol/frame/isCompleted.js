var CONSTANTS = require('./../constants');
var COMPLETE = CONSTANTS.FLAGS.COMPLETE;
/**
 * takes in a frame and checks the header for the completed flag
 * @private
 */
module.exports = function isCompleted(frame) {
    return frame.header.flags & COMPLETE;
};
