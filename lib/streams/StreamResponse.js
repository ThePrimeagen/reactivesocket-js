'use strict';

/**
 * @constructor
 * @param {ReactiveServer} server -
 * @param {Duplex} stream -
 * @param {Number} streamId -
 * @returns {undefined}
 */
var StreamResponse = function StreamResponse(server, stream, streamId) {
    this._server = server;
    this._stream = stream;
    this._streamId = streamId;
    this._hasCompleted = false;
};

module.exports = StreamResponse;

/**
 * Respond to the previous request
 * @param {String} data -
 * @param {String} metadata -
 * @returns {undefined}
 */
StreamResponse.prototype.respond = function respond(isCompleted, data,
                                                    metadata) {

    if (this._hasCompleted) {
        throw new Error('A stream response can only complete once.');
    }

    this._hasCompleted = isCompleted;
    this._server._respond(this._stream, this._streamId, {
        data: data,
        metadata: metadata
    }, isCompleted);
};
